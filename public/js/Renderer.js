class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileSize = 32;
  }

  resize(maze) {
    const container = this.canvas.parentElement;
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.tileSize = Math.floor(Math.min(w / maze.cols, h / maze.rows));
    this.canvas.width = this.tileSize * maze.cols;
    this.canvas.height = this.tileSize * maze.rows;
  }

  draw(maze, flowers, butterfly, catchers) {
    const { ctx, tileSize: T } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this._drawMaze(maze, T);
    flowers.forEach((f) => this._drawFlower(f, T));
    catchers.forEach((c) => this._drawCatcher(c, T));
    this._drawButterfly(butterfly, T);
  }

  // ── Maze tiles ──────────────────────────────────────────────────────────────
  _drawMaze(maze, T) {
    const { ctx } = this;
    for (let r = 0; r < maze.rows; r++) {
      for (let c = 0; c < maze.cols; c++) {
        const tile = maze.getTile(c, r);
        const x = c * T,
          y = r * T;
        switch (tile) {
          case '#':
            this._drawWall(x, y, T, maze, c, r);
            break;
          case 'H':
            this._drawHedge(x, y, T);
            break;
          default:
            this._drawPath(x, y, T);
            break;
        }
      }
    }
  }

  _drawPath(x, y, T) {
    const { ctx } = this;
    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(x, y, T, T);
    // subtle grid line
    ctx.strokeStyle = '#e8d5a8';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x + 0.25, y + 0.25, T - 0.5, T - 0.5);
  }

  _drawWall(x, y, T, maze, c, r) {
    const { ctx } = this;
    // Base wall colour
    ctx.fillStyle = '#2d6a1f';
    ctx.fillRect(x, y, T, T);

    // Rounded feel — inner highlight
    ctx.fillStyle = '#3a8a28';
    ctx.fillRect(x + 2, y + 2, T - 4, T - 4);

    // Dark border
    ctx.strokeStyle = '#1a3d0e';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);
  }

  _drawHedge(x, y, T) {
    const { ctx } = this;
    // Background path colour first
    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(x, y, T, T);

    // Draw bushy hedge circles
    const cx = x + T / 2,
      cy = y + T / 2;
    const r = T * 0.42;
    const blobColor = '#4caf50';
    const blobDark = '#388e3c';
    const offsets = [
      [0, -0.28],
      [0.28, 0.14],
      [-0.28, 0.14],
    ];
    offsets.forEach(([ox, oy]) => {
      ctx.beginPath();
      ctx.arc(cx + ox * T, cy + oy * T, r * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = blobColor;
      ctx.fill();
    });
    // Center blob
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = blobDark;
    ctx.fill();

    // Small highlight
    ctx.beginPath();
    ctx.arc(cx - r * 0.15, cy - r * 0.2, r * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fill();
  }

  // ── Flower ──────────────────────────────────────────────────────────────────
  _drawFlower(flower, T) {
    const { ctx } = this;
    const x = flower.col * T + T / 2;
    const y = flower.row * T + T / 2;

    if (flower.depleted) {
      this._drawDepletedFlower(x, y, T);
      return;
    }

    const pulse = 1 + flower.drainAnim * 0.18;
    const r = T * 0.32 * pulse;

    // Petals
    const petals = 6;
    const petalColors = ['#ff6b9d', '#ff8fab', '#ffa0c8'];
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2;
      const px = x + Math.cos(angle) * r * 0.85;
      const py = y + Math.sin(angle) * r * 0.85;
      ctx.beginPath();
      ctx.arc(px, py, r * 0.52, 0, Math.PI * 2);
      ctx.fillStyle = petalColors[i % petalColors.length];
      ctx.fill();
    }

    // Centre
    ctx.beginPath();
    ctx.arc(x, y, r * 0.52, 0, Math.PI * 2);
    ctx.fillStyle = '#ffe066';
    ctx.fill();
    ctx.strokeStyle = '#f0a500';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Pollen bar above flower
    const barW = T * 0.7;
    const barH = T * 0.1;
    const barX = x - barW / 2;
    const barY = flower.row * T + T * 0.08;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#ffe066';
    ctx.fillRect(barX, barY, barW * flower.ratio, barH);
  }

  _drawDepletedFlower(cx, cy, T) {
    const { ctx } = this;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, T * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = '#aaa';
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ── Butterfly ───────────────────────────────────────────────────────────────
  _drawButterfly(b, T) {
    const { ctx } = this;
    const cx = b.px * T + T / 2;
    const cy = b.py * T + T / 2;

    // Flash effect when life lost
    if (b.flashT > 0 && Math.floor(b.flashT * 8) % 2 === 0) return;

    ctx.save();

    // Rotate to face movement direction
    const angles = { right: 0, left: Math.PI, down: Math.PI / 2, up: -Math.PI / 2 };
    ctx.translate(cx, cy);
    ctx.rotate(angles[b.dir] || 0);

    const s = T * 0.46;
    const wingOpen = b.wingFrame === 0;
    const wingSpread = wingOpen ? s : s * 0.7;

    // Upper wings
    this._drawWing(
      ctx,
      wingSpread * 0.5,
      -wingSpread * 0.55,
      wingSpread * 0.8,
      wingSpread * 0.65,
      '#7b5ea7'
    );
    this._drawWing(
      ctx,
      -wingSpread * 0.5,
      -wingSpread * 0.55,
      wingSpread * 0.8,
      wingSpread * 0.65,
      '#7b5ea7',
      true
    );

    // Lower wings (smaller)
    this._drawWing(
      ctx,
      wingSpread * 0.4,
      wingSpread * 0.3,
      wingSpread * 0.55,
      wingSpread * 0.5,
      '#9c6dce'
    );
    this._drawWing(
      ctx,
      -wingSpread * 0.4,
      wingSpread * 0.3,
      wingSpread * 0.55,
      wingSpread * 0.5,
      '#9c6dce',
      true
    );

    // Wing pattern dots
    ctx.fillStyle = 'rgba(255,230,100,0.7)';
    [
      [wingSpread * 0.55, -wingSpread * 0.4],
      [-wingSpread * 0.55, -wingSpread * 0.4],
    ].forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(px, py, wingSpread * 0.12, 0, Math.PI * 2);
      ctx.fill();
    });

    // Body
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.15, s * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#3d2b6e';
    ctx.fill();

    // Antennae
    ctx.strokeStyle = '#3d2b6e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(s * 0.06, -s * 0.45);
    ctx.lineTo(s * 0.22, -s * 0.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.06, -s * 0.45);
    ctx.lineTo(-s * 0.22, -s * 0.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s * 0.22, -s * 0.85, s * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = '#5d4a9e';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-s * 0.22, -s * 0.85, s * 0.06, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Draining sparkle
    if (b.isDraining) {
      for (let i = 0; i < 4; i++) {
        const angle = (Date.now() / 300 + (i * Math.PI) / 2) % (Math.PI * 2);
        const sr = T * 0.5;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * sr, cy + Math.sin(angle) * sr, T * 0.06, 0, Math.PI * 2);
        ctx.fillStyle = '#ffe066';
        ctx.fill();
      }
    }
  }

  _drawWing(ctx, ox, oy, rw, rh, color, flip = false) {
    ctx.save();
    ctx.translate(ox, oy);
    if (flip) ctx.scale(-1, 1);
    ctx.beginPath();
    ctx.ellipse(0, 0, rw, rh, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.88;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── Catcher ─────────────────────────────────────────────────────────────────
  _drawCatcher(c, T) {
    const { ctx } = this;
    const cx = c.px * T + T / 2;
    const cy = c.py * T + T / 2;
    const s = T * 0.38;

    // Body (oval)
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.2, s * 0.38, s * 0.55, 0, 0, Math.PI * 2);
    ctx.fillStyle = c.color;
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.3, s * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#fde8c8';
    ctx.fill();
    ctx.strokeStyle = '#c9a880';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(cx - s * 0.1, cy - s * 0.32, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + s * 0.1, cy - s * 0.32, s * 0.07, 0, Math.PI * 2);
    ctx.fill();

    // Hat
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(cx - s * 0.38, cy - s * 0.6, s * 0.76, s * 0.15);
    ctx.fillRect(cx - s * 0.22, cy - s * 0.98, s * 0.44, s * 0.4);

    // Net pole
    const netSwing = Math.sin(Date.now() / 200) * 0.2;
    ctx.save();
    ctx.translate(cx + s * 0.35, cy - s * 0.1);
    ctx.rotate(netSwing);
    ctx.strokeStyle = '#795548';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(s * 0.7, -s * 0.8);
    ctx.stroke();

    // Net (semi-circle)
    ctx.beginPath();
    ctx.arc(s * 0.7, -s * 0.8, s * 0.32, Math.PI * 0.1, Math.PI * 1.1);
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}
