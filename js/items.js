import {
  CANVAS_H,
  CANVAS_W,
  ITEM_SIZE,
  ITEM_SPAWN_DX,
  ITEM_SPAWN_DY_MAX,
  ITEM_SPAWN_DY_MIN,
  PLAYER_R,
} from './config.js';
import { addToInventory, inventoryHasSpace } from './player.js';
import { startBuff } from './physics.js';
import { worldToScreen } from './world.js';

export function createItems() {
  return {
    list: [],
    nextSpawnY: null,
    highestSpawned: Infinity,
  };
}

export function resetItems(items, player) {
  items.list = [];
  items.nextSpawnY = player.y - 200;
  items.highestSpawned = player.y;
  seedItems(items, player.y);
}

function seedItems(items, fromY) {
  let y = fromY - 120;
  for (let i = 0; i < 12; i++) {
    spawnOne(items, y);
    y -= rand(ITEM_SPAWN_DY_MIN, ITEM_SPAWN_DY_MAX);
  }
}

function rand(a, b) {
  return a + Math.random() * (b - a);
}

function spawnOne(items, y) {
  const type = Math.random() < 0.5 ? 'cloud' : 'rocket';
  const x = CANVAS_W / 2 + rand(-ITEM_SPAWN_DX, ITEM_SPAWN_DX);
  items.list.push({ type, x, y, w: ITEM_SIZE, h: ITEM_SIZE, taken: false });
  items.highestSpawned = Math.min(items.highestSpawned, y);
}

export function updateItems(items, player) {
  while (player.y - 400 < items.highestSpawned) {
    const y = items.highestSpawned - rand(ITEM_SPAWN_DY_MIN, ITEM_SPAWN_DY_MAX);
    spawnOne(items, y);
  }
  items.list = items.list.filter((it) => it.y < player.y + CANVAS_H + 200 && !it.taken);
}

export function checkPickup(items, player) {
  for (const it of items.list) {
    if (it.taken) continue;
    const dx = player.x - it.x;
    const dy = player.y - it.y;
    const dist = Math.hypot(dx, dy);
    if (dist < PLAYER_R + ITEM_SIZE / 2) {
      if (inventoryHasSpace(player)) {
        addToInventory(player, it.type);
        it.taken = true;
      }
    }
  }
}

export function useItem(player, type) {
  startBuff(player, type);
}

export function drawItems(ctx, world, items) {
  for (const it of items.list) {
    if (it.taken) continue;
    const s = worldToScreen(world, it.x - it.w / 2, it.y - it.h / 2);
    if (s.y < -50 || s.y > 700) continue;
    if (it.type === 'cloud') {
      ctx.fillStyle = '#eeeeee';
      ctx.fillRect(s.x, s.y, it.w, it.h);
      ctx.fillStyle = '#333';
      ctx.font = '14px sans-serif';
      ctx.fillText('云', s.x + 6, s.y + 19);
    } else {
      ctx.fillStyle = '#ff9800';
      ctx.fillRect(s.x, s.y, it.w, it.h);
      ctx.fillStyle = '#fff';
      ctx.font = '14px sans-serif';
      ctx.fillText('猴', s.x + 6, s.y + 19);
    }
  }
}

export function getBuffLabel(buff) {
  if (!buff) return '';
  if (buff.type === 'cloud') return `云 ${buff.timeLeft.toFixed(1)}s`;
  if (buff.type === 'rocket') return `猴 ${buff.timeLeft.toFixed(1)}s`;
  return '';
}
