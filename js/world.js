"use strict";
// Game state, time, movement, stairs, travel, saving.

let G = null;
const L = () => G.levels[G.cur];
const curTheme = () => themeFor(L().br, L().d);
const levelName = (id = G.cur) => { const [br, d] = id.split(':'); return br === 'V' ? `Day ${d}` : `${BRANCHES[br].short} ${d}`; };
// The journey: each valley is a day farther from the Qara-Chik road; regions add days to the valley they open from.
function daysFromHome(id = G.cur) {
  const [br, ds] = id.split(':'); const d = +ds;
  if (br === 'V') return d;
  return daysFromHome(`${BRANCHES[br].parent}:${G.entries[br]}`) + d;
}
function onwardInfo(lev) {
  const o = lev.br === 'V' ? VALLEY_ONWARD[lev.d] : (BRANCH_LINKS[lev.br].on || null);
  return o ? { kind: o[0], name: o[1], to: `${lev.br}:${lev.d + 1}` } : null;
}
function backInfo(lev) {
  if (lev.br === 'V' && lev.d === 1) return { kind: 'road', name: 'the Qara-Chik road home' };
  if (lev.br === 'V') return { kind: 'trail', name: `the trail back to ${VALLEY_THEMES[lev.d - 1].name}` };
  if (lev.d === 1) { const par = `${BRANCHES[lev.br].parent}:${G.entries[lev.br]}`; return { kind: lev.br === 'tunnels' ? 'ladder' : 'trail', name: `the way back to ${placeName(par)}` }; }
  const b = BRANCH_LINKS[lev.br].back; return { kind: b[0], name: b[1] };
}
// "the Kara-Oi ashuu, leading on to Besh-Tash Valley" / "a shaft to the lower galleries (Tunnels 2)"
function onwardText(lev) { const o = onwardInfo(lev); return lev.br === 'V' ? `${o.name}, leading on to ${placeName(o.to)}` : `${o.name} (${levelName(o.to)})`; }
function entryInfo(br) { const e = BRANCH_LINKS[br].entry; return { kind: e[0], name: e[1] }; }
const placeName = (id = G.cur) => { const [br, d] = id.split(':'); return themeFor(br, +d).name; };

function msg(t, c) {
  if (!G) return;
  const last = G.msgs[G.msgs.length - 1];
  if (last && last.t === t && G.turn - last.turn < 2) { last.n = (last.n || 1) + 1; last.turn = G.turn; return; }
  G.msgs.push({ t, c: c || '#e8e2d3', turn: G.turn }); if (G.msgs.length > 400) G.msgs.shift();
}
function failMsg(t) { msg(t, '#a9a3b8'); render(); }

function newGame(name, sp, bg) {
  const S = SPECIES[sp], B = BACKGROUNDS[bg];
  G = { version: VERSION, turn: 0, cur: null, levels: {}, msgs: [], known: {}, looks: { potion: {}, scroll: {}, ring: {}, amulet: {} },
    uniques: {}, arts: {}, kills: 0, killList: {}, nextId: 1, entries: {}, over: false, won: false, start: Date.now(),
    p: { name: name || randomName(), sp, bg, x: 0, y: 0, xl: 1, xp: 0, str: S.str + (B.str || 0), int: S.int + (B.int || 0), dex: S.dex + (B.dex || 0),
      hp: 1, mp: 0, inv: new Array(52).fill(null), st: {}, muts: {}, sk: {}, train: {}, manualOff: {}, autoTrain: true, spells: [], library: [],
      gold: 0, regen: 0, mpregen: 0, god: null, piety: 0, penance: {}, orb: false, tamgas: [], quiver: null, breathCD: 0, visited: [] } };
  const looks = shuffle(POTION_LOOKS.slice()); Object.keys(POTIONS).forEach((k, i) => G.looks.potion[k] = looks[i % looks.length]);
  Object.keys(SCROLLS).forEach(k => G.looks.scroll[k] = (pick(SYL) + ' ' + pick(SYL) + (chance(.5) ? ' ' + pick(SYL) : '')).toUpperCase());
  const rl = shuffle(RING_LOOKS.slice()); Object.keys(RINGS).forEach((k, i) => G.looks.ring[k] = rl[i % rl.length]);
  const al = shuffle(AMULET_LOOKS.slice()); Object.keys(AMULETS).forEach((k, i) => G.looks.amulet[k] = al[i % al.length]);
  for (const b of BRANCH_ORDER) if (b !== 'V') G.entries[b] = rr(BRANCHES[b].entry[0], BRANCHES[b].entry[1]);
  const p = G.p;
  for (const s in B.skills) { p.sk[s] = SKILL_TOTAL[B.skills[s]]; p.train[s] = 1; }
  for (const [k, t, o] of B.kit) { const it = newItem(k, t, o || {}); identify(it); addToPack(it, true); }
  for (const it of p.inv) {
    if (!it) continue;
    if (it.k === 'weapon' && !equipped('weapon') && !(p.bg === 'berkut' && it.t !== 'jaa')) it.eq = 'weapon';
    if (it.k === 'armour' && !canWear(it)) it.eq = ARMOURS[it.t].slot;
  }
  if (B.spells) p.spells = B.spells.slice();
  if (B.god) { p.god = B.god; p.piety = 35; }
  G.known['potion:kymyz'] = 1;
  p.hp = maxHP(); p.mp = maxMP();
  enterLevel('V:1', 'start');
  if (B.eagle) { const c = nearFree(L(), p.x, p.y, 2); if (c) spawnMonster(L(), 'goldeagle', c.x, c.y, { ally: 1, perm: 1, o: eagleStats() }); }
  msg(`${p.name} the ${S.n} ${B.n} rides out from the Qara-Chik road.`, '#d8a640');
  msg('Gather three clan tamgas, open the sealed cleft under Manas Peak, ten days from home, and bring the Ene Malka home. Press ? for help.', '#8a8499');
}

// --- levels and stairs ---
function levelParent(id) {
  const [br, ds] = id.split(':'); const d = +ds;
  if (d > 1) return `${br}:${d - 1}`;
  if (br === 'V') return null;
  return `${BRANCHES[br].parent}:${G.entries[br]}`;
}
function enterLevel(id, how, fromBranch) {
  const p = G.p;
  const followers = [];
  const prevLev = G.cur ? L() : null;
  if (G.cur) {
    const prev = L();
    for (const m of prev.mons) {
      if (m.dead) continue;
      if ((m.ally && cheb(m, p) <= 2 && !(m.k === 'risen' && !m.perm && cheb(m, p) > 1)) || (!m.ally && m.state === 'hunt' && cheb(m, p) === 1 && !m.st.para && m.k !== 'herald' && !BRANCH_BOSS(m.k))) followers.push(m);
    }
    prev.mons = prev.mons.filter(m => !followers.includes(m));
  }
  if (!G.levels[id]) G.levels[id] = generateLevel(id);
  G.cur = id; G._dm = null;
  const lev = L();
  let at = lev.up;
  if (how === 'up') at = lev.down || lev.up;
  if (how === 'branchup') { const e = lev.entries.find(e => e.to === fromBranch); if (e) at = { x: e.x, y: e.y }; }
  p.x = at.x; p.y = at.y;
  const blocker = lev.mons.find(m => !m.dead && m.x === p.x && m.y === p.y);
  if (blocker) { const c = nearFree(lev, p.x, p.y, 3); if (c) { blocker.x = c.x; blocker.y = c.y; } }
  for (const m of followers) { const c = nearFree(lev, p.x, p.y, 2); if (c) { m.x = c.x; m.y = c.y; m.en = 0; lev.mons.push(m); } }
  const days = daysFromHome(id), dayText = `${days} day${days > 1 ? 's' : ''} from home`;
  const via = how === 'down' && prevLev ? onwardInfo(prevLev) : how === 'branch' ? entryInfo(lev.br) : null;
  if (!lev.visited) {
    lev.visited = true; p.visited.push(id);
    const arrive = !via ? `${placeName(id)}.` : how === 'branch' ? `You follow ${via.name} into ${BRANCHES[lev.br].n}.`
      : lev.br === 'V' ? `You take ${via.name} to ${placeName(id)}.` : `You take ${via.name} (${levelName(id)}).`;
    msg(`${arrive} ${cap(dayText)}.`, BRANCHES[lev.br].c);
    msg(curTheme().intro, '#a9a3b8');
    if (p.orb) for (let k = 0; k < 3; k++) { const c = randomFloor(lev, 10); if (c) { const m = spawnGroup(lev, pickMonsterType(lev, 2), c.x, c.y); m.state = 'hunt'; m.tx = p.x; m.ty = p.y; } }
  } else msg(`You return to ${placeName(id)}, ${dayText}.`, BRANCHES[lev.br].c);
  for (const e of lev.entries) if (lev.seen[idx(e.x, e.y)]) G.seenEntries = true;
  updateFOV(); save();
}
const BRANCH_BOSS = k => Object.values(BRANCHES).some(b => b.boss === k);

function takeStairs(dir) {
  const p = G.p, lev = L(), t = lev.t[idx(p.x, p.y)];
  stopRun();
  if (dir > 0) {
    if (t === T.SHOP) { const s = lev.shops.find(s => s.x === p.x && s.y === p.y); if (s) return openShop(s); }
    if (t === T.DOWN) { enterLevel(`${lev.br}:${lev.d + 1}`, 'down'); return render(); }
    if (t === T.BRANCH) {
      const e = lev.entries.find(e => e.x === p.x && e.y === p.y);
      if (e.to === 'hidden' && p.tamgas.length < BRANCHES.hidden.needs) return failMsg(`The cleft is sealed with bare rock. Three clan tamgas would open it; you carry ${p.tamgas.length}.`);
      if (e.to === 'hidden' && !lev.hiddenOpened) { lev.hiddenOpened = 1; msg('You press the three tamgas to the rock. It opens like a felt door.', '#c070ff'); }
      enterLevel(`${e.to}:1`, 'branch'); return render();
    }
    const opts = [];
    if (lev.down && lev.seen[idx(lev.down.x, lev.down.y)]) opts.push(lev.down);
    for (const e of lev.entries) if (lev.seen[idx(e.x, e.y)]) opts.push(e);
    if (!opts.length) return failMsg(lev.down || lev.entries.length ? "You haven't found the way on yet." : 'There is no way on from here.');
    opts.sort((a, b) => cheb(a, p) - cheb(b, p));
    return travelTo(opts[0]);
  }
  if (t !== T.UP) { if (lev.seen[idx(lev.up.x, lev.up.y)]) return travelTo(lev.up); return failMsg("You haven't found the way back."); }
  if (lev.br === 'V' && lev.d === 1) {
    if (p.orb) return win();
    return openMenu({ title: 'Ride home?', text: 'You have not found the Mother Leaven. If you ride home now, the game ends.', items: [
      { key: 'y', label: 'Ride home and end the game', act: () => { closeMenu(); die('rode home empty-handed', true); } },
      { key: 'n', label: 'Stay', act: closeMenu }] });
  }
  if (lev.d === 1) { const par = BRANCHES[lev.br].parent; enterLevel(`${par}:${G.entries[lev.br]}`, 'branchup', lev.br); }
  else enterLevel(`${lev.br}:${lev.d - 1}`, 'up');
  render();
}

// --- time ---
function endTurn(aut) {
  if (G.over) return;
  const p = G.p;
  let a = aut; if (st('haste') || st('berserk')) a *= 2 / 3; if (st('slow')) a *= 1.5;
  const f = a / 10; G.turn += f;
  p.regen += regenRate() * f; while (p.regen >= 1) { p.regen--; if (p.hp < maxHP()) p.hp++; }
  p.mpregen += mpRegenRate() * f; while (p.mpregen >= 1) { p.mpregen--; if (p.mp < maxMP()) p.mp++; }
  if (p.breathCD > 0) p.breathCD -= f;
  G.stAcc = (G.stAcc || 0) + f;
  while (G.stAcc >= 1 && !G.over) { G.stAcc--; statusTick(); }
  if (G.over) return;
  cloudTick(f);
  G._dm = null;
  const lev = L();
  for (const m of lev.mons.slice()) {
    if (m.dead) continue;
    const Tm = T_(m);
    m.en += Tm.spd * (m.st.haste ? 1.5 : 1) * (m.st.berserk ? 1.3 : 1) * f;
    let guard = 0;
    while (m.en >= 10 && !m.dead && !G.over && guard++ < 6) { m.en -= 10; monAct(m); }
  }
  if (G.over) return;
  lev.mons = lev.mons.filter(m => !m.dead);
  lev.items = lev.items.filter(o => !(o.it.k === 'remains' && o.it.rot < G.turn));
  maybeSpawnWanderer(f);
  religionTick(f);
  spotTraps();
  if (G.over) return;
  updateFOV();
  if (st('para') > 0 && !G.over) { render(); return endTurn(10); }
  if (G.statUps && !ui) statPrompt();
  if (Math.floor(G.turn / 50) !== Math.floor((G.turn - f) / 50)) save();
  render();
}
function statusTick() {
  const p = G.p;
  if (st('poison') > 0) damagePlayer(1 + Math.floor(st('poison') / 8), 'poison');
  for (const k of Object.keys(p.st)) {
    if (k === 'net') continue;
    if (p.st[k] > 0) p.st[k]--;
    if (p.st[k] > 0) continue;
    delete p.st[k];
    const endMsg = { haste: 'You feel yourself slow down.', might: 'You feel a little less mighty now.', brill: 'You feel a little less clever now.', resist: 'Your resistance to the elements fades.',
      invis: 'You flicker back into view.', hoarfrost: 'Your icy armour melts away.', swift: 'You feel sluggish.', ward: 'The felt ward fades.', hero: 'You feel like a mere mortal again.',
      warmth: 'The warmth of the hearth fades.', storm: 'The storm about you dies away.', silence: 'Sound returns.', conf: 'You feel less confused.', slow: 'You feel yourself speed up.', poison: 'You are no longer poisoned.' }[k];
    if (endMsg) msg(endMsg, '#a9a3b8');
    if (k === 'berserk') { msg('You are no longer berserk. You feel exhausted.', '#a9a3b8'); addSt('slow', rr(4, 7)); addSt('exh', rr(10, 15)); p.hp = Math.min(p.hp, maxHP()); }
    if (k === 'teleport') teleportPlayer();
  }
  if (p.hp > maxHP()) p.hp = maxHP();
  if (p.mp > maxMP()) p.mp = maxMP();
}

// --- moving ---
function playerMove(dx, dy) {
  const p = G.p, lev = L();
  if (st('net')) { p.st.net--; msg(p.st.net > 0 ? 'You struggle against the net.' : 'You tear free of the net.', '#c8b898'); if (p.st.net <= 0) delete p.st.net; endTurn(10); return true; }
  if (st('conf') && chance(.4)) [dx, dy] = pick(N8);
  const nx = p.x + dx, ny = p.y + dy; if (!inb(nx, ny)) return false;
  const m = monAt(nx, ny);
  if (m) {
    if (m.ally) { m.x = p.x; m.y = p.y; p.x = nx; p.y = ny; afterMove(); endTurn(moveCost()); return true; }
    if (inSanctuary(p.x, p.y) || inSanctuary(nx, ny)) { failMsg("Umay's cradle forbids fighting here."); return false; }
    playerAttack(m); return true;
  }
  const t = lev.t[idx(nx, ny)];
  if (t === T.DOORC) { lev.t[idx(nx, ny)] = T.DOORO; msg('You open the felt door.', '#a9a3b8'); endTurn(10); return true; }
  if (t === T.DEEP) { msg('The water is too deep to ford here.', '#6f93d8'); render(); return false; }
  if (t === T.STATUE) { msg('A balbal stands there, cup in hand.', '#a9a3b8'); render(); return false; }
  if (!passable(t)) return false;
  p.x = nx; p.y = ny;
  afterMove(); endTurn(moveCost());
  return true;
}
const AUTO_KINDS = ['gold', 'potion', 'scroll', 'wand', 'ring', 'amulet', 'book', 'misc', 'tamga', 'orb', 'missile'];
function afterMove() {
  const p = G.p, lev = L();
  for (const o of lev.items.filter(o => o.x === p.x && o.y === p.y)) {
    o.visited = 1;
    if (AUTO_KINDS.includes(o.it.k) && !o.it.dropped && canTake(o.it) && addToPack(o.it)) lev.items.splice(lev.items.indexOf(o), 1);
  }
  const rest = lev.items.filter(o => o.x === p.x && o.y === p.y);
  if (rest.length === 1) msg(`You see here ${itemName(rest[0].it)}.`, '#a9a3b8');
  else if (rest.length > 1) msg(`There are ${rest.length} items here. (g to pick up)`, '#a9a3b8');
  const i = idx(p.x, p.y), t = lev.t[i];
  if (t === T.DOWN) msg(`${cap(onwardText(lev))}. (> to go on)`, '#a9a3b8');
  if (t === T.UP) { const b = backInfo(lev); msg(lev.br === 'V' && lev.d === 1 ? 'The Qara-Chik road leads home. (< to leave)' : `${cap(b.name)}. (< to go back)`, '#a9a3b8'); }
  if (t === T.BRANCH) { const e = lev.entries.find(e => e.x === p.x && e.y === p.y); msg(`${cap(entryInfo(e.to).name)} leads into ${BRANCHES[e.to].n}. (> to enter)`, BRANCHES[e.to].c); }
  if (t === T.MAZAR) msg('A mazar: a cairn hung with white ribbons. (p to pray)', '#f5efe0');
  if (t === T.ALTAR) { const g = lev.altars[i]; msg(`An altar to ${GODS[g].n}, ${GODS[g].title}. (p to pray)`, GODS[g].c); }
  if (t === T.SHOP) { const s = lev.shops.find(s => s.x === p.x && s.y === p.y); if (s) msg(`${s.name}. (> to trade)`, '#e8c050'); }
  const tr = lev.traps.find(r => r.x === p.x && r.y === p.y);
  if (tr) triggerTrap(tr);
  if (st('storm') || true) { const c = cloudAt(p.x, p.y); if (c && CLOUDS[c.ty].dmg) msg(`You are in ${CLOUDS[c.ty].n}!`, CLOUDS[c.ty].c); }
}
function triggerTrap(tr) {
  const p = G.p, lev = L(), a = lev.absd;
  tr.known = true;
  if (st('swift') && chance(.3)) return;
  switch (tr.ty) {
    case 'net': if (chance(.25 + EV() / 100)) { msg('A net drops, but you dodge it.', '#c8b898'); break; } addSt('net', rr(3, 6)); msg('A net drops on you! You are caught.', '#c8b898'); break;
    case 'pit': msg('The ground gives way: you fall into a marmot pit!', '#a0704a'); damagePlayer(roll(2, 3) + Math.floor(a / 2), 'a marmot pit'); break;
    case 'alarm': msg('A ring of bells jangles loudly!', '#e8c050'); noise(p.x, p.y, 40); break;
    case 'dust': msg('A dust devil whirls up and carries you off!', '#a4e4ff'); teleportPlayer(); break;
    case 'arrow': if (chance(hitChance(14 + a * 3, EV()))) { msg('A tripwire bow shoots you!', '#e57a7a'); damagePlayer(roll(2, 5) + a, 'a tripwire bow'); } else msg('An arrow whistles past you.', '#a9a3b8'); break;
    case 'mark': { msg("You step on Morkhan's mark. Something answers.", '#ff4050'); for (let k = 0; k < 2; k++) { const c = nearFree(lev, p.x, p.y, 3); if (c) spawnMonster(lev, pickMonsterType(lev, 1), c.x, c.y, { awake: 1 }); } lev.traps.splice(lev.traps.indexOf(tr), 1); break; }
  }
}
function spotTraps() {
  const p = G.p;
  for (const tr of L().traps) if (!tr.known && cheb(tr, p) <= 2 && canSee(tr.x, tr.y) && chance(0.12 + stat('dex') / 120)) { tr.known = true; msg(`You spot ${art(TRAPS[tr.ty].n)}.`, TRAPS[tr.ty].c); stopRun(); }
}
function closeDoor() {
  const p = G.p, lev = L();
  const opts = N8.map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy })).filter(c => lev.t[idx(c.x, c.y)] === T.DOORO && !monAt(c.x, c.y) && !lev.items.some(o => o.x === c.x && o.y === c.y));
  if (!opts.length) return failMsg('There is no open door next to you.');
  lev.t[idx(opts[0].x, opts[0].y)] = T.DOORC; msg('You close the felt door.', '#a9a3b8'); endTurn(10);
}
function pray() {
  const p = G.p, lev = L(), i = idx(p.x, p.y), t = lev.t[i];
  if (t === T.MAZAR) {
    lev.t[i] = T.USED; p.hp = maxHP(); p.mp = maxMP(); delete p.st.poison; delete p.st.conf;
    msg('You tie a white ribbon, pour milk on the stones and light a sprig of juniper. You feel whole. Oomin.', '#f5efe0');
    if (p.god === 'janyl' || p.god === 'umay') gainPiety(8);
    return endTurn(10);
  }
  if (t === T.ALTAR) {
    const g = lev.altars[i], Gd = GODS[g];
    if (p.god === g) { msg(`You pray at the altar of ${Gd.n}. (${'*'.repeat(stars())}${'.'.repeat(6 - stars())})`, Gd.c); return endTurn(10); }
    return openMenu({ title: `${Gd.n}, ${Gd.title}`, text: `${esc(Gd.desc)}<br><br>${esc(Gd.likes)}<br>${esc(Gd.hates)}${Gd.passive ? '<br>' + esc(Gd.passive) : ''}<br><br>Powers: ${Gd.abil.map(a => `${esc(a.n)}${a.star ? ` (${'*'.repeat(a.star)})` : ''}`).join(', ')}.${p.god ? `<br><br><b>You will abandon ${GODS[p.god].n}, who will be angry for a while.</b>` : ''}`,
      items: [{ key: 'y', label: `Give yourself to ${Gd.n}`, act: () => { closeMenu(); joinGod(g); } }, { key: 'n', label: 'Not now', act: closeMenu }] });
  }
  if (p.god) { msg(`You murmur a prayer to ${GODS[p.god].n}. (${p.god === 'kydyr' ? 'silver: ' + p.gold : '*'.repeat(stars()) + '.'.repeat(6 - stars())})`, GODS[p.god].c); return render(); }
  failMsg('There is no altar or mazar here. (Find an altar to choose a patron.)');
}

// --- picking things up ---
function pickupHere() {
  const p = G.p, lev = L();
  const here = lev.items.filter(o => o.x === p.x && o.y === p.y && o.it.k !== 'remains');
  if (!here.length) { const r = lev.items.find(o => o.x === p.x && o.y === p.y); return failMsg(r ? 'Those remains are best left where they are.' : 'There is nothing here to pick up.'); }
  const take = list => { let n = 0; for (const o of list) { if (!canTake(o.it)) { msg('Your pack is full.', '#e55a5a'); break; } delete o.it.dropped; if (addToPack(o.it)) { lev.items.splice(lev.items.indexOf(o), 1); n++; } } if (n) endTurn(10); else render(); };
  if (here.length === 1) return take(here);
  openMenu({ title: 'Pick up what?', items: [{ key: ',', label: 'Everything', act: () => { closeMenu(); take(here); } }, ...here.map((o, j) => ({ key: letter(j), label: esc(itemName(o.it)), act: () => { closeMenu(); take([o]); } }))] });
}

// --- shops ---
function shopPrice(e) { return Math.round(e.price * (G.p.god === 'kydyr' ? 0.8 : 1)); }
function openShop(s, temp) {
  const p = G.p;
  if (!s.stock.length) return failMsg(`${s.name} has nothing left to sell.`);
  openMenu({ title: esc(s.name), text: `You have ${p.gold} silver.`, items: s.stock.map((e, j) => ({ key: letter(j),
    label: `${esc(itemName(e.it, { shop: 1 }))} <span class="${p.gold >= shopPrice(e) ? 'gold' : 'dim'}">${shopPrice(e)} silver</span>`, off: p.gold < shopPrice(e),
    act: () => {
      const price = shopPrice(e); if (p.gold < price) return;
      if (!canTake(e.it)) { msg('Your pack is full.', '#e55a5a'); return; }
      p.gold -= price; s.stock.splice(s.stock.indexOf(e), 1); identify(e.it); addToPack(e.it);
      msg(`You buy ${itemName(e.it)} for ${price} silver.`, '#e8c050');
      closeMenu(); if (s.stock.length) openShop(s, temp); else render();
    } })) });
}

// --- auto-explore, travel, rest, fight ---
let running = null;
function stopRun() { if (running) { clearTimeout(running); running = null; } G && (G.travelDest = null); }
function autoRun(stepFn) {
  stopRun();
  const tick = () => {
    running = null;
    if (G.over || ui) return;
    const h = visibleHostiles().filter(m => m.state !== 'sleep' || cheb(m, G.p) <= 3);
    if (h.length) { msg(`You see ${monName(h[0], false, true)}. You stop.`, '#e5a55a'); render(); return; }
    if (stepFn() === false) { render(); return; }
    running = setTimeout(tick, G.fastRun ? 0 : 18);
  };
  tick();
}
function pathStep(goal, opts = {}) {
  const p = G.p, lev = L();
  const prev = new Int32Array(W * H).fill(-2); const s = idx(p.x, p.y); prev[s] = -1; const q = [s]; let h = 0, found = -1;
  const avoid = new Set(lev.traps.filter(t => t.known).map(t => idx(t.x, t.y)));
  for (const c of lev.clouds) if (CLOUDS[c.ty].dmg) avoid.add(idx(c.x, c.y));
  while (h < q.length) {
    const c = q[h++]; if (c !== s && goal(c)) { found = c; break; }
    const x = c % W, y = (c - x) / W;
    for (const [dx, dy] of N8) {
      const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) continue; const j = idx(nx, ny);
      if (prev[j] !== -2 || !lev.seen[j] || !walkable(lev.t[j]) || avoid.has(j)) continue;
      prev[j] = c; q.push(j);
    }
  }
  if (found < 0) return null;
  let c = found; while (prev[c] !== s) c = prev[c];
  return { x: c % W - p.x, y: Math.floor(c / W) - p.y };
}
function explore() {
  const lev = L();
  autoRun(() => {
    const st_ = pathStep(c => {
      if (lev.items.some(o => idx(o.x, o.y) === c && ((AUTO_KINDS.includes(o.it.k) && !o.it.dropped && canTake(o.it)) || (!o.visited && o.it.k !== 'remains')))) return true;
      const x = c % W, y = (c - x) / W;
      return N8.some(([dx, dy]) => inb(x + dx, y + dy) && !lev.seen[idx(x + dx, y + dy)]);
    });
    if (!st_) { msg(lev.down && lev.seen[idx(lev.down.x, lev.down.y)] ? 'Done exploring. (> travels to the way on)' : 'Done exploring.', '#a9a3b8'); return false; }
    return playerMove(st_.x, st_.y);
  });
}
function travelTo(g) {
  const gi = idx(g.x, g.y);
  autoRun(() => { if (G.p.x === g.x && G.p.y === g.y) return false; const s = pathStep(c => c === gi); if (!s) { msg("You can't find a way there."); return false; } return playerMove(s.x, s.y); });
}
function levelRoute(a, b) {
  const up = id => { const out = [id]; let c = id; while ((c = levelParent(c))) out.push(c); return out; };
  const A = up(a), B = up(b); const lca = A.find(x => B.includes(x));
  return [...A.slice(0, A.indexOf(lca) + 1), ...B.slice(0, B.indexOf(lca)).reverse()];
}
function travelToLevel(dest) {
  const route = levelRoute(G.cur, dest);
  if (route.length < 2) return failMsg("You're already there.");
  autoRun(() => {
    if (G.cur === dest) { msg(`You arrive at ${placeName(dest)}.`, '#a9a3b8'); return false; }
    const r = levelRoute(G.cur, dest), next = r[1], lev = L();
    let target;
    if (next === levelParent(G.cur)) target = lev.up;
    else { const [nb] = next.split(':'); target = nb === lev.br ? lev.down : lev.entries.find(e => e.to === nb); }
    if (!target || !lev.seen[idx(target.x, target.y)]) { msg("You don't know the way from here."); return false; }
    if (G.p.x === target.x && G.p.y === target.y) { const before = G.cur; takeStairs(next === levelParent(G.cur) ? -1 : 1); return G.cur !== before; }
    const s = pathStep(c => c === idx(target.x, target.y)); if (!s) { msg("You can't find a way there."); return false; }
    return playerMove(s.x, s.y);
  });
}
function rest() {
  const p = G.p;
  if (p.hp >= maxHP() && p.mp >= maxMP() && !st('poison')) return failMsg('You are already rested. (s waits a single turn.)');
  let n = 0;
  autoRun(() => { if (n++ > 400 || (p.hp >= maxHP() && p.mp >= maxMP() && !st('poison'))) { msg('You finish resting.', '#a9a3b8'); return false; } endTurn(10); return true; });
}
function autoFight() {
  const h = visibleHostiles(); if (!h.length) return failMsg('You see no enemies nearby.');
  const m = h[0], p = G.p;
  if (cheb(m, p) === 1) return playerMove(Math.sign(m.x - p.x), Math.sign(m.y - p.y));
  const w = equipped('weapon'), qi = quiverItem();
  if (qi !== null && w && WEAPONS[w.t].shoot && launcherFor(p.inv[qi]) && clearShot(p, m)) return fireMissile(qi, m.x, m.y);
  const s = pathStep(c => c === idx(m.x, m.y)); if (s) playerMove(s.x, s.y); else failMsg('You cannot reach it.');
}

// --- the end ---
function score() { const p = G.p; return Math.round(p.gold + G.kills * 3 + p.xp * 2 + p.visited.length * 150 + p.tamgas.length * 3000 + (p.orb ? 10000 : 0) + (G.won ? 50000 : 0)); }
function die(cause, quit) {
  G.over = true; stopRun(); clearSave();
  const p = G.p;
  G.cause = quit ? 'rode home empty-handed' : `killed by ${cause}`;
  msg(quit ? 'You ride home.' : 'You die...', '#e55a5a'); recordGame(); render();
  showEnd(quit ? 'Home without the leaven' : 'You have died', `${esc(p.name)} was ${quit ? 'riding home from' : 'killed by ' + esc(cause) + ' in'} ${esc(placeName())}, ${daysText()}.`);
}
const daysText = (id = G.cur) => { const d = daysFromHome(id); return `${d} day${d > 1 ? 's' : ''} from home`; };
// The journey, for the character file: how far you got, the valleys you crossed, the regions you explored.
function journeyLines() {
  const p = G.p, out = [];
  const far = p.visited.reduce((best, id) => daysFromHome(id) > daysFromHome(best) ? id : best, p.visited[0] || 'V:1');
  const fd = daysFromHome(far);
  out.push(`Farthest from home: ${fd} day${fd > 1 ? 's' : ''}, in ${placeName(far)}.`);
  const valleys = p.visited.filter(id => id.startsWith('V:')).map(id => +id.split(':')[1]).sort((a, b) => a - b);
  out.push(`Valleys reached: ${valleys.length} of ${BRANCHES.V.depth}.`);
  for (const d of valleys) out.push(`  Day ${String(d).padStart(2)}  ${VALLEY_THEMES[d].name}`);
  const regions = BRANCH_ORDER.filter(b => b !== 'V' && p.visited.some(id => id.startsWith(b + ':')));
  out.push(regions.length ? 'Regions explored:' : 'Regions explored: none.');
  for (const b of regions) {
    const B = BRANCHES[b], deep = Math.max(...p.visited.filter(id => id.startsWith(b + ':')).map(id => +id.split(':')[1]));
    const notes = [];
    if (B.depth > 1) notes.push(deep >= B.depth ? `all ${B.depth} areas` : `${deep} of ${B.depth} areas`);
    if (B.boss && G.uniques[B.boss] === 'dead') notes.push(`slew ${MT[B.boss].n}`);
    if (B.tamga && p.tamgas.includes(B.tamga)) notes.push(`took the ${TAMGAS[B.tamga].n}`);
    if (b === 'hidden' && p.orb) notes.push('took the Ene Malka');
    out.push(`  ${cap(B.n)}${notes.length ? ': ' + notes.join('; ') : ''}`);
  }
  return out;
}
function win() {
  G.won = true; G.over = true; G.cause = 'brought the Ene Malka home'; stopRun(); clearSave(); recordGame(); render();
  showEnd('The Mother Leaven comes home', `${esc(G.p.name)} rides up the Qara-Chik road with the Ene Malka wrapped in white felt. In every valley behind, the herders will bake with it again, and the bards will add a verse.`);
}
// A short post about how the run ended, for sharing.
function shareText() {
  const p = G.p, who = `${cleanName(p.name)} the ${SPc().n} ${BGc().n}, level ${p.xl},`;
  const tam = p.tamgas.length ? ` with ${p.tamgas.length} clan tamga${p.tamgas.length > 1 ? 's' : ''}` : '';
  const how = G.won ? `brought the Ene Malka home${tam}!`
    : G.cause === 'rode home empty-handed' ? `rode home empty-handed from ${placeName()}, ${daysText()}.`
    : `was ${G.cause} in ${placeName()}, ${daysText()}.`;
  return `${who} ${how} Score: ${score().toLocaleString('en-US')}.\n\nSteppe Crawl, a roguelike set in Irad:`;
}
function morgue() {
  const p = G.p, S = SPc(), B = BGc();
  const lines = [];
  lines.push(`Steppe Crawl ${VERSION}: character file`, '', `${p.name} the ${S.n} ${B.n}, level ${p.xl}`, `Score ${score()}. ${cap(G.cause || 'still alive')} in ${placeName()}, ${daysText()}, on turn ${Math.floor(G.turn)}.`, '');
  lines.push(`HP ${Math.max(0, p.hp)}/${maxHP()}  MP ${p.mp}/${maxMP()}  AC ${AC()}  EV ${EV()}  SH ${SH()}  Str ${stat('str')}  Int ${stat('int')}  Dex ${stat('dex')}`);
  lines.push(`Patron: ${p.god ? GODS[p.god].n + ' ' + '*'.repeat(stars()) : 'none'}   Silver: ${p.gold}   Tamgas: ${p.tamgas.map(t => TAMGAS[t].n).join(', ') || 'none'}`, '');
  lines.push('Inventory:'); p.inv.forEach((it, i) => { if (it) lines.push(`  ${letter(i)} - ${itemName(it)}${it.eq ? ' (' + SLOT_NAMES[it.eq] + ')' : ''}`); });
  lines.push('', 'Skills:'); SKILLS.filter(s => sk(s.id) > 0).forEach(s => lines.push(`  ${s.n.padEnd(16)} ${skf(s.id).toFixed(1)}`));
  if (p.spells.length) { lines.push('', 'Spells:'); p.spells.forEach(s => lines.push(`  ${SPELLS[s].n.padEnd(28)} level ${SPELLS[s].lvl}  ${spellFail(s)}% fail`)); }
  if (Object.keys(p.muts).length) { lines.push('', 'Mutations:'); for (const m in p.muts) lines.push('  ' + MUTS[m].d(p.muts[m])); }
  lines.push('', 'The journey:'); journeyLines().forEach(l => lines.push('  ' + l));
  lines.push('', 'Kills: ' + G.kills + '.'); Object.entries(G.killList).sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([n, c]) => lines.push(`  ${c} ${n}`));
  lines.push('', 'Last messages:'); G.msgs.slice(-12).forEach(m => lines.push('  ' + m.t));
  return lines.join('\n');
}

// --- saving ---
const SAVE_KEY = 'steppe-crawl-save-v2';
function serialize() {
  return JSON.stringify(G, (k, v) => {
    if (k.startsWith('_')) return undefined;
    if (k === 't' && Array.isArray(v) && v.length === W * H) return v.map(n => String.fromCharCode(48 + n)).join('');
    if (k === 'seen' && Array.isArray(v) && v.length === W * H) return v.join('');
    return v;
  });
}
function deserialize(s) {
  const g = JSON.parse(s);
  for (const id in g.levels) { const lv = g.levels[id]; lv.t = [...lv.t].map(c => c.charCodeAt(0) - 48); lv.seen = [...lv.seen].map(Number); }
  return g;
}
function save() { if (!G || G.over) return; try { localStorage.setItem(SAVE_KEY, serialize()); } catch (e) { /* storage unavailable */ } }
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }
function loadSave() { try { const s = localStorage.getItem(SAVE_KEY); return s ? deserialize(s) : null; } catch (e) { return null; } }
