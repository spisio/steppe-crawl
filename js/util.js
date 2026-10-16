"use strict";
// Shared helpers and constants.

const W = 72, H = 40;
const VERSION = 2;

const rnd = n => n <= 0 ? 0 : Math.floor(Math.random() * n);
const rr = (a, b) => a + rnd(b - a + 1);
const pick = a => a[rnd(a.length)];
const chance = p => Math.random() < p;
const roll = (n, s) => { let t = 0; for (let i = 0; i < n; i++) t += 1 + rnd(s); return t; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const sgn = n => (n >= 0 ? '+' : '') + n;
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const art = s => (/^[aeiouAEIOU]/.test(s) ? 'an ' : 'a ') + s;
const idx = (x, y) => y * W + x;
const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
const N8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// entries: [[value, weight], ...]
function wpick(entries) {
  let s = 0; for (const e of entries) s += e[1];
  let r = Math.random() * s;
  for (const e of entries) { r -= e[1]; if (r <= 0) return e[0]; }
  return entries.length ? entries[entries.length - 1][0] : null;
}
// Weighted pick from an object of {key: {w}}.
function wkey(o) { return wpick(Object.keys(o).map(k => [k, o[k].w || 1])); }

// Terrain
const T = { FLOOR: 0, WALL: 1, TREE: 2, DEEP: 3, SHALLOW: 4, DOWN: 5, UP: 6, MAZAR: 7, USED: 8, FELT: 9,
  DOORC: 10, DOORO: 11, STONE: 12, ALTAR: 13, SHOP: 14, BRANCH: 15, STATUE: 16 };
const PASS = new Set([T.FLOOR, T.SHALLOW, T.DOWN, T.UP, T.MAZAR, T.USED, T.DOORO, T.ALTAR, T.SHOP, T.BRANCH]);
const passable = t => PASS.has(t);
const walkable = t => PASS.has(t) || t === T.DOORC;
const OPAQUE = new Set([T.WALL, T.TREE, T.FELT, T.DOORC, T.STONE]);
const opaqueT = t => OPAQUE.has(t);
const diggable = t => t === T.WALL || t === T.TREE || t === T.FELT || t === T.STONE || t === T.DOORC || t === T.STATUE;

const TERRAIN_NAME = {
  [T.FLOOR]: 'open ground', [T.WALL]: 'rock', [T.TREE]: 'a tree', [T.DEEP]: 'deep water', [T.SHALLOW]: 'shallow water',
  [T.DOWN]: 'the way on', [T.UP]: 'the way back', [T.MAZAR]: 'a mazar hung with white ribbons',
  [T.USED]: 'a quiet mazar', [T.FELT]: 'a felt yurt wall', [T.DOORC]: 'a closed felt door', [T.DOORO]: 'an open felt door',
  [T.STONE]: 'a dressed stone wall', [T.ALTAR]: 'an altar', [T.SHOP]: 'a trader', [T.BRANCH]: 'a track into another region',
  [T.STATUE]: 'a balbal, an old stone figure',
};

const TAMGAS = {
  chubar: { n: 'tamga of the Chubar', c: '#6fc46f' },
  boztorgoy: { n: 'tamga of the Boztorgoy', c: '#e8c94a' },
  karakoyun: { n: 'tamga of the Karakoyun', c: '#d8b070' },
  tanip: { n: 'tamga of the Tanıp', c: '#7aa0f0' },
};

// The night-steppe horizon behind the title on the home, guide and scores pages:
// stars, a crescent moon, two ridges of hills.
function skySVG() {
  const stars = [[120, 40, 1.4], [260, 90, 1], [400, 30, 1.6], [560, 70, 1], [700, 24, 1.3], [860, 110, 1], [930, 40, 1.2], [1180, 130, 1.4], [1230, 40, 1], [40, 120, 1], [640, 130, 1.2], [330, 150, 1], [1110, 20, 1.1]];
  return `<svg class="sky" aria-hidden="true" viewBox="0 0 1280 300" preserveAspectRatio="xMidYMax slice">
    <circle cx="1040" cy="78" r="34" fill="#f5efe0" opacity=".9"/><circle cx="1052" cy="70" r="30" fill="#100f17"/>
    <g fill="#f5efe0" opacity=".55">${stars.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>
    <path d="M0 230 L120 170 L190 200 L300 120 L380 180 L470 150 L560 200 L660 110 L760 175 L850 140 L960 200 L1060 130 L1160 190 L1280 150 L1280 300 L0 300 Z" fill="#1d1a2a"/>
    <path d="M660 110 L690 132 L676 134 L700 150 L640 140 Z" fill="#f5efe0" opacity=".18"/>
    <path d="M0 260 C200 240 360 270 560 250 C760 232 980 268 1280 245 L1280 300 L0 300 Z" fill="#15131f"/></svg>`;
}
