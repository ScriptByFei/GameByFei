// ============================================================
// wave-modifiers.js
// ============================================================
import { WM_DEFS } from './constants.js';
import { waveModifier, enemies, run } from './state.js';

/** Neuen Modifier für die aktuelle Welle würfeln (60% Chance) */
export function rollWaveModifier() {
  unapplyModifier();
  if (Math.random() < 0.40) { waveModifier.active = null; return; }
  const def = WM_DEFS[Math.floor(Math.random() * WM_DEFS.length)];
  waveModifier.active = def;
  waveModifier.bannerT = 180; // ~3 Sekunden Banner
  applyModifierToExistingEnemies(def);
}

function applyModifierToExistingEnemies(def) {
  if (!def) return;
  if (def.id === 'fast') {
    enemies.forEach(e => { e._wmSpd = e.spd; e.spd *= 1.5; });
  }
  if (def.id === 'berserker') {
    enemies.forEach(e => { e._wmHp = e.hp; e.hp *= 3; e.maxHp *= 3; e._wmSpd = e.spd; e.spd *= 0.6; });
  }
  if (def.id === 'double_xp') run._xpMultWM = 2;
}

function unapplyModifier() {
  if (!waveModifier.active) return;
  const def = waveModifier.active;
  if (def.id === 'fast')     enemies.forEach(e => { if (e._wmSpd != null) { e.spd = e._wmSpd; delete e._wmSpd; }});
  if (def.id === 'berserker')enemies.forEach(e => { if (e._wmSpd != null) { e.spd = e._wmSpd; delete e._wmSpd; }});
  if (def.id === 'double_xp') run._xpMultWM = 1;
  waveModifier.active = null;
}

/** Modifier auf neu gespawnten Gegner anwenden */
export function applyModifierToEnemy(e) {
  const def = waveModifier.active;
  if (!def) return;
  if (def.id === 'fast')      { e._wmSpd = e.spd; e.spd *= 1.5; }
  if (def.id === 'berserker') { e.maxHp *= 3; e.hp *= 3; e._wmSpd = e.spd; e.spd *= 0.6; }
  if (def.id === 'elite_wave'){ e.elite = true; }
}

/** Ob Power-Ups in dieser Welle blockiert sind */
export function noPowerups() {
  return waveModifier.active?.id === 'no_buffs';
}

/** Gold-Multiplikator dieser Welle */
export function goldMult() {
  return waveModifier.active?.id === 'gold_rush' ? 3 : 1;
}

/** Tick für Healing-Modifier (jeden Frame für alle Gegner) */
export function tickModifier() {
  const def = waveModifier.active;
  if (!def) return;
  if (def.id === 'healing') {
    enemies.forEach(e => { e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.0002); });
  }
  if (waveModifier.bannerT > 0) waveModifier.bannerT--;
}
