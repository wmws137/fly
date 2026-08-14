import {
  CANVAS_H,
  CANVAS_W,
  DT_MAX,
  LS_HIGH_SCORE,
  MAX_HOLD,
  MIN_HOLD_LAUNCH,
  NO_ITEM_FALL_LIMIT,
  RESULT_DELAY,
} from './config.js';
import { createInput, markReadyInput, pollInput, releaseCharge, resetDashInput, updatePointer } from './input.js';
import { createItems, checkPickup, drawItems, resetItems, updateItems, useItem } from './items.js';
import { createParticles, drawParticles, resetParticles, updateParticles } from './particles.js';
import { applyDash, integratePlayer, updateBuff } from './physics.js';
import {
  clampLaunchAim,
  createPlayer,
  getHeightZhang,
  hasFallSupport,
  launchFromAngle,
  resetPlayer,
  screenToCanvas,
  useInventorySlot,
} from './player.js';
import {
  drawAimLine,
  drawChargeUi,
  drawDashZones,
  drawDebug,
  drawDashWheel,
  drawHud,
  drawOverlay,
  drawPlayer,
  drawReadyHint,
  drawTitleScreen,
  drawStateBadge,
} from './ui.js';
import {
  applyWallBounds,
  checkLanding,
  createWorld,
  drawLaunchPad,
  drawWorld,
  forceLandOnGround,
  resetWorld,
  updateCamera,
} from './world.js';

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D 不可用');

  const player = createPlayer();
  const world = createWorld();
  const items = createItems();
  const particles = createParticles();

  const game = {
    canvas,
    ctx,
    input: null,
    player,
    world,
    items,
    particles,
    state: 'title',
    holdTime: 0,
    resultTime: 0,
    runHeight: 0,
    launchAim: null,
    noItemFallTime: 0,
    highScore: loadHighScore(),
    lastTs: 0,
  };

  game.input = createInput(canvas, () => game.state, () => ({
    player: game.player,
    cameraY: game.world.cameraY,
  }));
  bindGlobalInput(game);
  resetRun(game);
  requestAnimationFrame((ts) => loop(game, ts));
  return game;
}

function canRestart(game) {
  return (
    game.state === 'result' &&
    (performance.now() - game.resultTime) / 1000 >= RESULT_DELAY
  );
}

function bindGlobalInput(game) {
  const onDown = (clientX, clientY) => {
    game.input.pointer = screenToCanvas(game.canvas, clientX, clientY);
    if (game.state === 'title') {
      enterReady(game);
      return;
    }
    if (game.state === 'result') {
      if (canRestart(game)) enterReady(game);
      return;
    }
    if (game.state === 'ready' && game.input.readyArmed && performance.now() >= game.input.ignoreReleaseUntil) {
      game.input.charging = true;
    }
  };

  const onUp = (clientX, clientY) => {
    if (game.state !== 'ready' || !game.input.charging) return;
    if (clientY != null) updatePointer(game.input, clientX, clientY);
    releaseCharge(game.input);
  };

  window.addEventListener(
    'mousedown',
    (e) => {
      if (e.button !== 0) return;
      onDown(e.clientX, e.clientY);
    },
    true,
  );

  window.addEventListener(
    'mouseup',
    (e) => {
      if (e.button !== 0) return;
      onUp(e.clientX, e.clientY);
    },
    true,
  );

  window.addEventListener(
    'keydown',
    (e) => {
      if (game.state === 'title') {
        if (e.code === 'Enter') {
          enterReady(game);
          e.preventDefault();
        }
        return;
      }
      if (game.state === 'result') {
        if (e.code === 'Enter' && canRestart(game)) {
          enterReady(game);
          e.preventDefault();
        }
        return;
      }
    },
    true,
  );
}

function enterReady(game) {
  if (game.state !== 'title' && game.state !== 'result') return;
  const fromResult = game.state === 'result';
  game.state = 'ready';
  resetRun(game);
  markReadyInput(game.input, { armed: fromResult });
}

function loadHighScore() {
  try {
    return parseFloat(localStorage.getItem(LS_HIGH_SCORE) || '0') || 0;
  } catch (_err) {
    return 0;
  }
}

function saveHighScore(v) {
  try {
    localStorage.setItem(LS_HIGH_SCORE, String(v));
  } catch (_err) {
    /* ignore */
  }
}

function resetRun(game) {
  resetPlayer(game.player);
  resetWorld(game.world, game.player);
  resetItems(game.items, game.player);
  resetParticles(game.particles);
  game.holdTime = 0;
  game.runHeight = 0;
  game.noItemFallTime = 0;
}

function loop(game, ts) {
  if (!game.lastTs) game.lastTs = ts;
  const dt = Math.min((ts - game.lastTs) / 1000, DT_MAX);
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
    if (intent.startGame) enterReady(game);
    return;
  }

  if (state === 'ready') {
    updateCamera(world, player, dt);
    game.launchAim = clampLaunchAim(
      player,
      game.input.pointer.x,
      game.input.pointer.y,
      world.cameraY,
      game.holdTime,
    );
    if (intent.charging) {
      game.holdTime += dt;
      if (game.holdTime > MAX_HOLD) game.holdTime = MAX_HOLD;
    }
    if (intent.releaseLaunch && intent.launchAngle != null && game.holdTime > MIN_HOLD_LAUNCH) {
      launchFromAngle(player, game.holdTime, intent.launchAngle);
      game.state = 'flying';
      game.holdTime = 0;
      game.launchAim = null;
      resetDashInput(game.input);
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
    updateCamera(world, player, dt);
    updateItems(items, player);
    checkPickup(items, player, game.particles);
    updateParticles(game.particles, dt);

    if (player.vy > 0 && !hasFallSupport(player)) {
      game.noItemFallTime += dt;
      if (game.noItemFallTime >= NO_ITEM_FALL_LIMIT) {
        forceLandOnGround(player);
        game.noItemFallTime = 0;
      }
    } else {
      game.noItemFallTime = 0;
    }

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

  if (state === 'result' && intent.restart && canRestart(game)) {
    enterReady(game);
  }
}

function draw(game) {
  const { ctx, player, world, items, state } = game;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  drawWorld(ctx, world);
  drawLaunchPad(ctx, world);
  drawItems(ctx, world, items);
  drawPlayer(ctx, world, player);
  drawParticles(ctx, world, game.particles);
  drawDashZones(ctx, state);

  if (state === 'ready') {
    drawChargeUi(ctx, player, game.holdTime, world.cameraY);
    if (game.holdTime >= MIN_HOLD_LAUNCH && game.launchAim) {
      drawAimLine(ctx, player, game.launchAim, world.cameraY, game.holdTime);
    }
    drawHud(ctx, player, game.highScore);
    drawReadyHint(ctx, player, world.cameraY, game.input.readyArmed);
  } else if (state === 'flying') {
    drawHud(ctx, player, game.highScore);
    drawDashWheel(
      ctx,
      game.input.pointer,
      game.input.dashAimTheta,
      game.input.dashWheelHover,
      game.input.dashWheelDown,
      game.input.dashActive,
    );
  } else if (state === 'title') {
    drawTitleScreen(ctx);
  } else if (state === 'result') {
    drawHud(ctx, player, game.highScore);
    const elapsed = (performance.now() - game.resultTime) / 1000;
    const sub =
      elapsed >= RESULT_DELAY
        ? '点击重新开始'
        : '结算中…';
    drawOverlay(
      ctx,
      '坠落',
      [
        `本局最高：${game.runHeight.toFixed(1)} 米`,
        `历史最高：${game.highScore.toFixed(1)} 米`,
      ],
      sub,
    );
  }

  drawStateBadge(ctx, state);
  drawDebug(ctx, player);
}
