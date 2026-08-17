/* =============================================================================
 * MarketMesh · recommend.js
 * "What should I buy next?" — powered by xAI (Grok) through the small Python
 * proxy in /api, with a fully offline heuristic engine as the fallback so the
 * feature never dead-ends when the key or the server is missing.
 *
 *   MM.recommend.get({ context, storeId, limit })   → Promise<result>
 *   MM.recommend.render(hostEl, { context, storeId, limit })
 * ========================================================================== */
(function (global) {
  'use strict';

  var MM = global.MM;
  var D = MM.data;
  var esc = MM.dom.esc;
  var t = MM.t;
  var pick = MM.pick;

  /* Month → tags that deserve a seasonal nudge in Korean markets. */
  var SEASON = {
    1: ['citrus', 'persimmon', 'stew', 'ginseng'],
    2: ['citrus', 'stew', 'kimchi'],
    3: ['greens', 'namul', 'sprouts'],
    4: ['greens', 'berry', 'namul'],
    5: ['berry', 'greens', 'salad'],
    6: ['melon', 'tomato', 'cucumber'],
    7: ['watermelon', 'melon', 'summer'],
    8: ['watermelon', 'melon', 'summer', 'grape', 'chicken'],
    9: ['apple', 'pear', 'grape', 'chestnut', 'rite'],
    10: ['apple', 'persimmon', 'chestnut', 'jujube'],
    11: ['citrus', 'cabbage', 'kimchi', 'sweet-potato'],
    12: ['citrus', 'sweet-potato', 'stew', 'gift']
  };

  function seasonTags() {
    return SEASON[new Date().getMonth() + 1] || [];
  }

  /* ------------------------------------------------------------- candidates */
  function candidates(ctx) {
    var inCart = {};
    MM.cart.items().forEach(function (it) { inCart[it.product.uid] = true; });

    var list = D.products.filter(function (p) {
      return !inCart[p.uid] && p.stock !== 'soldout';
    });

    // Prefer the market the shopper is actually standing in, then everything else.
    if (ctx && ctx.marketId) {
      list.sort(function (a, b) {
        return (b.marketId === ctx.marketId ? 1 : 0) - (a.marketId === ctx.marketId ? 1 : 0);
      });
    }
    return list;
  }

  /* --------------------------------------------------------- offline engine */
  function seedWeights() {
    var seeds = {};
    var bump = function (tag, w) { if (tag) seeds[tag] = (seeds[tag] || 0) + w; };

    MM.cart.items().forEach(function (it) {
      (it.product.tags || []).forEach(function (tag) { bump(tag, 1.0); });
      bump(it.product.cat, 0.4);
    });
    MM.activity.products().slice(0, 8).forEach(function (uid, i) {
      var p = D.productByUid(uid);
      if (!p) return;
      var w = 0.6 - i * 0.05;
      (p.tags || []).forEach(function (tag) { bump(tag, w); });
    });
    MM.activity.stores().slice(0, 5).forEach(function (sid, i) {
      var s = D.storeById[sid];
      if (s) bump(s.cat, 0.35 - i * 0.05);
    });
    MM.activity.searches().slice(0, 5).forEach(function (q) {
      var res = MM.search.query(q, 4);
      res.products.slice(0, 3).forEach(function (p) {
        (p.tags || []).forEach(function (tag) { bump(tag, 0.35); });
      });
    });
    return seeds;
  }

  function scoreProduct(p, seeds, season, ctx) {
    var score = 0;
    var why = null;

    Object.keys(seeds).forEach(function (seedTag) {
      var links = D.affinity[seedTag] || [];
      links.forEach(function (link) {
        if ((p.tags || []).indexOf(link.tag) !== -1) {
          var add = link.w * seeds[seedTag];
          score += add;
          if (!why || add > why.w) why = { w: add, key: link.why };
        }
      });
      // Direct tag echo is worth something, but less than a real pairing.
      if ((p.tags || []).indexOf(seedTag) !== -1) score += 0.25 * seeds[seedTag];
    });

    (p.tags || []).forEach(function (tag) {
      if (season.indexOf(tag) !== -1) {
        score += 0.55;
        if (!why) why = { w: 0.55, key: 'season' };
      }
    });

    var store = D.storeById[p.storeId];
    if (store) {
      if (store.camera) score += 0.25;                                  // you can verify it live
      if (store.photoAgeMin != null && store.photoAgeMin <= 60) {
        score += 0.3;
        if (!why) why = { w: 0.3, key: 'fresh' };
      }
      score += (store.rating - 4.2) * 0.5;
      if (ctx && ctx.marketId && store.marketId === ctx.marketId) {
        score += 0.5;
        if (!why) why = { w: 0.5, key: 'nearby' };
      }
      if (ctx && ctx.storeId && store.id === ctx.storeId) score -= 0.6;  // suggest beyond this stall
    }
    if (p.conf > 0.95) score += 0.15;
    if (!why) why = { w: 0, key: 'popular' };
    return { score: score, why: why.key };
  }

  function localPicks(ctx, limit) {
    var seeds = seedWeights();
    var season = seasonTags();
    var scored = candidates(ctx).map(function (p) {
      var r = scoreProduct(p, seeds, season, ctx);
      return { product: p, score: r.score, whyKey: r.why };
    });

    scored.sort(function (a, b) { return b.score - a.score; });

    // Keep the list varied: at most two picks from the same stall.
    var perStore = {}, out = [];
    for (var i = 0; i < scored.length && out.length < limit; i++) {
      var sid = scored[i].product.storeId;
      perStore[sid] = (perStore[sid] || 0) + 1;
      if (perStore[sid] > 2) continue;
      out.push(scored[i]);
    }

    return out.map(function (row) {
      var reason = D.reasons[row.whyKey] || D.reasons.popular;
      return {
        product: row.product,
        reason: pick(reason),
        score: Math.round(row.score * 100) / 100,
        pairWith: null
      };
    });
  }

  function localBundle(picks) {
    if (!picks.length) return null;
    var month = new Date().getMonth() + 1;
    var titles = {
      ko: month >= 9 && month <= 10 ? '추석 상차림 한 바구니'
        : month >= 6 && month <= 8 ? '여름 제철 한 바구니'
        : month >= 11 || month <= 2 ? '겨울 국물 요리 한 바구니'
        : '봄나물 한 바구니',
      en: month >= 9 && month <= 10 ? 'Chuseok table basket'
        : month >= 6 && month <= 8 ? 'Peak-summer basket'
        : month >= 11 || month <= 2 ? 'Winter stew basket'
        : 'Spring greens basket'
    };
    var items = picks.slice(0, 3).map(function (x) { return x.product; });
    var total = items.reduce(function (s, p) { return s + p.price; }, 0);
    return { title: pick(titles), items: items, total: total };
  }

  /* ------------------------------------------------------------- xAI client */
  var health = { checked: false, xai: false };

  function checkHealth() {
    if (health.checked) return Promise.resolve(health);
    return fetch('api/health', { method: 'GET' })
      .then(function (r) { return r.ok ? r.json() : { xai: false }; })
      .then(function (j) { health = { checked: true, xai: !!j.xai, model: j.model }; return health; })
      .catch(function () { health = { checked: true, xai: false }; return health; });
  }

  function askGrok(ctx, limit) {
    var payload = {
      lang: MM.i18n.lang,
      context: ctx.context || 'home',
      limit: limit,
      profile: MM.activity.profile(),
      market: ctx.marketId ? {
        id: ctx.marketId,
        name: pick(D.marketById[ctx.marketId] || {})
      } : null,
      store: ctx.storeId ? {
        id: ctx.storeId,
        name: pick(D.storeById[ctx.storeId] || {})
      } : null,
      // Compact catalog: the model only needs enough to choose and explain.
      catalog: candidates(ctx).slice(0, 70).map(function (p) {
        var s = D.storeById[p.storeId];
        return {
          uid: p.uid, ko: p.ko, en: p.en, price: p.price, cat: p.cat,
          tags: p.tags, store: s ? s.ko : '', market: s ? s.marketId : '',
          live: !!(s && s.camera), photoAgeMin: s ? s.photoAgeMin : null
        };
      })
    };

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 12000) : null;

    return fetch('api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    }).then(function (r) {
      if (timer) clearTimeout(timer);
      if (!r.ok) throw new Error('proxy ' + r.status);
      return r.json();
    }).then(function (json) {
      var picks = (json.picks || []).map(function (row) {
        var product = D.productByUid(row.uid);
        if (!product) return null;
        return {
          product: product,
          reason: MM.i18n.lang === 'en' ? (row.reason_en || row.reason_ko) : (row.reason_ko || row.reason_en),
          pairWith: row.pair_uid ? D.productByUid(row.pair_uid) : null,
          score: row.score == null ? null : row.score
        };
      }).filter(Boolean);
      if (picks.length < 2) throw new Error('too few valid picks');
      var bundle = null;
      if (json.bundle && json.bundle.uids) {
        var items = json.bundle.uids.map(function (u) { return D.productByUid(u); }).filter(Boolean);
        if (items.length) {
          bundle = {
            title: MM.i18n.lang === 'en' ? (json.bundle.title_en || json.bundle.title_ko) : (json.bundle.title_ko || json.bundle.title_en),
            items: items,
            total: items.reduce(function (s, p) { return s + p.price; }, 0)
          };
        }
      }
      return { source: 'grok', model: json.model || 'grok', picks: picks.slice(0, limit), bundle: bundle || localBundle(picks) };
    });
  }

  /* ------------------------------------------------------------------- api  */
  MM.recommend = {
    health: checkHealth,

    get: function (opts) {
      var o = opts || {};
      var limit = o.limit || 6;
      var ctx = { context: o.context || 'home', storeId: o.storeId || null, marketId: o.marketId || null };

      var fallback = function () {
        var picks = localPicks(ctx, limit);
        return { source: 'local', picks: picks, bundle: localBundle(picks) };
      };

      return askGrok(ctx, limit).catch(function () { return fallback(); });
    },

    /* Renders straight into a host element: skeleton → picks → bundle. */
    render: function (host, opts) {
      if (!host) return;
      var o = opts || {};
      var limit = o.limit || 6;

      host.innerHTML =
        '<div class="picks__head">' +
          '<div><h2>' + esc(o.title || t('ai.title')) + '</h2>' +
            '<p class="muted">' + esc(o.subtitle || t('ai.sub')) + '</p></div>' +
          '<div class="picks__tools">' +
            '<span class="srcbadge" data-src>' + esc(t('ai.thinking')) + '</span>' +
            '<button class="btn btn--sm btn--ghost" data-refresh>↻ ' + esc(t('ai.refresh')) + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="picks__grid" data-grid>' +
          '<div class="skel"></div><div class="skel"></div><div class="skel"></div>' +
        '</div>' +
        '<div data-bundle></div>';

      var grid = host.querySelector('[data-grid]');
      var srcEl = host.querySelector('[data-src]');
      var bundleEl = host.querySelector('[data-bundle]');

      var paint = function (res) {
        srcEl.textContent = res.source === 'grok'
          ? '✨ ' + t('ai.grok') + (res.model ? ' · ' + res.model : '')
          : '⚙︎ ' + t('ai.local');
        srcEl.className = 'srcbadge srcbadge--' + res.source;

        if (!res.picks.length) {
          grid.innerHTML = '<p class="muted">' + esc(t('ai.empty')) + '</p>';
          bundleEl.innerHTML = '';
          return;
        }

        grid.innerHTML = res.picks.map(function (row) {
          var p = row.product;
          var s = D.storeById[p.storeId];
          var m = D.marketById[p.marketId];
          return '<article class="pick">' +
            '<a class="pick__media" href="' + MM.url.store(s.id) + '#' + esc(p.id) + '">' +
              '<img loading="lazy" src="' + MM.img.product(p) + '" alt="' + esc(pick(p)) + '">' +
              (s.camera ? '<span class="badge badge--live"><i></i>' + esc(t('live.badge')) + '</span>' : '') +
            '</a>' +
            '<div class="pick__body">' +
              '<div class="pick__name">' + esc(pick(p)) + '</div>' +
              '<div class="muted small">' + esc(pick(s)) + ' · ' + esc(pick(m)) + '</div>' +
              '<div class="pick__why">💡 ' + esc(row.reason || '') + '</div>' +
              (row.pairWith ? '<div class="muted small">' + esc(t('ai.pairWith')) + ': ' + esc(pick(row.pairWith)) + '</div>' : '') +
              '<div class="pick__foot"><span class="pricetag">' + esc(MM.fmt.won(p.price)) + '</span>' +
                '<button class="btn btn--sm btn--primary" data-add="' + esc(p.uid) + '">' + esc(t('cart.add')) + '</button></div>' +
            '</div>' +
          '</article>';
        }).join('');

        if (res.bundle && res.bundle.items.length > 1) {
          bundleEl.innerHTML =
            '<div class="bundle">' +
              '<div class="bundle__info"><span class="muted small">' + esc(t('ai.bundle')) + '</span>' +
                '<h3>' + esc(res.bundle.title) + '</h3>' +
                '<p class="muted small">' + res.bundle.items.map(function (p) { return esc(pick(p)); }).join(' + ') + '</p></div>' +
              '<div class="bundle__buy"><span class="pricetag pricetag--lg">' + esc(MM.fmt.won(res.bundle.total)) + '</span>' +
                '<button class="btn btn--primary" data-bundle-add>' + esc(t('cart.add')) + '</button></div>' +
            '</div>';
          var addAll = bundleEl.querySelector('[data-bundle-add]');
          if (addAll) addAll.addEventListener('click', function () {
            res.bundle.items.forEach(function (p) { MM.cart.add(p.uid, 1); });
          });
        } else {
          bundleEl.innerHTML = '';
        }
      };

      var run = function () {
        grid.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
        srcEl.textContent = t('ai.thinking');
        MM.recommend.get({ context: o.context, storeId: o.storeId, marketId: o.marketId, limit: limit }).then(paint);
      };

      var refresh = host.querySelector('[data-refresh]');
      if (refresh) refresh.addEventListener('click', run);

      // The basket is the strongest signal, so re-run when it changes — but
      // debounced, so adding three things in a row is one request, not three.
      var debounce;
      MM.cart.onChange(function () {
        clearTimeout(debounce);
        debounce = setTimeout(run, 900);
      });
      run();
    }
  };
})(window);
