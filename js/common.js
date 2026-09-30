// Shared helpers for every game. Exposed as the global `W`.
(function () {
  const W = {};

  // Canvas sized to its CSS box at device pixel ratio. Drawing uses CSS px.
  W.setupCanvas = function (canvas, onResize) {
    const ctx = canvas.getContext('2d');
    const view = { ctx, w: 0, h: 0 };
    function fit() {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      view.w = canvas.clientWidth;
      view.h = canvas.clientHeight;
      canvas.width = Math.round(view.w * dpr);
      canvas.height = Math.round(view.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (onResize) onResize(view.w, view.h);
    }
    fit();
    window.addEventListener('resize', fit);
    return view;
  };

  // requestAnimationFrame loop with dt in seconds (clamped so a paused tab doesn't explode).
  W.loop = function (fn) {
    let last = performance.now();
    let running = true;
    function frame(t) {
      if (!running) return;
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      fn(dt);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return { stop() { running = false; } };
  };

  // Unified touch + mouse input, coordinates relative to the element.
  W.pointer = function (el, h) {
    function pos(e) {
      const r = el.getBoundingClientRect();
      const p = e.touches ? (e.touches[0] || e.changedTouches[0]) : e;
      return { x: p.clientX - r.left, y: p.clientY - r.top };
    }
    let mouseDown = false;
    el.addEventListener('touchstart', e => { e.preventDefault(); h.down && h.down(pos(e), e); }, { passive: false });
    el.addEventListener('touchmove', e => { e.preventDefault(); h.move && h.move(pos(e), e); }, { passive: false });
    el.addEventListener('touchend', e => { e.preventDefault(); h.up && h.up(pos(e), e); }, { passive: false });
    el.addEventListener('touchcancel', e => { h.up && h.up(pos(e), e); });
    el.addEventListener('mousedown', e => { mouseDown = true; h.down && h.down(pos(e), e); });
    window.addEventListener('mousemove', e => { if (mouseDown || h.hover) h.move && h.move(pos(e), e); });
    window.addEventListener('mouseup', e => { if (mouseDown) { mouseDown = false; h.up && h.up(pos(e), e); } });
  };

  // Swipe detection (plus arrow keys / WASD for desktop). cb('up'|'down'|'left'|'right')
  W.swipe = function (el, cb, onTap) {
    // Fires as soon as the finger travels far enough, so no need to lift it.
    let sx = 0, sy = 0, st = 0, fired = false;
    function detect(p) {
      const dx = p.x - sx, dy = p.y - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 14) return false;
      if (Math.abs(dx) > Math.abs(dy)) cb(dx > 0 ? 'right' : 'left');
      else cb(dy > 0 ? 'down' : 'up');
      return true;
    }
    W.pointer(el, {
      down(p) { sx = p.x; sy = p.y; st = Date.now(); fired = false; },
      move(p) { if (!fired) fired = detect(p); },
      up(p) {
        if (fired) return;
        if (!detect(p) && onTap && Date.now() - st < 500) onTap(p);
      },
    });
    const keys = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
    };
    window.addEventListener('keydown', e => {
      if (keys[e.key]) { e.preventDefault(); cb(keys[e.key]); }
    });
  };

  // Persistent best score. Returns the best (updating it if `score` beats it).
  W.best = function (key, score, lowerIsBetter) {
    const k = 'wg.best.' + key;
    let best = null;
    try { const v = localStorage.getItem(k); best = v === null ? null : Number(v); } catch (e) {}
    if (score !== undefined) {
      const better = best === null || (lowerIsBetter ? score < best : score > best);
      if (better) {
        best = score;
        try { localStorage.setItem(k, String(score)); } catch (e) {}
      }
    }
    return best;
  };

  // Full-screen start / game-over card. Returns the overlay element.
  W.overlay = function ({ title, big, text, button = 'Play', onStart }) {
    let o = document.getElementById('wg-overlay');
    if (!o) {
      o = document.createElement('div');
      o.id = 'wg-overlay';
      o.className = 'overlay';
      document.body.appendChild(o);
    }
    o.innerHTML =
      (title ? `<h2>${title}</h2>` : '') +
      (big !== undefined ? `<div class="big">${big}</div>` : '') +
      (text ? `<p>${text}</p>` : '') +
      `<button class="btn">${button}</button>`;
    o.classList.remove('hidden');
    const btn = o.querySelector('button');
    const go = e => {
      e.preventDefault();
      e.stopPropagation();
      o.classList.add('hidden');
      onStart && onStart();
    };
    btn.addEventListener('touchend', go);
    btn.addEventListener('click', go);
    return o;
  };
  W.hideOverlay = function () {
    const o = document.getElementById('wg-overlay');
    if (o) o.classList.add('hidden');
  };

  W.rand = (a, b) => a + Math.random() * (b - a);
  W.randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  W.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  W.pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // Every game page gets a back button to the hub.
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.body.classList.contains('game')) return;
    const a = document.createElement('a');
    a.className = 'back';
    a.href = '../index.html';
    a.setAttribute('aria-label', 'Back to games');
    a.textContent = '‹';
    a.addEventListener('touchend', e => { e.stopPropagation(); });
    document.body.appendChild(a);
  });

  window.W = W;
})();
