"use strict";
// The player: derived stats, skills, experience, statuses and mutations.

const SPc = () => SPECIES[G.p.sp], BGc = () => BACKGROUNDS[G.p.bg];
const sk = id => skillLevelFromPts(G.p.sk[id] || 0);
const skf = id => skillFrac(G.p.sk[id] || 0);
const st = k => G.p.st[k] || 0;
const mut = k => G.p.muts[k] || 0;
const equipped = slot => G.p.inv.find(i => i && i.eq === slot) || null;
const wornItems = () => G.p.inv.filter(i => i && i.eq);
function aptOf(id) { return (SPc().apt[id] || 0); }

// Sum of a property over everything worn or wielded.
function prop(name) {
  let s = 0;
  for (const it of wornItems()) { const pr = itemProps(it); if (pr[name]) s += pr[name]; }
  return s;
}

function stat(s) {
  let v = G.p[s] + prop(s);
  if (s === 'str') v += mut('strong') * 2 - mut('weak') * 2 + (st('might') ? 5 : 0);
  if (s === 'int') v += mut('clever') * 2 - mut('dopey') * 2 + (st('brill') ? 5 : 0);
  if (s === 'dex') v += mut('agile') * 2 - mut('clumsy') * 2;
  return v;
}

function maxHP() {
  const p = G.p, fi = skf('fighting');
  let h = (10 + p.xl * 4 + fi * 2.5 + p.xl * fi * 0.08) * (1 + SPc().hp * 0.1);
  h *= 1 + (mut('robust') - mut('frail')) * 0.1;
  if (st('berserk')) h *= 1.5;
  return Math.max(5, Math.floor(h));
}
function maxMP() {
  const p = G.p;
  let m = (p.xl * 0.7 + skf('spellcasting') * 1.4 + skf('invo') * 0.6 + skf('evo') * 0.3) * (1 + SPc().mp * 0.15) + 2;
  return Math.max(0, Math.floor(m + prop('mp') * 1));
}
function bodyER() { const b = equipped('body'); return b ? ARMOURS[b.t].er : 0; }
function shieldER() { const s = equipped('shield'); return s ? ARMOURS[s.t].er : 0; }
function AC() {
  let a = SPc().ac || 0;
  if (SPc().scales) a += Math.floor(G.p.xl / 4) + 1;
  const arm = skf('armour');
  for (const it of wornItems()) {
    if (it.k !== 'armour') continue;
    const A = ARMOURS[it.t];
    if (A.slot === 'shield') continue;
    a += A.slot === 'body' ? A.ac * (1 + arm / 22) : A.ac;
    a += it.ench;
  }
  a += prop('ac') + mut('thick') - mut('thin');
  const w = equipped('weapon'); if (w && w.brand === 'prot') a += 5;
  if (st('hoarfrost')) a += G.p.hoarAC || 4;
  if (st('ward')) a += 6;
  if (st('corr')) a -= 4;
  return Math.max(0, Math.round(a));
}
function encumbrance() { return Math.max(0, bodyER() - skf('armour') * 0.5 - (stat('str') - 10) * 0.25); }
function EV() {
  let e = 7 + stat('dex') * 0.6 + skf('dodging') * 0.9 * (stat('dex') / 12) + (SPc().ev || 0);
  e -= encumbrance() * 0.7;
  e -= Math.max(0, shieldER() * 1.3 - skf('shields') * 0.4);
  e += prop('ev');
  if (SPc().small) e += 2;
  if (st('para') || st('net')) e = 1;
  return Math.max(1, Math.round(e));
}
function SH() {
  const s = equipped('shield'); if (!s) return 0;
  let v = ARMOURS[s.t].sh + skf('shields') * 0.6 + stat('dex') * 0.2 + s.ench + prop('sh');
  if (st('ward')) v += 6;
  return Math.max(0, Math.round(v));
}
function res(type) {
  // rf rc rp rn re
  let r = (SPc().res && SPc().res[type[1]]) || 0;
  r += prop(type);
  if (type === 'rf') r += mut('rf'); if (type === 'rc') r += mut('rc'); if (type === 'rp') r += mut('rp');
  if (st('resist') && ['rf', 'rc', 'rp', 're', 'rn'].includes(type)) r += 1;
  if (type === 'rc' && st('hoarfrost')) r += 1;
  if (type === 're' && G.p.god === 'tengri' && stars() >= 2) r += 1;
  if (type === 'rp' && st('resist')) r = Math.max(r, 1);
  return clamp(r, -1, 3);
}
const seeInvis = () => !!(SPc().sinv || prop('sinv') || mut('eyes'));
function willpower() { return G.p.xl * 4 + (SPc().will || 0) + prop('will') * 40 + (st('resist') ? 20 : 0); }
function stealth() {
  let s = stat('dex') * 3 + skf('stealth') * 15 + (SPc().small ? 60 : 0) + prop('stealth') * 40 - bodyER() * 3 - mut('stink') * 30;
  if (G.p.sp === 'kichi') s += 40; if (G.p.sp === 'dev' || G.p.sp === 'at') s -= 20;
  if (st('invis')) s += 80; if (st('berserk')) s -= 100;
  return Math.max(0, s);
}
function sightRadius() {
  const th = curTheme();
  return th.sight || 8;
}
function moveCost() {
  let c = SPc().move || 10;
  if (prop('run')) c -= 2;
  if (st('swift')) c = Math.round(c * 0.6);
  return Math.max(4, c);
}
function regenRate() {
  // HP per 10 aut.
  let r = 0.06 + maxHP() * 0.0065;
  r *= SPc().regen || 1;
  r *= 1 + mut('regen') * 0.5; r *= 1 - mut('slowheal') * 0.4;
  if (prop('regen')) r *= 2.2;
  if (st('warmth')) r *= 3;
  if (st('poison')) r = 0;
  return r;
}
function mpRegenRate() {
  let r = 0.05 + maxMP() * 0.012;
  if (prop('mregen')) r *= 2.2;
  return r;
}

// --- experience and skills ---
function xpNeeded(L) { return Math.round(xpForLevel(L) * Math.pow(2, -SPc().xp / 4)); }
function gainXP(x) {
  const p = G.p; if (x <= 0) return;
  p.xp += x; trainSkills(x);
  for (const it of p.inv) if (it && it.k === 'misc' && it.ch < MISC[it.t].max) { it.xpc = (it.xpc || 0) + x; const need = 60 + p.xl * 10; if (it.xpc >= need) { it.xpc -= need; it.ch++; msg(`Your ${MISC[it.t].n} has recharged.`, '#8fd0e8'); } }
  while (p.xl < 27 && p.xp >= xpNeeded(p.xl + 1)) {
    const oldMax = maxHP(), oldMp = maxMP();
    p.xl++;
    msg(`Welcome to experience level ${p.xl}!`, '#7cdc8c');
    p.hp += Math.max(0, maxHP() - oldMax); p.mp += Math.max(0, maxMP() - oldMp);
    if (p.xl % 3 === 0) G.statUps = (G.statUps || 0) + 1;
    if (p.sp === 'ajdaha' && p.xl % 4 === 0) msg('Your scales grow thicker.', '#43b86f');
    if (p.bg === 'berkut') { const e = L().mons.find(m => m.k === 'goldeagle' && m.perm && !m.dead); if (e) { e.o = Object.assign(e.o || {}, eagleStats()); e.mhp = e.o.hp; } }
  }
}
function trainSkills(x) {
  const p = G.p;
  const tr = SKILLS.filter(s => (p.train[s.id] || 0) > 0 && (p.sk[s.id] || 0) < SKILL_TOTAL[27]);
  if (!tr.length) return;
  const wsum = tr.reduce((a, s) => a + p.train[s.id], 0);
  for (const s of tr) {
    const before = sk(s.id);
    p.sk[s.id] = (p.sk[s.id] || 0) + x * p.train[s.id] / wsum * aptMult(aptOf(s.id)) * 1.5;
    const after = sk(s.id);
    if (after > before) msg(`Your ${s.n} skill increases to level ${after}!`, '#7cdc8c');
  }
}
// Auto-training: using a skill switches it on (unless you turned it off yourself).
function exercise(id) { const p = G.p; if (!p.train[id] && !p.manualOff[id] && p.autoTrain) p.train[id] = 1; }

// --- statuses ---
function addSt(k, n) { G.p.st[k] = Math.max(st(k), n); }
const STATUS_INFO = {
  poison: ['Pois', '#86b84e'], haste: ['Fast', '#d8a640'], berserk: ['Berserk', '#e55a5a'], slow: ['Slow', '#a9a3b8'], conf: ['Conf', '#e58aa8'],
  para: ['Para', '#e55a5a'], exh: ['Exh', '#8a8499'], might: ['Might', '#e8a060'], brill: ['Brill', '#a0c0ff'], resist: ['Resist', '#f0c870'],
  invis: ['Invis', '#c0c0ff'], hoarfrost: ['Ice', '#a8c8ff'], swift: ['Swift', '#d8c060'], ward: ['Ward', '#ffffff'], hero: ['Hero', '#e0b070'],
  warmth: ['Warm', '#f0c0d8'], storm: ['Storm', '#7ab0ff'], silence: ['Sil', '#8a8499'], net: ['Held', '#c8b898'], corr: ['Corr', '#b0b060'],
  teleport: ['Tele', '#a4e4ff'], fear: ['Fear', '#d07a7a'],
};

function mutate(n, goodBias = 0.5) {
  const p = G.p;
  for (let k = 0; k < n; k++) {
    const good = chance(goodBias);
    const opts = Object.keys(MUTS).filter(m => !!MUTS[m].good === good && mut(m) < MUTS[m].max);
    if (!opts.length) continue;
    const m = pick(opts);
    p.muts[m] = mut(m) + 1;
    msg(good ? `You feel a change: ${MUTS[m].n}. ${MUTS[m].d(p.muts[m])}` : `You feel a bad change: ${MUTS[m].n}. ${MUTS[m].d(p.muts[m])}`, good ? '#7cdc8c' : '#e58aa8');
  }
  p.hp = Math.min(p.hp, maxHP());
}
function cureMutation(badOnly) {
  const p = G.p; const opts = Object.keys(p.muts).filter(m => p.muts[m] > 0 && (!badOnly || !MUTS[m].good));
  if (!opts.length) return false;
  const m = pick(opts); p.muts[m]--; if (!p.muts[m]) delete p.muts[m];
  msg(`Your ${MUTS[m].n} fades.`, '#7cdc8c'); return true;
}

function eagleStats() { const xl = G.p.xl; const hd = 3 + Math.floor(xl / 2); return { hd, hp: 10 + xl * 4, dmg: 4 + Math.floor(xl / 2) }; }
