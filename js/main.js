import { createGame } from './game.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  createGame(canvas);
  canvas.focus();
});
