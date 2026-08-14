/**
 * 轻量逻辑自测（Node 直接跑，无需浏览器）
 * 用法：node tests/logic.test.js
 */
import assert from 'node:assert/strict';
import {
  CAMERA_PLAYER_ANCHOR,
  CANVAS_H,
  LAUNCH_ANGLE_MIN,
  LAUNCH_ANGLE_MAX,
  MAX_HOLD,
  PLAYER_R,
} from '../js/config.js';
import {
  clampLaunchAim,
  createPlayer,
  getHeightZhang,
  launchFromAim,
  launchFromAngle,
  resolveLaunchAngle,
} from '../js/player.js';
import { integratePlayer, wheelToTheta } from '../js/physics.js';
import { checkLanding } from '../js/world.js';

function approx(a, b, eps = 1) {
  assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);
}

function cameraY(player) {
  return player.y - CANVAS_H * CAMERA_PLAYER_ANCHOR;
}

// 蓄力：满蓄应高于轻蓄
{
  const p1 = createPlayer();
  const p2 = createPlayer();
  const cam = cameraY(p1);
  const sy = p1.y - cam;
  launchFromAim(p1, 0.1, p1.x, sy - 80, cam);
  launchFromAim(p2, MAX_HOLD, p2.x, sy - 80, cam);
  assert.ok(Math.hypot(p2.vx, p2.vy) > Math.hypot(p1.vx, p1.vy));
}

// 角度 clamp 45~135°
{
  const p = createPlayer();
  const cam = cameraY(p);
  const sy = p.y - cam;
  launchFromAim(p, MAX_HOLD, p.x + 500, sy, cam);
  const angle = Math.atan2(-p.vy, p.vx);
  assert.ok(angle >= LAUNCH_ANGLE_MIN - 0.01);
  assert.ok(angle <= LAUNCH_ANGLE_MAX + 0.01);
}

// launchFromAngle 与 resolveLaunchAngle 一致
{
  const p = createPlayer();
  const cam = cameraY(p);
  const angle = resolveLaunchAngle(p, 50, 400, cam);
  launchFromAngle(p, MAX_HOLD, angle);
  approx(Math.atan2(-p.vy, p.vx), angle, 0.001);
}

// 上升比下落慢
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

// 触地 / 虚空
{
  const p = createPlayer();
  p.y = p.launchY + PLAYER_R;
  p.vy = 1;
  assert.equal(checkLanding(p), 'ground');
  p.y = p.launchY + 400;
  assert.equal(checkLanding(p), 'void');
}

console.log('logic.test.js: all passed');
