# Watch Games

80 games plus 9 level packs — 2,260 games & levels in all — built for Apple Watch Safari (they work on phones and computers too).

**Play:** https://maxvbuda.github.io/watch-games/

To open it on your watch, text yourself the link and tap it in Messages on the watch.

## Highlights
- **Digital Crown** steering/aiming in 18 games (filter the hub by ⌚ Crown): Snake.io, Blob.io, Beach Buggy, Racer, Tunnel, Asteroids, Lunar Lander, Artillery, Safe Cracker, Blocks, Bubble Shooter, and more.
- Categories: Arcade, Puzzle, Brain, Board & cards, Sports, Fun.
- Best scores are saved on the device and shown on the hub.

## Adding a game
1. Create `games/<id>.html` (copy an existing one; include `../css/watch.css` and `../js/common.js`).
2. Add it to `GAMES` and one category in `js/games.js` (and to `CROWN` if it uses `W.crown`).

`js/common.js` has the shared helpers: canvas setup, game loop, touch/swipe input, Digital Crown input, overlays and best scores.
