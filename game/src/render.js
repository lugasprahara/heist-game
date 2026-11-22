// Midnight Vault — the look: a bright, readable top-down room where safe
// cover, danger and loot are obvious at a glance. Vision cones are warm
// yellow, camera cones are red-orange, the loot glows gold, the exit is
// green, and the alarm meter sits in the HUD where it cannot be missed.
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, HUD_HEIGHT, WORLD_TOP,
} from './config.js';
import { GUARD_CHASE, GUARD_SUSPICIOUS, GUARD_LURED } from './guards.js';
import { cameraDisabled, cameraDisabledLeft } from './cameras.js';
import { WORLD_CAUGHT, WORLD_LEVEL_CLEAR, WORLD_WON } from './world.js';

const FLOOR_A = '#d8cdb2';
const FLOOR_B = '#cfc3a4';
const WALL_FILL = '#333a4a';
const WALL_TOP = '#4a5468';
const PILLAR_FILL = '#5b6b82';
const CRATE_FILL = '#9a6b3f';
const CRATE_EDGE = '#6e4a26';
const CASE_FILL = '#bcd6e2';
const CASE_EDGE = '#5f8296';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_WON = 'won';

function drawCone(ctx, x, y, facing, length, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, length, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(facing - halfAngle) * length, y + Math.sin(facing - halfAngle) * length);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(facing + halfAngle) * length, y + Math.sin(facing + halfAngle) * length);
  ctx.stroke();
}

function drawBlocker(ctx, blocker) {
  const { x, y, w, h } = blocker;
  if (blocker.kind === 'wall') {
    ctx.fillStyle = WALL_FILL;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = WALL_TOP;
    ctx.fillRect(x, y, w, 5);
  } else if (blocker.kind === 'pillar') {
    ctx.fillStyle = PILLAR_FILL;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#33404f';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    ctx.fillStyle = '#7d90a8';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, 10, 0, Math.PI * 2);
    ctx.fill();
  } else if (blocker.kind === 'crate') {
    ctx.fillStyle = CRATE_FILL;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = CRATE_EDGE;
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h);
    ctx.moveTo(x + w, y);
    ctx.lineTo(x, y + h);
    ctx.stroke();
  } else {
    // Display case: glassy, with a gold glint.
    ctx.fillStyle = CASE_FILL;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = CASE_EDGE;
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 12, y + h - 12);
    ctx.lineTo(x + w - 24, y + 12);
    ctx.stroke();
  }
}

function drawLoot(ctx, loot, time) {
  if (loot.taken) return;
  const pulse = 1 + Math.sin(time * 3) * 0.12;
  const r = (loot.kind === 'gem' ? 20 : 13) * pulse;
  ctx.save();
  ctx.shadowColor = loot.kind === 'gem' ? '#ffd94d' : '#ffb84d';
  ctx.shadowBlur = 22;
  ctx.fillStyle = loot.kind === 'gem' ? '#ffd94d' : loot.kind === 'art' ? '#e87ab0' : '#ffb84d';
  ctx.beginPath();
  ctx.moveTo(loot.x, loot.y - r);
  ctx.lineTo(loot.x + r * 0.75, loot.y);
  ctx.lineTo(loot.x, loot.y + r);
  ctx.lineTo(loot.x - r * 0.75, loot.y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(loot.x - r * 0.25, loot.y - r * 0.3, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  if (loot.kind === 'gem') {
    ctx.fillStyle = '#3a2c00';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STAR SAPPHIRE', loot.x, loot.y - r - 10);
  }
}

function drawGuard(ctx, guard, time) {
  const alerted = guard.state === GUARD_CHASE;
  const coneFill = alerted
    ? 'rgba(255,64,48,0.34)'
    : 'rgba(255,196,48,0.30)';
  const coneEdge = alerted ? 'rgba(255,64,48,0.75)' : 'rgba(214,150,0,0.75)';
  drawCone(ctx, guard.x, guard.y, guard.facing, guard.coneLength, guard.coneHalfAngle, coneFill, coneEdge);
  // Body: dark uniform, pale face, cap.
  ctx.fillStyle = '#22293a';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = alerted ? '#ff4030' : '#e8e2d0';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#f2e8d5';
  ctx.beginPath();
  ctx.arc(guard.x + Math.cos(guard.facing) * 6, guard.y + Math.sin(guard.facing) * 6, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#22293a';
  ctx.beginPath();
  ctx.arc(guard.x + Math.cos(guard.facing) * 8, guard.y + Math.sin(guard.facing) * 8, 4, 0, Math.PI * 2);
  ctx.fill();
  // Suspicion arc above the head: the fair warning before the chase.
  if (guard.suspicion > 0.03) {
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 21, -Math.PI / 2, -Math.PI / 2 + guard.suspicion * Math.PI * 2);
    ctx.strokeStyle = guard.suspicion > 0.7 ? '#ff4030' : '#ffb400';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  if (guard.state === GUARD_LURED) {
    ctx.fillStyle = '#22293a';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', guard.x, guard.y - 26);
  }
}

function drawCamera(ctx, camera, now, time) {
  const disabled = cameraDisabled(camera, now);
  const fill = disabled ? 'rgba(120,120,120,0.18)' : 'rgba(255,80,48,0.28)';
  const edge = disabled ? 'rgba(120,120,120,0.6)' : 'rgba(220,50,30,0.8)';
  if (!disabled) {
    drawCone(ctx, camera.x, camera.y, camera.facing, camera.coneLength, camera.coneHalfAngle, fill, edge);
  }
  ctx.fillStyle = disabled ? '#777' : '#a02020';
  ctx.beginPath();
  ctx.arc(camera.x, camera.y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(camera.x, camera.y, 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = disabled ? '#555' : '#ffd94d';
  ctx.beginPath();
  ctx.arc(camera.x + Math.cos(camera.facing) * 7, camera.y + Math.sin(camera.facing) * 7, 3.5, 0, Math.PI * 2);
  ctx.fill();
  if (disabled) {
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`OFF ${Math.ceil(cameraDisabledLeft(camera, now))}s`, camera.x, camera.y - 20);
  }
}

function drawPlayer(ctx, player, time) {
  // A soft shadow, then the hooded thief: dark cloak, pale mask stripe.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(player.x + 3, player.y + 5, 14, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  const bob = player.moving ? Math.sin(time * 14) * 1.5 : 0;
  ctx.fillStyle = '#1d2436';
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8fd0ff';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#dfe9f5';
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.facing) * 5, player.y + Math.sin(player.facing) * 5 + bob, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1d2436';
  ctx.fillRect(
    player.x + Math.cos(player.facing) * 5 - 2, player.y + Math.sin(player.facing) * 5 + bob - 1, 4, 2,
  );
}

function drawHud(ctx, world) {
  ctx.fillStyle = '#141a26';
  ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
  ctx.fillStyle = '#e8e2d0';
  ctx.font = 'bold 19px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('MIDNIGHT VAULT', 18, 27);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#9fb2cc';
  ctx.fillText(world.level.name, 18, 50);

  // Alarm meter: the one number the whole room plays around.
  const alarmX = 330;
  const alarmW = 300;
  ctx.fillStyle = '#2a3242';
  ctx.fillRect(alarmX, 14, alarmW, 20);
  const alarmFill = world.alarm / 100;
  ctx.fillStyle = world.alarmState.active ? '#ff4030'
    : alarmFill > 0.66 ? '#ff7a30' : alarmFill > 0.33 ? '#ffc430' : '#37c978';
  ctx.fillRect(alarmX, 14, alarmW * alarmFill, 20);
  ctx.strokeStyle = '#e8e2d0';
  ctx.lineWidth = 2;
  ctx.strokeRect(alarmX, 14, alarmW, 20);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(world.alarmState.active ? 'ALARM!' : 'ALARM', alarmX, 50);
  if (world.alarmState.active) {
    ctx.fillStyle = '#ff6a5a';
    ctx.fillText(`${Math.ceil(world.alarmState.cooldownLeft)}s`, alarmX + 70, 50);
  }

  // Objective, tools, score.
  ctx.fillStyle = world.gemTaken ? '#7be495' : '#ffd94d';
  ctx.font = 'bold 15px sans-serif';
  const objective = world.gemTaken ? 'Gem secured — reach the EXIT' : 'Steal the Star Sapphire';
  ctx.fillText(objective, 660, 27);
  ctx.fillStyle = '#9fb2cc';
  ctx.font = '14px sans-serif';
  ctx.fillText(`Loot ${world.lootTaken}/${world.lootTotal}   Score ${world.score}`, 660, 50);
  ctx.fillStyle = '#e8e2d0';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Tools [1] smoke  [2] EMP  [3] coin  ×${world.charges}`, CANVAS_WIDTH - 18, 27);
  ctx.fillStyle = '#9fb2cc';
  ctx.font = '13px sans-serif';
  ctx.fillText(`Level ${world.levelIndex + 1}/3   ${Math.floor(world.levelTime)}s`, CANVAS_WIDTH - 18, 50);
  ctx.textAlign = 'left';
}

function drawRoom(ctx, world, time) {
  // Floor: warm stone tiles.
  ctx.fillStyle = FLOOR_A;
  ctx.fillRect(0, WORLD_TOP, CANVAS_WIDTH, CANVAS_HEIGHT - HUD_HEIGHT);
  ctx.strokeStyle = FLOOR_B;
  ctx.lineWidth = 1;
  for (let x = 0; x <= CANVAS_WIDTH; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, WORLD_TOP);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = WORLD_TOP; y <= CANVAS_HEIGHT; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }
  // Exit door, glowing green on the far wall.
  const exit = world.exit;
  ctx.fillStyle = world.gemTaken ? '#2fbf5a' : '#3f7a52';
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.strokeStyle = '#d8ffd8';
  ctx.lineWidth = 3;
  ctx.strokeRect(exit.x, exit.y, exit.w, exit.h);
  ctx.fillStyle = '#eaffea';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', exit.x + exit.w / 2, exit.y + exit.h / 2 + 5);
  for (const blocker of world.blockers) drawBlocker(ctx, blocker);
  // Smoke clouds drift over everything but the HUD.
  for (const smoke of world.smokes) {
    const alpha = Math.min(0.85, smoke.left);
    ctx.fillStyle = `rgba(190,190,195,${0.75 * alpha})`;
    ctx.beginPath();
    ctx.arc(smoke.x, smoke.y, smoke.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(220,220,225,${0.5 * alpha})`;
    ctx.beginPath();
    ctx.arc(smoke.x - 24, smoke.y + 12, smoke.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  drawLoot(ctx, world.gem, time);
  for (const item of world.loot) drawLoot(ctx, item, time);
  if (world.lure) {
    ctx.strokeStyle = '#ffd94d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(world.lure.x, world.lure.y, 10 + Math.sin(time * 6) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('clink!', world.lure.x, world.lure.y - 16);
  }
  for (const camera of world.cameras) drawCamera(ctx, camera, world.time, time);
  for (const guard of world.guards) drawGuard(ctx, guard, time);
  drawPlayer(ctx, world.player, time);
  // Briefing line, fading over the room.
  if (world.messageLeft > 0 && world.status === 'playing') {
    ctx.fillStyle = 'rgba(20,26,38,0.82)';
    const text = world.message;
    ctx.font = '16px sans-serif';
    const w = ctx.measureText(text).width + 28;
    ctx.fillRect((CANVAS_WIDTH - w) / 2, CANVAS_HEIGHT - 52, w, 34);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 29);
    ctx.textAlign = 'left';
  }
}

function dimRoom(ctx) {
  ctx.fillStyle = 'rgba(10,14,22,0.62)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function panel(ctx, title, lines, accent) {
  const w = 620;
  const h = 120 + lines.length * 30;
  const x = (CANVAS_WIDTH - w) / 2;
  const y = (CANVAS_HEIGHT - h) / 2;
  ctx.fillStyle = '#141a26';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = accent;
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, CANVAS_WIDTH / 2, y + 52);
  ctx.fillStyle = '#e8e2d0';
  ctx.font = '17px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, CANVAS_WIDTH / 2, y + 92 + i * 30);
  });
  ctx.textAlign = 'left';
}

export function drawTitle(ctx, world, time) {
  dimRoom(ctx);
  panel(ctx, 'MIDNIGHT VAULT', [
    'A stealth heist in three rooms. Cross the floor, read the patrols,',
    'slip through the vision cones and the camera arcs, lift the Star Sapphire,',
    'and walk out the green exit — without ever tripping the alarm.',
    '',
    'Move: WASD / arrows, or click to walk there.  Shift: sneak.',
    'Tools (cost 1 charge each):  1 smoke   2 EMP   3 coin toss.',
    'Small loot pays a tool charge back.  Press Enter to begin.',
  ], '#ffd94d');
}

export function drawCaught(ctx, world, time) {
  dimRoom(ctx);
  panel(ctx, 'CAUGHT!', [
    'A guard closed in while the alarm was up. The vault keeps its sapphire — this time.',
    `Score ${world.score}   •   Loot ${world.lootTaken}/${world.lootTotal}`,
    '',
    'Press R to try the room again, or Enter for a fresh heist.',
  ], '#ff4030');
}

export function drawLevelClear(ctx, world, time) {
  dimRoom(ctx);
  panel(ctx, 'CLEAN GETAWAY', [
    `${world.level.name} — out the door with the sapphire.`,
    `Score ${world.score}  (time bonus +${world.timeBonus})`,
    '',
    'Press Enter for the next room.',
  ], '#37c978');
}

export function drawWon(ctx, world, time) {
  dimRoom(ctx);
  panel(ctx, 'THE VAULT IS YOURS', [
    'All three rooms, the Star Sapphire, and not a single alarm that stuck.',
    `Final score ${world.score}   •   Loot ${world.lootTaken}/${world.lootTotal}`,
    '',
    'Press Enter to run the heist again.',
  ], '#ffd94d');
}

export function drawGame(ctx, world, screen, time) {
  drawRoom(ctx, world, time);
  drawHud(ctx, world);
  if (screen === SCREEN_TITLE) drawTitle(ctx, world, time);
  else if (screen === SCREEN_OVER) drawCaught(ctx, world, time);
  else if (screen === SCREEN_CLEAR) drawLevelClear(ctx, world, time);
  else if (screen === SCREEN_WON) drawWon(ctx, world, time);
}
