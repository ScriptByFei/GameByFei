// ============================================================
// constants.js — alle statischen Daten des Spiels
// ============================================================

export const COLORS = {
  BG:'#0a0510', BG2:'#150d22',
  ACCENT:'#f472b6', ACCENT_SOFT:'#c4b5fd',
  GOLD:'#FFD700',
  HP_HIGH:'#22c55e', HP_MID:'#f97316', HP_LOW:'#ef4444',
  DANGER:'#ef4444', WARNING:'#f59e0b',
  UI_BORDER:'rgba(255,255,255,0.15)',
};
export const UI = { topPad:14, bottomPad:12, sidePad:14, closeSize:46 };

export const WEAPON_ICONS = {
  magic:'🪨', arrow:'🏹', shield:'🛡️',
};

export const WDEF = {
  magic:  { col:'#a855f7', cd:48,  dmg:15, spd:6.4,  sz:9,  cnt:1, kind:'ball',  name:'Steinwurf', tag:'Ausgewogen',  desc:'Solider Distanzschuss · guter Allrounder' },
  arrow:  { col:'#22c55e', cd:28,  dmg:10, spd:13,   sz:5,  cnt:1, kind:'ball',  name:'Pfeil',     tag:'Schnellfeuer',desc:'Hohe Feuerrate, wenig Schaden pro Treffer' },
  shield: { col:'#3b82f6', cd:0,   dmg:7,  spd:0,    sz:15, cnt:1, kind:'orbit', name:'Schild',    tag:'Defensiv',    desc:'Kreist um dich, schützt im Nahbereich' },
};

// Waffen die als Startwaffe wählbar sind
export const ALL_WEAPON_KEYS = ['magic', 'arrow', 'shield'];
export const OFFENSE_KEYS    = ['magic', 'arrow'];

// ── Boss-Definitionen mit Spezialangriffen ──────────────────
export const BOSSES = [
  {
    name:'Demon King', col:'#ef4444', hpMult:15, dmgMult:2, sc:50, spawnMinions:5,
    attacks:[
      { id:'fireball', type:'projectile_burst', cd:180, count:8,    spd:5,  dmg:25, col:'#f97316' },
      { id:'charge',   type:'dash',             cd:300, duration:22, force:18 },
      { id:'minions',  type:'spawn_minions',    cd:480, count:5 },
    ],
  },
  {
    name:'Skull Lord', col:'#94a3b8', hpMult:20, dmgMult:2.5, sc:75, spawnMinions:8,
    attacks:[
      { id:'sniper',  type:'aimed_shot',   cd:200, spd:14, dmg:40, col:'#e2e8f0', piercing:true },
      { id:'shield',  type:'boss_shield',  cd:420, duration:120 },
      { id:'minions', type:'spawn_minions',cd:360, count:8 },
    ],
  },
  {
    name:'Mega Demon', col:'#dc2626', hpMult:25, dmgMult:3, sc:100, spawnMinions:12,
    attacks:[
      { id:'laser',    type:'laser_sweep', cd:240, duration:90, dmg:6,  col:'#ff0000', range:400 },
      { id:'slam',     type:'aoe_slam',    cd:300, radius:120,  dmg:45, knockback:20, warnFrames:45 },
      { id:'teleport', type:'teleport',    cd:360, offset:160 },
    ],
  },
];

export const PUDEF = {
  heal: { col:'#22c55e', icon:'❤', name:'Heal',   shape:'heart' },
  speed:{ col:'#3b82f6', icon:'⚡', name:'Speed',  shape:'bolt'  },
  dmg:  { col:'#ef4444', icon:'💥', name:'Damage', shape:'star'  },
};

export const ETYPES = [
  { t:'slime', c:'#22c55e', s:16, hp:20, sp:1.4,  dmg:5,  xp:1, sc:1 },
  { t:'bat',   c:'#a855f7', s:12, hp:12, sp:2.5,  dmg:3,  xp:1, sc:1 },
  { t:'skull', c:'#94a3b8', s:20, hp:40, sp:0.9,  dmg:10, xp:3, sc:3 },
  { t:'demon', c:'#ef4444', s:24, hp:80, sp:0.7,  dmg:15, xp:5, sc:5 },
];

export const META_DEFS = {
  hp:     { name:'Vitalität',    icon:'❤️', col:'#22c55e', desc:'+10 Max HP',            cost:25, max:5 },
  dmg:    { name:'Power',        icon:'💥', col:'#ef4444', desc:'+8% Schaden',            cost:35, max:5 },
  spd:    { name:'Agilität',     icon:'👟', col:'#3b82f6', desc:'+5% Bewegungstempo',     cost:30, max:4 },
  magnet: { name:'Magnet',       icon:'🧲', col:'#a855f7', desc:'+20% Pickup-Reichweite', cost:20, max:5 },
  crit:   { name:'Präzision',    icon:'🎯', col:'#facc15', desc:'+6% Krit-Chance (2× Dmg)',cost:40, max:5 },
  regen:  { name:'Regeneration', icon:'💚', col:'#34d399', desc:'+0.4 HP/Sekunde',        cost:45, max:4 },
  armor:  { name:'Rüstung',      icon:'🛡️', col:'#60a5fa', desc:'-6% erlittener Schaden', cost:40, max:5 },
  xpb:    { name:'Erfahrung',    icon:'⭐', col:'#c4b5fd', desc:'+12% XP-Gewinn',         cost:30, max:5 },
  luck:   { name:'Glück',        icon:'🍀', col:'#4ade80', desc:'+15% Gold & Powerups',   cost:35, max:4 },
};

// ── Passiver Skill-Baum ─────────────────────────────────────
export const CAT_COLORS = {
  atk: '#ef4444',
  def: '#3b82f6',
  util:'#f59e0b',
  elem:'#22c55e',
};

export const SKILL_TREE = [
  // ── OFFENSIV ──
  { id:'crit_chance',    cat:'atk',  name:'Krit. Treffer',   icon:'⚡', maxLvl:3,
    desc:['5% Crit-Chance','10% Crit-Chance','15% Crit-Chance'] },
  { id:'crit_dmg',       cat:'atk',  name:'Krit. Schaden',   icon:'💥', maxLvl:3,
    desc:['+40% Crit-Schaden','+80% Crit-Schaden','+120% Crit-Schaden'] },
  { id:'pierce',         cat:'atk',  name:'Durchdringen',    icon:'🎯', maxLvl:2,
    desc:['Projektile +1 Pierce','Projektile +2 Pierce'] },
  { id:'multishot',      cat:'atk',  name:'Mehrfachschuss',  icon:'🔫', maxLvl:2,
    desc:['Alle Waffen +1 Projektil','Alle Waffen +2 Projektile'] },
  { id:'cd_reduce',      cat:'atk',  name:'Schuss-Tempo',    icon:'⏱️', maxLvl:3,
    desc:['-10% Cooldown','-20% Cooldown','-30% Cooldown'] },
  // ── DEFENSIV ──
  { id:'max_hp',         cat:'def',  name:'Lebensenergie',   icon:'❤️', maxLvl:3,
    desc:['+20 Max HP','+40 Max HP','+60 Max HP'] },
  { id:'hp_regen',       cat:'def',  name:'Regeneration',    icon:'💚', maxLvl:3,
    desc:['+0.5 HP/s','+1 HP/s','+2 HP/s'] },
  { id:'lifesteal',      cat:'def',  name:'Lebensraub',      icon:'🩸', maxLvl:2,
    desc:['3% Schaden als HP','6% Schaden als HP'] },
  { id:'dodge',          cat:'def',  name:'Ausweichen',      icon:'💨', maxLvl:2,
    desc:['8% Ausweich-Chance','15% Ausweich-Chance'] },
  // ── UTILITY ──
  { id:'xp_boost',       cat:'util', name:'Erfahrung+',      icon:'✨', maxLvl:3,
    desc:['+20% XP','+40% XP','+60% XP'] },
  { id:'gold_magnet',    cat:'util', name:'Goldmagnet',      icon:'🧲', maxLvl:2,
    desc:['+30% Sammelradius','+60% Sammelradius'] },
  { id:'move_spd',       cat:'util', name:'Sprint',          icon:'👟', maxLvl:3,
    desc:['+10% Speed','+20% Speed','+30% Speed'] },
  // ── ELEMENTAL ──
  { id:'burn_on_hit',    cat:'elem', name:'Brandschaden',    icon:'🔥', maxLvl:2,
    desc:['Treffer: 5 dmg/s, 3s Burn','Burn stapelt 2×, 5s'] },
  { id:'poison_on_hit',  cat:'elem', name:'Vergiftung',      icon:'☠️', maxLvl:2,
    desc:['Treffer: 3 dmg/s, 5s Poison','Poison stapelt 3×, 8s'] },
  { id:'chain_lightning',cat:'elem', name:'Kettenblitz',     icon:'⚡', maxLvl:2,
    desc:['15% Chance: Blitz → 2 Gegner','30% Chance: Blitz → 3 Gegner'] },
  { id:'freeze_on_hit',  cat:'elem', name:'Einfrieren',      icon:'❄️', maxLvl:2,
    desc:['10% Chance: Freeze 1.5s','20% Chance: Freeze 2.5s'] },
];

// ── Wellen-Modifier ─────────────────────────────────────────
export const WM_DEFS = [
  { id:'fast',       name:'Rasend',      icon:'💨', col:'#f59e0b', desc:'Alle Gegner +50% Speed' },
  { id:'double_xp',  name:'Doppel-XP',  icon:'✨', col:'#a78bfa', desc:'2× XP diese Welle' },
  { id:'elite_wave', name:'Elite-Welle',icon:'👑', col:'#fbbf24', desc:'Alle Gegner sind Elites' },
  { id:'gold_rush',  name:'Goldrausch', icon:'💰', col:'#fcd34d', desc:'3× Gold-Drops' },
  { id:'berserker',  name:'Berserker',  icon:'😡', col:'#ef4444', desc:'Gegner: +200% HP, –40% Speed' },
  { id:'healing',    name:'Blutsauger', icon:'🩸', col:'#dc2626', desc:'Gegner regenerieren HP' },
  { id:'no_buffs',   name:'Kein Glück', icon:'🚫', col:'#6b7280', desc:'Keine Power-Ups diese Welle' },
];
