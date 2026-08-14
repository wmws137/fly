# 《飞》(FLY) — 开发流程

> 需求：[PRD.md](PRD.md) · 技术：[TECH.md](TECH.md) · 常量：[CONFIG.md](CONFIG.md)  
> 仓库：`fly` · 栈：HTML5 Canvas + Vanilla JS · 部署：GitHub Pages

---

## 1. 开发原则

1. **先可玩，再好看**：几何占位上线，美术/音效 Phase B+ 再做
2. **按阶段验收**：每阶段有明确「跑通清单」，通过才进下一阶段
3. **常量集中**：所有可调数值只改 [CONFIG.md](CONFIG.md) / `js/config.js`
4. **PRD 为准**：实现与 PRD 冲突时，先改文档再改代码
5. **单文件可测**：核心逻辑尽量纯函数，便于控制台/单元自测

---

## 2. 阶段总览

| 阶段 | 内容 | 估时 | 验收 |
|---|---|---|---|
| **P0** | 项目骨架 + Canvas 主循环 | 0.5d | 空白画布 9:16 letterbox，FPS 稳定 |
| **P1** | 物理 + 蓄力发射 | 1d | 一次弹射，非对称重力，45°～135° |
| **P2** | 向量蹬风 + 输入 | 1.5d | 滚/滑 θ 分解；终端速度剥离向上分量 |
| **P3** | 世界 + 镜头 + 结算 | 1d | 高度计分，触地/虚空结算，重开 |
| **P4** | 道具 + 3 格背包 + Buff | 1.5d | 拾取/使用/筋斗云/窜天猴 |
| **P5** | UI + 存档 + 抛光 | 1d | HUD、首屏、最高分 localStorage |
| **P6** | GitHub Pages 发布 | 0.5d | 公网可玩 README |

**MVP 合计约 7 天**（含联调 buffer）

```text
P0 → P1 → P2 → P3 → P4 → P5 → P6
         ↑ 核心手感在此阶段调参
```

---

## 3. 各阶段详情

### P0 — 项目骨架

**产出文件**：
- `index.html`、`css/style.css`
- `js/main.js`、`js/game.js`、`js/config.js`

**任务**：
- [ ] 360×640 逻辑 Canvas，CSS 居中 letterbox
- [ ] `requestAnimationFrame` 主循环，`dt` clamp
- [ ] 状态机骨架：`title | ready | flying | result`
- [ ] 移动端 viewport meta，`touch-action: none`

**验收**：F5 打开见渐变背景 + 「FLY」标题占位，控制台无报错。

---

### P1 — 物理 + 蓄力发射

**产出/修改**：`physics.js`、`player.js`、`input.js`（蓄力部分）

**任务**：
- [ ] `ready` 态：底部中央长按/空格蓄力，蓄力条 + 瞄准线
- [ ] 松手：速度 = f(按住时长)；角度 clamp **45°～135°**
- [ ] 进入 `flying`；非对称重力积分
- [ ] 记录 `maxHeight`（世界 Y 越小越高）

**验收**：
- 满蓄比轻蓄飞更高
- 上升明显慢于下落
- 仅可弹射一次

**调参**：见 CONFIG `LAUNCH_*`、`GRAVITY_*`

---

### P2 — 向量蹬风 + 输入

**产出/修改**：`input.js`（wheel/touch/keyboard）、`physics.js`（dash）

**任务**：
- [ ] wheel/touch 算 `θ`，屏蔽向下
- [ ] 每 0.15s：`vx += M·cosθ`，`vy += -M·sinθ`
- [ ] 键盘 W/A/D 离散角 fallback，按住连发
- [ ] `terminalVy` 动态上限；超 95% 剥离向上分量
- [ ] 每帧 `vx *= FRICTION`；Canvas `preventDefault` wheel
- [ ] 蹬风方向箭头视觉

**验收**：
- 左上 45° ≈ vx−127, vy−127（M=180）
- 纯向下滚无效
- 终端速度后只能水平蹬风

**调参**：见 CONFIG `DASH_*`、`TERMINAL_*`

---

### P3 — 世界 + 镜头 + 结算

**产出/修改**：`world.js`、`game.js`

**任务**：
- [ ] 镜头跟随：角色锚定屏幕下方 30%～40%，世界向下滚
- [ ]  sky 渐变背景 + 起跳台
- [ ] **无限程序化**：随 `maxHeight` 向前生成道具占位区段（P4 接道具）
- [ ] 左右软夹逼
- [ ] 结算：`y > launchY + threshold` 且下落触地，或 `y > voidY` → `result`
- [ ] 0.5s 防误触重开

**验收**：飞高时背景滚动；落回低处/虚空出现结算层。

---

### P4 — 道具 + 背包 + Buff

**产出/修改**：`items.js`、`player.js`（inventory/buff）

**任务**：
- [ ] 3 格背包 UI；碰撞自动入包；满则不再拾取
- [ ] flying 中点击槽位 / 1·2·3 使用
- [ ] **筋斗云**：3s 直线向上冲，禁用蹬风垂直分量
- [ ] **窜天猴**：超大 vy  impulse + 缓降；禁用垂直蹬风
- [ ] 程序化生成：Y 间距 150～300px，X ±80px 随机

**验收**：捡→存→择机使用；两种 Buff 轨迹可区分。

---

### P5 — UI + 存档 + 抛光

**产出/修改**：`ui.js`、`save.js`（可选独立）

**任务**：
- [ ] 首屏 title → ready
- [ ] HUD：高度（丈）、Buff 倒计时、背包槽
- [ ] 结算：本局最高 / 历史最高
- [ ] `localStorage['fly_high_score']`
- [ ] 触控蹬风区与背包区不冲突

**验收**：完整一局循环；刷新后最高分保留。

---

### P6 — 发布

**任务**：
- [ ] 编写根目录 `README.md`（玩法、操作、Pages 链接）
- [ ] `git init` → 推送 `fly` 仓库
- [ ] GitHub Pages 开启
- [ ] 手机 + PC 各测一局

**验收**：`https://<user>.github.io/fly/` 零安装可玩。

---

## 4. 日常开发节奏

```text
1. 读 PRD 对应章节 + CONFIG 默认值
2. 实现本阶段任务（单 PR / 单 commit 粒度）
3. 浏览器 F5 手动验收清单
4. 更新 CONFIG 文档（若新增常量）
5. 阶段通过 → 进入下一阶段
```

---

## 5. 推荐 Cursor 使用方式

| 阶段 | 建议模型 | 提示词要点 |
|---|---|---|
| P0–P1 | Composer 2.5 | 「按 TECH.md §3 实现主循环，不要加额外功能」 |
| P2 | Composer 2.5 或 Opus | 「严格按 PRD §3.4 向量蹬风，含 θ clamp」 |
| P3–P4 | Composer 2.5 | 「@PRD.md @CONFIG.md 实现 items 背包」 |
| 手感调参 | 人工 + CONFIG | 改 `config.js` 数值，不改逻辑 |
| Bug | Opus Thinking | 贴现象 + 相关文件 |

**上下文挂载**：`@docs/PRD.md` `@docs/TECH.md` `@docs/CONFIG.md`

---

## 6. 不在 MVP 范围

- 局外养成（灵气/升级）
- 风火轮/锦鲤/负面道具
- 音效 BGM
- Q 版正式美术
- 构建工具（Vite/webpack）

见 PRD Phase B/C。

---

## 7. 修订历史

| 版本 | 日期 | 内容 |
|---|---|---|
| v1.0 | 2026-08-14 | 初稿；P0–P6 开发流程 |
