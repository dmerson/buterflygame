# Butterfly Maze

A Pac-Man-style maze game built as a Progressive Web App. You play as a butterfly navigating garden paths, draining pollen from flowers while avoiding butterfly catchers. The game has 5 levels; each level adds one more catcher and increases pollen per flower.

---

## Starting the Application

**Prerequisites:** Node.js (v16 or later)

```bash
# Install dependencies (first time only)
npm install

# Generate PWA icons (first time only)
node generate-icons.js

# Start the server
npm start
```

Then open **http://localhost:3001** in your browser.

To install as a mobile app, open that URL on your phone and use your browser's "Add to Home Screen" option.

---

## Technical Structure

```
game1/
├── server.js               # Express static file server (port 3001)
├── generate-icons.js       # One-time PNG icon generator (no npm deps — uses built-in zlib)
├── package.json
├── public/
│   ├── index.html          # App shell: canvas, HUD, overlay, on-screen controls
│   ├── manifest.json       # PWA manifest (standalone display, theme colour, icons)
│   ├── sw.js               # Service worker — cache-first strategy for offline play
│   ├── css/
│   │   └── style.css       # Layout, HUD, on-screen D-pad, overlay, responsive rules
│   ├── icons/              # 192×192 and 512×512 PNG icons (generated)
│   └── js/
│       ├── main.js         # Entry point: registers service worker, boots Game
│       ├── levels.js       # 5 level grid definitions + pollen-per-flower constants
│       ├── Game.js         # Game loop (requestAnimationFrame) and state machine
│       ├── Maze.js         # Grid parser: tile queries, walkability, hedge line-of-sight
│       ├── Butterfly.js    # Player entity: grid movement, direction queuing, drain logic
│       ├── Catcher.js      # Enemy entity: random-walk AI, catch detection, line-of-sight
│       ├── Flower.js       # Pollen store per tile: drain rate, depletion, animation state
│       ├── Renderer.js     # All canvas drawing: maze, entities, animations
│       ├── Controls.js     # Keyboard + on-screen D-pad input; exposes edge/held signals
│       └── UI.js           # HUD updates (score, level, lives) and overlay management
```

### Server

`server.js` is a minimal Express app that serves the `public/` directory as static files. No API routes — all game logic runs client-side in the browser.

### Game Loop & State Machine

`Game.js` drives everything via `requestAnimationFrame`. States:

| State | Description |
|---|---|
| `TITLE` | Splash screen shown on load |
| `PLAYING` | Normal gameplay |
| `LIFE_LOST` | Brief freeze after a catch; butterfly flashes |
| `LEVEL_COMPLETE` | All flowers drained; award +1 life, load next level |
| `GAME_OVER` | All lives lost |
| `VICTORY` | All 5 levels completed |

### Level Grid Format

Each level in `levels.js` is a 21×21 2D character array:

| Char | Meaning |
|---|---|
| `#` | Wall (impassable) |
| `.` | Path |
| `F` | Flower (has pollen) |
| `H` | Hedge (walkable; blocks catcher line-of-sight) |
| `S` | Butterfly start position |
| `1`–`5` | Catcher start positions |

All 5 levels share the same wall layout to guarantee full maze connectivity. Only flower, hedge, and catcher positions vary between levels.

### Movement System

Both the butterfly and catchers use grid-based movement: each entity stores a current tile `(col, row)` and lerps its pixel position toward the next tile over a fixed duration (butterfly: 180 ms/tile, catcher: 280 ms/tile).

The butterfly uses Pac-Man-style direction queuing: a new direction pressed during a move is held and applied at the next tile boundary if the path is clear.

### Hedge Hiding

When the butterfly stands on an `H` tile it is completely hidden — catchers cannot trigger a catch regardless of proximity. Catchers can also not see the butterfly through a hedge tile in a straight line (checked in `Maze.hedgeBetween()`).

### PWA / Offline

`sw.js` uses a cache-first strategy: all static assets are pre-cached on install. The app works fully offline after the first load and can be installed to a phone home screen via `manifest.json`.
