"use strict";
// Spellcasting, bolts and beams, hexes, summons, clouds.

const CLOUDS = {
  fire: { n: 'flames', g: '§', c: '#ff7030', elem: 'fire', dmg: [2, 6] },
  cold: { n: 'freezing rain', g: '§', c: '#8ab0ff', elem: 'cold', dmg: [2, 5] },
  bitter: { n: 'bitter smoke', g: '§', c: '#9ac060', elem: 'poison', dmg: [1, 3], conf: 1 },
  fog: { n: 'juniper smoke', g: '§', c: '#c8d8c8', opaque: 1, holy: 1 },
};
function addCloud(lev, x, y, ty, ttl, owner) {
  if (!inb(x, y) || opaqueT(lev.t[idx(x, y)])) return;
  const ex = lev.clouds.find(c => c.x === x && c.y === y);
  if (ex) { ex.ty = ty; ex.ttl = Math.max(ex.ttl, ttl); ex.owner = owner; return; }
  lev.clouds.push({ x, y, ty, ttl, owner });
}
function cloudAt(x, y) { return L().clouds.find(c => c.x === x && c.y === y); }
function cloudTick(f) {
  const lev = L(), p = G.p;
  for (const c of lev.clouds) {
    c.ttl -= f; const C = CLOUDS[c.ty];
    if (C.dmg) {
      if (p.x === c.x && p.y === c.y) {
        damagePlayer(Math.round(roll(...C.dmg) * f), C.n, C.elem);
        if (C.elem === 'poison' && !res('rp')) addSt('poison', st('poison') + 1);
        if (C.conf && chance(.4 * f)) addSt('conf', 2);
      }
      const m = monAt(c.x, c.y);
      if (m) { damageMonster(m, Math.round(roll(...C.dmg) * f), { src: c.owner === 'p' ? 'p' : 'env', silent: 1, elem: C.elem }); if (C.conf && !m.dead && chance(.5)) m.st.conf = 3; }
    }
    if (C.holy) { const m = monAt(c.x, c.y); if (m && isEvil(m) && chance(.3 * f)) damageMonster(m, rr(1, 3), { src: 'env', silent: 1 }); }
  }
  lev.clouds = lev.clouds.filter(c => c.ttl > 0);
}

// --- visual flash ---
let fx = [];
function flash(cells, col) {
  if (!cells || !cells.length || G.noAnim) return;
  fx = cells.map(c => ({ x: c.x, y: c.y, col }));
  render(); setTimeout(() => { fx = []; render(); }, 90);
}

// --- bolts, beams and balls ---
// src: {x,y, player?, mon?}; tgt: {x,y}. opts: range, dmg, elem, col, name, beam, explode, radius, toHit, hexOnly, dart, poison, onHitMon
function zap(src, tgt, o) {
  const cells = rayCells(src, tgt, o.range || 8, !!o.stopAtTarget);
  const path = []; let end = null;
  for (const c of cells) {
    path.push(c); end = c;
    const isP = G.p.x === c.x && G.p.y === c.y && !src.player;
    const m = monAt(c.x, c.y);
    if (!isP && !m) continue;
    if (o.hexOnly) break;
    if (isP) {
      if (o.toHit && !chance(hitChance(o.toHit, EV()))) { msg(`The ${o.name} misses you.`, '#8a8499'); continue; }
      if (prop('refl') && chance(.4) && src.mon) { msg(`You reflect the ${o.name}!`, '#a4e4ff'); zap({ x: c.x, y: c.y, player: 1 }, src.mon, Object.assign({}, o, { range: 8 })); return end; }
      if (!o.explode) { msg(`The ${o.name} hits you.`, '#e57a7a'); damagePlayer(o.dmg, src.mon ? monName(src.mon, false, true) : o.name, o.elem); }
    } else if (m) {
      if (src.mon && src.mon === m) continue;
      if (o.toHit && !chance(hitChance(o.toHit, monEV(m)))) { if (canSee(c.x, c.y)) msg(`The ${o.name} misses ${monName(m)}.`, '#8a8499'); continue; }
      if (!o.explode) {
        if (canSee(c.x, c.y)) msg(`The ${o.name} hits ${monName(m)}.`, '#e8e2d3');
        const dmg = o.dmgFn ? o.dmgFn() : o.dmg;
        damageMonster(m, dmg, { src: src.player ? 'p' : (src.mon && src.mon.ally ? 'ally' : 'mon'), silent: 1, elem: o.elem });
        if (o.poison && !m.dead && monResMult(m, 'poison') > 0) { m.st.poison = (m.st.poison || 0) + rr(2, 4) * o.poison; m.poisonBy = src.player ? 'p' : 'env'; }
        if (o.heal && src.player && isLiving(m)) G.p.hp = Math.min(maxHP(), G.p.hp + Math.floor(dmg * o.heal));
      }
    }
    if (!o.beam) break;
  }
  flash(path, o.col);
  if (o.explode && end) explodeAt(end.x, end.y, o.radius || 1, { dmg: o.dmg, dmgFn: o.dmgFn, elem: o.elem, col: o.col, src });
  return end;
}
function explodeAt(x, y, r, o) {
  const cells = [];
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const cx = x + dx, cy = y + dy; if (!inb(cx, cy) || opaqueT(L().t[idx(cx, cy)])) continue;
    cells.push({ x: cx, y: cy });
  }
  flash(cells, o.col);
  for (const c of cells) {
    const dmg = o.dmgFn ? o.dmgFn() : o.dmg;
    if (G.p.x === c.x && G.p.y === c.y) damagePlayer(dmg, o.src && o.src.mon ? monName(o.src.mon, false, true) : 'an explosion', o.elem);
    const m = monAt(c.x, c.y);
    if (m) damageMonster(m, dmg, { src: o.src && o.src.player ? 'p' : 'mon', elem: o.elem, silent: !canSee(c.x, c.y) });
    if (o.cloud) addCloud(L(), c.x, c.y, o.cloud, rr(3, 6), o.src && o.src.player ? 'p' : 'm');
  }
}
function digBeam(from, to, range) {
  const lev = L(); let n = 0;
  const far = { x: from.x + (to.x - from.x) * 20, y: from.y + (to.y - from.y) * 20 };
  const cells = [];
  for (const c of line(from.x, from.y, far.x, far.y, 200)) {
    if (!inb(c.x, c.y) || c.x <= 0 || c.y <= 0 || c.x >= W - 1 || c.y >= H - 1 || cheb(c, from) > range) break;
    const i = idx(c.x, c.y); cells.push(c);
    if (diggable(lev.t[i])) { lev.t[i] = T.FLOOR; n++; }
  }
  flash(cells, '#c8b898');
  msg(n ? 'The ground opens like a marmot burrow.' : 'Nothing here to dig.', '#c8b898');
  updateFOV();
}
function doBlink(x, y) {
  const p = G.p;
  if (!inb(x, y) || !canSee(x, y) || !passable(L().t[idx(x, y)]) || monAt(x, y)) {
    const c = nearFree(L(), p.x, p.y, 4); if (c) { x = c.x; y = c.y; } else return msg('The wind finds nowhere to take you.');
  }
  p.x = x; p.y = y; msg('The wind lifts you and sets you down.', '#a4e4ff'); afterMove();
}
function teleportPlayer() {
  const c = randomFloor(L(), 8); if (!c) return;
  G.p.x = c.x; G.p.y = c.y; msg('The wind takes you up and sets you down somewhere else.', '#a4e4ff'); afterMove(); updateFOV();
}

// --- hexes ---
function hexCheck(m, pow, kind) {
  const Tm = T_(m);
  if (['sleep', 'fear', 'charm', 'conf'].includes(kind) && (Tm.fl.has('mindless') || Tm.fl.has('undead'))) return false;
  if (kind === 'charm' && Tm.fl.has('unique')) return false;
  if (kind === 'agony' && !isLiving(m)) return false;
  return chance(pow * 1.2 / (pow * 1.2 + Tm.will));
}
function applyHex(m, kind, pow) {
  const n = monName(m, 1);
  if (!hexCheck(m, pow, kind)) { msg(`${n} resists.`, '#a9a3b8'); m.state = 'hunt'; m.tx = G.p.x; m.ty = G.p.y; return false; }
  switch (kind) {
    case 'conf': m.st.conf = 3 + Math.floor(pow / 10); msg(`${n} looks bewildered.`, '#e58aa8'); break;
    case 'slow': m.st.slow = 6 + Math.floor(pow / 8); msg(`${n} seems to slow down.`, '#a9a3b8'); break;
    case 'para': m.st.para = 3 + Math.floor(pow / 25); msg(`${n} is bound by the yellow hair!`, '#e55a5a'); break;
    case 'sleep': m.state = 'sleep'; m.sleepT = 8 + Math.floor(pow / 8); msg(`${n} falls asleep.`, '#b8a0f0'); break;
    case 'fear': m.st.fear = 8 + Math.floor(pow / 10); msg(`${n} turns to flee.`, '#d07a7a'); break;
    case 'charm': m.ally = true; m.charmT = 20 + Math.floor(pow / 3); m.state = 'hunt'; msg(`${n} is now your kin.`, '#f5efe0'); break;
    case 'tele': { const c = randomFloor(L(), 10); if (c) { m.x = c.x; m.y = c.y; } msg(`${n} is carried off by the wind.`, '#a4e4ff'); break; }
    case 'agony': damageMonster(m, Math.floor(m.hp / 2), { src: 'p', silent: 1 }); msg(`${n} convulses in agony.`, '#b04ad0'); break;
  }
  return true;
}

// --- the player's spells ---
function spellSkillAvg(id) { const S = SPELLS[id]; return S.sch.reduce((a, s) => a + skf(s), 0) / S.sch.length; }
function spellFail(id) {
  const S = SPELLS[id];
  // Same inputs as Crawl's raw_spell_fail (school skill x12, spellcasting x3, Int x2,
  // armour penalty, difficulty by level), squashed by a curve tuned to this game's stat scale.
  let raw = 60 - spellSkillAvg(id) * 12 - skf('spellcasting') * 3 - stat('int') * 2;
  raw += Math.max(0, bodyER() - skf('armour') * 0.5) * 4 + Math.max(0, shieldER() - skf('shields') * 0.3) * 5;
  raw += SPELL_DIFFICULTY[S.lvl];
  if (prop('wiz')) raw -= 12;
  return clamp(Math.round(100 / (1 + Math.exp(-(raw - 38) / 8.6))), 0, 99);
}
function spellPower(id) {
  const S = SPELLS[id];
  let pw = (spellSkillAvg(id) * 2 + skf('spellcasting') * 0.5) * stat('int') / 10 * 2.5 + 2;
  const w = equipped('weapon'); if (w && w.staff && S.sch.includes(STAVES[w.staff].school)) pw *= 1.5;
  if (prop('wiz')) pw *= 1.2;
  if (st('brill')) pw *= 1.25;
  return Math.round(Math.min(S.cap, pw));
}
function spellLevelsMax() { return Math.max(1, Math.floor(1 + G.p.xl * 0.5 + skf('spellcasting') * 0.8)); }
function spellLevelsUsed() { return G.p.spells.reduce((a, s) => a + SPELLS[s].lvl, 0); }
function memorise(id) {
  const p = G.p, S = SPELLS[id];
  if (p.spells.includes(id)) return failMsg('You already know that spell.');
  if (p.spells.length >= 21) return failMsg('Your mind cannot hold any more spells.');
  if (spellLevelsUsed() + S.lvl > spellLevelsMax()) return failMsg(`You need ${S.lvl} free spell levels; you have ${spellLevelsMax() - spellLevelsUsed()}.`);
  p.spells.push(id); msg(`You memorise ${S.n}.`, '#c0a0e0');
  endTurn(10 * (2 + S.lvl));
}

function castSpell(id) {
  const S = SPELLS[id], p = G.p;
  if (st('berserk')) return failMsg("You're too berserk to cast spells.");
  if (st('silence')) return failMsg('You cannot cast spells in this silence.');
  if (p.mp < S.lvl) return failMsg("You don't have enough magic to cast that.");
  if (S.sch.includes('necro') && p.god === 'janyl') { /* allowed, but she will punish it */ }
  const go = (x, y) => {
    p.mp -= S.lvl;
    S.sch.forEach(exercise); exercise('spellcasting');
    if (chance(spellFail(id) / 100)) { msg('You miscast the spell. It fizzles.', '#8a8499'); return endTurn(10); }
    if (S.sch.includes('necro') && p.god === 'janyl') janylConduct('St. Janyl is grieved by your necromancy.', 8);
    noise(p.x, p.y, S.lvl * 2 + 2);
    resolveSpell(id, x, y, spellPower(id));
    endTurn(10);
  };
  const t = S.type;
  if (t === 'self' || t === 'summon' || t === 'raise' || (t === 'area' && S.range <= 8 && !S.smite)) return go(p.x, p.y);
  const kind = t === 'beam' || t === 'dig' ? 'beam' : t === 'ball' ? (S.smite ? 'smite' : 'ball') : t === 'blink' ? 'blink' : t === 'smite' || t === 'cloud' ? 'smite' : 'bolt';
  startTargeting({ kind, range: S.range || 7, prompt: `Cast ${S.n} (${spellFail(id)}% fail).`, radius: S.radius || (t === 'ball' ? 1 : 0), cb: go });
}
function resolveSpell(id, x, y, pw) {
  const S = SPELLS[id], p = G.p, lev = L();
  const dmgFn = S.dmg ? () => roll(...S.dmg(pw)) : null;
  const me = { x: p.x, y: p.y, player: 1 };
  switch (S.type) {
    case 'dart': case 'bolt': zap(me, { x, y }, { range: S.range, dmgFn, elem: S.elem, col: S.col, name: S.n, poison: S.poison, toHit: S.type === 'bolt' ? 20 + pw / 2 : 0 }); break;
    case 'beam': zap(me, { x, y }, { range: S.range, dmgFn, elem: S.elem, col: S.col, name: S.n, beam: 1 }); break;
    case 'ball':
      if (S.smite) { if (!canSee(x, y)) return msg('You cannot see that place.'); explodeAt(x, y, S.radius || 1, { dmgFn, elem: S.elem, col: S.col, src: me, cloud: S.elem === 'fire' ? 'fire' : null }); }
      else zap(me, { x, y }, { range: S.range, dmgFn, elem: S.elem, col: S.col, name: S.n, explode: 1, radius: 1 });
      break;
    case 'smite': { const m = monAt(x, y); if (!m || !canSee(x, y)) { msg('There is nothing there.'); break; } flash([m], S.col); msg(`${S.n} strikes ${monName(m)}.`, S.col); damageMonster(m, dmgFn(), { src: 'p', elem: S.elem, silent: 1 }); break; }
    case 'touch': { const m = monAt(x, y); if (!m || cheb(m, p) > 1) { msg('There is nothing there to touch.'); break; } flash([m], S.col); const d = dmgFn(); msg(`You touch ${monName(m)}.`, S.col); damageMonster(m, d, { src: 'p', elem: S.elem, silent: 1 }); if (S.heal && isLiving(m)) p.hp = Math.min(maxHP(), p.hp + Math.floor(d * S.heal)); break; }
    case 'hex': { const end = zap(me, { x, y }, { range: S.range, col: S.col, name: S.n, hexOnly: 1 }); const m = end && monAt(end.x, end.y); if (!m) { msg('The spell finds no one.'); break; } applyHex(m, S.hex, pw); break; }
    case 'area': {
      const vs = visibleHostiles().filter(m => cheb(m, p) <= S.range);
      flash(vs, S.col);
      if (S.hex) { let n = 0; for (const m of vs) if (hexCheck(m, pw, S.hex)) { applyHex(m, S.hex, pw * 10); n++; } if (!n) msg('No one is affected.', '#a9a3b8'); }
      else { if (!vs.length) msg('The spell finds no one.'); for (const m of vs) { damageMonster(m, dmgFn(), { src: 'p', elem: S.elem }); if (S.poison && !m.dead && monResMult(m, 'poison') > 0) { m.st.poison = (m.st.poison || 0) + rr(2, 4) * S.poison; m.poisonBy = 'p'; } } }
      break;
    }
    case 'cloud': for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) addCloud(lev, x + dx, y + dy, S.cloud, 6 + Math.floor(pw / 20), 'p'); msg('Bitter smoke rolls out.', '#9ac060'); break;
    case 'blink': doBlink(x, y); break;
    case 'dig': digBeam(p, { x, y }, S.range + Math.floor(pw / 20)); break;
    case 'summon': {
      const n = S.count(pw); let k = 0;
      for (let j = 0; j < n; j++) { const q = nearFree(lev, p.x, p.y, 2); if (q) { spawnMonster(lev, S.mon, q.x, q.y, { ally: 1, ttl: S.ttl(pw) }); k++; } }
      msg(k ? `${S.n}: ${k} ${MT[S.mon].n}${k > 1 ? 's' : ''} come${k > 1 ? '' : 's'} to your side.` : 'Nothing answers.', '#a4e4ff');
      break;
    }
    case 'raise': {
      const rem = lev.items.filter(o => o.it.k === 'remains' && canSee(o.x, o.y) && cheb(o, p) <= 6);
      let n = 0; for (const o of rem.slice(0, 2 + Math.floor(pw / 40))) { if (occupied(o.x, o.y)) continue; lev.items.splice(lev.items.indexOf(o), 1); raiseRemains(o, true); n++; }
      msg(n ? `${n} of the fallen rise${n > 1 ? '' : 's'} to serve you.` : 'There are no remains here to raise.', '#b04ad0');
      break;
    }
    case 'self':
      if (id === 'swift') { addSt('swift', 15 + Math.floor(pw / 5)); msg('You feel the gallop of the tulpar in your legs.', '#d8c060'); }
      if (id === 'hoarfrost') { addSt('hoarfrost', 20 + Math.floor(pw / 3)); p.hoarAC = 4 + Math.floor(pw / 25); msg('Ice spreads over your clothes.', '#a8c8ff'); }
      if (id === 'teleself') { addSt('teleport', rr(2, 4)); msg('The wind begins to gather around you.', '#a4e4ff'); }
      break;
  }
}
