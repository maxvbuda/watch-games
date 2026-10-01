// Level packs: each level is a game page plus settings in the URL. Levels get harder as n grows.
// url(n) is relative to games/ (the hub and pack list add the "games/" prefix).
(function () {
  const q = (game, id, n, extra) =>
    `${game}.html?pack=${id}&n=${n}&seed=${n * 7919 + id.length * 104729}` +
    Object.entries(extra).map(([k, v]) => `&${k}=${v}`).join('');
  const step = (n, every, start, max) => Math.min(max, start + Math.floor((n - 1) / every));

  const P = {
    maze: { name: 'Maze Pack', emoji: '🌀', color: '#0a84ff', count: 500, game: 'maze',
      opts: n => ({ size: step(n, 45, 6, 16) }) },
    sudoku: { name: 'Sudoku Pack', emoji: '🧠', color: '#64d2ff', count: 400, game: 'sudoku',
      opts: n => ({ blanks: step(n, 25, 12, 27) }) },
    nonogram: { name: 'Nonogram Pack', emoji: '🖼️', color: '#5e5ce6', count: 400, game: 'nonogram',
      opts: n => ({ size: n <= 150 ? 5 : n <= 300 ? 6 : 7 }) },
    pipes: { name: 'Pipes Pack', emoji: '🚰', color: '#64d2ff', count: 300, game: 'pipes',
      opts: n => ({ size: step(n, 60, 4, 8) }) },
    flood: { name: 'Flood Pack', emoji: '🌊', color: '#0a84ff', count: 200, game: 'flood',
      opts: n => ({ size: step(n, 40, 8, 12), colors: n <= 60 ? 4 : n <= 140 ? 5 : 6 }) },
    lightsout: { name: 'Lights Out Pack', emoji: '💡', color: '#ffd60a', count: 200, game: 'lightsout',
      opts: n => ({ size: n <= 70 ? 4 : n <= 150 ? 5 : 6, presses: step(n, 12, 3, 16) }) },
    fifteen: { name: 'Slide Puzzle Pack', emoji: '🧩', color: '#ff9f0a', count: 60, game: 'fifteen',
      opts: n => ({ size: n <= 20 ? 3 : n <= 50 ? 4 : 5, shuffle: 40 + n * 6 }) },
    codebreaker: { name: 'Code Breaker Pack', emoji: '🔐', color: '#bf5af2', count: 60, game: 'codebreaker',
      opts: n => ({ colors: step(n, 12, 4, 8), len: step(n, 20, 3, 5) }) },
    mines: { name: 'Minesweeper Pack', emoji: '💣', color: '#8e8e93', count: 60, game: 'mines',
      opts: n => ({ mines: step(n, 6, 6, 15) }) },
  };

  for (const [id, p] of Object.entries(P)) {
    p.id = id;
    p.url = n => q(p.game, id, n, p.opts(n));
  }
  window.PACKS = P;
})();
