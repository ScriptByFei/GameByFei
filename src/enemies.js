// ============================================================
// enemies.js — Spawn, Update, Draw
// ============================================================
import { ETYPES } from './constants.js';
import { cv, player, enemies, setEnemies, run, fx, boss, bossState, gs, nick, meta } from './state.js';
import { getHS, setHS } from './meta.js';
import { tickStatusEffects, getSpeedFactor, drawStatusEffects, initStatus } from './status-effects.js';
import { applyModifierToEnemy } from './wave-modifiers.js';
import { spawnPart, spawnDmgNum, createDeathPop, spawnEnemyDeathEffect } from './particles.js';
import { spawnXP, spawnGold, spawnPowerup } from './pickups.js';
import { sfx } from './audio.js';
import { clamp, shiftHex } from './combat.js';

export function makeEnemyEntity(x, y, d, scale=1, mods={}) {
  const e = {
    x, y,
    sz:   d.s * cv.SC * scale,
    hp:   mods.hp   ?? d.hp,
    maxHp:mods.maxHp ?? mods.hp ?? d.hp,
    spd:  mods.spd  ?? d.sp * cv.SC,
    dmg:  mods.dmg  ?? d.dmg,
    xp:   mods.xp   ?? d.xp,
    sc:   mods.sc   ?? d.sc,
    col:  d.c, t: d.t,
    hit:0, elite:!!mods.elite, kbX:0, kbY:0, spawnIn:10, dead:false,
    slow:0,
  };
  initStatus(e);
  applyModifierToEnemy(e);
  return e;
}

export function mkEnemy() {
  // Ring-Spawn (5% Chance ab Wave 5)
  if (run.wave > 5 && Math.random() < 0.05) {
    const count = 10 + run.wave, ringR = 300 * cv.SC;
    let ti = 0;
    if (run.wave>4&&Math.random()<0.08) ti=3;
    else if (run.wave>2&&Math.random()<0.2) ti=2;
    else if (run.wave>1&&Math.random()<0.35) ti=1;
    const d = ETYPES[ti];
    for (let j=0; j<count; j++) {
      const a = (j/count)*Math.PI*2;
      enemies.push(makeEnemyEntity(
        player.x + Math.cos(a)*ringR,
        player.y + Math.sin(a)*ringR,
        d, 1, { hp:d.hp*(1+(run.wave-1)*0.2), maxHp:d.hp*(1+(run.wave-1)*0.2) }
      ));
    }
    return;
  }

  const m=60*cv.SC, s=Math.floor(Math.random()*4);
  const x = s===0?Math.random()*cv.W : s===1?cv.W+m : s===2?Math.random()*cv.W : -m;
  const y = s===0?-m : s===1?Math.random()*cv.H : s===2?cv.H+m : Math.random()*cv.H;
  let ti=0;
  if (run.wave>4&&Math.random()<0.08) ti=3;
  else if (run.wave>2&&Math.random()<0.2) ti=2;
  else if (run.wave>1&&Math.random()<0.35) ti=1;
  const d = ETYPES[ti];
  enemies.push(makeEnemyEntity(x, y, d, 1,
    { hp:d.hp*(1+(run.wave-1)*0.2), maxHp:d.hp*(1+(run.wave-1)*0.2) }
  ));
}

export function mkElite(ti=0) {
  const d=ETYPES[ti], hp=d.hp*(1+(run.wave-1)*0.2)*5;
  const m=60*cv.SC, s=Math.floor(Math.random()*4);
  const x = s===0?Math.random()*cv.W : s===1?cv.W+m : s===2?Math.random()*cv.W : -m;
  const y = s===0?-m : s===1?Math.random()*cv.H : s===2?cv.H+m : Math.random()*cv.H;
  enemies.push(makeEnemyEntity(x, y, d, 1.3,
    { hp, maxHp:hp, spd:d.sp*cv.SC*0.7, dmg:d.dmg*1.5, xp:d.xp*5, sc:d.sc*3, elite:true }
  ));
  sfx.elite();
}

export function updateEnemies(frame) {
  // Status-Effekte ticken
  tickStatusEffects(enemies, (e, dmg, col) => {
    e.hp -= dmg;
    e.hit = 6;
    spawnDmgNum(e.x, e.y-e.sz, Math.round(dmg), col);
  }, frame);

  const ppx=player.x, ppy=player.y, ppsz=player.sz;
  const armorFactor = 1 - (meta.skills.armor||0)*0.06;

  for (let i=0; i<enemies.length; i++) {
    const e = enemies[i];
    if (e.dead) continue;

    const dx=ppx-e.x, dy=ppy-e.y, d=Math.hypot(dx,dy)||1, minD=ppsz+e.sz;
    const sf = getSpeedFactor(e);

    e.x += (dx/d)*e.spd*sf + (e.kbX||0);
    e.y += (dy/d)*e.spd*sf + (e.kbY||0);
    e.kbX = (e.kbX||0)*0.82;
    e.kbY = (e.kbY||0)*0.82;
    if (e.spawnIn > 0) e.spawnIn--;
    if (e.hit > 0) e.hit--;
    if (e.slow > 0) e.slow--;

    // Spieler-Kollision
    if (d*d < minD*minD && player.inv === 0) {
      player.hp -= e.dmg * armorFactor;
      player.inv = 30; player.dmgFlash = 6;
      fx.shakeT = Math.max(fx.shakeT, 5);
      sfx.hit();
      if (player.hp <= 0) checkPlayerDeath();
    }

    // Tot?
    if (e.hp <= 0 && !e.dead) {
      e.dead = true;
      run.kills++; run.waveKills++;
      run.score += e.sc;
      spawnXP(e.x, e.y, e.xp);
      if (Math.random() < 0.35 * (1 + (meta.skills.luck||0)*0.15))
        spawnGold(e.x, e.y, e.elite ? 4 : (1+Math.floor(Math.random()*3)));
      spawnEnemyDeathEffect(e);
      createDeathPop(e.x, e.y, e.sz, e.col);
      if (e.elite) { fx.hitStop = Math.max(fx.hitStop, 4); fx.eliteFlash = 8; }
      if (Math.random() < 0.12 * (1 + (meta.skills.luck||0)*0.15))
        spawnPowerup(e.x, e.y);
      run.combo++;
      run.comboTimer = 90;
    }
  }

  setEnemies(enemies.filter(e => !e.dead));
}

function checkPlayerDeath() {
  sfx.die();
  setTimeout(() => {
    if (run.score > getHS()) setHS(run.score);
    gs.state = 'nickinput';
    nick.input = ''; nick.cursor = 0;
  }, 600);
}

export function drawEnemy(ctx, e, frame) {
  ctx.save();
  ctx.translate(e.x, e.y);

  const faceA = Math.atan2(player.y-e.y, player.x-e.x);
  const dark  = shiftHex(e.col, -40);
  const mid   = e.hit > 0 ? '#ffffff' : e.col;
  const light = shiftHex(mid, 30);
  const eyeX  = Math.cos(faceA)*e.sz*0.25;
  const eyeY  = Math.sin(faceA)*e.sz*0.1 - e.sz*0.1;

  ctx.lineJoin='round'; ctx.lineCap='round';

  if (e.t === 'slime') {
    // Spikey Crystal Slime
    ctx.fillStyle=mid; ctx.strokeStyle=dark; ctx.lineWidth=2*cv.SC;
    ctx.beginPath();
    ctx.moveTo(0,-e.sz);
    ctx.lineTo(e.sz*0.5,-e.sz*0.5); ctx.lineTo(e.sz*0.9,0);
    ctx.lineTo(e.sz*0.6,e.sz*0.6);  ctx.lineTo(0,e.sz*0.9);
    ctx.lineTo(-e.sz*0.6,e.sz*0.6); ctx.lineTo(-e.sz*0.9,0);
    ctx.lineTo(-e.sz*0.5,-e.sz*0.5);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=light;
    ctx.beginPath();
    ctx.moveTo(0,-e.sz*0.5); ctx.lineTo(e.sz*0.4,0); ctx.lineTo(0,e.sz*0.5); ctx.lineTo(-e.sz*0.4,0);
    ctx.fill();

  } else if (e.t === 'bat') {
    // Mechanical Drone
    ctx.fillStyle=mid; ctx.strokeStyle=dark; ctx.lineWidth=2*cv.SC;
    ctx.beginPath();
    ctx.moveTo(0,-e.sz*0.8);
    ctx.lineTo(e.sz*1.2,-e.sz*0.2); ctx.lineTo(e.sz*0.3,e.sz*0.4);
    ctx.lineTo(0,e.sz*0.8);
    ctx.lineTo(-e.sz*0.3,e.sz*0.4); ctx.lineTo(-e.sz*1.2,-e.sz*0.2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.arc(eyeX,eyeY+e.sz*0.2,e.sz*0.25,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ef4444';
    ctx.beginPath(); ctx.arc(eyeX+Math.cos(faceA)*e.sz*0.05,eyeY+e.sz*0.2+Math.sin(faceA)*e.sz*0.05,e.sz*0.1,0,Math.PI*2); ctx.fill();

  } else if (e.t === 'skull') {
    // Void Walker (Cube)
    ctx.fillStyle=mid; ctx.strokeStyle=dark; ctx.lineWidth=2*cv.SC;
    ctx.fillRect(-e.sz*0.8,-e.sz*0.8,e.sz*1.6,e.sz*1.6);
    ctx.strokeRect(-e.sz*0.8,-e.sz*0.8,e.sz*1.6,e.sz*1.6);
    ctx.fillStyle=dark;
    ctx.fillRect(eyeX-e.sz*0.4,eyeY-e.sz*0.1,e.sz*0.3,e.sz*0.3);
    ctx.fillRect(eyeX+e.sz*0.1,eyeY-e.sz*0.1,e.sz*0.3,e.sz*0.3);

  } else if (e.t === 'demon') {
    // Giant Star
    ctx.fillStyle=mid; ctx.strokeStyle=dark; ctx.lineWidth=3*cv.SC;
    ctx.beginPath();
    for (let i=0; i<10; i++) {
      const a = i*Math.PI/5;
      const r = i%2===0 ? e.sz : e.sz*0.6;
      ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#fbbf24';
    ctx.beginPath(); ctx.arc(eyeX,eyeY,e.sz*0.3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=dark;
    ctx.beginPath(); ctx.arc(eyeX+Math.cos(faceA)*e.sz*0.05,eyeY+Math.sin(faceA)*e.sz*0.05,e.sz*0.1,0,Math.PI*2); ctx.fill();

  } else if (e.t === 'boss') {
    // Boss-Shape (großes Demon-Design)
    ctx.fillStyle = e.hitFlash > 0 ? '#fff' : (e.col || mid);
    ctx.strokeStyle = dark; ctx.lineWidth = 4*cv.SC;
    ctx.beginPath();
    for (let i=0; i<8; i++) {
      const a = i*Math.PI/4;
      const r = i%2===0 ? e.sz : e.sz*0.7;
      ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#fff'; ctx.font=`bold ${e.sz*0.5}px system-ui`; ctx.textAlign='center';
    ctx.fillText('👁',0,e.sz*0.18);
  }

  // Elite-Ring
  if (e.elite) {
    ctx.strokeStyle='rgba(255,215,0,0.95)'; ctx.lineWidth=2*cv.SC;
    ctx.beginPath(); ctx.arc(0,0,e.sz*1.15,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle='#FFD700'; ctx.font=`bold ${10*cv.SC}px system-ui`; ctx.textAlign='center';
    ctx.fillText('ELITE',0,-e.sz*1.4);
  }

  // HP-Balken (wenn nicht voll)
  if (e.hp < e.maxHp) {
    const bw=e.sz*2.2;
    ctx.fillStyle='rgba(0,0,0,0.5)';
    ctx.fillRect(-bw/2,-e.sz-9*cv.SC,bw,4*cv.SC);
    ctx.fillStyle='#ef4444';
    ctx.fillRect(-bw/2,-e.sz-9*cv.SC,bw*(e.hp/e.maxHp),4*cv.SC);
  }

  ctx.restore();

  // Status-Effekte (ausserhalb save/restore damit translate nicht wirkt)
  drawStatusEffects(ctx, e, cv.SC, frame);
}
