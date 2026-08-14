/** 角度换算：1° 对应弧度 */
export const DEG = Math.PI / 180;

/** 调试模式 · 显示 state/vy 等开发信息 */
export const DEBUG = false;

// ── 画布与计分 ──────────────────────────────────────────
/** 逻辑画布宽度 · 竖屏基准宽，影响布局与边界 */
export const CANVAS_W = 360;
/** 逻辑画布高度 · 竖屏基准高，相机锚点以此为参照 */
export const CANVAS_H = 640;
/** 高度换算 · 飞行高度(px)→米，用于 HUD 与存档计分 */
export const PX_TO_METER = 0.01;

// ── 蓄力发射 ────────────────────────────────────────────
/** 满蓄时间 · 按住多久达到最大初速，也驱动蓄力条/预览线长度 */
export const MAX_HOLD = 1.5;
/** 最小发射初速 · 刚蓄力即松手时的速度 */
export const MIN_LAUNCH_SPEED = 300;
/** 最大发射初速 · 满蓄松手时的速度 */
export const MAX_LAUNCH_SPEED = 800;
/** 发射角下限 · 最偏右（45°），再右会被 clamp */
export const LAUNCH_ANGLE_MIN = 45 * DEG;
/** 发射角上限 · 最偏左（135°），再左会被 clamp */
export const LAUNCH_ANGLE_MAX = 135 * DEG;
/** 预览线最短 · 刚蓄力时瞄准线长度（px） */
export const LAUNCH_PREVIEW_MIN = 30;
/** 预览线最长 · 满蓄时瞄准线长度（px） */
export const LAUNCH_PREVIEW_MAX = 150;
/** 最小有效蓄力 · 短于此秒数松手不发射；未达此值也不显示蓄力 UI（s） */
export const MIN_HOLD_LAUNCH = 0.1;

// ── 重力与阻力 ──────────────────────────────────────────
/** 重力加速度基准 · 接近 980≈1g 的手感标度（px/s²） */
export const GRAVITY_G = 980;
/** 上升重力系数 · vy<0 时实际重力 = G×此值，越小升得越慢 */
export const GRAVITY_UP = 0.5;
/** 下落重力系数 · vy>0 时实际重力 = G×此值，越大落得越快 */
export const GRAVITY_DOWN = 1;
/** 水平空气阻力 · 每帧 vx×此值，越大横向衰减越快 */
export const FRICTION = 0.9;

// ── 蹬风 ────────────────────────────────────────────────
/** 蹬风冲量标量 M · 单次蹬风施加的速度增量大小（px/s） */
export const DASH_IMPULSE = 220;
/** 蹬风冷却 · 任意方向两次蹬风的最小间隔（秒） */
export const DASH_INTERVAL = 0.5;
/** 滚轮输入超时 · 超过此秒数无滚轮/拖拽输入则停止连发判定 */
export const DASH_IDLE_STOP = 0.1;
/** 角度平滑系数 · 拖滚轮时方向插值权重（0～1） */
export const DASH_AIM_SMOOTH = 0.1;
/** 滚轮热区外扩 · 点击判定比视觉半径大多少（px） */
export const DASH_WHEEL_HIT_PAD = 10;
/** 蹬风反馈时长 · 背后方向拖尾向后渐隐的总时长（ms） */
export const DASH_FLASH_MS = 200;

// ── 终端下落速度 ────────────────────────────────────────
/** 终端下落初值 · 开局最大允许下落 vy（px/s） */
export const TERMINAL_VY_BASE = 600;
/** 终端下落增速 · 下落时间越长，终端上限越高（px/s²） */
export const TERMINAL_VY_RATE = 40;
/** 终端下落封顶 · 终端 vy 不超过此值（px/s） */
export const TERMINAL_VY_MAX = 2000;
/** 禁上蹬风阈值比 · vy≥终端×此值时，蹬风剥离向上分量 */
export const TERMINAL_STRIP_RATIO = 0.9;

// ── 玩家与世界 ──────────────────────────────────────────
/** 玩家碰撞半径 · 触地/拾取/贴墙判定用圆半径（px） */
export const PLAYER_R = 12;
/** 站立高度偏移 · 相对 launchY 上方额外抬高（px） */
export const PLAYER_SPAWN_OFFSET = 2;
/** 起跳台世界 Y · 地面与 launchY 基准高度 */
export const LAUNCH_Y = 580;
/** 起跳点世界 X · 默认屏幕水平中心 */
export const LAUNCH_X = CANVAS_W / 2;
/** 地面绘制厚度 · 仅视觉，草地/泥土层高度参考 */
export const GROUND_H = 24;
/** 虚空深度偏移 · 低于 launchY+此值 判定坠入虚空并结算 */
export const VOID_OFFSET = 320;
/** 无道具坠落时限 · 下落且无 Buff/背包道具超过此秒数则直坠地面（s） */
export const NO_ITEM_FALL_LIMIT = 3.0;

// ── 左右边界 ────────────────────────────────────────────
/** 左右安全边距 · 玩家中心距屏幕边的最小距离（px） */
export const WALL_MARGIN = 16;
/** 撞墙反弹冲量 · 触墙时附加的水平推开速度（px/s） */
export const WALL_PUSH = 40;

// ── 道具生成 ────────────────────────────────────────────
/** 背包格数 · 可携带道具数量上限 */
export const INVENTORY_SIZE = 3;
/** 道具纵向间距下限 · 相邻生成点最小高度差（px） */
export const ITEM_SPAWN_DY_MIN = 150;
/** 道具纵向间距上限 · 相邻生成点最大高度差（px） */
export const ITEM_SPAWN_DY_MAX = 400;
/** 道具横向散布 · 相对中心 ± 随机偏移（px） */
export const ITEM_SPAWN_DX = 120;
/** 道具碰撞尺寸 · 拾取判定方形边长（px） */
export const ITEM_SIZE = 28;
/** 开局预生成数 · 第一次起飞前上方道具数量 */
export const ITEM_INITIAL_COUNT = 12;
/** 补生成前瞻 · 玩家 y 低于 highestSpawned 此值时继续刷（px） */
export const ITEM_SPAWN_LOOKAHEAD = 400;
/** 种子起始偏移 · 首批道具相对玩家的起始高度差（px） */
export const ITEM_SEED_OFFSET = 120;
/** 重开生成基准 · reset 时 nextSpawnY 相对玩家（px） */
export const ITEM_RESET_OFFSET = 200;
/** 筋斗云生成权重 · 与神行符权重之比决定出现概率（非直接百分比） */
export const ITEM_WEIGHT_CLOUD = 1;
/** 神行符生成权重 · 与筋斗云权重之比决定出现概率（非直接百分比） */
export const ITEM_WEIGHT_CHARM = 1;

// ── 持续上升（神行符道具） ───────────────────────────────
/** 持续上升时长 · 神行符 Buff 秒数，期间固定上升 */
export const CLOUD_DURATION = 3.0;
/** 持续上升速度 · 神行符 Buff 期间每帧设定的 vy（px/s，向上为负） */
export const CLOUD_SPEED = 500;
/** 持续上升横向衰减 · 神行符 Buff 期间每帧 vx×此值 */
export const CLOUD_VX_DECAY = 0.95;

// ── 爆发滑翔（筋斗云道具） ───────────────────────────────
/** 爆发初速 · 筋斗云使用瞬间赋予的向上 vy（px/s） */
export const ROCKET_IMPULSE = 2000;
/** 爆发阶段时长 · 筋斗云爆发阶段持续秒数，之后进入滑翔 */
export const ROCKET_BURST_DURATION = 0.5;
/** 滑翔阶段时长 · 筋斗云缓降滑翔持续秒数 */
export const ROCKET_GLIDE_DURATION = 3.0;
/** 滑翔下落速度下限 · 仅当 vy 大于此值（下落偏快）时压到此速度；vy≤0 或 vy≤此值时不限制 */
export const ROCKET_GLIDE_MIN_FALL_VY = 50;
/** 爆发最低 vy 比 · 爆发阶段 vy 不低于 IMPULSE×此值 */
export const ROCKET_BURST_MIN_VY_RATIO = 0.1;
/** 爆发 vy 衰减 · 爆发阶段每帧 vy×此值，冲劲逐渐减弱（0～1） */
export const ROCKET_BURST_DECAY = 0.95;

// ── 流程 ────────────────────────────────────────────────
/** 结算防误触延迟 · 进入 result 后需等待此秒数才可重开 */
export const RESULT_DELAY = 0.5;
/** 进入 ready 防抖 · 此毫秒内忽略松手，防同次点击即发射（ms） */
export const READY_IGNORE_RELEASE_MS = 300;
/** 单帧 dt 上限 · 防卡顿时物理步长跳变（s） */
export const DT_MAX = 1 / 30;

// ── 相机 ────────────────────────────────────────────────
/** 玩家屏幕锚点 · 0=顶 1=底；0.65 表示角色在屏幕偏下约 65% 处 */
export const CAMERA_PLAYER_ANCHOR = 0.65;
/** 相机慢跟速度 · 与目标距离很近时的跟随上限（px/s） */
export const CAMERA_FOLLOW_MIN = 50;
/** 相机快跟速度 · 与目标距离很远时的跟随上限（px/s） */
export const CAMERA_FOLLOW_MAX = 1000;
/** 相机加速参考距离 · 超过此距离趋近 FAST 跟随（px） */
export const CAMERA_FOLLOW_DIST_REF = 300;

// ── 存档 ────────────────────────────────────────────────
/** 最高分 localStorage 键名 · 浏览器本地持久化 */
export const LS_HIGH_SCORE = 'fly_high_score';

// ── 背包 UI（屏幕固定） ─────────────────────────────────
/** 道具槽宽度 · HUD 槽位绘制宽（px） */
export const INV_SLOT_W = 44;
/** 道具槽高度 · HUD 槽位绘制高（px） */
export const INV_SLOT_H = 44;
/** 道具槽间距 · 槽与槽之间的空隙（px） */
export const INV_SLOT_GAP = 8;
/** 道具槽顶边 Y · 屏幕坐标，槽位区域上沿 */
export const INV_Y = 548;
/** 道具槽起始 X · 三槽整体水平居中后的左起点 */
export const INV_START_X = (CANVAS_W - INVENTORY_SIZE * (INV_SLOT_W + INV_SLOT_GAP) + INV_SLOT_GAP) / 2;

// ── 蹬风滚轮 UI（屏幕固定） ─────────────────────────────
/** 蹬风轮半径 · 底部圆形滚轮控件半径（px） */
export const DASH_WHEEL_R = 38;
/** 滚轮与道具栏间距 · 滚轮圆心在 INV_Y 上方多少（px） */
export const DASH_WHEEL_ABOVE_INV = 50;
/** 蹬风轮圆心 Y · 位于道具栏上方（px） */
export const DASH_WHEEL_CY = INV_Y - DASH_WHEEL_ABOVE_INV;
/** 飞行操作区顶边 · 屏幕 y，低于此为底部操作热区（半透明） */
export const DASH_ZONE_TOP = 427;
