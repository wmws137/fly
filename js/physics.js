import {
  CLOUD_DURATION,
  CLOUD_SPEED,
  DASH_IMPULSE,
  FRICTION,
  GRAVITY_DOWN,
  GRAVITY_G,
  GRAVITY_UP,
  ROCKET_GLIDE_DECAY,
  ROCKET_GLIDE_DURATION,
  ROCKET_IMPULSE,
  TERMINAL_STRIP_RATIO,
  TERMINAL_VY_BASE,
  TERMINAL_VY_MAX,
  TERMINAL_VY_RATE,
} from './config.js';
import { buffBlocksVerticalDash, setDashFlash } from './player.js';

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
}

export function applyDash(player, theta) {
  let dvx = DASH_IMPULSE * Math.cos(theta);
  let dvy = -DASH_IMPULSE * Math.sin(theta);

  if (buffBlocksVerticalDash(player)) dvy = 0;

  const cap = terminalVy(player.fallTime);
  if (player.vy >= cap * TERMINAL_STRIP_RATIO) dvy = 0;

  player.vx += dvx;
  player.vy += dvy;
  setDashFlash(player, theta);
}

export function updateBuff(player, dt) {
  if (!player.buff) return;

  const b = player.buff;
  b.timeLeft -= dt;

  if (b.type === 'cloud') {
    player.vy = -CLOUD_SPEED;
    player.vx *= 0.95;
  } else if (b.type === 'rocket') {
    if (b.phase === 'burst') {
      if (player.vy > -ROCKET_IMPULSE * 0.35) player.vy = -ROCKET_IMPULSE * 0.35;
      if (b.timeLeft <= ROCKET_GLIDE_DURATION) {
        b.phase = 'glide';
      }
    } else {
      player.vy *= ROCKET_GLIDE_DECAY;
      if (player.vy > -80) player.vy = -80;
    }
  }

  if (b.timeLeft <= 0) player.buff = null;
}

export function startBuff(player, type) {
  if (type === 'cloud') {
    player.buff = { type, timeLeft: CLOUD_DURATION };
  } else if (type === 'rocket') {
    player.vy = -ROCKET_IMPULSE;
    player.buff = {
      type,
      timeLeft: ROCKET_GLIDE_DURATION + 0.5,
      phase: 'burst',
    };
  }
}

export function wheelToTheta(deltaX, deltaY) {
  let rawDx = deltaX;
  let rawDy = -deltaY;
  if (Math.abs(rawDx) + Math.abs(rawDy) < 1) return null;

  if (rawDy < 0) {
    if (Math.abs(rawDx) < 1) return null;
    rawDy = 0;
  }

  let theta = Math.atan2(rawDy, rawDx);
  return Math.max(0, Math.min(Math.PI, theta));
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
