/* =============================================================================
 * MarketMesh · store.js — stall-by-stall view: the big zoomable camera (or the
 * timestamped photo), the AI product list wired to the detection boxes, and the
 * contact block (call / text / directions) the spec asks for.
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

  var storeId = MM.url.param('s');
  var store = D.storeById[storeId];
  if (!store) { store = D.stores[0]; storeId = store.id; }
  var market = D.marketById[store.marketId];

  MM.activity.log('store', store.id);
  document.title = 'MarketMesh · ' + pick(store) + ' (' + pick(market) + ')';

  /* ------------------------------------------------------------- viewer -- */
  var viewer = MM.Viewer.create($('viewerHost'), store, {
    onHover: function (uid) { hotRow(uid); },
    onSelect: function (uid) {
      var row = document.querySelector('.prow[data-uid="' + uid + '"]');
      if (row) {
        row.scrollIntoView({ block: 'center', behavior: 'smooth' });
        hotRow(uid);
      }
    }
  });

  function hotRow(uid) {
    MM.dom.qsa('.prow').forEach(function (r) {
      r.classList.toggle('is-hot', !!uid && r.getAttribute('data-uid') === uid);
    });
  }

  /* ------------------------------------------------------- product list -- */
  var detected = store.products.filter(function (p) { return p.conf > 0; });
  var aiPriced = store.products.filter(function (p) { return p.priceSource === 'ai'; });

  $('detectMeta').textContent = store.camera
    ? t('detect.updated') + ' ' + MM.fmt.ago(1) + ' · ' + store.camera.id
    : (store.photoAgeMin != null ? t('detect.updated') + ' ' + MM.fmt.ago(store.photoAgeMin) : '');

  $('detectNote').innerHTML = detected.length
    ? esc(detected.length + ' ' + t('detect.count')) +
      ' · ' + esc(t('detect.conf')) + ' ' +
      (detected.reduce(function (s, p) { return s + p.conf; }, 0) / detected.length * 100).toFixed(1) + '%' +
      (aiPriced.length
        ? '<br><span class="tag tag--ai">' + esc(t('detect.priceAi')) + '</span> ' + esc(t('detect.priceAiHelp'))
        : '')
    : esc(t('store.noCamera'));

  $('productList').innerHTML = store.products.length
    ? store.products.map(function (p) { return MM.ui.productRow(p); }).join('')
    : '<div class="empty">' + esc(t('common.none')) + '</div>';

  MM.dom.qsa('#productList .prow').forEach(function (row) {
    var uid = row.getAttribute('data-uid');
    row.addEventListener('mouseenter', function () { viewer.highlight(uid); });
    row.addEventListener('mouseleave', function () { viewer.highlight(null); });
    row.addEventListener('click', function () { MM.activity.log('product', uid); });
  });

  // Deep link: store.html?s=…#gj-apple highlights that item on arrival.
  if (location.hash) {
    var target = document.querySelector('.prow[data-uid="' + store.id + ':' + location.hash.slice(1) + '"]');
    if (target) {
      setTimeout(function () {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        target.classList.add('is-hot');
      }, 350);
    }
  }

  /* ---------------------------------------------------------- side panel -- */
  var PAY_LABEL = { card: 'pay.card', onnuri: 'pay.onnuri', zeropay: 'pay.zeropay', cash: 'pay.cash' };
  var isFav = MM.fav.has(store.id);

  function paintSide() {
    $('sidePanel').innerHTML =
      '<div class="row" style="gap:8px;margin-bottom:4px">' +
        (store.camera
          ? '<span class="chip" style="--chip:#e0342c">🎥 ' + esc(t('live.badge')) + '</span>'
          : store.photo ? '<span class="chip" style="--chip:#4a453b">🖼 ' + esc(t('live.photo')) + '</span>'
          : '<span class="chip" style="--chip:#857e70">' + esc(t('live.none')) + '</span>') +
        MM.ui.catChip(store.cat) +
      '</div>' +
      '<h1 style="font-size:1.7rem;margin:0 0 2px">' + esc(pick(store)) + '</h1>' +
      '<p class="muted small" style="margin-bottom:10px">' +
        esc(store.stall) + ' · <a href="' + MM.url.market(market.id) + '">' + esc(pick(market)) + '</a>' +
        ' · ★ ' + store.rating.toFixed(1) + ' (' + store.reviews + ' ' + esc(t('common.reviews')) + ')</p>' +

      '<div style="margin-bottom:12px">' + MM.ui.photoStamp(store) + '</div>' +
      '<p class="small">' + esc(pick(store.blurb)) + '</p>' +

      '<div class="panel__head" style="margin-top:14px"><h3>' + esc(t('store.contact')) + '</h3></div>' +
      '<div class="contactbar">' +
        '<a class="btn btn--primary" href="tel:' + esc(store.phone) + '">📞 ' + esc(t('store.call')) + '</a>' +
        '<a class="btn" href="sms:' + esc(store.phone) + '">💬 ' + esc(t('store.sms')) + '</a>' +
        '<a class="btn btn--ghost" target="_blank" rel="noopener" ' +
          'href="https://map.kakao.com/link/to/' + encodeURIComponent(market.ko + ' ' + store.ko) + ',' + market.lat + ',' + market.lng + '">' +
          '🧭 ' + esc(t('store.route')) + '</a>' +
        '<button class="btn btn--ghost" id="shareBtn">🔗 ' + esc(t('store.share')) + '</button>' +
      '</div>' +
      '<button class="btn btn--block" id="favBtn" style="margin-top:8px">' +
        (isFav ? '★ ' + esc(t('store.faved')) : '☆ ' + esc(t('store.fav'))) + '</button>' +

      '<div class="hr"></div>' +
      '<div class="panel__head"><h3>' + esc(t('store.info')) + '</h3></div>' +
      '<dl class="deflist">' +
        '<div><dt>' + esc(t('common.owner')) + '</dt><dd>' + esc(pick(store.owner)) + ' · ' + esc(t('common.since')) + ' ' + store.since + '</dd></div>' +
        '<div><dt>' + esc(t('common.hours')) + '</dt><dd>' + esc(pick(store.hours)) + '</dd></div>' +
        '<div><dt>' + esc(t('common.closed')) + '</dt><dd>' + esc(pick(store.closedDays)) + '</dd></div>' +
        '<div><dt>' + esc(t('common.phone')) + '</dt><dd><a href="tel:' + esc(store.phone) + '">' + esc(store.phone) + '</a></dd></div>' +
        '<div><dt>' + esc(t('common.delivery')) + '</dt><dd>' + esc(pick(store.delivery)) + '</dd></div>' +
        '<div><dt>' + esc(t('common.pay')) + '</dt><dd>' +
          store.pay.map(function (k) { return esc(t(PAY_LABEL[k] || k)); }).join(' · ') + '</dd></div>' +
        '<div><dt>' + esc(t('common.address')) + '</dt><dd>' + esc(pick(market.addr)) + '</dd></div>' +
        (store.camera
          ? '<div><dt>' + esc(t('live.badge')) + '</dt><dd>' + esc(store.camera.id) + ' · ' +
            esc(store.camera.res) + ' · ' + store.camera.fps + 'fps' + (store.camera.ptz ? ' · PTZ' : '') + '</dd></div>'
          : '') +
      '</dl>';

    var share = $('shareBtn');
    if (share) share.addEventListener('click', function () {
      var url = location.href;
      if (navigator.share) {
        navigator.share({ title: pick(store), url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () { MM.ui.toast(t('toast.copied'), '🔗'); });
      }
    });

    var fav = $('favBtn');
    if (fav) fav.addEventListener('click', function () {
      isFav = MM.fav.toggle(store.id);
      paintSide();
    });
  }
  paintSide();

  /* ------------------------------------------------------------- crumbs -- */
  $('crumbs').innerHTML =
    '<a href="index.html">' + esc(t('nav.home')) + '</a> ›' +
    ' <a href="' + MM.url.market(market.id) + '">' + esc(pick(market)) + '</a> ›' +
    ' <b>' + esc(pick(store)) + '</b>';

  /* ------------------------------------------------------------ reviews -- */
  /* Deterministic sample reviews: seeded from the stall id so a given stall
   * always shows the same ones. */
  var REVIEW_POOL = {
    ko: [
      { n: '이**', s: 5, txt: '카메라로 보고 갔는데 화면이랑 똑같았어요. 헛걸음 안 해서 좋네요.' },
      { n: '박**', s: 5, txt: '사진 찍힌 시간이 나와서 믿고 주문했습니다. 물건 상태 좋아요.' },
      { n: '최**', s: 4, txt: '가격표가 화면에서 잘 안 보여서 전화로 확인했어요. 사장님 친절하십니다.' },
      { n: '정**', s: 5, txt: '확대해서 보니 상처 난 과일인지까지 보이더라고요. 신기합니다.' },
      { n: '김**', s: 4, txt: '주문한 것보다 조금 더 담아주셨어요. 다음에도 여기서 살게요.' },
      { n: '한**', s: 5, txt: '아이랑 화면 보면서 고르는 재미가 있어요.' }
    ],
    en: [
      { n: 'J. Lee', s: 5, txt: 'Watched the camera before heading out, and the counter looked exactly the same.' },
      { n: 'S. Park', s: 5, txt: 'The photo timestamp made me trust the order. Produce arrived in great shape.' },
      { n: 'H. Choi', s: 4, txt: 'Price tags were hard to read on screen, so I called. Very helpful owner.' },
      { n: 'M. Jung', s: 5, txt: 'Zoomed in far enough to check for bruises. Impressive.' },
      { n: 'D. Kim', s: 4, txt: 'They threw in a little extra. Coming back.' },
      { n: 'Y. Han', s: 5, txt: 'My kid loves picking the fruit off the live view.' }
    ]
  };
  var seed = 0;
  for (var i = 0; i < store.id.length; i++) seed += store.id.charCodeAt(i);
  var pool = REVIEW_POOL[MM.i18n.lang] || REVIEW_POOL.ko;
  $('reviews').innerHTML = [0, 1, 2].map(function (k) {
    var r = pool[(seed + k * 2) % pool.length];
    var daysAgo = 1 + ((seed + k * 5) % 21);
    return '<div class="review">' +
      '<div class="review__head"><b>' + esc(r.n) + '</b>' +
        '<span class="review__stars">' + '★'.repeat(r.s) + '</span>' +
        '<span class="muted">' + MM.fmt.ago(daysAgo * 1440) + '</span></div>' +
      '<div class="small">' + esc(r.txt) + '</div></div>';
  }).join('');

  /* ------------------------------------------------- where this stall is -- */
  $('wherePanelTitle').textContent = MM.i18n.lang === 'ko'
    ? '이 점포 위치 · ' + pick(market)
    : 'Where this stall sits in ' + pick(market);
  $('whereMapLink').href = MM.url.map(market.id);

  MM.Floor.render($('floorHost'), market.id, {
    selected: store.id,
    compact: true,
    onSelect: function (id) {
      if (id !== store.id) location.href = MM.url.store(id);
    }
  });

  /* ------------------------------------------------------- nearby stalls -- */
  $('nearbyTitle').textContent = MM.i18n.lang === 'ko'
    ? pick(market) + ' 다른 점포'
    : 'Other stalls in ' + pick(market);
  $('nearbyGrid').innerHTML = D.storesOfMarket(market.id)
    .filter(function (s) { return s.id !== store.id; })
    .slice(0, 4)
    .map(function (s) { return MM.ui.storeCard(s, { hideMarket: true }); }).join('');

  /* ------------------------------------------------------------ ai picks -- */
  MM.recommend.render($('picksHost'), {
    context: 'store',
    storeId: store.id,
    marketId: market.id,
    limit: 6,
    title: MM.i18n.lang === 'ko' ? '이 매대와 함께 사면 좋은 상품' : 'Goes well with this counter'
  });
})(window);
