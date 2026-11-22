// Midnight Vault — the world: one level at a time, the alarm, the loot,
// the tools, and winning or getting caught. The world owns the clock and
// every rule the render and the screenshots read from.
import {
  ALARM_RISE_PER_SECOND, ALARM_RISE_CLOSE_PER_SECOND, ALARM_FALL_PER_SECOND,
  ALARM_TRIGGER, ALARM_COOLDOWN_SECONDS, CATCH_RADIUS, COIN_LURE_RADIUS,
  EMP_RADIUS, EMP_SECONDS, SCORE_ART, SCORE_GEM, SCORE_GOLD,
  SCORE_TIME_BONUS_PER_SECOND, SMOKE_RADIUS, SMOKE_SECONDS, STEP,
  TOOL_MAX_CHARGES, TOOL_START_CHARGES, clamp, distance,
} from './config.js';
import { LEVELS } from './levels.js';
import { makeGuard, updateGuard, GUARD_CHASE } from './guards.js';
import { makeCamera, updateCamera, empBurst } from './cameras.js';
import { makePlayer, updatePlayer, lootReach } from './player.js';

export const WORLD_PLAYING = 'playing';
export const WORLD_CAUGHT = 'caught';
export const WORLD_LEVEL_CLEAR = 'level-clear';
export const WORLD_WON = 'won';

export function makeWorld(seed) {
  const world = {
    seed,
    levelIndex: 0,
    level: LEVELS[0],
    time: 0,
    levelTime: 0,
    score: 0,
    charges: TOOL_START_CHARGES,
    alarm: 0,
    alarmState: { active: false, cooldownLeft: 0 },
    status: WORLD_PLAYING,
    statusTime: 0,
    smokes: [],
    lure: null,
    events: [],
    gemTaken: false,
    lootTaken: 0,
    lootTotal: 0,
    timeBonus: 0,
    message: '',
    messageLeft: 0,
  };
  loadLevel(world, 0);
  return world;
}

export function loadLevel(world, index) {
  const def = LEVELS[index];
  world.levelIndex = index;
  world.level = def;
  world.player = makePlayer(def.playerStart);
  world.guards = def.guards.map(makeGuard);
  world.cameras = def.cameras.map(makeCamera);
  world.blockers = def.blockers;
  world.exit = def.exit;
  world.gem = { x: def.gem.x, y: def.gem.y, kind: 'gem', taken: false };
  world.loot = def.loot.map((item) => ({ ...item, taken: false }));
  world.lootTotal = world.loot.length + 1;
  world.lootTaken = 0;
  world.gemTaken = false;
  world.alarm = 0;
  world.alarmState = { active: false, cooldownLeft: 0 };
  world.smokes = [];
  world.lure = null;
  world.levelTime = 0;
  world.status = WORLD_PLAYING;
  world.statusTime = 0;
  world.events = [];
  world.message = def.briefing;
  world.messageLeft = 5;
}

/** One fixed step of the world. Returns event names that happened. */
export function stepWorld(world, input, dt) {
  world.events = [];
  if (world.status !== WORLD_PLAYING) {
    world.statusTime += dt;
    return world.events;
  }
  world.time += dt;
  world.levelTime += dt;
  if (world.messageLeft > 0) world.messageLeft -= dt;

  updatePlayer(world.player, input, dt, world.blockers);

  // Tools, spent from the charge budget.
  if (input.useSmoke) {
    input.useSmoke = false;
    if (world.charges > 0) {
      world.charges -= 1;
      world.smokes.push({ x: world.player.x, y: world.player.y, radius: SMOKE_RADIUS, left: SMOKE_SECONDS });
      world.events.push('smoke');
    }
  }
  if (input.useEmp) {
    input.useEmp = false;
    if (world.charges > 0) {
      world.charges -= 1;
      const hit = empBurst(world.cameras, world.player.x, world.player.y, EMP_RADIUS, EMP_SECONDS, world.time);
      world.events.push(hit > 0 ? 'emp' : 'emp-miss');
    }
  }
  if (input.useCoin) {
    input.useCoin = false;
    if (world.charges > 0) {
      world.charges -= 1;
      const angle = world.player.facing;
      const cx = world.player.x + Math.cos(angle) * 130;
      const cy = world.player.y + Math.sin(angle) * 130;
      world.lure = { x: clamp(cx, 30, 1250), y: clamp(cy, 90, 930), radius: COIN_LURE_RADIUS, left: 6 };
      world.events.push('coin');
    }
  }

  for (const smoke of world.smokes) smoke.left -= dt;
  world.smokes = world.smokes.filter((smoke) => smoke.left > 0);
  if (world.lure) {
    world.lure.left -= dt;
    if (world.lure.left <= 0) world.lure = null;
  }

  // The eyes: guards patrol and cameras sweep.
  for (const guard of world.guards) updateGuard(guard, dt, world);
  for (const camera of world.cameras) updateCamera(camera, dt, world);

  // The alarm: any eye on the thief fills it; hiding lets it drain.
  const seenByGuard = world.guards.some((guard) => guard.suspicion > 0.05);
  const seenByCamera = world.cameras.some((camera) => camera.seesPlayer);
  const seen = seenByGuard || seenByCamera;
  const close = world.guards.some((guard) => guard.suspicion > 0.6) ||
    world.cameras.some((camera) => camera.seesPlayer &&
      distance(camera.x, camera.y, world.player.x, world.player.y) < camera.coneLength * 0.55);
  if (seen && !world.alarmState.active) {
    const rate = (close ? ALARM_RISE_CLOSE_PER_SECOND : ALARM_RISE_PER_SECOND) *
      (world.player.sneaking ? 0.5 : 1);
    world.alarm = clamp(world.alarm + rate * dt, 0, ALARM_TRIGGER);
    if (world.alarm >= ALARM_TRIGGER) {
      world.alarmState.active = true;
      world.alarmState.cooldownLeft = ALARM_COOLDOWN_SECONDS;
      world.events.push('alarm');
    }
  } else if (!world.alarmState.active) {
    world.alarm = clamp(world.alarm - ALARM_FALL_PER_SECOND * dt, 0, ALARM_TRIGGER);
  }
  if (world.alarmState.active) {
    world.alarmState.cooldownLeft -= dt;
    if (world.alarmState.cooldownLeft <= 0) {
      world.alarmState.active = false;
      world.alarm = 55;
      for (const guard of world.guards) {
        if (guard.state === GUARD_CHASE) guard.state = 'return';
      }
      world.events.push('alarm-off');
    }
  }

  // Caught: a chasing guard that reaches the thief ends the run.
  for (const guard of world.guards) {
    if (guard.state === GUARD_CHASE &&
      distance(guard.x, guard.y, world.player.x, world.player.y) < CATCH_RADIUS) {
      world.status = WORLD_CAUGHT;
      world.statusTime = 0;
      world.events.push('caught');
      return world.events;
    }
  }

  // Loot: the gem first, then the small stuff — each small piece pays a charge.
  const reach = lootReach();
  if (!world.gem.taken && distance(world.player.x, world.player.y, world.gem.x, world.gem.y) < reach) {
    world.gem.taken = true;
    world.gemTaken = true;
    world.lootTaken += 1;
    world.score += SCORE_GEM;
    world.message = 'Star Sapphire secured — reach the green exit!';
    world.messageLeft = 5;
    world.events.push('gem');
  }
  for (const item of world.loot) {
    if (!item.taken && distance(world.player.x, world.player.y, item.x, item.y) < reach) {
      item.taken = true;
      world.lootTaken += 1;
      world.score += item.kind === 'art' ? SCORE_ART : SCORE_GOLD;
      world.charges = Math.min(TOOL_MAX_CHARGES, world.charges + 1);
      world.events.push('loot');
    }
  }

  // The exit only opens once the gem is in hand.
  const exit = world.exit;
  const inExit = world.player.x > exit.x && world.player.x < exit.x + exit.w &&
    world.player.y > exit.y && world.player.y < exit.y + exit.h;
  if (inExit && world.gemTaken) {
    world.timeBonus = Math.max(0, Math.round((240 - world.levelTime) * SCORE_TIME_BONUS_PER_SECOND));
    world.score += world.timeBonus;
    if (world.levelIndex + 1 < LEVELS.length) {
      world.status = WORLD_LEVEL_CLEAR;
      world.events.push('level-clear');
    } else {
      world.status = WORLD_WON;
      world.events.push('won');
    }
    world.statusTime = 0;
  }
  return world.events;
}

/** Advance the world `seconds` in fixed steps (used by the screenshot scenes). */
export function advanceWorld(world, seconds, input) {
  const steps = Math.round(seconds / STEP);
  const events = [];
  for (let i = 0; i < steps; i += 1) {
    events.push(...stepWorld(world, input, STEP));
    if (world.status !== WORLD_PLAYING) break;
  }
  return events;
}

/** Move on after a level-clear or win screen. */
export function nextLevel(world) {
  if (world.status === WORLD_LEVEL_CLEAR) loadLevel(world, world.levelIndex + 1);
}

/** Start the whole heist over from level one. */
export function restartHeist(world) {
  world.score = 0;
  world.charges = TOOL_START_CHARGES;
  loadLevel(world, 0);
}
