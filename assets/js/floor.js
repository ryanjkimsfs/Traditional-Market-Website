/* =============================================================================
 * MarketMesh · floor.js — the stall plan.
 *
 * The plan is drawn on the market's REAL outline: the OSM footprint is
 * projected to metres, rotated so its long axis runs across the page, and
 * scaled to the canvas. So the shape, the proportions and the length scale are
 * the market's own. Individual stall positions are not published anywhere, so
 * stalls are placed along that real outline by zone, and the UI says so.
 *
 *   MM.Floor.render(hostEl, marketId, { selected, onSelect, compact })
 * ========================================================================== */
(function (global) {
  'use strict';

  var MM = global.MM;
  var D = MM.data;
  var esc = MM.dom.esc;
  var t = MM.t;
  var pick = MM.pick;

  var VB_W = 1000, VB_H = 520, PAD = 46;

  /* --------------------------------------------------------- geometry ---- */
  function toMetres(ring) {
    var lat0 = ring.reduce(function (s, p) { return s + p[0]; }, 0) / ring.length;
    var lng0 = ring.reduce(function (s, p) { return s + p[1]; }, 0) / ring.length;
    var mPerLat = 110540, mPerLng = 111320 * Math.cos(lat0 * Math.PI / 180);
    return ring.map(function (p) {
      return [(p[1] - lng0) * mPerLng, (p[0] - lat0) * mPerLat];
    });
  }

  /* Principal axis, so the market's long side lies horizontally on the page. */
  function principalAngle(pts) {
    var n = pts.length;
    var mx = pts.reduce(function (s, p) { return s + p[0]; }, 0) / n;
    var my = pts.reduce(function (s, p) { return s + p[1]; }, 0) / n;
    var sxx = 0, syy = 0, sxy = 0;
    pts.forEach(function (p) {
      var dx = p[0] - mx, dy = p[1] - my;
      sxx += dx * dx; syy += dy * dy; sxy += dx * dy;
    });
    return 0.5 * Math.atan2(2 * sxy, sxx - syy);
  }

  function rotate(pts, a) {
    var c = Math.cos(-a), s = Math.sin(-a);
    return pts.map(function (p) { return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; });
  }

  function bbox(pts) {
    var xs = pts.map(function (p) { return p[0]; });
    var ys = pts.map(function (p) { return p[1]; });
    return {
      minX: Math.min.apply(null, xs), maxX: Math.max.apply(null, xs),
      minY: Math.min.apply(null, ys), maxY: Math.max.apply(null, ys)
    };
  }

  /* A straight strip for markets that are an open alley, not an enclosure. */
  function stripRing(lengthM, widthM) {
    var L = lengthM / 2, W = widthM / 2;
    return [[-L, -W], [L, -W], [L, W], [-L, W]];
  }

  function buildPlan(market, layout) {
    var metres, realLengthM;
    var ring = D.footprints[market.id];

    if (ring) {
      metres = rotate(toMetres(ring), principalAngle(toMetres(ring)));
    } else {
      metres = stripRing(layout.lengthM || 300, layout.widthM || 14);
    }

    var b = bbox(metres);
    var wM = b.maxX - b.minX, hM = b.maxY - b.minY;
    realLengthM = Math.round(wM);

    var scale = Math.min((VB_W - PAD * 2) / wM, (VB_H - PAD * 2) / hM);
    var offX = (VB_W - wM * scale) / 2 - b.minX * scale;
    var offY = (VB_H - hM * scale) / 2 - b.minY * scale;

    var pts = metres.map(function (p) {
      return [p[0] * scale + offX, VB_H - (p[1] * scale + offY)];  // flip Y for SVG
    });

    var pb = bbox(pts);
    return {
      pts: pts,
      box: pb,
      scale: scale,
      realLengthM: realLengthM,
      realWidthM: Math.round(hM),
      midY: (pb.minY + pb.maxY) / 2
    };
  }

  /* ------------------------------------------------- stalls into zones --- */
  function assignZones(market, layout) {
    var stores = D.storesOfMarket(market.id).slice();
    var used = {};
    var zones = layout.zones.map(function (z) {
      var mine = stores.filter(function (s) {
        return !used[s.id] && z.trades.indexOf(s.cat) !== -1;
      });
      mine.forEach(function (s) { used[s.id] = true; });
      return { def: z, stores: mine };
    });
    // Anything unmatched joins the last zone rather than vanishing.
    var leftovers = stores.filter(function (s) { return !used[s.id]; });
    if (leftovers.length) zones[zones.length - 1].stores =
      zones[zones.length - 1].stores.concat(leftovers);
    return zones.filter(function (z) { return z.stores.length; });
  }

  /* ------------------------------------------------------------ render --- */
  MM.Floor = {
    render: function (host, marketId, opts) {
      var o = opts || {};
      var market = D.marketById[marketId];
      var layout = D.layouts[marketId];
      if (!host || !market || !layout) return null;

      var plan = buildPlan(market, layout);
      var zones = assignZones(market, layout);
      var ring = D.footprints[marketId];

      var aisleH = Math.max(26, (plan.box.maxY - plan.box.minY) * 0.2);
      var rowH = Math.max(34, ((plan.box.maxY - plan.box.minY) - aisleH) / 2 - 10);
      var spineY = plan.midY;
      var xStart = plan.box.minX + 16;
      var xEnd = plan.box.maxX - 16;
      var span = xEnd - xStart;

      // How many units to draw: enough to read as a market, never more than the
      // market really has, and capped so the plan stays legible.
      var registered = zones.reduce(function (n, z) { return n + z.stores.length; }, 0) || 1;
      var target = Math.max(registered, Math.min(34, Math.round((market.stalls || registered) / 8)));
      zones.forEach(function (z) {
        z.slots = Math.max(z.stores.length, Math.round(target * (z.stores.length / registered)));
      });
      var totalStalls = zones.reduce(function (n, z) { return n + z.slots; }, 0) || 1;
      var svg = [];

      svg.push('<defs><clipPath id="fp-clip-' + esc(marketId) + '"><polygon points="' +
        plan.pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') +
        '"/></clipPath></defs>');

      // the real outline
      svg.push('<polygon class="fp-outline" points="' +
        plan.pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>');

      // the aisle down the long axis
      svg.push('<rect class="fp-aisle" x="' + xStart + '" y="' + (spineY - aisleH / 2) +
        '" width="' + span + '" height="' + aisleH + '" clip-path="url(#fp-clip-' + esc(marketId) + ')"/>');
      svg.push('<text class="fp-aisle-label" x="' + (xStart + span / 2) + '" y="' + (spineY + 4) +
        '" text-anchor="middle">' + esc(MM.i18n.lang === 'ko' ? '중앙 통로' : 'MAIN AISLE') + '</text>');

      // zones, sized by how many stalls each holds
      var cursor = xStart;
      var placed = [];
      zones.forEach(function (zone, zi) {
        var w = span * (zone.slots / totalStalls);
        var zx = cursor;
        cursor += w;

        svg.push('<rect class="fp-zone" x="' + zx.toFixed(1) + '" y="' + (plan.box.minY + 6) +
          '" width="' + Math.max(0, w - 6).toFixed(1) + '" height="' + (plan.box.maxY - plan.box.minY - 12) +
          '" rx="10" clip-path="url(#fp-clip-' + esc(marketId) + ')" style="--zi:' + zi + '"/>');
        svg.push('<text class="fp-zone-label" x="' + (zx + 8).toFixed(1) + '" y="' + (plan.box.minY + 24) + '">' +
          esc(pick(zone.def)) + (zone.def.count ? ' · ' + zone.def.count + (MM.i18n.lang === 'ko' ? '개 점포' : ' stalls') : '') +
          '</text>');

        // A real market has far more stalls than MarketMesh has onboarded, so
        // the rest of the row is drawn as unregistered units rather than
        // leaving the plan looking like a two-shop market.
        var per = Math.max(zone.stores.length, Math.round(zone.slots || zone.stores.length));
        var slotW = per ? (w - 10) / Math.ceil(per / 2) : 0;
        var units = zone.stores.slice();
        while (units.length < per) units.push(null);

        units.forEach(function (store, i) {
          var top = i % 2 === 0;
          var col = Math.floor(i / 2);
          if (!store) {
            var gx = zx + 4 + col * slotW;
            var gw = Math.max(24, slotW - 6);
            var gy = top ? spineY - aisleH / 2 - rowH - 2 : spineY + aisleH / 2 + 2;
            svg.push('<rect class="fp-ghost" x="' + gx.toFixed(1) + '" y="' + gy.toFixed(1) +
              '" width="' + gw.toFixed(1) + '" height="' + rowH.toFixed(1) + '" rx="7"/>');
            return;
          }
          var sx = zx + 4 + col * slotW;
          var sw = Math.max(30, slotW - 6);
          var sy = top ? spineY - aisleH / 2 - rowH - 2 : spineY + aisleH / 2 + 2;
          var cat = D.categoryById[store.cat] || { color: '#857e70', emoji: '🏪' };
          var f = MM.freshness(store);
          var tone = f.tone === 'fresh' ? '#1f6b45' : f.tone === 'ok' ? '#bc8410'
                   : f.tone === 'stale' ? '#dc3226' : '#b9b2a4';
          var on = store.id === o.selected;

          placed.push(store.id);
          svg.push(
            '<g class="fp-unit' + (on ? ' is-on' : '') + '" data-store="' + esc(store.id) + '" ' +
              'tabindex="0" role="button" aria-label="' + esc(pick(store) + ' ' + store.stall) + '">' +
              '<rect x="' + sx.toFixed(1) + '" y="' + sy.toFixed(1) + '" width="' + sw.toFixed(1) +
                '" height="' + rowH.toFixed(1) + '" rx="7" fill="' + cat.color + '22" stroke="' + cat.color + '"/>' +
              (store.camera ? '<circle class="fp-live" cx="' + (sx + sw - 9).toFixed(1) + '" cy="' + (sy + 9).toFixed(1) +
                '" r="4" fill="#dc3226"/>' : '<circle cx="' + (sx + sw - 9).toFixed(1) + '" cy="' + (sy + 9).toFixed(1) +
                '" r="4" fill="' + tone + '"/>') +
              '<text class="fp-stall-no" x="' + (sx + 7).toFixed(1) + '" y="' + (sy + 15).toFixed(1) + '">' +
                cat.emoji + ' ' + esc(store.stall) + '</text>' +
              '<text class="fp-stall-name" x="' + (sx + 7).toFixed(1) + '" y="' + (sy + 32).toFixed(1) + '">' +
                esc(pick(store).slice(0, Math.max(4, Math.floor(sw / 12)))) + '</text>' +
              (rowH > 52 ? '<text class="fp-stall-sub" x="' + (sx + 7).toFixed(1) + '" y="' + (sy + 48).toFixed(1) + '">' +
                (store.camera ? esc(t('live.badge')) : esc(f.tone === 'none' ? t('photo.none') : f.relative)) + '</text>' : '') +
            '</g>');
        });
      });

      // entrances, drawn on the ends of the aisle
      (layout.entrances || []).forEach(function (en) {
        var x = en.at === 'end' ? plan.box.maxX : en.at === 'side-a' ? (plan.box.minX + plan.box.maxX) / 2 : plan.box.minX;
        var y = en.at === 'side-a' ? plan.box.minY - 6 : spineY;
        var anchor = en.at === 'end' ? 'end' : en.at === 'side-a' ? 'middle' : 'start';
        svg.push('<g class="fp-entrance">' +
          '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="7"/>' +
          '<text x="' + (en.at === 'end' ? x - 12 : en.at === 'side-a' ? x : x + 12).toFixed(1) + '" y="' +
            (en.at === 'side-a' ? y - 10 : y - 12).toFixed(1) + '" text-anchor="' + anchor + '">' +
            esc(pick(en)) + '</text></g>');
      });

      // facilities sit along the aisle at their published-ish position
      (layout.facilities || []).forEach(function (fac) {
        var x = xStart + span * (fac.at || 0.5);
        svg.push('<g class="fp-fac"><rect x="' + (x - 34).toFixed(1) + '" y="' + (spineY - 11) +
          '" width="68" height="22" rx="6"/>' +
          '<text x="' + x.toFixed(1) + '" y="' + (spineY + 4) + '" text-anchor="middle">' + esc(fac.ko) + '</text></g>');
      });

      // a scale bar in real metres, because the plan is drawn to the real outline
      var barM = plan.realLengthM > 300 ? 50 : plan.realLengthM > 120 ? 20 : 10;
      var barPx = barM * plan.scale;
      svg.push('<g class="fp-scale"><line x1="' + xStart + '" y1="' + (plan.box.maxY + 22) +
        '" x2="' + (xStart + barPx).toFixed(1) + '" y2="' + (plan.box.maxY + 22) + '"/>' +
        '<text x="' + (xStart + barPx + 8).toFixed(1) + '" y="' + (plan.box.maxY + 26) + '">' + barM + ' m</text></g>');

      host.innerHTML =
        '<figure class="floorplan' + (o.compact ? ' floorplan--compact' : '') + '">' +
          '<figcaption class="floorplan__head">' +
            '<div>' +
              '<span class="kicker">' + esc(t('map.floor')) + '</span>' +
              '<h3>' + esc(pick(market)) + '</h3>' +
            '</div>' +
            '<div class="floorplan__facts">' +
              '<span>' + (ring ? esc(MM.i18n.lang === 'ko' ? '실제 외곽선' : 'real outline') : esc(MM.i18n.lang === 'ko' ? '골목형' : 'open alley')) + '</span>' +
              '<span>' + (MM.i18n.lang === 'ko' ? '길이 약 ' : 'about ') + plan.realLengthM + ' m</span>' +
              '<span>' + placed.length + (MM.i18n.lang === 'ko' ? '개 점포 등록' : ' stalls onboarded') + '</span>' +
            '</div>' +
          '</figcaption>' +
          '<div class="floorplan__canvas">' +
            '<svg viewBox="0 0 ' + VB_W + ' ' + VB_H + '" role="img" ' +
              'aria-label="' + esc(pick(market) + ' ' + t('map.floor')) + '">' + svg.join('') + '</svg>' +
          '</div>' +
          '<p class="floorplan__note muted small">' +
            (ring
              ? esc(MM.i18n.lang === 'ko'
                  ? '시장 외곽선과 길이는 OpenStreetMap에 기록된 실제 값입니다. 개별 점포의 자리는 공개 자료가 없어 구역 안에서 예시로 배치했습니다.'
                  : 'The outline and scale are the market’s real ones from OpenStreetMap. Individual stall positions are not published anywhere, so they are placed illustratively inside their zone.')
              : esc(pick(layout.note))) +
            (layout.sourced
              ? ' ' + esc(MM.i18n.lang === 'ko' ? '구역 이름은 시장이 쓰는 이름입니다.' : 'Zone names are the market’s own.')
              : ' ' + esc(pick(layout.note))) +
          '</p>' +
        '</figure>';

      var svgEl = host.querySelector('svg');
      MM.dom.qsa('.fp-unit', svgEl).forEach(function (g) {
        var id = g.getAttribute('data-store');
        var fire = function () {
          MM.dom.qsa('.fp-unit', svgEl).forEach(function (x) { x.classList.toggle('is-on', x === g); });
          if (o.onSelect) o.onSelect(id);
        };
        g.addEventListener('click', fire);
        g.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); }
        });
      });

      return {
        select: function (id) {
          MM.dom.qsa('.fp-unit', svgEl).forEach(function (x) {
            x.classList.toggle('is-on', x.getAttribute('data-store') === id);
          });
        }
      };
    }
  };
})(window);
