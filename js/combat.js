"use strict";
// Combat: melee, missiles, damage, resistances and death.

const hitChance = (acc, ev) => acc / (acc + ev * 2);

function weaponSkill(it) { return it ? WEAPONS[it.t].sk : 'unarmed'; }
function weaponDelay(it, shooting) {
  let base, s;
  if (!it || (WEAPONS[it.t].shoot && !shooting)) { base = 10; s = skf('unarmed'); if (it) { base = WEAPONS[it.t].delay; s = 0; } }
  else { base = WEAPONS[it.t].delay; s = skf(WEAPONS[it.t].sk); }
  let d = Math.max(Math.max(5, Math.ceil(base / 2)), base - s * 0.5);
  if (it && it.brand === 'speed') d *= 2 / 3;
  return Math.max(3, d);
}
function strMult() { return Math.max(0.5, 1 + (stat('str') - 10) * 0.03); }

function monEV(m) { const Tm = T_(m); if (m.state === 'sleep' || m.st.para) return 0; return Math.max(0, Tm.ev - (m.st.conf ? 3 : 0)); }
function monAC(m) { return T_(m).ac; }
function resMult(r) { return r >= 3 ? 0 : r === 2 ? 1 / 3 : r === 1 ? 0.5 : r < 0 ? 1.5 : 1; }
function monResMult(m, elem) {
  if (!elem) return 1;
  const Tm = T_(m), r = Tm.res;
  if (elem === 'fire') return resMult(r.f || 0);
  if (elem === 'cold') return resMult(r.c || 0);
  if (elem === 'elec') return (r.e || 0) >= 1 ? 1 / 3 : 1;
  if (elem === 'poison') return (r.p || 0) >= 3 ? 0 : (r.p || 0) >= 1 ? 1 / 3 : 1;
  if (elem === 'neg') return (r.n || 0) >= 3 || Tm.fl.has('undead') ? 0 : (r.n || 0) >= 1 ? 0.5 : 1;
  if (elem === 'holy') return isEvil(m) ? 1 : 0;
  return 1;
}

// --- the player hits something ---
function playerAttack(m) {
  const p = G.p, Tm = T_(m), w = equipped('weapon');
  const melee = w && !WEAPONS[w.t].shoot ? w : null;
  const wsk = melee ? WEAPONS[melee.t].sk : 'unarmed';
  if (p.god === 'umay' && (m.state === 'sleep' || m.st.fear) && !isEvil(m)) { if (chance(.3)) { p.piety = Math.max(0, p.piety - 1); msg('Umay frowns at your cruelty.', '#f0c0d8'); } }
  const wasAsleep = m.state === 'sleep';
  m.state = 'hunt'; m.tx = p.x; m.ty = p.y; m.sleepT = 0;
  exercise('fighting'); exercise(wsk);
  noise(p.x, p.y, 6);
  let acc = 15 + stat('dex') * 0.5 + skf('fighting') + skf(wsk) * 1.3 + prop('slay') + (st('hero') ? 6 : 0);
  if (melee) acc += WEAPONS[melee.t].acc + melee.ench; else acc += 3;
  if (!monVisible(m)) acc *= 0.5;
  const delay = weaponDelay(w && !WEAPONS[w.t].shoot ? w : (w ? w : null));
  if (!chance(hitChance(acc, monEV(m)))) { msg(`You miss ${monName(m)}.`, '#a9a3b8'); return endTurn(delay); }
  let base = melee ? WEAPONS[melee.t].dmg : (w ? WEAPONS[w.t].dmg : 3 + (SPc().claws || 0) + mut('claws') * 2 + Math.floor(skf('unarmed') * 0.5));
  let dmg = rnd(base + 1) * strMult() * (1 + skf(wsk) * 0.04) * (1 + skf('fighting') * 0.015);
  if (melee) dmg += melee.ench > 0 ? rnd(melee.ench + 1) : melee.ench;
  dmg += rnd(prop('slay') + 1);
  if (st('might')) dmg += rr(1, 6);
  if (st('berserk')) dmg *= 1.4;
  if (wasAsleep && skf('stealth') > 0 && wsk === 'short') { dmg *= 1.5 + skf('stealth') * 0.05; }
  dmg = Math.max(0, Math.round(dmg) - rnd(monAC(m) + 1));
  let extra = 0, extraMsg = '';
  const brand = melee && melee.brand;
  if (brand && dmg > 0) {
    if (brand === 'flame') { extra = Math.round(rnd(Math.floor(dmg / 2) + 2) * monResMult(m, 'fire')); if (extra) extraMsg = ' and burns it'; }
    if (brand === 'frost') { extra = Math.round(rnd(Math.floor(dmg / 2) + 2) * monResMult(m, 'cold')); if (extra) extraMsg = ' and freezes it'; }
    if (brand === 'elec' && chance(1 / 3)) { extra = Math.round((8 + rnd(13)) * monResMult(m, 'elec')); if (extra) extraMsg = ', and lightning crackles'; }
    if (brand === 'holy' && isEvil(m)) { extra = Math.round(dmg * 0.75); extraMsg = ' and the white light sears it'; }
    if (brand === 'venom' && monResMult(m, 'poison') > 0 && chance(.6)) { m.st.poison = (m.st.poison || 0) + rr(2, 4); m.poisonBy = 'p'; extraMsg = ' and poisons it'; }
    if (brand === 'drain' && isLiving(m)) { extra = rr(2, 4) + Math.floor(dmg / 3); extraMsg = ' and drains it'; }
    if (brand === 'vamp' && isLiving(m)) { const h = Math.max(1, Math.floor(dmg / 3)); p.hp = Math.min(maxHP(), p.hp + h); extraMsg = ' and you drink its life'; }
  }
  const total = dmg + extra;
  const verb = melee ? (total >= 25 ? 'smash' : total >= 14 ? 'slash' : total > 0 ? 'hit' : 'barely touch') : (SPc().claws || mut('claws') ? (total >= 14 ? 'maul' : 'claw') : (total >= 14 ? 'pummel' : 'punch'));
  msg(`You ${verb} ${monName(m)}${extraMsg}${total >= 20 ? '!' : '.'}`, '#e8e2d3');
  damageMonster(m, total, { src: 'p', silent: 1 });
  if (!m.dead && w && w.art && UNR(w.art).props.fear && chance(.2) && !T_(m).fl.has('mindless')) { m.st.fear = rr(6, 10); msg(`${monName(m, 1)} flinches from the crack of the kamchy!`, '#d8a640'); }
  if (!m.dead && mut('horns') && chance(.33)) { const hd = Math.max(0, roll(1, mut('horns') * 3 + 2) - rnd(monAC(m) + 1)); msg(`You headbutt ${monName(m)}.`); damageMonster(m, hd, { src: 'p', silent: 1 }); }
  if (p.god === 'janyl' && (brand === 'drain' || brand === 'vamp')) janylConduct(null, 1);
  endTurn(delay);
}

// --- shooting and throwing ---
function launcherFor(it) { const w = equipped('weapon'); return w && WEAPONS[w.t].shoot && MISSILES[it.t].launcher === WEAPONS[w.t].sk ? w : null; }
function quiverItem() {
  const p = G.p;
  const ok = it => it && it.k === 'missile' && (launcherFor(it) || MISSILES[it.t].throwDmg);
  if (p.quiver !== null && ok(p.inv[p.quiver])) return p.quiver;
  const w = equipped('weapon');
  let i = p.inv.findIndex(it => it && it.k === 'missile' && launcherFor(it));
  if (i < 0 && !(w && WEAPONS[w.t].shoot)) i = p.inv.findIndex(it => it && it.k === 'missile' && MISSILES[it.t].throwDmg);
  if (i >= 0) p.quiver = i;
  return i >= 0 ? i : null;
}
function fireMissile(qi, tx, ty) {
  const p = G.p, it = p.inv[qi]; if (!it) return;
  const M = MISSILES[it.t], lw = launcherFor(it);
  const skill = lw ? WEAPONS[lw.t].sk : 'throwing';
  exercise(skill);
  const one = Object.assign({}, it, { qty: 1 }); consume(qi);
  noise(p.x, p.y, lw ? 3 : 2);
  let acc = 15 + stat('dex') * 0.6 + skf(skill) * 1.5 + prop('slay') + (M.acc || 0) + (lw ? (WEAPONS[lw.t].sacc || 0) + lw.ench : 0);
  let base = lw ? WEAPONS[lw.t].shoot + (M.dmg || 0) : M.throwDmg;
  const path = rayCells(p, { x: tx, y: ty }, 9, false);
  const cells = []; let landed = null;
  for (const c of path) {
    cells.push(c); landed = c;
    const m = monAt(c.x, c.y);
    if (!m) continue;
    if (!chance(hitChance(acc, monEV(m)))) { if (canSee(c.x, c.y)) msg(`The ${M.n} misses ${monName(m)}.`, '#a9a3b8'); continue; }
    let dmg = rnd(base + 1) * (1 + skf(skill) * 0.045) + (lw && lw.ench > 0 ? rnd(lw.ench + 1) : 0) + rnd(prop('slay') + 1);
    if (!lw) dmg *= Math.max(0.6, 1 + (stat('str') - 10) * 0.02);
    if (lw && (p.sp === 'at' || p.bg === 'berkut')) dmg += 2;
    dmg = Math.max(0, Math.round(dmg) - rnd(monAC(m) + 1));
    let ex = '';
    if (lw && lw.brand === 'flame') { dmg += Math.round(rnd(dmg / 2 + 2) * monResMult(m, 'fire')); ex = ' and it burns'; }
    if (lw && lw.brand === 'frost') { dmg += Math.round(rnd(dmg / 2 + 2) * monResMult(m, 'cold')); ex = ' and it freezes'; }
    if (M.poison && monResMult(m, 'poison') > 0 && chance(.75)) { m.st.poison = (m.st.poison || 0) + rr(3, 6); m.poisonBy = 'p'; ex = ' and poisons it'; }
    msg(`The ${M.n} hits ${monName(m)}${ex}.`);
    m.state = 'hunt'; m.tx = p.x; m.ty = p.y;
    damageMonster(m, dmg, { src: 'p', silent: 1 });
    break;
  }
  flash(cells, '#e8dcc0');
  if (landed && chance(it.t === 'javelin' ? .9 : .55)) L().items.push({ x: landed.x, y: landed.y, it: one });
  const lwDelay = lw ? weaponDelay(lw, true) : Math.max(6, 10 - skf('throwing') * 0.3);
  endTurn(lwDelay);
}

// --- monsters hitting things ---
function monMelee(m) {
  const Tm = T_(m), p = G.p;
  for (const [dmgMax, verb, eff, val] of Tm.atk) {
    if (G.over) return;
    if (inSanctuary(p.x, p.y)) return;
    const acc = 14 + Tm.hd * 3 + (m.st.berserk ? 5 : 0);
    let ev = EV(); if (!monVisible(m)) ev += 0;
    if (!chance(hitChance(acc, ev))) { exercise('dodging'); msg(`${monName(m, 1)} misses you.`, '#8a8499'); continue; }
    const sh = SH();
    if (sh && chance(Math.min(.6, sh / (sh + 20)))) { exercise('shields'); msg(`You block ${monName(m)}'s attack.`, '#a9a3b8'); continue; }
    let dmg = 1 + rnd(dmgMax); if (m.st.berserk) dmg = Math.round(dmg * 1.4);
    dmg = Math.max(0, dmg - rnd(AC() + 1));
    exercise('armour');
    msg(`${monName(m, 1)} ${verb} you${dmg ? '' : ' but does no damage'}${dmg >= maxHP() * 0.25 ? '!' : '.'}`, '#e57a7a');
    if (eff === 'poison' && dmg > 0 && !res('rp')) { addSt('poison', st('poison') + rr(1, val)); msg('You are poisoned.', '#86b84e'); }
    if (eff === 'para' && chance(val) && !st('para') && !chance(hexResistP(Tm.hd))) { addSt('para', rr(2, 3)); msg(`${monName(m, 1)}'s touch stops your breath! You cannot move.`, '#e55a5a'); }
    if (eff === 'conf' && chance(.3) && !st('conf')) { addSt('conf', rr(2, 4)); msg('The dust gets in your eyes. You are confused.', '#e58aa8'); }
    if (eff === 'drain' && !res('rn')) { dmg += rnd(Math.floor(Tm.hd / 2) + 1); if (p.mp > 0) p.mp = Math.max(0, p.mp - rr(1, 3)); msg('You feel drained.', '#7091e0'); }
    if (eff === 'cold') dmg += Math.round(rnd(Math.floor(dmgMax / 2) + 1) * resMult(res('rc')));
    if (eff === 'fire') dmg += Math.round(rnd(Math.floor(dmgMax / 2) + 1) * resMult(res('rf')));
    if (eff === 'vamp' && dmg > 0) m.hp = Math.min(m.mhp, m.hp + dmg);
    if (st('hoarfrost') && dmg > 0) damageMonster(m, Math.round(roll(1, 6) * monResMult(m, 'cold')), { src: 'p', silent: 1 });
    damagePlayer(dmg, monName(m, false, true));
    if (m.dead) return;
  }
}
function monHitMon(a, b) {
  const TA = T_(a), TB = T_(b);
  if (inSanctuary(a.x, a.y)) return;
  const [dmgMax, verb] = TA.atk[0];
  const seen = canSee(b.x, b.y);
  if (!chance(hitChance(14 + TA.hd * 3, monEV(b)))) { if (seen) msg(`${monName(a, 1)} misses ${monName(b)}.`, '#8a8499'); return; }
  const dmg = Math.max(0, 1 + rnd(dmgMax) - rnd(TB.ac + 1));
  if (seen) msg(`${monName(a, 1)} ${verb} ${monName(b)}.`, '#a9a3b8');
  b.state = 'hunt';
  damageMonster(b, dmg, { src: a.ally ? 'ally' : 'mon', silent: 1 });
}

// --- damage ---
function damageMonster(m, dmg, o = {}) {
  if (m.dead) return;
  dmg = Math.round(dmg * monResMult(m, o.elem));
  if (dmg <= 0) { if (!o.silent && canSee(m.x, m.y) && o.elem) msg(`${monName(m, 1)} is unaffected.`, '#8a8499'); return; }
  m.hp -= dmg;
  if (m.state === 'sleep') { m.state = 'hunt'; m.sleepT = 0; }
  if (o.src === 'p' && !m.ally) { m.tx = G.p.x; m.ty = G.p.y; m.state = m.st.fear ? 'flee' : 'hunt'; }
  if (m.hp <= 0) killMonster(m, o.src);
}
function killMonster(m, src) {
  if (m.dead) return;
  m.dead = true;
  const Tm = T_(m), lev = L(), byPlayer = src === 'p' || src === 'ally';
  const seen = canSee(m.x, m.y);
  if (m.ally) { if (seen) msg(`${monName(m, 1)} ${m.summoned ? 'is gone' : 'dies'}!`, '#e5a55a'); return; }
  if (seen) {
    const undead = Tm.fl.has('undead') || Tm.fl.has('nocorpse');
    msg(src === 'p' ? `You ${undead ? 'destroy' : 'kill'} ${monName(m)}!` : `${monName(m, 1)} ${undead ? 'is destroyed' : 'dies'}!`, Tm.fl.has('unique') ? '#ff86e4' : '#f0c870');
  }
  if (Tm.fl.has('unique')) G.uniques[m.k] = 'dead';
  if (!m.summoned) {
    if (byPlayer) { gainXP(Tm.xp); G.kills++; G.killList[Tm.n] = (G.killList[Tm.n] || 0) + 1; onKillPiety(m); }
    if (!Tm.fl.has('nocorpse') && chance(.7)) lev.items.push({ x: m.x, y: m.y, it: { k: 'remains', t: 'remains', qty: 1, of: (Tm.fl.has('unique') ? Tm.n : art(Tm.n)), mk: m.k, c: Tm.c, rot: G.turn + 200 } });
    const nd = Tm.drops || (chance(.06) ? 1 : 0);
    for (let k = 0; k < nd; k++) lev.items.push({ x: m.x, y: m.y, it: randomItem(lev.absd + (Tm.fl.has('unique') ? 4 : 1), Tm.fl.has('unique')) });
    if (['soodager', 'archer', 'captain', 'bakshy', 'karabakshy', 'cultist', 'bakai', 'kyzylkoz'].includes(m.k)) lev.items.push({ x: m.x, y: m.y, it: newItem('gold', 'gold', { qty: rr(8, 20 + lev.absd * 6) }) });
    if (m.k === 'archer' && chance(.6)) lev.items.push({ x: m.x, y: m.y, it: newItem('missile', 'ok', { qty: rr(4, 10) }) });
  }
  if (m.k === 'herald') msg("The Herald falls, and Morkhan's voice goes out of it like wind from a felt door.", '#ff3348');
}
function damagePlayer(dmg, cause, elem) {
  const p = G.p; if (G.over) return;
  if (elem === 'fire') dmg *= resMult(res('rf'));
  else if (elem === 'cold') dmg *= resMult(res('rc'));
  else if (elem === 'elec') dmg *= res('re') >= 1 ? 1 / 3 : 1;
  else if (elem === 'poison') dmg *= res('rp') >= 1 ? 1 / 3 : 1;
  else if (elem === 'neg') dmg *= Math.max(0, 1 - res('rn') / 3);
  dmg = Math.round(dmg);
  if (dmg <= 0) return;
  if (prop('guard') && p.mp > 0) { const take = Math.min(p.mp, Math.floor(dmg / 2)); p.mp -= take; dmg -= take; }
  p.hp -= dmg; G.lastCause = cause;
  stopRun();
  if (p.hp <= 0) {
    const a = equipped('amulet');
    if (a && a.t === 'janyl') { p.inv[p.inv.indexOf(a)] = null; p.hp = maxHP(); identify(a); msg('Your tumar of Janyl flares white and crumbles to dust. You live!', '#ffffff'); return; }
    if (p.god === 'umay' && stars() >= 5) { p.piety = 0; p.hp = maxHP(); msg('Umay gathers you up like a child from the cradle. You live, but her favour is spent.', '#f0c0d8'); return; }
    die(cause);
  } else if (dmg >= maxHP() * 0.3) msg('Ouch! That really hurt!', '#e55a5a');
}
function goBerserk() {
  addSt('berserk', rr(12, 18)); G.p.hp = Math.min(maxHP(), Math.round(G.p.hp * 1.5));
  msg('A red rage takes you. You go berserk!', '#e55a5a');
}
