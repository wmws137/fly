import {
  CANVAS_H,
  CANVAS_W,
  ITEM_INITIAL_COUNT,
  ITEM_RESET_OFFSET,
  ITEM_SEED_OFFSET,
  ITEM_SIZE,
  ITEM_SPAWN_DX,
  ITEM_SPAWN_DY_MAX,
  ITEM_SPAWN_DY_MIN,
  ITEM_SPAWN_LOOKAHEAD,
  ITEM_WEIGHT_CHARM,
  ITEM_WEIGHT_CLOUD,
  PLAYER_R,
} from './config.js';
import { addToInventory, inventoryHasSpace } from './player.js';
import { spawnPickupBurst } from './particles.js';
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
  items.nextSpawnY = player.y - ITEM_RESET_OFFSET;
  items.highestSpawned = player.y;
  seedItems(items, player.y);
}

function seedItems(items, fromY) {
  let y = fromY - ITEM_SEED_OFFSET;
  for (let i = 0; i < ITEM_INITIAL_COUNT; i++) {
    spawnOne(items, y);
    y -= rand(ITEM_SPAWN_DY_MIN, ITEM_SPAWN_DY_MAX);
  }
}

function rand(a, b) {
  return a + Math.random() * (b - a);
}

/** 按各道具权重随机类型：P(i) = weight_i / Σweight */
function pickItemType() {
  const table = [
    { type: 'cloud', weight: ITEM_WEIGHT_CLOUD },
    { type: 'charm', weight: ITEM_WEIGHT_CHARM },
  ];
  const total = table.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
  if (total <= 0) return table[0].type;
  let roll = Math.random() * total;
  for (const entry of table) {
    if (entry.weight <= 0) continue;
    roll -= entry.weight;
    if (roll < 0) return entry.type;
  }
  return table[table.length - 1].type;
}

function spawnOne(items, y) {
  const type = pickItemType();
  const x = CANVAS_W / 2 + rand(-ITEM_SPAWN_DX, ITEM_SPAWN_DX);
  items.list.push({ type, x, y, w: ITEM_SIZE, h: ITEM_SIZE, taken: false });
  items.highestSpawned = Math.min(items.highestSpawned, y);
}

export function updateItems(items, player) {
  while (player.y - ITEM_SPAWN_LOOKAHEAD < items.highestSpawned) {
    const y = items.highestSpawned - rand(ITEM_SPAWN_DY_MIN, ITEM_SPAWN_DY_MAX);
    spawnOne(items, y);
  }
  items.list = items.list.filter((it) => it.y < player.y + CANVAS_H + 200 && !it.taken);
}

export function checkPickup(items, player, particles) {
  for (const it of items.list) {
    if (it.taken) continue;
    const dx = player.x - it.x;
    const dy = player.y - it.y;
    const dist = Math.hypot(dx, dy);
    if (dist < PLAYER_R + ITEM_SIZE / 2) {
      if (inventoryHasSpace(player)) {
        addToInventory(player, it.type);
        it.taken = true;
        if (particles) spawnPickupBurst(particles, it.x, it.y);
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
      ctx.fillText('符', s.x + 6, s.y + 19);
    }
  }
}

export function getBuffLabel(buff) {
  if (!buff) return '';
  if (buff.type === 'cloud') return `云 ${buff.timeLeft.toFixed(1)}s`;
  if (buff.type === 'charm') return `神行符 ${buff.timeLeft.toFixed(1)}s`;
  return '';
}
