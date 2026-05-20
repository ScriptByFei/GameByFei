// ============================================================
// ui.js — alle Menüs, HUD, Screens
// ============================================================
import { COLORS, UI, WEAPON_ICONS, WDEF, META_DEFS, SKILL_TREE, CAT_COLORS, ALL_WEAPON_KEYS } from './constants.js';
import { cv, gs, player, run, buffs, bossState, lb, nick, meta, selectedStartWeapon, setSelectedStartWeapon,
         levelUp, weapons, waveModifier, playerSkills, boss,
         menuDust, menuMobs, setMenuMobs, joystick,
         upgScroll, setUpgScroll, upgDrag } from './state.js';
import { getHS } from './meta.js';
import { clamp } from './combat.js';
import { getSkillLevel, getSkillNextDesc } from './skills.js';

// ── Hilfs-Zeichenfunktionen ──────────────────────────────────

export function isInRect(px,py,x,y,w,h){ return px>=x&&px<=x+w&&py>=y&&py<=y+h; }

function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.roundRect(x,y,w,h,r); }

// ── HUD (In-Game) ────────────────────────────────────────────

export function drawUI(ctx) {
  const SC=cv.SC, W=cv.W, H=cv.H;
  const hbX=16*SC, hbY=cv.safeTop+18*SC, hbW=148*SC, hbH=14*SC;
  const hr=Math.max(0,player.hp/player.maxHp);
  const hpCol=hr>0.5?COLORS.HP_HIGH:hr>0.25?COLORS.HP_MID:COLORS.HP_LOW;

  // HP-Bar
  ctx.fillStyle='rgba(0,0,0,0.6)'; roundRect(ctx,hbX,hbY,hbW,hbH,5*SC); ctx.fill();
  ctx.strokeStyle=COLORS.UI_BORDER; ctx.lineWidth=1.5*SC; ctx.stroke();
  ctx.save(); ctx.shadowBlur=(boss?14:hr<0.25?8:6)*SC; ctx.shadowColor=hpCol;
  ctx.fillStyle=hpCol; roundRect(ctx,hbX,hbY,hbW*hr,hbH,5*SC); ctx.fill(); ctx.restore();
  ctx.fillStyle='#fff'; ctx.font=`bold ${11*SC}px system-ui`; ctx.textAlign='center';
  ctx.fillText(Math.ceil(player.hp)+'/'+player.maxHp, hbX+hbW/2, hbY+hbH-2.5*SC);

  // Score (mitte oben)
  ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.font=`bold ${16*SC}px system-ui`; ctx.textAlign='center';
  ctx.fillText(run.score, W/2, hbY-10*SC);
  if (run.combo>=3) {
    const cp=Math.min(1,run.comboTimer/20);
    ctx.save(); ctx.globalAlpha=0.5+cp*0.5; ctx.fillStyle='#FFD700';
    ctx.font=`bold ${14*SC}px system-ui`;
    ctx.fillText(run.combo+'x COMBO', W/2+65*SC, hbY-8*SC);
    ctx.restore();
  }

  // Level + Timer
  ctx.fillStyle=COLORS.GOLD; ctx.font=`bold ${12*SC}px system-ui`;
  ctx.fillText('LV '+run.level, W/2, hbY+hbH+16*SC);
  const mins=String(run.gameTime/3600|0).padStart(2,'0'), secs=String((run.gameTime%3600)/60|0).padStart(2,'0');
  ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.font=`bold ${13*SC}px system-ui`;
  ctx.fillText('⏱ '+mins+':'+secs, W/2, hbY+hbH+38*SC);
  ctx.fillStyle='rgba(255,255,255,0.45)'; ctx.font=`${10*SC}px system-ui`;
  ctx.fillText('W'+run.wave+'  ☠ '+run.waveKills+' kills', W/2, hbY+hbH+52*SC);

  // Gold (rechts oben)
  ctx.textAlign='right'; ctx.fillStyle='#facc15'; ctx.font=`bold ${12*SC}px system-ui`;
  ctx.fillText('💰 '+run.gold, W-16*SC, hbY+hbH+34*SC);
  ctx.textAlign='center';

  drawBossBanner(ctx);
  drawAnnouncements(ctx);
  drawWaveModifierHUD(ctx);

  // Waffen-Slots
  const iy=H-cv.safeBottom-44*SC, slotGap=42*SC;
  const startX=W/2-((weapons.length-1)*slotGap)/2;
  weapons.forEach((w,i) => {
    const k=w.wKey, col=WDEF[k]?.col||w.col||'#fff', ix=startX+i*slotGap, icon=WEAPON_ICONS[k]||'✨';
    ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.arc(ix,iy,16*SC,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=col; ctx.lineWidth=2*SC; ctx.stroke();
    ctx.fillStyle=col; ctx.beginPath(); ctx.arc(ix,iy,11*SC,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff'; ctx.font=`${12*SC}px system-ui`; ctx.textAlign='center';
    ctx.fillText(icon,ix,iy+4*SC);
    const cdRatio=Math.max(0,w.cd>0?1-w.cdT/w.cd:1);
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(ix-9*SC,iy+14*SC,18*SC,4*SC);
    ctx.fillStyle=col; ctx.fillRect(ix-9*SC,iy+14*SC,18*SC*cdRatio,4*SC);
    if (w.lvl>1) { ctx.fillStyle=COLORS.GOLD; ctx.font=`bold ${8*SC}px system-ui`; ctx.fillText(w.lvl,ix,iy+4*SC); }
    ctx.textAlign='left';
  });

  // XP-Bar
  const xpR=Math.min(1,run.xp/run.xpNeed), xpPad=10*SC, xbH=16*SC, xbY=H-cv.safeBottom-xbH+1*SC, xbW=W-xpPad*2;
  ctx.fillStyle='rgba(8,6,18,0.92)'; roundRect(ctx,xpPad,xbY,xbW,xbH,6*SC); ctx.fill();
  ctx.strokeStyle='rgba(167,139,250,0.35)'; ctx.lineWidth=1.5*SC; ctx.stroke();
  ctx.save(); ctx.shadowBlur=10*SC; ctx.shadowColor='#8b5cf6';
  const xg=ctx.createLinearGradient(0,xbY,0,xbY+xbH); xg.addColorStop(0,'#a78bfa'); xg.addColorStop(1,'#6d28d9');
  ctx.fillStyle=xg; roundRect(ctx,xpPad+1*SC,xbY+1*SC,(xbW-2*SC)*xpR,Math.max(4*SC,xbH-2*SC),5*SC); ctx.fill(); ctx.restore();
  ctx.textAlign='center'; ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.font=`bold ${9*SC}px system-ui`;
  ctx.fillText('LEVEL '+run.level+'  •  XP '+run.xp+'/'+run.xpNeed, W/2, xbY+11*SC);

  // Buff-Indikatoren
  const buffX=W-52*SC, barW=42*SC, barH=5*SC;
  if (buffs.speed?.t>0) { const p=buffs.speed.t/180,by=H-cv.safeBottom-82*SC; ctx.fillStyle='#3b82f6'; ctx.font=`bold ${9*SC}px system-ui`; ctx.fillText('⚡ SPD',buffX,by); ctx.fillStyle='rgba(59,130,246,0.3)'; ctx.fillRect(buffX,by+3*SC,barW,barH); ctx.fillStyle='#3b82f6'; ctx.fillRect(buffX,by+3*SC,barW*p,barH); }
  if (buffs.dmg?.t>0)   { const p=buffs.dmg.t/180,  by=H-cv.safeBottom-66*SC; ctx.fillStyle='#ef4444'; ctx.font=`bold ${9*SC}px system-ui`; ctx.fillText('💥 DMG',buffX,by); ctx.fillStyle='rgba(239,68,68,0.3)'; ctx.fillRect(buffX,by+3*SC,barW,barH); ctx.fillStyle='#ef4444'; ctx.fillRect(buffX,by+3*SC,barW*p,barH); }

  // Wave-Modifier Chip
  drawWaveModifierHUD(ctx);

  // Inv-Ring
  if (player.inv>0) { const pulse=1+Math.sin(run.frame*0.35)*0.08; ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=2*cv.SC; ctx.beginPath(); ctx.arc(player.x,player.y,player.sz*1.35*pulse,0,Math.PI*2); ctx.stroke(); }

  // Pause-Button
  const pbSz=22*SC, pbX=W-pbSz-16*SC, pbY=cv.safeTop+18*SC;
  ctx.fillStyle='rgba(0,0,0,0.5)'; roundRect(ctx,pbX,pbY,pbSz,pbSz,6*SC); ctx.fill();
  ctx.strokeStyle=COLORS.UI_BORDER; ctx.lineWidth=1.5*SC; ctx.stroke();
  ctx.fillStyle=gs.soundEnabled?'rgba(255,255,255,0.85)':'rgba(255,100,100,0.85)';
  ctx.font=`${12*SC}px system-ui`; ctx.textAlign='center';
  ctx.fillText(gs.soundEnabled?'⏸':'🔇', pbX+pbSz/2, pbY+pbSz/2+4*SC);
}

function drawBossBanner(ctx) {
  if (!bossState.barMeta || bossState.barAlpha<=0) return;
  const {W,SC}=cv, m=bossState.barMeta;
  const bw=W*0.8, bh=16*SC, bx=(W-bw)/2, by=cv.safeTop+120*SC, br=bh/2;
  const ratio=clamp(bossState.barHp/Math.max(1,m.maxHp),0,1);
  const bg=ctx.createLinearGradient(bx,0,bx+bw,0); bg.addColorStop(0,m.col); bg.addColorStop(1,m.col+'99');
  ctx.save(); ctx.globalAlpha=bossState.barAlpha;
  ctx.fillStyle='rgba(0,0,0,0.5)'; roundRect(ctx,bx,by,bw,bh,br); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1.5*SC; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.roundRect(bx,by,Math.max(bw*ratio,br),bh,br); ctx.clip();
  ctx.shadowBlur=12*SC; ctx.shadowColor=m.col; ctx.fillStyle=bg; ctx.fillRect(bx,by,Math.max(bw*ratio,br),bh);
  ctx.restore();
  ctx.textAlign='center'; ctx.fillStyle=COLORS.GOLD; ctx.font=`bold ${13*SC}px system-ui`;
  ctx.fillText(m.name,bx+bw/2,by-8*SC);
  ctx.fillStyle='rgba(255,255,255,0.75)'; ctx.font=`bold ${11*SC}px system-ui`;
  ctx.fillText(`${(ratio*100|0)}%  •  ${Math.max(0,Math.round(bossState.barHp))} / ${m.maxHp}`,bx+bw/2,by+bh+13*SC);
  ctx.restore();
}

function drawAnnouncements(ctx) {
  const {W,H,SC}=cv;
  if (bossState.intro) {
    const bi=bossState.intro;
    ctx.save(); ctx.globalAlpha=Math.min(1,bi.t/20);
    ctx.textAlign='center'; ctx.fillStyle=bi.col;
    ctx.shadowColor=bi.col; ctx.shadowBlur=20*SC;
    ctx.font=`bold ${26*SC}px system-ui`; ctx.fillText(bi.name+' INCOMING!',W/2,H*0.42);
    ctx.restore(); bi.t--;
    if (bi.t<=0) bossState.intro=null;
  }
  if (bossState.warn) {
    const bw=bossState.warn, pulse=0.7+Math.sin(run.frame*0.3)*0.3;
    ctx.save(); ctx.globalAlpha=Math.min(1,bw.t/30)*0.85*pulse;
    ctx.textAlign='center'; ctx.fillStyle='#ef4444';
    ctx.shadowColor='#ef4444'; ctx.shadowBlur=15*SC;
    ctx.font=`bold ${20*SC}px system-ui`; ctx.fillText('⚠ WAVE '+run.wave+' — BOSS INCOMING ⚠',W/2,H*0.52);
    ctx.restore(); bw.t--;
    if (bw.t<=0) bossState.warn=null;
  }
  if (run.waveAnnounce) {
    const wa=run.waveAnnounce, progress=wa.t/160;
    const alpha=progress>0.85?((1-progress)/0.15):progress<0.2?(progress/0.2):1;
    const slide=(1-Math.min(1,progress*5))*-30*SC;
    ctx.save(); ctx.globalAlpha=Math.max(0,alpha)*0.95; ctx.translate(0,slide);
    ctx.textAlign='center';
    const bh=52*SC, by=H*0.38;
    const grad=ctx.createLinearGradient(0,by,W,by);
    grad.addColorStop(0,'rgba(0,0,0,0)'); grad.addColorStop(0.2,'rgba(0,0,0,0.75)');
    grad.addColorStop(0.8,'rgba(0,0,0,0.75)'); grad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=grad; ctx.fillRect(0,by,W,bh);
    ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1*SC;
    ctx.beginPath(); ctx.moveTo(0,by); ctx.lineTo(W,by); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,by+bh); ctx.lineTo(W,by+bh); ctx.stroke();
    ctx.shadowColor='#a78bfa'; ctx.shadowBlur=20*SC;
    ctx.fillStyle='#a78bfa'; ctx.font=`bold ${11*SC}px system-ui`; ctx.fillText('— WELLE —',W/2,by+14*SC);
    ctx.shadowColor='#fff'; ctx.shadowBlur=10*SC;
    ctx.fillStyle='#fff'; ctx.font=`bold ${28*SC}px system-ui`; ctx.fillText(wa.n,W/2,by+42*SC);
    ctx.restore(); wa.t--;
    if (wa.t<=0) run.waveAnnounce=null;
  }
}

function drawWaveModifierHUD(ctx) {
  const m=waveModifier.active; if (!m) return;
  const SC=cv.SC, chip={w:120*SC,h:22*SC}, x=cv.W/2-60*SC, y=cv.safeTop+8*SC;
  const alpha=waveModifier.bannerT>0?Math.min(1,waveModifier.bannerT/30):1;
  ctx.save(); ctx.globalAlpha=alpha;
  ctx.fillStyle=m.col+'28'; roundRect(ctx,x,y,chip.w,chip.h,10*SC); ctx.fill();
  ctx.strokeStyle=m.col+'66'; ctx.lineWidth=1.2*SC; ctx.stroke();
  ctx.fillStyle=m.col; ctx.font=`bold ${10*SC}px system-ui`; ctx.textAlign='center';
  ctx.fillText(m.icon+' '+m.name.toUpperCase(), x+chip.w/2, y+15*SC);
  ctx.restore();
  if (waveModifier.bannerT>0) {
    const slide=Math.min(1,waveModifier.bannerT/30), ty=cv.H*0.22-(1-slide)*60*SC;
    ctx.save(); ctx.globalAlpha=slide; ctx.textAlign='center';
    ctx.shadowColor=m.col; ctx.shadowBlur=18*SC;
    ctx.fillStyle=m.col; ctx.font=`bold ${22*SC}px system-ui`;
    ctx.fillText('🌊 WELLE '+run.wave+' — '+m.name.toUpperCase()+' '+m.icon, cv.W/2, ty);
    ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.font=`${12*SC}px system-ui`;
    ctx.fillText(m.desc, cv.W/2, ty+22*SC);
    ctx.restore();
  }
}

// ── Level-Up Screen ──────────────────────────────────────────

export function drawLevelUp(ctx) {
  const W=cv.W, H=cv.H, SC=cv.SC;
  ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';
  ctx.fillStyle=COLORS.GOLD; ctx.font=`bold ${34*SC}px system-ui`; ctx.fillText('⬆️ LEVEL UP!',W/2,H*0.22);
  ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font=`${16*SC}px system-ui`; ctx.fillText('Wähle eine Option',W/2,H*0.31);

  const opts=levelUp.options;
  const bw=Math.min(280*SC,W-40*SC), bh=90*SC, startY=H*0.36, startX=W/2-bw/2;

  opts.forEach((opt,i) => {
    const y=startY+i*(bh+12*SC);
    let catCol='#a78bfa', catLabel='Waffe';
    if (opt.type==='skill') {
      catCol=CAT_COLORS[opt.skillDef.cat];
      catLabel=opt.skillDef.cat==='atk'?'Offensiv':opt.skillDef.cat==='def'?'Defensiv':opt.skillDef.cat==='util'?'Utility':'Elemental';
    }
    const col=opt.type==='skill'?catCol:(opt.col||'#a78bfa');
    const icon=opt.type==='skill'?opt.skillDef.icon:(WEAPON_ICONS[opt.key]||'✨');

    ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.strokeStyle=col; ctx.lineWidth=2*SC;
    ctx.shadowColor=col; ctx.shadowBlur=10*SC;
    roundRect(ctx,startX,y,bw,bh,12*SC); ctx.fill(); ctx.stroke(); ctx.shadowBlur=0;

    ctx.textAlign='left';
    ctx.fillStyle=col; ctx.font=`bold ${22*SC}px system-ui`; ctx.fillText(icon,startX+14*SC,y+40*SC);
    ctx.fillStyle='#fff'; ctx.font=`bold ${16*SC}px system-ui`;
    const name=opt.type==='skill'?opt.skillDef.name:WDEF[opt.key]?.name||opt.key;
    ctx.fillText((i+1)+'. '+name, startX+48*SC, y+28*SC);
    ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.font=`${12*SC}px system-ui`;
    ctx.fillText(opt.type==='skill'?catLabel:(opt.type==='new'?'Neue Waffe':'Upgrade'), startX+48*SC, y+46*SC);

    if (opt.type==='skill') {
      ctx.fillStyle=catCol+'ee'; ctx.font=`bold ${11*SC}px system-ui`;
      ctx.fillText(getSkillNextDesc(opt.skillDef), startX+48*SC, y+64*SC);
      // Pip-Dots
      const curLvl=getSkillLevel(opt.skillDef.id), maxLvl=opt.skillDef.maxLvl;
      for (let p=0;p<maxLvl;p++) {
        ctx.fillStyle=p<curLvl?catCol:'rgba(255,255,255,0.2)';
        ctx.beginPath(); ctx.arc(startX+48*SC+p*12*SC,y+78*SC,4*SC,0,Math.PI*2); ctx.fill();
      }
    } else if (opt.type==='upgrade') {
      ctx.fillStyle=COLORS.GOLD; ctx.font=`bold ${11*SC}px system-ui`;
      const wdef=WDEF[opt.key];
      const curDmg=Math.round(wdef.dmg*opt.weapon.lvl), newDmg=Math.round(wdef.dmg*(opt.weapon.lvl+1));
      ctx.fillText('DMG: '+curDmg+' → '+newDmg, startX+48*SC, y+62*SC);
    }

    ctx.textAlign='right'; ctx.fillStyle=COLORS.GOLD; ctx.font=`bold ${14*SC}px system-ui`;
    ctx.fillText(opt.type==='upgrade'?'Lv.'+(opt.weapon.lvl+1):(opt.type==='new'?'Lv.1':'Lv.'+(getSkillLevel(opt.key||opt.skillDef?.id)+1)),
      startX+bw-16*SC, y+40*SC);
    ctx.textAlign='center';
  });

  if (levelUp.cooldown>0) {
    const barW=80*SC, barH=6*SC, barY=H*0.31+28*SC;
    ctx.fillStyle='rgba(0,0,0,0.5)'; roundRect(ctx,W/2-barW/2,barY,barW,barH,3*SC); ctx.fill();
    ctx.fillStyle='#a78bfa'; roundRect(ctx,W/2-barW/2,barY,barW*(levelUp.cooldown/45),barH,3*SC); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font=`${10*SC}px system-ui`;
    ctx.fillText((levelUp.cooldown/60).toFixed(1)+'s', W/2, barY+barH+12*SC);
  }
  ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font=`${12*SC}px system-ui`;
  ctx.fillText(levelUp.cooldown>0?'Bitte warten...':'Tap to select  •  1/2/3', W/2, H*0.92);
}

// ── Waffen-Auswahl ────────────────────────────────────────────

export function getWeaponSelectLayout() {
  const keys=ALL_WEAPON_KEYS;
  const top=Math.max(cv.safeTop+14*cv.SC, cv.H*0.05);
  const panelW=Math.min(360*cv.SC, cv.W-20*cv.SC);
  const panelH=Math.min(cv.H-top-cv.safeBottom-14*cv.SC, cv.H*0.86);
  const panelX=(cv.W-panelW)/2, panelY=top;
  const headerH=80*cv.SC, ctaH=56*cv.SC, backH=42*cv.SC;
  const cardGap=12*cv.SC, ctaGap=16*cv.SC, backGap=10*cv.SC, botPad=14*cv.SC;
  const cardX=panelX+14*cv.SC, cardW=panelW-28*cv.SC;
  const listTop=panelY+headerH, n=keys.length;
  const cardsAreaH=panelH-headerH-ctaGap-ctaH-backGap-backH-botPad;
  const cardH=(cardsAreaH-cardGap*(n-1))/n;
  const cards=keys.map((k,i)=>({key:k, x:cardX, y:listTop+i*(cardH+cardGap), w:cardW, h:cardH}));
  const ctaY=listTop+n*cardH+(n-1)*cardGap+ctaGap;
  return {keys,panelX,panelY,panelW,panelH,headerH,cardX,cardW,cards,
    start:{x:cardX,y:ctaY,w:cardW,h:ctaH},
    back: {x:cardX,y:ctaY+ctaH+backGap,w:cardW,h:backH}};
}

export function weaponSelectHitTest(px,py) {
  const l=getWeaponSelectLayout(), inR=r=>px>=r.x&&px<=r.x+r.w&&py>=r.y&&py<=r.y+r.h;
  for (const c of l.cards) if (inR(c)) return {type:'select',key:c.key};
  if (inR(l.start)) return {type:'start'};
  if (inR(l.back))  return {type:'back'};
  return null;
}

export function drawWeaponSelect(ctx) {
  const l=getWeaponSelectLayout(), SC=cv.SC, W=cv.W, H=cv.H;
  ctx.fillStyle='rgba(0,0,0,0.84)'; ctx.fillRect(0,0,W,H);
  const vg=ctx.createRadialGradient(W/2,H*0.42,H*0.08,W/2,H*0.5,H*0.78);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.55)');
  ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
  // Panel
  ctx.fillStyle='rgba(18,16,26,0.96)'; ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1.5*SC;
  roundRect(ctx,l.panelX,l.panelY,l.panelW,l.panelH,18*SC); ctx.fill(); ctx.stroke();
  // Header
  ctx.textAlign='left'; ctx.fillStyle=COLORS.GOLD; ctx.font=`bold ${24*SC}px system-ui`;
  ctx.fillText('STARTWAFFE',l.panelX+18*SC,l.panelY+34*SC);
  ctx.fillStyle='rgba(255,255,255,0.42)'; ctx.font=`${11*SC}px system-ui`;
  ctx.fillText('Wähle deinen Spielstil für den Run',l.panelX+18*SC,l.panelY+54*SC);

  const maxDmg=Math.max(...l.keys.map(k=>WDEF[k].dmg));

  l.cards.forEach(c => {
    const def=WDEF[c.key], active=selectedStartWeapon===c.key, icon=WEAPON_ICONS[c.key]||'✨';
    ctx.fillStyle=active?'rgba(255,255,255,0.09)':'rgba(255,255,255,0.04)';
    if (active) { ctx.save(); ctx.shadowColor=COLORS.GOLD; ctx.shadowBlur=16*SC; }
    ctx.strokeStyle=active?COLORS.GOLD:def.col; ctx.lineWidth=active?2.5*SC:1.4*SC;
    roundRect(ctx,c.x,c.y,c.w,c.h,14*SC); ctx.fill(); ctx.stroke();
    if (active) ctx.restore();

    const icR=Math.min(24*SC,c.h*0.3), icX=c.x+22*SC+icR, icY=c.y+c.h*0.42;
    ctx.fillStyle=def.col+'22'; ctx.beginPath(); ctx.arc(icX,icY,icR,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff'; ctx.font=`${icR*0.95}px system-ui`; ctx.textAlign='center';
    ctx.fillText(icon,icX,icY+icR*0.34);

    const tx=icX+icR+16*SC;
    ctx.textAlign='left'; ctx.fillStyle='#fff'; ctx.font=`bold ${16*SC}px system-ui`;
    ctx.fillText(def.name,tx,c.y+c.h*0.3);

    // Tag-Pill
    ctx.font=`bold ${10*SC}px system-ui`;
    const pw=ctx.measureText(def.tag||'').width+16*SC, px0=c.x+c.w-pw-16*SC, py0=c.y+c.h*0.3-13*SC;
    ctx.fillStyle=def.col+'2e'; ctx.strokeStyle=def.col; ctx.lineWidth=1*SC;
    roundRect(ctx,px0,py0,pw,18*SC,9*SC); ctx.fill(); ctx.stroke();
    ctx.fillStyle=def.col; ctx.textAlign='center'; ctx.fillText(def.tag||'',px0+pw/2,py0+12.5*SC);

    ctx.textAlign='left'; ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.font=`${11*SC}px system-ui`;
    ctx.fillText(def.desc||'',tx,c.y+c.h*0.52);

    // Stat-Balken
    const barW=(c.x+c.w-16*SC)-tx, barH=5*SC;
    const dmgR=def.dmg/maxDmg, fireR=def.cd>0?Math.max(0.18,Math.min(1,1-def.cd/80)):1;
    const stat=(label,ratio,yy,col,note)=>{
      ctx.fillStyle='rgba(255,255,255,0.45)'; ctx.font=`bold ${9*SC}px system-ui`; ctx.textAlign='left';
      ctx.fillText(label,tx,yy-4*SC);
      ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.textAlign='right';
      ctx.fillText(note,c.x+c.w-16*SC,yy-4*SC);
      ctx.fillStyle='rgba(255,255,255,0.1)'; roundRect(ctx,tx,yy,barW,barH,3*SC); ctx.fill();
      ctx.fillStyle=col; roundRect(ctx,tx,yy,barW*ratio,barH,3*SC); ctx.fill();
    };
    stat('SCHADEN',dmgR,c.y+c.h*0.66,'#ef4444',String(def.dmg));
    stat('FEUERRATE',fireR,c.y+c.h*0.85,'#facc15',def.cd>0?'CD '+def.cd:'Dauerhaft');
  });

  // Run-Starten Button
  const s=l.start, pl=1+Math.sin(Date.now()*0.004)*0.025;
  ctx.save(); ctx.translate(s.x+s.w/2,s.y+s.h/2); ctx.scale(pl,pl);
  ctx.shadowColor='#22c55e'; ctx.shadowBlur=26*SC;
  const pg=ctx.createLinearGradient(0,-s.h/2,0,s.h/2);
  pg.addColorStop(0,'rgba(34,197,94,0.34)'); pg.addColorStop(1,'rgba(22,163,74,0.18)');
  ctx.fillStyle=pg; roundRect(ctx,-s.w/2,-s.h/2,s.w,s.h,16*SC); ctx.fill();
  ctx.shadowBlur=0; ctx.strokeStyle='#22c55e'; ctx.lineWidth=2.5*SC; ctx.stroke();
  ctx.fillStyle='#dcfce7'; ctx.font=`900 ${20*SC}px system-ui`; ctx.textAlign='center';
  ctx.fillText('▶  RUN STARTEN',0,7*SC);
  ctx.restore();

  // Zurück
  const b=l.back;
  ctx.fillStyle='rgba(255,255,255,0.045)'; ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.4*SC;
  roundRect(ctx,b.x,b.y,b.w,b.h,12*SC); ctx.fill(); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.font=`bold ${13*SC}px system-ui`; ctx.textAlign='center';
  ctx.fillText('← Zurück',b.x+b.w/2,b.y+b.h/2+5*SC);
}

// ── Upgrades ─────────────────────────────────────────────────

export function getUpgradeLayout() {
  const keys=Object.keys(META_DEFS);
  const top=Math.max(cv.safeTop+14*cv.SC, cv.H*0.045);
  const panelW=Math.min(360*cv.SC, cv.W-20*cv.SC);
  const panelH=Math.min(cv.H-top-cv.safeBottom-14*cv.SC, cv.H*0.88);
  const panelX=(cv.W-panelW)/2, panelY=top;
  const headerH=96*cv.SC, footerH=56*cv.SC;
  const listTop=panelY+headerH, listViewH=panelH-headerH-footerH;
  const rowH=76*cv.SC, gap=10*cv.SC, contentH=keys.length*(rowH+gap);
  const maxScroll=Math.max(0,contentH-listViewH);
  const rowX=panelX+14*cv.SC, rowW=panelW-28*cv.SC;
  const backH=40*cv.SC, backY=panelY+panelH-footerH+8*cv.SC;
  return {keys,panelX,panelY,panelW,panelH,headerH,footerH,listTop,listViewH,rowH,gap,contentH,maxScroll,rowX,rowW,backY,backH};
}

export function upgradeHitTest(px,py) {
  const l=getUpgradeLayout();
  if (px>=l.rowX&&px<=l.rowX+l.rowW&&py>=l.backY&&py<=l.backY+l.backH) return {type:'back'};
  if (py<l.listTop||py>l.listTop+l.listViewH) return null;
  for (let i=0;i<l.keys.length;i++) {
    const y=l.listTop+i*(l.rowH+l.gap)-upgScroll;
    if (py>=y&&py<=y+l.rowH&&y+l.rowH>l.listTop&&y<l.listTop+l.listViewH) return {type:'buy',key:l.keys[i]};
  }
  return null;
}

export function applyUpgradeHit(hit) {
  if (!hit) return false;
  if (hit.type==='back') { gs.state='menu'; return true; }
  if (hit.type==='buy') {
    const k=hit.key, lvl=meta.skills[k]||0, cost=META_DEFS[k].cost*(lvl+1);
    if (lvl<META_DEFS[k].max && meta.bankGold>=cost) {
      meta.bankGold-=cost; meta.skills[k]=lvl+1;
      import('./meta.js').then(({saveMeta})=>saveMeta());
    }
    return true;
  }
  return false;
}

export function drawUpgrades(ctx) {
  const l=getUpgradeLayout(), SC=cv.SC, W=cv.W, H=cv.H;
  setUpgScroll(clamp(upgScroll,0,l.maxScroll));
  ctx.fillStyle='rgba(0,0,0,0.84)'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(18,16,26,0.96)'; ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1.5*SC;
  roundRect(ctx,l.panelX,l.panelY,l.panelW,l.panelH,18*SC); ctx.fill(); ctx.stroke();
  ctx.textAlign='left'; ctx.fillStyle=COLORS.GOLD; ctx.font=`bold ${24*SC}px system-ui`;
  ctx.fillText('UPGRADES',l.panelX+18*SC,l.panelY+34*SC);
  ctx.fillStyle='rgba(255,255,255,0.42)'; ctx.font=`${11*SC}px system-ui`;
  ctx.fillText('Permanent — gilt für jeden neuen Run',l.panelX+18*SC,l.panelY+54*SC);

  const bankText='💰 '+meta.bankGold;
  ctx.font=`bold ${15*SC}px system-ui`;
  const bankW=ctx.measureText(bankText).width+24*SC, bankH=30*SC;
  const bankX=l.panelX+l.panelW-bankW-16*SC, bankY=l.panelY+22*SC;
  ctx.fillStyle='rgba(250,204,21,0.12)'; roundRect(ctx,bankX,bankY,bankW,bankH,10*SC); ctx.fill();
  ctx.strokeStyle='rgba(250,204,21,0.34)'; ctx.lineWidth=1.2*SC; ctx.stroke();
  ctx.fillStyle='#facc15'; ctx.textAlign='center'; ctx.fillText(bankText,bankX+bankW/2,bankY+20*SC);

  ctx.save();
  ctx.beginPath(); ctx.rect(l.panelX,l.listTop,l.panelW,l.listViewH); ctx.clip();
  l.keys.forEach((k,i) => {
    const def=META_DEFS[k], lvl=meta.skills[k]||0, cost=def.cost*(lvl+1);
    const maxed=lvl>=def.max, afford=meta.bankGold>=cost, available=!maxed&&afford;
    const y=l.listTop+i*(l.rowH+l.gap)-upgScroll;
    if (y+l.rowH<l.listTop||y>l.listTop+l.listViewH) return;
    ctx.fillStyle=available?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.035)';
    ctx.strokeStyle=maxed?'rgba(34,197,94,0.6)':available?def.col:'rgba(255,255,255,0.1)';
    ctx.lineWidth=(maxed||available)?2*SC:1.2*SC;
    roundRect(ctx,l.rowX,y,l.rowW,l.rowH,14*SC); ctx.fill(); ctx.stroke();
    if (!available&&!maxed) { ctx.save(); ctx.globalAlpha=0.55; }
    const icX=l.rowX+30*SC, icY=y+l.rowH/2;
    ctx.fillStyle=def.col+'22'; ctx.beginPath(); ctx.arc(icX,icY,20*SC,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff'; ctx.font=`${20*SC}px system-ui`; ctx.textAlign='center'; ctx.fillText(def.icon,icX,icY+7*SC);
    const tx=l.rowX+58*SC;
    ctx.textAlign='left'; ctx.fillStyle='#fff'; ctx.font=`bold ${15*SC}px system-ui`; ctx.fillText(def.name,tx,y+24*SC);
    ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.font=`${10.5*SC}px system-ui`; ctx.fillText(def.desc,tx,y+42*SC);
    const pbW=l.rowW*0.42, pbX=tx, pbY=y+54*SC, pbH=5*SC;
    ctx.fillStyle='rgba(255,255,255,0.1)'; roundRect(ctx,pbX,pbY,pbW,pbH,3*SC); ctx.fill();
    if (lvl>0) { ctx.fillStyle=def.col; roundRect(ctx,pbX,pbY,pbW*(lvl/def.max),pbH,3*SC); ctx.fill(); }
    ctx.fillStyle='rgba(196,181,253,0.9)'; ctx.font=`bold ${10*SC}px system-ui`; ctx.fillText('Lv '+lvl+'/'+def.max,pbX+pbW+10*SC,pbY+6*SC);
    ctx.textAlign='right'; const rx=l.rowX+l.rowW-16*SC;
    if (maxed) { ctx.fillStyle='#22c55e'; ctx.font=`bold ${13*SC}px system-ui`; ctx.fillText('✓ MAX',rx,icY+5*SC); }
    else { ctx.fillStyle=afford?'#facc15':'rgba(255,255,255,0.32)'; ctx.font=`bold ${15*SC}px system-ui`; ctx.fillText('💰 '+cost,rx,y+30*SC); ctx.fillStyle=available?'rgba(74,222,128,0.92)':'rgba(255,255,255,0.28)'; ctx.font=`bold ${10*SC}px system-ui`; ctx.fillText(available?'TAP ZUM KAUFEN':'Zu teuer',rx,y+50*SC); }
    if (!available&&!maxed) ctx.restore();
  });
  ctx.restore();

  // Scroll-Indikator
  if (l.maxScroll>0) {
    const trkX=l.panelX+l.panelW-6*SC, trkH=l.listViewH;
    ctx.fillStyle='rgba(255,255,255,0.07)'; roundRect(ctx,trkX,l.listTop,3*SC,trkH,2*SC); ctx.fill();
    const thH=Math.max(30*SC,trkH*(l.listViewH/l.contentH)), thY=l.listTop+(trkH-thH)*(upgScroll/l.maxScroll);
    ctx.fillStyle='rgba(255,255,255,0.28)'; roundRect(ctx,trkX,thY,3*SC,thH,2*SC); ctx.fill();
  }
  ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.4*SC;
  roundRect(ctx,l.rowX,l.backY,l.rowW,l.backH,12*SC); ctx.fill(); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.82)'; ctx.font=`bold ${14*SC}px system-ui`; ctx.textAlign='center';
  ctx.fillText('← Zurück zum Menü',W/2,l.backY+25*SC);
}

// ── Menü ─────────────────────────────────────────────────────

export function getMenuLayout() {
  const cx=cv.W/2, SC=cv.SC, W=cv.W, H=cv.H;
  const playW=Math.min(264*SC,W-70*SC), playH=74*SC, playY=H*0.55;
  const secGap=14*SC, secW=(playW-secGap)/2, secH=50*SC, secY=playY+playH+22*SC;
  return {cx,
    play:     {x:cx-playW/2,     y:playY,          w:playW, h:playH},
    upgrades: {x:cx-secGap/2-secW,y:secY,           w:secW,  h:secH},
    scores:   {x:cx+secGap/2,    y:secY,            w:secW,  h:secH},
  };
}

export function menuHitTest(px,py) {
  const l=getMenuLayout(), inR=r=>px>=r.x&&px<=r.x+r.w&&py>=r.y&&py<=r.y+r.h;
  if (inR(l.play))     return 'play';
  if (inR(l.upgrades)) return 'upgrades';
  if (inR(l.scores))   return 'scores';
  return null;
}

export function drawMenu(ctx, frame) {
  if (!gs.menuLeaderboardLoaded) {
    gs.menuLeaderboardLoaded=true;
    import('./leaderboard.js').then(({fetchLeaderboard})=>{
      lb.loading=true; fetchLeaderboard().then(()=>lb.loading=false);
    });
  }

  const W=cv.W, H=cv.H, SC=cv.SC, T=Date.now()*0.001;
  const bgGrad=ctx.createLinearGradient(0,0,0,H);
  bgGrad.addColorStop(0,'#0a0710'); bgGrad.addColorStop(0.45,'#130f20'); bgGrad.addColorStop(1,'#070510');
  ctx.fillStyle=bgGrad; ctx.fillRect(0,0,W,H);

  // Drifting enemy silhouettes
  if (!menuMobs) {
    setMenuMobs(Array.from({length:7},(_,i)=>({
      x:Math.random()*W, y:Math.random()*H,
      r:(24+Math.random()*32)*SC, sp:(0.12+Math.random()*0.3)*SC,
      a:Math.random()*Math.PI*2,
      col:['#ef4444','#a855f7','#22c55e','#3b82f6'][i%4],
      ph:Math.random()*6,
    })));
  }
  if (menuMobs) menuMobs.forEach(m => {
    m.x+=Math.cos(m.a+Math.sin(T*0.3+m.ph)*0.6)*m.sp;
    m.y+=Math.sin(m.a+Math.cos(T*0.25+m.ph)*0.6)*m.sp*0.7;
    const mr=80*SC;
    if(m.x<-mr)m.x=W+mr; if(m.x>W+mr)m.x=-mr;
    if(m.y<-mr)m.y=H+mr; if(m.y>H+mr)m.y=-mr;
    const pl=0.85+Math.sin(T*1.3+m.ph)*0.15;
    ctx.save();
    ctx.globalAlpha=0.05; ctx.fillStyle=m.col; ctx.beginPath(); ctx.arc(m.x,m.y,m.r*pl*2.4,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=0.18; ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(m.x,m.y,m.r*pl,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=0.22; ctx.strokeStyle=m.col; ctx.lineWidth=1.5*SC; ctx.beginPath(); ctx.arc(m.x,m.y,m.r*pl,0,Math.PI*2); ctx.stroke();
    ctx.restore();
  });

  // Sternfeld
  menuDust.forEach(d => {
    const fl=d.a*(0.6+0.4*Math.sin(Date.now()*0.003+(d.phase||0)));
    ctx.globalAlpha=fl; ctx.fillStyle=d.col||'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(d.x,d.y,d.sz,0,Math.PI*2); ctx.fill();
    if (d.sz>1.5) { ctx.globalAlpha=fl*0.3; ctx.beginPath(); ctx.arc(d.x,d.y,d.sz*3,0,Math.PI*2); ctx.fill(); }
  }); ctx.globalAlpha=1;

  // Vignette
  const vg=ctx.createRadialGradient(W/2,H*0.42,H*0.08,W/2,H*0.5,H*0.78);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.62)');
  ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);

  // Bank (oben rechts)
  ctx.textAlign='right'; ctx.fillStyle='rgba(250,204,21,0.55)'; ctx.font=`bold ${12*SC}px system-ui`;
  ctx.fillText('💰 '+meta.bankGold, W-16*SC, cv.safeTop+24*SC);

  // Titel
  const titleY=H*0.3;
  ctx.textAlign='center'; ctx.save();
  ctx.shadowColor='#f472b6'; ctx.shadowBlur=(28+Math.sin(T*1.5)*12)*SC;
  const tg=ctx.createLinearGradient(0,titleY-46*SC,0,titleY+4*SC);
  tg.addColorStop(0,'#fb7fc4'); tg.addColorStop(1,'#c4b5fd');
  ctx.fillStyle=tg; ctx.font=`900 ${Math.min(60*SC,W/8.5)}px system-ui`;
  ctx.fillText('SURVIVOR',W/2,titleY); ctx.restore();
  const dw=Math.min(160*SC,W*0.42);
  const lg=ctx.createLinearGradient(W/2-dw/2,0,W/2+dw/2,0);
  lg.addColorStop(0,'rgba(167,139,250,0)'); lg.addColorStop(0.5,'rgba(167,139,250,0.75)'); lg.addColorStop(1,'rgba(167,139,250,0)');
  ctx.strokeStyle=lg; ctx.lineWidth=1.5*SC; ctx.beginPath(); ctx.moveTo(W/2-dw/2,titleY+20*SC); ctx.lineTo(W/2+dw/2,titleY+20*SC); ctx.stroke();
  ctx.fillStyle='#c4b5fd'; ctx.font=`bold ${15*SC}px system-ui`; ctx.fillText('by Fei',W/2,titleY+42*SC);

  let bestLine='Setz den ersten Score';
  if (lb.data&&lb.data.length>0) bestLine='🏆 '+lb.data[0].s+'  ·  '+(lb.data[0].n||'').slice(0,10);
  else if (getHS()>0) bestLine='🏆 BEST '+getHS();
  ctx.fillStyle='rgba(255,255,255,0.42)'; ctx.font=`${12*SC}px system-ui`; ctx.fillText(bestLine,W/2,titleY+72*SC);

  const l=getMenuLayout();
  const pulse=1+Math.sin(T*2.2)*0.03;
  ctx.save(); ctx.translate(l.cx,l.play.y+l.play.h/2); ctx.scale(pulse,pulse);
  ctx.shadowColor='#22c55e'; ctx.shadowBlur=36*SC;
  const pg=ctx.createLinearGradient(0,-l.play.h/2,0,l.play.h/2);
  pg.addColorStop(0,'rgba(34,197,94,0.34)'); pg.addColorStop(1,'rgba(22,163,74,0.18)');
  ctx.fillStyle=pg; roundRect(ctx,-l.play.w/2,-l.play.h/2,l.play.w,l.play.h,18*SC); ctx.fill();
  ctx.shadowBlur=0; ctx.strokeStyle='#22c55e'; ctx.lineWidth=2.5*SC; ctx.stroke();
  ctx.fillStyle='#dcfce7'; ctx.font=`900 ${26*SC}px system-ui`; ctx.fillText('▶  PLAY',0,9*SC);
  ctx.restore();

  const ghost=(r,icon,label,col)=>{
    ctx.fillStyle='rgba(255,255,255,0.045)'; ctx.strokeStyle=col.replace('0.9','0.45'); ctx.lineWidth=1.4*SC;
    roundRect(ctx,r.x,r.y,r.w,r.h,13*SC); ctx.fill(); ctx.stroke();
    ctx.fillStyle=col; ctx.font=`bold ${13*SC}px system-ui`; ctx.textAlign='center';
    ctx.fillText(icon+'  '+label,r.x+r.w/2,r.y+r.h/2+5*SC);
  };
  ghost(l.upgrades,'⚙','Upgrades','rgba(196,181,253,0.9)');
  ghost(l.scores,'🏆','Scores','rgba(244,114,182,0.9)');

  ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.font=`${10*SC}px system-ui`; ctx.textAlign='center';
  ctx.fillText('WASD / Pfeile bewegen · Auto-Aim · ESC pausiert',W/2,H-cv.safeBottom-26*SC);
  ctx.fillText('v2.0',W/2,H-cv.safeBottom-12*SC);
}

// ── Leaderboard ───────────────────────────────────────────────

export function drawLeaderboard(ctx) {
  const W=cv.W, H=cv.H, SC=cv.SC;
  ctx.fillStyle='rgba(0,0,0,0.85)'; ctx.fillRect(0,0,W,H);
  ctx.textAlign='center'; ctx.fillStyle=COLORS.GOLD; ctx.font=`bold ${32*SC}px system-ui`;
  ctx.fillText('🏆 LEADERBOARD',W/2,H*0.1);
  const startY=H*0.18;
  if (lb.loading) { ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font=`${16*SC}px system-ui`; ctx.fillText('Loading...',W/2,H*0.5); return; }
  if (!lb.data.length) { ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font=`${14*SC}px system-ui`; ctx.fillText('No scores yet — be the first!',W/2,H*0.5); }
  lb.data.slice(0,8).forEach((e,i) => {
    const y=startY+i*46*SC, rank=i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1)+'.';
    ctx.fillStyle=i===0?'#FFD700':i===1?'#d1d5db':i===2?'#cd7c32':'rgba(255,255,255,0.6)';
    ctx.font=`bold ${18*SC}px system-ui`; ctx.textAlign='left'; ctx.fillText(rank,W*0.08,y);
    ctx.fillStyle='#fff'; ctx.font=`${16*SC}px system-ui`; ctx.fillText(e.n,W*0.22,y);
    ctx.textAlign='right'; ctx.fillStyle='#f472b6'; ctx.font=`bold ${16*SC}px system-ui`; ctx.fillText(e.s,W*0.9,y);
    ctx.textAlign='center';
  });
  const btnY=H*0.88, bw=140*SC, bh=44*SC;
  ctx.fillStyle='#f472b633'; ctx.strokeStyle='#f472b6'; ctx.lineWidth=2*SC;
  roundRect(ctx,W/2-bw/2,btnY,bw,bh,10*SC); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#f472b6'; ctx.font=`bold ${16*SC}px system-ui`; ctx.fillText('Back',W/2,btnY+bh/2+6*SC);
}

// ── Nick-Eingabe ──────────────────────────────────────────────

export function drawNickInput(ctx) {
  const W=cv.W, H=cv.H, SC=cv.SC;
  ctx.fillStyle='rgba(0,0,0,0.88)'; ctx.fillRect(0,0,W,H);
  ctx.textAlign='center'; ctx.fillStyle=COLORS.GOLD; ctx.font=`bold ${28*SC}px system-ui`;
  ctx.fillText('🏆 NEW HIGH SCORE!',W/2,H*0.22);
  ctx.fillStyle='#fff'; ctx.font=`${22*SC}px system-ui`; ctx.fillText(run.score+' pts',W/2,H*0.32);
  ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.font=`${14*SC}px system-ui`; ctx.fillText('Enter your nickname:',W/2,H*0.42);
  const iw=Math.min(260*SC,W-60*SC), ih=50*SC, ix=W/2-iw/2, iy=H*0.47;
  ctx.fillStyle='#1a1a2e'; ctx.strokeStyle='#f472b6'; ctx.lineWidth=2*SC;
  roundRect(ctx,ix,iy,iw,ih,8*SC); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#fff'; ctx.font=`bold ${22*SC}px system-ui`;
  ctx.fillText(nick.input.padEnd(8,'_').substring(0,8),W/2,iy+ih/2+7*SC);
  const by=H*0.72, bw=160*SC, bh=50*SC;
  ctx.fillStyle='#22c55e33'; ctx.strokeStyle='#22c55e'; ctx.lineWidth=2*SC;
  roundRect(ctx,W/2-bw/2,by,bw,bh,10*SC); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#22c55e'; ctx.font=`bold ${18*SC}px system-ui`; ctx.fillText('Submit',W/2,by+bh/2+6*SC);
  const sy=by+bh+16*SC;
  ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.5*SC;
  roundRect(ctx,W/2-bw/2,sy,bw,bh,10*SC); ctx.fill(); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.45)'; ctx.font=`${15*SC}px system-ui`; ctx.fillText('Skip',W/2,sy+bh/2+5*SC);
}

// ── Pause ─────────────────────────────────────────────────────

export function drawPause(ctx) {
  const W=cv.W, H=cv.H, SC=cv.SC;
  ctx.fillStyle='rgba(0,0,0,0.72)'; ctx.fillRect(0,0,W,H);
  ctx.textAlign='center'; ctx.fillStyle=COLORS.GOLD; ctx.font=`bold ${36*SC}px system-ui`;
  ctx.fillText('⏸ PAUSED',W/2,H*0.33);
  const bw=Math.min(220*SC,W-60*SC), bh=60*SC, gap=14*SC, startY=H*0.43, startX=W/2-bw/2;
  ctx.fillStyle='#22c55e33'; ctx.strokeStyle='#22c55e'; ctx.lineWidth=2*SC;
  roundRect(ctx,startX,startY,bw,bh,10*SC); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#22c55e'; ctx.font=`bold ${20*SC}px system-ui`; ctx.fillText('▶ Resume',W/2,startY+bh/2+7*SC);
  ctx.fillStyle=gs.soundEnabled?'#3b82f633':'#ef444433'; ctx.strokeStyle=gs.soundEnabled?'#3b82f6':'#ef4444'; ctx.lineWidth=2*SC;
  roundRect(ctx,startX,startY+bh+gap,bw,bh,10*SC); ctx.fill(); ctx.stroke();
  ctx.fillStyle=gs.soundEnabled?'#3b82f6':'#ef4444'; ctx.font=`bold ${20*SC}px system-ui`;
  ctx.fillText(gs.soundEnabled?'🔊 Sound: ON':'🔇 Sound: OFF',W/2,startY+bh+gap+bh/2+7*SC);
  ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1.5*SC;
  roundRect(ctx,startX,startY+2*(bh+gap),bw,bh,10*SC); ctx.fill(); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font=`${18*SC}px system-ui`; ctx.fillText('Quit to Menu',W/2,startY+2*(bh+gap)+bh/2+6*SC);
  ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font=`${12*SC}px system-ui`; ctx.fillText('ESC also resumes',W/2,H*0.88);
}

// ── Game Over ─────────────────────────────────────────────────

export function drawGO(ctx) {
  const W=cv.W, H=cv.H, SC=cv.SC;
  ctx.fillStyle='rgba(0,0,0,0.82)'; ctx.fillRect(0,0,W,H);
  const cy=Math.max(H*0.22,cv.safeTop+50*SC);
  ctx.textAlign='center';
  ctx.fillStyle=COLORS.HP_LOW; ctx.font=`bold ${42*SC}px system-ui`; ctx.fillText('💀 Game Over',W/2,cy);
  ctx.fillStyle='#fff'; ctx.font=`${28*SC}px system-ui`; ctx.fillText(run.score+' pts',W/2,cy+52*SC);
  ctx.fillStyle='#facc15'; ctx.font=`bold ${20*SC}px system-ui`; ctx.fillText('+ '+run.runGold+' Gold',W/2,cy+86*SC);
  ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.font=`${16*SC}px system-ui`;
  ctx.fillText('☠ Kills: '+run.kills,W/2,cy+126*SC);
  ctx.fillText('⏱ Time: '+(run.gameTime/3600|0)+'m '+((run.gameTime%3600)/60|0)+'s',W/2,cy+154*SC);
  ctx.fillText('🌊 Wave: '+run.wave+'   ⭐ Level: '+run.level,W/2,cy+182*SC);
  ctx.fillStyle=COLORS.HP_HIGH; ctx.font=`${18*SC}px system-ui`; ctx.fillText('Best: '+getHS(),W/2,cy+220*SC);
  const bw=Math.min(220*SC,W-60*SC), bh=56*SC, by=cy+250*SC;
  ctx.fillStyle='rgba(34,197,94,0.18)'; ctx.strokeStyle='#22c55e'; ctx.lineWidth=2*SC;
  roundRect(ctx,W/2-bw/2,by,bw,bh,12*SC); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#22c55e'; ctx.font=`bold ${18*SC}px system-ui`; ctx.fillText('ZUM HUB',W/2,by+bh/2+6*SC);
}

// ── Joystick ──────────────────────────────────────────────────

export function drawJoystick(ctx) {
  if (!joystick.active) return;
  ctx.save(); ctx.globalAlpha=0.25;
  ctx.fillStyle='#a78bfa'; ctx.beginPath(); ctx.arc(joystick.sx,joystick.sy,joystick.sz,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=0.55; ctx.fillStyle='#c4b5fd';
  ctx.beginPath(); ctx.arc(joystick.sx+joystick.dx,joystick.sy+joystick.dy,joystick.sz*0.5,0,Math.PI*2); ctx.fill();
  ctx.restore();
}
