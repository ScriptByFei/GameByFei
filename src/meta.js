// ============================================================
// meta.js — Meta-Progression (localStorage)
// ============================================================
import { meta } from './state.js';

export function loadMeta() {
  try {
    const d = JSON.parse(localStorage.getItem('survivor_meta') || '{}');
    meta.bankGold = d.bankGold || 0;
    meta.skills = {
      hp:     d.metaSkills?.hp     || 0,
      dmg:    d.metaSkills?.dmg    || 0,
      spd:    d.metaSkills?.spd    || 0,
      magnet: d.metaSkills?.magnet || 0,
    };
  } catch(e) {
    meta.bankGold = 0;
    meta.skills = { hp:0, dmg:0, spd:0, magnet:0 };
  }
}

export function saveMeta() {
  localStorage.setItem('survivor_meta', JSON.stringify({
    bankGold: meta.bankGold,
    metaSkills: meta.skills,
  }));
}

export function getHS() { return parseInt(localStorage.getItem('survivorbyfei_hs') || '0'); }
export function setHS(v) { localStorage.setItem('survivorbyfei_hs', v); }
