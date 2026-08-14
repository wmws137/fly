import {
  CAMERA_PLAYER_ANCHOR,
  CANVAS_H,
  CANVAS_W,
  DASH_FLASH_MS,
  INVENTORY_SIZE,
  INV_SLOT_GAP,
  INV_SLOT_H,
  INV_SLOT_W,
  INV_START_X,
  INV_Y,
  LAUNCH_ANGLE_MAX,
  LAUNCH_ANGLE_MIN,
  LAUNCH_PREVIEW_MAX,
  LAUNCH_PREVIEW_MIN,
  LAUNCH_X,
  LAUNCH_Y,
  MAX_HOLD,
  MAX_LAUNCH_SPEED,
  MIN_LAUNCH_SPEED,
  PLAYER_R,
  PLAYER_SPAWN_OFFSET,
  PX_TO_METER,
} from './config.js';
import { dashFeedbackVisible } from './dashWheel.js';

export function createPlayer() {
  const y = LAUNCH_Y - PLAYER_R - PLAYER_SPAWN_OFFSET;
  return {
    x: LAUNCH_X,
    y,
    vx: 0,
    vy: 0,
    minY: y,
    launchY: y,
    fallTime: 0,
    inventory: Array(INVENTORY_SIZE).fill(null),
    buff: null,
    holdTime: 0,
    charging: false,
    dashFlash: null,
  };
}

export function resetPlayer(player) {
  Object.assign(player, createPlayer());
}

export function getHeightZhang(player) {
  return Math.max(0, (player.launchY - player.minY) * PX_TO_METER);
}

export function inventoryHasSpace(player) {
  return player.inventory.some((s) => s === null);
}

export function addToInventory(player, type) {
  const idx = player.inventory.indexOf(null);
  if (idx === -1) return false;
  player.inventory[idx] = type;
  return true;
}

export function useInventorySlot(player, slot) {
  const type = player.inventory[slot];
  if (!type) return null;
  player.inventory[slot] = null;
  return type;
}

export function buffBlocksVerticalDash(player) {
  if (!player.buff) return false;
  if (player.buff.type === 'charm') return true;
  if (player.buff.type === 'cloud' && player.buff.phase === 'burst') return true;
  return false;
}

/** 是否仍有道具续飞（Buff 或背包非空） */
export function hasFallSupport(player) {
  if (player.buff) return true;
  return player.inventory.some((s) => s !== null);
}

export function setDashFlash(player, theta) {
  if (!dashFeedbackVisible(theta)) return;
  const start = performance.now();
  player.dashFlash = { theta, start, until: start + DASH_FLASH_MS };
}

export function playerScreenY(player, cameraY) {
  return player.y - cameraY;
}

/** 与 launchFromAim 共用：屏幕坐标系下解析发射角（弧度，45°～135°） */
export function resolveLaunchAngle(player, aimX, aimY, cameraY) {
  const sy = playerScreenY(player, cameraY);
  const dx = aimX - player.x;
  const dy = -(aimY - sy);

  // 鼠标在玩家下方或同高：仅按左右决定 45° / 135°
  if (dy <= 0) {
    return dx >= 0 ? LAUNCH_ANGLE_MIN : LAUNCH_ANGLE_MAX;
  }

  let angle = Math.atan2(dy, dx);
  if (!Number.isFinite(angle)) angle = Math.PI / 2;
  return Math.max(LAUNCH_ANGLE_MIN, Math.min(LAUNCH_ANGLE_MAX, angle));
}

/** 瞄准预览线长度：仅随蓄力强度变化，与鼠标距离无关 */
export function launchPreviewLength(holdTime) {
  const t = Math.min(Math.max(holdTime, 0) / MAX_HOLD, 1);
  return LAUNCH_PREVIEW_MIN + (LAUNCH_PREVIEW_MAX - LAUNCH_PREVIEW_MIN) * t;
}

/** 限制在 45°～135° 的瞄准预览终点（屏幕坐标） */
export function clampLaunchAim(player, aimX, aimY, cameraY, holdTime = 0) {
  const sy = playerScreenY(player, cameraY);
  const angle = resolveLaunchAngle(player, aimX, aimY, cameraY);
  const dist = launchPreviewLength(holdTime);
  return {
    x: player.x + Math.cos(angle) * dist,
    y: sy - Math.sin(angle) * dist,
    angle,
    dist,
  };
}

export function launchFromAngle(player, holdTime, angle) {
  const t = Math.min(holdTime / MAX_HOLD, 1);
  const speed = MIN_LAUNCH_SPEED + (MAX_LAUNCH_SPEED - MIN_LAUNCH_SPEED) * t;
  player.vx = speed * Math.cos(angle);
  player.vy = -speed * Math.sin(angle);
}

export function launchFromAim(player, holdTime, aimX, aimY, cameraY) {
  launchFromAngle(player, holdTime, resolveLaunchAngle(player, aimX, aimY, cameraY));
}

export function screenToCanvas(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || CANVAS_W;
  const h = rect.height || CANVAS_H;
  return {
    x: ((clientX - rect.left) / w) * CANVAS_W,
    y: ((clientY - rect.top) / h) * CANVAS_H,
  };
}

export function isPointInRect(x, y, rx, ry, rw, rh) {
  return x >= rx && x < rx + rw && y >= ry && y < ry + rh;
}

export function getInventorySlotAt(x, y) {
  for (let i = 0; i < INVENTORY_SIZE; i++) {
    const sx = INV_START_X + i * (INV_SLOT_W + INV_SLOT_GAP);
    if (isPointInRect(x, y, sx, INV_Y, INV_SLOT_W, INV_SLOT_H)) return i;
  }
  return -1;
}
