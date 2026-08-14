import { createGame } from './game.js';

function showBootError(err) {
  const box = document.createElement('pre');
  box.style.cssText = 'color:#f88;padding:16px;white-space:pre-wrap;';
  box.textContent = '游戏加载失败：\n' + (err && err.stack ? err.stack : String(err));
  document.body.appendChild(box);
}

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    showBootError(new Error('找不到 canvas 元素'));
    return;
  }
  try {
    createGame(canvas);
    canvas.focus();
  } catch (err) {
    showBootError(err);
  }
});
