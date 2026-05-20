// ============================================================
// skills.js — Passiver Skill-Baum
// ============================================================
import { SKILL_TREE } from './constants.js';
import { player, playerSkills } from './state.js';

/**
 * Skill auf gegebenem Level auf den Spieler anwenden.
 * Wird bei jedem Level-Up aufgerufen (überschreibend, nicht additiv).
 */
export function applySkill(id, lvl) {
  playerSkills[id] = lvl;
  switch (id) {
    case 'crit_chance':    player.critChance      = 0.05 * lvl;          break;
    case 'crit_dmg':       player.critMult        = 1 + 0.4 * lvl;       break;
    case 'pierce':         player.bonusPierce     = lvl;                  break;
    case 'multishot':      player.bonusProjectiles= lvl;                  break;
    case 'cd_reduce':      player.cdReduction     = 1 - 0.1 * lvl;       break;
    case 'max_hp':
      const prev = (playerSkills[id] || 0);
      const diff = (lvl - prev) * 20;
      player.maxHp += diff;
      player.hp = Math.min(player.hp + diff, player.maxHp);
      break;
    case 'hp_regen':       player.hpRegen         = (0.5 * lvl) / 60;    break;
    case 'lifesteal':      player.lifesteal        = 0.03 * lvl;          break;
    case 'dodge':          player.dodgeChance      = lvl === 1 ? 0.08 : 0.15; break;
    case 'xp_boost':       player.xpMult           = 1 + 0.2 * lvl;      break;
    case 'gold_magnet':    player.pickupRange       = 1 + 0.3 * lvl;      break;
    case 'move_spd':       player.spdMult           = 1 + 0.1 * lvl;      break;
    case 'burn_on_hit':    player.burnOnHit         = lvl;                 break;
    case 'poison_on_hit':  player.poisonOnHit       = lvl;                 break;
    case 'chain_lightning':player.chainLightning    = lvl;                 break;
    case 'freeze_on_hit':  player.freezeOnHit       = lvl;                 break;
  }
}

/** Zufällig 2 Skills aus dem Pool ziehen (noch nicht maxed) */
export function rollSkillOptions(count = 2) {
  const available = SKILL_TREE.filter(s => {
    const cur = playerSkills[s.id] || 0;
    return cur < s.maxLvl;
  });
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** Skill-Beschreibung für aktuelles nächstes Level */
export function getSkillNextDesc(skillDef) {
  const cur = playerSkills[skillDef.id] || 0;
  return skillDef.desc[cur] || skillDef.desc[skillDef.desc.length - 1];
}

export function getSkillLevel(id) {
  return playerSkills[id] || 0;
}

/** Alle Skill-Level zurücksetzen (neuer Run) */
export function resetSkills() {
  for (const key of Object.keys(playerSkills)) delete playerSkills[key];
  player.critChance = 0; player.critMult = 1.5;
  player.bonusPierce = 0; player.bonusProjectiles = 0;
  player.cdReduction = 1;
  player.hpRegen = 0; player.lifesteal = 0; player.dodgeChance = 0;
  player.xpMult = 1; player.pickupRange = 1; player.spdMult = 1;
  player.burnOnHit = 0; player.poisonOnHit = 0;
  player.chainLightning = 0; player.freezeOnHit = 0;
}
