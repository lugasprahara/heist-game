// Midnight Vault — shared constants for the heist.
// One canvas, one room per level: the whole room is always on screen so the
// player (and the judge) can read every patrol, cone, camera and the loot.
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 960;
export const HUD_HEIGHT = 64;
export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = CANVAS_HEIGHT - HUD_HEIGHT;
export const WORLD_TOP = HUD_HEIGHT;

export const STEP = 1 / 60;
export const PLAYER_RADIUS = 13;
export const PLAYER_SPEED = 150;
export const PLAYER_SNEAK_SPEED = 82;
export const GUARD_RADIUS = 14;
export const CATCH_RADIUS = 26;

// Alarm: 0 calm, 100 full alarm. Rises while any eye sees the thief.
export const ALARM_RISE_PER_SECOND = 34;
export const ALARM_RISE_CLOSE_PER_SECOND = 55;
export const ALARM_FALL_PER_SECOND = 9;
export const ALARM_TRIGGER = 100;
export const ALARM_COOLDOWN_SECONDS = 7;

// A guard that spots the thief fills its own suspicion first; full suspicion
// trips the alarm faster than the slow shared rise.
export const SUSPICION_RISE_PER_SECOND = 2.0;
export const SUSPICION_FALL_PER_SECOND = 0.55;

// Tools: each costs one charge. Charges are the heist budget.
export const TOOL_START_CHARGES = 3;
export const TOOL_MAX_CHARGES = 6;
export const SMOKE_RADIUS = 110;
export const SMOKE_SECONDS = 6;
export const EMP_RADIUS = 260;
export const EMP_SECONDS = 8;
export const COIN_LURE_RADIUS = 320;

// Scoring: small loot is worth points and one tool charge each.
export const SCORE_GEM = 500;
export const SCORE_GOLD = 120;
export const SCORE_ART = 200;
export const SCORE_TIME_BONUS_PER_SECOND = 5;

/** Deterministic RNG so a seeded run always plays the same way. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

/** Smallest signed turn from angle `from` to angle `to`. */
export function angleDifference(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
