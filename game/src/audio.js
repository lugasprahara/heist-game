// Midnight Vault — tiny synthesized sounds: no audio files, no network.
// A few WebAudio oscillator blips for pickup, alarm, being caught and the
// getaway. Sound starts only after the player's first gesture, as browsers
// require, and stays silent until then.
export function makeAudio() {
  return { ctx: null, alarmTimer: null, enabled: true };
}

export function initAudio(audio) {
  if (audio.ctx || !audio.enabled) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audio.ctx = new Ctx();
  } catch {
    audio.ctx = null;
  }
}

function blip(audio, frequency, seconds, type, gainValue, when = 0) {
  if (!audio.ctx) return;
  try {
    const start = audio.ctx.currentTime + when;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(gainValue, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    osc.connect(gain);
    gain.connect(audio.ctx.destination);
    osc.start(start);
    osc.stop(start + seconds);
  } catch {
    // Sound is garnish: a failure here never stops the game.
  }
}

export function playEventSound(audio, event) {
  if (!audio.ctx) return;
  if (event === 'loot' || event === 'gem') {
    blip(audio, 880, 0.12, 'sine', 0.12);
    blip(audio, 1318, 0.18, 'sine', 0.1, 0.09);
  } else if (event === 'alarm') {
    blip(audio, 220, 0.5, 'square', 0.08);
    blip(audio, 330, 0.5, 'square', 0.08, 0.25);
  } else if (event === 'caught') {
    blip(audio, 110, 0.7, 'sawtooth', 0.12);
    blip(audio, 82, 0.9, 'sawtooth', 0.1, 0.15);
  } else if (event === 'level-clear' || event === 'won') {
    [523, 659, 784, 1046].forEach((freq, i) => blip(audio, freq, 0.22, 'sine', 0.11, i * 0.11));
  } else if (event === 'smoke') {
    blip(audio, 300, 0.25, 'sine', 0.05);
  } else if (event === 'emp' || event === 'coin') {
    blip(audio, 1200, 0.08, 'square', 0.05);
  }
}
