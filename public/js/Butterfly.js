const MOVE_DURATION = 0.18; // seconds per tile move

class Butterfly {
  constructor(col, row) {
    this.col = col;
    this.row = row;
    this.px = col;  // pixel-interpolated position (in tile units)
    this.py = row;
    this.moving = false;
    this.targetCol = col;
    this.targetRow = row;
    this.moveT = 0;
    this.dir = 'right';
    this.queuedDir = null;
    this.wingFrame = 0;
    this.wingT = 0;
    this.isDraining = false;
    // brief flash on life lost
    this.flashT = 0;
  }

  queueDirection(dir) {
    this.queuedDir = dir;
  }

  update(dt, maze, drainHeld, flowers) {
    // Wing flap animation
    this.wingT += dt;
    if (this.wingT > 0.12) {
      this.wingT = 0;
      this.wingFrame = 1 - this.wingFrame;
    }

    if (this.flashT > 0) this.flashT -= dt;

    // Draining: butterfly stays still
    if (!this.moving) {
      const flower = this._flowerAt(flowers);
      if (drainHeld && flower && !flower.depleted) {
        this.isDraining = true;
        return;
      }
      this.isDraining = false;

      // Try queued direction, then held direction
      const dirToTry = this.queuedDir;
      if (dirToTry) {
        const { dc, dr } = Butterfly._dirDelta(dirToTry);
        const nc = this.col + dc;
        const nr = this.row + dr;
        if (maze.isWalkable(nc, nr)) {
          this.dir = dirToTry;
          this.queuedDir = null;
          this._startMove(nc, nr);
        }
      }
    }

    if (this.moving) {
      this.isDraining = false;
      this.moveT += dt;
      const t = Math.min(this.moveT / MOVE_DURATION, 1);
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

  _startMove(col, row) {
    this.targetCol = col;
    this.targetRow = row;
    this.moveT = 0;
    this.moving = true;
  }

  _flowerAt(flowers) {
    return flowers.find(f => f.col === this.col && f.row === this.row) || null;
  }

  flash() {
    this.flashT = 1.2;
    this.moving = false;
    this.queuedDir = null;
  }

  static _dirDelta(dir) {
    return { up: { dc: 0, dr: -1 }, down: { dc: 0, dr: 1 }, left: { dc: -1, dr: 0 }, right: { dc: 1, dr: 0 } }[dir];
  }
}
