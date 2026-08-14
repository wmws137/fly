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
    cloudSeed: Math.random() * 1000,
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

function drawCloudLayer(ctx, world) {
  const scroll = world.cameraY * 0.2;
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (let i = 0; i < 6; i++) {
    const baseY = ((Math.floor(scroll / 120) + i) * 120 - (scroll % 120)) % (CANVAS_H + 120);
    const x = ((i * 97 + world.cloudSeed * 13) % CANVAS_W) - 20;
    ctx.beginPath();
    ctx.ellipse(x, baseY, 34, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 28, baseY + 4, 26, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMountainLayer(ctx, world) {
  const scroll = world.cameraY * 0.5;
  ctx.fillStyle = 'rgba(30,60,40,0.45)';
  for (let i = 0; i < 5; i++) {
    const baseY = CANVAS_H - 80 + ((scroll + i * 140) % 280) - 140;
    const cx = (i * 110 + 40) % CANVAS_W;
    ctx.beginPath();
    ctx.moveTo(cx - 70, baseY + 80);
    ctx.lineTo(cx, baseY);
    ctx.lineTo(cx + 70, baseY + 80);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawWorld(ctx, world) {
  const cam = world.cameraY;
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, '#1a3a5c');
  grad.addColorStop(0.55, '#4a90c2');
  grad.addColorStop(1, '#87ceeb');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawCloudLayer(ctx, world);
  drawMountainLayer(ctx, world);

  const platformY = LAUNCH_Y - cam;
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(0, platformY, CANVAS_W, GROUND_H + 200);
  ctx.fillStyle = '#66bb6a';
  ctx.fillRect(0, platformY, CANVAS_W, 6);

  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  for (let i = 0; i < 10; i++) {
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
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x + 40, p.y - 8, 14, 0, Math.PI * 2);
  ctx.stroke();
}
