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

export function createInput(canvas, getState) {
  const state = {
    canvas,
    getState,
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
    startGame: false,
    ignoreReleaseUntil: 0,
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
    if (e.key === ' ' && state.charging && getState() === 'ready') {
      tryRelease(state);
    }
  });

  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      if (getState() !== 'flying') return;
      const theta = wheelToTheta(e.deltaX, e.deltaY);
      if (theta !== null) activateDash(state, theta);
    },
    { passive: false },
  );

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

export function markReadyInput(input) {
  input.charging = false;
  input.pointerDown = false;
  input.releaseLaunch = false;
  input.ignoreReleaseUntil = performance.now() + 300;
}

function activateDash(state, theta) {
  state.dashTheta = theta;
  state.dashActive = true;
  state.lastDashInputTs = performance.now();
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
    state.charging = true;
    return;
  }
  if (gs === 'result') {
    state.restart = true;
  }
}

function tryRelease(state) {
  if (performance.now() < state.ignoreReleaseUntil) return;
  state.releaseLaunch = true;
  state.charging = false;
  state.pointerDown = false;
}

function onPointerUp(state) {
  const gs = state.getState();
  if (gs === 'ready' && state.charging) {
    tryRelease(state);
    return;
  }
  if (gs === 'flying' && inDashZone(state.pointer)) {
    const theta = tapToTheta(state.pointer);
    if (theta !== null) {
      activateDash(state, theta);
      state.dashAccumulator = DASH_INTERVAL;
    }
  }
}

export function pollInput(input, gameState, resultElapsed) {
  const out = {
    charging: false,
    releaseLaunch: false,
    aim: { x: input.pointer.x, y: input.pointer.y },
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

  if (gameState === 'title') {
    if (input.keys.has('Enter') || input.keys.has(' ')) out.startGame = true;
    return out;
  }

  if (gameState === 'ready') {
    if (input.keys.has(' ')) input.charging = true;
    if (input.pointerDown) input.charging = true;
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

  return out;
}
