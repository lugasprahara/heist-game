// Midnight Vault — keyboard and mouse: WASD / arrows to move, Shift to
// sneak, 1/2/3 for the tools, Enter to start, R to retry a room. Clicking
// the floor walks the thief there; clicking a HUD tool button spends it.
import { HUD_HEIGHT } from './config.js';

export function makeInput() {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    sneak: false,
    useSmoke: false,
    useEmp: false,
    useCoin: false,
    confirm: false,
    retry: false,
    clickX: null,
    clickY: null,
  };
}

const KEY_ACTIONS = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
};

export function bindInput(input, canvas, hooks) {
  window.addEventListener('keydown', (event) => {
    const action = KEY_ACTIONS[event.code];
    if (action) {
      input[action] = true;
      event.preventDefault();
      return;
    }
    if (event.code === 'Digit1' || event.code === 'Numpad1') input.useSmoke = true;
    else if (event.code === 'Digit2' || event.code === 'Numpad2') input.useEmp = true;
    else if (event.code === 'Digit3' || event.code === 'Numpad3') input.useCoin = true;
    else if (event.code === 'Enter' || event.code === 'Space') input.confirm = true;
    else if (event.code === 'KeyR') input.retry = true;
    if (hooks.onFirstGesture) hooks.onFirstGesture();
  });
  window.addEventListener('keyup', (event) => {
    const action = KEY_ACTIONS[event.code];
    if (action) input[action] = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    if (hooks.onFirstGesture) hooks.onFirstGesture();
    if (y < HUD_HEIGHT) {
      // HUD tool buttons: smoke | EMP | coin, right-hand side.
      const button = toolButtonAt(x, y);
      if (button === 'smoke') input.useSmoke = true;
      else if (button === 'emp') input.useEmp = true;
      else if (button === 'coin') input.useCoin = true;
      return;
    }
    input.clickX = x;
    input.clickY = y;
  });
  window.addEventListener('blur', () => {
    input.left = input.right = input.up = input.down = false;
    input.sneak = false;
  });
}

/** Which HUD tool button (if any) sits at canvas point (x, y). */
export function toolButtonAt(x, y) {
  if (y < 8 || y > 40) return null;
  // The tools label ends at the canvas's right edge; three rough zones.
  if (x > 1010 && x <= 1090) return 'smoke';
  if (x > 1090 && x <= 1160) return 'emp';
  if (x > 1160) return 'coin';
  return null;
}

/** Consume a click-to-walk target into the player's move target. */
export function takeClickTarget(input, player) {
  if (input.clickX === null) return;
  player.moveTarget = { x: input.clickX, y: input.clickY };
  input.clickX = null;
  input.clickY = null;
}
