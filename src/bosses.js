// ============================================================
// bosses.js — Boss-KI mit Spezialangriffen, Phasen
// ============================================================
import { BOSSES, ETYPES } from './constants.js';
import { cv, gs, player, run, fx, bossState, enemies, projs, enemyProjs, laserBeams, nick } from './state.js';
import { makeEnemyEntity } from './enemies.js';
import { hitBoss } from './combat.js';
import { getHS, setHS } from './meta.js';
import { spawnPart, spawnDmgNum, createDeathPop } from './particles.js';
import { spawnXP, spawnGold } from './pickups.js';
import { sfx } from './audio.js';

// boss-Objekt wird via state.js importiert — zirkuläre Imports vermeiden
// wir übergeben boss immer als Argument

export function spawnBoss(setBossRef, bossActiveSet) {
  const bi  = Math.min(Math.floor(run.wave/10)-1, BOSSES.length-1);
  const bd  = bi < 0 ? BOSSES[0] : BOSSES[bi];
  const hp  = bd.hpMult * (1 + Math.max(0, run.wave-10)*0.3) * 100;
  const m   = 100*cv.SC, side = Math.floor(Math.random()*4);
  const bx  = side===0?cv.W/2 : side===1?cv.W+m : side===2?cv.W/2 : -m;
  const by  = side===0?-m : side===1?cv.H/2 : side===2?cv.H+m : cv.H/2;

  // Angriffs-Cooldowns initialisieren
  const attacks = (bd.attacks || []).map(a => ({ ...a, cdT: Math.floor(a.cd*0.5) }));

  const bossObj = {
    x: bx, y: by, sz: 55*cv.SC, hp, maxHp: hp,
    spd: 1.2*cv.SC, dmg: 20*bd.dmgMult, xp: bd.sc, sc: bd.sc,
    col: bd.col, t: 'boss', hit: 0, hitFlash: 0,
    name: bd.name, spawnMinions: bd.spawnMinions,
    minionSpawned: false, attackTimer: 120,
    kbX: 0, kbY: 0, spawnIn: 12, slow: 0,
    status: null,
    attacks,
    _shielded: false, _dashT: 0, _dashVx: 0, _dashVy: 0,
    _slamWarn: null, _sweepAngle: 0, _sweepActive: false, _sweepT: 0,
    phase2: false,
  };

  setBossRef(bossObj);
  bossActiveSet(true);
  bossState.spawnedThisWave = true;
  fx.shakeT = 30;
  bossState.barHp = hp;
  bossState.barAlpha = 0;
  bossState.barMeta = { name: bd.name, col: bd.col, maxHp: hp, hp };
  bossState.intro = { name: bd.name, col: bd.col, t: 120 };
  sfx.boss();
}

export function updateBoss(boss, setBossRef, frame) {
  if (!boss || boss.hp <= 0) return;

  // Phase-2 Check
  if (!boss.phase2 && boss.hp <= boss.maxHp * 0.5) {
    boss.phase2 = true;
    for (const a of boss.attacks) a.cd = Math.round(a.cd * 0.7);
    boss.spd *= 1.3;
    fx.shakeT = 20;
    spawnDmgNum(boss.x, boss.y - boss.sz*1.2, 'PHASE 2', '#ef4444');
  }

  // Bewegung
  const dx = player.x - boss.x, dy = player.y - boss.y, d = Math.hypot(dx,dy)||1;
  const bssm = boss.slow > 0 ? 0.4 : 1;
  if (boss.slow > 0) boss.slow--;

  if (boss._dashT > 0) {
    boss._dashT--;
    boss.x += boss._dashVx; boss.y += boss._dashVy;
  } else {
    boss.x += (dx/d)*boss.spd*bssm + (boss.kbX||0);
    boss.y += (dy/d)*boss.spd*bssm + (boss.kbY||0);
  }
  boss.kbX = (boss.kbX||0)*0.82;
  boss.kbY = (boss.kbY||0)*0.82;
  if (boss.spawnIn > 0) boss.spawnIn--;
  if (boss.hit > 0) boss.hit--;
  if (boss.hitFlash > 0) boss.hitFlash--;

  // Spieler-Kollision
  if (d < player.sz+boss.sz && player.inv === 0) {
    player.hp -= boss.dmg;
    player.inv = 40; player.dmgFlash = 8;
    fx.shakeT = 22; sfx.hit();
    if (player.hp <= 0) {
      sfx.die();
      setTimeout(() => {
        if (run.score > getHS()) setHS(run.score);
        gs.state='nickinput'; nick.input=''; nick.cursor=0;
      }, 600);
    }
  }

  // Spezialangriffe ticken
  if (boss.spawnIn <= 0) {
    for (const atk of boss.attacks) {
      if (atk.cdT > 0) { atk.cdT--; continue; }
      executeAttack(boss, atk, frame);
      atk.cdT = atk.cd;
    }
  }

  // Laser-Sweep aktiv
  if (boss._sweepActive) {
    boss._sweepT--;
    boss._sweepAngle += 0.04;
    const swAtk = boss.attacks.find(a=>a.type==='laser_sweep');
    const range = (swAtk?.range||400)*cv.SC;
    const ex = boss.x + Math.cos(boss._sweepAngle)*range;
    const ey = boss.y + Math.sin(boss._sweepAngle)*range;
    laserBeams.push({ x1:boss.x, y1:boss.y, x2:ex, y2:ey, col:boss.col, life:0.6 });
    // Spieler treffen
    const pdx = player.x-boss.x, pdy = player.y-boss.y;
    const t = Math.max(0,Math.min(1,(pdx*(ex-boss.x)+pdy*(ey-boss.y))/(range*range)));
    const cx = boss.x+t*(ex-boss.x), cy = boss.y+t*(ey-boss.y);
    if (Math.hypot(player.x-cx,player.y-cy) < player.sz+10*cv.SC && player.inv===0 && boss._sweepT%8===0) {
      player.hp -= swAtk?.dmg||6; player.inv=20; player.dmgFlash=6; sfx.hit();
    }
    if (boss._sweepT <= 0) boss._sweepActive = false;
  }

  // Slam-Warnung
  if (boss._slamWarn) {
    boss._slamWarn.t--;
    if (boss._slamWarn.t <= 0) {
      doSlam(boss, boss._slamWarn);
      boss._slamWarn = null;
    }
  }

  // Boss tot?
  if (boss.hp <= 0) {
    run.score += boss.sc;
    run.xp += 20;
    spawnXP(boss.x, boss.y, boss.xp);
    spawnGold(boss.x, boss.y, 20);
    spawnPart(boss.x, boss.y, boss.col, 20, 8);
    spawnPart(boss.x, boss.y, '#fff', 12, 5);
    createDeathPop(boss.x, boss.y, boss.sz, boss.col);
    bossState.barMeta = { name:boss.name, col:boss.col, maxHp:boss.maxHp, hp:0 };
    bossState.barHp   = Math.max(0, bossState.barHp);
    bossState.barAlpha = 1;
    fx.hitStop = Math.max(fx.hitStop, 8);
    fx.shakeT = 15;
    sfx.bosskill();
    setBossRef(null);
  }
}

function executeAttack(boss, atk, frame) {
  switch (atk.type) {
    case 'projectile_burst': {
      const count = atk.count || 8;
      for (let i = 0; i < count; i++) {
        const a = (i/count)*Math.PI*2;
        enemyProjs.push({ x:boss.x, y:boss.y,
          vx:Math.cos(a)*(atk.spd||5)*cv.SC, vy:Math.sin(a)*(atk.spd||5)*cv.SC,
          dmg:atk.dmg||25, sz:7*cv.SC, col:atk.col||boss.col, life:280 });
      }
      fx.shakeT = Math.max(fx.shakeT, 8);
      sfx.boss();
      break;
    }
    case 'aimed_shot': {
      const dx=player.x-boss.x, dy=player.y-boss.y, d=Math.hypot(dx,dy)||1;
      const spd=(atk.spd||14)*cv.SC;
      enemyProjs.push({ x:boss.x, y:boss.y,
        vx:(dx/d)*spd, vy:(dy/d)*spd,
        dmg:atk.dmg||40, sz:9*cv.SC, col:atk.col||boss.col, life:320,
        piercing:!!atk.piercing });
      sfx.shoot();
      break;
    }
    case 'dash': {
      const dx=player.x-boss.x, dy=player.y-boss.y, d=Math.hypot(dx,dy)||1;
      const force=(atk.force||18)*cv.SC;
      boss._dashVx=(dx/d)*force; boss._dashVy=(dy/d)*force;
      boss._dashT=atk.duration||22;
      break;
    }
    case 'aoe_slam': {
      boss._slamWarn = { x:player.x, y:player.y, radius:(atk.radius||120)*cv.SC,
        dmg:atk.dmg||45, knockback:atk.knockback||20, t:atk.warnFrames||45 };
      break;
    }
    case 'laser_sweep': {
      const dx=player.x-boss.x, dy=player.y-boss.y;
      boss._sweepAngle = Math.atan2(dy,dx);
      boss._sweepActive = true;
      boss._sweepT = atk.duration || 90;
      break;
    }
    case 'spawn_minions': {
      if (!boss.minionSpawned || frame % 600 === 0) {
        const count = atk.count || boss.spawnMinions || 5;
        for (let i = 0; i < count; i++) {
          const a=(i/count)*Math.PI*2;
          const d=ETYPES[Math.floor(Math.random()*2)];
          enemies.push(makeEnemyEntity(boss.x+Math.cos(a)*boss.sz*2, boss.y+Math.sin(a)*boss.sz*2, d, 0.8,
            { hp:d.hp*(1+(run.wave-1)*0.15), maxHp:d.hp*(1+(run.wave-1)*0.15), spd:d.sp*cv.SC*1.2 }));
        }
        boss.minionSpawned = true;
        sfx.elite();
      }
      break;
    }
    case 'boss_shield': {
      boss._shielded = true;
      setTimeout(() => { if (boss) boss._shielded = false; }, (atk.duration||120) * (1000/60));
      break;
    }
    case 'teleport': {
      const offset = (atk.offset||160)*cv.SC;
      const a = Math.random()*Math.PI*2;
      boss.x = player.x + Math.cos(a)*offset;
      boss.y = player.y + Math.sin(a)*offset;
      spawnPart(boss.x, boss.y, boss.col, 12, 6);
      break;
    }
  }
}

function doSlam(boss, warn) {
  // AOE Schaden in Radius
  const players_in_range = Math.hypot(player.x-warn.x, player.y-warn.y) < warn.radius;
  if (players_in_range && player.inv === 0) {
    player.hp -= warn.dmg;
    player.inv = 40; player.dmgFlash = 8;
    const dx=player.x-warn.x, dy=player.y-warn.y, d=Math.hypot(dx,dy)||1;
    player.vx += (dx/d)*(warn.knockback||20)*cv.SC;
    player.vy += (dy/d)*(warn.knockback||20)*cv.SC;
    fx.shakeT = 25; sfx.hit();
  }
  // Visueller Ring
  spawnPart(warn.x, warn.y, boss.col, 20, 6);
  fx.shakeT = Math.max(fx.shakeT, 15);
}

export function drawBossWarnRing(ctx, boss, frame) {
  if (!boss?._slamWarn) return;
  const w = boss._slamWarn;
  const pulse = 0.6 + Math.sin(frame*0.4)*0.4;
  ctx.save();
  ctx.globalAlpha = pulse * 0.5;
  ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4*cv.SC;
  ctx.beginPath(); ctx.arc(w.x, w.y, w.radius, 0, Math.PI*2); ctx.stroke();
  ctx.globalAlpha = pulse * 0.1;
  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.arc(w.x, w.y, w.radius, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}
