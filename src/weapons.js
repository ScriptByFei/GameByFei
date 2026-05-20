// ============================================================
// weapons.js — shoot(), upWeap(), Waffen-Instanzen
// ============================================================
import { WDEF } from './constants.js';
import { cv, player, run, buffs, meta, weapons, pools, boss, enemies, projs } from './state.js';
import { hitEnemy, hitBoss } from './combat.js';
import { sfx } from './audio.js';

export function createWeaponInstance(key) {
  const def = WDEF[key];
  if (!def) return null;
  return { ...def, lvl:1, cdT:0, spinT:0, spinA:0, orbitT:0, orbitA:0, wKey:key };
}

export function shoot() {
  weapons.forEach(w => {
    w.cdT--;
    if (w.cdT > 0) return;

    const cdMult  = player.cdReduction || 1;
    const extraCnt = player.bonusProjectiles || 0;
    const cnt  = w.cnt + Math.floor((w.lvl-1)/2) + extraCnt;
    const dmg  = w.dmg * (1 + (w.lvl-1)*0.35) * (1 + (meta.skills.dmg||0)*0.08);

    if (w.kind === 'ball') {
      w.cdT = Math.max(1, Math.round(w.cd * cdMult));
      for (let i = 0; i < cnt; i++) {
        const spread = cnt > 1 ? (i - (cnt-1)/2) * 0.1 : 0;
        const a = player.angle + spread;
        projs.push({
          x: player.x, y: player.y,
          vx: Math.cos(a) * w.spd * cv.SC,
          vy: Math.sin(a) * w.spd * cv.SC,
          sz: w.sz * cv.SC, col: w.col, dmg,
          life: 200, kind: w.kind, wKey: w.wKey,
          pierce: player.bonusPierce || 0,
        });
      }
      sfx.shoot();
    } else if (w.kind === 'spin') {
      w.cdT = Math.max(1, Math.round(w.cd * cdMult));
      w.spinT = 28; w.spinA = 0;
      sfx.shoot();
    } else if (w.kind === 'orbit') {
      w.orbitT = 999999;
      w.orbitA = w.orbitA || 0;
    } else if (w.kind === 'pool') {
      w.cdT = Math.max(30, Math.round((w.cd - w.lvl*3) * cdMult));
      pools.push({
        x: player.x, y: player.y,
        sz: w.sz * cv.SC * (1 + (w.lvl-1)*0.2),
        dmg: dmg * 0.4, col: w.col,
        life: 150 + w.lvl*30,
      });
    }
  });
}

export function upWeap() {
  weapons.forEach(w => {
    if (w.kind === 'spin' && w.spinT > 0) {
      w.spinT--;
      w.spinA += 0.28;
      const r  = (85 + w.lvl*15) * cv.SC;
      const sx = player.x + Math.cos(w.spinA)*r;
      const sy = player.y + Math.sin(w.spinA)*r;
      if (run.frame % 3 === 0) {
        const dmg = w.dmg * w.lvl;
        enemies.forEach(e => {
          if (Math.hypot(e.x-sx, e.y-sy) < e.sz + 22*cv.SC)
            hitEnemy(e, dmg, w.col, sx, sy, 3, 3, w.wKey);
        });
        if (boss && Math.hypot(boss.x-sx, boss.y-sy) < boss.sz + 22*cv.SC)
          hitBoss(dmg, w.col, sx, sy, 3, 3, w.wKey);
      }
    }
    if (w.kind === 'orbit') {
      w.orbitA = (w.orbitA || 0) + 0.075;
      const r  = (68 + w.lvl*10) * cv.SC;
      const sx = player.x + Math.cos(w.orbitA)*r;
      const sy = player.y + Math.sin(w.orbitA)*r;
      w._x = sx; w._y = sy;
      if (run.frame % 5 === 0) {
        const dmg = w.dmg * w.lvl;
        enemies.forEach(e => {
          if (Math.hypot(e.x-sx, e.y-sy) < e.sz + 22*cv.SC)
            hitEnemy(e, dmg, w.col, sx, sy, 3, 3, w.wKey);
        });
        if (boss && Math.hypot(boss.x-sx, boss.y-sy) < boss.sz + 22*cv.SC)
          hitBoss(dmg, w.col, sx, sy, 3, 3, w.wKey);
      }
    }
  });
}

export function canAddWeapon(key) {
  if (!WDEF[key]) return false;
  return !weapons.some(w => w.wKey === key);
}
