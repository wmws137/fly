# 《飞》(FLY) — 技术规范

> 需求：[PRD.md](PRD.md) · 流程：[DEV_PLAN.md](DEV_PLAN.md) · 常量：[CONFIG.md](CONFIG.md)

---

## 1. 技术栈

| 项 | 选择 |
|---|---|
| 渲染 | HTML5 Canvas 2D |
| 语言 | ES6+ JavaScript（无 TypeScript） |
| 构建 | 无；`<script type="module">` 直接加载 |
| 部署 | GitHub Pages 静态托管 |
| 存档 | `localStorage` |

---

## 2. 目录与模块职责

```
js/
├── config.js      # 常量（与 CONFIG.md 同步）
├── main.js        # DOMContentLoaded、启动 game
├── game.js        # 状态机、主循环 update/draw
├── input.js       # 统一输入 → 意图（蓄力/θ/槽位/重开）
├── physics.js     # 重力、蹬风、摩擦、终端速度
├── player.js      # 位置/速度、蓄力、发射、Buff、背包
├── items.js       # 道具实体、生成、碰撞、Buff 应用
├── world.js       # 相机、背景、起跳台、边界、虚空
└── ui.js          # HUD、首屏、结算层绘制
```

**依赖方向**（禁止循环依赖）：

```text
config ← physics, player, items, world, ui, input, game
input → game（只读状态写意图）
game → player, items, world, ui, physics
player → physics, config
items → player, config
```

---

## 3. 坐标系

| 约定 | 说明 |
|---|---|
| Canvas | 原点左上；x 右正；y **下**正 |
| 世界坐标 | 与 Canvas 同向；相机 `cameraY` 表示世界上移量 |
| 屏幕→世界 | `worldY = screenY + cameraY` |
| 高度（丈） | `(launchY - minPlayerY) × PX_TO_ZHANG` |

---

## 4. 游戏状态机

```javascript
// game.js
const State = {
  TITLE: 'title',
  READY: 'ready',     // 可蓄力
  FLYING: 'flying',
  RESULT: 'result',
};
```

| 转换 | 条件 |
|---|---|
| TITLE → READY | 点击/Enter 开始 |
| READY → FLYING | 松手/松空格发射 |
| FLYING → RESULT | 触地或落虚空 |
| RESULT → READY | 重开（0.5s 后） |

---

## 5. 主循环

```javascript
function loop(ts) {
  const dt = Math.min((ts - last) / 1000, 1 / 30);
  last = ts;
  input.poll();                    // 收集本帧事件
  if (state === State.FLYING) {
    physics.integratePlayer(dt);
    physics.applyDashIfDue(dt);    // 0.15s 间隔
    items.update(dt);
    world.updateCamera();
    player.updateBuffs(dt);
    items.checkPickup();
    world.checkBounds();
    world.checkLanding();
  }
  draw();
  requestAnimationFrame(loop);
}
```

---

## 6. 输入层（input.js）

### 6.1 输出意图结构

```javascript
{
  charging: boolean,       // ready 态蓄力
  releaseLaunch: boolean,  // 本帧发射
  aimScreen: { x, y },     // 瞄准屏幕坐标
  dashTheta: number | null, // 当前蹬风角（弧度），null=无
  useSlot: number | null,   // 0|1|2
  restart: boolean,
}
```

### 6.2 滚轮 → θ

```javascript
function wheelToTheta(deltaX, deltaY) {
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
```

### 6.3 持续蹬风

- 记录 `lastWheelTs`；`ts - lastWheelTs > 100` → 停止连发
- `dashAccumulator += dt`；`>= DASH_INTERVAL` 时触发一次 applyDash(theta)

---

## 7. 物理（physics.js）

### 7.1 重力

```javascript
function gravityScale(vy) {
  return vy < 0 ? GRAVITY_UP : GRAVITY_DOWN;
}
// vy += g * gravityScale(vy) * dt
```

### 7.2 蹬风 apply

```javascript
function applyDash(player, theta) {
  let m = DASH_IMPULSE;
  let dvx = m * Math.cos(theta);
  let dvy = -m * Math.sin(theta);

  if (player.buffBlocksVerticalDash) dvy = 0;
  if (player.vy >= terminalVy() * 0.95) dvy = 0;

  player.vx += dvx;
  player.vy += dvy;
}
```

### 7.3 摩擦

```javascript
player.vx *= FRICTION; // 每帧
```

---

## 8. 玩家（player.js）

```javascript
{
  x, y, vx, vy,
  state: 'grounded' | 'air',
  maxHeight: 0,
  inventory: [null, null, null],  // 'cloud' | 'rocket' | null
  buff: null,                       // { type, until }
  fallTime: 0,
}
```

### 8.1 发射

```javascript
const speed = lerp(MIN_LAUNCH, MAX_LAUNCH, hold / MAX_HOLD);
const angle = clamp(aimAngle, LAUNCH_ANGLE_MIN, LAUNCH_ANGLE_MAX);
player.vx = speed * Math.cos(angle);
player.vy = -speed * Math.sin(angle);
```

---

## 9. 道具与 Buff（items.js）

| type | 拾取 id | Buff 行为 |
|---|---|---|
| 筋斗云 | `cloud` | 3s：`vy = -CLOUD_SPEED`；`vx = 0`；禁垂直蹬风 |
| 窜天猴 | `rocket` | 瞬间 `vy = -ROCKET_IMPULSE`；随后 vy 缓衰减；禁垂直蹬风 |

**生成**：`spawnY = lastSpawnY - random(150, 300)`；`spawnX = center + random(-80, 80)`

---

## 10. UI 绘制（ui.js）

- 首屏 / 结算：DOM overlay 或 Canvas 文字（MVP 用 Canvas `fillText`）
- 背包：3 格矩形 + 文字「云」「猴」
- 高度：`${height.toFixed(1)} 丈`

---

## 11. 调试（开发期）

`config.js` 设 `DEBUG = true` 时屏幕左上角显示：

- `vy`, `terminalVy`, `theta°`, `state`, `buff`

---

## 12. 修订历史

| 版本 | 日期 | 内容 |
|---|---|---|
| v1.0 | 2026-08-14 | 初稿 |
