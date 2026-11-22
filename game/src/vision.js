// Midnight Vault — seeing: vision cones and line of sight.
// A watcher sees the thief only when the thief is inside its cone AND no
// wall, pillar, crate or case stands between them. Smoke blocks sight too.
import { angleDifference } from './config.js';

/** True when the segment (x1,y1)-(x2,y2) touches the rectangle. */
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  if (maxX < rect.x || minX > rect.x + rect.w || maxY < rect.y || minY > rect.y + rect.h) return false;
  if (x1 >= rect.x && x1 <= rect.x + rect.w && y1 >= rect.y && y1 <= rect.y + rect.h) return true;
  if (x2 >= rect.x && x2 <= rect.x + rect.w && y2 >= rect.y && y2 <= rect.y + rect.h) return true;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const edges = [
    [rect.x, rect.y, rect.x + rect.w, rect.y],
    [rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h],
    [rect.x, rect.y + rect.h, rect.x, rect.y],
  ];
  for (const [ax, ay, bx, by] of edges) {
    const ex = bx - ax;
    const ey = by - ay;
    const denom = dx * ey - dy * ex;
    if (denom === 0) continue;
    const t = ((ax - x1) * ey - (ay - y1) * ex) / denom;
    const u = ((ax - x1) * dy - (ay - y1) * dx) / denom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
  }
  return false;
}

/** True when no blocker stands between the watcher and the target point. */
export function hasLineOfSight(x1, y1, x2, y2, blockers) {
  for (const blocker of blockers) {
    if (segmentHitsRect(x1, y1, x2, y2, blocker)) return false;
  }
  return true;
}

/** True when the target point lies inside the watcher's vision cone. */
export function insideCone(wx, wy, facing, coneLength, coneHalfAngle, tx, ty) {
  const dx = tx - wx;
  const dy = ty - wy;
  const dist = Math.hypot(dx, dy);
  if (dist > coneLength) return false;
  if (dist < 1) return true;
  const targetAngle = Math.atan2(dy, dx);
  return Math.abs(angleDifference(facing, targetAngle)) <= coneHalfAngle;
}

/**
 * Full sight test: in range, inside the cone, line of sight clear, and not
 * hidden inside a smoke cloud (smoke hides the thief from every watcher).
 */
export function canSee(wx, wy, facing, coneLength, coneHalfAngle, tx, ty, blockers, smokes) {
  if (!insideCone(wx, wy, facing, coneLength, coneHalfAngle, tx, ty)) return false;
  for (const smoke of smokes) {
    const d = Math.hypot(tx - smoke.x, ty - smoke.y);
    if (d < smoke.radius * 0.8) return false;
  }
  return hasLineOfSight(wx, wy, tx, ty, blockers);
}

/** True when a circle of `radius` at (x, y) overlaps a rectangle. */
export function circleHitsRect(x, y, radius, rect) {
  const nearestX = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  const dx = x - nearestX;
  const dy = y - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

/** True when a circle of `radius` at (x, y) overlaps any blocker. */
export function circleHitsBlockers(x, y, radius, blockers) {
  for (const blocker of blockers) {
    if (circleHitsRect(x, y, radius, blocker)) return blocker;
  }
  return null;
}
