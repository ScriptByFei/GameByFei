// ============================================================
// particles.js — Partikel-System (erweitert)
// ============================================================
import { cv, fx, parts, deathPops, lightningBolts, laserBeams } from './state.js';

export function spawnPart(x, y, col, n, spd) {
  const SC = cv.SC;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = (spd || 3) + Math.random() * 3;
    parts.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, sz: (2+Math.random()*3)*SC, col, life: 1 });
  }
}

export function spawnImpactSparks(x, y, col) {
  const SC = cv.SC;
  for (let i = 0; i < 4; i++) {
    const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 3;
    parts.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, sz: (1.5+Math.random()*1.5)*SC, col, life: 0.7 });
  }
}

export function spawnDmgNum(x, y, dmg, col) {
  const SC = cv.SC;
  const amt = typeof dmg === 'number' ? Math.round(dmg) : dmg;
  const scale = typeof dmg === 'number' ? Math.min(1.9, 1 + Math.abs(amt) / 45) : 1;
  const critCol = typeof dmg === 'number' && amt >= 30 ? '#FFD700' : col;
  fx.dmgNums.push({
    x: x + (Math.random()-.5)*10*SC, y,
    dmg: amt, col: critCol, life: 1,
    vy: (-2.8 - (typeof dmg==='number'?amt:0)*0.015)*SC,
    size: 14*SC*scale,
    vx: (Math.random()-.5)*0.45*SC,
  });
}

export function createDeathPop(x, y, sz, col) {
  deathPops.push({ x, y, sz, col, life: 0.15, maxLife: 0.15 });
}

/** Waffen-spezifische Impact-Effekte */
export function spawnWeaponImpact(x, y, wKey, col) {
  const SC = cv.SC;
  switch (wKey) {
    case 'pistol':
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        parts.push({ x, y, vx: Math.cos(a)*6, vy: Math.sin(a)*6, sz: 1.5*SC, col: '#fff', life: 0.2 });
      }
      break;
    case 'shotgun':
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        parts.push({ x, y, vx: Math.cos(a)*(3+Math.random()*5), vy: Math.sin(a)*(3+Math.random()*5),
          sz: (1+Math.random()*2.5)*SC, col: i%3===0?'#fff':col, life: 0.45 });
      }
      break;
    case 'bow':
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2;
        parts.push({ x, y, vx: Math.cos(a)*4, vy: Math.sin(a)*4, sz: 2*SC, col, life: 0.6 });
      }
      break;
    case 'smg':
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        parts.push({ x, y, vx: Math.cos(a)*3, vy: Math.sin(a)*3, sz: 1.2*SC, col: '#38bdf8', life: 0.3 });
      }
      break;
  }
}

/** Gegner-Typ spezifische Death-Explosion */
export function spawnEnemyDeathEffect(e) {
  const SC = cv.SC;
  switch (e.t) {
    case 'slime':
      // Grüner Splatter, flacher Bogen
      for (let i = 0; i < 10; i++) {
        const a = Math.random() * Math.PI * 2;
        parts.push({ x: e.x, y: e.y, vx: Math.cos(a)*(2+Math.random()*4), vy: Math.sin(a)*(1+Math.random()*2),
          sz: (2+Math.random()*3)*SC, col: '#22c55e', life: 0.9 });
      }
      break;
    case 'bat':
      // Lila Nebel, steigt auf
      for (let i = 0; i < 8; i++) {
        const a = Math.random() * Math.PI * 2;
        parts.push({ x: e.x, y: e.y, vx: Math.cos(a)*(1+Math.random()*2), vy: -2-Math.random()*3,
          sz: (3+Math.random()*4)*SC, col: '#a855f7', life: 0.7 });
      }
      break;
    case 'skull':
      // Graue Splitter, spitz
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        parts.push({ x: e.x, y: e.y, vx: Math.cos(a)*(5+Math.random()*3), vy: Math.sin(a)*(5+Math.random()*3),
          sz: (1+Math.random()*2)*SC, col: '#94a3b8', life: 0.8 });
      }
      break;
    case 'demon':
      // Roter Feuer-Burst
      for (let i = 0; i < 15; i++) {
        const a = Math.random() * Math.PI * 2;
        parts.push({ x: e.x, y: e.y, vx: Math.cos(a)*(3+Math.random()*6), vy: Math.sin(a)*(3+Math.random()*6),
          sz: (2+Math.random()*4)*SC, col: i%3===0?'#fbbf24':'#ef4444', life: 0.85 });
      }
      break;
    case 'shooter':
      // Orange Explosion
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        parts.push({ x: e.x, y: e.y, vx: Math.cos(a)*(2+Math.random()*5), vy: Math.sin(a)*(2+Math.random()*5),
          sz: (1.5+Math.random()*3)*SC, col: '#f97316', life: 0.75 });
      }
      break;
    default:
      spawnPart(e.x, e.y, e.col, 8, 5);
  }
  // Weißer Sekundärblitz
  for (let i = 0; i < 6; i++) {
    const a = Math.random() * Math.PI * 2;
    parts.push({ x: e.x, y: e.y, vx: Math.cos(a)*4, vy: Math.sin(a)*4, sz: 2*SC, col:'#fff', life: 0.45 });
  }
}

// ── Draw-Funktionen ─────────────────────────────────────────

export function drawParts(ctx) {
  for (const p of parts) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle   = p.col;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.sz * Math.max(0.35, p.life), 0, Math.PI * 2);
    ctx.fill();
  }
  for (const p of deathPops) {
    const pr = 1 - p.life / p.maxLife;
    ctx.globalAlpha = (1 - pr) * 0.35;
    ctx.fillStyle   = p.col;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.sz * (1 + pr * 0.28), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawDmgNums(ctx) {
  for (const d of fx.dmgNums) {
    ctx.globalAlpha  = Math.max(0, d.life);
    ctx.fillStyle    = d.col;
    ctx.shadowColor  = 'rgba(3,6,12,0.7)';
    ctx.shadowBlur   = 7 * cv.SC;
    ctx.font         = `bold ${d.size}px system-ui`;
    ctx.textAlign    = 'center';
    ctx.fillText(d.dmg, d.x, d.y);
    if (typeof d.dmg === 'number' && d.dmg >= 30) {
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth   = 1 * cv.SC;
      ctx.strokeText(d.dmg, d.x, d.y);
    }
  }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}

export function drawLightningBolts(ctx) {
  for (const b of lightningBolts) {
    ctx.save();
    ctx.globalAlpha = b.life * 1.7;
    ctx.strokeStyle = 'rgba(255,255,255,0.32)'; ctx.lineWidth = 5 * cv.SC;
    ctx.beginPath(); ctx.moveTo(b.x1,b.y1); ctx.lineTo(b.mx||(b.x1+b.x2)/2, b.my||(b.y1+b.y2)/2); ctx.lineTo(b.x2,b.y2); ctx.stroke();
    ctx.strokeStyle = b.col; ctx.lineWidth = 2.4 * cv.SC;
    ctx.beginPath(); ctx.moveTo(b.x1,b.y1); ctx.lineTo(b.mx||(b.x1+b.x2)/2, b.my||(b.y1+b.y2)/2); ctx.lineTo(b.x2,b.y2); ctx.stroke();
    ctx.restore();
  }
}

export function drawLaserBeams(ctx) {
  for (const b of laserBeams) {
    ctx.save();
    ctx.globalAlpha = b.life * 0.55;
    ctx.strokeStyle = b.col; ctx.lineWidth = (12 + b.life*8) * cv.SC; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(b.x1,b.y1); ctx.lineTo(b.x2,b.y2); ctx.stroke();
    ctx.globalAlpha = b.life;
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 3 * cv.SC;
    ctx.beginPath(); ctx.moveTo(b.x1,b.y1); ctx.lineTo(b.x2,b.y2); ctx.stroke();
    ctx.restore();
  }
}

export function tickParticles() {
  for (const p of parts) {
    p.x += p.vx; p.y += p.vy; p.vx *= 0.9; p.vy *= 0.9; p.life -= 0.035;
  }
  // splice dead
  for (let i = parts.length - 1; i >= 0; i--) { if (parts[i].life <= 0) parts.splice(i, 1); }
  for (const b of lightningBolts) b.life -= 0.04;
  for (let i = lightningBolts.length - 1; i >= 0; i--) { if (lightningBolts[i].life <= 0) lightningBolts.splice(i, 1); }
  for (const b of laserBeams) b.life -= 0.1;
  for (let i = laserBeams.length - 1; i >= 0; i--) { if (laserBeams[i].life <= 0) laserBeams.splice(i, 1); }
  for (const p of deathPops) p.life -= 1 / 60;
  for (let i = deathPops.length - 1; i >= 0; i--) { if (deathPops[i].life <= 0) deathPops.splice(i, 1); }
  for (const d of fx.dmgNums) { d.x += d.vx; d.y += d.vy; d.vy *= 0.92; d.life -= 0.03; }
  for (let i = fx.dmgNums.length - 1; i >= 0; i--) { if (fx.dmgNums[i].life <= 0) fx.dmgNums.splice(i, 1); }
}
