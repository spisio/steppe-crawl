"use strict";
// Field of view (recursive shadowcasting) and lines.

let vis = new Uint8Array(W * H);

function computeFOV(lev, px, py, r) {
  const v = new Uint8Array(W * H); v[idx(px, py)] = 1;
  const fog = new Set();
  for (const c of lev.clouds) if (CLOUDS[c.ty] && CLOUDS[c.ty].opaque) fog.add(idx(c.x, c.y));
  const op = (X, Y) => X < 0 || Y < 0 || X >= W || Y >= H || opaqueT(lev.t[idx(X, Y)]) || fog.has(idx(X, Y));
  const MULT = [[1, 0, 0, -1, -1, 0, 0, 1], [0, 1, -1, 0, 0, -1, 1, 0], [0, 1, 1, 0, 0, -1, -1, 0], [1, 0, 0, 1, -1, 0, 0, -1]];
  function cast(row, start, end, xx, xy, yx, yy) {
    if (start < end) return;
    let newStart = 0, blocked = false;
    for (let j = row; j <= r && !blocked; j++) {
      let dx = -j - 1; const dy = -j;
      while (dx <= 0) {
        dx++;
        const X = px + dx * xx + dy * xy, Y = py + dx * yx + dy * yy;
        const lS = (dx - 0.5) / (dy + 0.5), rS = (dx + 0.5) / (dy - 0.5);
        if (start < rS) continue; else if (end > lS) break;
        if (inb(X, Y) && dx * dx + dy * dy <= r * r + r) v[idx(X, Y)] = 1;
        const o = op(X, Y);
        if (blocked) { if (o) { newStart = rS; continue; } blocked = false; start = newStart; }
        else if (o && j < r) { blocked = true; cast(j + 1, start, lS, xx, xy, yx, yy); newStart = rS; }
      }
    }
  }
  for (let o = 0; o < 8; o++) cast(1, 1, 0, MULT[0][o], MULT[1][o], MULT[2][o], MULT[3][o]);
  return v;
}

function updateFOV() {
  const lev = L();
  vis = computeFOV(lev, G.p.x, G.p.y, sightRadius());
  let fresh = 0;
  for (let i = 0; i < W * H; i++) if (vis[i] && !lev.seen[i]) { lev.seen[i] = 1; fresh++; }
  if (fresh && G.p.god === 'umay') umayExplore(fresh);
  for (const m of lev.mons) if (!m.dead && vis[idx(m.x, m.y)] && monVisible(m) && !m.ally && !m.seenOnce) {
    m.seenOnce = 1; const Tm = T_(m);
    if (Tm.fl.has('unique') && Tm.speech && !m.spoke) { m.spoke = 1; msg(pick(Tm.speech), Tm.c); }
  }
}
const canSee = (x, y) => vis[idx(x, y)] === 1;

// Bresenham line from (x0,y0) toward (x1,y1), excluding the start.
function line(x0, y0, x1, y1, max = 60) {
  const pts = []; let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy, x = x0, y = y0;
  for (let k = 0; k < max; k++) {
    if (!(x === x0 && y === y0)) pts.push({ x, y });
    if (x === x1 && y === y1) break;
    const e2 = 2 * err; if (e2 >= dy) { err += dy; x += sx; } if (e2 <= dx) { err += dx; y += sy; }
  }
  return pts;
}
// Cells along a ray through the target, up to range, stopping before walls.
function rayCells(from, to, range, stopAtTarget) {
  if (from.x === to.x && from.y === to.y) return [];
  const far = stopAtTarget ? to : { x: from.x + (to.x - from.x) * 20, y: from.y + (to.y - from.y) * 20 };
  const out = [];
  for (const c of line(from.x, from.y, far.x, far.y, 200)) {
    if (!inb(c.x, c.y)) break;
    if (cheb(c, from) > range) break;
    if (opaqueT(L().t[idx(c.x, c.y)]) || L().t[idx(c.x, c.y)] === T.STATUE) break;
    out.push(c);
    if (stopAtTarget && c.x === to.x && c.y === to.y) break;
  }
  return out;
}
function clearShot(a, b) {
  for (const q of line(a.x, a.y, b.x, b.y)) {
    if (q.x === b.x && q.y === b.y) return true;
    const t = L().t[idx(q.x, q.y)];
    if (opaqueT(t) || t === T.STATUE) return false;
    if (monAt(q.x, q.y)) return false;
    if (G.p.x === q.x && G.p.y === q.y) return false;
  }
  return true;
}
