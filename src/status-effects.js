// ============================================================
// status-effects.js — Burn / Poison / Freeze / Stun
// ============================================================
import { cv, fx, parts } from './state.js';

const TICK = 4; // alle N Frames ein DoT-Tick

export function initStatus(e) {
  if (!e.status) e.status = {
    burn:   { stacks: 0, timer: 0 },
    poison: { stacks: 0, timer: 0 },
    freeze: { active: false, timer: 0 },
    stun:   { active: false, timer: 0 },
  };
}

export function applyBurn(e, stacks, duration) {
  initStatus(e);
  e.status.burn.stacks = Math.min(e.status.burn.stacks + stacks, 4);
  e.status.burn.timer  = Math.max(e.status.burn.timer, duration);
}

export function applyPoison(e, stacks, duration) {
  initStatus(e);
  e.status.poison.stacks = Math.min(e.status.poison.stacks + stacks, 6);
  e.status.poison.timer  = Math.max(e.status.poison.timer, duration);
}

export function applyFreeze(e, duration) {
  initStatus(e);
  e.status.freeze.active = true;
  e.status.freeze.timer  = Math.max(e.status.freeze.timer, duration);
}

export function applyStun(e, duration) {
  initStatus(e);
  e.status.stun.active = true;
  e.status.stun.timer  = Math.max(e.status.stun.timer, duration);
}

/**
 * Jeden Frame ticken — DoT-Schaden, Timer heruntersetzen.
 * @param {Array} enemies
 * @param {Function} hitFn — hitEnemy(e, dmg, col, sx, sy, pc, ps)
 * @param {number} frame
 */
export function tickStatusEffects(enemies, hitFn, frame) {
  const { SC } = cv;
  for (const e of enemies) {
    if (!e.status) continue;
    const s = e.status;

    // ── Burn ──────────────────────────────────────────────
    if (s.burn.timer > 0) {
      s.burn.timer--;
      if (frame % TICK === 0 && s.burn.stacks > 0) {
        const dmg = 5 * s.burn.stacks * (TICK / 60);
        hitFn(e, dmg, '#f97316', e.x, e.y, 0, 0);
        // Rauchpartikel
        parts.push({ x: e.x + (Math.random()-.5)*e.sz, y: e.y - e.sz*0.8,
          vx:(Math.random()-.5)*.8, vy:-1.2-Math.random()*.8,
          sz:(2+Math.random()*2)*SC, col:'#f97316', life:0.55 });
      }
      if (s.burn.timer <= 0) s.burn.stacks = 0;
    }

    // ── Poison ────────────────────────────────────────────
    if (s.poison.timer > 0) {
      s.poison.timer--;
      if (frame % TICK === 0 && s.poison.stacks > 0) {
        const dmg = 3 * s.poison.stacks * (TICK / 60);
        hitFn(e, dmg, '#4ade80', e.x, e.y, 0, 0);
      }
      if (s.poison.timer <= 0) s.poison.stacks = 0;
    }

    // ── Freeze ────────────────────────────────────────────
    if (s.freeze.active) {
      s.freeze.timer--;
      if (s.freeze.timer <= 0) { s.freeze.active = false; s.freeze.timer = 0; }
    }

    // ── Stun ──────────────────────────────────────────────
    if (s.stun.active) {
      s.stun.timer--;
      if (s.stun.timer <= 0) { s.stun.active = false; s.stun.timer = 0; }
    }
  }
}

/** Status-Geschwindigkeitsfaktor für einen Gegner */
export function getSpeedFactor(e) {
  if (!e.status) return 1;
  if (e.status.stun.active)            return 0;
  if (e.status.freeze.active)          return 0.15;
  if (e.slow > 0)                      return 0.35;
  return 1;
}

/** Visuelle Indikatoren über Gegner zeichnen */
export function drawStatusEffects(ctx, e, SC, frame) {
  if (!e.status) return;
  const s = e.status;
  ctx.save();
  ctx.translate(e.x, e.y);

  if (s.burn.timer > 0 && s.burn.stacks > 0) {
    const a = 0.25 + Math.sin(frame * 0.4) * 0.15;
    ctx.globalAlpha = a;
    ctx.fillStyle = '#f97316';
    ctx.beginPath(); ctx.arc(0, 0, e.sz * 1.25, 0, Math.PI * 2); ctx.fill();
  }
  if (s.poison.timer > 0 && s.poison.stacks > 0) {
    const a = 0.22 + Math.sin(frame * 0.25 + 1) * 0.1;
    ctx.globalAlpha = a;
    ctx.fillStyle = '#4ade80';
    ctx.beginPath(); ctx.arc(0, 0, e.sz * 1.2, 0, Math.PI * 2); ctx.fill();
  }
  if (s.freeze.active) {
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = '#93c5fd';
    ctx.beginPath(); ctx.arc(0, 0, e.sz * 1.15, 0, Math.PI * 2); ctx.fill();
  }
  if (s.stun.active) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#fde047';
    ctx.beginPath(); ctx.arc(0, 0, e.sz * 1.2, 0, Math.PI * 2); ctx.fill();
    // Sternchen
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fbbf24';
    ctx.font = `bold ${10 * SC}px system-ui`;
    ctx.textAlign = 'center';
    const off = e.sz * 1.5;
    ctx.fillText('★', Math.cos(frame * 0.15) * off * 0.5, -off);
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}
