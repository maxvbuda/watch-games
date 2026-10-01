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

  // Digital Crown input. The crown scrolls the page, so we make the page secretly
  // scrollable and report each scroll delta (px; positive = crown turned down).
  W.crown = function (cb) {
    document.body.classList.add('crown');
    const spacer = document.createElement('div');
    spacer.id = 'crown-spacer';
    document.body.prepend(spacer);
    const MID = 100000;
    let last = MID;
    window.scrollTo(0, MID);
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      const d = y - last;
      last = y;
      if (d) cb(d);
      if (Math.abs(y - MID) > 60000) { window.scrollTo(0, MID); last = MID; }
    }, { passive: true });
  };

  // Random numbers go through W.rng so level packs can make them repeatable with a seed.
  W.rng = Math.random;
  W.seed = function (n) {
    let a = (n * 2654435761) >>> 0;   // mulberry32
    W.rng = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  W.unseed = () => { W.rng = Math.random; };
  W.shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(W.rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };

  // Level-pack support: games read settings from the URL (?seed=12&size=7&...).
  W.params = Object.fromEntries(new URLSearchParams(location.search));
  W.num = (k, def) => (W.params[k] !== undefined && !isNaN(Number(W.params[k])) ? Number(W.params[k]) : def);
  W.packKey = () => (W.params.pack ? `${W.params.pack}.${W.params.n}` : null);
  // Mark the current pack level solved (shown as ✓ in the pack list).
  W.solved = function () {
    const k = W.packKey();
    if (!k) return;
    try { localStorage.setItem('wg.done.' + k, '1'); } catch (e) {}
  };
  W.isSolved = k => { try { return localStorage.getItem('wg.done.' + k) === '1'; } catch (e) { return false; } };
  // URL of the next level in the same pack (or null outside a pack).
  W.nextLevelUrl = function () {
    if (!W.params.pack || !window.PACKS) return null;
    const pack = window.PACKS[W.params.pack], n = Number(W.params.n) + 1;
    return pack && n <= pack.count ? pack.url(n) : null;
  };

  // In a pack: seed the generator for this level (call right before generating the puzzle).
  W.packSeed = () => { if (W.params.pack) W.seed(W.num('seed', 1)); };
  // In a pack: mark solved and show "Next level". Returns false outside packs so the game shows its own result.
  W.packDone = function ({ title, big, text }) {
    if (!W.params.pack) return false;
    W.solved();
    const next = W.nextLevelUrl();
    W.overlay({
      title, big,
      text: (text ? text + '<br>' : '') + `Level ${W.params.n} ✓`,
      button: next ? 'Next level ▶' : 'Back to pack',
      onStart: () => { location.href = next || '../pack.html?id=' + encodeURIComponent(W.params.pack); },
    });
    return true;
  };
  W.packTitle = base => (W.params.pack ? `${base} #${W.params.n}` : base);

  W.rand = (a, b) => a + W.rng() * (b - a);
  W.randInt = (a, b) => Math.floor(a + W.rng() * (b - a + 1));
  W.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  W.pick = arr => arr[Math.floor(W.rng() * arr.length)];

  // Every game page gets a back button to the hub.
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.body.classList.contains('game')) return;
    const a = document.createElement('a');
    a.className = 'back';
    a.href = W.params.pack ? '../pack.html?id=' + encodeURIComponent(W.params.pack) : '../index.html';
    a.setAttribute('aria-label', 'Back to games');
    a.textContent = '‹';
    a.addEventListener('touchend', e => { e.stopPropagation(); });
    document.body.appendChild(a);
  });

  window.W = W;
})();
