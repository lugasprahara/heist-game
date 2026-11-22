// Midnight Vault — the cameras: wall-mounted eyes that sweep their arc.
// A camera's cone is narrower than a guard's and it never moves, but it never
// blinks either. An EMP burst switches a camera off for a while; smoke hides
// the thief from it like it hides them from a guard.
import { clamp } from './config.js';
import { canSee } from './vision.js';

export function makeCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweepAngle: def.sweepAngle,
    sweepSpeed: def.sweepSpeed,
    coneLength: def.coneLength,
    coneHalfAngle: def.coneHalfAngle,
    phase: Math.random() * Math.PI * 2,
    facing: def.baseAngle,
    disabledUntil: 0,
    seesPlayer: false,
  };
}

export function updateCamera(camera, dt, world) {
  if (world.time < camera.disabledUntil) {
    camera.seesPlayer = false;
    return;
  }
  camera.phase += dt * camera.sweepSpeed;
  camera.facing = camera.baseAngle + Math.sin(camera.phase) * camera.sweepAngle;
  camera.seesPlayer = canSee(
    camera.x, camera.y, camera.facing, camera.coneLength, camera.coneHalfAngle,
    world.player.x, world.player.y, world.blockers, world.smokes,
  );
}

/** Switch off every camera within `radius` of (x, y) for `seconds`. */
export function empBurst(cameras, x, y, radius, seconds, now) {
  let hit = 0;
  for (const camera of cameras) {
    if (Math.hypot(camera.x - x, camera.y - y) <= radius) {
      camera.disabledUntil = now + seconds;
      camera.seesPlayer = false;
      hit += 1;
    }
  }
  return hit;
}

export function cameraDisabled(camera, now) {
  return now < camera.disabledUntil;
}

export function cameraDisabledLeft(camera, now) {
  return clamp(camera.disabledUntil - now, 0, 99);
}
