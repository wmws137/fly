# 飞 (FLY)

竖屏物理弹射小游戏：蓄力起飞，滚轮/滑动向量蹬风，收集道具续飞，挑战最大高度。

## 在线游玩

**https://wmws137.github.io/fly/**（注意末尾 `/fly/`，无需后端）

这是纯前端 Canvas 游戏，GitHub Pages 只负责托管 HTML/JS 文件，**不需要服务器、数据库或串口**。

若线上无法玩但本地正常，通常是 **浏览器缓存** 或 **访问地址不对**：
1. 用无痕窗口打开上面的链接
2. 按 Ctrl+F5 强制刷新
3. 右下角应显示绿色 `ready v6`；若出现红色错误文字，截图反馈

## 本地打开（重要）

本项目使用 ES Module，**不能直接双击 `index.html`**（浏览器会拦截模块加载）。

### 方法一：一键启动（推荐，无需 Node.js）

1. 双击 `start-local.bat`
2. 浏览器打开 **http://127.0.0.1:8080/**

### 方法二：Cursor / VS Code Live Server

1. 安装 **Live Server** 扩展
2. 右键 `index.html` → **Open with Live Server**

### 方法三：Node.js

```bash
cd d:\code\2
npx serve .
# 打开 http://localhost:3000
```

## 操作

| 步骤 | PC |
|---|---|
| 1 | 打开页面后看到「已进入蓄力」 |
| 2 | **按住**鼠标左键或空格蓄力（蓄力条上涨） |
| 3 | **松手**发射 |
| 4 | 飞行中滚轮 / WASD 蹬风；1/2/3 使用道具 |

若页面右下角绿色状态字不是 `ready`/`flying`，或出现红色错误文字，请截图反馈。

## 文档

- [docs/PRD.md](docs/PRD.md) — 需求
- [docs/DEV_PLAN.md](docs/DEV_PLAN.md) — 开发流程
- [docs/TECH.md](docs/TECH.md) — 技术规范
- [docs/CONFIG.md](docs/CONFIG.md) — 常量表

## 部署 GitHub Pages

1. 推送本目录到 GitHub 仓库 `fly`
2. Settings → Pages → Branch `main` / root
3. 访问 `https://<username>.github.io/fly/`

## 技术栈

HTML5 Canvas + ES Modules，无构建工具。
