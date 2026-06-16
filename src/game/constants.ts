export const SPAWN_Z = 70; // meters ahead where objects appear
export const HIT_Z = 1.6; // collision window in front of player
export const BASE_SPEED = 14; // m/s — snappier start
export const MAX_SPEED = 36;
export const SPEED_RAMP = 0.16; // m/s gained per second — faster arcade ramp
export const LANE_COUNT = 3;
export const JUMP_VELOCITY = 8.2;
export const GRAVITY = 22;
export const SLIDE_TIME = 0.7;
export const LANE_SWITCH_SPEED = 10; // lanes per second — snappier dodges

// Satan proximity: 0 = far away, 1 = breathing on your neck.
export const SATAN_START = 0.45;
export const SATAN_PASSIVE_RISE = 0.012; // per second
export const SATAN_SOFT_CAP = 0.9;
export const SATAN_SCROLL_RELIEF = 0.22;
export const SATAN_REVIVAL_PUSH = 0.35;
export const SATAN_WARN_AT = 0.72;

export const SCORE_COIN = 10;
export const SCORE_SCROLL = 50;
export const SCORE_CROWN = 30;
export const SCORE_KEY = 40;
export const SCORE_GEM = 25;
export const SCORE_PERFECT_DODGE = 35;

// Combo streaks: collect without crashing to build a score multiplier.
export const COMBO_TIMEOUT = 3.5; // seconds before a streak fizzles
export const COMBO_STEP = 0.04; // multiplier gained per combo point
export const COMBO_MAX_BONUS = 1; // multiplier caps at 2×
