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
  [T.DOWN]: 'a pass leading down', [T.UP]: 'a track leading up', [T.MAZAR]: 'a mazar hung with white ribbons',
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
