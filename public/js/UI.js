class UI {
  constructor() {
    this._score = document.getElementById('score');
    this._lives = document.getElementById('lives');
    this._level = document.getElementById('level');
    this._overlay = document.getElementById('overlay');
    this._title = document.getElementById('overlay-title');
    this._msg = document.getElementById('overlay-message');
    this._btn = document.getElementById('overlay-btn');
  }

  setScore(n) {
    this._score.textContent = Math.floor(n);
  }
  setLevel(n) {
    this._level.textContent = n;
  }
  setLives(n) {
    const BUTTERFLY = '🦋';
    this._lives.textContent = BUTTERFLY.repeat(Math.max(0, n));
  }

  showOverlay(title, message, btnLabel, onBtn) {
    this._title.textContent = title;
    this._msg.textContent = message;
    this._btn.textContent = btnLabel;
    this._btn.onclick = onBtn;
    this._overlay.classList.remove('hidden');
  }

  hideOverlay() {
    this._overlay.classList.add('hidden');
  }
}
