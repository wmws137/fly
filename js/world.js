import {
  CAMERA_PLAYER_ANCHOR,
  CANVAS_H,
  CANVAS_W,
  GROUND_H,
  LAUNCH_Y,
  PLAYER_R,
  VOID_OFFSET,
  WALL_MARGIN,
  WALL_PUSH,
} from './config.js';

export function createWorld() {
  return {
    cameraY: LAUNCH_Y - CANVAS_H * CAMERA_PLAYER_ANCHOR,
  };
}

export function resetWorld(world, player) {
  world.cameraY = player.y - CANVAS_H * CAMERA_PLAYER_ANCHOR;
}

export function worldToScreen(world, wx, wy) {
  return { x: wx, y: wy - world.cameraY };
}

export function updateCamera(world, player) {
  const target = player.y - CANVAS_H * CAMERA_PLAYER_ANCHOR;
  world.cameraY += (target - world.cameraY) * 0.12;
}

export function applyWallBounds(player) {
  const minX = WALL_MARGIN + PLAYER_R;
  const maxX = CANVAS_W - WALL_MARGIN - PLAYER_R;
  if (player.x < minX) {
    player.x = minX;
    player.vx = Math.abs(player.vx) * 0.3 + WALL_PUSH;
  }
  if (player.x > maxX) {
    player.x = maxX;
    player.vx = -Math.abs(player.vx) * 0.3 - WALL_PUSH;
  }
}

export function checkLanding(player) {
  const groundY = player.launchY + PLAYER_R;
  const voidY = player.launchY + VOID_OFFSET;
  if (player.y > voidY) return 'void';
  if (player.y >= groundY - 4 && player.vy >= 0) return 'ground';
  return null;
}

export function drawWorld(ctx, world) {
  const cam = world.cameraY;
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, '#1a3a5c');
  grad.addColorStop(1, '#87ceeb');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const platformY = LAUNCH_Y - cam;
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(0, platformY, CANVAS_W, GROUND_H + 200);
  ctx.fillStyle = '#66bb6a';
  ctx.fillRect(0, platformY, CANVAS_W, 6);

  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  for (let i = 0; i < 8; i++) {
    const ly = ((Math.floor(cam / 80) + i) * 80 - (cam % 80)) % (CANVAS_H + 80);
    ctx.beginPath();
    ctx.moveTo(0, ly);
    ctx.lineTo(CANVAS_W, ly);
    ctx.stroke();
  }
}

export function drawLaunchPad(ctx, world) {
  const p = worldToScreen(world, CANVAS_W / 2 - 40, LAUNCH_Y);
  ctx.fillStyle = '#795548';
  ctx.fillRect(p.x, p.y - 4, 80, 8);
}
