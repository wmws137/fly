export const DEG = Math.PI / 180;

export const DEBUG = false;

export const CANVAS_W = 360;
export const CANVAS_H = 640;
export const PX_TO_ZHANG = 0.01;

export const MAX_HOLD = 2.0;
export const MIN_LAUNCH_SPEED = 200;
export const MAX_LAUNCH_SPEED = 600;
export const LAUNCH_ANGLE_MIN = 45 * DEG;
export const LAUNCH_ANGLE_MAX = 135 * DEG;

export const GRAVITY_G = 980;
export const GRAVITY_UP = 0.6;
export const GRAVITY_DOWN = 1.2;

export const DASH_IMPULSE = 180;
export const DASH_INTERVAL = 0.15;
export const DASH_IDLE_STOP = 0.1;
export const FRICTION = 0.92;

export const TERMINAL_VY_BASE = 800;
export const TERMINAL_VY_RATE = 40;
export const TERMINAL_VY_MAX = 1400;
export const TERMINAL_STRIP_RATIO = 0.95;

export const PLAYER_R = 12;
export const LAUNCH_Y = 580;
export const LAUNCH_X = CANVAS_W / 2;
export const GROUND_H = 24;
export const VOID_OFFSET = 320;

export const WALL_MARGIN = 16;
export const WALL_PUSH = 40;

export const INVENTORY_SIZE = 3;
export const ITEM_SPAWN_DY_MIN = 150;
export const ITEM_SPAWN_DY_MAX = 300;
export const ITEM_SPAWN_DX = 80;
export const ITEM_SIZE = 28;

export const CLOUD_DURATION = 3.0;
export const CLOUD_SPEED = 400;
export const ROCKET_IMPULSE = 650;
export const ROCKET_GLIDE_DECAY = 0.98;
export const ROCKET_GLIDE_DURATION = 2.0;

export const RESULT_DELAY = 0.5;
export const CAMERA_PLAYER_ANCHOR = 0.35;

export const LS_HIGH_SCORE = 'fly_high_score';

export const INV_SLOT_W = 44;
export const INV_SLOT_H = 44;
export const INV_Y = 548;
export const INV_START_X = (CANVAS_W - INVENTORY_SIZE * (INV_SLOT_W + 8) + 8) / 2;

export const DASH_ZONE_TOP = 427;
