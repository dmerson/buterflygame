const KEY_DIR_MAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

class Controls {
  constructor() {
    this.state = {
      drain: false,
      heldDir: null,   // direction key currently held
      dirPressed: null, // edge signal: new direction this frame
    };
    this._heldKeys = new Set();
    this._bindKeys();
    this._bindOnScreen();
  }

  // Call once per frame after reading state; clears edge signals
  flush() {
    this.state.dirPressed = null;
  }

  _bindKeys() {
    document.addEventListener('keydown', e => {
      const dir = KEY_DIR_MAP[e.code];
      if (dir) {
        e.preventDefault();
        if (!this._heldKeys.has(e.code)) {
          this.state.dirPressed = dir; // edge signal
        }
        this._heldKeys.add(e.code);
        this.state.heldDir = dir;
        return;
      }
      if (e.code === 'Space') { this.state.drain = true; e.preventDefault(); }
      if (e.code === 'Enter') this._overlayClick();
    });

    document.addEventListener('keyup', e => {
      const dir = KEY_DIR_MAP[e.code];
      if (dir) {
        this._heldKeys.delete(e.code);
        // Set heldDir to another held direction key if any, else null
        const remaining = [...this._heldKeys].map(k => KEY_DIR_MAP[k]).filter(Boolean);
        this.state.heldDir = remaining.length ? remaining[remaining.length - 1] : null;
      }
      if (e.code === 'Space') this.state.drain = false;
    });
  }

  _bindOnScreen() {
    const dirs = ['up', 'down', 'left', 'right'];
    dirs.forEach(dir => {
      const btn = document.getElementById(`btn-${dir}`);
      if (!btn) return;
      const press = (e) => { e.preventDefault(); this.state.dirPressed = dir; btn.classList.add('pressed'); };
      const release = () => btn.classList.remove('pressed');
      btn.addEventListener('touchstart', press, { passive: false });
      btn.addEventListener('touchend', release);
      btn.addEventListener('mousedown', press);
      btn.addEventListener('mouseup', release);
      btn.addEventListener('mouseleave', release);
    });

    const drainBtn = document.getElementById('btn-drain');
    if (drainBtn) {
      const on  = (e) => { e.preventDefault(); this.state.drain = true;  drainBtn.classList.add('pressed'); };
      const off = ()  => { this.state.drain = false; drainBtn.classList.remove('pressed'); };
      drainBtn.addEventListener('touchstart', on, { passive: false });
      drainBtn.addEventListener('touchend', off);
      drainBtn.addEventListener('mousedown', on);
      drainBtn.addEventListener('mouseup', off);
      drainBtn.addEventListener('mouseleave', off);
    }
  }

  _overlayClick() {
    document.getElementById('overlay-btn')?.click();
  }
}
