import {
  CANVAS_H,
  CANVAS_W,
  LS_HIGH_SCORE,
  MAX_HOLD,
  RESULT_DELAY,
} from './config.js';
import { createInput, pollInput } from './input.js';
import { createItems, checkPickup, drawItems, resetItems, updateItems, useItem } from './items.js';
import { applyDash, integratePlayer, updateBuff } from './physics.js';
import {
  createPlayer,
  getHeightZhang,
  launchFromAim,
  resetPlayer,
  useInventorySlot,
} from './player.js';
import {
  drawAimLine,
  drawChargeUi,
  drawDashZones,
  drawDebug,
  drawHud,
  drawOverlay,
  drawPlayer,
  drawReadyHint,
} from './ui.js';
import {
  applyWallBounds,
  checkLanding,
  createWorld,
  drawLaunchPad,
  drawWorld,
  resetWorld,
  updateCamera,
} from './world.js';

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');
  const input = createInput(canvas);
  const player = createPlayer();
  const world = createWorld();
  const items = createItems();

  const game = {
    canvas,
    ctx,
    input,
    player,
    world,
    items,
    state: 'title',
    holdTime: 0,
    resultTime: 0,
    runHeight: 0,
    highScore: loadHighScore(),
    lastTs: 0,
  };

  resetRun(game);
  requestAnimationFrame((ts) => loop(game, ts));
  return game;
}

function loadHighScore() {
  try {
    return parseFloat(localStorage.getItem(LS_HIGH_SCORE) || '0') || 0;
  } catch {
    return 0;
  }
}

function saveHighScore(v) {
  try {
    localStorage.setItem(LS_HIGH_SCORE, String(v));
  } catch {
    /* ignore */
  }
}

function resetRun(game) {
  resetPlayer(game.player);
  resetWorld(game.world, game.player);
  resetItems(game.items, game.player);
  game.holdTime = 0;
  game.runHeight = 0;
}

function loop(game, ts) {
  if (!game.lastTs) game.lastTs = ts;
  const dt = Math.min((ts - game.lastTs) / 1000, 1 / 30);
  game.lastTs = ts;

  const resultElapsed =
    game.state === 'result' ? (ts - game.resultTime) / 1000 : 0;
  const intent = pollInput(game.input, game.state, resultElapsed);

  update(game, dt, intent, ts);
  draw(game);

  requestAnimationFrame((t) => loop(game, t));
}

function update(game, dt, intent, ts) {
  const { player, world, items, state } = game;

  if (state === 'title') {
    if (intent.startGame) {
      game.state = 'ready';
      resetRun(game);
    }
    return;
  }

  if (state === 'ready') {
    if (intent.charging) {
      game.holdTime += dt;
      if (game.holdTime > MAX_HOLD) game.holdTime = MAX_HOLD;
    }
    if (intent.releaseLaunch) {
      launchFromAim(player, game.holdTime, intent.aim.x, intent.aim.y);
      game.state = 'flying';
      game.holdTime = 0;
    }
    return;
  }

  if (state === 'flying') {
    if (intent.dashFire && intent.dashTheta !== null) {
      applyDash(player, intent.dashTheta);
    }
    if (intent.useSlot !== null) {
      const type = useInventorySlot(player, intent.useSlot);
      if (type) useItem(player, type);
    }

    updateBuff(player, dt);
    integratePlayer(player, dt);
    applyWallBounds(player);
    updateCamera(world, player);
    updateItems(items, player);
    checkPickup(items, player);

    const h = getHeightZhang(player);
    if (h > game.runHeight) game.runHeight = h;

    const land = checkLanding(player);
    if (land) {
      game.state = 'result';
      game.resultTime = ts;
      if (game.runHeight > game.highScore) {
        game.highScore = game.runHeight;
        saveHighScore(game.highScore);
      }
    }
    return;
  }

  if (state === 'result' && intent.restart) {
    game.state = 'ready';
    resetRun(game);
  }
}

function draw(game) {
  const { ctx, player, world, items, state } = game;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  drawWorld(ctx, world);
  drawLaunchPad(ctx, world);
  drawItems(ctx, world, items);
  drawPlayer(ctx, world, player);
  drawDashZones(ctx, state);

  if (state === 'ready') {
    drawChargeUi(ctx, player, game.holdTime, world.cameraY);
    drawAimLine(ctx, player, game.input.pointer, world.cameraY);
    drawHud(ctx, player, game.highScore);
    drawReadyHint(ctx);
  } else if (state === 'flying') {
    drawHud(ctx, player, game.highScore);
  } else if (state === 'title') {
    drawOverlay(
      ctx,
      '飞 FLY',
      ['点击开始', '蓄力 · 蹬风 · 道具 · 看你能飞多高'],
      'GitHub Pages 即玩',
    );
  } else if (state === 'result') {
    drawHud(ctx, player, game.highScore);
    const elapsed = (performance.now() - game.resultTime) / 1000;
    const sub =
      elapsed >= RESULT_DELAY
        ? '点击或 Enter 重新开始'
        : '结算中…';
    drawOverlay(
      ctx,
      '本局结束',
      [
        `本局最高：${game.runHeight.toFixed(1)} 丈`,
        `历史最高：${game.highScore.toFixed(1)} 丈`,
      ],
      sub,
    );
  }

  drawDebug(ctx, player);
}
