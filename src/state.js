// ============================================================
// state.js — zentraler Spielzustand (alle Module importieren hieraus)
// ============================================================

// ── Canvas ──────────────────────────────────────────────────
export const cv = { W:400, H:700, SC:1, el:null, ctx:null, safeTop:44, safeBottom:34 };

// ── Game-State ───────────────────────────────────────────────
export const gs = {
  state: 'menu',
  paused: false,
  soundEnabled: true,
  menuLeaderboardLoaded: false,
};

// ── Spieler ───────────────────────────────────────────────────
export const player = {
  x:0, y:0, sz:22, hp:100, maxHp:100, spd:3.8,
  inv:0, angle:0, vx:0, vy:0, dmgFlash:0,
  // Passive Skill-Felder (per Run, via Skill-Tree)
  critChance:0, critMult:1.5,
  bonusPierce:0, bonusProjectiles:0, cdReduction:1,
  hpRegen:0, lifesteal:0, dodgeChance:0,
  xpMult:1, pickupRange:1, spdMult:1,
  burnOnHit:0, poisonOnHit:0, chainLightning:0, freezeOnHit:0,
};

// ── Run-State ─────────────────────────────────────────────────
export const run = {
  wave:0, score:0, frame:0, gameTime:0,
  gold:0, runGold:0, kills:0, waveKills:0,
  level:1, xp:0, xpNeed:10,
  combo:0, comboTimer:0,
  eliteTimer:0, eliteSpawnedThisWave:false,
  waveAnnounce:null,
};

// ── Waffen (flaches Array) ────────────────────────────────────
export let weapons = [];
export function setWeapons(v) { weapons = v; }

// Ausgewählte Startwaffe
export let selectedStartWeapon = 'magic';
export function setSelectedStartWeapon(v) { selectedStartWeapon = v; }

// ── Boss ──────────────────────────────────────────────────────
export let boss = null;
export function setBoss(v) { boss = v; }

export const bossState = {
  active: false,
  spawnedThisWave: false,
  barHp: 0, barAlpha: 0, barMeta: null,
  intro: null, warn: null,
};

// ── Level-Up ──────────────────────────────────────────────────
export const levelUp = { options:[], cooldown:0, selectedOption:-1 };

// ── Passive Skills (per Run) ──────────────────────────────────
export const playerSkills = {};

// ── Meta-Progression ─────────────────────────────────────────
export const meta = {
  bankGold: 0,
  skills: { hp:0, dmg:0, spd:0, magnet:0, crit:0, regen:0, armor:0, xpb:0, luck:0 },
};

// ── Wellen-Modifier ──────────────────────────────────────────
export const waveModifier = { active:null, bannerT:0 };

// ── Visuell/Effekte ───────────────────────────────────────────
export const fx = {
  shakeT:0, shakeX:0, shakeY:0,
  hitStop:0, eliteFlash:0,
  dmgNums:[],
};
export const buffs = {};

// ── Leaderboard ───────────────────────────────────────────────
export const lb = { data:[], loading:false };

// ── Nick-Eingabe ──────────────────────────────────────────────
export const nick = { input:'', cursor:0 };

// ── Input ─────────────────────────────────────────────────────
export const keys  = {};
export const touch = { on:false, sx:0, sy:0, cx:0, cy:0, dx:0, dy:0 };
export const joystick = { active:false, sx:0, sy:0, dx:0, dy:0, sz:35 };

// ── Upgrade-Screen Scroll ────────────────────────────────────
export let upgScroll = 0;
export function setUpgScroll(v) { upgScroll = v; }
export const upgDrag = { active:false, startY:0, startScroll:0, moved:false };

// ── Menu Mobs (Atmosphäre im Hauptmenü) ──────────────────────
export let menuMobs = null;
export function setMenuMobs(v) { menuMobs = v; }

// ── Entity-Arrays ─────────────────────────────────────────────
export let enemies     = [];
export let projs       = [];
export let enemyProjs  = [];
export let orbs        = [];
export let parts       = [];
export let pools       = [];
export let powerups    = [];
export let deathPops   = [];
export let bgDust      = [];
export let menuDust    = [];
export let laserBeams  = [];
export let lightningBolts = [];

export function setEnemies(v)       { enemies = v; }
export function setProjs(v)         { projs = v; }
export function setEnemyProjs(v)    { enemyProjs = v; }
export function setOrbs(v)          { orbs = v; }
export function setParts(v)         { parts = v; }
export function setPools(v)         { pools = v; }
export function setPowerups(v)      { powerups = v; }
export function setDeathPops(v)     { deathPops = v; }
export function setLaserBeams(v)    { laserBeams = v; }
export function setLightningBolts(v){ lightningBolts = v; }
