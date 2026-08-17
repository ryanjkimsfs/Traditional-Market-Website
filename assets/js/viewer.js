/* =============================================================================
 * MarketMesh · viewer.js
 * The stall viewer: live camera or timestamped counter photo, with the zoom /
 * pan controls the spec marks as must-have, plus the AI detection overlay that
 * links every drawn box to a row in the product list.
 *
 *   MM.Viewer.create(hostElement, store, { size, detections, onSelect })
 * ========================================================================== */
(function (global) {
  'use strict';

  var MM = global.MM;
  var esc = MM.dom.esc;
  var t = MM.t;
  var pick = MM.pick;

  var MIN_SCALE = 1;
  var MAX_SCALE = 6;

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  function Viewer(host, store, opts) {
    this.host = host;
    this.store = store;
    this.opts = opts || {};
    this.scale = 1;
    this.tx = 0;
    this.ty = 0;
    this.showBoxes = this.opts.detections !== false;
    this.detected = (store.products || []).filter(function (p) { return p.box && p.conf > 0; });
    this.build();
  }

  Viewer.prototype.build = function () {
    var s = this.store;
    var cam = s.camera;
    var isLive = !!cam;
    var media = isLive
      ? '<video class="viewer__media" playsinline autoplay muted loop preload="metadata" ' +
        'poster="' + MM.img.stall(s) + '"><source src="' + MM.img.video(s) + '" type="video/mp4"></video>'
      : (s.photo
        ? '<img class="viewer__media" src="' + MM.img.stall(s) + '" alt="' + esc(pick(s)) + '">'
        : '<div class="viewer__blank">' + esc(t('store.noPhoto')) + '</div>');

    var ptz = isLive && cam.ptz;

    this.host.classList.add('viewer');
    if (this.opts.size === 'mini') this.host.classList.add('viewer--mini');
    this.host.innerHTML =
      '<div class="viewer__frame" data-frame>' +
        '<div class="viewer__stage" data-stage>' +
          media +
          '<svg class="viewer__boxes" data-boxes viewBox="0 0 100 100" preserveAspectRatio="none"></svg>' +
        '</div>' +
        '<div class="viewer__osd">' +
          (isLive
            ? '<span class="badge badge--live"><i></i>' + esc(t('live.badge')) + '</span>' +
              '<span class="osd__id">' + esc(cam.id) + ' · ' + esc(cam.res) + ' · ' + cam.fps + 'fps</span>'
            : '<span class="badge badge--photo">' + esc(t('live.photo')) + '</span>') +
          '<span class="osd__clock" data-clock></span>' +
        '</div>' +
        (isLive ? '<div class="viewer__stats"><span data-viewers></span><span data-latency></span></div>' : '') +
        '<div class="viewer__zoom">' +
          '<button class="zbtn" data-zoom="in"  title="' + esc(t('zoom.in')) + '" aria-label="' + esc(t('zoom.in')) + '">+</button>' +
          '<button class="zbtn" data-zoom="out" title="' + esc(t('zoom.out')) + '" aria-label="' + esc(t('zoom.out')) + '">−</button>' +
          '<button class="zbtn" data-zoom="reset" title="' + esc(t('zoom.reset')) + '" aria-label="' + esc(t('zoom.reset')) + '">↺</button>' +
          (this.opts.size === 'mini' ? '' :
            '<button class="zbtn" data-zoom="full" title="' + esc(t('zoom.full')) + '" aria-label="' + esc(t('zoom.full')) + '">⛶</button>' +
            '<button class="zbtn" data-zoom="snap" title="' + esc(t('zoom.snap')) + '" aria-label="' + esc(t('zoom.snap')) + '">📷</button>') +
        '</div>' +
        '<div class="viewer__scale" data-scalelabel>1.0×</div>' +
      '</div>' +
      '<div class="viewer__bar">' +
        (this.detected.length
          ? '<button class="btn btn--sm btn--ghost" data-toggle-boxes>' +
              '<span data-toggle-label>' + esc(this.showBoxes ? t('detect.off') : t('detect.on')) + '</span>' +
              ' · ' + this.detected.length + ' ' + esc(t('detect.count')) +
            '</button>'
          : '<span class="muted small">' + esc(isLive ? t('detect.title') : t('store.noCamera')) + '</span>') +
        (ptz ? '<div class="ptz" data-ptz>' +
            '<button data-preset="wide">WIDE</button>' +
            '<button data-preset="left">L</button>' +
            '<button data-preset="center">C</button>' +
            '<button data-preset="right">R</button>' +
          '</div>' : '') +
        '<span class="muted small viewer__hint">' + esc(t('zoom.hint')) + '</span>' +
      '</div>' +
      /* The spec is explicit: the capture time must sit under the picture and
       * be easy to read. It renders for camera stalls too, as the last still. */
      '<div class="viewer__stampline">' + MM.ui.photoStamp(s) +
        (s.photo && !isLive ? '<span class="muted small">' + esc(t('photo.hint')) + '</span>' : '') +
      '</div>';

    this.frame = this.host.querySelector('[data-frame]');
    this.stage = this.host.querySelector('[data-stage]');
    this.boxes = this.host.querySelector('[data-boxes]');
    this.scaleLabel = this.host.querySelector('[data-scalelabel]');
    this.media = this.host.querySelector('.viewer__media');

    this.renderBoxes();
    this.wire();
    this.startOsd();
    this.apply();
  };

  /* ------------------------------------------------------------- detections */
  Viewer.prototype.renderBoxes = function () {
    if (!this.boxes) return;
    if (!this.showBoxes || !this.detected.length) { this.boxes.innerHTML = ''; return; }
    var self = this;
    // On a live feed the detector re-runs, so boxes and scores drift a little
    // between passes instead of sitting perfectly still.
    var drift = this.drift || 0;
    this.boxes.innerHTML = this.detected.map(function (p, i) {
      var b = p.box;
      var wobble = drift ? Math.sin(drift * 1.7 + i * 2.1) * 0.35 : 0;
      var x = b[0] * 100 + wobble, y = b[1] * 100 + wobble * 0.6, w = b[2] * 100, h = b[3] * 100;
      var labelY = y > 8 ? y - 1.4 : y + h + 4;
      var conf = Math.min(99.6, p.conf * 100 + (drift ? Math.sin(drift * 2.3 + i) * 0.6 : 0));
      return '<g class="dbox" data-uid="' + esc(p.uid) + '" style="--i:' + i + '">' +
        '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="0.8"></rect>' +
        '<text x="' + (x + 0.6) + '" y="' + labelY + '">' + esc(pick(p)) +
          ' ' + conf.toFixed(0) + '%</text>' +
        '</g>';
    }).join('');

    MM.dom.qsa('.dbox', this.boxes).forEach(function (g) {
      g.addEventListener('mouseenter', function () { self.emit('hover', g.getAttribute('data-uid')); });
      g.addEventListener('mouseleave', function () { self.emit('hover', null); });
      g.addEventListener('click', function () { self.emit('select', g.getAttribute('data-uid')); });
    });
  };

  Viewer.prototype.emit = function (kind, uid) {
    if (kind === 'hover' && this.opts.onHover) this.opts.onHover(uid);
    if (kind === 'select' && this.opts.onSelect) this.opts.onSelect(uid);
  };

  Viewer.prototype.highlight = function (uid) {
    MM.dom.qsa('.dbox', this.host).forEach(function (g) {
      g.classList.toggle('is-on', !!uid && g.getAttribute('data-uid') === uid);
    });
  };

  /* ------------------------------------------------------------- transforms */
  Viewer.prototype.apply = function () {
    var rect = this.frame.getBoundingClientRect();
    var maxX = (this.scale - 1) * rect.width / 2;
    var maxY = (this.scale - 1) * rect.height / 2;
    this.tx = clamp(this.tx, -maxX, maxX);
    this.ty = clamp(this.ty, -maxY, maxY);
    this.stage.style.transform = 'translate(' + this.tx + 'px,' + this.ty + 'px) scale(' + this.scale + ')';
    if (this.scaleLabel) this.scaleLabel.textContent = this.scale.toFixed(1) + '×';
    this.frame.classList.toggle('is-zoomed', this.scale > 1);
  };

  Viewer.prototype.zoom = function (delta, originX, originY) {
    var prev = this.scale;
    var next = clamp(prev * (delta > 0 ? 1.35 : 1 / 1.35), MIN_SCALE, MAX_SCALE);
    if (next === prev) return;
    if (originX != null) {
      // Keep the pixel under the cursor pinned while the scale changes.
      var rect = this.frame.getBoundingClientRect();
      var px = originX - rect.left - rect.width / 2;
      var py = originY - rect.top - rect.height / 2;
      this.tx = px - (px - this.tx) * (next / prev);
      this.ty = py - (py - this.ty) * (next / prev);
    }
    this.scale = next;
    if (this.scale === 1) { this.tx = 0; this.ty = 0; }
    this.apply();
  };

  Viewer.prototype.reset = function () { this.scale = 1; this.tx = 0; this.ty = 0; this.apply(); };

  Viewer.prototype.preset = function (name) {
    var rect = this.frame.getBoundingClientRect();
    var q = rect.width / 4;
    this.stage.classList.add('is-animating');
    if (name === 'wide') { this.scale = 1; this.tx = 0; this.ty = 0; }
    if (name === 'left') { this.scale = 2.2; this.tx = q; this.ty = 0; }
    if (name === 'center') { this.scale = 2.2; this.tx = 0; this.ty = 0; }
    if (name === 'right') { this.scale = 2.2; this.tx = -q; this.ty = 0; }
    this.apply();
    var self = this;
    setTimeout(function () { self.stage.classList.remove('is-animating'); }, 420);
  };

  /* ------------------------------------------------------------------ wiring */
  Viewer.prototype.wire = function () {
    var self = this;

    MM.dom.qsa('[data-zoom]', this.host).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var kind = btn.getAttribute('data-zoom');
        if (kind === 'in') self.zoom(1);
        else if (kind === 'out') self.zoom(-1);
        else if (kind === 'reset') self.reset();
        else if (kind === 'full') self.fullscreen();
        else if (kind === 'snap') self.snapshot();
      });
    });

    MM.dom.qsa('[data-preset]', this.host).forEach(function (btn) {
      btn.addEventListener('click', function () { self.preset(btn.getAttribute('data-preset')); });
    });

    var toggle = this.host.querySelector('[data-toggle-boxes]');
    if (toggle) {
      toggle.addEventListener('click', function () {
        self.showBoxes = !self.showBoxes;
        var label = toggle.querySelector('[data-toggle-label]');
        if (label) label.textContent = self.showBoxes ? t('detect.off') : t('detect.on');
        self.renderBoxes();
      });
    }

    // Wheel zoom (ctrl not required — the frame owns the gesture).
    this.frame.addEventListener('wheel', function (e) {
      e.preventDefault();
      self.zoom(e.deltaY < 0 ? 1 : -1, e.clientX, e.clientY);
    }, { passive: false });

    // Mouse drag pan. Window-level handlers are tracked so destroy() can undo them.
    var dragging = false, sx = 0, sy = 0;
    this.windowHandlers = [];
    var onWindow = function (type, fn) {
      window.addEventListener(type, fn);
      self.windowHandlers.push([type, fn]);
    };

    this.frame.addEventListener('mousedown', function (e) {
      if (self.scale <= 1) return;
      dragging = true; sx = e.clientX - self.tx; sy = e.clientY - self.ty;
      self.frame.classList.add('is-grabbing');
      e.preventDefault();
    });
    onWindow('mousemove', function (e) {
      if (!dragging) return;
      self.tx = e.clientX - sx; self.ty = e.clientY - sy; self.apply();
    });
    onWindow('mouseup', function () {
      dragging = false; self.frame.classList.remove('is-grabbing');
    });

    // Touch: one finger pans, two fingers pinch.
    var pinchStart = 0, startScale = 1, touchStartX = 0, touchStartY = 0;
    this.frame.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) {
        pinchStart = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY);
        startScale = self.scale;
      } else if (e.touches.length === 1 && self.scale > 1) {
        touchStartX = e.touches[0].clientX - self.tx;
        touchStartY = e.touches[0].clientY - self.ty;
      }
    }, { passive: true });

    this.frame.addEventListener('touchmove', function (e) {
      if (e.touches.length === 2 && pinchStart) {
        var d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY);
        self.scale = clamp(startScale * (d / pinchStart), MIN_SCALE, MAX_SCALE);
        self.apply();
        e.preventDefault();
      } else if (e.touches.length === 1 && self.scale > 1) {
        self.tx = e.touches[0].clientX - touchStartX;
        self.ty = e.touches[0].clientY - touchStartY;
        self.apply();
        e.preventDefault();
      }
    }, { passive: false });

    this.frame.addEventListener('dblclick', function (e) {
      if (self.scale > 1) self.reset(); else self.zoom(1, e.clientX, e.clientY);
    });

    onWindow('resize', function () { self.apply(); });
  };

  Viewer.prototype.fullscreen = function () {
    var node = this.frame;
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    if (node.requestFullscreen) node.requestFullscreen();
    else if (node.webkitRequestFullscreen) node.webkitRequestFullscreen();
  };

  Viewer.prototype.snapshot = function () {
    try {
      var src = this.media;
      if (!src) return;
      var w = src.videoWidth || src.naturalWidth || 1280;
      var h = src.videoHeight || src.naturalHeight || 720;
      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(src, 0, 0, w, h);
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.fillRect(0, h - 46, w, 46);
      ctx.fillStyle = '#fff';
      ctx.font = '600 22px -apple-system, sans-serif';
      ctx.fillText(pick(this.store) + ' · ' + MM.fmt.stamp(new Date()) + ' · MarketMesh', 16, h - 16);
      var a = document.createElement('a');
      a.download = this.store.id + '-' + Date.now() + '.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
      MM.ui.toast(t('toast.snap'), '📷');
    } catch (err) {
      MM.ui.toast(MM.i18n.lang === 'ko' ? '이 브라우저에서는 스냅샷을 저장할 수 없습니다.' : 'Snapshot is blocked in this browser.', '⚠️');
    }
  };

  /* ---------------------------------------------------------------- live OSD */
  Viewer.prototype.startOsd = function () {
    var clock = this.host.querySelector('[data-clock]');
    var viewersEl = this.host.querySelector('[data-viewers]');
    var latencyEl = this.host.querySelector('[data-latency]');
    var isLive = !!this.store.camera;

    // Seed from the stall id so each stall keeps a stable-looking audience.
    var seed = 0;
    for (var i = 0; i < this.store.id.length; i++) seed += this.store.id.charCodeAt(i);
    var viewers = 4 + (seed % 40);

    var self = this;
    var beat = 0;

    var tick = function () {
      beat++;
      if (clock) clock.textContent = MM.fmt.stamp(new Date());
      // Re-run the "detector" every few seconds on live feeds.
      if (isLive && self.showBoxes && beat % 5 === 0 && !self.host.querySelector('.dbox:hover')) {
        self.drift = (self.drift || 0) + 1;
        self.renderBoxes();
      }
      if (isLive && viewersEl) {
        viewers = Math.max(1, viewers + (Math.random() < 0.5 ? -1 : 1));
        viewersEl.textContent = '👁 ' + viewers + ' ' + t('live.viewers');
      }
      if (isLive && latencyEl) {
        latencyEl.textContent = '⚡ ' + t('live.latency') + ' ' + (180 + Math.floor(Math.random() * 90)) + 'ms';
      }
    };
    tick();
    this.timer = setInterval(tick, 1000);
  };

  Viewer.prototype.destroy = function () {
    if (this.timer) clearInterval(this.timer);
    // Pan tracking lives on window, so it has to be unhooked explicitly —
    // pages like market.html swap viewers on every card click.
    (this.windowHandlers || []).forEach(function (h) { window.removeEventListener(h[0], h[1]); });
    this.windowHandlers = [];
    this.host.innerHTML = '';
  };

  MM.Viewer = {
    create: function (host, store, opts) { return new Viewer(host, store, opts); }
  };
})(window);
