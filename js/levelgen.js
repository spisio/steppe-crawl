"use strict";
// Level generation for every region.

function themeFor(br, d) { return br === 'V' ? VALLEY_THEMES[d] : BRANCH_THEMES[br]; }

function newLevelObj(id, br, d) {
  return { id, br, d, absd: BRANCHES[br].absd(d), t: new Array(W * H).fill(T.WALL), seen: new Array(W * H).fill(0),
    mons: [], items: [], clouds: [], traps: [], shops: [], altars: {}, entries: [], up: null, down: null, visited: false };
}

function generateLevel(id) {
  const [br, ds] = id.split(':'); const d = +ds;
  for (let attempt = 0; attempt < 40; attempt++) {
    const lev = newLevelObj(id, br, d);
    const th = themeFor(br, d);
    const gen = BRANCHES[br].gen;
    if (gen === 'rooms') genRooms(lev, false);
    else if (gen === 'tomb') genRooms(lev, true);
    else if (gen === 'temple') genTemple(lev);
    else genCave(lev, th, gen);
    if (finishLevel(lev, th)) return lev;
  }
  throw new Error('Could not generate ' + id);
}

// --- cave-like valleys ---
function genCave(lev, th, gen) {
  let t;
  for (let a = 0; a < 20; a++) {
    t = new Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) t[idx(x, y)] = (x === 0 || y === 0 || x === W - 1 || y === H - 1 || Math.random() < (th.fill || .44)) ? T.WALL : T.FLOOR;
    for (let it = 0; it < 5; it++) {
      const n = t.slice();
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (t[idx(x + dx, y + dy)] === T.WALL) c++;
        n[idx(x, y)] = c >= 5 ? T.WALL : T.FLOOR;
      }
      t = n;
    }
    const reg = largestRegion(t, c => c === T.FLOOR);
    if (reg.size < W * H * .3) continue;
    for (let i = 0; i < W * H; i++) if (t[i] === T.FLOOR && !reg.has(i)) t[i] = T.WALL;
    break;
  }
  lev.t = t;
  for (let r = 0; r < (th.rivers || 0); r++) carveRiver(lev, th.deep || 0);
  if (gen === 'sands') for (let k = 0; k < rr(1, 3); k++) carvePond(lev);
  if (gen === 'blizzard' || gen === 'woods') for (let k = 0; k < rr(0, 2); k++) carvePond(lev);
  scatterTrees(lev, th.trees || .02);
  placeVaults(lev, rr(1, 3));
}
function carveRiver(lev, deep) {
  const t = lev.t, horiz = Math.random() < .65; let a = horiz ? rr(8, H - 9) : rr(10, W - 11);
  const len = horiz ? W : H;
  for (let s = 1; s < len - 1; s++) {
    if (Math.random() < .35) a += rnd(3) - 1; a = clamp(a, 3, (horiz ? H : W) - 4);
    for (let o = -1; o <= 1; o++) {
      const x = horiz ? s : a + o, y = horiz ? a + o : s;
      if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue;
      t[idx(x, y)] = (o === 0 && Math.random() < deep) ? T.DEEP : (t[idx(x, y)] === T.DEEP ? T.DEEP : T.SHALLOW);
    }
  }
}
function carvePond(lev) {
  const cx = rr(6, W - 7), cy = rr(5, H - 6), r = rr(2, 3);
  for (let dy = -r - 1; dy <= r + 1; dy++) for (let dx = -r - 1; dx <= r + 1; dx++) {
    const x = cx + dx, y = cy + dy; if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue;
    const dd = Math.hypot(dx, dy);
    if (dd <= r - 0.5) lev.t[idx(x, y)] = T.DEEP; else if (dd <= r + 0.7) lev.t[idx(x, y)] = T.SHALLOW;
  }
}
function scatterTrees(lev, p) {
  const t = lev.t;
  for (let i = 0; i < W * H; i++) if (t[i] === T.FLOOR && Math.random() < p) {
    t[i] = T.TREE;
    for (let k = 0; k < rr(1, 5); k++) { const [dx, dy] = pick(N8); const j = i + dy * W + dx; if (j > 0 && j < W * H && t[j] === T.FLOOR) t[j] = T.TREE; }
  }
}

// --- rooms and corridors: smugglers' tunnels and kurgan tombs ---
function genRooms(lev, tomb) {
  const t = lev.t; const rooms = [];
  for (let tries = 0; tries < 300 && rooms.length < 13; tries++) {
    const w = rr(4, 11), h = rr(3, 7), x = rr(2, W - w - 3), y = rr(2, H - h - 3);
    if (rooms.some(r => x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y)) continue;
    rooms.push({ x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) });
  }
  const ring = new Uint8Array(W * H);
  for (const r of rooms) {
    for (let yy = r.y; yy < r.y + r.h; yy++) for (let xx = r.x; xx < r.x + r.w; xx++) t[idx(xx, yy)] = T.FLOOR;
    for (let yy = r.y - 1; yy <= r.y + r.h; yy++) for (let xx = r.x - 1; xx <= r.x + r.w; xx++) {
      if (xx === r.x - 1 || xx === r.x + r.w || yy === r.y - 1 || yy === r.y + r.h) ring[idx(xx, yy)] = 1;
    }
    if (!tomb && Math.random() < .35) { // cave-like room: nibble the edges
      for (let k = 0; k < r.w * r.h / 2; k++) { const xx = rr(r.x - 1, r.x + r.w), yy = rr(r.y - 1, r.y + r.h); if (xx > 1 && yy > 1 && xx < W - 2 && yy < H - 2) t[idx(xx, yy)] = T.FLOOR; }
    }
  }
  rooms.sort((a, b) => a.cx - b.cx);
  const dig = (x, y) => {
    const i = idx(x, y);
    if (ring[i] && t[i] !== T.FLOOR && t[i] !== T.DOORC) t[i] = (tomb || Math.random() < .3) ? T.DOORC : T.FLOOR;
    else if (t[i] === T.WALL) t[i] = T.FLOOR;
  };
  const connect = (a, b) => {
    let x = a.cx, y = a.cy;
    const hFirst = Math.random() < .5;
    const stepX = () => { while (x !== b.cx) { x += Math.sign(b.cx - x); dig(x, y); } };
    const stepY = () => { while (y !== b.cy) { y += Math.sign(b.cy - y); dig(x, y); } };
    if (hFirst) { stepX(); stepY(); } else { stepY(); stepX(); }
  };
  for (let i = 1; i < rooms.length; i++) connect(rooms[i - 1], rooms[i]);
  for (let k = 0; k < 3; k++) connect(pick(rooms), pick(rooms));
  // A door must sit between two open cells; otherwise make it plain floor or wall.
  for (let i = 0; i < W * H; i++) if (t[i] === T.DOORC) {
    const x = i % W, y = (i - x) / W;
    const o = (dx, dy) => passable(t[idx(x + dx, y + dy)]) || t[idx(x + dx, y + dy)] === T.DOORC;
    if (!((o(-1, 0) && o(1, 0) && !o(0, -1) && !o(0, 1)) || (o(0, -1) && o(0, 1) && !o(-1, 0) && !o(1, 0)))) t[i] = T.FLOOR;
  }
  if (tomb) { // dressed stone around every open cell
    for (let i = 0; i < W * H; i++) if (t[i] === T.WALL) {
      const x = i % W, y = (i - x) / W;
      if (N8.some(([dx, dy]) => inb(x + dx, y + dy) && (t[idx(x + dx, y + dy)] === T.FLOOR || t[idx(x + dx, y + dy)] === T.DOORC))) t[i] = T.STONE;
    }
    for (const r of rooms) if (r.w >= 6 && r.h >= 5 && Math.random() < .5) { // pillars or statues
      for (let yy = r.y + 1; yy < r.y + r.h - 1; yy += 2) for (let xx = r.x + 1; xx < r.x + r.w - 1; xx += 3) if (Math.random() < .5) t[idx(xx, yy)] = T.STATUE;
    }
  }
  lev.rooms = rooms;
  placeVaults(lev, rr(0, 2));
}

// --- the temple: a ring of white yurts ---
function genTemple(lev) {
  const t = lev.t;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const dx = (x - W / 2) / (W / 2.3), dy = (y - H / 2) / (H / 2.3);
    t[idx(x, y)] = dx * dx + dy * dy < 1 ? T.FLOOR : (Math.random() < .5 ? T.TREE : T.WALL);
  }
  const yurt = ['.###.', '#...#', '#._.#', '#...#', '.#+#.'];
  GOD_ORDER.forEach((g, i) => {
    const ang = (i / GOD_ORDER.length) * Math.PI * 2 - Math.PI / 2;
    const cx = Math.round(W / 2 + Math.cos(ang) * 20), cy = Math.round(H / 2 + Math.sin(ang) * 10);
    for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) {
      const ch = yurt[yy][xx], x = cx - 2 + xx, y = cy - 2 + yy, i2 = idx(x, y);
      t[i2] = ch === '#' ? T.FELT : ch === '+' ? T.DOORC : ch === '_' ? T.ALTAR : T.FLOOR;
      if (ch === '_') lev.altars[i2] = g;
    }
  });
  t[idx(W >> 1, H >> 1)] = T.MAZAR;
}

// --- vault stamping ---
function placeVaults(lev, n) {
  const pool = VAULTS.filter(v => v.where.includes(lev.br) && (!v.minD || lev.absd >= v.minD) && (!v.maxD || lev.absd <= v.maxD));
  for (let k = 0; k < n && pool.length; k++) {
    const v = pick(pool); const vh = v.map.length, vw = v.map[0].length;
    for (let tries = 0; tries < 80; tries++) {
      const x0 = rr(2, W - vw - 3), y0 = rr(2, H - vh - 3);
      let ok = true;
      for (let y = y0 - 1; y <= y0 + vh && ok; y++) for (let x = x0 - 1; x <= x0 + vw; x++) if (lev.t[idx(x, y)] !== T.FLOOR) { ok = false; break; }
      if (!ok) continue;
      stampVault(lev, v, x0, y0); break;
    }
  }
}
function stampVault(lev, v, x0, y0) {
  lev.pending = lev.pending || [];
  const wallT = v.wall === 'felt' ? T.FELT : v.wall === 'stone' ? T.STONE : T.WALL;
  v.map.forEach((row, yy) => [...row].forEach((ch, xx) => {
    const x = x0 + xx, y = y0 + yy, i = idx(x, y);
    const set = tt => { lev.t[i] = tt; };
    switch (ch) {
      case '#': set(wallT); break;
      case '+': set(T.DOORC); break;
      case 'T': set(T.TREE); break;
      case '~': set(T.SHALLOW); break;
      case 'w': set(T.DEEP); break;
      case 'O': set(T.STATUE); break;
      case 'M': set(T.MAZAR); break;
      case '_': set(T.ALTAR); lev.altars[i] = pick(GOD_ORDER); break;
      case 'S': set(T.SHOP); lev.pending.push({ x, y, what: 'shop' }); break;
      default: set(T.FLOOR); if ('*9$12'.includes(ch)) lev.pending.push({ x, y, what: ch });
    }
  }));
}

// --- shared finishing: connectivity, stairs, features, items, monsters ---
function finishLevel(lev, th) {
  const t = lev.t, B = BRANCHES[lev.br];
  const big = [...largestRegion(t, c => walkable(c))].filter(i => t[i] === T.FLOOR);
  if (big.length < 150) return false;
  const si = pick(big); const start = { x: si % W, y: Math.floor(si / W) };
  let dm = bfsFrom(t, start.x, start.y, walkable);
  let pc = 0, rc = 0; for (let i = 0; i < W * H; i++) if (walkable(t[i])) { pc++; if (dm[i] >= 0) rc++; }
  if (rc < pc * .85) { for (let i = 0; i < W * H; i++) if (t[i] === T.DEEP) t[i] = T.SHALLOW; dm = bfsFrom(t, start.x, start.y, walkable); }
  for (let i = 0; i < W * H; i++) if (walkable(t[i]) && dm[i] < 0) { t[i] = T.WALL; delete lev.altars[i]; }
  lev.pending = (lev.pending || []).filter(p => dm[idx(p.x, p.y)] >= 0);

  lev.up = start; t[idx(start.x, start.y)] = T.UP;
  const floors = []; let far = -1, farCell = null;
  for (let i = 0; i < W * H; i++) if (t[i] === T.FLOOR && dm[i] >= 0) { floors.push(i); if (dm[i] > far) { far = dm[i]; farCell = { x: i % W, y: Math.floor(i / W) }; } }
  if (!farCell || far < 15) return false;
  const last = lev.d >= B.depth;
  if (!last) { lev.down = farCell; t[idx(farCell.x, farCell.y)] = T.DOWN; }
  lev.far = farCell;
  const used = new Set([idx(start.x, start.y), idx(farCell.x, farCell.y)]);
  const free = (minD = 0, maxD = 9999) => {
    for (let k = 0; k < 3000; k++) {
      const i = pick(floors); if (used.has(i) || t[i] !== T.FLOOR) continue;
      if (dm[i] < minD || dm[i] > maxD) continue;
      const x = i % W, y = Math.floor(i / W); if (lev.mons.some(m => m.x === x && m.y === y)) continue;
      return { x, y, i };
    }
    return null;
  };
  // Branch entrances on this level.
  for (const b of BRANCH_ORDER) {
    const Bb = BRANCHES[b];
    if (Bb.parent === lev.br && G.entries[b] === lev.d) {
      const c = free(10); if (!c) return false;
      t[c.i] = T.BRANCH; used.add(c.i); lev.entries.push({ x: c.x, y: c.y, to: b });
    }
  }
  // Features.
  if (lev.br !== 'temple') {
    if (chance(.35)) { const c = free(5); if (c) { t[c.i] = T.MAZAR; used.add(c.i); } }
    if (lev.br === 'V' && lev.d >= 2 && lev.d <= 9 && chance(.2)) { const c = free(5); if (c) { t[c.i] = T.ALTAR; lev.altars[c.i] = pick(GOD_ORDER); used.add(c.i); } }
    const shopP = lev.br === 'tunnels' ? .6 : lev.br === 'V' ? .22 : .08;
    if (lev.br !== 'hidden' && chance(shopP)) { const c = free(5); if (c) { t[c.i] = T.SHOP; used.add(c.i); lev.pending.push({ x: c.x, y: c.y, what: 'shop' }); } }
    const nt = lev.br === 'tunnels' || lev.br === 'kurgan' ? rr(3, 6) : rr(0, 2) + (lev.absd > 4 ? 1 : 0);
    for (let k = 0; k < nt; k++) { const c = free(4); if (c) { lev.traps.push({ x: c.x, y: c.y, ty: pickTrap(lev.absd), known: false }); used.add(c.i); } }
  }
  for (const p of lev.pending) {
    if (p.what === 'shop') lev.shops.push(makeShop(p.x, p.y, lev.absd));
  }
  // Items.
  if (lev.br !== 'temple') {
    const ni = rr(6, 10) + (lev.br === 'tunnels' ? 3 : 0);
    for (let k = 0; k < ni; k++) { const c = free(); if (c) lev.items.push({ x: c.x, y: c.y, it: randomItem(lev.absd) }); }
    for (const p of lev.pending) {
      if (p.what === '*') lev.items.push({ x: p.x, y: p.y, it: randomItem(lev.absd + 1) });
      if (p.what === '9') lev.items.push({ x: p.x, y: p.y, it: randomItem(lev.absd + 5, true) });
      if (p.what === '$') lev.items.push({ x: p.x, y: p.y, it: newItem('gold', 'gold', { qty: rr(20, 40 + lev.absd * 12) }) });
    }
  }
  // Monsters.
  if (lev.br !== 'temple') {
    const nm = 4 + Math.floor(lev.absd * 0.9) + rnd(4);
    for (let k = 0; k < nm; k++) { const c = free(9); if (c) spawnGroup(lev, pickMonsterType(lev), c.x, c.y); }
    for (const p of lev.pending) {
      if (p.what === '1') { const k = pickMonsterType(lev); spawnMonster(lev, k, p.x, p.y); }
      if (p.what === '2') { const k = pickMonsterType(lev, 3); spawnMonster(lev, k, p.x, p.y); }
    }
    for (const k of UNIQUE_KEYS) {
      const U = MT[k];
      if (G.uniques[k] || !U.br.includes(lev.br) || lev.absd < U.lv[0] || lev.absd > U.lv[1] || !chance(.33)) continue;
      const c = free(12); if (c) { spawnGroup(lev, k, c.x, c.y); G.uniques[k] = 'alive'; }
    }
    if (last && B.boss) placeBoss(lev, farCell, B);
  }
  delete lev.pending; delete lev.rooms;
  lev._free = free;
  return true;
}
function placeBoss(lev, at, B) {
  if (B.tamga) lev.items.push({ x: at.x, y: at.y, it: newItem('tamga', B.tamga) });
  if (lev.br === 'hidden') {
    // The ruined First Church: stone ring around the leaven.
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const x = at.x + dx, y = at.y + dy; if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue;
      const r = Math.hypot(dx, dy);
      if (r > 2.5 && r <= 3.3 && chance(.7)) lev.t[idx(x, y)] = T.STONE;
      else if (r <= 2.5 && lev.t[idx(x, y)] !== T.FLOOR) lev.t[idx(x, y)] = T.FLOOR;
    }
    lev.items.push({ x: at.x, y: at.y, it: newItem('orb', 'orb') });
    for (let k = 0; k < 2; k++) { const c = nearFree(lev, at.x, at.y, 3); if (c) spawnMonster(lev, 'bull', c.x, c.y); }
    // Make sure the ring did not seal the church.
    const dm = bfsFrom(lev.t, lev.up.x, lev.up.y, walkable);
    if (dm[idx(at.x, at.y)] < 0) for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const i = idx(at.x + dx, at.y + dy); if (lev.t[i] === T.STONE && dy === 3) lev.t[i] = T.FLOOR; }
  }
  const c = nearFree(lev, at.x, at.y, 2) || at;
  spawnGroup(lev, B.boss, c.x, c.y);
  G.uniques[B.boss] = 'alive';
}

function largestRegion(t, f) {
  const seen = new Uint8Array(W * H); let best = new Set();
  for (let i = 0; i < W * H; i++) {
    if (seen[i] || !f(t[i])) continue;
    const reg = new Set([i]); const q = [i]; seen[i] = 1;
    while (q.length) {
      const c = q.pop(); const x = c % W, y = (c - x) / W;
      for (const [dx, dy] of N8) {
        const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) continue;
        const j = idx(nx, ny); if (!seen[j] && f(t[j])) { seen[j] = 1; reg.add(j); q.push(j); }
      }
    }
    if (reg.size > best.size) best = reg;
  }
  return best;
}
function bfsFrom(t, sx, sy, ok, block) {
  const d = new Int32Array(W * H).fill(-1); const s = idx(sx, sy); d[s] = 0; const q = [s]; let h = 0;
  while (h < q.length) {
    const c = q[h++]; const x = c % W, y = (c - x) / W;
    for (const [dx, dy] of N8) {
      const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) continue;
      const j = idx(nx, ny); if (d[j] >= 0 || !ok(t[j])) continue;
      if (block && block(j)) continue;
      d[j] = d[c] + 1; q.push(j);
    }
  }
  return d;
}
function nearFree(lev, x, y, r = 2, opts = {}) {
  for (let k = 0; k < 120; k++) {
    const rad = Math.min(r, 1 + Math.floor(k / 20));
    const nx = x + rr(-rad, rad), ny = y + rr(-rad, rad);
    if (nx < 1 || ny < 1 || nx >= W - 1 || ny >= H - 1) continue;
    const tt = lev.t[idx(nx, ny)];
    if (!passable(tt) || tt === T.DOWN || tt === T.UP || tt === T.BRANCH) continue;
    if (lev.mons.some(m => !m.dead && m.x === nx && m.y === ny)) continue;
    if (G.p && G.cur === lev.id && G.p.x === nx && G.p.y === ny) continue;
    if (opts.noDeep && tt === T.DEEP) continue;
    return { x: nx, y: ny };
  }
  return null;
}
function randomFloor(lev, minDistFromPlayer = 0) {
  for (let k = 0; k < 4000; k++) {
    const x = rr(1, W - 2), y = rr(1, H - 2);
    if (lev.t[idx(x, y)] !== T.FLOOR) continue;
    if (lev.mons.some(m => !m.dead && m.x === x && m.y === y)) continue;
    if (G.p && G.cur === lev.id && Math.max(Math.abs(G.p.x - x), Math.abs(G.p.y - y)) < minDistFromPlayer) continue;
    return { x, y };
  }
  return null;
}

const TRAPS = {
  net: { n: 'net trap', c: '#c8b898' }, pit: { n: 'marmot pit', c: '#a0704a' }, alarm: { n: 'bell trap', c: '#e8c050' },
  dust: { n: 'dust devil trap', c: '#a4e4ff' }, arrow: { n: 'tripwire bow', c: '#d8d8e0' }, mark: { n: "Morkhan's mark", c: '#ff4050' },
};
function pickTrap(absd) {
  return wpick([['net', 3], ['pit', 4], ['alarm', 2], ['dust', 2], ['arrow', absd > 2 ? 3 : 0], ['mark', absd > 6 ? 2 : 0]]);
}
