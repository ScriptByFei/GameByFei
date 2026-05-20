// ============================================================
// audio.js
// ============================================================
import { gs } from './state.js';

let AC = null;

export function ACinit() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
}

function tone(f, d, t, v) {
  if (!AC) return;
  try {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = t; o.frequency.value = f;
    g.gain.setValueAtTime(v || 0.07, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + d);
    o.connect(g); g.connect(AC.destination);
    o.start(); o.stop(AC.currentTime + d);
  } catch(e) {}
}

export const sfx = {
  shoot:   () => { if (!gs.soundEnabled) return; tone(220, 0.05, 'square', 0.05); },
  hit:     () => { if (!gs.soundEnabled) return; tone(80, 0.07, 'sawtooth', 0.06); },
  xp:      () => { if (!gs.soundEnabled) return; tone(700, 0.06, 'sine', 0.06); },
  lvup:    () => { if (!gs.soundEnabled) return; tone(440, 0.1, 'sine', 0.1); setTimeout(() => tone(660, 0.12, 'sine', 0.1), 80); },
  die:     () => { if (!gs.soundEnabled) return; tone(100, 0.3, 'sawtooth', 0.12); },
  elite:   () => { if (!gs.soundEnabled) return; tone(880, 0.15, 'sine', 0.12); setTimeout(() => tone(1100, 0.2, 'sine', 0.1), 100); },
  boss:    () => { if (!gs.soundEnabled) return; tone(110, 0.4, 'sawtooth', 0.15); setTimeout(() => tone(80, 0.5, 'sawtooth', 0.12), 200); },
  bosskill:() => { if (!gs.soundEnabled) return; tone(660, 0.1, 'sine', 0.15); setTimeout(() => tone(880, 0.15, 'sine', 0.12), 80); setTimeout(() => tone(1100, 0.2, 'sine', 0.1), 180); },
  skill:   () => { if (!gs.soundEnabled) return; tone(880, 0.06, 'sine', 0.08); setTimeout(() => tone(1100, 0.08, 'sine', 0.06), 50); },
};
