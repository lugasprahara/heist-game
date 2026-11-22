// Midnight Vault — the guards: patrol, suspicion, chase, and being lured.
// A guard walks its waypoints, pauses to look around, and turns toward what
// it half-sees. Its suspicion fills while the thief is in its cone; full
// suspicion trips the alarm. On alarm every guard hunts the thief.
import {
  GUARD_RADIUS, SUSPICION_RISE_PER_SECOND, SUSPICION_FALL_PER_SECOND,
  angleDifference, clamp, distance,
} from './config.js';
import { canSee, circleHitsBlockers } from './vision.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_CHASE = 'chase';
export const GUARD_RETURN = 'return';
export const GUARD_LURED = 'lured';

export function makeGuard(def) {
  const first = def.waypoints[0];
  return {
    x: first.x,
    y: first.y,
    waypoints: def.waypoints,
    waypointIndex: 1 % def.waypoints.length,
    speed: def.speed,
    coneLength: def.coneLength,
    coneHalfAngle: def.coneHalfAngle,
    pauseSeconds: def.pauseSeconds,
    facing: 0,
    state: GUARD_PATROL,
    suspicion: 0,
    pauseLeft: 0,
    stuckTime: 0,
    detour: null,
    detourLeft: 0,
    lastSeenX: null,
    lastSeenY: null,
    lookAround: 0,
  };
}

/** Slide a guard toward (tx, ty), one axis at a time so walls stop it cleanly. */
function moveGuardToward(guard, tx, ty, dt, blockers) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;
  const step = guard.speed * dt;
  const nx = guard.x + (dx / dist) * step;
  if (!circleHitsBlockers(nx, guard.y, GUARD_RADIUS, blockers)) guard.x = nx;
  const ny = guard.y + (dy / dist) * step;
  if (!circleHitsBlockers(guard.x, ny, GUARD_RADIUS, blockers)) guard.y = ny;
}

/** Turn the guard's facing toward an angle, at most `turnRate` radians a step. */
function turnGuardToward(guard, targetAngle, turnRate, dt) {
  const diff = angleDifference(guard.facing, targetAngle);
  const turn = clamp(diff, -turnRate * dt, turnRate * dt);
  guard.facing += turn;
}

export function updateGuard(guard, dt, world) {
  const { player, blockers, smokes, alarm } = world;
  const seesPlayer = canSee(
    guard.x, guard.y, guard.facing, guard.coneLength, guard.coneHalfAngle,
    player.x, player.y, blockers, smokes,
  );

  if (seesPlayer) {
    guard.suspicion = clamp(guard.suspicion + SUSPICION_RISE_PER_SECOND * dt, 0, 1);
    guard.lastSeenX = player.x;
    guard.lastSeenY = player.y;
  } else {
    guard.suspicion = clamp(guard.suspicion - SUSPICION_FALL_PER_SECOND * dt, 0, 1);
  }

  // A guard that is sure, or an alarm going off, gives chase.
  if (guard.suspicion >= 1 || alarm.active) {
    if (guard.state !== GUARD_CHASE) {
      guard.state = GUARD_CHASE;
      guard.stuckTime = 0;
      guard.detour = null;
    }
  } else if (guard.state === GUARD_CHASE && guard.suspicion <= 0.05 && !alarm.active) {
    guard.state = GUARD_RETURN;
  }

  // A tossed coin pulls the nearest guard to the clink, while it lasts.
  if (world.lure && guard.state !== GUARD_CHASE) {
    const d = distance(guard.x, guard.y, world.lure.x, world.lure.y);
    if (d < world.lure.radius) {
      guard.state = GUARD_LURED;
      guard.lureX = world.lure.x;
      guard.lureY = world.lure.y;
    }
  }

  if (guard.state === GUARD_CHASE) {
    const targetX = seesPlayer ? player.x : guard.lastSeenX;
    const targetY = seesPlayer ? player.y : guard.lastSeenY;
    if (targetX !== null) {
      const beforeX = guard.x;
      const beforeY = guard.y;
      moveGuardToward(guard, targetX, targetY, dt, blockers);
      turnGuardToward(guard, Math.atan2(targetY - guard.y, targetX - guard.x), 5.5, dt);
      const moved = distance(beforeX, beforeY, guard.x, guard.y);
      if (moved < guard.speed * dt * 0.25 && distance(guard.x, guard.y, targetX, targetY) > 30) {
        guard.stuckTime += dt;
      } else {
        guard.stuckTime = 0;
      }
      // Stuck against furniture: sidestep around it, then carry on.
      if (guard.stuckTime > 1.1) {
        guard.stuckTime = 0;
        const side = Math.random() < 0.5 ? 1 : -1;
        guard.detour = { x: guard.x, y: guard.y + side * 70 };
        guard.detourLeft = 1.0;
      }
      if (guard.detour && guard.detourLeft > 0) {
        moveGuardToward(guard, guard.detour.x, guard.detour.y, dt, blockers);
        guard.detourLeft -= dt;
        if (distance(guard.x, guard.y, guard.detour.x, guard.detour.y) < 12) guard.detourLeft = 0;
      }
    }
    return;
  }

  if (guard.state === GUARD_LURED) {
    moveGuardToward(guard, guard.lureX, guard.lureY, dt, blockers);
    turnGuardToward(guard, Math.atan2(guard.lureY - guard.y, guard.lureX - guard.x), 4, dt);
    if (distance(guard.x, guard.y, guard.lureX, guard.lureY) < 16 || !world.lure) {
      guard.state = GUARD_RETURN;
    }
    return;
  }

  if (guard.state === GUARD_RETURN) {
    // Walk back to the nearest waypoint, then resume the patrol.
    let nearest = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < guard.waypoints.length; i += 1) {
      const d = distance(guard.x, guard.y, guard.waypoints[i].x, guard.waypoints[i].y);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    }
    const target = guard.waypoints[nearest];
    moveGuardToward(guard, target.x, target.y, dt, blockers);
    turnGuardToward(guard, Math.atan2(target.y - guard.y, target.x - guard.x), 4, dt);
    if (nearestDist < 14) {
      guard.waypointIndex = (nearest + 1) % guard.waypoints.length;
      guard.state = GUARD_PATROL;
      guard.pauseLeft = guard.pauseSeconds;
    }
    return;
  }

  // Patrol: walk the waypoints, pause and look around at each one.
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    guard.lookAround += dt;
    guard.facing += Math.sin(guard.lookAround * 2.2) * 1.6 * dt;
    if (guard.pauseLeft <= 0) guard.lookAround = 0;
    return;
  }
  const target = guard.waypoints[guard.waypointIndex];
  const beforeX = guard.x;
  const beforeY = guard.y;
  moveGuardToward(guard, target.x, target.y, dt, blockers);
  turnGuardToward(guard, Math.atan2(target.y - guard.y, target.x - guard.x), 4.5, dt);
  const moved = distance(beforeX, beforeY, guard.x, guard.y);
  if (moved < guard.speed * dt * 0.25 && distance(guard.x, guard.y, target.x, target.y) > 30) {
    guard.stuckTime += dt;
  } else {
    guard.stuckTime = 0;
  }
  if (guard.stuckTime > 1.1) {
    // A waypoint hidden behind furniture: skip to the next one.
    guard.stuckTime = 0;
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
  }
  if (distance(guard.x, guard.y, target.x, target.y) < 14) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    guard.pauseLeft = guard.pauseSeconds;
    guard.lookAround = 0;
  }
}
