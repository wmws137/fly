import { createGame } from './game.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  createGame(canvas);
});
