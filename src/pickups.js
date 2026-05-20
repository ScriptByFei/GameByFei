// ============================================================
// pickups.js — XP, Gold, Power-Ups
// ============================================================
import { PUDEF } from './constants.js';
import { cv, player, orbs, parts, powerups, buffs, run, enemies, boss } from './state.js';
import { spawnPart, spawnDmgNum } from './particles.js';
import { sfx } from './audio.js';
import { noPowerups } from './wave-modifiers.js';
import { meta } from './state.js';

export function spawnXP(x, y, v) {
  orbs.push({ x, y, v, sz:(4+v*2)*cv.SC, vx:(Math.random()-.5)*3, vy:(Math.random()-.5)*3, life:300, mag:false, done:false, kind:'xp' });
}

export function spawnGold(x, y, v) {
  orbs.push({ x, y, v, sz:(6+v)*cv.SC, vx:(Math.random()-.5)*2.4, vy:(Math.random()-.5)*2.4, life:360, mag:false, done:false, kind:'gold' });
}

export function spawnPowerup(x, y) {
  if (noPowerups()) return;
  const GT = window.__GAME_TOP || cv.safeTop + 10*cv.SC;
  const GB = window.__GAME_BOTTOM || cv.H - cv.safeBottom - 10*cv.SC;
  const keys = Object.keys(PUDEF);
  const k = keys[Math.floor(Math.random()*keys.length)];
  const p = PUDEF[k];
  const cx = Math.max(40*cv.SC, Math.min(cv.W-40*cv.SC, x));
  const cy = Math.max(GT+20*cv.SC, Math.min(GB-20*cv.SC, y));
  powerups.push({ x:cx, y:cy, vx:(Math.random()-.5)*1.5, vy:(Math.random()-.5)*1.5-0.5,
    sz:14*cv.SC, col:p.col, icon:p.icon, type:k, life:300, ttl:600 });
}

export function collectPowerup(p) {
  if (p.type === 'heal') {
    player.hp = Math.min(player.maxHp, player.hp + 25);
    spawnPart(p.x, p.y, '#22c55e', 8, 4); sfx.xp();
  } else if (p.type === 'speed') {
    buffs.speed = { t: 180 };
    player.spd *= 1.5;
    setTimeout(() => { player.spd /= 1.5; }, 9000);
  } else if (p.type === 'dmg') {
    buffs.dmg = { t: 180 };
  } else if (p.type === 'freeze') {
    buffs.freeze = { t: 180 };
    enemies.forEach(e => e.slow = Math.max(e.slow, 180));
    if (boss) boss.slow = Math.max(boss.slow || 0, 180);
    spawnPart(p.x, p.y, '#67e8f9', 14, 5);
  }
  spawnDmgNum(p.x, p.y-10*cv.SC,
    p.type==='heal'?'+25':p.type==='speed'?'SPD':p.type==='freeze'?'❄FREEZE':'DMG',
    p.col);
}

export function updateOrbs(showLevelUpMenu) {
  const magnetRange = 130*cv.SC * (1 + meta.skills.magnet*0.2) * (player.pickupRange || 1);
  for (const o of orbs) {
    const d = Math.hypot(o.x-player.x, o.y-player.y);
    if (d < magnetRange) o.mag = true;
    if (o.mag && d > 1) {
      o.x += (player.x-o.x)/d*8; o.y += (player.y-o.y)/d*8;
    } else {
      o.x += o.vx; o.y += o.vy; o.vx *= 0.93; o.vy *= 0.93;
    }
    o.life--;
    if (d < player.sz + o.sz && !o.done) {
      o.done = true;
      if (o.kind === 'gold') {
        run.gold += o.v; run.runGold += o.v;
        spawnDmgNum(o.x, o.y, '+'+o.v+' Gold', '#FFD700');
      } else {
        run.xp += o.v; sfx.xp();
        if (run.xp >= run.xpNeed) {
          run.xp -= run.xpNeed;
          run.level++;
          run.xpNeed = Math.floor(run.xpNeed * 1.5);
          sfx.lvup();
          showLevelUpMenu();
          // Level-Up Partikel
          for (let i = 0; i < 18; i++) {
            const a = (i/18)*Math.PI*2;
            parts.push({ x:player.x+Math.cos(a)*30*cv.SC, y:player.y+Math.sin(a)*30*cv.SC,
              vx:Math.cos(a)*4, vy:Math.sin(a)*4, sz:6*cv.SC, col:'#f6dd73', life:1 });
          }
        }
      }
    }
  }
  for (let i = orbs.length-1; i >= 0; i--) { if (orbs[i].done || orbs[i].life <= 0) orbs.splice(i,1); }
}

export function updatePowerups() {
  for (const p of powerups) {
    p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy *= 0.96;
    p.life--; p.ttl--;
    const d = Math.hypot(p.x-player.x, p.y-player.y);
    if (d < player.sz+p.sz+10*cv.SC) { collectPowerup(p); p.done = true; }
    else if (p.ttl <= 0) p.done = true;
  }
  for (let i = powerups.length-1; i >= 0; i--) { if (powerups[i].done) powerups.splice(i,1); }
}

export function drawOrb(ctx, o, frame) {
  const pul = Math.sin(frame*0.1+o.x)*0.25+1;
  if (o.kind === 'gold') {
    ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#f6dd73';
    ctx.beginPath(); ctx.arc(o.x,o.y,o.sz*1.9*pul,0,Math.PI*2); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#f6dd73'; ctx.beginPath(); ctx.arc(o.x,o.y,o.sz*pul,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff7ae'; ctx.beginPath(); ctx.arc(o.x,o.y,o.sz*0.42*pul,0,Math.PI*2); ctx.fill();
  } else {
    ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = '#7dd3fc';
    ctx.beginPath(); ctx.arc(o.x,o.y,o.sz*1.8*pul,0,Math.PI*2); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#7dd3fc'; ctx.beginPath(); ctx.arc(o.x,o.y,o.sz*pul,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#d9faff'; ctx.beginPath(); ctx.arc(o.x,o.y,o.sz*0.46*pul,0,Math.PI*2); ctx.fill();
  }
}

export function drawPowerups(ctx, frame) {
  for (const p of powerups) {
    const pul = Math.sin(frame*0.12+p.y*0.05)*0.15+1;
    const blinking = p.ttl < 120 && Math.floor(frame/6)%2===0;
    if (blinking) continue;
    const sz = p.sz*pul;
    ctx.save();
    ctx.shadowColor = p.col; ctx.shadowBlur = 12*cv.SC;
    ctx.fillStyle = p.col+'33'; ctx.strokeStyle = p.col; ctx.lineWidth = 2*cv.SC;
    // bolt shape für alle (vereinfacht)
    ctx.beginPath();
    ctx.moveTo(p.x+sz*0.2, p.y-sz);
    ctx.lineTo(p.x-sz*0.3, p.y+sz*0.1);
    ctx.lineTo(p.x+sz*0.1, p.y+sz*0.1);
    ctx.lineTo(p.x-sz*0.2, p.y+sz);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Icon
    ctx.shadowBlur = 0; ctx.fillStyle = p.col; ctx.font=`bold ${14*cv.SC}px system-ui`; ctx.textAlign='center';
    ctx.fillText(p.icon, p.x, p.y+5*cv.SC);
    ctx.restore();
  }
}
