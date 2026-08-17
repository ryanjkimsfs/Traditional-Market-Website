/* =============================================================================
 * MarketMesh · cinema.js
 * The motion layer that runs on every page: entrance choreography, the living
 * details, the reduced-motion contract (honoured live, in both directions), and
 * the scroll-driven hero on the home page.
 *
 * The hero drives caption bands and the stage's parallax from scroll. It does
 * NOT seek the video frame by frame: the source footage carries a keyframe
 * every five seconds, so scrubbing it would snap between distant frames. The
 * footage plays as the live counter it actually is, and scroll drives the
 * story over it.
 * ========================================================================== */
(function (global) {
  'use strict';

  var MM = global.MM || (global.MM = {});
  var reduceQuery = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduced = !!(reduceQuery && reduceQuery.matches);

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* ------------------------------------------------------------ entrances */
  var revealObserver = null;

  function armReveals() {
    var targets = qsa('.reveal, .rise').filter(function (n) { return !n.dataset.armed; });
    if (!targets.length) return;

    if (reduced) {
      targets.forEach(function (n) {
        n.dataset.armed = '1';
        n.classList.add('in', 'settled');
      });
      return;
    }

    if (!revealObserver && 'IntersectionObserver' in global) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var node = entry.target;
          node.classList.add('in');
          revealObserver.unobserve(node);
          // Retire the stagger delays once the entrance has played, or every
          // later hover on those children lags by the stagger forever.
          setTimeout(function () { node.classList.add('settled'); }, 900);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    }

    targets.forEach(function (n) {
      n.dataset.armed = '1';
      if (revealObserver) revealObserver.observe(n);
      else n.classList.add('in', 'settled');
    });
  }

  /* -------------------------------------------------------- living details */
  /* Whisper-level loops run only while their section is on screen. */
  function armAlive() {
    if (!('IntersectionObserver' in global)) {
      qsa('[data-alive]').forEach(function (n) { n.classList.add('alive'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('alive', e.isIntersecting); });
    }, { threshold: 0.02 });
    qsa('[data-alive]').forEach(function (n) { io.observe(n); });
  }

  document.addEventListener('visibilitychange', function () {
    document.body.classList.toggle('paused', document.hidden);
  });

  /* ------------------------------------------------- reduced motion, live */
  function applyReducedMotion(on) {
    reduced = on;
    document.body.classList.toggle('rm-on', on);
    if (on) {
      // Pin everything scroll-driven to its finished state.
      qsa('.reveal, .rise').forEach(function (n) { n.classList.add('in', 'settled'); });
      qsa('.cband').forEach(function (b) { b.style.setProperty('--o', b.dataset.first ? 1 : 0); });
      var hero = document.getElementById('chero');
      if (hero) hero.classList.add('is-static');
    } else {
      armReveals();
    }
  }
  if (reduceQuery && reduceQuery.addEventListener) {
    reduceQuery.addEventListener('change', function (e) { applyReducedMotion(e.matches); });
  }

  /* ================================================================ hero == */
  /* Five gates decide whether a visitor gets the moving hero or the composed
   * still: reduced motion, a coarse pointer on a small screen, save-data, a
   * browser that cannot play mp4, and the footage failing to arrive. */
  function heroGates() {
    if (reduced) return 'reduced-motion';
    if (global.matchMedia && global.matchMedia('(max-width: 720px)').matches) return 'small-screen';
    var conn = navigator.connection;
    if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return 'save-data';
    var probe = document.createElement('video');
    if (!probe.canPlayType || !probe.canPlayType('video/mp4')) return 'no-mp4';
    return null;
  }

  MM.hero = function (opts) {
    var hero = document.getElementById('chero');
    if (!hero) return;

    var stage = hero.querySelector('[data-stage]');
    var video = hero.querySelector('[data-video]');
    var bands = qsa('.cband', hero);
    var rail = qsa('[data-rail] b', hero);
    var loader = hero.querySelector('[data-load]');
    var blocked = heroGates();

    bands.forEach(function (b, i) { if (i === 0) b.dataset.first = '1'; });

    if (blocked) {
      hero.classList.add('is-static');
      hero.setAttribute('data-static-reason', blocked);
      if (video) video.remove();
      if (loader) loader.remove();
    } else if (video) {
      // Stream the footage as a Blob behind an honest loading ring, so the
      // browser never range-requests mid-scroll.
      var src = video.getAttribute('data-src');
      fetch(src)
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          var total = Number(r.headers.get('Content-Length')) || 0;
          if (!r.body || !total) return r.blob();
          var reader = r.body.getReader();
          var chunks = [];
          var got = 0;
          return (function pump() {
            return reader.read().then(function (res) {
              if (res.done) return new Blob(chunks, { type: 'video/mp4' });
              chunks.push(res.value);
              got += res.value.length;
              if (loader) loader.querySelector('span').textContent = Math.round(got / total * 100) + '%';
              return pump();
            });
          })();
        })
        .then(function (blob) {
          video.src = URL.createObjectURL(blob);
          video.play().catch(function () {});
          hero.classList.add('has-video');
          if (loader) loader.remove();
        })
        .catch(function () {
          // Complete without the video: the poster carries the hero.
          hero.classList.add('is-static');
          hero.setAttribute('data-static-reason', 'fetch-failed');
          if (video) video.remove();
          if (loader) loader.remove();
        });
    }

    /* ------------------------------------------------------- the scroll drive */
    var lastK = -1;
    var ticking = false;

    function paint() {
      ticking = false;
      var rect = hero.getBoundingClientRect();
      var span = Math.max(1, rect.height * 0.92);
      var progress = Math.min(1, Math.max(0, -rect.top / span));

      // Delta-gate: nothing is written unless the value actually moved.
      if (Math.abs(progress - lastK) < 0.004) return;
      lastK = progress;
      hero.style.setProperty('--progress', progress.toFixed(3));

      if (stage) {
        stage.style.setProperty('--stagescale', (1.06 + progress * 0.1).toFixed(3));
        stage.style.setProperty('--stagey', (progress * -40).toFixed(1) + 'px');
      }

      var n = bands.length;
      if (!n) return;
      var active = Math.min(n - 1, Math.floor(progress * n * 0.999));
      bands.forEach(function (band, i) {
        var slot = 1 / n;
        var local = (progress - i * slot) / slot;         // 0 to 1 inside this band
        var o = i === active ? 1 : 0;
        // ease the outgoing band rather than snapping it
        if (i === active - 1 && local < 1.25) o = Math.max(0, 1.25 - local) * 0.8;
        band.style.setProperty('--o', o.toFixed(2));
        band.style.setProperty('--k', i === active ? Math.min(1, Math.max(0, local * 1.6)).toFixed(2) : (o ? '1' : '0'));
        band.classList.toggle('is-on', i === active);
      });
      rail.forEach(function (r, i) { r.classList.toggle('is-on', i === active); });
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(paint);
    }

    global.addEventListener('scroll', onScroll, { passive: true });
    global.addEventListener('resize', onScroll);
    paint();
    if (reduced) applyReducedMotion(true);
  };

  /* ------------------------------------------------------------------ boot */
  function boot() {
    armReveals();
    armAlive();
    if (reduced) applyReducedMotion(true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  // Pages render most of their content from JS, so re-arm after those paints.
  MM.rearmMotion = function () { armReveals(); armAlive(); };
})(window);
