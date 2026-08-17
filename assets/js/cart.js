/* =============================================================================
 * MarketMesh · cart.js — the basket, grouped by stall.
 * A traditional-market order is really several small orders (one per stall), so
 * the page keeps each stall's items together with its own phone number.
 * ========================================================================== */
(function (global) {
  'use strict';

  var MM = global.MM;
  var D = MM.data;
  var esc = MM.dom.esc;
  var t = MM.t;
  var pick = MM.pick;
  var won = MM.fmt.won;
  var $ = function (id) { return document.getElementById(id); };

  MM.ui.shell();

  $('crumbs').innerHTML = '<a href="index.html">' + esc(t('nav.home')) + '</a> › <b>' + esc(t('cart.title')) + '</b>';

  function mode() { return MM.storage.get('fulfilment', 'deliver'); }

  function paint() {
    var items = MM.cart.items();

    /* ------------------------------------------------------ group by stall */
    var groups = {};
    items.forEach(function (it) {
      var sid = it.product.storeId;
      (groups[sid] = groups[sid] || []).push(it);
    });

    var main = $('cartMain');
    if (!items.length) {
      main.innerHTML =
        '<div class="panel"><div class="empty"><b>' + esc(t('cart.empty')) + '</b><br>' +
        '<a class="btn btn--primary" style="margin-top:14px" href="index.html">' + esc(t('nav.markets')) + '</a>' +
        '</div></div>';
    } else {
      main.innerHTML = Object.keys(groups).map(function (sid) {
        var s = D.storeById[sid];
        var m = D.marketById[s.marketId];
        var rows = groups[sid];
        var sum = rows.reduce(function (n, it) { return n + it.product.price * it.qty; }, 0);

        return '<div class="panel" style="margin-bottom:16px">' +
          '<div class="panel__head">' +
            '<img src="' + MM.img.stall(s, 'thumb') + '" alt="" style="width:44px;height:44px;border-radius:12px;object-fit:cover">' +
            '<div><h3 style="margin:0"><a href="' + MM.url.store(s.id) + '">' + esc(pick(s)) + '</a></h3>' +
              '<span class="muted small">' + esc(pick(m)) + ' · ' + esc(s.stall) + '</span></div>' +
            '<span class="spacer"></span>' +
            '<a class="btn btn--sm btn--ghost" href="tel:' + esc(s.phone) + '">📞 ' + esc(t('store.call')) + '</a>' +
          '</div>' +
          MM.ui.photoStamp(s, { compact: true }) +
          rows.map(function (it) {
            var p = it.product;
            return '<div class="citem">' +
              '<img src="' + MM.img.product(p) + '" alt="">' +
              '<div class="citem__info">' +
                '<b>' + esc(pick(p)) + '</b>' +
                '<span class="muted small">' + esc(pick(p.unit)) + ' · ' + esc(pick(p.origin)) +
                  (p.priceSource === 'ai' ? ' · <span class="tag tag--ai">' + esc(t('detect.priceAi')) + '</span>' : '') + '</span>' +
                '<span class="citem__price">' + esc(won(p.price * it.qty)) + '</span>' +
              '</div>' +
              '<div class="stack" style="gap:6px;justify-items:end">' +
                '<div class="qty">' +
                  '<button data-qty="' + esc(p.uid) + '" data-delta="-1">−</button><span>' + it.qty + '</span>' +
                  '<button data-qty="' + esc(p.uid) + '" data-delta="1">+</button>' +
                '</div>' +
                '<button class="btn btn--sm btn--ghost" data-del="' + esc(p.uid) + '">' + esc(t('cart.remove')) + '</button>' +
              '</div>' +
            '</div>';
          }).join('') +
          '<div class="row" style="justify-content:flex-end;padding-top:12px">' +
            '<span class="muted small">' + esc(pick(s.delivery)) + '</span>' +
            '<b style="margin-left:12px">' + esc(won(sum)) + '</b>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    /* ---------------------------------------------------------- summary -- */
    var tot = MM.cart.totals(mode());
    $('cartSummary').innerHTML =
      '<div class="panel__head"><h3>' + esc(t('cart.title')) + '</h3>' +
        '<span class="spacer"></span><span class="muted small">' + MM.cart.count() + esc(t('cart.count')) + '</span></div>' +
      '<div class="segmented" style="margin-bottom:6px">' +
        '<button data-mode="deliver"' + (mode() === 'deliver' ? ' class="is-on"' : '') + '>' + esc(t('cart.deliver')) + '</button>' +
        '<button data-mode="pickup"' + (mode() === 'pickup' ? ' class="is-on"' : '') + '>' + esc(t('cart.pickup')) + '</button>' +
      '</div>' +
      '<dl class="sums">' +
        '<div><dt>' + esc(t('cart.subtotal')) + '</dt><dd>' + esc(won(tot.subtotal)) + '</dd></div>' +
        '<div><dt>' + esc(t('cart.discount')) + '</dt><dd class="minus">−' + esc(won(tot.discount)) + '</dd></div>' +
        '<div><dt>' + esc(t('cart.delivery')) + '</dt><dd>' + (tot.delivery ? esc(won(tot.delivery)) : esc(t('cart.free'))) + '</dd></div>' +
        '<div class="sums__total"><dt>' + esc(t('cart.total')) + '</dt><dd>' + esc(won(tot.total)) + '</dd></div>' +
      '</dl>' +
      '<button class="btn btn--primary btn--block" id="checkout"' + (MM.cart.count() ? '' : ' disabled') + '>' +
        esc(t('cart.checkout')) + '</button>' +
      '<button class="btn btn--ghost btn--block" id="clear" style="margin-top:8px">' + esc(t('cart.clear')) + '</button>' +
      '<p class="muted small" style="margin-top:12px">' + esc(t('foot.note')) + '</p>';

    wire();
  }

  function wire() {
    MM.dom.qsa('[data-qty]').forEach(function (b) {
      b.addEventListener('click', function () {
        var uid = b.getAttribute('data-qty');
        MM.cart.setQty(uid, MM.cart.qty(uid) + parseInt(b.getAttribute('data-delta'), 10));
        paint();
      });
    });
    MM.dom.qsa('[data-del]').forEach(function (b) {
      b.addEventListener('click', function () { MM.cart.remove(b.getAttribute('data-del')); paint(); });
    });
    MM.dom.qsa('[data-mode]').forEach(function (b) {
      b.addEventListener('click', function () { MM.storage.set('fulfilment', b.getAttribute('data-mode')); paint(); });
    });

    var clear = $('clear');
    if (clear) clear.addEventListener('click', function () { MM.cart.clear(); paint(); });

    var checkout = $('checkout');
    if (checkout) checkout.addEventListener('click', function () {
      var code = 'MM-' + String(Date.now()).slice(-6);
      var stalls = {};
      MM.cart.items().forEach(function (it) { stalls[it.product.storeId] = true; });
      var n = Object.keys(stalls).length;
      MM.ui.toast(MM.i18n.lang === 'ko'
        ? '주문서 ' + code + ' · ' + n + '개 점포에 전달되었습니다 (데모).'
        : 'Order ' + code + ' sent to ' + n + ' stall(s). Demo only.', '🧾');
    });
  }

  paint();

  MM.recommend.render($('picksHost'), {
    context: 'cart',
    limit: 4,
    title: MM.i18n.lang === 'ko' ? '놓치신 건 없나요?' : 'Anything missing?',
    subtitle: MM.i18n.lang === 'ko' ? '장바구니 구성에 맞춰 함께 사면 좋은 상품을 골랐습니다.' : 'Picked to round out what is already in your basket.'
  });
})(window);
