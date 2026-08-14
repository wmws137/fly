import {
  CLOUD_DURATION,
  CLOUD_SPEED,
  CLOUD_VX_DECAY,
  DASH_IMPULSE,
  FRICTION,
  GRAVITY_DOWN,
  GRAVITY_G,
  GRAVITY_UP,
  ROCKET_BURST_DECAY,
  ROCKET_BURST_DURATION,
  ROCKET_BURST_MIN_VY_RATIO,
  ROCKET_GLIDE_DURATION,
  ROCKET_GLIDE_MIN_FALL_VY,
  ROCKET_IMPULSE,
  TERMINAL_STRIP_RATIO,
  TERMINAL_VY_BASE,
  TERMINAL_VY_MAX,
  TERMINAL_VY_RATE,
} from './config.js';
import { buffBlocksVerticalDash, setDashFlash } from './player.js';
import { clampDashTheta } from './dashWheel.js';

export function terminalVy(fallTime) {
  return Math.min(TERMINAL_VY_BASE + fallTime * TERMINAL_VY_RATE, TERMINAL_VY_MAX);
}

export function integratePlayer(player, dt) {
  const scale = player.vy < 0 ? GRAVITY_UP : GRAVITY_DOWN;
  player.vy += GRAVITY_G * scale * dt;

  const cap = terminalVy(player.fallTime);
  if (player.vy > cap) player.vy = cap;

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  player.vx *= FRICTION;

  if (player.y < player.minY) player.minY = player.y;

  if (player.vy > 0) player.fallTime += dt;

  const b = player.buff;
  if (
    b?.type === 'cloud' &&
    b.phase === 'glide' &&
    ROCKET_GLIDE_MIN_FALL_VY > 0 &&
    player.vy > ROCKET_GLIDE_MIN_FALL_VY
  ) {
    player.vy = ROCKET_GLIDE_MIN_FALL_VY;
  }
}

export function applyDash(player, theta) {
  let dvx = DASH_IMPULSE * Math.cos(theta);
  let dvy = -DASH_IMPULSE * Math.sin(theta);

  // 下半圆（向下）：只保留左右冲量，不施加向下动量
  if (Math.sin(theta) < 0) {
    dvy = 0;
  } else {
    if (buffBlocksVerticalDash(player)) dvy = 0;

    const cap = terminalVy(player.fallTime);
    if (player.vy >= cap * TERMINAL_STRIP_RATIO) dvy = 0;
  }

  player.vx += dvx;
  player.vy += dvy;
  setDashFlash(player, theta);
}

export function updateBuff(player, dt) {
  if (!player.buff) return;

  const b = player.buff;
  b.timeLeft -= dt;

  if (b.type === 'cloud') {
    if (b.phase === 'burst') {
      player.vy *= ROCKET_BURST_DECAY;
      if (player.vy > -ROCKET_IMPULSE * ROCKET_BURST_MIN_VY_RATIO) {
        player.vy = -ROCKET_IMPULSE * ROCKET_BURST_MIN_VY_RATIO;
      }
      if (b.timeLeft <= ROCKET_GLIDE_DURATION && b.phase === 'burst') {
        b.phase = 'glide';
      }
    }
    // 滑翔：不固定 vy，重力与蹬风正常生效；下落上限见 integratePlayer
  } else if (b.type === 'charm') {
    // 神行符：持续直线上升
    player.vy = -CLOUD_SPEED;
    player.vx *= CLOUD_VX_DECAY;
  }

  if (b.timeLeft <= 0) player.buff = null;
}

export function startBuff(player, type) {
  if (type === 'cloud') {
    player.vy = -ROCKET_IMPULSE;
    player.buff = {
      type,
      timeLeft: ROCKET_BURST_DURATION + ROCKET_GLIDE_DURATION,
      phase: 'burst',
    };
  } else if (type === 'charm') {
    player.buff = { type, timeLeft: CLOUD_DURATION };
  }
}

export function wheelToTheta(deltaX, deltaY) {
  const rawDx = deltaX;
  const rawDy = -deltaY;
  return clampDashTheta(rawDx, rawDy);
}

export function keysToTheta(keys) {
  let dx = 0;
  let dy = 0;
  if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) dx += 1;
  if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) dx -= 1;
  if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) dy += 1;
  if (dy <= 0 && dx === 0) return null;
  if (dy <= 0) {
    return dx > 0 ? 0 : Math.PI;
  }
  return Math.atan2(dy, dx);
}
