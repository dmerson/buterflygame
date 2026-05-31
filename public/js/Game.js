const STATE = {
  TITLE:          'TITLE',
  PLAYING:        'PLAYING',
  LIFE_LOST:      'LIFE_LOST',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  GAME_OVER:      'GAME_OVER',
  VICTORY:        'VICTORY',
};

const TOTAL_LEVELS = 5;

class Game {
  constructor(canvas, controls, ui) {
    this.canvas   = canvas;
    this.controls = controls;
    this.ui       = ui;
    this.renderer = new Renderer(canvas);

    this.state    = STATE.TITLE;
    this.score    = 0;
    this.lives    = 3;
    this.levelNum = 1;

    this.maze      = null;
    this.flowers   = [];
    this.butterfly = null;
    this.catchers  = [];

    this._lastTime = null;
    this._pauseT   = 0;

    this._showTitle();
    requestAnimationFrame(t => this._loop(t));
  }

  // ── State transitions ────────────────────────────────────────────────────────
  _showTitle() {
    this.state = STATE.TITLE;
    this.ui.showOverlay(
      '🦋 Butterfly Maze',
      'Collect all the flower pollen!\nArrow keys to move, Space to collect.',
      'Play!',
      () => { this.ui.hideOverlay(); this._startGame(); }
    );
  }

  _startGame() {
    this.score    = 0;
    this.lives    = 3;
    this.levelNum = 1;
    this._loadLevel();
  }

  _loadLevel() {
    const idx = this.levelNum - 1;
    this.maze = new Maze(idx);
    this.renderer.resize(this.maze);

    const pollenAmount = POLLEN_PER_FLOWER[idx];
    this.flowers = this.maze.flowerPositions.map(
      p => new Flower(p.col, p.row, pollenAmount)
    );

    const start = this.maze.startPos;
    this.butterfly = new Butterfly(start.col, start.row);

    // Spawn N catchers for level N
    const catcherCount = Math.min(this.levelNum, this.maze.catcherStarts.length);
    this.catchers = this.maze.catcherStarts.slice(0, catcherCount).map(
      cs => new Catcher(cs.col, cs.row, cs.id)
    );

    this.ui.setScore(this.score);
    this.ui.setLevel(this.levelNum);
    this.ui.setLives(this.lives);
    this.ui.hideOverlay();
    this.state = STATE.PLAYING;
  }

  _lifeLost() {
    this.state = STATE.LIFE_LOST;
    this.lives--;
    this.ui.setLives(this.lives);
    this.butterfly.flash();

    if (this.lives <= 0) {
      setTimeout(() => this._gameOver(), 1400);
    } else {
      setTimeout(() => {
        // Respawn butterfly at start, keep catchers
        const start = this.maze.startPos;
        this.butterfly = new Butterfly(start.col, start.row);
        this.state = STATE.PLAYING;
      }, 1400);
    }
  }

  _levelComplete() {
    this.state = STATE.LEVEL_COMPLETE;
    this.lives = Math.min(this.lives + 1, 9);
    this.ui.setLives(this.lives);

    if (this.levelNum >= TOTAL_LEVELS) {
      setTimeout(() => this._victory(), 1200);
    } else {
      this.ui.showOverlay(
        '🌸 Level Complete!',
        `You collected all the pollen!\n+1 Life   Level ${this.levelNum + 1} incoming…`,
        'Next Level',
        () => { this.levelNum++; this._loadLevel(); }
      );
    }
  }

  _gameOver() {
    this.state = STATE.GAME_OVER;
    this.ui.showOverlay(
      '😢 Caught!',
      `You were caught by the butterfly catcher!\nFinal Score: ${Math.floor(this.score)}`,
      'Try Again',
      () => this._startGame()
    );
  }

  _victory() {
    this.state = STATE.VICTORY;
    this.ui.showOverlay(
      '🏆 You Win!',
      `You collected all the pollen in every garden!\nFinal Score: ${Math.floor(this.score)}`,
      'Play Again',
      () => this._startGame()
    );
  }

  // ── Game loop ────────────────────────────────────────────────────────────────
  _loop(timestamp) {
    requestAnimationFrame(t => this._loop(t));

    if (this._lastTime === null) { this._lastTime = timestamp; }
    const dt = Math.min((timestamp - this._lastTime) / 1000, 0.1);
    this._lastTime = timestamp;

    if (this.state === STATE.PLAYING || this.state === STATE.LIFE_LOST) {
      this._update(dt);
    }

    if (this.maze) {
      this.renderer.draw(this.maze, this.flowers, this.butterfly, this.catchers);
    }

    this.controls.flush();
  }

  _update(dt) {
    const ctrl = this.controls.state;

    // dirPressed: queue on first press (works while moving — Pac-Man style pre-queuing)
    // heldDir: only apply when stationary, for smooth continuous held-key movement
    if (ctrl.dirPressed) {
      this.butterfly.queueDirection(ctrl.dirPressed);
    } else if (ctrl.heldDir && !this.butterfly.moving) {
      this.butterfly.queueDirection(ctrl.heldDir);
    } else if (!ctrl.heldDir && !ctrl.dirPressed && !this.butterfly.moving) {
      // No key held and butterfly stopped — clear stale queued direction
      this.butterfly.queuedDir = null;
    }

    this.butterfly.update(dt, this.maze, ctrl.drain, this.flowers);

    // Drain active flower if space held
    if (this.butterfly.isDraining) {
      const flower = this.flowers.find(
        f => f.col === this.butterfly.col && f.row === this.butterfly.row
      );
      if (flower) {
        const gained = flower.drain(dt);
        this.score += gained;
        this.ui.setScore(this.score);
      }
    }

    // Update flowers (animation)
    this.flowers.forEach(f => f.update(dt));

    // Update catchers
    this.catchers.forEach(c => c.update(dt, this.maze));

    // Collision check (only while playing, not during brief LIFE_LOST freeze)
    if (this.state === STATE.PLAYING) {
      // Butterfly is safe on a hedge tile — catchers can't "see" them
      const hiddenByHedge = this.maze.getTile(this.butterfly.col, this.butterfly.row) === 'H';
      if (!hiddenByHedge) {
        for (const catcher of this.catchers) {
          if (catcher.catches(this.butterfly)) {
            this._lifeLost();
            return;
          }
        }
      }

      // Level complete?
      if (this.flowers.every(f => f.depleted)) {
        this._levelComplete();
      }
    }
  }
}
