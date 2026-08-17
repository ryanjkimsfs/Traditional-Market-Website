/* =============================================================================
 * MarketMesh · market.js — one market: cascading area filters, the stall grid,
 * and the side preview panel (zoom / pan + "open stall page") from the spec.
 * ========================================================================== */
(function (global) {
  'use strict';

  var MM = global.MM;
  var D = MM.data;
  var esc = MM.dom.esc;
  var t = MM.t;
  var pick = MM.pick;
  var $ = function (id) { return document.getElementById(id); };

  MM.ui.shell('market');

  var marketId = MM.url.param('m') || MM.storage.get('lastMarket', 'gajwa');
  if (!D.marketById[marketId]) marketId = 'gajwa';
  MM.storage.set('lastMarket', marketId);

  var state = {
    cat: 'all',
    sort: MM.storage.get('storeSort', 'recommended'),
    liveOnly: false,
    selected: null
  };
  var previewViewer = null;

  /* ------------------------------------------------------------ market head */
  function paintHead() {
    var m = D.marketById[marketId];

    $('crumbs').innerHTML =
      '<a href="index.html">' + esc(t('nav.home')) + '</a> ›' +
      ' <a href="map.html">' + esc(t('map.title')) + '</a> ›' +
      ' <b>' + esc(pick(m)) + '</b>';

    var mine = D.storesOfMarket(m.id);
    var freshest = mine.filter(function (s) { return s.photoAgeMin != null; })
      .sort(function (a, b) { return a.photoAgeMin - b.photoAgeMin; })[0];

    $('marketHead').innerHTML =
      '<div class="mhead">' +
        '<img class="mhead__img" src="assets/img/stalls/' + esc(m.hero) + '.jpg" alt="">' +
        '<div class="mhead__body">' +
          '<div class="row" style="gap:8px;margin-bottom:6px">' +
            '<h1 style="font-size:clamp(1.5rem,3vw,2.2rem);margin:0">' + esc(pick(m)) + '</h1>' +
            (m.liveCount ? '<span class="chip" style="--chip:#e0342c">🎥 ' + m.liveCount + ' ' + esc(t('live.badge')) + '</span>' : '') +
          '</div>' +
          '<p class="muted" style="margin-bottom:10px">' + esc(pick(m.blurb)) + '</p>' +
          '<dl class="deflist">' +
            '<div><dt>' + esc(t('common.address')) + '</dt><dd>' + esc(pick(m.addr)) + '</dd></div>' +
            '<div><dt>' + esc(t('common.hours')) + '</dt><dd>' + esc(pick(m.hours)) + ' · ' + esc(t('common.closed')) + ' ' + esc(pick(m.closed)) + '</dd></div>' +
            '<div><dt>' + esc(t('common.transit')) + '</dt><dd>' + esc(pick(m.transit)) + ' · ' + esc(pick(m.parking)) + '</dd></div>' +
            '<div><dt>' + esc(m.since ? t('common.since') : t('common.market')) + '</dt><dd>' +
              (m.since ? m.since + ' · ' : '') + m.stalls + (MM.i18n.lang === 'ko' ? '개 점포 등록' : ' stalls registered') + '</dd></div>' +
            (m.coordSource ? '<div><dt>' + (MM.i18n.lang === 'ko' ? '좌표 출처' : 'Coord. source') + '</dt>' +
              '<dd class="muted small">' + esc(m.coordSource) + '</dd></div>' : '') +
          '</dl>' +
          (freshest ? '<div style="margin-top:10px">' + MM.ui.photoStamp(freshest) + '</div>' : '') +
        '</div>' +
        '<div class="mhead__side">' +
          '<a class="btn btn--primary" href="tel:' + esc(m.phone) + '">📞 ' + esc(m.phone) + '</a>' +
          '<a class="btn btn--ghost" href="#layout">🗺 ' + esc(t('map.floor')) + '</a>' +
          '<a class="btn btn--ghost" target="_blank" rel="noopener" ' +
            'href="https://map.kakao.com/link/to/' + encodeURIComponent(m.ko) + ',' + m.lat + ',' + m.lng + '">' +
            '🧭 ' + esc(t('store.route')) + '</a>' +
        '</div>' +
      '</div>';
  }

  /* ------------------------------------------------------- area cascade UI */
  var sel = { country: $('fCountry'), state: $('fState'), city: $('fCity'), market: $('fMarket') };

  function fill(node, rows, selected) {
    node.innerHTML = rows.map(function (r) {
      return '<option value="' + esc(r.id) + '"' + (r.id === selected ? ' selected' : '') + '>' + esc(r.label) + '</option>';
    }).join('');
  }

  function paintCascade() {
    var m = D.marketById[marketId];
    var stateRow = D.regions.cities.filter(function (c) { return c.id === m.city; })[0];
    var stateId = stateRow ? stateRow.state : 'incheon';

    fill(sel.country, D.regions.countries.map(function (c) { return { id: c.id, label: c.flag + ' ' + pick(c) }; }), m.country);
    fill(sel.state, D.regions.states.filter(function (s) { return s.country === m.country; })
      .map(function (s) { return { id: s.id, label: pick(s) }; }), stateId);
    fill(sel.city, D.regions.cities.filter(function (c) { return c.state === sel.state.value; })
      .map(function (c) { return { id: c.id, label: pick(c) }; }), m.city);
    fill(sel.market, D.markets.filter(function (mk) { return mk.city === sel.city.value; })
      .map(function (mk) { return { id: mk.id, label: pick(mk) }; }), marketId);
  }

  sel.state.addEventListener('change', function () {
    var cities = D.regions.cities.filter(function (c) { return c.state === sel.state.value; });
    fill(sel.city, cities.map(function (c) { return { id: c.id, label: pick(c) }; }), cities[0].id);
    sel.city.dispatchEvent(new Event('change'));
  });
  sel.city.addEventListener('change', function () {
    var markets = D.markets.filter(function (mk) { return mk.city === sel.city.value; });
    fill(sel.market, markets.map(function (mk) { return { id: mk.id, label: pick(mk) }; }), markets[0] && markets[0].id);
    if (markets[0]) go(markets[0].id);
  });
  sel.market.addEventListener('change', function () { go(sel.market.value); });

  function go(id) {
    if (!D.marketById[id] || id === marketId) return;
    location.href = MM.url.market(id);
  }

  /* ------------------------------------------------------------- filtering */
  function visibleStores() {
    var list = D.storesOfMarket(marketId);
    if (state.cat !== 'all') list = list.filter(function (s) { return s.cat === state.cat; });
    if (state.liveOnly) list = list.filter(function (s) { return !!s.camera; });

    var byFresh = function (a, b) {
      var av = a.photoAgeMin == null ? 1e9 : a.photoAgeMin;
      var bv = b.photoAgeMin == null ? 1e9 : b.photoAgeMin;
      return av - bv;
    };
    var sorters = {
      recommended: function (a, b) {
        var score = function (s) {
          return (s.camera ? 3 : 0) + (s.photoAgeMin != null && s.photoAgeMin < 120 ? 2 : 0) + s.rating;
        };
        return score(b) - score(a);
      },
      live: function (a, b) { return (b.camera ? 1 : 0) - (a.camera ? 1 : 0) || byFresh(a, b); },
      fresh: byFresh,
      rating: function (a, b) { return b.rating - a.rating; },
      name: function (a, b) { return pick(a).localeCompare(pick(b)); }
    };
    return list.slice().sort(sorters[state.sort] || sorters.recommended);
  }

  function paintChips() {
    var mine = D.storesOfMarket(marketId);
    var cats = [];
    mine.forEach(function (s) { if (cats.indexOf(s.cat) === -1) cats.push(s.cat); });

    $('catChips').innerHTML =
      '<button data-cat="all"' + (state.cat === 'all' ? ' class="is-on"' : '') + '>' + esc(t('common.all')) + '</button>' +
      cats.map(function (c) {
        var cat = D.categoryById[c];
        var n = mine.filter(function (s) { return s.cat === c; }).length;
        return '<button data-cat="' + esc(c) + '"' + (state.cat === c ? ' class="is-on"' : '') + '>' +
          cat.emoji + ' ' + esc(pick(cat)) + ' <span class="muted">' + n + '</span></button>';
      }).join('') +
      '<button data-live="1"' + (state.liveOnly ? ' class="is-on"' : '') + '>🎥 ' + esc(t('market.liveOnly')) + '</button>';

    MM.dom.qsa('#catChips [data-cat]').forEach(function (b) {
      b.addEventListener('click', function () { state.cat = b.getAttribute('data-cat'); paintChips(); paintGrid(); });
    });
    var liveBtn = document.querySelector('#catChips [data-live]');
    if (liveBtn) liveBtn.addEventListener('click', function () {
      state.liveOnly = !state.liveOnly; paintChips(); paintGrid();
    });
  }

  var SORTS = ['recommended', 'live', 'fresh', 'rating', 'name'];
  $('fSort').innerHTML = SORTS.map(function (s) {
    return '<option value="' + s + '"' + (state.sort === s ? ' selected' : '') + '>' + esc(t('sort.' + s)) + '</option>';
  }).join('');
  $('fSort').addEventListener('change', function () {
    state.sort = $('fSort').value;
    MM.storage.set('storeSort', state.sort);
    paintGrid();
  });

  /* ------------------------------------------------------------------ grid */
  function paintGrid() {
    var list = visibleStores();
    $('storeCount').textContent = list.length + (MM.i18n.lang === 'ko' ? '개 점포' : ' stalls') +
      ' · ' + t('market.filterHint');

    $('storeGrid').innerHTML = list.length
      ? list.map(function (s) { return MM.ui.storeCard(s, { hideMarket: true }); }).join('')
      : '<div class="empty">' + esc(t('common.none')) + '</div>';

    // Clicking the card body previews the stall; the links inside it (title,
    // "open stall page", call) still navigate as usual.
    MM.dom.qsa('#storeGrid .scard').forEach(function (card) {
      var id = card.getAttribute('data-store');
      card.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        e.preventDefault();
        select(id, true);
        if (window.innerWidth < 1040) {
          $('previewPanel').scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
      });
    });

    if (list.length && !state.selected) select(list[0].id, false);
  }

  /* --------------------------------------------------------- preview panel */
  function select(storeId, scroll) {
    if (state.selected === storeId) return;
    state.selected = storeId;
    var s = D.storeById[storeId];
    if (!s) return;

    MM.dom.qsa('#storeGrid .scard').forEach(function (c) {
      c.classList.toggle('is-selected', c.getAttribute('data-store') === storeId);
    });

    if (previewViewer) previewViewer.destroy();
    previewViewer = MM.Viewer.create($('previewHost'), s, { size: 'mini' });
    if (floor) floor.select(storeId);

    var m = D.marketById[s.marketId];
    $('previewMeta').innerHTML =
      '<h3 style="margin:12px 0 2px">' + esc(pick(s)) + '</h3>' +
      '<p class="muted small">' + esc(s.stall) + ' · ' + esc(pick(m)) + ' · ★ ' + s.rating.toFixed(1) + '</p>' +
      '<p class="small">' + esc(pick(s.blurb)) + '</p>' +
      '<div class="row small muted" style="margin-bottom:12px">' +
        MM.ui.catChip(s.cat) +
        '<span>🕘 ' + esc(pick(s.hours)) + '</span>' +
        '<span>🚚 ' + esc(pick(s.delivery)) + '</span>' +
      '</div>' +
      '<div class="contactbar">' +
        '<a class="btn btn--primary" href="' + MM.url.store(s.id) + '">' + esc(t('store.enter')) + '</a>' +
        '<a class="btn btn--ghost" href="tel:' + esc(s.phone) + '">📞 ' + esc(t('store.call')) + '</a>' +
      '</div>' +
      (s.products.length
        ? '<div class="hr"></div><h4 class="muted small" style="letter-spacing:.08em;text-transform:uppercase">' +
            esc(t('store.products')) + '</h4>' +
          s.products.slice(0, 3).map(function (p) { return MM.ui.productRow(p); }).join('')
        : '');

    if (scroll) MM.activity.log('store', s.id);
  }

  /* ------------------------------------------------------------ floor plan */
  /* The plan and the stall grid drive each other: picking a stall on the plan
   * previews it, and previewing a stall highlights it on the plan. */
  var floor = null;

  function paintFloorPlan() {
    var m = D.marketById[marketId];
    $('layoutTitle').textContent = MM.i18n.lang === 'ko'
      ? pick(m) + ' 점포 배치'
      : 'Where the stalls sit in ' + pick(m);
    $('layoutSub').textContent = MM.i18n.lang === 'ko'
      ? '점포를 누르면 위쪽 미리보기에서 그 매대를 바로 확인할 수 있습니다.'
      : 'Tap a stall to load its counter in the preview above.';
    $('layoutMapLink').href = MM.url.map(m.id);

    floor = MM.Floor.render($('floorHost'), m.id, {
      selected: state.selected,
      onSelect: function (id) {
        select(id, true);
        $('previewPanel').scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });
  }

  /* ------------------------------------------------------------------ boot */
  paintHead();
  paintCascade();
  paintChips();
  paintGrid();
  paintFloorPlan();

  /* The page grows as JS paints it, so an anchor the browser jumped to during
     parse can end up past the end of the document. Re-aim it once painted. */
  if (location.hash) {
    var anchor = document.querySelector(location.hash);
    if (anchor) requestAnimationFrame(function () {
      requestAnimationFrame(function () { anchor.scrollIntoView({ block: 'start' }); });
    });
  }
  MM.recommend.render($('picksHost'), { context: 'market', marketId: marketId, limit: 6 });
})(window);
