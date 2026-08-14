import { CANVAS_W, DASH_AIM_SMOOTH, DASH_WHEEL_CY, DASH_WHEEL_HIT_PAD, DASH_WHEEL_R } from './config.js';

export function dashWheelCenter() {
  return { x: CANVAS_W / 2, y: DASH_WHEEL_CY };
}

/** 圆形滚轮热区 */
export function dashWheelHitTest(x, y) {
  const { x: cx, y: cy } = dashWheelCenter();
  const dx = x - cx;
  const dy = y - cy;
  const hitR = DASH_WHEEL_R + DASH_WHEEL_HIT_PAD;
  return dx * dx + dy * dy <= hitR * hitR;
}

/** 向量 → 全圆蹬风角（弧度）；0=右，π/2=上，-π/2=下，无死区 */
export function vectorToDashTheta(dx, dy) {
  if (dx === 0 && dy === 0) return Math.PI / 2;
  return Math.atan2(dy, dx);
}

/** 滚轮 delta → 蹬风角（含向下；动量在 applyDash 中剥离纵向） */
export function clampDashTheta(rawDx, rawDy) {
  if (rawDx === 0 && rawDy === 0) return null;
  return vectorToDashTheta(rawDx, rawDy);
}

/** 反馈拖尾可见：仅横向与向上（sin≥0），向下为死区 */
export function dashFeedbackVisible(theta) {
  return Math.sin(theta) >= 0;
}

/** 指针相对滚轮中心 → 蹬风角 */
export function pointerToDashTheta(px, py) {
  const { x: cx, y: cy } = dashWheelCenter();
  return vectorToDashTheta(px - cx, -(py - cy));
}

/** 角度插值（最短弧） */
export function smoothAngle(current, target, t = DASH_AIM_SMOOTH) {
  if (current == null) return target;
  let d = target - current;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return current + d * t;
}

export function dashWheelBounds() {
  const { x: cx, y: cy } = dashWheelCenter();
  const r = DASH_WHEEL_R + DASH_WHEEL_HIT_PAD;
  return { x: cx - r, y: cy - r, w: r * 2, h: r * 2 };
}
