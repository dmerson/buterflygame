const CATCHER_SPEED = 0.28; // seconds per tile (slower than butterfly)
const SIGHT_RANGE = 8; // tiles

const CATCHER_COLORS = ['#e74c3c', '#e67e22', '#9b59b6', '#1abc9c', '#e91e8c'];

class Catcher {
  constructor(col, row, id) {
    this.col = col;
    this.row = row;
    this.px = col;
    this.py = row;
    this.id = id; // 1-based
    this.color = CATCHER_COLORS[(id - 1) % CATCHER_COLORS.length];
    this.moving = false;
    this.targetCol = col;
    this.targetRow = row;
    this.moveT = 0;
    this.dir = 'down';
    this.lastDir = null;
    this.netFrame = 0;
    this.netT = 0;
  }

  update(dt, maze) {
    this.netT += dt;
    if (this.netT > 0.3) {
      this.netT = 0;
      this.netFrame = 1 - this.netFrame;
    }

    if (!this.moving) {
      this._chooseMove(maze);
    }

    if (this.moving) {
      this.moveT += dt;
      const t = Math.min(this.moveT / CATCHER_SPEED, 1);
      this.px = this.col + (this.targetCol - this.col) * t;
      this.py = this.row + (this.targetRow - this.row) * t;
      if (t >= 1) {
        this.col = this.targetCol;
        this.row = this.targetRow;
        this.px = this.col;
        this.py = this.row;
        this.moving = false;
      }
    }
  }

  _chooseMove(maze) {
    const neighbors = maze.getNeighbors(this.col, this.row);
    if (neighbors.length === 0) return;

    // Avoid reversing unless it's the only option
    const opposite = Catcher._opposite(this.lastDir);
    let options = neighbors.filter((n) => n.dir !== opposite);
    if (options.length === 0) options = neighbors;

    const chosen = options[Math.floor(Math.random() * options.length)];
    this.lastDir = chosen.dir;
    this.dir = chosen.dir;
    this.targetCol = chosen.col;
    this.targetRow = chosen.row;
    this.moveT = 0;
    this.moving = true;
  }

  // Returns true if this catcher can "see" the butterfly (same row or col,
  // no wall or hedge in between, and butterfly not on a hedge tile).
  canSee(butterfly, maze) {
    const bCol = butterfly.col;
    const bRow = butterfly.row;

    // If butterfly is on a hedge, they are hidden
    if (maze.getTile(bCol, bRow) === 'H') return false;

    const sameRow = this.row === bRow;
    const sameCol = this.col === bCol;
    if (!sameRow && !sameCol) return false;

    const dist = sameRow ? Math.abs(this.col - bCol) : Math.abs(this.row - bRow);
    if (dist > SIGHT_RANGE) return false;

    return !maze.hedgeBetween(this.col, this.row, bCol, bRow);
  }

  // Collision: within 0.6 tile distance
  catches(butterfly) {
    const dx = this.px - butterfly.px;
    const dy = this.py - butterfly.py;
    return Math.sqrt(dx * dx + dy * dy) < 0.6;
  }

  static _opposite(dir) {
    return { up: 'down', down: 'up', left: 'right', right: 'left' }[dir] || null;
  }
}
