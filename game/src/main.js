// Midnight Vault — the loop: title, play, caught, level clear, won.
// The loop steps the world at a fixed 60 Hz, draws every frame, and plays
// the little sounds. A `?shot=<name>` query stages a fixed scene instead of
// the title screen, so screenshots are real frames of the real game.
import { CANVAS_WIDTH, CANVAS_HEIGHT, STEP } from './config.js';
import {
  makeWorld, stepWorld, nextLevel, restartHeist, loadLevel,
  WORLD_PLAYING, WORLD_CAUGHT, WORLD_LEVEL_CLEAR, WORLD_WON,
} from './world.js';
import {
  drawGame, SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER, SCREEN_CLEAR, SCREEN_WON,
} from './render.js';
import { makeInput, bindInput, takeClickTarget } from './input.js';
import { makeAudio, initAudio, playEventSound } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') ?? '7') || 7;

const world = makeWorld(seed);
const input = makeInput();
const audio = makeAudio();
let screen = SCREEN_TITLE;
let time = 0;
let last = performance.now();
let announced = '';

bindInput(input, canvas, { onFirstGesture: () => initAudio(audio) });

if (shotName) {
  const staged = stageShot(shotName, world);
  screen = staged.screen;
  document.title = `Midnight Vault — ${shotName}`;
}

function announce(text) {
  if (text === announced) return;
  announced = text;
  statusLine.textContent = text;
}

function setScreen(next) {
  screen = next;
  if (next === SCREEN_PLAY) announce(`${world.level.name}. ${world.message}`);
  else if (next === SCREEN_OVER) announce('Caught! Press R to try the room again.');
  else if (next === SCREEN_CLEAR) announce('Clean getaway. Press Enter for the next room.');
  else if (next === SCREEN_WON) announce('The vault is yours. Press Enter to play again.');
  else announce('Midnight Vault. Press Enter to begin the heist.');
}

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  time += dt;

  if (screen === SCREEN_TITLE) {
    if (input.confirm) {
      input.confirm = false;
      setScreen(SCREEN_PLAY);
    }
  } else if (screen === SCREEN_PLAY) {
    takeClickTarget(input, world.player);
    const events = stepWorld(world, input, Math.min(dt, STEP * 3));
    for (const event of events) playEventSound(audio, event);
    if (world.status === WORLD_CAUGHT) setScreen(SCREEN_OVER);
    else if (world.status === WORLD_LEVEL_CLEAR) setScreen(SCREEN_CLEAR);
    else if (world.status === WORLD_WON) setScreen(SCREEN_WON);
  } else if (screen === SCREEN_OVER) {
    if (input.retry) {
      input.retry = false;
      loadLevel(world, world.levelIndex);
      setScreen(SCREEN_PLAY);
    } else if (input.confirm) {
      input.confirm = false;
      restartHeist(world);
      setScreen(SCREEN_PLAY);
    }
  } else if (screen === SCREEN_CLEAR) {
    if (input.confirm) {
      input.confirm = false;
      nextLevel(world);
      setScreen(SCREEN_PLAY);
    }
  } else if (screen === SCREEN_WON) {
    if (input.confirm) {
      input.confirm = false;
      restartHeist(world);
      setScreen(SCREEN_TITLE);
    }
  }

  drawGame(ctx, world, screen, time);
  requestAnimationFrame(frame);
}

setScreen(shotName ? screen : SCREEN_TITLE);
requestAnimationFrame(frame);
