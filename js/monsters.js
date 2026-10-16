"use strict";
// Monsters: spawning, naming, AI, monster spells and allies.

function T_(m) {
  if (!m.o) return MT[m.k];
  const c = Object.assign(Object.create(MT[m.k]), m.o);
  if (m.o.dmg) c.atk = [[m.o.dmg, MT[m.k].atk[0][1]]];
  return c;
}
function monName(m, capFirst, indef) {
  const Tm = T_(m);
  let n;
  if (m.ally && m.perm) n = 'your ' + Tm.n;
  else if (Tm.fl.has('unique')) n = Tm.n;
  else n = (indef ? (/^[aeiou]/i.test(Tm.n) ? 'an ' : 'a ') : 'the ') + Tm.n;
  if (!monVisible(m) && canSee(m.x, m.y)) n = 'something';
  return capFirst ? cap(n) : n;
}
function monVisible(m) { const Tm = T_(m); return !(Tm.fl.has('invis') || (m.st && m.st.invis)) || seeInvis(); }
const monAt = (x, y) => L().mons.find(m => !m.dead && m.x === x && m.y === y);
const visibleHostiles = () => L().mons.filter(m => !m.dead && !m.ally && canSee(m.x, m.y) && monVisible(m)).sort((a, b) => cheb(a, G.p) - cheb(b, G.p));
const isEvil = m => { const Tm = T_(m); return Tm.fl.has('evil') || Tm.fl.has('undead') || Tm.fl.has('demonic'); };
const isLiving = m => { const Tm = T_(m); return !Tm.fl.has('undead') && !Tm.fl.has('mindless') && !Tm.fl.has('nocorpse'); };

function spawnMonster(lev, k, x, y, o = {}) {
  const Tm = MT[k];
  const hp = Tm.fl.has('unique') ? Tm.hp : Math.max(1, Math.round(Tm.hp * (0.8 + Math.random() * 0.4)));
  const m = { id: G.nextId++, k, x, y, hp, mhp: hp, en: rnd(10), st: {}, tx: null, ty: null,
    state: o.awake || o.ally ? 'hunt' : (chance(.65) ? 'sleep' : 'wander') };
  if (o.ally) { m.ally = true; if (o.ttl) m.ttl = o.ttl; if (o.perm) m.perm = true; if (o.summoned !== false) m.summoned = !o.perm; }
  if (o.o) { m.o = o.o; if (o.o.hp) { m.hp = m.mhp = o.o.hp; } }
  if (o.summoned) m.summoned = true;
  lev.mons.push(m);
  return m;
}
function spawnGroup(lev, k, x, y) {
  const Tm = MT[k]; const lead = spawnMonster(lev, k, x, y);
  if (Tm.pack) { const n = rr(Tm.pack[0], Tm.pack[1]) - 1; for (let j = 0; j < n; j++) { const q = nearFree(lev, x, y, 3); if (q) { const f = spawnMonster(lev, k, q.x, q.y); f.state = lead.state; } } }
  if (Tm.band) for (const [bk, a, b] of Tm.band) { const n = rr(a, b); for (let j = 0; j < n; j++) { const q = nearFree(lev, x, y, 3); if (q) { const f = spawnMonster(lev, bk, q.x, q.y); f.state = lead.state; } } }
  return lead;
}
function pickMonsterType(lev, bonus = 0) {
  let d = lev.absd + bonus; if (chance(.06)) d += rr(2, 4);
  const boost = lev.br === 'V' ? (THEME_BOOST[lev.d] || []) : [];
  const entries = [];
  for (const k in MT) {
    const Tm = MT[k]; if (Tm.fl.has('unique') || Tm.lv[0] >= 99) continue;
    if (!Tm.br.includes(lev.br)) continue;
    if (d < Tm.lv[0] || d > Tm.lv[1] + 2) continue;
    let w = d > Tm.lv[1] ? 1 : (d - Tm.lv[0] < 2 ? 2 : 3);
    if (boost.includes(k)) w += 4;
    entries.push([k, w]);
  }
  if (!entries.length) { for (const k in MT) { const Tm = MT[k]; if (!Tm.fl.has('unique') && Tm.lv[0] < 99 && Tm.br.includes(lev.br)) entries.push([k, 1]); } }
  if (!entries.length) entries.push(['jackal', 1]);
  return wpick(entries);
}

// --- movement helpers ---
function moveMode(m) { const Tm = T_(m); return (Tm.fl.has('fly') || Tm.fl.has('swim')) ? 's' : Tm.fl.has('animal') ? 'a' : 'w'; }
function modeOk(mode) { return mode === 's' ? (t => walkable(t) || t === T.DEEP) : mode === 'a' ? passable : walkable; }
function distMap(tx, ty, mode) {
  const key = tx + ',' + ty + ',' + mode;
  if (!G._dm) G._dm = new Map();
  let d = G._dm.get(key);
  if (!d) { d = bfsFrom(L().t, tx, ty, modeOk(mode)); G._dm.set(key, d); }
  return d;
}
function occupied(x, y) { return (G.p.x === x && G.p.y === y) || !!monAt(x, y); }
function monStep(m, tx, ty, away) {
  const lev = L(), mode = moveMode(m), ok = modeOk(mode);
  const dm = distMap(tx, ty, mode);
  const cur = dm[idx(m.x, m.y)];
  let best = null, bv = cur < 0 ? (away ? -1 : 1e9) : cur;
  for (const [dx, dy] of shuffle(N8.slice())) {
    const nx = m.x + dx, ny = m.y + dy; if (!inb(nx, ny)) continue;
    const t = lev.t[idx(nx, ny)]; if (!ok(t) || occupied(nx, ny)) continue;
    const v = dm[idx(nx, ny)]; if (v < 0) continue;
    if (away ? v > bv : v < bv) { bv = v; best = [nx, ny]; }
  }
  if (!best) return false;
  const bt = lev.t[idx(best[0], best[1])];
  if (bt === T.DOORC) { lev.t[idx(best[0], best[1])] = T.DOORO; if (canSee(best[0], best[1])) msg(`${monName(m, 1)} opens a felt door.`, '#a9a3b8'); return true; }
  m.x = best[0]; m.y = best[1];
  return true;
}
function randomStep(m) {
  const lev = L(), ok = modeOk(moveMode(m));
  for (const [dx, dy] of shuffle(N8.slice())) { const nx = m.x + dx, ny = m.y + dy; if (inb(nx, ny) && passable(lev.t[idx(nx, ny)]) && ok(lev.t[idx(nx, ny)]) && !occupied(nx, ny)) { m.x = nx; m.y = ny; return true; } }
  return false;
}

// --- perception ---
function monSeesPlayer(m) {
  if (!canSee(m.x, m.y)) return false;
  if (st('invis') && !T_(m).fl.has('sinv')) return cheb(m, G.p) <= 1 && chance(.5);
  return cheb(m, G.p) <= Math.max(sightRadius(), 7);
}
function noticeCheck(m) {
  if (!canSee(m.x, m.y)) return false;
  const p = 0.16 * 100 / (100 + stealth()) * (cheb(m, G.p) <= 2 ? 2.2 : 1);
  return chance(p);
}
function noise(x, y, r) {
  if (st('silence') && cheb({ x, y }, G.p) <= 6) return;
  for (const m of L().mons) {
    if (m.dead || m.ally) continue;
    if ((m.x - x) ** 2 + (m.y - y) ** 2 > r * r) continue;
    if (m.state === 'sleep' && m.sleepT > 0) continue;
    if (m.state === 'sleep' || m.state === 'wander') { m.state = 'hunt'; m.tx = x; m.ty = y; }
  }
}
function inSanctuary(x, y) { const s = L().sanct; return s && G.turn < s.until && Math.max(Math.abs(s.x - x), Math.abs(s.y - y)) <= 3; }

// --- a monster's turn ---
function monAct(m) {
  const Tm = T_(m), p = G.p, ms = m.st;
  if (ms.para > 0) { ms.para--; return; }
  if (ms.slow > 0) { ms.slow--; m.skip = !m.skip; if (m.skip) return; }
  for (const k of ['conf', 'fear', 'haste', 'berserk', 'invis']) if (ms[k] > 0) ms[k]--;
  if (ms.poison > 0) { ms.poison--; damageMonster(m, rr(1, 2), { src: m.poisonBy || 'env', silent: 1, elem: 'poison' }); if (m.dead) return; }
  if (m.charmT > 0) { m.charmT--; if (!m.charmT && m.ally) { m.ally = false; m.state = 'hunt'; if (canSee(m.x, m.y)) msg(`${monName(m, 1)} is no longer your kin.`, '#e5a55a'); } }
  if (m.ally) { allyAct(m); return; }
  if (m.state === 'sleep') {
    if (m.sleepT > 0) { m.sleepT--; if (m.sleepT > 0) return; m.state = 'wander'; }
    else if (noticeCheck(m)) { m.state = 'hunt'; m.tx = p.x; m.ty = p.y; } else return;
  }
  const sees = monSeesPlayer(m);
  if (sees) { m.tx = p.x; m.ty = p.y; if (m.state !== 'flee') m.state = 'hunt'; m.lost = 0; }
  if (Tm.fl.has('animal') && !Tm.fl.has('unique') && m.hp < m.mhp * .2 && !ms.fearTried) { ms.fearTried = 1; if (chance(.5)) ms.fear = rr(5, 9); }
  if (inSanctuary(m.x, m.y) || inSanctuary(p.x, p.y) && cheb(m, p) <= 4) { monStep(m, p.x, p.y, true); return; }
  if (ms.fear > 0) { if (!monStep(m, p.x, p.y, true) && cheb(m, p) === 1 && chance(.5)) monMelee(m); return; }
  if (m.state === 'flee') m.state = 'hunt';
  if (ms.conf > 0 && chance(.6)) { randomStep(m); return; }
  if (Tm.fl.has('erratic') && chance(.35)) { randomStep(m); return; }
  if (sees && Tm.sp && !(st('silence') && cheb(m, p) <= 6)) for (const [s, pr] of Tm.sp) if (chance(pr) && monCast(m, s)) return;
  if (cheb(m, p) === 1 && (sees || chance(.5))) { monMelee(m); return; }
  const adjAlly = L().mons.find(a => a.ally && !a.dead && cheb(a, m) === 1);
  if (adjAlly && chance(.65)) { monHitMon(m, adjAlly); return; }
  if (m.state === 'hunt' && m.tx !== null) {
    if (m.x === m.tx && m.y === m.ty && !sees) { m.state = 'wander'; m.tx = null; return; }
    if (!monStep(m, m.tx, m.ty)) { m.lost = (m.lost || 0) + 1; if (m.lost > 6) { m.state = 'wander'; m.tx = null; } }
    return;
  }
  // wandering
  if (m.tx === null || (m.x === m.tx && m.y === m.ty) || chance(.02)) { const c = randomFloor(L()); if (c) { m.tx = c.x; m.ty = c.y; } }
  if (m.tx !== null && chance(.7)) monStep(m, m.tx, m.ty);
}

function allyAct(m) {
  const p = G.p;
  if (m.ttl !== undefined) { m.ttl--; if (m.ttl <= 0) { m.dead = true; if (canSee(m.x, m.y)) msg(`${monName(m, 1)} fades away.`, '#a4e4ff'); return; } }
  const foes = L().mons.filter(f => !f.dead && !f.ally && canSee(f.x, f.y) && cheb(f, p) <= 9 && f.state !== 'sleep').sort((a, b) => cheb(a, m) - cheb(b, m));
  const adj = L().mons.find(f => !f.dead && !f.ally && cheb(f, m) === 1);
  const tgt = adj || foes[0];
  if (tgt && !inSanctuary(m.x, m.y)) {
    if (cheb(tgt, m) === 1) { monHitMon(m, tgt); return; }
    if (T_(m).sp) for (const [s, pr] of T_(m).sp) if (chance(pr) && allyCast(m, s, tgt)) return;
    monStep(m, tgt.x, tgt.y); return;
  }
  if (cheb(m, p) > 2) monStep(m, p.x, p.y); else if (chance(.3)) randomStep(m);
}
function allyCast(m, s, tgt) {
  if (['firebreath', 'coldbreath', 'firebolt', 'coldbolt', 'dark', 'arrow'].includes(s) && clearShot(m, tgt)) {
    const elem = s.includes('fire') ? 'fire' : s.includes('cold') ? 'cold' : s === 'dark' ? 'neg' : null;
    zap({ x: m.x, y: m.y, mon: m }, tgt, { range: 7, dmg: roll(3, 4 + Math.floor(T_(m).hd / 2)), elem, col: elem === 'fire' ? '#ff8040' : '#7aa0ff', name: s });
    return true;
  }
  return false;
}

// --- monster spells ---
function hexResistP(hd) { const w = willpower(); return w / (w + hd * 10); }
function monCast(m, s) {
  const Tm = T_(m), p = G.p, d = cheb(m, p), lev = L();
  const ranged = ['arrow', 'knife', 'dark', 'darkbolt', 'darkbolt2', 'firebolt', 'coldbolt', 'coldbolt2', 'firebreath', 'coldbreath'];
  if (ranged.includes(s)) {
    if (d > 7 || d < 1 || !clearShot(m, p)) return false;
    if ((s === 'arrow' || s === 'knife') && d === 1) return false;
    const hd = Tm.hd, src = { x: m.x, y: m.y, mon: m };
    const spec = {
      arrow: { dmg: 1 + rnd(hd + 6), name: 'an arrow', verb: 'shoots', phys: 1, col: '#e8dcc0' },
      knife: { dmg: 1 + rnd(hd + 5), name: 'a throwing knife', verb: 'throws', phys: 1, col: '#d8d8e0' },
      dark: { dmg: roll(2, 4 + Math.floor(hd / 2)), elem: 'neg', name: "a bolt of Morkhan's darkness", verb: 'hurls', col: '#b04ad0' },
      darkbolt: { dmg: roll(3, 6 + Math.floor(hd / 3)), elem: 'neg', name: 'a black bolt', verb: 'hurls', col: '#9030c0' },
      darkbolt2: { dmg: roll(5, 9), elem: 'neg', name: "a bolt of Morkhan's wrath", verb: 'hurls', col: '#ff3348' },
      firebolt: { dmg: roll(2, 4 + Math.floor(hd / 2)), elem: 'fire', name: 'a bolt of fire', verb: 'spits', col: '#ff8040' },
      coldbolt: { dmg: roll(3, 4 + Math.floor(hd / 2)), elem: 'cold', name: 'a blast of black snow', verb: 'howls', col: '#7aa0ff' },
      coldbolt2: { dmg: roll(4, 9), elem: 'cold', name: 'a killing blast of frost', verb: 'howls', col: '#4a68ff' },
      firebreath: { dmg: roll(3, 4 + Math.floor(hd / 2)), elem: 'fire', name: 'a gout of fire', verb: 'breathes', beam: 1, col: '#ff6020' },
      coldbreath: { dmg: roll(3, 4 + Math.floor(hd / 2)), elem: 'cold', name: 'a gout of frost', verb: 'breathes', beam: 1, col: '#9fc0ff' },
    }[s];
    msg(`${monName(m, 1)} ${spec.verb} ${spec.name}.`, '#e5a55a');
    zap(src, p, { range: 8, dmg: spec.dmg, elem: spec.elem, col: spec.col, name: spec.name.replace(/^an? /, ''), beam: spec.beam, toHit: spec.phys ? 14 + hd * 3 : 0 });
    return true;
  }
  switch (s) {
    case 'healo': { const h = lev.mons.find(o => !o.dead && !o.ally && o !== m && o.hp < o.mhp * .6 && cheb(o, m) <= 6); if (!h) return false; h.hp = Math.min(h.mhp, h.hp + roll(3, 8)); msg(`${monName(m, 1)} beats a frame drum, and ${monName(h)} looks healthier.`, '#c862d8'); return true; }
    case 'summonbull': { if (lev.mons.filter(o => o.k === 'bull' && !o.dead && !o.ally).length >= 3) return false; const q = nearFree(lev, m.x, m.y); if (!q) return false; spawnMonster(lev, 'bull', q.x, q.y, { awake: 1 }); msg(`${monName(m, 1)} bellows, and a black bull steps out of the dark.`, '#ff3348'); return true; }
    case 'callmarmots': { const n = rr(1, 3); for (let j = 0; j < n; j++) { const q = nearFree(lev, m.x, m.y, 3); if (q) spawnMonster(lev, 'marmot', q.x, q.y, { awake: 1 }); } msg(`${monName(m, 1)} whistles, and marmots pop out of the ground!`, '#ffd27a'); return true; }
    case 'callwolves': { if (lev.mons.filter(o => o.k === 'wolf' && !o.dead).length > 6) return false; for (let j = 0; j < 2; j++) { const q = nearFree(lev, m.x, m.y, 3); if (q) spawnMonster(lev, 'wolf', q.x, q.y, { awake: 1 }); } msg(`${monName(m, 1)} howls, and grey wolves come running!`, '#ffffff'); return true; }
    case 'slow': case 'curse': { if (st('slow') || d > 7) return false; msg(`${monName(m, 1)} spits a curse at you.`, '#ff86e4'); if (chance(hexResistP(Tm.hd))) msg('You resist.', '#a9a3b8'); else { addSt('slow', rr(5, 9)); msg('Your limbs grow heavy.', '#a9a3b8'); } return true; }
    case 'confuse': { if (st('conf') || d > 7) return false; msg(`${monName(m, 1)} mutters a tangled riddle at you.`, '#ff86e4'); if (chance(hexResistP(Tm.hd))) msg('You resist.', '#a9a3b8'); else { addSt('conf', rr(3, 6)); msg('You feel confused.', '#e58aa8'); } return true; }
    case 'scream': { if (d > 6 || st('para')) return false; msg(`${monName(m, 1)} screams!`, '#e55a5a'); if (chance(hexResistP(Tm.hd) + .2)) msg('You shake off the terror.', '#a9a3b8'); else { addSt('para', 2); msg('Terror freezes you in place!', '#e55a5a'); } return true; }
    case 'blink': { const c = nearFree(lev, m.x, m.y, 5); if (!c) return false; if (canSee(m.x, m.y)) msg(`${monName(m, 1)} blinks.`, '#a4e4ff'); m.x = c.x; m.y = c.y; return true; }
    case 'hasteself': if (m.st.haste) return false; m.st.haste = 12; msg(`${monName(m, 1)} seems to speed up.`, '#d8a640'); return true;
    case 'berserkself': if (m.st.berserk) return false; m.st.berserk = 12; msg(`${monName(m, 1)} goes berserk!`, '#e55a5a'); return true;
    case 'animate': { const rem = lev.items.filter(o => o.it.k === 'remains' && cheb(o, m) <= 6); if (!rem.length) return false; let n = 0; for (const o of rem.slice(0, 3)) { if (occupied(o.x, o.y)) continue; lev.items.splice(lev.items.indexOf(o), 1); raiseRemains(o, false); n++; } if (!n) return false; msg(`${monName(m, 1)} raises the dead!`, '#c862d8'); return true; }
    case 'smite': { if (d > 8) return false; msg("Morkhan's hand strikes you from nowhere!", '#ff3348'); damagePlayer(roll(4, 8), Tm.n, 'neg'); return true; }
    case 'iceblast': { if (d > 7) return false; msg(`${monName(m, 1)} calls down a storm of ice!`, '#7aa0ff'); explodeAt(p.x, p.y, 1, { dmg: roll(3, 8), elem: 'cold', col: '#7aa0ff', src: { mon: m } }); return true; }
  }
  return false;
}
function raiseRemains(o, friendly) {
  const base = MT[o.it.mk] || MT.jackal; const hd = Math.max(1, Math.round(base.hd * 0.8));
  const ov = { n: 'risen ' + base.n, hd, hp: 6 + hd * 5, dmg: 4 + hd * 2, c: '#8aa070', g: hd >= 8 ? 'Z' : 'z' };
  return spawnMonster(L(), 'risen', o.x, o.y, friendly ? { ally: 1, perm: false, o: ov } : { awake: 1, o: ov });
}

// Wandering arrivals over time.
function maybeSpawnWanderer(f) {
  const lev = L(); if (lev.br === 'temple') return;
  const rate = (G.p.orb ? 1 / 45 : 1 / 280) * f;
  if (!chance(rate) || lev.mons.filter(m => !m.dead).length > 34) return;
  const c = randomFloor(lev, 10); if (!c || canSee(c.x, c.y)) return;
  const m = spawnGroup(lev, pickMonsterType(lev, G.p.orb ? 2 : 0), c.x, c.y);
  if (G.p.orb || chance(.3)) { m.state = 'hunt'; m.tx = G.p.x; m.ty = G.p.y; } else m.state = 'wander';
}
