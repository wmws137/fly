import {
  CANVAS_H,
  CANVAS_W,
  DASH_IDLE_STOP,
  DASH_INTERVAL,
  DASH_ZONE_TOP,
  LAUNCH_X,
  RESULT_DELAY,
} from './config.js';
import { getInventorySlotAt, screenToCanvas } from './player.js';
import { keysToTheta, wheelToTheta } from './physics.js';

export function createInput(canvas) {
  const state = {
    canvas,
    keys: new Set(),
    pointer: { x: CANVAS_W / 2, y: 200 },
    charging: false,
    dashTheta: null,
    dashActive: false,
    lastDashInputTs: 0,
    dashAccumulator: 0,
    useSlot: null,
    restart: false,
    releaseLaunch: false,
    startGame: false,
    touchId: null,
    touchOrigin: null,
    gameStateRef: 'title',
  };

  window.addEventListener('keydown', (e) => {
    state.keys.add(e.key);
    if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
    if (e.key === '1') state.useSlot = 0;
    if (e.key === '2') state.useSlot = 1;
    if (e.key === '3') state.useSlot = 2;
  });

  window.addEventListener('keyup', (e) => {
    state.keys.delete(e.key);
    if (e.key === ' ' && state.charging && state.gameStateRef === 'ready') {
      state.releaseLaunch = true;
      state.charging = false;
    }
  });

  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      if (state.gameStateRef !== 'flying') return;
      const theta = wheelToTheta(e.deltaX, e.deltaY);
      if (theta !== null) activateDash(state, theta);
    },
    { passive: false },
  );

  canvas.addEventListener('mousemove', (e) => {
    state.pointer = screenToCanvas(canvas, e.clientX, e.clientY);
  });

  canvas.addEventListener('mousedown', (e) => {
    const p = screenToCanvas(canvas, e.clientX, e.clientY);
    state.pointer = p;
    onPointerDown(state, p);
  });

  canvas.addEventListener('mouseup', (e) => {
    const p = screenToCanvas(canvas, e.clientX, e.clientY);
    state.pointer = p;
    onPointerUp(state, p);
  });

  canvas.addEventListener(
    'touchstart',
    (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      const p = screenToCanvas(canvas, t.clientX, t.clientY);
      state.pointer = p;
      state.touchId = t.identifier;
      state.touchOrigin = { ...p };
      onPointerDown(state, p);
    },
    { passive: false },
  );

  canvas.addEventListener(
    'touchmove',
    (e) => {
      e.preventDefault();
      if (state.gameStateRef !== 'flying') return;
      for (const t of e.changedTouches) {
        if (t.identifier !== state.touchId) continue;
        const p = screenToCanvas(canvas, t.clientX, t.clientY);
        state.pointer = p;
        const dx = p.x - state.touchOrigin.x;
        const dy = -(p.y - state.touchOrigin.y);
        if (Math.abs(dx) + Math.abs(dy) > 10) {
          const theta = swipeToTheta(dx, dy);
          if (theta !== null) activateDash(state, theta);
        }
      }
    },
    { passive: false },
  );

  canvas.addEventListener(
    'touchend',
    (e) => {
      e.preventDefault();
      onPointerUp(state, state.pointer);
      state.touchId = null;
    },
    { passive: false },
  );

  return state;
}

function activateDash(state, theta) {
  state.dashTheta = theta;
  state.dashActive = true;
  state.lastDashInputTs = performance.now();
}

function swipeToTheta(dx, dy) {
  if (dy < 0) {
    if (Math.abs(dx) < 1) return null;
    dy = 0;
  }
  if (Math.abs(dx) + Math.abs(dy) < 1) return null;
  const theta = Math.atan2(dy, dx);
  return Math.max(0, Math.min(Math.PI, theta));
}

function inChargeZone(p) {
  return p.y > DASH_ZONE_TOP && Math.abs(p.x - LAUNCH_X) < CANVAS_W * 0.25;
}

function inDashZone(p) {
  return p.y >= DASH_ZONE_TOP && getInventorySlotAt(p.x, p.y) < 0;
}

function tapToTheta(p) {
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H - 90;
  const dx = p.x - cx;
  const dy = -(p.y - cy);
  if (dy < 0) return dx >= 0 ? 0 : Math.PI;
  if (Math.abs(dx) + Math.abs(dy) < 1) return Math.PI / 2;
  return Math.max(0, Math.min(Math.PI, Math.atan2(dy, dx)));
}

function onPointerDown(state, p) {
  const slot = getInventorySlotAt(p.x, p.y);
  if (slot >= 0 && state.gameStateRef === 'flying') {
    state.useSlot = slot;
    return;
  }
  if (state.gameStateRef === 'title') {
    state.startGame = true;
    return;
  }
  if (state.gameStateRef === 'ready' && inChargeZone(p)) {
    state.charging = true;
    return;
  }
  if (state.gameStateRef === 'result') {
    state.restart = true;
  }
}

function onPointerUp(state, p) {
  if (state.gameStateRef === 'ready' && state.charging) {
    state.releaseLaunch = true;
    state.charging = false;
    return;
  }
  if (state.gameStateRef === 'flying' && inDashZone(p)) {
    const theta = tapToTheta(p);
    if (theta !== null) {
      activateDash(state, theta);
      state.dashAccumulator = DASH_INTERVAL;
    }
  }
}

export function pollInput(input, gameState, resultElapsed) {
  input.gameStateRef = gameState;

  const out = {
    charging: false,
    releaseLaunch: false,
    aim: { ...input.pointer },
    dashFire: false,
    dashTheta: null,
    useSlot: input.useSlot,
    restart: false,
    startGame: input.startGame,
  };
  const releaseLaunch = input.releaseLaunch;
  input.startGame = false;
  input.useSlot = null;
  input.releaseLaunch = false;

  if (gameState === 'ready') {
    const spaceDown = input.keys.has(' ');
    if (spaceDown) input.charging = true;
    out.charging = input.charging;
    if (releaseLaunch) out.releaseLaunch = true;
    return out;
  }

  if (gameState === 'flying') {
    const now = performance.now();
    const keyTheta = keysToTheta(input.keys);
    if (keyTheta !== null) activateDash(input, keyTheta);

    if (input.dashActive && now - input.lastDashInputTs > DASH_IDLE_STOP * 1000) {
      input.dashActive = false;
      input.dashTheta = null;
    }

    input.dashAccumulator += 1 / 60;
    if (input.dashActive && input.dashTheta !== null && input.dashAccumulator >= DASH_INTERVAL) {
      input.dashAccumulator = 0;
      out.dashFire = true;
      out.dashTheta = input.dashTheta;
    }
    return out;
  }

  if (gameState === 'result' && resultElapsed >= RESULT_DELAY) {
    if (input.restart) {
      out.restart = true;
      input.restart = false;
    }
    if (input.keys.has('Enter') || input.keys.has(' ')) out.restart = true;
  }

  if (gameState === 'title' && out.startGame) {
    /* keep */
  }

  return out;
}
