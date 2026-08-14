import {
  CANVAS_W,
  DASH_AIM_SMOOTH,
  DASH_IDLE_STOP,
  DASH_INTERVAL,
  DASH_WHEEL_HIT_PAD,
  RESULT_DELAY,
  READY_IGNORE_RELEASE_MS,
} from './config.js';
import { dashWheelHitTest, pointerToDashTheta, smoothAngle } from './dashWheel.js';
import { getInventorySlotAt, resolveLaunchAngle, screenToCanvas } from './player.js';
import { wheelToTheta } from './physics.js';

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
    dashAimTheta: null,
    dashWheelHover: false,
    dashWheelDown: false,
    dashActive: false,
    lastDashInputTs: 0,
    lastDashFireTs: 0,
    useSlot: null,
    restart: false,
    releaseLaunch: false,
    releaseAngle: null,
    startGame: false,
    ignoreReleaseUntil: 0,
    readyArmed: false,
    pendingDash: null,
    dashAimSmooth: null,
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
    state.pointer = screenToCanvas(canvas, e.clientX, e.clientY);
    updateDashWheelPointer(state);
  });

  function onWheel(e) {
    if (getState() !== 'flying') return;
    e.preventDefault();
    const p = screenToCanvas(canvas, e.clientX, e.clientY);
    let theta = null;
    if (dashWheelHitTest(p.x, p.y)) {
      theta = pointerToDashTheta(p.x, p.y);
    } else {
      theta = wheelToTheta(e.deltaX, e.deltaY);
    }
    if (theta !== null) noteWheelDash(state, theta);
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('wheel', onWheel, { passive: false });

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  canvas.addEventListener('mousemove', (e) => {
    state.pointer = screenToCanvas(canvas, e.clientX, e.clientY);
    updateDashWheelPointer(state);
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
    if (getState() === 'flying' && !state.dashWheelDown) {
      state.dashWheelHover = false;
      state.dashAimTheta = null;
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
    updateDashWheelPointer(state);
  });

  return state;
}

export function resetDashInput(input) {
  input.dashTheta = null;
  input.dashAimTheta = null;
  input.dashWheelHover = false;
  input.dashWheelDown = false;
  input.dashActive = false;
  input.pendingDash = null;
  input.lastDashFireTs = 0;
  input.lastDashInputTs = 0;
  input.dashAimSmooth = null;
}

export function markReadyInput(input, { armed = false } = {}) {
  input.charging = false;
  input.pointerDown = false;
  input.releaseLaunch = false;
  input.releaseAngle = null;
  input.readyArmed = armed;
  input.ignoreReleaseUntil = performance.now() + READY_IGNORE_RELEASE_MS;
}

export function updatePointer(input, clientX, clientY) {
  input.pointer = screenToCanvas(input.canvas, clientX, clientY);
  updateDashWheelPointer(input);
}

function updateDashWheelPointer(state) {
  if (state.getState() !== 'flying') {
    state.dashWheelHover = false;
    if (!state.dashWheelDown) state.dashAimTheta = null;
    return;
  }

  const p = state.pointer;
  const over = dashWheelHitTest(p.x, p.y);
  state.dashWheelHover = over || state.dashWheelDown;

  if (over || state.dashWheelDown) {
    setDashAim(state, p.x, p.y);
  } else if (!state.dashWheelDown) {
    state.dashAimTheta = null;
  }
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

function setDashAim(state, px, py) {
  const raw = pointerToDashTheta(px, py);
  state.dashAimSmooth = smoothAngle(state.dashAimSmooth, raw, DASH_AIM_SMOOTH);
  state.dashAimTheta = state.dashAimSmooth;
  state.dashTheta = state.dashAimSmooth;
  return state.dashAimSmooth;
}

function noteWheelDash(state, theta) {
  const now = performance.now();
  state.dashAimSmooth = smoothAngle(state.dashAimSmooth, theta, DASH_AIM_SMOOTH);
  state.dashTheta = state.dashAimSmooth;
  state.dashAimTheta = state.dashAimSmooth;
  state.dashActive = true;
  state.lastDashInputTs = now;
  if (now - state.lastDashFireTs >= DASH_INTERVAL * 1000) {
    state.pendingDash = state.dashAimSmooth;
  }
}

function onPointerDown(state) {
  const gs = state.getState();
  const p = state.pointer;

  if (gs === 'flying' && dashWheelHitTest(p.x, p.y)) {
    state.dashWheelDown = true;
    noteWheelDash(state, pointerToDashTheta(p.x, p.y));
    return;
  }

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
    if (!state.readyArmed) return;
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
  if (gs === 'ready') {
    if (!state.readyArmed) {
      state.readyArmed = true;
      state.charging = false;
      return;
    }
    if (state.charging) {
      tryRelease(state);
    }
    return;
  }
  if (gs === 'flying') {
    state.dashWheelDown = false;
    if (!dashWheelHitTest(state.pointer.x, state.pointer.y)) {
      state.dashWheelHover = false;
      state.dashAimTheta = null;
    }
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
    if (
      input.pointerDown &&
      input.readyArmed &&
      performance.now() >= input.ignoreReleaseUntil
    ) {
      input.charging = true;
    }
    out.charging = input.charging;
    if (releaseLaunch) {
      out.releaseLaunch = true;
      out.launchAngle = releaseAngle;
    }
    return out;
  }

  if (gameState === 'flying') {
    const now = performance.now();

    if (input.dashWheelDown) {
      input.dashActive = true;
      input.lastDashInputTs = now;
      setDashAim(input, input.pointer.x, input.pointer.y);
      if (now - input.lastDashFireTs >= DASH_INTERVAL * 1000) {
        input.pendingDash = input.dashAimSmooth;
      }
    } else if (input.dashWheelHover) {
      setDashAim(input, input.pointer.x, input.pointer.y);
    }

    if (input.pendingDash !== null) {
      out.dashFire = true;
      out.dashTheta = input.pendingDash;
      input.pendingDash = null;
      input.lastDashFireTs = now;
    } else if (
      input.dashActive &&
      input.dashTheta !== null &&
      now - input.lastDashFireTs >= DASH_INTERVAL * 1000
    ) {
      out.dashFire = true;
      out.dashTheta = input.dashTheta;
      input.lastDashFireTs = now;
    }

    if (input.dashActive && now - input.lastDashInputTs > DASH_IDLE_STOP * 1000) {
      input.dashActive = false;
      input.dashTheta = null;
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
