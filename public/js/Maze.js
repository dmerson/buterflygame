class Maze {
  constructor(levelIndex) {
    this.levelIndex = levelIndex;
    this.grid = LEVELS[levelIndex].map(row => [...row]);
    this.rows = this.grid.length;
    this.cols = this.grid[0].length;
    this._parse();
  }

  _parse() {
    this.startPos = null;
    this.catcherStarts = [];
    this.flowerPositions = [];

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = this.grid[r][c];
        if (t === 'S') {
          this.startPos = { col: c, row: r };
          this.grid[r][c] = '.';
        } else if (t >= '1' && t <= '5') {
          this.catcherStarts.push({ col: c, row: r, id: Number(t) });
          this.grid[r][c] = '.';
        } else if (t === 'F') {
          this.flowerPositions.push({ col: c, row: r });
        }
      }
    }
    this.catcherStarts.sort((a, b) => a.id - b.id);
  }

  getTile(col, row) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return '#';
    return this.grid[row][col];
  }

  isWalkable(col, row) {
    const t = this.getTile(col, row);
    return t === '.' || t === 'F' || t === 'H';
  }

  // Returns true when a hedge interrupts the straight line between two points.
  // Used by catchers to determine if butterfly is hidden.
  hedgeBetween(col1, row1, col2, row2) {
    if (col1 === col2) {
      const minR = Math.min(row1, row2);
      const maxR = Math.max(row1, row2);
      for (let r = minR + 1; r < maxR; r++) {
        if (this.getTile(col1, r) === 'H') return true;
      }
    } else if (row1 === row2) {
      const minC = Math.min(col1, col2);
      const maxC = Math.max(col1, col2);
      for (let c = minC + 1; c < maxC; c++) {
        if (this.getTile(c, row1) === 'H') return true;
      }
    }
    return false;
  }

  getNeighbors(col, row) {
    return [
      { col, row: row - 1, dir: 'up' },
      { col, row: row + 1, dir: 'down' },
      { col: col - 1, row, dir: 'left' },
      { col: col + 1, row, dir: 'right' },
    ].filter(n => this.isWalkable(n.col, n.row));
  }
}
