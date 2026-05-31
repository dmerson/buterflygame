window.addEventListener('load', () => {
  // Register service worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  const canvas   = document.getElementById('game-canvas');
  const controls = new Controls();
  const ui       = new UI();

  new Game(canvas, controls, ui);
});
