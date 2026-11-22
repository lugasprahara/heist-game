// Midnight Vault — the thief: movement, sneaking, and the three tools.
// The thief moves with WASD or the arrow keys, or clicks a spot to walk
// there. Holding Shift sneaks: slower, but a sneaking thief is harder to
// spot and fills the alarm half as fast. Tools cost one charge each:
//   1 — smoke pellet: a cloud that blocks every eye for a few seconds
//   2 — EMP burst: switches off nearby cameras for a while
//   3 — coin toss: a clink that pulls the nearest guard off its patrol
import {
  PLAYER_RADIUS, PLAYER_SPEED, PLAYER_SNEAK_SPEED, WORLD_WIDTH, WORLD_HEIGHT,
  WORLD_TOP, clamp,
} from './config.js';
import { circleHitsBlockers } from './vision.js';

export function makePlayer(start) {
  return {
    x: start.x,
    y: start.y,
    radius: PLAYER_RADIUS,
    moveTarget: null,
    sneaking: false,
    facing: -Math.PI / 2,
    moving: false,
  };
}

/** Slide the player along one axis, stopping at walls and cover. */
function tryMove(player, dx, dy, blockers) {
  const nx = player.x + dx;
  if (!circleHitsBlockers(nx, player.y, player.radius, blockers)) player.x = nx;
  const ny = player.y + dy;
  if (!circleHitsBlockers(player.x, ny, player.radius, blockers)) player.y = ny;
  player.x = clamp(player.x, player.radius, WORLD_WIDTH - player.radius);
  player.y = clamp(player.y, WORLD_TOP + player.radius, WORLD_HEIGHT - player.radius);
}

export function updatePlayer(player, input, dt, blockers) {
  player.sneaking = Boolean(input.sneak);
  const speed = player.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_SPEED;
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  if (dx !== 0 || dy !== 0) {
    player.moveTarget = null;
    const len = Math.hypot(dx, dy);
    tryMove(player, (dx / len) * speed * dt, (dy / len) * speed * dt, blockers);
    player.facing = Math.atan2(dy, dx);
    player.moving = true;
    return;
  }
  if (player.moveTarget) {
    const tx = player.moveTarget.x - player.x;
    const ty = player.moveTarget.y - player.y;
    const dist = Math.hypot(tx, ty);
    if (dist < 6) {
      player.moveTarget = null;
      player.moving = false;
      return;
    }
    const step = Math.min(dist, speed * dt);
    tryMove(player, (tx / dist) * step, (ty / dist) * step, blockers);
    player.facing = Math.atan2(ty, tx);
    player.moving = true;
    return;
  }
  player.moving = false;
}

/** Distance at which the thief can grab a piece of loot. The gem sits inside
 * its display case, so the reach must cover standing right beside the glass. */
export function lootReach() {
  return 58;
}
