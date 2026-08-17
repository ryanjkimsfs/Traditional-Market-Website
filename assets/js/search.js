/* =============================================================================
 * MarketMesh · search.js — one query across products, stalls and markets.
 * Korean initial-consonant (초성) queries like "ㅅㄱ" are handled in core.js.
 * ========================================================================== */
(function (global) {
  'use strict';

  var MM = global.MM;
  var D = MM.data;
  var esc = MM.dom.esc;
  var t = MM.t;
  var pick = MM.pick;
  var $ = function (id) { return document.getElementById(id); };

  MM.ui.shell();

  var q = MM.url.param('q') || '';
  var scope = 'all';
  var res = MM.search.query(q, 120);

  if (q) {
    MM.search.recent.push(q);
    MM.activity.log('search', q);
  }
  document.title = 'MarketMesh · ' + (q || t('search.title'));

  $('crumbs').innerHTML = '<a href="index.html">' + esc(t('nav.home')) + '</a> › <b>' + esc(t('search.title')) + '</b>';
  $('searchTitle').textContent = q ? '“' + q + '”' : t('search.title');

  var total = res.products.length + res.stores.length + res.markets.length;
  $('searchMeta').textContent = total + ' ' + t('search.results') +
    (/^[ㄱ-ㅎ\s]+$/.test(q) ? (MM.i18n.lang === 'ko' ? ' · 초성 검색' : ' · initial-consonant search') : '');

  /* ------------------------------------------------------------ scope chips */
  var SCOPES = [
    { id: 'all', label: t('common.all'), n: total },
    { id: 'products', label: t('search.inProducts'), n: res.products.length },
    { id: 'stores', label: t('search.inStores'), n: res.stores.length },
    { id: 'markets', label: t('search.inMarkets'), n: res.markets.length }
  ];
  function paintChips() {
    $('scopeChips').innerHTML = SCOPES.map(function (s) {
      return '<button data-scope="' + s.id + '"' + (scope === s.id ? ' class="is-on"' : '') + '>' +
        esc(s.label) + ' <span class="muted">' + s.n + '</span></button>';
    }).join('');
    MM.dom.qsa('#scopeChips button').forEach(function (b) {
      b.addEventListener('click', function () { scope = b.getAttribute('data-scope'); paintChips(); paint(); });
    });
  }

  /* ---------------------------------------------------------------- results */
  function group(titleKey, count, body) {
    return '<section class="resultgroup"><h2>' + esc(t(titleKey)) +
      ' <span>' + count + '</span></h2>' + body + '</section>';
  }

  function paint() {
    if (!q) {
      $('results').innerHTML = '<div class="empty">' + esc(t('search.suggest')) + ': ' +
        MM.search.suggestions().map(function (s) {
          return '<a href="' + MM.url.search(s) + '" style="text-decoration:underline">' + esc(s) + '</a>';
        }).join(' · ') + '</div>';
      return;
    }
    if (!total) {
      $('results').innerHTML =
        '<div class="empty"><b>' + esc(t('common.none')) + '</b><br>' +
        esc(t('search.suggest')) + ': ' + MM.search.suggestions().map(function (s) {
          return '<a href="' + MM.url.search(s) + '" style="text-decoration:underline">' + esc(s) + '</a>';
        }).join(' · ') + '</div>';
      return;
    }

    var html = '';

    if ((scope === 'all' || scope === 'products') && res.products.length) {
      html += group('search.inProducts', res.products.length,
        '<div class="panel">' + res.products.slice(0, 40).map(function (p) {
          return MM.ui.productRow(p, { showStore: true });
        }).join('') + '</div>');
    }
    if ((scope === 'all' || scope === 'stores') && res.stores.length) {
      html += group('search.inStores', res.stores.length,
        '<div class="grid-stores">' + res.stores.slice(0, 12).map(function (s) {
          return MM.ui.storeCard(s);
        }).join('') + '</div>');
    }
    if ((scope === 'all' || scope === 'markets') && res.markets.length) {
      html += group('search.inMarkets', res.markets.length,
        '<div class="grid-stores">' + res.markets.map(function (m) {
          return '<article class="scard">' +
            '<a class="scard__media" href="' + MM.url.market(m.id) + '">' +
              '<img loading="lazy" src="assets/img/stalls/thumb/' + esc(m.hero) + '.jpg" alt="">' +
              (m.liveCount ? '<span class="badge badge--live"><i></i>' + m.liveCount + '</span>' : '') +
            '</a>' +
            '<div class="scard__body">' +
              '<div class="scard__title"><a href="' + MM.url.market(m.id) + '">' + esc(pick(m)) + '</a></div>' +
              '<div class="muted small">' + esc(pick(m.addr)) + '</div>' +
              '<div class="scard__actions"><a class="btn btn--sm" href="' + MM.url.market(m.id) + '">' +
                esc(t('home.go')) + '</a>' +
                '<a class="btn btn--sm btn--ghost" href="' + MM.url.market(m.id) + '#layout">🗺 ' +
                esc(t('map.floor')) + '</a></div>' +
            '</div></article>';
        }).join('') + '</div>');
    }

    $('results').innerHTML = html || '<div class="empty">' + esc(t('common.none')) + '</div>';
  }

  paintChips();
  paint();

  MM.recommend.render($('picksHost'), {
    context: 'search',
    limit: 4,
    title: MM.i18n.lang === 'ko' ? '이 검색과 어울리는 상품' : 'Related to this search'
  });
})(window);
