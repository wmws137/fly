/**
 * 轻量逻辑自测（Node 直接跑，无需浏览器）
 * 用法：node tests/logic.test.js
 */
import assert from 'node:assert/strict';
import {
  GRAVITY_G,
  GRAVITY_UP,
  LAUNCH_ANGLE_MIN,
  LAUNCH_ANGLE_MAX,
  MAX_HOLD,
  MIN_LAUNCH_SPEED,
  MAX_LAUNCH_SPEED,
  PLAYER_R,
  LAUNCH_Y,
  PX_TO_ZHANG,
} from '../js/config.js';
import { createPlayer, getHeightZhang, launchFromAim } from '../js/player.js';
import { integratePlayer, terminalVy, wheelToTheta, keysToTheta } from '../js/physics.js';
import { checkLanding } from '../js/world.js';

function approx(a, b, eps = 1) {
  assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);
}

// 蓄力：满蓄应高于轻蓄
{
  const p1 = createPlayer();
  const p2 = createPlayer();
  launchFromAim(p1, 0.1, p1.x, 100);
  launchFromAim(p2, MAX_HOLD, p2.x, 100);
  assert.ok(Math.hypot(p2.vx, p2.vy) > Math.hypot(p1.vx, p1.vy));
}

// 角度 clamp 45~135°
{
  const p = createPlayer();
  launchFromAim(p, MAX_HOLD, p.x + 500, p.y); // 试图平射
  const angle = Math.atan2(-p.vy, p.vx);
  assert.ok(angle >= LAUNCH_ANGLE_MIN - 0.01);
  assert.ok(angle <= LAUNCH_ANGLE_MAX + 0.01);
}

// 上升比下落慢（同 dt 内 |vy| 增量）
{
  const up = createPlayer();
  up.vy = -200;
  integratePlayer(up, 0.016);
  const upDelta = up.vy - -200;

  const down = createPlayer();
  down.vy = 200;
  integratePlayer(down, 0.016);
  const downDelta = down.vy - 200;
  assert.ok(Math.abs(upDelta) < downDelta);
}

// 高度计分
{
  const p = createPlayer();
  p.minY = p.launchY - 1000;
  approx(getHeightZhang(p), 10, 0.01);
}

// 滚轮向下无效
{
  assert.equal(wheelToTheta(0, 100), null);
}

// 左上 45° 分量约 127
{
  const theta = wheelToTheta(-50, -50);
  approx(Math.cos(theta) * 180, 127, 2);
  approx(Math.sin(theta) * 180, 127, 2);
}

// 触地检测
{
  const p = createPlayer();
  p.y = p.launchY + PLAYER_R;
  p.vy = 1;
  assert.equal(checkLanding(p), 'ground');
}

// 虚空检测
{
  const p = createPlayer();
  p.y = p.launchY + 400;
  assert.equal(checkLanding(p), 'void');
}

console.log('logic.test.js: all passed');
