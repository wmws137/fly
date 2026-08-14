# 飞 (FLY)

竖屏物理弹射小游戏：蓄力起飞，滚轮/滑动向量蹬风，收集道具续飞，挑战最大高度。

## 在线游玩

部署 GitHub Pages 后访问：`https://<username>.github.io/fly/`

本地预览：

```bash
cd d:\code\2
npx --yes serve .
# 打开 http://localhost:3000
```

## 操作

| 操作 | PC | 手机 |
|---|---|---|
| 开始 | 点击 / Enter | 点击 |
| 蓄力发射 | 长按空格或底部中央 + 鼠标瞄准，松手发射 | 长按底部中央，松手发射 |
| 蹬风 | 滚轮方向（上/左/右，无向下）；WASD/方向键；点击底部区 | 底部滑动（上/左/右） |
| 道具 | 飞行中碰撞自动入包；点击槽位或按 1/2/3 使用 | 同左 |

## 文档

- [docs/PRD.md](docs/PRD.md) — 需求
- [docs/DEV_PLAN.md](docs/DEV_PLAN.md) — 开发流程
- [docs/TECH.md](docs/TECH.md) — 技术规范
- [docs/CONFIG.md](docs/CONFIG.md) — 常量表

## 部署 GitHub Pages

1. 创建仓库 `fly`，推送本目录
2. Settings → Pages → Branch `main` / root
3. 等待部署完成

## 技术栈

HTML5 Canvas + ES Modules，无构建工具。
