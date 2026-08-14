import {
  CANVAS_H,
  CANVAS_W,
  DASH_IDLE_STOP,
  DASH_INTERVAL,
  DASH_ZONE_TOP,
  LAUNCH_X,
  RESULT_DELAY,
} from './config.js';
import { getInventorySlotAt, resolveLaunchAngle, screenToCanvas } from './player.js';
import { keysToTheta, wheelToTheta } from './physics.js';

export function createInput(canvas, getState, getLaunchContext) {
  const state = {
    canvas,
    getState,
    getLaunchContext,
    keys: new Set(),
    pointer: { x: CANVAS_W / 2, y: 200 },
    pointerDown: false,
    charging: false,
    dashTheta: null,
    dashActive: false,
    lastDashInputTs: 0,
    dashAccumulator: 0,
    useSlot: null,
    restart: false,
    releaseLaunch: false,
    releaseAngle: null,
    startGame: false,
    ignoreReleaseUntil: 0,
    pendingDash: null,
  };

  window.addEventListener('keydown', (e) => {
    state.keys.add(e.key);
    if (e.key === 'Enter') e.preventDefault();
    if (e.key === '1') state.useSlot = 0;
    if (e.key === '2') state.useSlot = 1;
    if (e.key === '3') state.useSlot = 2;
  });

  window.addEventListener('keyup', (e) => {
    state.keys.delete(e.key);
  });

  window.addEventListener('mousemove', (e) => {
    if (getState() !== 'ready') return;
    state.pointer = screenToCanvas(canvas, e.clientX, e.clientY);
  });

  function onWheel(e) {
    if (getState() !== 'flying') return;
    e.preventDefault();
    const theta = wheelToTheta(e.deltaX, e.deltaY);
    if (theta !== null) queueDash(state, theta);
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('wheel', onWheel, { passive: false });

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  canvas.addEventListener('mousemove', (e) => {
    state.pointer = screenToCanvas(canvas, e.clientX, e.clientY);
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    state.pointerDown = true;
    state.pointer = screenToCanvas(canvas, e.clientX, e.clientY);
    onPointerDown(state);
  });

  canvas.addEventListener('mouseup', (e) => {
    if (e.button !== 0) return;
    state.pointerDown = false;
    state.pointer = screenToCanvas(canvas, e.clientX, e.clientY);
    onPointerUp(state);
  });

  canvas.addEventListener('mouseleave', () => {
    if (state.charging && getState() === 'ready') {
      tryRelease(state);
    }
  });

  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    e.preventDefault();
    state.pointerDown = true;
    state.pointer = screenToCanvas(canvas, e.clientX, e.clientY);
    onPointerDown(state);
  });

  canvas.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse') return;
    state.pointerDown = false;
    state.pointer = screenToCanvas(canvas, e.clientX, e.clientY);
    onPointerUp(state);
  });

  canvas.addEventListener('pointermove', (e) => {
    state.pointer = screenToCanvas(canvas, e.clientX, e.clientY);
  });

  return state;
}

export function resetDashInput(input) {
  input.dashTheta = null;
  input.dashActive = false;
  input.dashAccumulator = 0;
  input.pendingDash = null;
}

export function markReadyInput(input) {
  input.charging = false;
  input.pointerDown = false;
  input.releaseLaunch = false;
  input.releaseAngle = null;
  input.ignoreReleaseUntil = performance.now() + 300;
}

export function updatePointer(input, clientX, clientY) {
  input.pointer = screenToCanvas(input.canvas, clientX, clientY);
}

export function releaseCharge(input) {
  if (!input.charging) return false;
  if (performance.now() < input.ignoreReleaseUntil) return false;
  const ctx = input.getLaunchContext?.();
  if (ctx) {
    input.releaseAngle = resolveLaunchAngle(
      ctx.player,
      input.pointer.x,
      input.pointer.y,
      ctx.cameraY,
    );
  }
  input.releaseLaunch = true;
  input.charging = false;
  input.pointerDown = false;
  return true;
}

function queueDash(state, theta) {
  state.dashTheta = theta;
  state.dashActive = true;
  state.lastDashInputTs = performance.now();
  state.dashAccumulator = DASH_INTERVAL;
  state.pendingDash = theta;
}

function inChargeZone(p) {
  return p.y > DASH_ZONE_TOP && Math.abs(p.x - LAUNCH_X) < CANVAS_W * 0.4;
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

function onPointerDown(state) {
  const gs = state.getState();
  const p = state.pointer;
  const slot = getInventorySlotAt(p.x, p.y);
  if (slot >= 0 && gs === 'flying') {
    state.useSlot = slot;
    return;
  }
  if (gs === 'title') {
    state.startGame = true;
    return;
  }
  if (gs === 'ready') {
    if (performance.now() >= state.ignoreReleaseUntil) {
      state.charging = true;
    }
    return;
  }
  if (gs === 'result') {
    state.restart = true;
  }
}

function tryRelease(state) {
  releaseCharge(state);
}

function onPointerUp(state) {
  const gs = state.getState();
  if (gs === 'ready' && state.charging) {
    tryRelease(state);
    return;
  }
  if (gs === 'flying' && inDashZone(state.pointer)) {
    const theta = tapToTheta(state.pointer);
    if (theta !== null) queueDash(state, theta);
  }
}

export function pollInput(input, gameState, resultElapsed) {
  const releaseLaunch = input.releaseLaunch;
  const releaseAngle = input.releaseAngle;
  const useSlot = input.useSlot;
  const startGame = input.startGame;
  input.startGame = false;
  input.useSlot = null;
  input.releaseLaunch = false;
  input.releaseAngle = null;

  const out = {
    charging: false,
    releaseLaunch: false,
    launchAngle: null,
    aim: { x: input.pointer.x, y: input.pointer.y },
    dashFire: false,
    dashTheta: null,
    useSlot,
    restart: false,
    startGame,
  };

  if (gameState === 'title') {
    if (input.keys.has('Enter')) out.startGame = true;
    return out;
  }

  if (gameState === 'ready') {
    if (input.pointerDown) input.charging = true;
    out.charging = input.charging;
    if (releaseLaunch) {
      out.releaseLaunch = true;
      out.launchAngle = releaseAngle;
    }
    return out;
  }

  if (gameState === 'flying') {
    const now = performance.now();
    const keyTheta = keysToTheta(input.keys);
    if (keyTheta !== null) queueDash(input, keyTheta);

    if (input.pendingDash !== null) {
      out.dashFire = true;
      out.dashTheta = input.pendingDash;
      input.pendingDash = null;
    }

    if (input.dashActive && now - input.lastDashInputTs > DASH_IDLE_STOP * 1000) {
      input.dashActive = false;
      input.dashTheta = null;
    }

    input.dashAccumulator += 1 / 60;
    if (
      input.dashActive &&
      input.dashTheta !== null &&
      input.dashAccumulator >= DASH_INTERVAL
    ) {
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
    if (input.keys.has('Enter')) out.restart = true;
  }

  return out;
}
