"use strict";
// Patrons: joining, piety, conduct, abilities, gifts and wrath.

function stars() {
  const p = G.p; if (!p.god) return 0; if (p.god === 'kydyr') return 6;
  let s = 0; for (let i = 1; i < PIETY_STARS.length; i++) if (p.piety >= PIETY_STARS[i]) s = i; return s;
}
function gainPiety(n) {
  const p = G.p; if (!p.god || p.god === 'kydyr') return;
  if (prop('faith')) n *= 1.5;
  const before = stars();
  p.pietyAcc = (p.pietyAcc || 0) + n;
  while (p.pietyAcc >= 1) { p.pietyAcc--; p.piety = Math.min(200, p.piety + 1); }
  const after = stars();
  if (after > before) {
    const G_ = GODS[p.god];
    msg(`You feel ${G_.n}'s favour grow. (${'*'.repeat(after)})`, G_.c);
    for (const a of G_.abil) if (a.star > before && a.star <= after) msg(`You can now use ${a.n}. (press a)`, G_.c);
  }
}
function losePiety(n) {
  const p = G.p; if (!p.god || p.god === 'kydyr') return;
  p.piety = Math.max(0, p.piety - n);
  if (p.piety <= 0 && p.god === 'janyl') excommunicate();
}
function onKillPiety(m) {
  const p = G.p; if (!p.god) return; const hd = T_(m).hd;
  switch (p.god) {
    case 'janyl': if (isEvil(m)) gainPiety(1 + hd * 0.6); else if (chance(.12)) gainPiety(1); break;
    case 'kambar': gainPiety(0.6 + hd * 0.35); maybeGift(); break;
    case 'umay': if (isEvil(m)) gainPiety(0.6 + hd * 0.3); break;
    case 'tengri': gainPiety(0.6 + hd * 0.35); break;
    case 'morkhan':
      gainPiety(0.8 + hd * 0.4);
      if (stars() >= 1 && chance(.35) && p.hp < maxHP()) { p.hp = Math.min(maxHP(), p.hp + rr(1, hd + 3) + Math.floor(skf('invo'))); msg('You feel a surge of black vigour.', '#ff4050'); }
      break;
  }
}
function umayExplore(n) { gainPiety(n / 70); }
function janylConduct(text, n) {
  if (G.p.god !== 'janyl') return;
  if (text) msg(text, '#ffffff');
  losePiety(n);
}
function excommunicate() {
  const p = G.p, g = p.god;
  msg(`${GODS[g].n} casts you out!`, '#e55a5a');
  p.penance[g] = rr(80, 160); p.god = null; p.piety = 0;
}
function joinGod(g) {
  const p = G.p;
  if (p.god === g) return;
  if (p.penance[g] > 0) return failMsg(`${GODS[g].n} has not yet forgiven you.`);
  if (p.god) { msg(`You turn away from ${GODS[p.god].n}.`, '#e5a55a'); if (p.god !== 'kydyr') p.penance[p.god] = rr(80, 160); }
  if (g === 'morkhan' && (p.god === 'janyl' || p.penance.janyl)) p.penance.janyl = Math.max(p.penance.janyl || 0, 200);
  p.god = g; p.piety = g === 'kydyr' ? 0 : 15;
  msg(`You kneel and give yourself to ${GODS[g].n}, ${GODS[g].title}.`, GODS[g].c);
  if (g === 'janyl' && p.spells.some(s => SPELLS[s].sch.includes('necro'))) msg('St. Janyl will not like the necromancy you know.', '#ffffff');
  endTurn(10);
}
function renounce() {
  const p = G.p; if (!p.god) return;
  const g = p.god; msg(`You renounce ${GODS[g].n}.`, '#e5a55a');
  if (g !== 'kydyr') p.penance[g] = rr(80, 160);
  p.god = null; p.piety = 0; closeMenu(); render();
}
function maybeGift() {
  const p = G.p;
  if (p.god !== 'kambar' || stars() < 4 || G.turn < (p.nextGift || 0) || !chance(.12)) return;
  p.nextGift = G.turn + 600;
  let it; for (let k = 0; k < 40; k++) { it = randomItem(L().absd + 6, true); if (it.k === 'weapon' || it.k === 'armour') break; }
  L().items.push({ x: p.x, y: p.y, it });
  msg(`Kambar-Ata grants you a gift! ${cap(itemName(it))} appears at your feet.`, '#e0b070');
}
function religionTick(f) {
  const p = G.p;
  // Piety decays very slowly.
  if (p.god && p.god !== 'kydyr') { p.decay = (p.decay || 0) + f; if (p.decay >= 80) { p.decay = 0; if (p.piety > 1) p.piety--; } }
  // Storm Ward.
  if (st('storm')) {
    const adj = L().mons.filter(m => !m.dead && !m.ally && cheb(m, p) === 1);
    if (adj.length && chance(.5 * f)) { const m = pick(adj); flash([m], '#9fd0ff'); msg(`Lightning leaps into ${monName(m)}!`, '#9fd0ff'); damageMonster(m, roll(2, 4 + Math.floor(skf('invo') / 3)), { src: 'p', elem: 'elec', silent: 1 }); }
  }
  // Wrath.
  for (const g in p.penance) {
    if (p.penance[g] <= 0) continue;
    p.penance[g] -= f;
    if (p.penance[g] <= 0) { msg(`You feel that ${GODS[g].n} has forgiven you.`, GODS[g].c); delete p.penance[g]; continue; }
    if (!chance(f / 45)) continue;
    switch (g) {
      case 'janyl': msg('A cold white light finds you. St. Janyl has not forgotten.', '#ffffff'); if (p.god === 'morkhan') damagePlayer(roll(2, 8), 'the wrath of St. Janyl'); else addSt('slow', 4); break;
      case 'kambar': msg('A phantom hoof strikes you!', '#e0b070'); damagePlayer(roll(2, 6), 'the wrath of Kambar-Ata'); break;
      case 'umay': msg('Your hearth grows cold. Your wounds will not close.', '#f0c0d8'); p.regen = -5; break;
      case 'tengri': msg('Thunder answers your name!', '#7ab0ff'); damagePlayer(roll(3, 6), 'the wrath of Kök Tengri', 'elec'); break;
      case 'morkhan': { msg('Morkhan sends his herd after you!', '#ff4050'); for (let k = 0; k < rr(1, 2); k++) { const c = nearFree(L(), p.x, p.y, 3); if (c) spawnMonster(L(), 'bull', c.x, c.y, { awake: 1 }); } break; }
    }
  }
}

// --- abilities ---
function invoFail(star) { return clamp(Math.round(30 + star * 7 - skf('invo') * 3.5 - G.p.xl * 0.5), 0, 90); }
function abilityList() {
  const p = G.p, out = [];
  if (SPc().breath) out.push({ id: 'breath', n: 'Breathe Fire', cost: p.breathCD > 0 ? `recovering (${Math.ceil(p.breathCD)})` : 'no cost', fail: 0, ok: p.breathCD <= 0, d: 'A gout of fire that passes through foes.' });
  if (p.god) {
    const g = GODS[p.god];
    for (const a of g.abil) {
      if (stars() < a.star) continue;
      if (a.id === 'tulpargift' && p.tulparGiven) continue;
      let cost, ok = true;
      if (a.silver) { const c = kydyrCost(a.id); cost = `${c} silver`; ok = p.gold >= c; }
      else { cost = `${a.mp} MP, ${a.piety} piety`; ok = p.mp >= a.mp && p.piety >= a.piety; }
      out.push({ id: a.id, n: a.n, cost, fail: a.silver ? 0 : invoFail(a.star), ok, d: a.d });
    }
  }
  return out;
}
function kydyrCost(id) { const p = G.p; return id === 'purse' ? 50 + p.xl * 15 : id === 'caravan' ? 100 + L().absd * 15 : 30 + p.xl * 10; }
function useAbility(id) {
  const p = G.p, ab = abilityList().find(a => a.id === id);
  if (!ab) return;
  if (!ab.ok) return failMsg(id === 'breath' ? "You haven't got your breath back yet." : p.god === 'kydyr' ? "You don't have enough silver." : "You don't have the magic or piety for that.");
  if (st('silence') && id !== 'breath' && id !== 'rage') return failMsg('Your prayer makes no sound in this silence.');
  const ga = p.god ? GODS[p.god].abil.find(a => a.id === id) : null;
  const pay = () => { if (ga) { if (ga.silver) p.gold -= kydyrCost(id); else { p.mp -= ga.mp; losePiety(ga.piety); } exercise('invo'); } };
  const failed = () => { if (ga && !ga.silver && chance(ab.fail / 100)) { p.mp -= Math.ceil(ga.mp / 2); msg('You fail to invoke the power.', '#8a8499'); endTurn(10); return true; } return false; };
  const iv = skf('invo');
  const me = { x: p.x, y: p.y, player: 1 };
  switch (id) {
    case 'breath': return startTargeting({ kind: 'beam', range: 6, prompt: 'Breathe fire where?', cb: (x, y) => { p.breathCD = rr(10, 16); zap(me, { x, y }, { range: 6, beam: 1, dmg: roll(2, 4 + Math.floor(p.xl / 2)) + Math.floor(p.xl / 2), elem: 'fire', col: '#ff6020', name: 'fire' }); endTurn(10); } });
    case 'thunder': return startTargeting({ kind: 'smite', range: 8, prompt: 'Call thunder on whom?', cb: (x, y) => { if (failed()) return; pay(); const m = monAt(x, y); if (m && canSee(x, y)) { flash([m], '#9fd0ff'); msg(`Thunder strikes ${monName(m)}!`, '#9fd0ff'); damageMonster(m, roll(2, 6 + Math.floor(iv)), { src: 'p', elem: 'elec', silent: 1 }); } else msg('Thunder rolls over empty ground.'); endTurn(10); } });
    case 'minordestr': return startTargeting({ kind: 'bolt', range: 7, prompt: 'Aim the black bolt.', cb: (x, y) => { if (failed()) return; pay(); zap(me, { x, y }, { range: 7, dmg: roll(3, 5 + Math.floor(iv / 2)), elem: 'neg', col: '#c02040', name: 'black bolt' }); endTurn(10); } });
    case 'majordestr': return startTargeting({ kind: 'ball', range: 7, prompt: "Aim Morkhan's horns.", cb: (x, y) => { if (failed()) return; pay(); zap(me, { x, y }, { range: 7, explode: 1, dmg: roll(6, 8 + Math.floor(iv / 2)), elem: 'neg', col: '#ff3348', name: 'horns' }); endTurn(10); } });
    case 'bribe': return startTargeting({ kind: 'smite', range: 8, prompt: 'Bribe whom?', cb: (x, y) => {
      const m = monAt(x, y); if (!m || T_(m).fl.has('unique') && m.k === 'herald') { msg('Some things cannot be bought.'); return render(); }
      const c = kydyrCost('bribe') + T_(m).hd * 20; if (p.gold < c) { msg(`That would cost ${c} silver.`); return render(); }
      p.gold -= c; m.dead = true; msg(`${monName(m, 1)} takes the ${c} silver and wanders off.`, '#e8c050'); endTurn(10);
    } });
  }
  if (failed()) return;
  pay();
  switch (id) {
    case 'jheal': p.hp = Math.min(maxHP(), p.hp + roll(2, 6 + Math.floor(iv)) + Math.floor(iv * 2) + p.xl); msg('You speak the bata and your wounds close. Oomin.', '#ffffff'); break;
    case 'cleanse': for (const k of ['poison', 'conf', 'slow', 'corr', 'net']) delete p.st[k]; if (chance(.33)) cureMutation(true); msg('You are washed in white milk.', '#ffffff'); break;
    case 'ward': addSt('ward', 15 + Math.floor(iv * 2)); msg('A ward of white felt settles about you.', '#ffffff'); break;
    case 'riderlight': { const vs = visibleHostiles().filter(isEvil); flash(vs, '#ffffff'); msg(vs.length ? "The White Rider's light blazes across the valley!" : 'White light fills the valley, finding nothing evil.', '#ffffff'); for (const m of vs) damageMonster(m, roll(3, 6 + Math.floor(iv / 2)) + p.xl, { src: 'p', silent: 1 }); break; }
    case 'mantle': p.hp = maxHP(); for (const m of visibleHostiles()) if (cheb(m, p) <= 6 && !T_(m).fl.has('mindless')) m.st.fear = 12; msg("Janyl's mantle covers you. You are whole, and your foes fall back.", '#ffffff'); break;
    case 'hooves': addSt('haste', 8 + Math.floor(iv / 2)); msg('You feel the speed of the herd in you!', '#e0b070'); break;
    case 'heroism': addSt('hero', 15 + Math.floor(iv)); msg('The spirit of the baatyr fills you!', '#e0b070'); break;
    case 'herd': { const n = 2 + Math.floor(iv / 9); for (let k = 0; k < n; k++) { const c = nearFree(L(), p.x, p.y, 2); if (c) spawnMonster(L(), 'chongtor', c.x, c.y, { ally: 1, ttl: 25 + Math.floor(iv * 2) }); } msg('Chongtor horses gallop to your side!', '#e0b070'); break; }
    case 'tulpargift': { const c = nearFree(L(), p.x, p.y, 2); if (c) { spawnMonster(L(), 'tulpar', c.x, c.y, { ally: 1, perm: 1 }); p.tulparGiven = 1; msg('A tulpar lands beside you and folds its wings. It is yours.', '#ffffff'); } break; }
    case 'warmth': addSt('warmth', 20 + Math.floor(iv * 2)); msg('You feel the warmth of a hearth.', '#f0c0d8'); break;
    case 'cradle': L().sanct = { x: p.x, y: p.y, until: G.turn + 8 + Math.floor(iv / 2) }; msg("Umay's cradle surrounds you. No one may fight here.", '#f0c0d8'); break;
    case 'lullaby': { let n = 0; for (const m of visibleHostiles()) if (hexCheck(m, 30 + iv * 6, 'sleep')) { m.state = 'sleep'; m.sleepT = 10 + Math.floor(iv); n++; } msg(n ? `Umay sings, and ${n} creature${n > 1 ? 's sleep' : ' sleeps'}.` : 'Umay sings. No one listens.', '#f0c0d8'); break; }
    case 'skyeye': revealMap(L()); msg('The sky shows you the shape of the valley.', '#7ab0ff'); break;
    case 'storm': addSt('storm', 15 + Math.floor(iv)); msg('Storm clouds gather close about you.', '#7ab0ff'); break;
    case 'wrath': { const vs = visibleHostiles(); flash(vs, '#9fd0ff'); msg("Heaven's wrath splits the sky!", '#9fd0ff'); for (const m of vs) damageMonster(m, roll(3, 6 + Math.floor(iv / 2)), { src: 'p', elem: 'elec' }); break; }
    case 'rage': if (st('berserk') || st('exh')) { msg("You're too exhausted."); return render(); } goBerserk(); break;
    case 'bulls': { const n = rr(1, 2); for (let k = 0; k < n; k++) { const c = nearFree(L(), p.x, p.y, 2); if (c) spawnMonster(L(), 'bull', c.x, c.y, { ally: 1, ttl: 20 + Math.floor(iv) }); } msg('Black bulls answer your call.', '#ff4050'); break; }
    case 'purse': p.hp = maxHP(); for (const k of ['poison', 'conf', 'slow', 'corr']) delete p.st[k]; msg('Kydyr-Ata takes the silver and touches your brow. You are whole.', '#e8c050'); break;
    case 'caravan': { const s = makeShop(p.x, p.y, L().absd + 2); s.name = "Kydyr-Ata's caravan"; G.caravan = s; msg('A caravan of camels plods up out of nowhere.', '#e8c050'); endTurn(10); return openShop(s, true); }
  }
  endTurn(10);
}
