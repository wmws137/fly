import {
  CANVAS_H,
  CANVAS_W,
  DASH_WHEEL_R,
  DASH_ZONE_TOP,
  DEBUG,
  INV_SLOT_H,
  INV_SLOT_GAP,
  INV_SLOT_W,
  INV_START_X,
  INV_Y,
  LAUNCH_ANGLE_MAX,
  LAUNCH_ANGLE_MIN,
  MAX_HOLD,
  MIN_HOLD_LAUNCH,
  PLAYER_R,
} from './config.js';
import { dashWheelCenter } from './dashWheel.js';
import { dashFeedbackVisible } from './dashWheel.js';
import { clampLaunchAim, getHeightZhang, launchPreviewLength, playerScreenY } from './player.js';
import { getBuffLabel } from './items.js';
import { terminalVy } from './physics.js';

function drawDashTrail(ctx, px, sy, flash) {
  if (!flash || !dashFeedbackVisible(flash.theta)) return;
  const now = performance.now();
  if (now >= flash.until) return;

  const elapsed = now - flash.start;
  const duration = flash.until - flash.start;
  const progress = Math.min(1, elapsed / duration);
  const fade = 1 - progress;

  // 蹬风推进方向；拖尾在反方向（玩家背后）向后飘散
  const fwdX = Math.cos(flash.theta);
  const fwdY = -Math.sin(flash.theta);
  const backX = -fwdX;
  const backY = -fwdY;
  const perpX = -backY;
  const perpY = backX;

  const baseOff = PLAYER_R + 3 + progress * 38;
  const trailLen = 18 + progress * 52;
  const lineCount = 3;

  ctx.lineCap = 'round';

  for (let i = 0; i < lineCount; i++) {
    const lane = i - (lineCount - 1) / 2;
    const spread = lane * 5;
    const ox = px + backX * baseOff + perpX * spread;
    const oy = sy + backY * baseOff + perpY * spread;
    const ex = ox + backX * trailLen;
    const ey = oy + backY * trailLen;

    const grad = ctx.createLinearGradient(ox, oy, ex, ey);
    grad.addColorStop(0, `rgba(255,235,59,${0.75 * fade})`);
    grad.addColorStop(0.55, `rgba(255,193,7,${0.35 * fade})`);
    grad.addColorStop(1, 'rgba(255,235,59,0)');

    ctx.strokeStyle = grad;
    ctx.lineWidth = (3 - Math.abs(lane) * 0.6) * (0.85 + fade * 0.15);
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
}

export function drawPlayer(ctx, world, player) {
  const sy = player.y - world.cameraY;
  drawDashTrail(ctx, player.x, sy, player.dashFlash);

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
}

export function drawHud(ctx, player, highScore) {
  const h = getHeightZhang(player);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(8, 8, 130, 28);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`${h.toFixed(1)} 米`, 16, 28);

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
    ctx.fillText(`最高 ${highScore.toFixed(1)} 米`, 8, 48);
  }
}

function drawInventory(ctx, player) {
  for (let i = 0; i < player.inventory.length; i++) {
    const x = INV_START_X + i * (INV_SLOT_W + INV_SLOT_GAP);
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
    } else if (player.inventory[i] === 'charm') {
      ctx.fillStyle = '#ffb74d';
      ctx.fillText('符', x + 14, y + 30);
    }
  }
}

function chargeUiVisible(holdTime) {
  return holdTime >= MIN_HOLD_LAUNCH;
}

export function drawChargeUi(ctx, player, holdTime, cameraY) {
  if (!chargeUiVisible(holdTime)) return;

  const t = Math.min(holdTime / MAX_HOLD, 1);
  const w = 72;
  const barH = 8;
  const gap = 10;
  const sy = playerScreenY(player, cameraY);
  const x = player.x - w / 2;
  const y = sy - PLAYER_R - gap - barH;

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(x, y, w, barH);
  const color = t < 0.33 ? '#4caf50' : t < 0.66 ? '#ffeb3b' : '#f44336';
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * t, barH);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, barH);
}

export function drawAimLine(ctx, player, aim, cameraY, holdTime = 0) {
  if (!chargeUiVisible(holdTime)) return;

  const sy = playerScreenY(player, cameraY);
  const clamped =
    aim && aim.angle != null
      ? aim
      : clampLaunchAim(player, aim.x, aim.y, cameraY, holdTime);
  const len = clamped.dist ?? launchPreviewLength(holdTime);

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
}

export function drawReadyHint(ctx, player, cameraY, readyArmed) {
  const sy = playerScreenY(player, cameraY);
  const playerBottom = sy + PLAYER_R;
  const invTop = INV_Y;
  const gap = invTop - playerBottom - 12;
  if (gap < 48) return;

  const boxH = Math.min(76, gap);
  const boxY = playerBottom + 8 + (gap - boxH) * 0.5;
  const boxX = 20;
  const boxW = CANVAS_W - 40;

  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  const midY = boxY + boxH / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffeb3b';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('蓄力起飞', CANVAS_W / 2, midY - 16);
  ctx.fillStyle = '#fff';
  ctx.font = '13px sans-serif';
  ctx.fillText(readyArmed ? '长按鼠标左键蓄力 · 松手发射' : '点击屏幕开始蓄力', CANVAS_W / 2, midY + 4);
  if (readyArmed) {
    ctx.fillText('移动鼠标瞄准（45°～135°）', CANVAS_W / 2, midY + 24);
  }
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

export function drawDashWheel(ctx, pointer, dashAimTheta, dashWheelHover, dashWheelDown, dashActive) {
  const { x: cx, y: cy } = dashWheelCenter();
  const baseR = DASH_WHEEL_R;
  const engaged = dashWheelHover || dashWheelDown || dashActive;
  const outerR = baseR * (dashWheelDown ? 0.96 : engaged ? 1.03 : 1);
  const bodyAlpha = engaged ? 0.52 : 0.38;

  ctx.fillStyle = `rgba(0,0,0,${engaged ? 0.22 : 0.14})`;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR + 8, 0, Math.PI * 2);
  ctx.fill();

  const bodyGrad = ctx.createRadialGradient(
    cx - outerR * 0.25,
    cy - outerR * 0.3,
    outerR * 0.15,
    cx,
    cy,
    outerR,
  );
  bodyGrad.addColorStop(0, `rgba(255,255,255,${bodyAlpha * 0.55})`);
  bodyGrad.addColorStop(0.55, `rgba(180,180,180,${bodyAlpha * 0.45})`);
  bodyGrad.addColorStop(1, `rgba(40,40,40,${bodyAlpha * 0.65})`);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = dashWheelDown
    ? 'rgba(255,235,59,0.75)'
    : dashWheelHover
      ? 'rgba(255,235,59,0.45)'
      : 'rgba(255,255,255,0.28)';
  ctx.lineWidth = dashWheelDown ? 3 : 2;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i++) {
    const t = (i / 8) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(t) * (outerR - 3), cy - Math.sin(t) * (outerR - 3));
    ctx.lineTo(cx + Math.cos(t) * (outerR - 11), cy - Math.sin(t) * (outerR - 11));
    ctx.stroke();
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, outerR - 8, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1;
  const grooveShift = dashWheelDown ? 2 : 0;
  for (let i = -5; i <= 5; i++) {
    const gy = cy + i * 6 + grooveShift;
    ctx.beginPath();
    ctx.moveTo(cx - outerR + 6, gy);
    ctx.lineTo(cx + outerR - 6, gy);
    ctx.stroke();
  }
  ctx.restore();

  const aimTheta = dashAimTheta;
  let knobX = cx;
  let knobY = cy;
  if (aimTheta != null && engaged) {
    const off = outerR * 0.32;
    knobX = cx + Math.cos(aimTheta) * off;
    knobY = cy - Math.sin(aimTheta) * off;

    ctx.strokeStyle = dashWheelDown ? 'rgba(255,235,59,0.7)' : 'rgba(255,235,59,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(knobX, knobY);
    ctx.stroke();
  }

  const knobR = dashWheelDown ? 11 : 10;
  ctx.fillStyle = engaged ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.arc(knobX, knobY, knobR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = engaged ? 'rgba(255,235,59,0.65)' : 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
}
