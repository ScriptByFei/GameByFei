// ============================================================
// game.js — Haupt-Loop, State-Machine, Init
// ============================================================
import { WDEF, ALL_WEAPON_KEYS, BOSSES, ETYPES } from './constants.js';
import {
  cv, gs, player, run, fx, buffs, bossState, lb, nick, meta, levelUp,
  weapons, boss, selectedStartWeapon, setSelectedStartWeapon,
  enemies, projs, enemyProjs, orbs, parts, pools, powerups,
  laserBeams, lightningBolts, deathPops, bgDust, menuDust,
  keys, touch, joystick, waveModifier,
  upgScroll, setUpgScroll, upgDrag,
  setWeapons, setBoss,
  setEnemies, setProjs, setEnemyProjs, setOrbs, setParts, setPools, setPowerups,
  setLaserBeams, setLightningBolts, setDeathPops,
} from './state.js';
import { loadMeta, saveMeta, getHS, setHS } from './meta.js';
import { fetchLeaderboard, submitScore } from './leaderboard.js';
import { ACinit, sfx } from './audio.js';
import { createWeaponInstance, canAddWeapon, shoot, upWeap } from './weapons.js';
import { mkEnemy, mkElite, updateEnemies, drawEnemy } from './enemies.js';
import { spawnBoss, updateBoss, drawBossWarnRing } from './bosses.js';
import { updateOrbs, updatePowerups, spawnXP, spawnGold, drawOrb, drawPowerups } from './pickups.js';
import { spawnPart, spawnDmgNum, createDeathPop, tickParticles,
         drawParts, drawDmgNums, drawLightningBolts, drawLaserBeams } from './particles.js';
import { tickModifier, rollWaveModifier } from './wave-modifiers.js';
import { resetSkills, applySkill, rollSkillOptions, getSkillLevel } from './skills.js';
import {
  drawUI, drawMenu, drawLeaderboard, drawNickInput, drawPause, drawGO,
  drawWeaponSelect, drawUpgrades, drawLevelUp, drawJoystick, isInRect,
  menuHitTest, weaponSelectHitTest, getUpgradeLayout, upgradeHitTest, applyUpgradeHit,
} from './ui.js';
import { clamp, hitEnemy, hitBoss } from './combat.js';

// ── Canvas Setup ─────────────────────────────────────────────
const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');
cv.el  = canvas;
cv.ctx = ctx;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (window.visualViewport) {
    cv.W = window.visualViewport.width;
    cv.H = window.visualViewport.height;
  } else {
    cv.W = window.innerWidth;
    cv.H = window.innerHeight;
  }
  canvas.width  = cv.W * dpr;
  canvas.height = cv.H * dpr;
  canvas.style.width  = cv.W + 'px';
  canvas.style.height = cv.H + 'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  cv.SC = Math.min(cv.W/400, cv.H/700);
  joystick.sz = 35 * cv.SC;
  const css = window.getComputedStyle(document.documentElement);
  cv.safeTop    = parseFloat(css.getPropertyValue('--sat')) || parseFloat(css.getPropertyValue('padding-top')) || Math.max(44, cv.H*0.05);
  cv.safeBottom = parseFloat(css.getPropertyValue('--sab')) || Math.max(34, cv.H*0.03);
}

resize();
window.addEventListener('resize', resize);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resize);
  window.visualViewport.addEventListener('scroll', resize);
}

// ── Nick-Feld ─────────────────────────────────────────────────
const nickField = document.getElementById('nickField');
function showNickInput() { nickField.style.display='block'; nickField.value=nick.input; nickField.focus(); }
function hideNickInput() { nickField.style.display='none'; nickField.blur(); }

nickField.addEventListener('input', () => {
  nick.input  = nickField.value.toUpperCase().replace(/[^A-Z0-9_\-]/g,'').substring(0,8);
  nick.cursor = nick.input.length;
});
nickField.addEventListener('keydown', e => {
  if (e.key==='Enter' && nick.input.length>0) {
    e.preventDefault();
    submitScore(nick.input, run.score).then(() => {});
    gs.state='leaderboard'; lb.loading=true;
    fetchLeaderboard().then(()=>lb.loading=false);
    hideNickInput();
  }
  if (e.key==='Escape') hideNickInput();
});

// ── Init ──────────────────────────────────────────────────────
function init() {
  const SC = cv.SC;
  player.x = cv.W/2; player.y = cv.H/2;
  player.sz = 22*SC;
  player.hp = 100 + (meta.skills.hp||0)*10;
  player.maxHp = player.hp;
  player.spd = 3.8*SC*(1+(meta.skills.spd||0)*0.05);
  player.inv = 0; player.angle = 0; player.vx = 0; player.vy = 0;
  player.dmgFlash = 0;
  // Reset per-run passive skill fields
  player.critChance = 0; player.critMult = 1.5;
  player.bonusPierce = 0; player.bonusProjectiles = 0; player.cdReduction = 1;
  player.hpRegen = 0; player.lifesteal = 0; player.dodgeChance = 0;
  player.xpMult = 1; player.pickupRange = 1; player.spdMult = 1;
  player.burnOnHit = 0; player.poisonOnHit = 0; player.chainLightning = 0; player.freezeOnHit = 0;

  setEnemies([]); setProjs([]); setEnemyProjs([]); setOrbs([]);
  setParts([]); setPools([]); setPowerups([]); setLaserBeams([]);
  setLightningBolts([]); setDeathPops([]);
  fx.dmgNums = [];

  run.wave=0; run.score=0; run.frame=0; run.gameTime=0;
  run.gold=0; run.runGold=0; run.kills=0; run.waveKills=0;
  run.level=1; run.xp=0; run.xpNeed=10;
  run.combo=0; run.comboTimer=0;
  run.eliteTimer=0; run.eliteSpawnedThisWave=false;
  run.waveAnnounce=null;

  setWeapons([]);
  const startKey = selectedStartWeapon || 'magic';
  if (WDEF[startKey]) weapons.push(createWeaponInstance(startKey));

  setBoss(null);
  bossState.active=false; bossState.spawnedThisWave=false;
  bossState.barHp=0; bossState.barAlpha=0; bossState.barMeta=null;
  bossState.intro=null; bossState.warn=null;

  fx.shakeT=0; fx.hitStop=0; fx.eliteFlash=0;
  Object.keys(buffs).forEach(k=>delete buffs[k]);

  levelUp.options=[]; levelUp.cooldown=0; levelUp.selectedOption=-1;
  waveModifier.active=null; waveModifier.bannerT=0;

  resetSkills();
  initAmbient();
  fetchLeaderboard();
}

function initAmbient() {
  bgDust.length=0;
  for (let i=0; i<18; i++) {
    bgDust.push({ x:(i*67%100)/100*cv.W, y:(i*41%100)/100*cv.H,
      vx:(Math.random()-.5)*0.08*cv.SC, vy:(-0.08-Math.random()*0.06)*cv.SC,
      sz:(1+Math.random()*2)*cv.SC, a:0.1+Math.random()*0.1 });
  }
  menuDust.length=0;
  for (let i=0; i<14; i++) {
    menuDust.push({ x:(i*53%100)/100*cv.W, y:(i*29%100)/100*cv.H,
      vx:(Math.random()-.5)*0.12*cv.SC, vy:(-0.12-Math.random()*0.08)*cv.SC,
      sz:(1.5+Math.random()*2.5)*cv.SC, a:0.12+Math.random()*0.1,
      phase:Math.random()*Math.PI*2, col:'rgba(255,255,255,0.9)' });
  }
}

// ── Level-Up Menü ─────────────────────────────────────────────
function showLevelUpMenu() {
  gs.state = 'levelup';
  levelUp.options = [];
  levelUp.cooldown = 45;

  // Build weapon candidates
  const have = weapons.map(w=>w.wKey);
  const candidates = [];
  weapons.forEach(w => {
    candidates.push({
      type:'upgrade', key:w.wKey, weapon:w, col:WDEF[w.wKey].col,
      label: WDEF[w.wKey].name+' Lv+'+(w.lvl+1),
    });
  });
  ALL_WEAPON_KEYS.filter(k=>!have.includes(k)&&canAddWeapon(k)).forEach(key=>{
    candidates.push({ type:'new', key, weapon:null, col:WDEF[key].col, label:WDEF[key].name+' (neu!)' });
  });

  // 2 random passive skills
  const skillOptions = rollSkillOptions(2);

  // Pick 1 weapon option + 2 skill options, shuffle
  const shuffledWeapons = [...candidates].sort(()=>Math.random()-.5);
  const weaponOpt = shuffledWeapons[0];

  const opts = [];
  if (weaponOpt) opts.push(weaponOpt);
  skillOptions.forEach(sd => opts.push({ type:'skill', key:sd.id, skillDef:sd }));
  opts.sort(()=>Math.random()-.5);
  levelUp.options = opts.slice(0,3);
  levelUp.selectedOption = -1;
}

function selectLevelUp(idx) {
  if (idx < 0 || idx >= levelUp.options.length) return;
  if (levelUp.cooldown > 0) return;
  const opt = levelUp.options[idx];
  if (opt.type === 'upgrade' && opt.weapon) {
    opt.weapon.lvl++;
  } else if (opt.type === 'new' && canAddWeapon(opt.key)) {
    weapons.push(createWeaponInstance(opt.key));
  } else if (opt.type === 'skill') {
    const cur = getSkillLevel(opt.key);
    applySkill(opt.key, cur + 1);
  }
  gs.state = 'play';
}

// ── Update ────────────────────────────────────────────────────
function update() {
  menuDust.forEach(d=>{d.x=(d.x+d.vx+cv.W)%cv.W;d.y=(d.y+d.vy+cv.H)%cv.H;});
  if (gs.state!=='play'&&gs.state!=='levelup') return;
  if (levelUp.cooldown>0) levelUp.cooldown--;
  if (gs.state==='levelup') return;

  run.frame++; run.gameTime++;
  if (run.comboTimer>0) run.comboTimer--; else run.combo=0;

  // Meta regen (permanent)
  if (meta.skills.regen>0 && run.frame%30===0 && player.hp<player.maxHp)
    player.hp = Math.min(player.maxHp, player.hp + meta.skills.regen*0.2);

  if (fx.shakeT>0){fx.shakeT--;fx.shakeX=(Math.random()-.5)*fx.shakeT*0.5;fx.shakeY=(Math.random()-.5)*fx.shakeT*0.5;}
  else{fx.shakeX=0;fx.shakeY=0;}

  // Boss bar smooth interpolation
  if (boss) {
    bossState.barMeta={name:boss.name,col:boss.col,maxHp:boss.maxHp,hp:boss.hp};
    bossState.barHp+=(boss.hp-bossState.barHp)*0.18;
    bossState.barAlpha=Math.min(1,bossState.barAlpha+0.08);
  } else if (bossState.barMeta) {
    bossState.barHp+=(bossState.barMeta.hp-bossState.barHp)*0.25;
    bossState.barAlpha=Math.max(0,bossState.barAlpha-1/30);
    if (bossState.barAlpha<=0.01){bossState.barAlpha=0;bossState.barMeta=null;}
  }

  bgDust.forEach(d=>{d.x=(d.x+d.vx+cv.W)%cv.W;d.y=(d.y+d.vy+cv.H)%cv.H;});

  // Player movement (touch/joystick)
  const GT=window.__GAME_TOP||cv.safeTop+10*cv.SC;
  const GB=window.__GAME_BOTTOM||cv.H-cv.safeBottom-10*cv.SC;
  if (joystick.active&&(Math.abs(joystick.dx)>2||Math.abs(joystick.dy)>2)){
    const effSpd = player.spd*(player.spdMult||1);
    const len=Math.hypot(joystick.dx,joystick.dy)||1;
    player.vx=(joystick.dx/len)*effSpd; player.vy=(joystick.dy/len)*effSpd;
    player.x+=(joystick.dx/len)*effSpd; player.y+=(joystick.dy/len)*effSpd;
  } else if (touch.on&&(Math.abs(touch.dx)>5||Math.abs(touch.dy)>5)){
    const effSpd = player.spd*(player.spdMult||1);
    const len=Math.hypot(touch.dx,touch.dy);
    player.vx=(touch.dx/len)*effSpd; player.vy=(touch.dy/len)*effSpd;
    player.x+=(touch.dx/len)*effSpd; player.y+=(touch.dy/len)*effSpd;
  }
  player.x=Math.max(player.sz,Math.min(cv.W-player.sz,player.x));
  player.y=Math.max(GT+player.sz,Math.min(GB-player.sz,player.y));

  // HP Regen (per-run skill)
  if (player.hpRegen>0) player.hp=Math.min(player.maxHp,player.hp+player.hpRegen);

  // Auto-aim at nearest enemy/boss
  let near=null, nd=Infinity;
  enemies.forEach(e=>{const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<nd){nd=d;near=e;}});
  if (boss){const d=Math.hypot(boss.x-player.x,boss.y-player.y);if(d<nd){nd=d;near=boss;}}
  if (near){player.angle=Math.atan2(near.y-player.y,near.x-player.x);}

  shoot(); upWeap();

  // Wave tick
  if (run.frame%600===0&&run.frame>0){
    run.wave++;
    bossState.spawnedThisWave=false;
    run.eliteSpawnedThisWave=false;
    run.waveKills=0;
    if (run.wave%10===0) bossState.warn={t:150};
    run.waveAnnounce={t:160,n:run.wave};
    rollWaveModifier();
  }

  tickModifier();

  const isBossWave=run.wave>0&&run.wave%10===0;
  if (isBossWave&&!bossState.active&&!bossState.spawnedThisWave&&run.frame%180===0) {
    spawnBoss(setBoss, v=>bossState.active=v);
  }
  if (!bossState.active){
    const spawnRate=Math.max(18,75-run.wave*4);
    if (run.frame%spawnRate===0) mkEnemy();
  }

  // Elite spawn
  if (run.wave>=5) {
    run.eliteTimer=(run.eliteTimer||0)+1;
    const eliteInterval=Math.max(200,500-run.wave*15);
    if (run.eliteTimer>=eliteInterval){
      let ei=0;
      if(run.wave>4&&Math.random()<0.5)ei=3;
      else if(run.wave>2&&Math.random()<0.4)ei=2;
      else if(run.wave>1&&Math.random()<0.6)ei=1;
      mkElite(ei); run.eliteTimer=0;
    }
  }

  // Boss update
  if (boss) {
    updateBoss(boss, setBoss, run.frame);
    if (!boss) bossState.active=false;
  }

  updateEnemies(run.frame);

  // Projectiles
  for (const p of projs) { p.x+=p.vx; p.y+=p.vy; p.life--; }
  for (let i=projs.length-1;i>=0;i--){
    const p=projs[i];
    if(p.life<=0||p.x<-80||p.x>cv.W+80||p.y<-80||p.y>cv.H+80){projs.splice(i,1);continue;}
    for(let j=0;j<enemies.length;j++){
      const e=enemies[j];if(e.hp<=0)continue;
      const dx=p.x-e.x,dy=p.y-e.y;
      if(dx*dx+dy*dy<(p.sz*p.sz+e.sz*e.sz)){
        hitEnemy(e,p.dmg,p.col,p.x,p.y,3,3,p.wKey);
        if(p.slow)e.slow=Math.max(e.slow||0,p.slow);
        if(p.pierce>0){p.pierce--;continue;}
        p.life=0;break;
      }
    }
    if(boss&&boss.hp>0&&p.life>0){
      const dx=p.x-boss.x,dy=p.y-boss.y;
      if(dx*dx+dy*dy<(p.sz*p.sz+boss.sz*boss.sz)){
        hitBoss(p.dmg,p.col,p.x,p.y,3,3,p.wKey);
        if(p.pierce>0)p.pierce--;else p.life=0;
      }
    }
  }

  // Enemy projectiles
  for (const p of enemyProjs) { p.x+=p.vx; p.y+=p.vy; p.life--; }
  for (let i=enemyProjs.length-1;i>=0;i--){
    const p=enemyProjs[i];
    if(p.life<=0||p.x<-100||p.x>cv.W+100||p.y<-100||p.y>cv.H+100){enemyProjs.splice(i,1);continue;}
    const dx=p.x-player.x,dy=p.y-player.y;
    if(dx*dx+dy*dy<(player.sz+p.sz)*(player.sz+p.sz)&&player.inv===0){
      player.hp-=p.dmg; player.inv=30; player.dmgFlash=6;
      fx.shakeT=Math.max(fx.shakeT,5);
      spawnDmgNum(player.x,player.y-20*cv.SC,Math.round(p.dmg),'#f97316');
      sfx.hit(); p.life=0;
      if(player.hp<=0){sfx.die();setTimeout(()=>{if(run.score>getHS())setHS(run.score);gs.state='nickinput';nick.input='';nick.cursor=0;},600);}
    }
  }

  // Pools (damage-over-area)
  for (const p of pools) {
    p.life--;
    if(run.frame%15===0){
      enemies.forEach(e=>{if(Math.hypot(p.x-e.x,p.y-e.y)<p.sz+e.sz)hitEnemy(e,p.dmg,p.col,e.x,e.y,2,2);});
      if(boss&&boss.hp>0&&Math.hypot(p.x-boss.x,p.y-boss.y)<p.sz+boss.sz)hitBoss(p.dmg,p.col,boss.x,boss.y,3,2);
    }
    if(Math.random()<0.1)spawnPart(p.x+(Math.random()-.5)*p.sz,p.y+(Math.random()-.5)*p.sz,p.col,1,1);
  }
  for(let i=pools.length-1;i>=0;i--){if(pools[i].life<=0)pools.splice(i,1);}

  updateOrbs(showLevelUpMenu);
  updatePowerups();

  if(buffs.speed?.t>0)buffs.speed.t--;
  if(buffs.dmg?.t>0)buffs.dmg.t--;
  if(buffs.freeze?.t>0)buffs.freeze.t--;

  tickParticles();

  // Player physics + dust trail
  player.vx*=0.85; player.vy*=0.85;
  if(player.inv>0)player.inv--;
  if(player.dmgFlash>0)player.dmgFlash--;
  const pspd=Math.hypot(player.vx,player.vy);
  if(pspd>0.4&&run.frame%5===0)spawnPart(player.x-player.vx*1.5,player.y-player.vy*1.5,'#a78bfa',2,pspd*0.25);
}

// ── Render ────────────────────────────────────────────────────
function render() {
  ctx.save();
  if (fx.shakeT>0) ctx.translate(fx.shakeX,fx.shakeY);

  drawBG();

  if (gs.state==='menu') {
    if (!player.x) { player.x=cv.W/2; player.y=cv.H/2; player.sz=22*cv.SC; }
    enemies.forEach(e=>drawEnemy(ctx,e,run.frame));
    orbs.forEach(o=>drawOrb(ctx,o,run.frame));
    drawPlayer();
    drawMenu(ctx, run.frame);
  } else if (gs.state==='weaponselect') {
    drawWeaponSelect(ctx);
  } else if (gs.state==='upgrades') {
    drawUpgrades(ctx);
  } else if (gs.state==='play'||gs.state==='gameover'||gs.state==='levelup'||gs.state==='paused') {
    if (gs.paused&&gs.state!=='paused') { drawPause(ctx); ctx.restore(); return; }
    drawGameScene();
    if (gs.state==='gameover') drawGO(ctx);
    if (gs.state==='paused')   drawPause(ctx);
    if (gs.state==='levelup')  drawLevelUp(ctx);
  } else if (gs.state==='nickinput') {
    drawNickInput(ctx);
    showNickInput();
  } else {
    hideNickInput();
    if (gs.state==='leaderboard') drawLeaderboard(ctx);
  }

  ctx.restore();

  if (fx.eliteFlash>0){
    ctx.save();
    const flash=fx.eliteFlash>=4?(8-fx.eliteFlash)/4:fx.eliteFlash/4;
    ctx.globalAlpha=Math.min(0.3,flash*0.3); ctx.fillStyle='#fff';
    ctx.fillRect(0,0,cv.W,cv.H); ctx.restore(); fx.eliteFlash--;
  }
}

function drawGameScene() {
  pools.forEach(p=>{
    ctx.globalAlpha=Math.min(0.4,p.life/30); ctx.fillStyle=p.col;
    ctx.beginPath(); ctx.ellipse(p.x,p.y,p.sz,p.sz*0.6,0,0,Math.PI*2); ctx.fill();
  }); ctx.globalAlpha=1;
  orbs.forEach(o=>drawOrb(ctx,o,run.frame));
  enemies.forEach(e=>drawEnemy(ctx,e,run.frame));
  if (boss) drawEnemy(ctx,boss,run.frame);
  drawBossWarnRing(ctx, boss, run.frame);
  enemyProjs.forEach(p=>{
    ctx.save(); ctx.globalAlpha=0.85; ctx.fillStyle=p.col;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.sz,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=0.25; ctx.beginPath(); ctx.arc(p.x,p.y,p.sz*2.2,0,Math.PI*2); ctx.fill();
    ctx.restore();
  });
  projs.forEach(p=>drawProj(ctx,p));
  drawPlayer();
  drawParts(ctx);
  drawLightningBolts(ctx);
  drawLaserBeams(ctx);
  drawPowerups(ctx, run.frame);
  drawDmgNums(ctx);
  drawUI(ctx);
  drawJoystick(ctx);
}

function drawProj(ctx, p) {
  const k=p.wKey;
  ctx.fillStyle=p.col;
  if(k==='magic'||k==='arrow'){
    ctx.globalAlpha=0.4; ctx.beginPath(); ctx.arc(p.x,p.y,p.sz*1.8,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;   ctx.beginPath(); ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);     ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(p.x,p.y,p.sz*0.45,0,Math.PI*2); ctx.fill();
  } else if(k==='sword'||k==='bow'){
    const angle=Math.atan2(p.vy,p.vx);
    ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(angle);
    ctx.globalAlpha=0.28; ctx.fillStyle=p.col;
    ctx.fillRect(-p.sz*1.6,-p.sz*0.4,p.sz*3.2,p.sz*0.8);
    ctx.globalAlpha=1; ctx.fillStyle=p.col;
    ctx.fillRect(-p.sz*1.4,-p.sz*0.18,p.sz*2.8,p.sz*0.36);
    ctx.beginPath(); ctx.moveTo(p.sz*1.6,0); ctx.lineTo(p.sz*0.8,-p.sz*0.55); ctx.lineTo(p.sz*0.8,p.sz*0.55); ctx.closePath(); ctx.fill();
    ctx.restore();
  } else {
    ctx.globalAlpha=0.35; ctx.beginPath(); ctx.arc(p.x,p.y,p.sz*1.8,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;   ctx.beginPath(); ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);     ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(p.x,p.y,p.sz*0.42,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;
}

function drawPlayer() {
  const {x,y,sz,inv,angle,vx,vy,dmgFlash}=player;
  if(inv>0&&run.frame%6<2){return;}
  if(dmgFlash>0){
    ctx.save(); ctx.translate(x,y);
    ctx.fillStyle='rgba(255,80,80,0.7)'; ctx.beginPath(); ctx.arc(0,0,sz*1.3,0,Math.PI*2); ctx.fill();
    ctx.restore(); return;
  }
  ctx.save(); ctx.translate(x,y);
  const spd=Math.hypot(vx,vy);
  if(spd>0.5){const leanA=Math.atan2(vy,vx)-Math.PI/2;ctx.rotate(Math.sin(leanA)*0.12);}
  const breathe=Math.sin(run.frame*0.06)*0.04; ctx.scale(1+breathe,1+breathe);
  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(2,sz*0.5,sz*0.75,sz*0.2,0,0,Math.PI*2); ctx.fill();
  // White outline ring
  ctx.strokeStyle='rgba(255,255,255,0.9)'; ctx.lineWidth=2.5*cv.SC;
  ctx.beginPath(); ctx.arc(0,0,sz,0,Math.PI*2); ctx.stroke();
  // Body gradient
  const bodyGrad=ctx.createRadialGradient(0,0,sz*0.1,0,0,sz);
  bodyGrad.addColorStop(0,'#22d3ee'); bodyGrad.addColorStop(0.4,'#3b82f6'); bodyGrad.addColorStop(1,'#1e3a8a');
  ctx.fillStyle=bodyGrad; ctx.beginPath(); ctx.arc(0,0,sz,0,Math.PI*2); ctx.fill();
  // Inner glow ring
  ctx.strokeStyle='rgba(34,211,238,0.6)'; ctx.lineWidth=2*cv.SC;
  ctx.beginPath(); ctx.arc(0,0,sz*0.65,0,Math.PI*2); ctx.stroke();
  // Direction visor
  ctx.save(); ctx.rotate(angle);
  const visorGrad=ctx.createRadialGradient(sz*0.55,0,0,sz*0.55,0,sz*0.45);
  visorGrad.addColorStop(0,'rgba(251,191,36,0.9)'); visorGrad.addColorStop(1,'rgba(251,191,36,0)');
  ctx.fillStyle=visorGrad;
  ctx.beginPath(); ctx.moveTo(sz*0.25,-sz*0.38); ctx.lineTo(sz*1.05,0); ctx.lineTo(sz*0.25,sz*0.38); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#fbbf24'; ctx.beginPath(); ctx.arc(sz*0.58,0,sz*0.14,0,Math.PI*2); ctx.fill();
  ctx.restore();

  // Draw spin weapons
  weapons.forEach(w=>{
    if(w.kind==='spin'&&w.spinT>0){
      const r=(85+w.lvl*15)*cv.SC, sx=player.x+Math.cos(w.spinA)*r, sy=player.y+Math.sin(w.spinA)*r;
      ctx.save(); ctx.translate(sx-x,sy-y); ctx.rotate(w.spinA);
      ctx.fillStyle=w.col;
      ctx.beginPath();
      ctx.moveTo(18*cv.SC,0); ctx.lineTo(0,-6*cv.SC); ctx.lineTo(-10*cv.SC,0); ctx.lineTo(0,6*cv.SC);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(0,0,3*cv.SC,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  });

  ctx.restore();

  // Draw orbit weapons (outside save/restore so translate doesn't affect radius)
  weapons.forEach(w=>{
    if(w.kind==='orbit'&&w.orbitT>0){
      const r=(65+w.lvl*10)*cv.SC;
      // Orbit trail ring
      ctx.strokeStyle=w.col+'33'; ctx.lineWidth=1*cv.SC;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();
      // Orbit orb
      const sx=x+Math.cos(w.orbitA||0)*r, sy=y+Math.sin(w.orbitA||0)*r;
      ctx.save(); ctx.translate(sx,sy);
      ctx.fillStyle=w.col; ctx.beginPath(); ctx.arc(0,0,13*cv.SC+w.lvl*2,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=2*cv.SC; ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(0,0,5*cv.SC,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  });

  // Crosshair
  const cx=x+Math.cos(angle)*(sz+16*cv.SC), cy2=y+Math.sin(angle)*(sz+16*cv.SC);
  ctx.strokeStyle='rgba(255,255,255,0.55)'; ctx.lineWidth=1.5*cv.SC;
  ctx.beginPath(); ctx.arc(cx,cy2,7*cv.SC,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx-10*cv.SC,cy2); ctx.lineTo(cx+10*cv.SC,cy2); ctx.moveTo(cx,cy2-10*cv.SC); ctx.lineTo(cx,cy2+10*cv.SC); ctx.stroke();

  // Invincibility shield
  if(inv>0){const pulse=1+Math.sin(run.frame*0.35)*0.08;ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=2*cv.SC;ctx.beginPath();ctx.arc(x,y,sz*1.35*pulse,0,Math.PI*2);ctx.stroke();}
}

function drawBG() {
  const SC=cv.SC, W=cv.W, H=cv.H;
  ctx.fillStyle='rgba(10,5,16,0.97)'; ctx.fillRect(0,0,W,cv.safeTop);
  const HUD_BOTTOM=cv.safeTop+28*SC, GAME_TOP=HUD_BOTTOM+2*SC, GAME_BOTTOM=H-cv.safeBottom-10*SC;
  window.__GAME_TOP=GAME_TOP; window.__GAME_BOTTOM=GAME_BOTTOM;
  ctx.fillRect(0,H-cv.safeBottom,W,cv.safeBottom);
  const sky=ctx.createLinearGradient(0,cv.safeTop,0,H-cv.safeBottom);
  sky.addColorStop(0,'#0a0510'); sky.addColorStop(0.45,'#12081b'); sky.addColorStop(1,'#150d22');
  ctx.fillStyle=sky; ctx.fillRect(0,cv.safeTop,W,H-cv.safeTop-cv.safeBottom);
  const spacing=60*SC, px=player?player.x:W/2, py=player?player.y:H/2;
  const offX=(-px*0.2)%spacing, offY=(-py*0.2)%spacing;
  ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=1;
  for(let x=offX-spacing;x<W+spacing;x+=spacing){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=offY-spacing;y<H+spacing;y+=spacing){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  bgDust.forEach(d=>{ctx.globalAlpha=d.a;ctx.fillStyle='rgba(255,255,255,0.9)';ctx.beginPath();ctx.arc(d.x,d.y,d.sz,0,Math.PI*2);ctx.fill();}); ctx.globalAlpha=1;
  // Bottom fog
  const fog=ctx.createLinearGradient(0,H*0.78,0,H-cv.safeBottom);
  fog.addColorStop(0,'rgba(10,5,16,0)'); fog.addColorStop(1,'rgba(10,5,16,0.75)');
  ctx.fillStyle=fog; ctx.fillRect(0,H*0.78,W,H*0.3);
}

// ── Input ─────────────────────────────────────────────────────
function handleKeys() {
  if (gs.state!=='play') return;
  let dx=0, dy=0;
  if(keys['ArrowLeft']||keys['KeyA'])dx-=1;
  if(keys['ArrowRight']||keys['KeyD'])dx+=1;
  if(keys['ArrowUp']||keys['KeyW'])dy-=1;
  if(keys['ArrowDown']||keys['KeyS'])dy+=1;
  if(dx!==0||dy!==0){
    const effSpd=player.spd*(player.spdMult||1);
    const len=Math.hypot(dx,dy)||1;
    player.vx=(dx/len)*effSpd; player.vy=(dy/len)*effSpd;
    player.x+=player.vx; player.y+=player.vy; touch.on=false;
  }
  const GT=window.__GAME_TOP||cv.safeTop+30*cv.SC, GB=window.__GAME_BOTTOM||cv.H-cv.safeBottom-10*cv.SC;
  player.x=Math.max(player.sz,Math.min(cv.W-player.sz,player.x));
  player.y=Math.max(GT+player.sz,Math.min(GB-player.sz,player.y));
}

document.addEventListener('keydown', e=>{
  keys[e.code]=true;
  if(gs.state==='nickinput'){
    nick.input=nickField.value.toUpperCase().replace(/[^A-Z0-9_\-]/g,'').substring(0,8);
    nick.cursor=nick.input.length;
    if(e.code==='Enter'&&nick.input.length>0){
      submitScore(nick.input,run.score); gs.state='leaderboard'; lb.loading=true;
      fetchLeaderboard().then(()=>lb.loading=false); hideNickInput();
    }
    return;
  }
  if(e.code==='Escape'&&gs.state==='leaderboard'){gs.state='menu';gs.menuLeaderboardLoaded=false;return;}
  if(e.code==='Escape'&&gs.state==='weaponselect'){gs.state='menu';return;}
  if(e.code==='Escape'&&gs.state==='upgrades'){gs.state='menu';return;}
  if(e.code==='Escape'&&gs.state==='paused'){gs.paused=false;gs.state='play';return;}
  // Keyboard weapon select (1-N keys)
  if(gs.state==='weaponselect'&&e.key>='1'&&e.key<=String(ALL_WEAPON_KEYS.length)){
    setSelectedStartWeapon(ALL_WEAPON_KEYS[parseInt(e.key)-1]||selectedStartWeapon); return;
  }
  if(e.code==='Space'||e.code==='Enter'){
    ACinit();
    if(gs.state==='menu'){gs.state='weaponselect';}
    else if(gs.state==='weaponselect'){gs.state='play';init();}
    else if(gs.state==='gameover'){meta.bankGold+=run.runGold;saveMeta();gs.state='menu';gs.menuLeaderboardLoaded=false;}
  }
  if(e.code==='Escape'&&(gs.state==='play'||gs.state==='paused')){gs.paused=!gs.paused;gs.state=gs.paused?'paused':'play';}
  if(e.code==='KeyM'){gs.soundEnabled=!gs.soundEnabled;}
  if(gs.state==='levelup'&&e.key>='1'&&e.key<='3'){selectLevelUp(parseInt(e.key)-1);}
});
document.addEventListener('keyup', e=>{keys[e.code]=false;});

// ── Touch / Mouse handlers ────────────────────────────────────
canvas.addEventListener('touchstart', e=>{
  e.preventDefault(); ACinit();
  const t=e.changedTouches[0];
  const SC=cv.SC, W=cv.W, H=cv.H;
  const pbSz=22*SC, pbX=W-pbSz-16*SC, pbY=cv.safeTop+18*SC;

  if(gs.state==='menu'){
    const hit=menuHitTest(t.clientX,t.clientY);
    if(hit==='play'){gs.state='weaponselect';return;}
    if(hit==='scores'){lb.loading=true;fetchLeaderboard().then(()=>lb.loading=false);gs.state='leaderboard';return;}
    if(hit==='upgrades'){gs.state='upgrades';setUpgScroll(0);return;}
    return;
  }
  if(gs.state==='upgrades'){
    upgDrag.active=true; upgDrag.startY=t.clientY; upgDrag.startScroll=upgScroll; upgDrag.moved=false;
    return;
  }
  if(gs.state==='weaponselect'){
    const hit=weaponSelectHitTest(t.clientX,t.clientY);
    if(hit&&hit.type==='select'){setSelectedStartWeapon(hit.key);return;}
    if(hit&&hit.type==='start'){gs.state='play';init();return;}
    if(hit&&hit.type==='back'){gs.state='menu';return;}
    return;
  }
  if(gs.state==='paused'){
    const bw=Math.min(220*SC,W-60*SC),bh=60*SC,gap=14*SC,startY=H*0.43;
    const dy=t.clientY-startY;
    if(dy>=0&&dy<bh){gs.paused=false;gs.state='play';return;}
    if(dy>=bh+gap&&dy<bh+gap+bh){gs.soundEnabled=!gs.soundEnabled;return;}
    if(dy>=2*(bh+gap)&&dy<2*(bh+gap)+bh){gs.state='menu';gs.paused=false;return;}
    return;
  }
  if(gs.state==='nickinput'){
    const by=H*0.72,bw=160*SC,bh=50*SC,sy=by+bh+16*SC;
    if(t.clientX>=W/2-bw/2&&t.clientX<=W/2+bw/2&&t.clientY>=by&&t.clientY<=by+bh){submitScore(nick.input,run.score);gs.state='leaderboard';lb.loading=true;fetchLeaderboard().then(()=>lb.loading=false);hideNickInput();}
    if(t.clientX>=W/2-bw/2&&t.clientX<=W/2+bw/2&&t.clientY>=sy&&t.clientY<=sy+bh){gs.state='leaderboard';lb.loading=true;fetchLeaderboard().then(()=>lb.loading=false);hideNickInput();}
    return;
  }
  if(gs.state==='leaderboard'){
    const btnY=H*0.88,bw=140*SC,bh=44*SC;
    if(t.clientX>=W/2-bw/2&&t.clientX<=W/2+bw/2&&t.clientY>=btnY&&t.clientY<=btnY+bh){gs.state='menu';gs.menuLeaderboardLoaded=false;return;}
    return;
  }
  // Pause button hit
  if(t.clientX>=pbX&&t.clientX<=pbX+pbSz&&t.clientY>=pbY&&t.clientY<=pbY+pbSz){
    if(gs.state==='play'){gs.paused=true;gs.state='paused';return;}
    if(gs.state==='paused'){gs.paused=false;gs.state='play';return;}
  }
  if(gs.state==='gameover'){meta.bankGold+=run.runGold;saveMeta();gs.state='menu';gs.menuLeaderboardLoaded=false;return;}
  if(gs.state==='levelup'){
    const SC2=cv.SC, W2=cv.W, H2=cv.H;
    const panelW2=Math.min(W2-18*SC2,420*SC2), panelX2=(W2-panelW2)/2;
    const top2=Math.max(cv.safeTop+18*SC2,H2*0.06);
    const opts=levelUp.options, isWide=panelW2>320*SC2;
    const cardCount=opts.length, gap2=10*SC2;
    const cardW=isWide?(panelW2-28*SC2-gap2*(cardCount-1))/cardCount:panelW2-28*SC2;
    const cardH=isWide?200*SC2:100*SC2, startX2=panelX2+14*SC2, startY2=top2+78*SC2;
    for(let i=0;i<opts.length;i++){
      const cardX=isWide?startX2+i*(cardW+gap2):startX2;
      const cardY=isWide?startY2:startY2+i*(cardH+gap2);
      if(isInRect(t.clientX,t.clientY,cardX,cardY,cardW,cardH)){levelUp.selectedOption=i;selectLevelUp(i);return;}
    }
    return;
  }
  // In-game movement
  touch.on=true; touch.sx=t.clientX; touch.sy=t.clientY; touch.cx=t.clientX; touch.cy=t.clientY; touch.dx=0; touch.dy=0;
  if(H-t.clientY<150*SC&&t.clientX<150*SC){joystick.active=true;joystick.sx=t.clientX;joystick.sy=t.clientY;joystick.dx=0;joystick.dy=0;touch.on=false;}
},{passive:false});

canvas.addEventListener('touchmove', e=>{
  e.preventDefault();
  if(gs.state==='upgrades'&&upgDrag.active){
    const t=e.changedTouches[0], dy=t.clientY-upgDrag.startY;
    if(Math.abs(dy)>6*cv.SC) upgDrag.moved=true;
    const l=getUpgradeLayout();
    setUpgScroll(clamp(upgDrag.startScroll-dy,0,l.maxScroll));
    return;
  }
  if(joystick.active){
    const t=e.changedTouches[0];
    const dx2=t.clientX-joystick.sx, dy2=t.clientY-joystick.sy, d=Math.hypot(dx2,dy2)||1;
    const cl=Math.min(d,joystick.sz);
    joystick.dx=(dx2/d)*cl; joystick.dy=(dy2/d)*cl;
    return;
  }
  if(!touch.on)return;
  const t=e.changedTouches[0];
  touch.cx=t.clientX; touch.cy=t.clientY;
  touch.dx=touch.cx-touch.sx; touch.dy=touch.cy-touch.sy;
},{passive:false});

canvas.addEventListener('touchend', e=>{
  e.preventDefault();
  if(gs.state==='upgrades'&&upgDrag.active){
    const t=e.changedTouches[0];
    if(!upgDrag.moved) applyUpgradeHit(upgradeHitTest(t.clientX,t.clientY));
    upgDrag.active=false; return;
  }
  if(joystick.active){joystick.active=false;joystick.dx=0;joystick.dy=0;}
  touch.on=false; touch.dx=0; touch.dy=0;
},{passive:false});

canvas.addEventListener('mousedown', e=>{
  ACinit();
  const SC=cv.SC, W=cv.W, H=cv.H;
  const pbSz=22*SC, pbX=W-pbSz-16*SC, pbY=cv.safeTop+18*SC;

  if(gs.state==='menu'){
    const hit=menuHitTest(e.clientX,e.clientY);
    if(hit==='play'){gs.state='weaponselect';return;}
    if(hit==='scores'){lb.loading=true;fetchLeaderboard().then(()=>lb.loading=false);gs.state='leaderboard';return;}
    if(hit==='upgrades'){gs.state='upgrades';setUpgScroll(0);return;}
    return;
  }
  if(gs.state==='upgrades'){
    applyUpgradeHit(upgradeHitTest(e.clientX,e.clientY));
    return;
  }
  if(gs.state==='weaponselect'){
    const hit=weaponSelectHitTest(e.clientX,e.clientY);
    if(hit&&hit.type==='select'){setSelectedStartWeapon(hit.key);return;}
    if(hit&&hit.type==='start'){gs.state='play';init();return;}
    if(hit&&hit.type==='back'){gs.state='menu';return;}
    return;
  }
  if(gs.state==='paused'){
    const bw=Math.min(220*SC,W-60*SC),bh=60*SC,gap=14*SC,startY=H*0.43;
    const dy=e.clientY-startY;
    if(dy>=0&&dy<bh){gs.paused=false;gs.state='play';return;}
    if(dy>=bh+gap&&dy<bh+gap+bh){gs.soundEnabled=!gs.soundEnabled;return;}
    if(dy>=2*(bh+gap)&&dy<2*(bh+gap)+bh){gs.state='menu';gs.paused=false;return;}
    return;
  }
  if(gs.state==='nickinput'){
    const by=H*0.72,bw=160*SC,bh=50*SC,sy=by+bh+16*SC;
    if(e.clientX>=W/2-bw/2&&e.clientX<=W/2+bw/2&&e.clientY>=by&&e.clientY<=by+bh){submitScore(nick.input,run.score);gs.state='leaderboard';lb.loading=true;fetchLeaderboard().then(()=>lb.loading=false);hideNickInput();}
    if(e.clientX>=W/2-bw/2&&e.clientX<=W/2+bw/2&&e.clientY>=sy&&e.clientY<=sy+bh){gs.state='leaderboard';lb.loading=true;fetchLeaderboard().then(()=>lb.loading=false);hideNickInput();}
    return;
  }
  if(gs.state==='leaderboard'){
    const btnY=H*0.88,bw=140*SC,bh=44*SC;
    if(e.clientX>=W/2-bw/2&&e.clientX<=W/2+bw/2&&e.clientY>=btnY&&e.clientY<=btnY+bh){gs.state='menu';gs.menuLeaderboardLoaded=false;return;}
    return;
  }
  if(e.clientX>=pbX&&e.clientX<=pbX+pbSz&&e.clientY>=pbY&&e.clientY<=pbY+pbSz){
    if(gs.state==='play'){gs.paused=true;gs.state='paused';return;}
    if(gs.state==='paused'){gs.paused=false;gs.state='play';return;}
  }
  if(gs.state==='gameover'){meta.bankGold+=run.runGold;saveMeta();gs.state='menu';gs.menuLeaderboardLoaded=false;return;}
  if(gs.state==='levelup'){
    const SC2=cv.SC, W2=cv.W, H2=cv.H;
    const panelW2=Math.min(W2-18*SC2,420*SC2), panelX2=(W2-panelW2)/2;
    const top2=Math.max(cv.safeTop+18*SC2,H2*0.06);
    const opts=levelUp.options, isWide=panelW2>320*SC2;
    const cardCount=opts.length, gap2=10*SC2;
    const cardW=isWide?(panelW2-28*SC2-gap2*(cardCount-1))/cardCount:panelW2-28*SC2;
    const cardH=isWide?200*SC2:100*SC2, startX2=panelX2+14*SC2, startY2=top2+78*SC2;
    for(let i=0;i<opts.length;i++){
      const cardX=isWide?startX2+i*(cardW+gap2):startX2;
      const cardY=isWide?startY2:startY2+i*(cardH+gap2);
      if(isInRect(e.clientX,e.clientY,cardX,cardY,cardW,cardH)){levelUp.selectedOption=i;selectLevelUp(i);return;}
    }
    return;
  }
  touch.on=true; touch.sx=e.clientX; touch.sy=e.clientY; touch.cx=e.clientX; touch.cy=e.clientY; touch.dx=0; touch.dy=0;
});
canvas.addEventListener('mousemove', e=>{
  if(gs.state==='upgrades'&&upgDrag.active){
    const dy=e.clientY-upgDrag.startY;
    if(Math.abs(dy)>4) upgDrag.moved=true;
    const l=getUpgradeLayout();
    setUpgScroll(clamp(upgDrag.startScroll-dy,0,l.maxScroll));
    return;
  }
  if(!touch.on)return;
  touch.cx=e.clientX; touch.cy=e.clientY;
  touch.dx=touch.cx-touch.sx; touch.dy=touch.cy-touch.sy;
});
canvas.addEventListener('mouseup', ()=>{
  if(gs.state==='upgrades'&&upgDrag.active){
    if(!upgDrag.moved) applyUpgradeHit(upgradeHitTest(upgDrag.startX||0,upgDrag.startY||0));
    upgDrag.active=false;
  }
  touch.on=false; touch.dx=0; touch.dy=0;
});
canvas.addEventListener('wheel', e=>{
  if(gs.state==='upgrades'){
    e.preventDefault();
    const l=getUpgradeLayout();
    setUpgScroll(clamp(upgScroll+e.deltaY,0,l.maxScroll));
  }
},{passive:false});

// ── Main Loop ─────────────────────────────────────────────────
function loop() {
  handleKeys();
  if (fx.hitStop>0){fx.hitStop--;render();requestAnimationFrame(loop);return;}
  update();
  render();
  requestAnimationFrame(loop);
}

// ── Startup ───────────────────────────────────────────────────
loadMeta();
init();
gs.state = 'menu';
loop();
