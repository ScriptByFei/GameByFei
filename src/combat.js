// ============================================================
// combat.js — Treffer, Schaden, Status-Procs
// ============================================================
import { cv, player, fx, buffs, meta, boss, enemies, lightningBolts } from './state.js';
import { spawnPart, spawnImpactSparks, spawnDmgNum } from './particles.js';
import { applyBurn, applyPoison, applyFreeze } from './status-effects.js';
import { sfx } from './audio.js';

export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
export function shiftHex(hex, amt) {
  const h = (hex||'#000000').replace('#','');
  const full = h.length===3 ? h.split('').map(c=>c+c).join('') : h;
  const n = parseInt(full,16);
  const r = clamp((n>>16)+amt,0,255), g = clamp(((n>>8)&255)+amt,0,255), b = clamp((n&255)+amt,0,255);
  return `#${((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}`;
}

export function hitEnemy(e, dmg, col, srcX, srcY, partCount=5, partSpd=4, wKey) {
  if (!e || e.dead || e.hp <= 0) return;

  // Dodge (passive Skill)
  if (player.dodgeChance > 0 && Math.random() < player.dodgeChance) {
    spawnDmgNum(e.x, e.y, 'MISS', '#94a3b8');
    return;
  }

  // Damage-Buff
  if (buffs.dmg?.t > 0) dmg *= 1.5;

  // Meta-Krit (permanenter Skill)
  const metaCrit = (meta.skills.crit || 0) * 0.06;
  // Run-Krit (Skill-Tree)
  const runCrit  = player.critChance || 0;
  const totalCrit = metaCrit + runCrit;
  let isCrit = false;
  if (totalCrit > 0 && Math.random() < totalCrit) {
    dmg *= player.critMult || 2;
    col = '#FFD700';
    isCrit = true;
  }

  e.hp -= dmg;
  e.hit = 10;
  if (dmg >= 20) fx.hitStop = Math.max(fx.hitStop, 3);

  const dx = e.x - srcX, dy = e.y - srcY, dist = Math.hypot(dx,dy)||1;
  const push = Math.min(4.5*cv.SC, 1.1*cv.SC + dmg*0.05*cv.SC);
  e.kbX += (dx/dist)*push; e.kbY += (dy/dist)*push;

  spawnPart(srcX, srcY, col, partCount, partSpd);
  spawnImpactSparks(srcX, srcY, col);
  spawnDmgNum(e.x, e.y, Math.round(dmg), col);
  sfx.hit();

  // Lifesteal
  if (player.lifesteal > 0) player.hp = Math.min(player.maxHp, player.hp + dmg * player.lifesteal);

  // Status-Procs
  checkStatusProcs(e, wKey);
}

export function hitBoss(dmg, col, srcX, srcY, partCount=6, partSpd=5, wKey) {
  if (!boss || boss.hp <= 0) return;

  if (buffs.dmg?.t > 0) dmg *= 1.5;
  if (boss._shielded) dmg *= 0.5;

  const metaCrit = (meta.skills.crit || 0) * 0.06;
  const runCrit  = player.critChance || 0;
  if ((metaCrit + runCrit) > 0 && Math.random() < metaCrit + runCrit) {
    dmg *= player.critMult || 2; col = '#FFD700';
  }

  boss.hp -= dmg;
  boss.hit = 10; boss.hitFlash = 8;
  if (dmg >= 20) fx.hitStop = Math.max(fx.hitStop, 3);

  const dx = boss.x - srcX, dy = boss.y - srcY, dist = Math.hypot(dx,dy)||1;
  const push = Math.min(3*cv.SC, 0.8*cv.SC + dmg*0.025*cv.SC);
  boss.kbX = (boss.kbX||0) + (dx/dist)*push;
  boss.kbY = (boss.kbY||0) + (dy/dist)*push;

  spawnPart(srcX, srcY, col, partCount, partSpd);
  spawnImpactSparks(srcX, srcY, col);
  spawnDmgNum(boss.x, boss.y, Math.round(dmg), col);
  sfx.hit();

  if (player.lifesteal > 0) player.hp = Math.min(player.maxHp, player.hp + dmg * player.lifesteal);
}

function checkStatusProcs(e, wKey) {
  if (!e || e.hp <= 0) return;

  if (player.burnOnHit > 0 && Math.random() < 0.5)
    applyBurn(e, player.burnOnHit, player.burnOnHit >= 2 ? 300 : 180);

  if (player.poisonOnHit > 0 && Math.random() < 0.4)
    applyPoison(e, player.poisonOnHit, player.poisonOnHit >= 2 ? 480 : 300);

  if (player.freezeOnHit > 0) {
    const chance  = player.freezeOnHit >= 2 ? 0.20 : 0.10;
    const dur     = player.freezeOnHit >= 2 ? 150  : 90;
    if (Math.random() < chance) applyFreeze(e, dur);
  }

  if (player.chainLightning > 0) {
    const chance = player.chainLightning >= 2 ? 0.30 : 0.15;
    const count  = player.chainLightning >= 2 ? 3 : 2;
    if (Math.random() < chance) triggerChainLightning(e, count);
  }
}

function triggerChainLightning(source, count) {
  const sorted = enemies
    .filter(e => e !== source && e.hp > 0)
    .sort((a,b) => Math.hypot(a.x-source.x,a.y-source.y) - Math.hypot(b.x-source.x,b.y-source.y));
  const targets = sorted.slice(0, count);
  targets.forEach(t => {
    hitEnemy(t, 8 * cv.SC, '#67e8f9', source.x, source.y, 2, 3);
    lightningBolts.push({ x1:source.x, y1:source.y, x2:t.x, y2:t.y, life:0.3 });
  });
}
