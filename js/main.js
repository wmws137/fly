function showBootError(err) {
  const box = document.createElement('pre');
  box.style.cssText = 'color:#f88;padding:16px;white-space:pre-wrap;max-width:720px;margin:0 auto;';
  box.textContent =
    '游戏加载失败：\n' +
    (err && err.stack ? err.stack : String(err)) +
    '\n\n当前路径：' +
    location.href;
  document.body.appendChild(box);
}

function fitCanvas(canvas) {
  const scale = Math.min(window.innerWidth / 360, window.innerHeight / 640, 1);
  const w = Math.max(180, Math.floor(360 * scale));
  const h = Math.max(320, Math.floor(640 * scale));
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
}

export function bootGame() {
  const canvas = document.getElementById('game');
  if (!canvas) {
    showBootError(new Error('找不到 canvas 元素'));
    return;
  }

  fitCanvas(canvas);
  window.addEventListener('resize', () => fitCanvas(canvas));

  return import('./game.js')
    .then((mod) => {
      window.__flyGame = mod.createGame(canvas);
      canvas.focus();
    })
    .catch(showBootError);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGame);
} else {
  bootGame();
}
