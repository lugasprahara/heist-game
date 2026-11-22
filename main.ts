// Midnight Vault — the hand-in program (Node 22, standard library only).
// The game is plain static files under game/ (game/index.html and its ES
// modules, no library, no network request) and this program hands it in: it
// copies game/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library. Run it locally with MAKEFUN_OUTPUT_DIR set:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Serve the game itself with `node serve.ts`, then open http://localhost:8080.
// The program refuses to hand in a broken entry: it checks the screenshots
// are really there and the game folder is inside the scorer's caps before it
// writes the dossier, so a failed run fails loudly instead of silently.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');

// The scorer's own caps, kept here so the hand-in matches the gate:
// at most 4 screenshots, each at most 256 KiB; game/ at most 993 files and
// directories and 48 MiB in all; /output at most 1000 entries and 64 MiB.
const MAX_SCREENSHOTS = 4;
const MAX_SHOT_BYTES = 262144;
const MAX_GAME_FILES = 993;
const MAX_GAME_BYTES = 50331648;

function countGameFiles(dir) {
  let files = 0;
  let bytes = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      const sub = countGameFiles(path);
      files += sub.files + 1;
      bytes += sub.bytes;
    } else if (stats.isFile()) {
      files += 1;
      bytes += stats.size;
    }
  }
  return { files, bytes };
}

function checkEntryReady() {
  if (!existsSync(join(gameDir, 'index.html'))) {
    throw new Error('game/index.html is missing: the game has no entry page');
  }
  const shots = existsSync(shotsDir)
    ? readdirSync(shotsDir).filter((name) => !name.startsWith('.'))
    : [];
  if (shots.length < 3 || shots.length > MAX_SCREENSHOTS) {
    throw new Error(`screenshots/ holds ${shots.length} images, need 3 or 4`);
  }
  for (const name of shots) {
    const size = statSync(join(shotsDir, name)).size;
    if (size > MAX_SHOT_BYTES) {
      throw new Error(`screenshots/${name} is ${size} bytes, over the 256 KiB cap`);
    }
  }
  const game = countGameFiles(gameDir);
  if (game.files > MAX_GAME_FILES || game.bytes > MAX_GAME_BYTES) {
    throw new Error(`game/ holds ${game.files} files / ${game.bytes} bytes, over the caps`);
  }
}

checkEntryReady();

mkdirSync(out, { recursive: true });
cpSync(gameDir, join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: MAX_SCREENSHOTS, max_bytes: MAX_SHOT_BYTES },
    game_max_files: MAX_GAME_FILES,
    game_max_bytes: MAX_GAME_BYTES,
    game_path_max_bytes: 1000,
  }),
);
