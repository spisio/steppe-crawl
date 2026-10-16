"use strict";
// Items: creation, identification, names, the pack, and using things.

function newItem(k, t, o = {}) {
  const it = { k, t, ench: o.ench || 0, qty: o.qty || 1 };
  if (o.brand) it.brand = o.brand;
  if (o.ego) it.ego = o.ego;
  if (o.staff) it.staff = o.staff;
  if (k === 'wand') it.ch = o.ch || rr(3, 8);
  if (k === 'misc') it.ch = MISC[t].max;
  if (k === 'ring' && RINGS[t].ench && !o.ench) it.ench = rr(1, 3);
  return it;
}

function randomItem(absd, good) {
  const d = absd + (good ? 4 : 0);
  const cls = wpick([['gold', good ? 0 : 18], ['potion', 20], ['scroll', 18], ['weapon', 11], ['armour', 10], ['missile', 5], ['wand', 5],
    ['ring', d >= 3 ? 3 : 0], ['amulet', d >= 5 ? 1.5 : 0], ['book', 3], ['misc', d >= 5 ? 0.8 : 0], ['staff', d >= 4 ? 1.2 : 0]]);
  switch (cls) {
    case 'gold': return newItem('gold', 'gold', { qty: rr(4, 10 + absd * 7) });
    case 'potion': return newItem('potion', wkey(POTIONS), { qty: chance(.2) ? 2 : 1 });
    case 'scroll': return newItem('scroll', wkey(SCROLLS), { qty: chance(.2) ? 2 : 1 });
    case 'missile': { const t = wpick([['ok', 4], ['tash', 3], ['korgoshun', d > 4 ? 1 : 0], ['javelin', 2], ['dart', 2]]); return newItem('missile', t, { qty: t === 'javelin' ? rr(2, 5) : rr(6, 18) }); }
    case 'wand': return newItem('wand', wkey(WANDS));
    case 'ring': return newItem('ring', wkey(RINGS));
    case 'amulet': return newItem('amulet', wkey(AMULETS));
    case 'book': return newItem('book', pick(Object.keys(BOOKS).filter(b => d >= 6 || !['morkhan', 'fire', 'winter'].includes(b) || chance(.3))));
    case 'misc': return newItem('misc', pick(Object.keys(MISC)));
    case 'staff': return newItem('weapon', 'taiak', { staff: pick(Object.keys(STAVES)), ench: rnd(3) });
    case 'weapon': {
      const art = maybeUnrand('weapon', d); if (art) return art;
      const pool = Object.keys(WEAPONS).filter(w => (WEAPONS[w].d || 0) <= d + 1);
      const it = newItem('weapon', pick(pool));
      if (chance(.3 + d * .03)) it.ench = rr(1, 1 + Math.floor(d / 3));
      if (chance(.08)) it.ench = -rr(1, 3);
      if (chance(.06 + d * .02)) it.brand = pick(Object.keys(BRANDS).filter(b => !(WEAPONS[it.t].shoot && ['vamp', 'drain', 'prot'].includes(b))));
      return it;
    }
    case 'armour': {
      const art = maybeUnrand('armour', d); if (art) return art;
      const pool = Object.keys(ARMOURS).filter(a => (ARMOURS[a].d || 0) <= d + 1);
      const it = newItem('armour', pick(pool));
      if (chance(.25 + d * .03)) it.ench = rr(1, 1 + Math.floor(d / 4));
      const slot = ARMOURS[it.t].slot;
      const egos = Object.keys(ARMOUR_EGOS).filter(e => ARMOUR_EGOS[e].slots.includes(slot));
      if (egos.length && chance(.06 + d * .02)) it.ego = pick(egos);
      return it;
    }
  }
  return newItem('potion', 'kymyz');
}
function maybeUnrand(k, d) {
  if (!chance(.025 + d * .002)) return null;
  const free = UNRANDS.filter(u => u.k === k && d >= u.minD && !G.arts[u.id]);
  if (!free.length) return null;
  const u = pick(free); G.arts[u.id] = 1;
  return { k: u.k, t: u.t, ench: u.ench, qty: 1, brand: u.brand, staff: u.staff, art: u.id };
}
const UNR = id => UNRANDS.find(u => u.id === id);

// --- identification ---
function typeKey(it) { return it.k + ':' + it.t; }
function isKnown(it) {
  if (['potion', 'scroll', 'ring', 'amulet'].includes(it.k)) return !!G.known[typeKey(it)];
  return true;
}
function identify(it) { if (!isKnown(it)) { G.known[typeKey(it)] = 1; return true; } return false; }

// --- properties granted while worn ---
function itemProps(it) {
  const pr = {};
  const add = (k, v) => { pr[k] = (pr[k] || 0) + v; };
  if (it.art) { const u = UNR(it.art); for (const k in u.props) add(k, u.props[k]); }
  if (it.k === 'armour') {
    const A = ARMOURS[it.t]; if (A.res) for (const k in A.res) add(k, A.res[k]);
    if (it.ego) {
      const e = it.ego;
      if (['rf', 'rc', 'rp', 'sinv', 'stealth', 'will', 'run', 'regen'].includes(e)) add(e, 1);
      if (['str', 'dex', 'int'].includes(e)) add(e, 3);
      if (e === 'prot') add('ac', 3);
      if (e === 'refl') add('refl', 1);
    }
  }
  if (it.k === 'weapon' && it.staff) { const S = STAVES[it.staff]; if (S.res) add(S.res, 1); }
  if (it.k === 'ring') {
    const t = it.t;
    if (t === 'prot') add('ac', it.ench); if (t === 'ev') add('ev', it.ench + 2); if (t === 'str') add('str', it.ench);
    if (t === 'dex') add('dex', it.ench); if (t === 'int') add('int', it.ench); if (t === 'slay') add('slay', it.ench);
    if (['rf', 'rc', 'rp', 'sinv', 'stealth', 'will'].includes(t)) add(t, 1);
    if (t === 'wiz') add('wiz', 1); if (t === 'mp') add('mp', 9);
  }
  if (it.k === 'amulet') {
    if (it.t === 'regen') add('regen', 1); if (it.t === 'mregen') add('mregen', 1); if (it.t === 'faith') add('faith', 1);
    if (it.t === 'refl') add('refl', 1); if (it.t === 'guard') add('guard', 1);
  }
  return pr;
}

// --- names ---
function itemName(it, o = {}) {
  const q = it.qty > 1;
  const known = isKnown(it) || o.shop;
  switch (it.k) {
    case 'gold': return `${it.qty} silver coin${q ? 's' : ''}`;
    case 'orb': return 'the Ene Malka (the Mother Leaven)';
    case 'tamga': return `the ${TAMGAS[it.t].n}`;
    case 'remains': return `the remains of ${it.of}`;
    case 'missile': { const M = MISSILES[it.t]; return `${q ? it.qty + ' ' + M.pl : art(M.n)} (${M.gl}${q ? 's' : ''})`; }
    case 'weapon': {
      if (it.art) return UNR(it.art).n;
      const Wp = WEAPONS[it.t];
      if (it.staff) return `${sgn(it.ench)} ${STAVES[it.staff].n} (${Wp.gl}, ${SCHOOL_NAME(STAVES[it.staff].school)})`;
      return `${sgn(it.ench)} ${Wp.n} (${Wp.gl})${it.brand ? ' ' + BRANDS[it.brand].n : ''}`;
    }
    case 'armour': {
      if (it.art) return UNR(it.art).n;
      const A = ARMOURS[it.t];
      return `${sgn(it.ench)} ${A.n} (${A.gl})${it.ego ? ' ' + ARMOUR_EGOS[it.ego].n : ''}`;
    }
    case 'potion': {
      const Pn = POTIONS[it.t];
      if (known) return `${q ? it.qty + ' flasks' : 'a flask'} of ${Pn.n} [${Pn.gl}]`;
      return `${q ? it.qty + ' ' : 'a '}${G.looks.potion[it.t]} flask${q ? 's' : ''}`;
    }
    case 'scroll': {
      const S = SCROLLS[it.t];
      if (known) return `${q ? it.qty + ' scrolls' : 'a scroll'} of ${S.n} [${S.gl}]`;
      return `${q ? it.qty + ' bark scrolls' : 'a bark scroll'} labelled "${G.looks.scroll[it.t]}"`;
    }
    case 'wand': return `${art(WANDS[it.t].n)} [${WANDS[it.t].gl}] (${it.ch})`;
    case 'ring': {
      if (!known) return art(`${G.looks.ring[it.t]} shakek`);
      const R = RINGS[it.t];
      return `${R.ench ? sgn(it.ench) + ' ' : 'a '}shakek of ${R.n}`;
    }
    case 'amulet': {
      if (!known) return art(`${G.looks.amulet[it.t]} tumar`);
      return `a ${AMULETS[it.t].n} [${AMULETS[it.t].gl}]`;
    }
    case 'book': return `a ${BOOKS[it.t].n}`;
    case 'misc': return `a ${MISC[it.t].n} (${it.ch}/${MISC[it.t].max})`;
  }
  return 'something';
}
// Name without a leading article, for "You see here X" phrasing.
function itemNameBare(it) { return itemName(it).replace(/^(a|an) /, ''); }
function SCHOOL_NAME(s) { return SK[s] ? SK[s].n : s; }
const ITEM_GLYPHS = { gold: ['$', '#e8c050'], orb: ['0', '#fff4c0'], tamga: ['}', '#ffffff'], missile: ['(', '#c9b48a'], weapon: [')', '#d8d8e0'],
  armour: ['[', '#c08a5a'], potion: ['!', '#e58aa8'], scroll: ['?', '#e8e0c0'], wand: ['/', '#8fd0e8'], ring: ['=', '#e8c050'],
  amulet: ['"', '#f0a0f0'], book: ['+', '#c0a0e0'], misc: ['}', '#80e0c0'], remains: ['%', '#a07060'] };
function itemGlyph(it) {
  if (it.k === 'tamga') return ['}', TAMGAS[it.t].c];
  if (it.k === 'remains') return ['%', it.c || '#a07060'];
  if (it.k === 'weapon' && it.staff) return ['|', '#c0a0e0'];
  if (it.art) return [ITEM_GLYPHS[it.k][0], '#ffd700'];
  return ITEM_GLYPHS[it.k] || ['*', '#fff'];
}
const ITEM_CLASS_ORDER = ['weapon', 'missile', 'armour', 'wand', 'misc', 'scroll', 'potion', 'ring', 'amulet', 'book'];
const ITEM_CLASS_NAME = { weapon: 'Hand Weapons', missile: 'Missiles', armour: 'Armour', wand: 'Wands', misc: 'Miscellaneous', scroll: 'Scrolls', potion: 'Potions', ring: 'Rings', amulet: 'Amulets', book: 'Books' };

// --- the pack ---
const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const letter = i => LETTERS[i];
const stackable = it => ['potion', 'scroll', 'missile', 'gold'].includes(it.k);
function canTake(it) {
  if (['gold', 'orb', 'tamga', 'remains'].includes(it.k)) return it.k !== 'remains';
  if (G.p.inv.includes(null)) return true;
  return stackable(it) && G.p.inv.some(x => x && x.k === it.k && x.t === it.t);
}
function addToPack(it, silent) {
  const p = G.p, inv = p.inv;
  if (it.k === 'gold') {
    let q = it.qty; if (p.god === 'kydyr') q = Math.round(q * 1.5);
    p.gold += q; if (!silent) msg(`You pick up ${q} silver coins.`, '#e8c050'); return true;
  }
  if (it.k === 'orb') { p.orb = true; msg('You lift the Ene Malka, the Mother Leaven, in its felt-wrapped pot. It is warm. Far below, something bellows. Now carry it home!', '#fff4c0'); return true; }
  if (it.k === 'tamga') { p.tamgas.push(it.t); msg(`You pick up the ${TAMGAS[it.t].n}. (${p.tamgas.length} of 4 clan tamgas; three open the sealed cleft under Manas Peak.)`, TAMGAS[it.t].c); return true; }
  if (stackable(it)) {
    const s = inv.findIndex(x => x && x.k === it.k && x.t === it.t);
    if (s >= 0) { inv[s].qty += it.qty; if (!silent) msg(`${letter(s)} - ${itemName(inv[s])}`); return true; }
  }
  const i = inv.indexOf(null);
  if (i < 0) { if (!silent) msg('Your pack is full.', '#e55a5a'); return false; }
  inv[i] = it;
  if (it.k === 'book') learnBook(it.t, silent);
  if (!silent) msg(`${letter(i)} - ${itemName(it)}`);
  return true;
}
function learnBook(t, silent) {
  const p = G.p; const added = BOOKS[t].spells.filter(s => !p.library.includes(s));
  p.library.push(...added);
  if (added.length && !silent) msg(`You add ${added.map(s => SPELLS[s].n).join(', ')} to your library. (M to memorise.)`, '#c0a0e0');
}
function consume(i) { const it = G.p.inv[i]; it.qty--; if (it.qty <= 0) G.p.inv[i] = null; }

// --- equipment ---
function canWield(it) {
  const S = SPc();
  if (it.k !== 'weapon') return "You can't wield that.";
  const Wp = WEAPONS[it.t];
  if (S.small && Wp.two && !Wp.shoot) return `The ${Wp.n} is too large for you.`;
  if (Wp.two && equipped('shield')) return `You need both hands for the ${Wp.n}. Take off your shield first.`;
  return null;
}
function wield(i) {
  const p = G.p, it = p.inv[i];
  if (!it) return;
  if (st('berserk')) return failMsg("You're too berserk to change weapons.");
  const cur = equipped('weapon');
  if (cur === it) { it.eq = null; msg('You are now empty-handed.'); return endTurn(10); }
  const err = canWield(it); if (err) return failMsg(err);
  if (cur) cur.eq = null;
  it.eq = 'weapon';
  msg(`${letter(i)} - ${itemName(it)} (weapon)`);
  if (p.god === 'janyl' && (it.brand === 'drain' || it.brand === 'vamp')) janylConduct('You feel St. Janyl turn her face from you.', 15);
  endTurn(10);
}
function canWear(it) {
  const S = SPc(); const A = ARMOURS[it.t];
  if (A.slot === 'feet' && S.noBoots) return 'You cannot wear boots.';
  if (A.slot === 'hands' && S.noGloves) return 'Gloves will not fit over your claws.';
  if (A.slot === 'body' && S.maxER !== undefined && A.er > S.maxER) return 'That will not fit over your scales.';
  if (A.slot === 'shield') { const w = equipped('weapon'); if (w && WEAPONS[w.t].two) return 'Your weapon needs both hands.'; if (S.small && it.t === 'chongkalkan') return 'That shield is too big for you.'; }
  return null;
}
function wear(i) {
  const it = G.p.inv[i]; if (!it || it.k !== 'armour') return failMsg("You can't wear that.");
  if (it.eq) return failMsg("You're already wearing that.");
  const err = canWear(it); if (err) return failMsg(err);
  const slot = ARMOURS[it.t].slot; const cur = equipped(slot); if (cur) cur.eq = null;
  it.eq = slot; msg(`You put on ${itemName(it)}.`);
  G.p.hp = Math.min(G.p.hp, maxHP());
  endTurn(slot === 'body' ? 50 : 10);
}
function takeOff(i) {
  const it = G.p.inv[i]; if (!it || !it.eq || it.k === 'weapon') return failMsg("You aren't wearing that.");
  it.eq = null; msg(`You take off ${itemName(it)}.`);
  G.p.hp = Math.min(G.p.hp, maxHP()); G.p.mp = Math.min(G.p.mp, maxMP());
  endTurn(it.k === 'armour' && ARMOURS[it.t].slot === 'body' ? 50 : 10);
}
function putOn(i) {
  const it = G.p.inv[i]; if (!it || (it.k !== 'ring' && it.k !== 'amulet')) return failMsg("You can't put that on.");
  if (it.eq) return failMsg('You are already wearing that.');
  if (it.k === 'amulet') { const c = equipped('amulet'); if (c) c.eq = null; it.eq = 'amulet'; }
  else if (!equipped('ringL')) it.eq = 'ringL'; else if (!equipped('ringR')) it.eq = 'ringR'; else { equipped('ringL').eq = null; it.eq = 'ringL'; }
  const was = identify(it);
  msg(`${was ? 'You put it on. It is ' : 'You put on '}${itemName(it)}.`, was ? '#e8c050' : undefined);
  endTurn(10);
}

// --- consumables ---
function quaff(i) {
  const it = G.p.inv[i]; if (!it || it.k !== 'potion') return failMsg("You can't drink that.");
  const p = G.p, k = it.t; const was = isKnown(it); identify(it); consume(i);
  switch (k) {
    case 'kymyz': p.hp = Math.min(maxHP(), p.hp + roll(3, 6) + 5); p.st.poison = 0; p.st.conf = 0; msg("Sour, fizzing mare's milk. You feel better.", '#7cdc8c'); break;
    case 'aksut': p.hp = Math.min(maxHP(), p.hp + Math.max(10, Math.ceil(maxHP() * .4)) + roll(2, 8)); msg('Holy white milk. Your wounds close.', '#ffffff'); break;
    case 'bozo': if (st('exh')) { msg('You are too exhausted to go berserk.'); break; } goBerserk(); break;
    case 'tulpar': addSt('haste', rr(20, 30)); msg('You feel as quick as the winged horse!', '#d8a640'); break;
    case 'arashan': p.mp = Math.min(maxMP(), p.mp + 10 + p.xl); msg('Hot-spring water. Your magic returns.', '#6f93d8'); break;
    case 'shoro': addSt('might', rr(30, 40)); msg('The fermented grain makes you feel mighty.', '#e8a060'); break;
    case 'chai': addSt('brill', rr(30, 40)); msg('Black tea, strong enough to stand a spoon in. Your mind sharpens.', '#a0c0ff'); break;
    case 'ayran': addSt('resist', rr(30, 40)); msg('Cold, salty ayran. You feel protected from the elements.', '#f0c870'); break;
    case 'tuman': addSt('invis', rr(25, 35)); msg('Mist rises from your skin. You fade from sight.', '#c0c0ff'); break;
    case 'oldkymyz': { const need = xpNeeded(p.xl + 1) - p.xp; msg('The kymyz is older than the clans. Wisdom floods through you.', '#ffd700'); gainXP(Math.max(need, 0) + 1); break; }
    case 'karasuu': msg('Black, bitter water. Your body twists.', '#86b84e'); mutate(rr(1, 3), 0.45); break;
    case 'tears': addSt('conf', rr(6, 10)); msg("Salt and cold. The world tilts. You are confused!", '#e58aa8'); break;
    case 'janylmilk': if (!cureMutation(false)) msg('The milk is sweet and nothing happens.'); else cureMutation(false); break;
  }
  if (!was) msg(`(That was ${POTIONS[k].n}: ${POTIONS[k].gl}.)`, '#8a8499');
  endTurn(10);
}
function read(i) {
  const it = G.p.inv[i]; if (!it || it.k !== 'scroll') return failMsg("You can't read that.");
  const p = G.p; if (st('berserk')) return failMsg("You're too berserk to read.");
  if (st('silence')) return failMsg('You cannot read aloud in this silence.');
  if (st('conf')) return failMsg("You're too confused to read.");
  const k = it.t; const was = isKnown(it); identify(it);
  if (k === 'verse') {
    const targets = p.inv.map((x, j) => [x, j]).filter(([x]) => x && !isKnown(x));
    consume(i);
    if (!was) msg(`(That was ${SCROLLS[k].n}: ${SCROLLS[k].gl}.)`, '#8a8499');
    if (!targets.length) { msg('The verse has nothing to name.'); return endTurn(10); }
    return openMenu({ title: 'Identify which item?', items: targets.map(([x, j]) => ({ key: letter(j), label: esc(itemName(x)), act: () => { closeMenu(); identify(x); msg(`${letter(j)} - ${itemName(x)}`, '#e8c050'); endTurn(10); } })), locked: true });
  }
  if (k === 'smith' || k === 'mark') {
    const w = equipped('weapon');
    consume(i);
    if (!w || w.art || w.staff) msg(w ? 'The blessing slides off.' : 'The blessing finds no weapon in your hand.');
    else if (k === 'smith') { if (w.ench >= 9) msg('Your weapon can take no more.'); else { w.ench++; msg(`Your ${WEAPONS[w.t].n} glows white for a moment.`, '#ffffff'); } }
    else { w.brand = pick(Object.keys(BRANDS).filter(b => !BRANDS[b].evil && b !== w.brand)); msg(`Your ${WEAPONS[w.t].n} takes ${BRANDS[w.brand].n.replace(/^of /, 'the mark of ')}.`, '#e0b070'); }
    if (!was) msg(`(That was ${SCROLLS[k].n}: ${SCROLLS[k].gl}.)`, '#8a8499');
    return endTurn(10);
  }
  consume(i);
  const lev = L();
  switch (k) {
    case 'wind': addSt('teleport', rr(3, 5)); msg('The wind begins to gather around you.', '#a4e4ff'); break;
    case 'leap': if (!was) msg('(That was ' + SCROLLS[k].n + ': blinking.)', '#8a8499'); return startTargeting({ kind: 'blink', range: 6, prompt: 'Leap where?', cb: (x, y) => { doBlink(x, y); endTurn(10); }, cancel: () => endTurn(10) });
    case 'sanjyra': revealMap(lev); msg('The genealogy of the land unrolls in your mind. You know this valley now.', '#d8a640'); break;
    case 'felt': { const ar = ['body', 'head', 'shield', 'cloak', 'hands', 'feet'].map(equipped).filter(Boolean); if (!ar.length) { msg('You are wearing nothing to bless.'); break; } const a = pick(ar); a.ench = Math.min(9, a.ench + 1); msg(`Your ${ARMOURS[a.t].n} thickens like new felt.`, '#ffffff'); break; }
    case 'crack': { let n = 0; for (const m of visibleHostiles()) if (!T_(m).fl.has('mindless')) { m.st.fear = rr(8, 14); m.state = 'flee'; n++; } msg(n ? 'A whip-crack like thunder! Your foes turn and run.' : 'A whip-crack echoes off the valley walls.', '#d8a640'); noise(G.p.x, G.p.y, 12); break; }
    case 'juniper': for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (Math.abs(dx) + Math.abs(dy) <= 3) addCloud(lev, p.x + dx, p.y + dy, 'fog', rr(8, 14)); msg('Juniper smoke billows around you.', '#9fd69f'); break;
    case 'stillness': addSt('silence', rr(15, 25)); lev.silenceAt = { x: p.x, y: p.y }; msg('A deep stillness falls. Nothing near you can make a sound.', '#8a8499'); break;
    case 'burning': for (const [dx, dy] of N8) addCloud(lev, p.x + dx, p.y + dy, 'fire', rr(5, 9), 'p'); msg('The grass around you bursts into flame!', '#ff8040'); break;
    case 'bellow': noise(p.x, p.y, 99); for (const m of lev.mons) if (!m.ally) { m.state = 'hunt'; m.tx = p.x; m.ty = p.y; } for (let j = 0; j < 2; j++) { const q = nearFree(lev, p.x, p.y, 4); if (q) spawnMonster(lev, pickMonsterType(lev), q.x, q.y, { awake: 1 }); } msg('A bull bellows from nowhere, and the whole valley hears it.', '#ff3348'); break;
    case 'torment': { for (const m of visibleHostiles()) if (!T_(m).fl.has('undead') && !T_(m).fl.has('demonic')) damageMonster(m, Math.floor(m.hp / 2), { src: 'p', silent: 1 }); if (!res('rn')) { p.hp = Math.max(1, Math.floor(p.hp / 2)); } msg("Morkhan's torment rolls over everything that lives!", '#b04ad0'); break; }
    case 'clans': { const n = rr(2, 3); for (let j = 0; j < n; j++) { const q = nearFree(lev, p.x, p.y, 2); if (q) { const kk = pick(['wolf', 'chongtor', 'goldeagle']); spawnMonster(lev, kk, q.x, q.y, { ally: 1, ttl: 40 }); } } msg('Riders of the clans answer the call!', '#e0b070'); break; }
    case 'kydyr': acquirement(); break;
  }
  if (!was) msg(`(That was ${SCROLLS[k].n}: ${SCROLLS[k].gl}.)`, '#8a8499');
  endTurn(10);
}
function acquirement() {
  const p = G.p;
  const opts = [['weapon', 'Weapon'], ['armour', 'Armour'], ['ring', 'Ring'], ['book', 'Book'], ['misc', 'Evocable'], ['gold', 'Silver']];
  openMenu({ title: "Kydyr's Gift: choose a kind of gift", locked: true, items: opts.map(([k, n], j) => ({ key: letter(j), label: n, act: () => {
    closeMenu(); let it;
    for (let tries = 0; tries < 30; tries++) { it = randomItem(L().absd + 8, true); if (it.k === k || (k === 'weapon' && it.k === 'weapon')) break; }
    if (k === 'gold') it = newItem('gold', 'gold', { qty: 300 + p.xl * 40 });
    if (k === 'book') it = newItem('book', pick(Object.keys(BOOKS).filter(b => BOOKS[b].spells.some(s => !p.library.includes(s)))) || 'sky');
    if (k === 'misc') it = newItem('misc', pick(Object.keys(MISC)));
    if (it.k === 'weapon' && !it.art) { it.ench = Math.max(it.ench, rr(2, 5)); }
    L().items.push({ x: p.x, y: p.y, it });
    msg(`An old man in a grey chapan sets down ${itemName(it)} and is gone.`, '#e8c050'); render();
  } })) });
}
function revealMap(lev) {
  for (let j = 0; j < W * H; j++) {
    if (lev.t[j] !== T.WALL) { lev.seen[j] = 1; continue; }
    const x = j % W, y = (j - x) / W;
    if (N8.some(([dx, dy]) => inb(x + dx, y + dy) && lev.t[idx(x + dx, y + dy)] !== T.WALL)) lev.seen[j] = 1;
  }
  for (const tr of lev.traps) tr.known = true;
}
function evoke(i) {
  const it = G.p.inv[i]; if (!it || (it.k !== 'wand' && it.k !== 'misc')) return failMsg("You can't evoke that.");
  if (it.ch <= 0) return failMsg(it.k === 'misc' ? 'It needs time to recharge. (It recharges as you gain experience.)' : 'It has no charges left.');
  exercise('evo');
  const pw = 15 + skf('evo') * 7;
  if (it.k === 'misc') {
    if (it.t === 'horn') { it.ch--; const n = 2 + Math.floor(skf('evo') / 8); for (let j = 0; j < n; j++) { const q = nearFree(L(), G.p.x, G.p.y, 2); if (q) spawnMonster(L(), 'chongtor', q.x, q.y, { ally: 1, ttl: 25 + skf('evo') * 2 }); } msg('You blow the horn, and chongtor horses gallop to your side!', '#e0b070'); return endTurn(10); }
    if (it.t === 'komuz') { it.ch--; let n = 0; for (const m of visibleHostiles()) if (cheb(m, G.p) <= 6 && hexCheck(m, pw * 1.5, 'sleep')) { m.state = 'sleep'; m.sleepT = rr(10, 20); n++; } msg(n ? `You play a slow küü. ${n} creature${n > 1 ? 's fall' : ' falls'} asleep.` : 'You play a slow küü. Nobody listens.', '#b8a0f0'); return endTurn(10); }
    if (it.t === 'yada') return startTargeting({ kind: 'smite', range: 8, prompt: 'Call the storm where?', cb: (x, y) => { it.ch--; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) addCloud(L(), x + dx, y + dy, 'cold', rr(6, 10), 'p'); msg('You raise the yada stone. Freezing rain lashes down!', '#7aa0ff'); endTurn(10); } });
  }
  const W_ = it.t;
  const fire = (o) => startTargeting(Object.assign({ kind: 'bolt', range: 8, prompt: `Aim the ${WANDS[W_].n}.` }, o));
  switch (W_) {
    case 'flame': return fire({ cb: (x, y) => { it.ch--; zap({ x: G.p.x, y: G.p.y, player: 1 }, { x, y }, { range: 8, dmg: roll(3, 6 + Math.floor(pw / 10)), elem: 'fire', col: '#ff8040', name: 'bolt of fire' }); endTurn(10); } });
    case 'lightning': return fire({ kind: 'beam', cb: (x, y) => { it.ch--; zap({ x: G.p.x, y: G.p.y, player: 1 }, { x, y }, { range: 9, beam: 1, dmg: roll(3, 7 + Math.floor(pw / 10)), elem: 'elec', col: '#9fd0ff', name: 'lightning' }); endTurn(10); } });
    case 'iceblast': return fire({ kind: 'ball', cb: (x, y) => { it.ch--; zap({ x: G.p.x, y: G.p.y, player: 1 }, { x, y }, { range: 8, explode: 1, dmg: roll(3, 6 + Math.floor(pw / 12)), elem: 'cold', col: '#7aa0ff', name: 'iceblast' }); endTurn(10); } });
    case 'para': case 'charm': case 'away': return fire({ cb: (x, y) => {
      it.ch--; const end = zap({ x: G.p.x, y: G.p.y, player: 1 }, { x, y }, { range: 8, col: W_ === 'para' ? '#e55a5a' : '#f5efe0', name: 'beam', hexOnly: 1 });
      const m = end && monAt(end.x, end.y);
      if (m) applyHex(m, W_ === 'para' ? 'para' : W_ === 'charm' ? 'charm' : 'tele', pw * 1.4); else msg('The beam hits nothing.');
      endTurn(10);
    } });
    case 'dig': return fire({ kind: 'beam', cb: (x, y) => { it.ch--; digBeam({ x: G.p.x, y: G.p.y }, { x, y }, 8); endTurn(10); } });
  }
}
function drop(i, qty) {
  const it = G.p.inv[i]; if (!it) return;
  if (it.eq && it.k !== 'weapon') return failMsg('Take it off first.');
  it.eq = null; G.p.inv[i] = null;
  L().items.push({ x: G.p.x, y: G.p.y, it }); msg(`You drop ${itemName(it)}.`);
  endTurn(10);
}

// --- describing items ---
function describeItem(it) {
  const out = [];
  if (it.art) out.push(esc(UNR(it.art).d));
  if (it.k === 'weapon') {
    const Wp = WEAPONS[it.t];
    if (Wp.shoot) out.push(`Bow damage ${Wp.shoot}, accuracy ${sgn(Wp.sacc || 0)}, base delay ${Wp.delay / 10}. Uses ${Wp.sk === 'bows' ? 'ok (arrows)' : 'sling stones or korgoshun'}. Skill: ${SK[Wp.sk].n}.`);
    else out.push(`Base damage ${Wp.dmg}, accuracy ${sgn(Wp.acc)}, base delay ${Wp.delay / 10}${Wp.two ? ', two-handed' : ''}. Skill: ${SK[Wp.sk].n}.`);
    out.push(`With your skill it attacks every ${(weaponDelay(it) / 10).toFixed(1)} turns.`);
    if (it.brand) out.push(BRANDS[it.brand].d);
    if (it.staff) out.push(`Strengthens ${SCHOOL_NAME(STAVES[it.staff].school)} spells by half${STAVES[it.staff].res ? ' and grants a resistance' : ''}.`);
  }
  if (it.k === 'armour') {
    const A = ARMOURS[it.t];
    if (A.sh) out.push(`Shield. Base block ${A.sh}, encumbrance ${A.er}.`); else out.push(`Base AC ${A.ac}, encumbrance ${A.er}. Slot: ${A.slot}.`);
    if (it.ego) out.push(ARMOUR_EGOS[it.ego].d);
    if (A.res) out.push(A.res.rf > 0 ? 'Fire resistance, cold vulnerability.' : 'Cold resistance, fire vulnerability.');
  }
  if (it.k === 'missile') { const M = MISSILES[it.t]; out.push(M.launcher ? `Fired from a ${M.launcher === 'bows' ? 'jaa' : 'salyng'}${M.throwDmg ? ', or thrown' : ''}.` : `Thrown with f or the Fire button. Damage ${M.throwDmg}.${M.poison ? ' Poisons.' : ''}`); }
  if (it.k === 'potion' && !isKnown(it)) out.push('You have not drunk one of these yet.');
  if (it.k === 'scroll' && !isKnown(it)) out.push('You have not read one of these yet.');
  if (it.k === 'ring' && !isKnown(it)) out.push('Put it on to learn what it does.');
  if (it.k === 'amulet' && !isKnown(it)) out.push('Put it on to learn what it does.');
  if (it.k === 'book') out.push('Spells: ' + BOOKS[it.t].spells.map(s => `${SPELLS[s].n} (level ${SPELLS[s].lvl})`).join(', ') + '.');
  if (it.k === 'wand') out.push(`Charges: ${it.ch}. Power grows with Evocations skill.`);
  if (it.k === 'misc') out.push(`${MISC[it.t].gl}. Recharges as you gain experience.`);
  if (it.k === 'amulet' && isKnown(it) && it.t === 'janyl') out.push('Saves your life once, then crumbles.');
  if (it.k === 'amulet' && isKnown(it) && it.t === 'guard') out.push('Half of the damage you take is drawn from your magic instead.');
  if (it.k === 'amulet' && isKnown(it) && it.t === 'faith') out.push('Your patron grants you piety faster.');
  return out.join('<br>');
}

function itemValue(it) {
  let v = 10;
  if (it.k === 'weapon') v = (WEAPONS[it.t].v || 30) + it.ench * 30 + (it.brand ? 120 : 0) + (it.staff ? 250 : 0) + (it.art ? 800 : 0);
  if (it.k === 'armour') v = (ARMOURS[it.t].v || 30) + it.ench * 30 + (it.ego ? 120 : 0) + (it.art ? 800 : 0);
  if (it.k === 'potion') v = POTIONS[it.t].v * it.qty;
  if (it.k === 'scroll') v = SCROLLS[it.t].v * it.qty;
  if (it.k === 'missile') v = Math.ceil(MISSILES[it.t].v * it.qty);
  if (it.k === 'wand') v = WANDS[it.t].v + it.ch * 15;
  if (it.k === 'ring') v = 200 + (it.ench || 0) * 50;
  if (it.k === 'amulet') v = it.t === 'janyl' ? 800 : 350;
  if (it.k === 'book') v = 60 + BOOKS[it.t].spells.reduce((a, s) => a + SPELLS[s].lvl * 30, 0);
  if (it.k === 'misc') v = MISC[it.t].v;
  return Math.max(1, Math.round(v));
}
function makeShop(x, y, absd) {
  const ty = wpick([['general', 4], ['smith', 2], ['saddler', 2], ['tabyp', 2], ['books', 2], ['zerger', 1]]);
  const S = SHOP_TYPES[ty]; const stock = [];
  for (let k = 0; k < rr(6, 10); k++) {
    let it;
    for (let tries = 0; tries < 40; tries++) { it = randomItem(absd + 2, chance(.3)); if (it.k !== 'gold' && (!S.kinds || S.kinds.includes(it.k))) break; }
    if (it.k === 'gold') continue;
    stock.push({ it, price: Math.round(itemValue(it) * (1 + Math.random() * .4)) });
  }
  return { x, y, ty, name: `${pick(S.owner)}'s ${S.n}`, stock };
}
