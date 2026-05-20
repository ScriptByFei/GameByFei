// ============================================================
// leaderboard.js
// ============================================================
import { lb } from './state.js';

const LB_BIN = '69c969b22eb67b7abbe16728';
const LB_KEY = '$2a$10$laWxXpPLHZIJxaF8I2HcGe/9CXo/d.aWoppS7MQxkGv7STeAfgIVm';

export async function fetchLeaderboard() {
  try {
    const r = await fetch(`https://api.jsonbin.io/v3/b/${LB_BIN}/latest`, {
      headers: { 'X-Access-Key': LB_KEY },
    });
    const d = await r.json();
    lb.data = d.record?.scores || [];
    lb.data.sort((a, b) => b.s - a.s);
  } catch(e) { lb.data = []; }
}

export async function submitScore(nick, pts) {
  try {
    await fetch(`https://api.jsonbin.io/v3/b/${LB_BIN}`, {
      method: 'PUT',
      headers: { 'X-Access-Key': LB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores: [{ n: nick, s: pts, t: Date.now() }, ...lb.data.slice(0, 49)] }),
    });
  } catch(e) { console.warn(e); }
}
