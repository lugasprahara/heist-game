// Midnight Vault — the screenshot scenes behind ?shot=start|play|end|vault.
// Each scene plays the real rules forward from a fresh level, steered by a
// small autopilot, so every frame is what a short game really looks like
// and the same seed always gives the same frame.
import { STEP } from './config.js';
import { advanceWorld, WORLD_LEVEL_CLEAR, WORLD_WON, WORLD_CAUGHT } from './world.js';
import { SCREEN_PLAY, SCREEN_OVER, SCREEN_CLEAR } from './render.js';
import { canSee } from './vision.js';
import { loadLevel } from './world.js';

const DIRECTIONS = [
  { x: 0, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 },
  { x: 0, y: 1 }, { x: -1, y: 1 }, { x: -1, y: 0 }, { x: -1, y: -1 },
];

/** True when any guard or camera could see the thief standing at (x, y). */
function dangerAt(world, x, y) {
  for (const guard of world.guards) {
    if (canSee(guard.x, guard.y, guard.facing, guard.coneLength, guard.coneHalfAngle,
      x, y, world.blockers, world.smokes)) return true;
  }
  for (const camera of world.cameras) {
    if (canSee(camera.x, camera.y, camera.facing, camera.coneLength, camera.coneHalfAngle,
      x, y, world.blockers, world.smokes)) return true;
  }
  return false;
}

/**
 * One step of autopilot input. The careful pilot scores each of the eight
 * directions by how much closer it gets to the objective, and refuses any
 * step into a watched spot; the reckless pilot beelines and gets spotted.
 */
function autopilot(world, careful) {
  const player = world.player;
  const target = world.gemTaken
    ? { x: world.exit.x + world.exit.w / 2, y: world.exit.y + world.exit.h / 2 }
    : { x: world.gem.x, y: world.gem.y };
  const input = {
    left: false, right: false, up: false, down: false, sneak: false,
    useSmoke: false, useEmp: false, useCoin: false, confirm: false, retry: false,
    clickX: null, clickY: null,
  };
  const step = 26;
  const inDangerNow = dangerAt(world, player.x, player.y);
  // A chasing guard changes the job: run away from it, and drop smoke if it
  // is right on the thief's heels.
  const chaser = world.guards.find((guard) => guard.state === 'chase');
  if (chaser) {
    const chaserDist = Math.hypot(player.x - chaser.x, player.y - chaser.y);
    if (chaserDist < 170 && world.charges > 0 && world.smokes.length === 0) {
      input.useSmoke = true;
    }
    let best = null;
    let bestScore = -Infinity;
    for (const dir of DIRECTIONS) {
      const nx = player.x + dir.x * step;
      const ny = player.y + dir.y * step;
      const away = Math.hypot(nx - chaser.x, ny - chaser.y);
      let score = away;
      if (careful && dangerAt(world, nx, ny)) score -= 300;
      if (score > bestScore) {
        bestScore = score;
        best = dir;
      }
    }
    if (best) {
      if (best.x < 0) input.left = true;
      if (best.x > 0) input.right = true;
      if (best.y < 0) input.up = true;
      if (best.y > 0) input.down = true;
    }
    return input;
  }
  let bestSafe = null;
  let bestSafeDist = Infinity;
  let bestAny = null;
  let bestAnyScore = -Infinity;
  for (const dir of DIRECTIONS) {
    const nx = player.x + dir.x * step;
    const ny = player.y + dir.y * step;
    const dist = Math.hypot(target.x - nx, target.y - ny);
    const dangerous = careful && dangerAt(world, nx, ny);
    if (!dangerous && dist < bestSafeDist) {
      bestSafeDist = dist;
      bestSafe = dir;
    }
    let score = -dist;
    if (dangerous) score -= 500;
    if (inDangerNow && !dangerous) score += 120;
    if (score > bestAnyScore) {
      bestAnyScore = score;
      bestAny = dir;
    }
  }
  const best = careful ? bestSafe ?? null : bestAny;
  if (!best) {
    // Every way is watched: hold still behind cover and wait the cone out.
    input.sneak = true;
    return input;
  }
  if (best.x < 0) input.left = true;
  if (best.x > 0) input.right = true;
  if (best.y < 0) input.up = true;
  if (best.y > 0) input.down = true;
  input.sneak = careful && inDangerNow;
  return input;
}

/** Play forward until `stop` says enough, or `seconds` run out. */
function playForward(world, seconds, careful, stop) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    advanceWorld(world, STEP, autopilot(world, careful));
    if (stop && stop(world)) break;
    if (world.status !== 'playing') break;
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * start: mid-crossing of room one, cones sweeping, loot glowing, alarm low.
 * play:  the reckless run — spotted, alarm climbing, a guard giving chase.
 * end:   the careful run played through to the getaway.
 * vault: room three, the busiest floor, a few seconds into the crossing.
 */
export function stageShot(name, world) {
  if (name === 'vault') {
    loadLevel(world, 2);
    playForward(world, 5, true);
    return { screen: SCREEN_PLAY };
  }
  if (name === 'play') {
    // The reckless run on room two, where the patrols are dense enough to
    // catch a thief who beelines for the gem; room three if it slips through.
    for (const level of [1, 2]) {
      loadLevel(world, level);
      world.score = 0;
      world.charges = 3;
      playForward(world, 60, false, (w) => w.alarm >= 55 || w.status === WORLD_CAUGHT);
      if (world.alarm >= 55 || world.status === WORLD_CAUGHT) break;
    }
    return { screen: world.status === WORLD_CAUGHT ? SCREEN_OVER : SCREEN_PLAY };
  }
  if (name === 'end') {
    loadLevel(world, 0);
    playForward(world, 170, true, (w) => w.status === WORLD_LEVEL_CLEAR || w.status === WORLD_WON);
    if (world.status === WORLD_LEVEL_CLEAR || world.status === WORLD_WON) {
      return { screen: SCREEN_CLEAR };
    }
    return { screen: SCREEN_PLAY };
  }
  loadLevel(world, 0);
  playForward(world, 6, true);
  return { screen: SCREEN_PLAY };
}
