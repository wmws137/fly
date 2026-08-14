import {
  CAMERA_PLAYER_ANCHOR,
  CANVAS_H,
  CANVAS_W,
  INVENTORY_SIZE,
  INV_SLOT_H,
  INV_SLOT_W,
  INV_START_X,
  INV_Y,
  LAUNCH_ANGLE_MAX,
  LAUNCH_ANGLE_MIN,
  LAUNCH_X,
  LAUNCH_Y,
  MAX_HOLD,
  MAX_LAUNCH_SPEED,
  MIN_LAUNCH_SPEED,
  PLAYER_R,
  PX_TO_ZHANG,
} from './config.js';

export function createPlayer() {
  const y = LAUNCH_Y - PLAYER_R - 2;
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
  return Math.max(0, (player.launchY - player.minY) * PX_TO_ZHANG);
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
  return player.buff.type === 'cloud' || player.buff.type === 'rocket';
}

export function setDashFlash(player, theta) {
  player.dashFlash = { theta, until: performance.now() + 200 };
}

export function playerScreenY(player, cameraY) {
  return player.y - cameraY;
}

/** 与 launchFromAim 共用：屏幕坐标系下解析发射角（弧度，45°～135°） */
export function resolveLaunchAngle(player, aimX, aimY, cameraY) {
  const sy = playerScreenY(player, cameraY);
  const dx = aimX - player.x;
  const dy = -(aimY - sy);
  let angle = Math.atan2(dy, dx);
  if (!Number.isFinite(angle)) angle = Math.PI / 2;
  return Math.max(LAUNCH_ANGLE_MIN, Math.min(LAUNCH_ANGLE_MAX, angle));
}

/** 限制在 45°～135° 的瞄准预览终点（屏幕坐标） */
export function clampLaunchAim(player, aimX, aimY, cameraY) {
  const sy = playerScreenY(player, cameraY);
  const angle = resolveLaunchAngle(player, aimX, aimY, cameraY);
  const dist = Math.max(48, Math.hypot(aimX - player.x, aimY - sy));
  return {
    x: player.x + Math.cos(angle) * dist,
    y: sy - Math.sin(angle) * dist,
    angle,
  };
}

export function launchFromAim(player, holdTime, aimX, aimY, cameraY) {
  const angle = resolveLaunchAngle(player, aimX, aimY, cameraY);
  const t = Math.min(holdTime / MAX_HOLD, 1);
  const speed = MIN_LAUNCH_SPEED + (MAX_LAUNCH_SPEED - MIN_LAUNCH_SPEED) * t;
  player.vx = speed * Math.cos(angle);
  player.vy = -speed * Math.sin(angle);
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
    const sx = INV_START_X + i * (INV_SLOT_W + 8);
    if (isPointInRect(x, y, sx, INV_Y, INV_SLOT_W, INV_SLOT_H)) return i;
  }
  return -1;
}
