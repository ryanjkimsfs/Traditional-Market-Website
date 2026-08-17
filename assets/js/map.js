/* =============================================================================
 * MarketMesh · map.js
 *
 *   1. 지역 지도 — a real slippy map (Leaflet + OSM/CARTO/Esri tiles) with every
 *      market pinned at its verified WGS84 coordinate, deep links out to Naver
 *      Map / KakaoMap / Google Maps, and distance-sorted results from the
 *      browser's geolocation. If Leaflet or the tile servers are unreachable it
 *      falls back to a self-contained canvas coordinate plot rather than
 *      showing an empty grey box.
 *   2. 시장 배치도 — an SVG stall layout for one market, generated from the stall
 *      list, where a camera icon means the counter can be zoomed right here.
 * ========================================================================== */
(function (global) {
  'use strict';

  var MM = global.MM;
  var D = MM.data;
  var esc = MM.dom.esc;
  var t = MM.t;
  var pick = MM.pick;
  var $ = function (id) { return document.getElementById(id); };
  var L = global.L;

  MM.ui.shell('map');

  // Arriving from a market page ("지도에서 보기") should land on that market;
  // arriving cold should show the whole network.
  var deepLinked = !!MM.url.param('m');

  var state = {
    tab: 'region',
    marketId: MM.url.param('m') || MM.storage.get('lastMarket', 'gajwa'),
    storeId: null,
    here: MM.geo.last(),
    query: '',
    base: MM.storage.get('mapBase', 'street')
  };
  if (!D.marketById[state.marketId]) state.marketId = 'gajwa';

  var sideViewer = null;

  $('crumbs').innerHTML = '<a href="index.html">' + esc(t('nav.home')) + '</a> › <b>' + esc(t('map.title')) + '</b>';
  $('mapSub').textContent = MM.i18n.lang === 'ko'
    ? D.markets.length + '개 시장 · ' + D.stores.length + '개 점포 · 핀을 눌러 매대를 미리 보세요.'
    : D.markets.length + ' markets · ' + D.stores.length + ' stalls · tap a pin to preview the counter.';
  $('listTitle').textContent = t('map.nearby');
  $('mapLegend').innerHTML =
    '<div><i style="background:#e0342c"></i>' + esc(MM.i18n.lang === 'ko' ? '실시간 카메라 있음' : 'Has live cameras') + '</div>' +
    '<div><i style="background:#1f6b45"></i>' + esc(MM.i18n.lang === 'ko' ? '사진 등록 시장' : 'Photo-only market') + '</div>' +
    '<div><i style="background:#2f6fb5"></i>' + esc(MM.i18n.lang === 'ko' ? '내 위치' : 'My location') + '</div>';

  /* ====================================================== external map links */
  /* Deep links carry the exact coordinate, so "길찾기" lands on the market
   * itself rather than on a name search that may hit the wrong city. */
  function externalLinks(m) {
    var name = m.ko;
    return {
      naver: 'https://map.naver.com/p/search/' + encodeURIComponent(name) +
             '?c=' + m.lng + ',' + m.lat + ',17,0,0,0,dh',
      kakaoTo: 'https://map.kakao.com/link/to/' + encodeURIComponent(name) + ',' + m.lat + ',' + m.lng,
      kakaoMap: 'https://map.kakao.com/link/map/' + encodeURIComponent(name) + ',' + m.lat + ',' + m.lng,
      google: 'https://www.google.com/maps/search/?api=1&query=' + m.lat + ',' + m.lng
    };
  }

  /* ============================================================ tile layers */
  var BASES = {
    street: {
      ko: '일반', en: 'Street',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    },
    light: {
      ko: '밝게', en: 'Light',
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd', maxZoom: 20
    },
    dark: {
      ko: '어둡게', en: 'Dark',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd', maxZoom: 20
    },
    satellite: {
      ko: '위성', en: 'Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
      maxZoom: 19
    }
  };

  var prefersDark = global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches;
  if (!MM.storage.get('mapBase', null)) state.base = prefersDark ? 'dark' : 'street';

  /* ============================================================== leaflet == */
  var map = null;
  var markerLayer = null;
  var footprintLayer = null;
  var footprints = {};
  var markers = {};
  var meLayer = null;
  var tileLayer = null;
  var tileErrors = 0;
  var usingFallback = false;

  function pinIcon(m, selected, labelUp) {
    var live = m.liveCount > 0;
    var cls = 'pin' + (live ? ' pin--live' : '') + (selected ? ' is-on' : '') +
              (labelUp ? ' pin--labelup' : '');
    return L.divIcon({
      className: 'pinwrap',
      html: '<div class="' + cls + '">' +
              '<span class="pin__count">' + (live ? m.liveCount : m.storeCount) + '</span>' +
              (live ? '<span class="pin__pulse"></span>' : '') +
            '</div>' +
            '<span class="pin__label">' + esc(pick(m)) + '</span>',
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -32]
    });
  }

  function popupHtml(m) {
    var links = externalLinks(m);
    return '<div class="mpop">' +
      '<img src="assets/img/stalls/thumb/' + esc(m.hero) + '.jpg" alt="">' +
      '<div class="mpop__body">' +
        '<b>' + esc(pick(m)) + '</b>' +
        '<span class="mpop__addr">' + esc(pick(m.addr)) + '</span>' +
        '<span class="muted small">🏪 ' + m.storeCount + ' · 🎥 ' + m.liveCount +
          (state.here ? ' · ' + esc(MM.fmt.dist(MM.geo.haversine(state.here, m))) : '') + '</span>' +
        '<div class="mpop__links">' +
          '<a href="' + MM.url.market(m.id) + '">' + esc(t('home.go')) + '</a>' +
          '<a href="tel:' + esc(m.phone) + '">📞</a>' +
          '<a target="_blank" rel="noopener" href="' + links.naver + '">네이버</a>' +
          '<a target="_blank" rel="noopener" href="' + links.kakaoTo + '">카카오 길찾기</a>' +
        '</div>' +
      '</div></div>';
  }

  function setBase(key) {
    if (!map || !BASES[key]) return;
    state.base = key;
    MM.storage.set('mapBase', key);
    if (tileLayer) map.removeLayer(tileLayer);
    var cfg = BASES[key];
    tileLayer = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom || 19,
      subdomains: cfg.subdomains || 'abc',
      crossOrigin: true
    });
    tileLayer.on('tileerror', function () {
      tileErrors++;
      // A handful of misses is normal; a wall of them means no network.
      if (tileErrors > 8 && !usingFallback) useFallback('tiles');
    });
    tileLayer.addTo(map);
    MM.dom.qsa('#baseSwitch button').forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-base') === key);
    });
  }

  function initLeaflet() {
    map = L.map('leafletMap', {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: true,
      worldCopyJump: true
    });

    $('baseSwitch').innerHTML = Object.keys(BASES).map(function (k) {
      return '<button data-base="' + k + '"' + (k === state.base ? ' class="is-on"' : '') + '>' +
        esc(MM.i18n.lang === 'ko' ? BASES[k].ko : BASES[k].en) + '</button>';
    }).join('');
    MM.dom.qsa('#baseSwitch button').forEach(function (b) {
      b.addEventListener('click', function () { setBase(b.getAttribute('data-base')); });
    });

    setBase(state.base);
    footprintLayer = L.layerGroup().addTo(map);
    markerLayer = L.layerGroup().addTo(map);
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    fitAll();        // gives the map a view…
    paintMarkers();  // …which marker label placement depends on

    if (deepLinked && D.marketById[state.marketId]) {
      var m = D.marketById[state.marketId];
      var ring = D.footprints[m.id];
      if (ring) map.fitBounds(L.latLngBounds(ring).pad(0.6), { animate: false });
      else map.setView([m.lat, m.lng], 17, { animate: false });
      paintMarkers();
    }
    paintFootprints();

    map.on('popupopen', function (e) {
      var id = e.popup._marketId;
      if (id) selectMarket(id, { skipFly: true });
    });

    // Label placement and footprint visibility are both zoom-dependent.
    map.on('zoomend', function () { paintMarkers(); paintFootprints(); syncLabels(); });
    syncLabels();
  }

  function paintMarkers() {
    if (!markerLayer) return;
    markerLayer.clearLayers();
    markers = {};
    var allowed = filterMarkets();

    // Seoul's markets sit close together; when two pins land within ~74px of
    // each other on screen, the second one wears its label above instead.
    // Screen projection only works once the map has a view, so before that
    // (first paint) every label just sits below.
    var placed = [];
    var canProject = !!map._loaded;
    allowed.forEach(function (m) {
      var labelUp = false;
      if (canProject) {
        var pt = map.latLngToLayerPoint([m.lat, m.lng]);
        labelUp = placed.some(function (q) {
          return Math.abs(q.x - pt.x) < 74 && Math.abs(q.y - pt.y) < 46;
        });
        placed.push({ x: pt.x, y: pt.y });
      }
      var mk = L.marker([m.lat, m.lng], {
        icon: pinIcon(m, m.id === state.marketId, labelUp),
        title: pick(m),
        riseOnHover: true
      });
      var popup = L.popup({ closeButton: true, maxWidth: 300, className: 'mpopup' }).setContent(popupHtml(m));
      popup._marketId = m.id;
      mk.bindPopup(popup);
      mk.on('click', function () { selectMarket(m.id, { skipFly: true }); });
      mk.addTo(markerLayer);
      markers[m.id] = mk;
    });
  }

  /* Zoomed out over the whole capital area the eight labels overlap each other,
   * so below city zoom only the pins show — plus the selected market, which
   * keeps its name at every zoom. */
  function syncLabels() {
    if (!map) return;
    map.getContainer().classList.toggle('no-pin-labels', map.getZoom() < 11);
  }

  /* The traced OSM outline of each market. Drawn only from zoom 14 up, where
   * the difference between "this pin" and "these two blocks" is visible. */
  function paintFootprints() {
    if (!footprintLayer) return;
    footprintLayer.clearLayers();
    footprints = {};
    if (map.getZoom() < 14) return;

    filterMarkets().forEach(function (m) {
      var ring = D.footprints[m.id];
      if (!ring) return;
      var poly = L.polygon(ring, {
        color: m.liveCount ? '#e0342c' : '#1f6b45',
        weight: 2,
        opacity: 0.9,
        fillColor: m.liveCount ? '#e0342c' : '#1f6b45',
        fillOpacity: m.id === state.marketId ? 0.18 : 0.08,
        interactive: true
      });
      poly.bindTooltip(pick(m) + ' · ' + (MM.i18n.lang === 'ko' ? '시장 구역 (OSM)' : 'market area (OSM)'),
                       { sticky: true });
      poly.on('click', function () { selectMarket(m.id, { skipFly: true }); });
      poly.addTo(footprintLayer);
      footprints[m.id] = poly;
    });
  }

  function fitAll() {
    if (!map) { fallbackFitAll(); return; }
    var pts = filterMarkets().map(function (m) { return [m.lat, m.lng]; });
    if (state.here) pts.push([state.here.lat, state.here.lng]);
    if (!pts.length) return;
    map.fitBounds(L.latLngBounds(pts).pad(0.18), { animate: false });
  }

  function flyTo(m, zoom) {
    if (!map) { fallbackFocus(m); return; }
    // With a traced outline we can frame the whole market instead of guessing
    // a zoom level around its centre point.
    var ring = D.footprints[m.id];
    if (ring && !zoom) {
      map.flyToBounds(L.latLngBounds(ring).pad(0.55), { duration: 0.7 });
      return;
    }
    map.flyTo([m.lat, m.lng], zoom || Math.max(map.getZoom(), 15), { duration: 0.7 });
  }

  /* -------------------------------------------------------- my location -- */
  function paintMe() {
    if (!map || !state.here) return;
    if (meLayer) map.removeLayer(meLayer);
    meLayer = L.layerGroup();
    L.circleMarker([state.here.lat, state.here.lng], {
      radius: 7, color: '#fff', weight: 2.5, fillColor: '#2f6fb5', fillOpacity: 1
    }).bindTooltip(MM.i18n.lang === 'ko' ? '내 위치' : 'My location').addTo(meLayer);
    [1000, 3000, 5000].forEach(function (r) {
      L.circle([state.here.lat, state.here.lng], {
        radius: r, color: '#2f6fb5', weight: 1, opacity: 0.45,
        dashArray: '4 5', fill: false
      }).addTo(meLayer);
    });
    meLayer.addTo(map);
  }

  /* ============================================== offline canvas fallback == */
  /* Same data, no tiles: markets plotted on a graticule from their real
   * coordinates, so the page still works on a plane or behind a firewall. */
  var canvas = $('mapCanvas');
  var ctx = canvas.getContext('2d');
  var view = { lat: 37.60, lng: 126.82, scale: 900 };
  var pins = [];

  function useFallback(reason) {
    usingFallback = true;
    if (map) { map.remove(); map = null; }
    $('leafletMap').hidden = true;
    canvas.hidden = false;
    $('baseSwitch').hidden = true;
    var note = $('mapNote');
    note.hidden = false;
    var why = reason === 'lib' ? '지도 라이브러리 없음' : reason === 'init' ? '지도 초기화 오류' : '네트워크 확인';
    note.textContent = MM.i18n.lang === 'ko'
      ? '좌표 지도로 표시합니다 (' + why + ')'
      : 'Showing the offline coordinate map (' + reason + ')';
    fallbackFitAll();
  }

  function fallbackFitAll() {
    var lats = D.markets.map(function (m) { return m.lat; });
    var lngs = D.markets.map(function (m) { return m.lng; });
    if (state.here) { lats.push(state.here.lat); lngs.push(state.here.lng); }
    var minLat = Math.min.apply(null, lats), maxLat = Math.max.apply(null, lats);
    var minLng = Math.min.apply(null, lngs), maxLng = Math.max.apply(null, lngs);
    view.lat = (minLat + maxLat) / 2;
    view.lng = (minLng + maxLng) / 2;
    var rect = canvas.getBoundingClientRect();
    var latSpan = Math.max(maxLat - minLat, 0.02) * 1.35;
    var lngSpan = Math.max(maxLng - minLng, 0.02) * 1.35;
    var cos = Math.cos(view.lat * Math.PI / 180);
    view.scale = Math.min(rect.height / latSpan, rect.width / (lngSpan * cos));
    fallbackDraw();
  }

  function fallbackFocus(m) {
    view.lat = m.lat; view.lng = m.lng;
    view.scale = Math.max(view.scale, 6000);
    fallbackDraw();
  }

  function project(lat, lng) {
    var rect = canvas.getBoundingClientRect();
    var cos = Math.cos(view.lat * Math.PI / 180);
    return {
      x: rect.width / 2 + (lng - view.lng) * view.scale * cos,
      y: rect.height / 2 - (lat - view.lat) * view.scale
    };
  }
  function unproject(x, y) {
    var rect = canvas.getBoundingClientRect();
    var cos = Math.cos(view.lat * Math.PI / 180);
    return {
      lng: view.lng + (x - rect.width / 2) / (view.scale * cos),
      lat: view.lat - (y - rect.height / 2) / view.scale
    };
  }
  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function fallbackDraw() {
    if (!usingFallback) return;
    var rect = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var ink = css('--ink') || '#1c1a15';
    var line = css('--line') || '#e6dfd2';
    var paper = css('--paper-2') || '#f2ede4';
    var font = css('--font') || 'sans-serif';

    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, rect.width, rect.height);

    var step = view.scale > 4000 ? 0.01 : view.scale > 1500 ? 0.05 : 0.1;
    var tl = unproject(0, 0), br = unproject(rect.width, rect.height);
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    ctx.font = '10px ' + font;
    ctx.fillStyle = css('--muted') || '#857e70';
    for (var la = Math.floor(br.lat / step) * step; la <= tl.lat; la += step) {
      var py = project(la, view.lng).y;
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(rect.width, py); ctx.stroke();
      ctx.fillText(la.toFixed(2) + '°N', 6, py - 4);
    }
    for (var lo = Math.floor(tl.lng / step) * step; lo <= br.lng; lo += step) {
      var px = project(view.lat, lo).x;
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, rect.height); ctx.stroke();
      ctx.fillText(lo.toFixed(2) + '°E', px + 4, rect.height - 6);
    }

    if (state.here) {
      var c = project(state.here.lat, state.here.lng);
      [1, 3, 5, 10].forEach(function (km) {
        var r = km / 111 * view.scale;
        if (r < 12 || r > Math.max(rect.width, rect.height)) return;
        ctx.beginPath();
        ctx.setLineDash([4, 5]);
        ctx.strokeStyle = 'rgba(47,111,181,.45)';
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(47,111,181,.75)';
        ctx.fillText(km + 'km', c.x + r - 22, c.y - 4);
      });
      ctx.beginPath();
      ctx.fillStyle = '#2f6fb5';
      ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
    }

    pins = [];
    var labelFlip = 0;
    var filtered = filterMarkets();
    D.markets.forEach(function (m) {
      var p = project(m.lat, m.lng);
      var dim = filtered.indexOf(m) === -1;
      var isSel = m.id === state.marketId;
      var r = 9 + Math.min(9, m.storeCount * 0.7);
      pins.push({ market: m, x: p.x, y: p.y, r: r + 6 });
      ctx.globalAlpha = dim ? 0.25 : 1;
      if (m.liveCount) {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(224,52,44,.16)';
        ctx.arc(p.x, p.y, r + 9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.fillStyle = m.liveCount ? '#e0342c' : '#1f6b45';
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = isSel ? 4 : 2;
      ctx.strokeStyle = isSel ? ink : '#fff';
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '700 11px ' + font;
      ctx.textAlign = 'center';
      ctx.fillText(String(m.liveCount || m.storeCount), p.x, p.y + 4);

      ctx.font = '700 12px ' + font;
      var label = pick(m);
      if (state.here) label += ' · ' + MM.fmt.dist(MM.geo.haversine(state.here, m));
      var crowded = pins.some(function (other) {
        return other.market !== m && Math.hypot(other.x - p.x, other.y - p.y) < 90;
      });
      var ly = (crowded && labelFlip++ % 2) ? p.y - r - 9 : p.y + r + 16;
      ctx.lineWidth = 3;
      ctx.strokeStyle = paper;
      ctx.strokeText(label, p.x, ly);
      ctx.fillStyle = ink;
      ctx.fillText(label, p.x, ly);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    });

    var barKm = view.scale > 3000 ? 1 : view.scale > 1200 ? 5 : 10;
    var barPx = barKm / 111 * view.scale;
    ctx.strokeStyle = ink; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(14, rect.height - 22); ctx.lineTo(14 + barPx, rect.height - 22);
    ctx.moveTo(14, rect.height - 27); ctx.lineTo(14, rect.height - 17);
    ctx.moveTo(14 + barPx, rect.height - 27); ctx.lineTo(14 + barPx, rect.height - 17);
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.font = '600 11px ' + font;
    ctx.fillText(barKm + ' km', 18 + barPx, rect.height - 18);
  }

  /* fallback interactions ---------------------------------------------- */
  var dragging = false, lastX = 0, lastY = 0, moved = 0;
  canvas.addEventListener('mousedown', function (e) {
    dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY;
    canvas.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX, dy = e.clientY - lastY;
    moved += Math.abs(dx) + Math.abs(dy);
    lastX = e.clientX; lastY = e.clientY;
    var cos = Math.cos(view.lat * Math.PI / 180);
    view.lng -= dx / (view.scale * cos);
    view.lat += dy / view.scale;
    fallbackDraw();
  });
  window.addEventListener('mouseup', function () { dragging = false; canvas.style.cursor = ''; });
  canvas.addEventListener('click', function (e) {
    if (moved > 6) return;
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left, y = e.clientY - rect.top;
    for (var i = 0; i < pins.length; i++) {
      if (Math.hypot(pins[i].x - x, pins[i].y - y) <= pins[i].r) { selectMarket(pins[i].market.id); return; }
    }
  });
  canvas.addEventListener('mousemove', function (e) {
    if (dragging) return;
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left, y = e.clientY - rect.top;
    canvas.style.cursor = pins.some(function (p) { return Math.hypot(p.x - x, p.y - y) <= p.r; }) ? 'pointer' : 'grab';
  });
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    view.scale = Math.max(120, Math.min(60000, view.scale * (e.deltaY < 0 ? 1.2 : 1 / 1.2)));
    fallbackDraw();
  }, { passive: false });

  /* ========================================================= shared controls */
  MM.dom.qsa('[data-mzoom]').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-mzoom');
      if (map) {
        if (k === 'in') map.zoomIn();
        else if (k === 'out') map.zoomOut();
        else fitAll();
        return;
      }
      if (k === 'reset') { fallbackFitAll(); return; }
      view.scale = Math.max(120, Math.min(60000, view.scale * (k === 'in' ? 1.4 : 1 / 1.4)));
      fallbackDraw();
    });
  });

  $('mapSearch').addEventListener('input', function (e) {
    state.query = e.target.value.trim();
    if (map) { paintMarkers(); paintFootprints(); fitAll(); } else fallbackDraw();
    paintList();
    paintSearchNote();
  });

  /* A query matches a market if the market, one of its stalls, or one of its
   * products matches. An empty map reads as broken, so a query that matches
   * nothing shows everything and says so instead. */
  function filterMarkets() {
    state.noMatch = false;
    if (!state.query) return D.markets.slice();
    var res = MM.search.query(state.query, 40);
    var ids = {};
    res.markets.forEach(function (m) { ids[m.id] = true; });
    res.stores.forEach(function (s) { ids[s.marketId] = true; });
    res.products.forEach(function (p) { ids[p.marketId] = true; });
    var hit = D.markets.filter(function (m) { return ids[m.id]; });
    if (hit.length) return hit;
    state.noMatch = true;
    return D.markets.slice();
  }

  function paintSearchNote() {
    if (usingFallback) return;               // the fallback note owns that slot
    var note = $('mapNote');
    if (state.noMatch) {
      note.hidden = false;
      note.textContent = MM.i18n.lang === 'ko'
        ? '“' + state.query + '” 검색 결과가 없어 전체 시장을 표시합니다'
        : 'No match for “' + state.query + '”. Showing every market';
    } else {
      note.hidden = true;
    }
  }

  $('locateBtn').addEventListener('click', function () {
    var btn = $('locateBtn');
    var label = btn.querySelector('span');
    btn.disabled = true;
    label.textContent = t('map.locating');
    MM.geo.locate(function (here, err) {
      btn.disabled = false;
      label.textContent = t('map.locate');
      if (err) { MM.ui.toast(t('map.denied'), '⚠️'); return; }
      state.here = here;
      if (map) { paintMe(); paintMarkers(); fitAll(); } else fallbackFitAll();
      paintList();
      paintSide();
      var nearest = MM.geo.marketsByDistance(here)[0];
      MM.ui.toast(MM.i18n.lang === 'ko'
        ? '가장 가까운 시장: ' + pick(nearest.market) + ' (' + MM.fmt.dist(nearest.km) + ')'
        : 'Nearest market: ' + pick(nearest.market) + ' (' + MM.fmt.dist(nearest.km) + ')', '📍');
    });
  });

  window.addEventListener('resize', function () { if (state.tab === 'region') fallbackDraw(); });

  /* ============================================================= side card == */
  function selectMarket(id, opts) {
    state.marketId = id;
    state.storeId = null;
    MM.storage.set('lastMarket', id);
    var m = D.marketById[id];
    if (map) {
      paintMarkers();
      paintFootprints();
      if (!(opts && opts.skipFly)) flyTo(m);
    } else {
      fallbackDraw();
    }
    paintSide();
    paintList();
    paintFloor();
  }

  function selectStore(id) {
    state.storeId = id;
    paintSide();
    paintFloor();
  }

  function paintSide() {
    var m = D.marketById[state.marketId];
    var host = $('sideCard');
    var links = externalLinks(m);
    var store = state.storeId ? D.storeById[state.storeId] : null;
    if (!store) {
      var mine = D.storesOfMarket(m.id);
      store = mine.filter(function (s) { return s.camera; })[0] || mine[0];
    }

    host.innerHTML =
      '<div class="panel__head"><h3>' + esc(pick(m)) + '</h3>' +
        (state.here ? '<span class="spacer"></span><span class="chip" style="--chip:#2f6fb5">' +
          esc(MM.fmt.dist(MM.geo.haversine(state.here, m))) + '</span>' : '') + '</div>' +
      '<p class="muted small" style="margin-bottom:6px">' + esc(pick(m.addr)) + '<br>' +
        esc(pick(m.hours)) + ' · ' + esc(pick(m.transit)) + '</p>' +
      '<div class="coordline">' +
        '<code>' + m.lat.toFixed(5) + ', ' + m.lng.toFixed(5) + '</code>' +
        '<button class="btn btn--sm btn--ghost" data-copy="' + m.lat.toFixed(5) + ', ' + m.lng.toFixed(5) + '">' +
          esc(MM.i18n.lang === 'ko' ? '복사' : 'Copy') + '</button>' +
      '</div>' +
      (m.coordSource ? '<p class="muted small" style="margin:-4px 0 10px">📍 ' + esc(m.coordSource) + '</p>' : '') +
      '<div class="maplinks">' +
        '<a class="btn btn--sm" target="_blank" rel="noopener" href="' + links.naver + '">네이버 지도</a>' +
        '<a class="btn btn--sm" target="_blank" rel="noopener" href="' + links.kakaoTo + '">카카오 길찾기</a>' +
        '<a class="btn btn--sm btn--ghost" target="_blank" rel="noopener" href="' + links.google + '">Google</a>' +
      '</div>' +
      (store ? '<div id="sideViewer" style="margin:12px 0 8px"></div>' +
        '<div class="row" style="justify-content:space-between">' +
          '<div><b>' + esc(pick(store)) + '</b><br><span class="muted small">' + esc(store.stall) + '</span></div>' +
          MM.ui.liveBadge(store, { inline: true }) +
        '</div>' : '') +
      '<div class="contactbar" style="margin-top:12px">' +
        (store ? '<a class="btn btn--primary" href="' + MM.url.store(store.id) + '">' + esc(t('store.enter')) + '</a>' : '') +
        '<a class="btn" href="tel:' + esc(store ? store.phone : m.phone) + '">📞 ' + esc(t('store.call')) + '</a>' +
        '<a class="btn btn--ghost" href="' + MM.url.market(m.id) + '">🏪 ' + esc(t('market.stores')) + '</a>' +
      '</div>';

    var copyBtn = host.querySelector('[data-copy]');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      var text = copyBtn.getAttribute('data-copy');
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () {
        MM.ui.toast(t('toast.copied'), '📋');
      });
    });

    if (store) {
      if (sideViewer) sideViewer.destroy();
      sideViewer = MM.Viewer.create($('sideViewer'), store, { size: 'mini' });
    }
  }

  /* ------------------------------------------------------------ market list */
  function paintList() {
    var rows = MM.geo.marketsByDistance(state.here);
    var allowed = filterMarkets();
    rows = rows.filter(function (r) { return allowed.indexOf(r.market) !== -1; });

    $('listTitle').textContent = state.here ? t('map.nearby') : t('nav.markets');
    $('marketList').innerHTML = rows.length ? rows.map(function (r) {
      var m = r.market;
      return '<div class="mrow' + (m.id === state.marketId ? ' is-on' : '') + '" data-market="' + esc(m.id) + '">' +
        '<img loading="lazy" src="assets/img/stalls/thumb/' + esc(m.hero) + '.jpg" alt="">' +
        '<div>' +
          '<b>' + esc(pick(m)) + '</b>' +
          '<span class="muted small">' + esc(pick(m.addr)) + '</span><br>' +
          '<span class="small">🏪 ' + m.storeCount + ' · 🎥 ' + m.liveCount +
            (r.km != null ? ' · <span class="km">' + esc(MM.fmt.dist(r.km)) + '</span>' : '') + '</span>' +
        '</div></div>';
    }).join('') : '<div class="empty">' + esc(t('common.none')) + '</div>';

    MM.dom.qsa('#marketList .mrow').forEach(function (row) {
      row.addEventListener('click', function () {
        var id = row.getAttribute('data-market');
        selectMarket(id);
        var mk = markers[id];
        if (mk) { flyTo(D.marketById[id], 16); mk.openPopup(); }
      });
    });
  }

  /* ============================================================ floor plan == */
  function paintFloorSelect() {
    $('floorMarket').innerHTML = D.markets.map(function (m) {
      return '<option value="' + esc(m.id) + '"' + (m.id === state.marketId ? ' selected' : '') + '>' +
        esc(pick(m)) + '</option>';
    }).join('');
  }
  $('floorMarket').addEventListener('change', function () { selectMarket($('floorMarket').value); });

  function paintFloor() {
    paintFloorSelect();
    var m = D.marketById[state.marketId];
    $('floorHint').textContent = MM.i18n.lang === 'ko'
      ? '점포를 누르면 오른쪽에서 매대를 바로 볼 수 있습니다.'
      : 'Tap a stall to preview its counter on the right.';

    MM.Floor.render($('floorHost'), m.id, {
      selected: state.storeId,
      onSelect: function (id) { selectStore(id); }
    });
  }

  /* ---------------------------------------------------------------- tabs -- */
  function showTab(name) {
    state.tab = name === 'floor' ? 'floor' : 'region';
    MM.dom.qsa('#mapTabs button').forEach(function (x) {
      x.classList.toggle('is-on', x.getAttribute('data-tab') === state.tab);
    });
    var region = state.tab === 'region';
    $('regionFrame').hidden = !region;
    $('floorFrame').hidden = region;
    if (region) {
      if (map) setTimeout(function () { map.invalidateSize(); }, 30);
      else fallbackDraw();
    } else {
      paintFloor();
    }
  }

  MM.dom.qsa('#mapTabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      state.tab = b.getAttribute('data-tab');
      MM.dom.qsa('#mapTabs button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      var region = state.tab === 'region';
      $('regionFrame').hidden = !region;
      $('floorFrame').hidden = region;
      if (region) {
        // Leaflet needs a nudge after its container was display:none.
        if (map) setTimeout(function () { map.invalidateSize(); }, 30);
        else fallbackDraw();
      } else {
        paintFloor();
      }
    });
  });

  /* ---------------------------------------------------------------- boot -- */
  paintSide();
  paintList();
  paintFloorSelect();

  // ?tab=floor links straight to a market's stall layout.
  if (MM.url.param('tab') === 'floor') showTab('floor');

  if (L && typeof L.map === 'function') {
    try {
      initLeaflet();
      if (state.here) paintMe();
    } catch (err) {
      // Don't swallow this: a silent fallback looks like a network problem
      // when it is really a bug in the map code.
      if (global.console) console.error('[MarketMesh] map init failed:', err);
      useFallback('init');
    }
  } else {
    useFallback('lib');
  }
})(window);
