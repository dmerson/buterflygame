class Flower {
  constructor(col, row, totalPollen) {
    this.col = col;
    this.row = row;
    this.totalPollen = totalPollen;
    this.remaining = totalPollen;
    this.depleted = false;
    // visual pulse when draining
    this.drainAnim = 0;
  }

  drain(dt) {
    if (this.depleted) return 0;
    const rate = 40; // pollen per second
    const amount = Math.min(this.remaining, rate * dt);
    this.remaining -= amount;
    this.drainAnim = 1;
    if (this.remaining <= 0) {
      this.remaining = 0;
      this.depleted = true;
    }
    return amount;
  }

  update(dt) {
    if (this.drainAnim > 0) {
      this.drainAnim = Math.max(0, this.drainAnim - dt * 4);
    }
  }

  get ratio() {
    return this.remaining / this.totalPollen;
  }
}
