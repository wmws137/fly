import {
  CANVAS_H,
  CANVAS_W,
  DASH_ZONE_TOP,
  DEBUG,
  INV_SLOT_H,
  INV_SLOT_W,
  INV_START_X,
  INV_Y,
  LAUNCH_ANGLE_MAX,
  LAUNCH_ANGLE_MIN,
  MAX_HOLD,
  PLAYER_R,
} from './config.js';
import { clampLaunchAim, getHeightZhang, playerScreenY } from './player.js';
import { getBuffLabel } from './items.js';
import { terminalVy } from './physics.js';

export function drawPlayer(ctx, world, player) {
  const sy = player.y - world.cameraY;
  ctx.fillStyle = '#e53935';
  ctx.beginPath();
  ctx.arc(player.x, sy, PLAYER_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (player.vy < -50 || player.vx > 80 || player.vx < -80) {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x, sy);
    ctx.lineTo(player.x - player.vx * 0.08, sy - player.vy * 0.08);
    ctx.stroke();
  }

  if (player.dashFlash && performance.now() < player.dashFlash.until) {
    const t = player.dashFlash.theta;
    const len = 22;
    ctx.strokeStyle = '#ffeb3b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x, sy);
    ctx.lineTo(player.x + Math.cos(t) * len, sy - Math.sin(t) * len);
    ctx.stroke();
  }
}

export function drawHud(ctx, player, highScore) {
  const h = getHeightZhang(player);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(8, 8, 130, 28);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`${h.toFixed(1)} 丈 ↑`, 16, 28);

  const buffText = getBuffLabel(player.buff);
  if (buffText) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(CANVAS_W - 100, 8, 92, 28);
    ctx.fillStyle = '#ffeb3b';
    ctx.font = '14px sans-serif';
    ctx.fillText(buffText, CANVAS_W - 92, 28);
  }

  drawInventory(ctx, player);

  if (highScore > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '12px sans-serif';
    ctx.fillText(`最高 ${highScore.toFixed(1)} 丈`, 8, 48);
  }
}

function drawInventory(ctx, player) {
  for (let i = 0; i < player.inventory.length; i++) {
    const x = INV_START_X + i * (INV_SLOT_W + 8);
    const y = INV_Y;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x, y, INV_SLOT_W, INV_SLOT_H);
    ctx.strokeStyle = player.inventory[i] ? '#ffeb3b' : '#888';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, INV_SLOT_W, INV_SLOT_H);
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${i + 1}`, x + 4, y + 12);
    if (player.inventory[i] === 'cloud') {
      ctx.fillStyle = '#eee';
      ctx.fillText('云', x + 14, y + 30);
    } else if (player.inventory[i] === 'rocket') {
      ctx.fillStyle = '#ffb74d';
      ctx.fillText('猴', x + 14, y + 30);
    }
  }
}

export function drawChargeUi(ctx, player, holdTime, cameraY) {
  const t = Math.min(holdTime / MAX_HOLD, 1);
  const w = 120;
  const x = CANVAS_W / 2 - w / 2;
  const y = CANVAS_H - 100;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(x, y, w, 12);
  const color = t < 0.33 ? '#4caf50' : t < 0.66 ? '#ffeb3b' : '#f44336';
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * t, 12);

  const sy = player.y - cameraY;
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(player.x, sy, 20 + t * 10, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawAimLine(ctx, player, aim, cameraY) {
  const sy = playerScreenY(player, cameraY);
  const clamped = clampLaunchAim(player, aim.x, aim.y, cameraY);
  const len = 72;

  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(player.x, sy, len, -LAUNCH_ANGLE_MAX, -LAUNCH_ANGLE_MIN, true);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.x, sy);
  ctx.lineTo(clamped.x, clamped.y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(255,235,59,0.85)';
  ctx.beginPath();
  ctx.arc(clamped.x, clamped.y, 5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawReadyHint(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, CANVAS_H - 130, CANVAS_W, 130);
  ctx.fillStyle = '#ffeb3b';
  ctx.textAlign = 'center';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('蓄力起飞', CANVAS_W / 2, CANVAS_H - 108);
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.fillText('长按鼠标左键蓄力', CANVAS_W / 2, CANVAS_H - 78);
  ctx.fillText('松手发射 · 移动鼠标瞄准（45°～135°）', CANVAS_W / 2, CANVAS_H - 54);
  ctx.textAlign = 'left';
}

export function drawOverlay(ctx, title, lines, sub) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(title, CANVAS_W / 2, CANVAS_H / 2 - 40);
  ctx.font = '16px sans-serif';
  let y = CANVAS_H / 2;
  for (const line of lines) {
    ctx.fillText(line, CANVAS_W / 2, y);
    y += 28;
  }
  if (sub) {
    ctx.fillStyle = '#ccc';
    ctx.font = '14px sans-serif';
    ctx.fillText(sub, CANVAS_W / 2, CANVAS_H - 60);
  }
  ctx.textAlign = 'left';
}

export function drawStateBadge(ctx, state) {
  if (!DEBUG) return;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(CANVAS_W - 72, CANVAS_H - 22, 64, 18);
  ctx.fillStyle = '#0f0';
  ctx.font = '11px monospace';
  ctx.fillText(state, CANVAS_W - 68, CANVAS_H - 9);
}

export function drawDebug(ctx, player) {
  if (!DEBUG) return;
  ctx.fillStyle = '#0f0';
  ctx.font = '11px monospace';
  const cap = terminalVy(player.fallTime);
  ctx.fillText(`vy=${player.vy.toFixed(0)} cap=${cap.toFixed(0)}`, 8, CANVAS_H - 8);
}

export function drawDashZones(ctx, state) {
  if (state !== 'flying') return;
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fillRect(0, DASH_ZONE_TOP, CANVAS_W, CANVAS_H - DASH_ZONE_TOP);
}
