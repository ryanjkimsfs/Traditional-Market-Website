/* =============================================================================
 * MarketMesh · home.js — the landing page: live spotlight, region finder,
 * freshest counter photos, AI picks, market directory.
 * ========================================================================== */
(function (global) {
  'use strict';

  var MM = global.MM;
  var D = MM.data;
  var esc = MM.dom.esc;
  var t = MM.t;
  var pick = MM.pick;
  var $ = function (id) { return document.getElementById(id); };

  MM.ui.shell('home');

  /* The hero is a scroll-driven stage now; cinema.js owns its motion. */
  if (MM.hero) MM.hero();

  var clock = $('heroClock');
  if (clock) {
    var tickClock = function () { clock.textContent = MM.fmt.stamp(new Date()); };
    tickClock();
    setInterval(tickClock, 1000);
  }

  /* ------------------------------------------------------------------ stats */
  var liveStores = D.stores.filter(function (s) { return !!s.camera; });
  var detected = D.products.filter(function (p) { return p.conf > 0; });

  $('heroStats').innerHTML = [
    { n: D.markets.length, k: 'home.stat.markets' },
    { n: D.stores.length, k: 'home.stat.stores' },
    { n: liveStores.length, k: 'home.stat.cams' },
    { n: detected.length, k: 'home.stat.items' }
  ].map(function (s) {
    return '<div class="stat"><b>' + s.n + '</b><span>' + esc(t(s.k)) + '</span></div>';
  }).join('');

  /* --------------------------------------------------------- hero spotlight */
  var heroViewer = null;
  var spotlightId = MM.storage.get('spotlight', liveStores[0].id);
  if (!D.storeById[spotlightId] || !D.storeById[spotlightId].camera) spotlightId = liveStores[0].id;

  function paintSpotlight(id) {
    spotlightId = id;
    MM.storage.set('spotlight', id);
    var store = D.storeById[id];
    if (heroViewer) heroViewer.destroy();
    heroViewer = MM.Viewer.create($('heroViewer'), store, {
      onSelect: function (uid) {
        var p = D.productByUid(uid);
        if (p) MM.cart.add(uid, 1);
      }
    });
    MM.dom.qsa('#liveSwitcher button').forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-store') === id);
    });
  }

  $('liveSwitcher').innerHTML = liveStores.slice(0, 6).map(function (s) {
    return '<button data-store="' + esc(s.id) + '">● ' + esc(pick(s)) +
      ' <span class="muted small">' + esc(pick(D.marketById[s.marketId])) + '</span></button>';
  }).join('');
  MM.dom.qsa('#liveSwitcher button').forEach(function (b) {
    b.addEventListener('click', function () { paintSpotlight(b.getAttribute('data-store')); });
  });
  paintSpotlight(spotlightId);

  /* ------------------------------------------------------- region cascade  */
  var sel = {
    country: $('fCountry'), state: $('fState'), city: $('fCity'), market: $('fMarket')
  };

  function fill(node, rows, selected) {
    node.innerHTML = rows.map(function (r) {
      return '<option value="' + esc(r.id) + '"' + (r.id === selected ? ' selected' : '') + '>' +
        esc(r.label) + '</option>';
    }).join('');
  }

  function refreshCascade(keep) {
    var countryId = sel.country.value || D.regions.countries[0].id;
    fill(sel.country, D.regions.countries.map(function (c) {
      return { id: c.id, label: c.flag + ' ' + pick(c) };
    }), countryId);

    var states = D.regions.states.filter(function (s) { return s.country === countryId; });
    var stateId = (keep && keep.state) || sel.state.value;
    if (!states.some(function (s) { return s.id === stateId; })) stateId = states[0].id;
    fill(sel.state, states.map(function (s) { return { id: s.id, label: pick(s) }; }), stateId);

    var cities = D.regions.cities.filter(function (c) { return c.state === stateId; });
    var cityId = (keep && keep.city) || sel.city.value;
    if (!cities.some(function (c) { return c.id === cityId; })) cityId = cities[0].id;
    fill(sel.city, cities.map(function (c) { return { id: c.id, label: pick(c) }; }), cityId);

    var markets = D.markets.filter(function (m) { return m.city === cityId; });
    var marketId = (keep && keep.market) || sel.market.value;
    if (!markets.some(function (m) { return m.id === marketId; })) marketId = markets[0] && markets[0].id;
    fill(sel.market, markets.map(function (m) {
      return { id: m.id, label: pick(m) + ' · ' + m.storeCount + (MM.i18n.lang === 'ko' ? '개 점포' : ' stalls') };
    }), marketId);

    paintFinderPreview(marketId);
  }

  function paintFinderPreview(marketId) {
    var m = D.marketById[marketId];
    var host = $('finderPreview');
    if (!m) { host.innerHTML = '<div class="empty">' + esc(t('common.none')) + '</div>'; return; }
    var stores = D.storesOfMarket(m.id);
    host.innerHTML =
      '<div class="panel">' +
        '<div class="mhead mhead--sm">' +
          '<img class="mhead__img" src="assets/img/stalls/thumb/' + esc(m.hero) + '.jpg" alt="">' +
          '<div class="mhead__body">' +
            '<h3 style="margin-bottom:2px">' + esc(pick(m)) + '</h3>' +
            '<p class="muted small" style="margin-bottom:8px">' + esc(pick(m.addr)) + ' · ' + esc(pick(m.hours)) + '</p>' +
            '<p class="small" style="margin-bottom:10px">' + esc(pick(m.blurb)) + '</p>' +
            '<div class="row small muted">' +
              '<span>🏪 ' + m.storeCount + '</span>' +
              '<span>🎥 ' + m.liveCount + '</span>' +
              '<span>🚗 ' + esc(pick(m.parking)) + '</span>' +
              '<span>🚇 ' + esc(pick(m.transit)) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="mhead__side">' +
            '<a class="btn btn--primary" href="' + MM.url.market(m.id) + '">' + esc(t('home.go')) + '</a>' +
            '<a class="btn btn--ghost" href="tel:' + esc(m.phone) + '">📞 ' + esc(m.phone) + '</a>' +
            '<a class="btn btn--ghost" href="' + MM.url.map(m.id) + '">🗺 ' + esc(t('map.title')) + '</a>' +
          '</div>' +
        '</div>' +
        '<div class="hr"></div>' +
        '<div class="grid-stores">' +
          stores.slice(0, 4).map(function (s) { return MM.ui.storeCard(s, { hideMarket: true, compact: true }); }).join('') +
        '</div>' +
      '</div>';
  }

  ['country', 'state', 'city'].forEach(function (k) {
    sel[k].addEventListener('change', function () { refreshCascade(); });
  });
  sel.market.addEventListener('change', function () { paintFinderPreview(sel.market.value); });
  $('fGo').addEventListener('click', function () {
    if (sel.market.value) location.href = MM.url.market(sel.market.value);
  });
  refreshCascade({ state: 'incheon', city: 'seohae-gu', market: 'gajwa' });

  /* ---------------------------------------------------------- live + fresh */
  $('liveGrid').innerHTML = liveStores.slice(0, 8).map(function (s) {
    return MM.ui.storeCard(s);
  }).join('');

  var photoOnly = D.stores
    .filter(function (s) { return !s.camera && s.photoAgeMin != null; })
    .sort(function (a, b) { return a.photoAgeMin - b.photoAgeMin; });
  $('freshGrid').innerHTML = photoOnly.slice(0, 8).map(function (s) {
    return MM.ui.storeCard(s);
  }).join('');

  /* ------------------------------------------------------------- ai picks  */
  MM.recommend.render($('picksHost'), { context: 'home', limit: 6 });

  /* -------------------------------------------------------------- markets  */
  $('marketGrid').innerHTML = D.markets.map(function (m) {
    return '<article class="scard">' +
      '<a class="scard__media" href="' + MM.url.market(m.id) + '">' +
        '<img loading="lazy" src="assets/img/stalls/thumb/' + esc(m.hero) + '.jpg" alt="' + esc(pick(m)) + '">' +
        (m.liveCount ? '<span class="badge badge--live"><i></i>' + m.liveCount + ' ' + esc(t('live.badge')) + '</span>' : '') +
      '</a>' +
      '<div class="scard__body">' +
        '<div class="scard__title"><a href="' + MM.url.market(m.id) + '">' + esc(pick(m)) + '</a>' +
          (m.since ? '<span class="muted small">' + (MM.i18n.lang === 'ko' ? '개점 ' : 'est. ') + m.since + '</span>' : '') +
        '</div>' +
        '<div class="muted small">' + esc(pick(m.addr)) + '</div>' +
        '<div class="row small muted"><span>🏪 ' + m.storeCount + '</span><span>🎥 ' + m.liveCount + '</span>' +
          '<span>🕘 ' + esc(pick(m.hours)) + '</span></div>' +
        '<div class="scard__actions">' +
          '<a class="btn btn--sm" href="' + MM.url.market(m.id) + '">' + esc(t('home.go')) + '</a>' +
          '<a class="btn btn--sm btn--ghost" href="' + MM.url.market(m.id) + '#layout" title="' +
            esc(t('map.floor')) + '">🗺</a>' +
        '</div>' +
      '</div>' +
    '</article>';
  }).join('');

  /* ------------------------------------------------------------------ how  */
  $('howSteps').innerHTML = [1, 2, 3, 4].map(function (n) {
    return '<div class="step"><i>' + n + '</i><b>' + esc(t('how.' + n + '.t')) + '</b>' +
      '<span class="muted small">' + esc(t('how.' + n + '.d')) + '</span></div>';
  }).join('');

  /* Most of this page is painted from JS, so the entrance observer has to be
     re-armed after the paint. */
  if (MM.rearmMotion) MM.rearmMotion();
})(window);
