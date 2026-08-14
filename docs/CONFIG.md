# 《飞》(FLY) — 配置参数手册

> 代码权威：`js/config.js`（与本文档同步）  
> 含义详见 [PRD.md](PRD.md) §3

---

## 1. 画布与坐标

| 键 | 默认值 | 说明 |
|---|---|---|
| `CANVAS_W` | `360` | 逻辑宽 |
| `CANVAS_H` | `640` | 逻辑高 |
| `PX_TO_ZHANG` | `0.01` | 1px 高度 = 0.01 丈 |

---

## 2. 发射（蓄力）

| 键 | 默认值 | 单位 |
|---|---|---|
| `MAX_HOLD` | `2.0` | s |
| `MIN_LAUNCH_SPEED` | `200` | px/s |
| `MAX_LAUNCH_SPEED` | `600` | px/s |
| `LAUNCH_ANGLE_MIN` | `45 * DEG` | rad |
| `LAUNCH_ANGLE_MAX` | `135 * DEG` | rad |

---

## 3. 重力

| 键 | 默认值 | 单位 |
|---|---|---|
| `GRAVITY_G` | `980` | px/s² |
| `GRAVITY_UP` | `0.6` | 乘数（vy<0） |
| `GRAVITY_DOWN` | `1.2` | 乘数（vy>0） |

---

## 4. 蹬风

| 键 | 默认值 | 单位 |
|---|---|---|
| `DASH_IMPULSE` | `180` | px/s（M） |
| `DASH_INTERVAL` | `0.15` | s |
| `DASH_IDLE_STOP` | `0.10` | s（无输入停止连发） |
| `FRICTION` | `0.92` | 每帧 vx 乘数 |

---

## 5. 终端下落

| 键 | 默认值 | 单位 |
|---|---|---|
| `TERMINAL_VY_BASE` | `800` | px/s |
| `TERMINAL_VY_RATE` | `40` | px/s²（随 fallTime） |
| `TERMINAL_VY_MAX` | `1400` | px/s |
| `TERMINAL_STRIP_RATIO` | `0.95` | 超此比例剥离向上蹬风 |

---

## 6. 玩家

| 键 | 默认值 | 单位 |
|---|---|---|
| `PLAYER_R` | `12` | px |
| `LAUNCH_Y` | `580` | 世界 y（起跳台） |
| `VOID_Y` | `900` | 落此以下结算（相对 launch 的偏移可配） |

---

## 7. 边界

| 键 | 默认值 | 单位 |
|---|---|---|
| `WALL_MARGIN` | `16` | px |
| `WALL_PUSH` | `40` | px/s（软夹逼） |

---

## 8. 道具

| 键 | 默认值 | 单位 |
|---|---|---|
| `INVENTORY_SIZE` | `3` | 格 |
| `ITEM_SPAWN_DY_MIN` | `150` | px |
| `ITEM_SPAWN_DY_MAX` | `300` | px |
| `ITEM_SPAWN_DX` | `80` | px（±随机） |
| `CLOUD_DURATION` | `3.0` | s |
| `CLOUD_SPEED` | `400` | px/s（向上） |
| `ROCKET_IMPULSE` | `650` | px/s（向上 vy） |
| `ROCKET_GLIDE_DECAY` | `0.98` | 每帧 vy 乘数（滑翔） |

---

## 9. UI / 流程

| 键 | 默认值 | 单位 |
|---|---|---|
| `RESULT_DELAY` | `0.5` | s（防误触重开） |
| `CAMERA_PLAYER_ANCHOR` | `0.35` | 屏幕高比例（锚点） |

---

## 10. 存档

| 键 | 值 |
|---|---|
| `LS_HIGH_SCORE` | `'fly_high_score'` |

---

## 11. 修订历史

| 版本 | 日期 | 内容 |
|---|---|---|
| v1.0 | 2026-08-14 | 初稿 |
