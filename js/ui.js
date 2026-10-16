"use strict";
// Rendering, the sidebar, menus and screens.

const cv = document.getElementById('map'), ctx = cv.getContext('2d');
const ov = document.getElementById('ov');
const lookbox = document.getElementById('lookbox');
let cell = { w: 10, h: 18, fs: 16 };
let ui = null;   // open menu
let tgt = null;  // targeting state

function resize() {
  const r = cv.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
  cv.width = Math.max(1, Math.floor(r.width * dpr)); cv.height = Math.max(1, Math.floor(r.height * dpr));
  const fs = r.width < 520 ? 13 : r.width < 900 ? 15 : 17;
  cell = { fs, w: Math.ceil(fs * 0.62), h: Math.ceil(fs * 1.2) };
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); render();
}
function viewOrigin() {
  const r = cv.getBoundingClientRect(); const cols = Math.floor(r.width / cell.w), rows = Math.floor(r.height / cell.h);
  const fx = tgt ? tgt.x : G.p.x, fy = tgt ? tgt.y : G.p.y;
  const ox = cols >= W ? -Math.floor((cols - W) / 2) : clamp(fx - Math.floor(cols / 2), 0, W - cols);
  const oy = rows >= H ? -Math.floor((rows - H) / 2) : clamp(fy - Math.floor(rows / 2), 0, H - rows);
  return { ox, oy, cols, rows };
}
function terrainGlyph(lev, i) {
  const t = lev.t[i], th = themeFor(lev.br, lev.d);
  switch (t) {
    case T.FLOOR: return ['.', th.floor]; case T.WALL: return ['#', th.wall]; case T.TREE: return ['♣', th.tree];
    case T.DEEP: return ['≈', '#3f6fc8']; case T.SHALLOW: return ['~', '#6fb0d8']; case T.DOWN: return ['>', '#f5efe0'];
    case T.UP: return ['<', '#f5efe0']; case T.MAZAR: return ['_', '#ffffff']; case T.USED: return ['_', '#8a8499'];
    case T.FELT: return ['#', '#e8e0cc']; case T.DOORC: return ['+', '#d8c8a0']; case T.DOORO: return ["'", '#d8c8a0'];
    case T.STONE: return ['#', th.stone || '#b8a888']; case T.ALTAR: return ['_', GODS[lev.altars[i]] ? GODS[lev.altars[i]].c : '#fff'];
    case T.SHOP: return ['¤', '#e8c050'];
    case T.BRANCH: { const e = lev.entries.find(e => idx(e.x, e.y) === i); return ['>', e ? BRANCHES[e.to].c : '#fff']; }
    case T.STATUE: return ['Ω', '#c8c0b0'];
  }
  return ['?', '#f0f'];
}
function render() {
  if (!G) { const r = cv.getBoundingClientRect(); ctx.fillStyle = '#0a0910'; ctx.fillRect(0, 0, r.width, r.height); return; }
  if (G.noRender) return;
  const r = cv.getBoundingClientRect(); const { ox, oy, cols, rows } = viewOrigin();
  const p = G.p, lev = L();
  ctx.fillStyle = '#0a0910'; ctx.fillRect(0, 0, r.width, r.height);
  const font = w => `${w} ${cell.fs}px 'IBM Plex Mono',ui-monospace,Consolas,monospace`;
  ctx.font = font(400); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const itemAt = {}; for (const o of lev.items) itemAt[idx(o.x, o.y)] = o.it;
  const trapAt = {}; for (const tr of lev.traps) if (tr.known) trapAt[idx(tr.x, tr.y)] = tr;
  const cloudAtI = {}; for (const c of lev.clouds) cloudAtI[idx(c.x, c.y)] = c;
  const snow = lev.br === 'blizzard';
  for (let sy = 0; sy < rows; sy++) for (let sx = 0; sx < cols; sx++) {
    const x = sx + ox, y = sy + oy; if (!inb(x, y)) continue;
    const i = idx(x, y); if (!lev.seen[i]) continue;
    const v = vis[i];
    let [g, c] = terrainGlyph(lev, i);
    if (trapAt[i]) [g, c] = ['^', TRAPS[trapAt[i].ty].c];
    if (itemAt[i]) [g, c] = itemGlyph(itemAt[i]);
    const px = sx * cell.w + cell.w / 2, py = sy * cell.h + cell.h / 2;
    if (v && cloudAtI[i]) { ctx.fillStyle = CLOUDS[cloudAtI[i].ty].c; ctx.globalAlpha = .28; ctx.fillRect(sx * cell.w, sy * cell.h, cell.w, cell.h); ctx.globalAlpha = 1; if (!itemAt[i]) { g = '§'; c = CLOUDS[cloudAtI[i].ty].c; } }
    if (!v) ctx.globalAlpha = .33;
    else if (snow && Math.random() < .03) { g = '*'; c = '#c8d3ff'; }
    ctx.fillStyle = c; ctx.fillText(g, px, py); ctx.globalAlpha = 1;
  }
  if (lev.sanct && G.turn < lev.sanct.until) { ctx.strokeStyle = '#f0c0d8'; ctx.lineWidth = 1; const s = lev.sanct; ctx.strokeRect((s.x - 3 - ox) * cell.w + .5, (s.y - 3 - oy) * cell.h + .5, cell.w * 7, cell.h * 7); }
  for (const m of lev.mons) {
    if (m.dead || !vis[idx(m.x, m.y)] || !monVisible(m)) continue;
    const sx = m.x - ox, sy = m.y - oy; if (sx < 0 || sy < 0 || sx >= cols || sy >= rows) continue;
    const Tm = T_(m);
    if (m.ally) { ctx.fillStyle = '#1d3346'; ctx.fillRect(sx * cell.w, sy * cell.h, cell.w, cell.h); }
    else if (Tm.fl.has('unique')) { ctx.fillStyle = '#3a1424'; ctx.fillRect(sx * cell.w, sy * cell.h, cell.w, cell.h); }
    ctx.fillStyle = Tm.c; ctx.font = font(600); ctx.fillText(Tm.g, sx * cell.w + cell.w / 2, sy * cell.h + cell.h / 2); ctx.font = font(400);
    if (m.state === 'sleep') { ctx.fillStyle = '#6f93d8'; ctx.fillRect(sx * cell.w + 1, sy * cell.h + cell.h - 2, cell.w - 2, 1.5); }
    else if (m.st.fear) { ctx.fillStyle = '#d07a7a'; ctx.fillRect(sx * cell.w + 1, sy * cell.h + cell.h - 2, cell.w - 2, 1.5); }
  }
  for (const f of fx) { const sx = f.x - ox, sy = f.y - oy; ctx.fillStyle = f.col; ctx.globalAlpha = .55; ctx.fillRect(sx * cell.w, sy * cell.h, cell.w, cell.h); ctx.globalAlpha = 1; }
  if (tgt) renderTargeting(ox, oy);
  const sx = p.x - ox, sy = p.y - oy;
  ctx.fillStyle = '#2b2540'; ctx.fillRect(sx * cell.w, sy * cell.h, cell.w, cell.h);
  ctx.fillStyle = G.over && !G.won ? '#e55a5a' : st('invis') ? '#9a9ac8' : '#fffaf0'; ctx.font = font(700);
  ctx.fillText('@', sx * cell.w + cell.w / 2, sy * cell.h + cell.h / 2);
  renderSide(); renderLog();
}
function targetPath(t) {
  const p = G.p;
  if (t.kind === 'smite' || t.kind === 'blink' || t.kind === 'look') return [];
  const cells = rayCells(p, { x: t.x, y: t.y }, t.range, false);
  if (t.kind === 'beam') return cells;
  const out = []; for (const c of cells) { out.push(c); if (monAt(c.x, c.y)) break; }
  return out;
}
function renderTargeting(ox, oy) {
  const t = tgt;
  for (const c of targetPath(t)) { ctx.fillStyle = '#d8a640'; ctx.globalAlpha = .22; ctx.fillRect((c.x - ox) * cell.w, (c.y - oy) * cell.h, cell.w, cell.h); ctx.globalAlpha = 1; }
  const rad = t.radius || 0;
  if (rad) { ctx.strokeStyle = '#e8a060'; ctx.strokeRect((t.x - rad - ox) * cell.w + .5, (t.y - rad - oy) * cell.h + .5, cell.w * (rad * 2 + 1), cell.h * (rad * 2 + 1)); }
  const far = t.range && cheb(t, G.p) > t.range && t.kind !== 'look';
  ctx.strokeStyle = far ? '#e55a5a' : '#ffd27a'; ctx.lineWidth = 2;
  ctx.strokeRect((t.x - ox) * cell.w + 1, (t.y - oy) * cell.h + 1, cell.w - 2, cell.h - 2); ctx.lineWidth = 1;
}

// --- sidebar ---
function threatColor(m) { const d = T_(m).hd - G.p.xl; return d >= 4 ? '#e55a5a' : d >= 1 ? '#e5c55a' : d >= -3 ? '#e8e2d3' : '#8a8499'; }
function renderSide() {
  const p = G.p, S = SPc(), B = BGc(), mh = maxHP(), mm = maxMP();
  const w = equipped('weapon'), qi = quiverItem();
  const next = p.xl >= 27 ? 100 : Math.floor(100 * (p.xp - xpNeeded(p.xl)) / Math.max(1, xpNeeded(p.xl + 1) - xpNeeded(p.xl)));
  const sts = Object.keys(p.st).filter(k => p.st[k] > 0 && STATUS_INFO[k]).map(k => `<b style="color:${STATUS_INFO[k][1]}">${STATUS_INFO[k][0]}</b>`);
  if (p.orb) sts.push('<b style="color:#fff4c0">Leaven</b>');
  if (st('poison')) sts.push(`<b style="color:#86b84e">${st('poison')} poison</b>`);
  const hs = visibleHostiles().slice(0, 9);
  const allies = L().mons.filter(m => m.ally && !m.dead && canSee(m.x, m.y)).length;
  const godLine = p.god ? `<span style="color:${GODS[p.god].c}">${GODS[p.god].n}</span> ${p.god === 'kydyr' ? '' : '<span class="gold">' + '*'.repeat(stars()) + '</span><span class="dim">' + '.'.repeat(6 - stars()) + '</span>'}` : '<span class="dim">no patron</span>';
  const pen = Object.keys(p.penance).filter(g => p.penance[g] > 0);
  document.getElementById('side').innerHTML = `
  <div><div class="who">${esc(p.name)}</div><div class="sub">${S.n} ${B.n}</div><div class="sub">${godLine}${pen.length ? ` <span style="color:#e55a5a">(wrath: ${pen.map(g => GODS[g].n).join(', ')})</span>` : ''}</div></div>
  <div><div class="meter"><span>HP</span><i><b style="width:${clamp(100 * p.hp / mh, 0, 100)}%;${p.hp < mh * .3 ? 'background:var(--crimson)' : ''}"></b></i><span>${Math.max(0, p.hp)}/${mh}</span></div>
  <div class="meter mp"><span>MP</span><i><b style="width:${mm ? clamp(100 * p.mp / mm, 0, 100) : 0}%"></b></i><span>${p.mp}/${mm}</span></div></div>
  <div class="kv"><div><span>AC</span> ${AC()}</div><div><span>Str</span> ${stat('str')}</div><div><span>XL</span> ${p.xl}</div>
  <div><span>EV</span> ${EV()}</div><div><span>Int</span> ${stat('int')}</div><div><span>Next</span> ${clamp(next, 0, 100)}%</div>
  <div><span>SH</span> ${SH()}</div><div><span>Dex</span> ${stat('dex')}</div><div><span>$</span> ${p.gold}</div></div>
  <div><div class="place" style="color:${BRANCHES[L().br].c}">${levelName()}: ${esc(placeName())}</div><div class="sub">Turn ${Math.floor(G.turn)}${p.tamgas.length ? ' · Tamgas ' + p.tamgas.map(t => `<span style="color:${TAMGAS[t].c}">}</span>`).join('') : ''}</div></div>
  <div class="eqblock"><div class="eqline">Wp: <em>${w ? esc(itemName(w)) : (SPc().claws ? 'claws' : 'bare hands')}</em></div>${qi !== null ? `<div class="eqline">Qv: <em>${esc(itemName(p.inv[qi]))}</em></div>` : ''}</div>
  ${sts.length ? `<div class="status">${sts.join('')}</div>` : ''}
  <div class="mons">${hs.length ? hs.map(m => `<div><span class="g" style="color:${T_(m).c}">${T_(m).g}</span><span style="color:${threatColor(m)}">${esc(T_(m).n)}</span> <span class="dim">(${m.state === 'sleep' ? 'asleep' : m.st.fear ? 'fleeing' : m.st.para ? 'paralysed' : healthDesc(m)})</span></div>`).join('') : '<div class="dim">No foes in sight.</div>'}${allies ? `<div class="dim">${allies} all${allies > 1 ? 'ies' : 'y'} with you</div>` : ''}</div>`;
}
function healthDesc(m) { const f = m.hp / m.mhp; return f >= 1 ? 'unhurt' : f > .75 ? 'lightly wounded' : f > .5 ? 'moderately wounded' : f > .25 ? 'heavily wounded' : f > .1 ? 'severely wounded' : 'almost dead'; }
function renderLog() {
  const el = document.getElementById('log'); const ms = G.msgs.slice(-8);
  const lastT = ms.length ? ms[ms.length - 1].turn : 0;
  el.innerHTML = ms.map(m => `<div class="${m.turn < lastT - 0.01 ? 'old' : ''}" style="color:${m.c}">${esc(m.t)}${m.n > 1 ? ` <span class="dim">x${m.n}</span>` : ''}</div>`).join('');
}

// --- menus ---
function openMenu(m) {
  ui = m; stopRun();
  ov.innerHTML = `<div class="card${m.wide ? ' wide' : ''}" role="dialog"><h2>${m.title}</h2>${m.text ? `<div class="mtext">${m.text}</div>` : ''}<div class="opts">${(m.items || []).map((it, i) => it.header ? `<h3>${it.header}</h3>` : `<div class="opt${it.off ? ' off' : ''}" data-i="${i}"><span class="k">${esc(it.key.length === 1 ? it.key + ')' : it.key)}</span><span>${it.label}${it.sub ? `<small>${it.sub}</small>` : ''}</span></div>`).join('')}</div>${m.foot || ''}${m.locked ? '' : '<p class="dim">Esc to close.</p>'}</div>`;
  ov.hidden = false;
  ov.querySelectorAll('.opt').forEach(el => el.onclick = () => { const it = m.items[+el.dataset.i]; if (!it.off && it.act) it.act(); });
  if (m.after) m.after();
}
function closeMenu() { ui = null; ov.hidden = true; ov.innerHTML = ''; if (G) render(); }

function inventoryMenu(title, filter, onPick, empty) {
  const p = G.p, items = [];
  for (const cls of ITEM_CLASS_ORDER) {
    const rows = p.inv.map((it, i) => [it, i]).filter(([it]) => it && it.k === cls && filter(it));
    if (!rows.length) continue;
    items.push({ header: ITEM_CLASS_NAME[cls] });
    for (const [it, i] of rows) { const [g, c] = itemGlyph(it); items.push({ key: letter(i), label: `<span style="color:${c}">${esc(g)}</span> ${esc(itemName(it))}${it.eq ? ` <span class="dim">(${SLOT_NAMES[it.eq]})</span>` : ''}`, act: () => { closeMenu(); onPick(i); } }); }
  }
  if (!items.length) return failMsg(empty || 'You have nothing suitable.');
  const used = p.inv.filter(Boolean).length;
  openMenu({ title, text: `<span class="dim">${used}/52 slots. ${p.gold} silver.</span>`, items, wide: true });
}
function itemActions(i) {
  const p = G.p, it = p.inv[i]; if (!it) return;
  const A = []; const go = f => () => { closeMenu(); f(i); };
  if (it.k === 'weapon') A.push(it.eq ? { key: 'w', label: 'Unwield', act: go(wield) } : { key: 'w', label: 'Wield', act: go(wield) });
  if (it.k === 'armour') A.push(it.eq ? { key: 'T', label: 'Take off', act: go(takeOff) } : { key: 'W', label: 'Wear', act: go(wear) });
  if (it.k === 'ring' || it.k === 'amulet') A.push(it.eq ? { key: 'R', label: 'Remove', act: go(takeOff) } : { key: 'P', label: 'Put on', act: go(putOn) });
  if (it.k === 'potion') A.push({ key: 'q', label: 'Quaff', act: go(quaff) });
  if (it.k === 'scroll') A.push({ key: 'r', label: 'Read', act: go(read) });
  if (it.k === 'wand' || it.k === 'misc') A.push({ key: 'v', label: 'Evoke', act: go(evoke) });
  if (it.k === 'missile') A.push({ key: 'Q', label: 'Quiver (fire with f)', act: () => { p.quiver = i; closeMenu(); msg(`Quivered: ${itemName(it)}.`); } });
  if (it.k === 'book') A.push({ key: 'M', label: 'Memorise spells from your library', act: () => { closeMenu(); memoriseMenu(); } });
  A.push({ key: 'd', label: 'Drop', act: () => { closeMenu(); it.dropped = 1; drop(i); } });
  openMenu({ title: `${letter(i)} - ${esc(itemName(it))}`, text: describeItem(it), items: A });
}
function statPrompt() {
  openMenu({ title: 'Your experience brings growth', text: 'Choose an attribute to raise by one.', locked: true, items: [
    { key: 's', label: 'Strength', sub: 'Melee and thrown damage, health, heavy armour', act: () => bump('str') },
    { key: 'i', label: 'Intelligence', sub: 'Spell power and spell success', act: () => bump('int') },
    { key: 'd', label: 'Dexterity', sub: 'Accuracy, evasion, shields, stealth', act: () => bump('dex') }] });
}
function bump(s) { G.p[s]++; G.statUps--; msg(`You feel ${s === 'str' ? 'stronger' : s === 'int' ? 'cleverer' : 'more agile'}.`, '#7cdc8c'); closeMenu(); if (G.statUps > 0) statPrompt(); }

function skillsScreen() {
  const p = G.p;
  const state = s => p.train[s] === 2 ? '<b class="gold">focus</b>' : p.train[s] === 1 ? 'train' : '<span class="dim">off</span>';
  const items = []; let grp = null;
  SKILLS.forEach((s, j) => {
    if (s.grp !== grp) { grp = s.grp; items.push({ header: grp }); }
    const a = aptOf(s.id);
    items.push({ key: letter(j), label: `<span class="sk">${s.n}</span> <span class="num">${skf(s.id).toFixed(1)}</span> <span class="apt ${a > 0 ? 'pos' : a < 0 ? 'neg' : ''}">${sgn(a)}</span> <span class="num">${state(s.id)}</span>`,
      act: () => { const v = p.train[s.id] || 0; p.train[s.id] = (v + 1) % 3; if (p.train[s.id] === 0) p.manualOff[s.id] = 1; else delete p.manualOff[s.id]; skillsScreen(); } });
  });
  items.push({ key: '/', label: `Automatic training: <b>${p.autoTrain ? 'on' : 'off'}</b>`, sub: 'When on, skills you use switch on by themselves.', act: () => { p.autoTrain = !p.autoTrain; skillsScreen(); } });
  openMenu({ title: 'Skills', text: 'Experience is shared between the skills you train. Press a letter to cycle off → train → focus (double share). Aptitude (+/-) changes how fast a skill grows.', items, wide: true, cols: 1 });
}
function spellsScreen() {
  const p = G.p;
  if (!p.spells.length) return failMsg("You don't know any spells." + (p.library.length ? ' (M to memorise from your library.)' : ''));
  openMenu({ title: 'Your spells', text: `Spell levels: ${spellLevelsUsed()}/${spellLevelsMax()}. MP ${p.mp}/${maxMP()}.`, wide: true,
    items: p.spells.map((s, j) => { const S = SPELLS[s]; return { key: letter(j), label: `${S.n} <span class="dim">L${S.lvl} ${S.sch.map(SCHOOL_NAME).join('/')} · ${spellFail(s)}% fail · power ${spellPower(s)}/${S.cap}</span>`, sub: esc(S.desc), act: () => { closeMenu(); castSpell(s); } }; }) });
}
function castMenu() {
  const p = G.p;
  if (!p.spells.length) return failMsg("You don't know any spells." + (p.library.length ? ' (M to memorise from your library.)' : ''));
  openMenu({ title: 'Cast which spell?', text: `MP ${p.mp}/${maxMP()}.`, wide: true,
    items: p.spells.map((s, j) => { const S = SPELLS[s]; return { key: letter(j), off: p.mp < S.lvl, label: `${S.n} <span class="dim">(${S.lvl} MP, ${spellFail(s)}% fail)</span>`, sub: esc(S.desc), act: () => { closeMenu(); castSpell(s); } }; }) });
}
function memoriseMenu() {
  const p = G.p; const lib = p.library.filter(s => !p.spells.includes(s));
  if (!lib.length) return failMsg(p.library.length ? 'You have memorised every spell in your library.' : 'Your library is empty. Find spellbooks (+) to add to it.');
  const free = spellLevelsMax() - spellLevelsUsed();
  lib.sort((a, b) => SPELLS[a].lvl - SPELLS[b].lvl);
  openMenu({ title: 'Memorise which spell?', text: `Free spell levels: ${free}. Each spell takes as many levels as its level.`, wide: true,
    items: lib.map((s, j) => { const S = SPELLS[s]; return { key: letter(j), off: S.lvl > free, label: `${S.n} <span class="dim">L${S.lvl} ${S.sch.map(SCHOOL_NAME).join('/')} · ${spellFail(s)}% fail</span>`, sub: esc(S.desc), act: () => { closeMenu(); memorise(s); } }; }) });
}
function abilitiesMenu() {
  const a = abilityList();
  if (!a.length) return failMsg('You have no special abilities. (Find an altar to choose a patron.)');
  openMenu({ title: 'Use which ability?', wide: true, items: a.map((x, j) => ({ key: letter(j), off: !x.ok, label: `${x.n} <span class="dim">(${x.cost}${x.fail ? ', ' + x.fail + '% fail' : ''})</span>`, sub: esc(x.d), act: () => { closeMenu(); useAbility(x.id); } })) });
}
function religionScreen() {
  const p = G.p;
  if (!p.god) return openMenu({ title: 'Religion', text: 'You have no patron. Pray (p) at an altar (_) to choose one. The White Yurts hold an altar to every patron.' + (Object.keys(p.penance).length ? `<br>Still angry with you: ${Object.keys(p.penance).map(g => GODS[g].n).join(', ')}.` : ''), items: [] });
  const g = GODS[p.god];
  openMenu({ title: `${g.n}, ${g.title}`, wide: true,
    text: `${esc(g.desc)}<br><br>Piety: ${p.god === 'kydyr' ? 'not needed' : `<span class="gold">${'*'.repeat(stars())}</span>${'.'.repeat(6 - stars())} (${p.piety})`}<br>${esc(g.likes)}<br>${esc(g.hates)}${g.passive ? '<br>' + esc(g.passive) : ''}<br><br>` +
      g.abil.map(a => `${stars() >= a.star ? '' : '<span class="dim">'}${'*'.repeat(a.star) || '·'} ${esc(a.n)}: ${esc(a.d)}${stars() >= a.star ? '' : '</span>'}`).join('<br>'),
    items: [{ key: 'X', label: `Renounce ${g.n}`, sub: 'They will be angry with you for a while.', act: () => openMenu({ title: `Renounce ${g.n}?`, items: [{ key: 'y', label: 'Yes, renounce', act: renounce }, { key: 'n', label: 'No', act: closeMenu }] }) }] });
}
function resCell(v, max = 3) { return v > 0 ? `<b class="gold">${'+'.repeat(Math.min(v, max))}</b>` : v < 0 ? '<b style="color:#e55a5a">x</b>' : '<span class="dim">.</span>'; }
function characterScreen() {
  const p = G.p, S = SPc();
  const eq = Object.keys(SLOT_NAMES).map(s => { const it = equipped(s); return `<div class="eqline">${SLOT_NAMES[s]}: <em>${it ? esc(itemName(it)) : '<span class="dim">none</span>'}</em></div>`; }).join('');
  const muts = Object.keys(p.muts).map(m => `<div style="color:${MUTS[m].good ? '#7cdc8c' : '#e58aa8'}">${esc(MUTS[m].d(p.muts[m]))}</div>`).join('');
  openMenu({ title: `${esc(p.name)} the ${S.n} ${BGc().n}`, wide: true, items: [],
    text: `<div class="cols"><div>
      HP ${p.hp}/${maxHP()} · MP ${p.mp}/${maxMP()}<br>AC ${AC()} · EV ${EV()} · SH ${SH()}<br>Str ${stat('str')} · Int ${stat('int')} · Dex ${stat('dex')}<br>
      XL ${p.xl} (${p.xp} xp; next at ${xpNeeded(p.xl + 1)}) · Will ${willpower()} · Stealth ${stealth()}<br>
      Silver ${p.gold} · Turn ${Math.floor(G.turn)} · Kills ${G.kills}<br><br>
      <h3>Resistances</h3>rF ${resCell(res('rf'))} · rC ${resCell(res('rc'))} · rPois ${resCell(res('rp'), 1)} · rN ${resCell(res('rn'))} · rElec ${resCell(res('re'), 1)} · SInv ${resCell(seeInvis() ? 1 : 0, 1)}
      <h3>Traits</h3>${S.traits.map(esc).join('<br>')}${muts ? '<h3>Mutations</h3>' + muts : ''}
    </div><div><h3>Equipment</h3>${eq}</div></div>` });
}
function overviewScreen() {
  const p = G.p, items = [];
  for (const b of BRANCH_ORDER) {
    const ids = p.visited.filter(id => id.split(':')[0] === b).sort((a, c) => +a.split(':')[1] - +c.split(':')[1]);
    if (!ids.length) continue;
    items.push({ header: `<span style="color:${BRANCHES[b].c}">${BRANCHES[b].n}</span>` });
    for (const id of ids) {
      const lev = G.levels[id], notes = [];
      for (const i in lev.altars) if (lev.seen[i]) notes.push(`<span style="color:${GODS[lev.altars[i]].c}">altar of ${GODS[lev.altars[i]].n}</span>`);
      for (const s of lev.shops) if (lev.seen[idx(s.x, s.y)]) notes.push(`<span class="gold">${esc(s.name)}</span>`);
      for (const e of lev.entries) if (lev.seen[idx(e.x, e.y)]) notes.push(`<span style="color:${BRANCHES[e.to].c}">way to ${BRANCHES[e.to].short}</span>`);
      items.push({ key: String.fromCharCode(97 + items.filter(x => x.key).length), label: `${levelName(id)}: ${esc(placeName(id))}${id === G.cur ? ' <span class="dim">(you are here)</span>' : ''}`, sub: notes.join(' · '), act: () => { closeMenu(); travelToLevel(id); } });
    }
  }
  openMenu({ title: 'Places you have been', text: 'Pick a place to travel there.', items, wide: true });
}
function discoveriesScreen() {
  const rows = [];
  for (const [k, tbl, gl] of [['potion', POTIONS, 'gl'], ['scroll', SCROLLS, 'gl'], ['ring', RINGS, 'n'], ['amulet', AMULETS, 'gl']]) {
    const known = Object.keys(tbl).filter(t => G.known[k + ':' + t]);
    rows.push(`<h3>${ITEM_CLASS_NAME[k]}</h3>${known.length ? known.map(t => esc(itemName({ k, t, qty: 1, ench: 0 }))).join('<br>') : '<span class="dim">None yet.</span>'}`);
  }
  openMenu({ title: 'Discoveries', text: rows.join(''), items: [], wide: true });
}
function historyScreen() {
  openMenu({ title: 'Message history', text: `<div class="hist">${G.msgs.slice(-120).map(m => `<div style="color:${m.c}">${esc(m.t)}${m.n > 1 ? ' x' + m.n : ''}</div>`).join('')}</div>`, items: [], wide: true,
    after: () => { const h = ov.querySelector('.hist'); if (h) h.scrollTop = h.scrollHeight; } });
}
function describeMonster(m) {
  const Tm = T_(m);
  const fl = []; if (Tm.fl.has('evil') || Tm.fl.has('undead') || Tm.fl.has('demonic')) fl.push('evil'); if (Tm.fl.has('undead')) fl.push('undead'); if (Tm.fl.has('fly')) fl.push('flies'); if (Tm.fl.has('swim')) fl.push('swims');
  const rs = []; const R = Tm.res; const nm = { f: 'fire', c: 'cold', p: 'poison', n: 'negative energy', e: 'electricity' };
  for (const k in R) rs.push(R[k] > 0 ? `resists ${nm[k]}${R[k] >= 3 ? ' completely' : ''}` : `is vulnerable to ${nm[k]}`);
  const sp = Tm.sp ? 'It can use: ' + Tm.sp.map(s => s[0].replace(/\d/, '')).join(', ') + '.' : '';
  const threat = Tm.hd - G.p.xl;
  const tl = threat >= 4 ? '<b style="color:#e55a5a">It looks extremely dangerous.</b>' : threat >= 1 ? '<b style="color:#e5c55a">It looks dangerous.</b>' : threat >= -3 ? 'It looks like a fair fight.' : '<span class="dim">It looks easy.</span>';
  return `${esc(MT[m.k].desc || '')}<br><br>${tl} It is ${healthDesc(m)}${m.state === 'sleep' ? ' and asleep' : ''}${m.ally ? ', and on your side' : ''}.<br>Speed ${Tm.spd}, AC ${Tm.ac}, EV ${Tm.ev}, HD ${Tm.hd}. ${fl.length ? 'It ' + fl.join(', ') + '.' : ''} ${rs.length ? 'It ' + rs.join(', ') + '.' : ''} ${sp}`;
}
function lookText(x, y) {
  const lev = L(), i = idx(x, y);
  if (!lev.seen[i]) return 'You have not seen this place.';
  const parts = [];
  if (G.p.x === x && G.p.y === y) parts.push('You.');
  const m = canSee(x, y) && monAt(x, y);
  if (m && monVisible(m)) parts.push(`<b style="color:${T_(m).c}">${esc(cap(T_(m).n))}</b> (${m.ally ? 'ally' : m.state === 'sleep' ? 'asleep' : healthDesc(m)}). Enter for details.`);
  const items = lev.items.filter(o => o.x === x && o.y === y);
  if (items.length) parts.push(items.map(o => esc(itemName(o.it))).join(', ') + '.');
  const tr = lev.traps.find(t => t.known && t.x === x && t.y === y); if (tr) parts.push(cap(art(TRAPS[tr.ty].n)) + '.');
  const c = canSee(x, y) && cloudAt(x, y); if (c) parts.push(cap(CLOUDS[c.ty].n) + '.');
  let tn = TERRAIN_NAME[lev.t[i]];
  if (lev.t[i] === T.ALTAR) tn = `an altar to ${GODS[lev.altars[i]].n}`;
  if (lev.t[i] === T.SHOP) { const s = lev.shops.find(s => s.x === x && s.y === y); if (s) tn = s.name; }
  if (lev.t[i] === T.BRANCH) { const e = lev.entries.find(e => e.x === x && e.y === y); tn = `a track into ${BRANCHES[e.to].n}`; }
  if (lev.t[i] === T.TREE) tn = art(curTheme().treeN || 'tree');
  parts.push(cap(tn) + '.');
  return parts.join(' ');
}
function helpScreen() {
  openMenu({ title: 'How to play', wide: true, items: [], text: `
<div class="cols"><div>
<h3>Moving</h3>Arrows, numpad, or <b class="gold">hjkl yubn</b>. Walk into a foe to attack.<br>
<b class="gold">o</b> explore · <b class="gold">Tab</b> fight nearest · <b class="gold">5</b> rest · <b class="gold">s</b> wait<br>
<b class="gold">&gt; &lt;</b> use a pass, or travel to one · <b class="gold">G</b> or <b class="gold">O</b> travel to a place you've been<br>
<b class="gold">x</b> look around · <b class="gold">C</b> close a door<br>Click or tap the map to travel.
<h3>Items</h3><b class="gold">i</b> pack · <b class="gold">g</b> pick up · <b class="gold">d</b> drop<br><b class="gold">w</b> wield · <b class="gold">W</b> wear · <b class="gold">T</b> take off · <b class="gold">P</b> put on · <b class="gold">R</b> remove<br>
<b class="gold">q</b> quaff · <b class="gold">r</b> read · <b class="gold">v</b> evoke · <b class="gold">f</b> fire or throw · <b class="gold">Q</b> choose quiver
</div><div>
<h3>Magic and patrons</h3><b class="gold">z</b> cast · <b class="gold">I</b> your spells · <b class="gold">M</b> memorise from library<br><b class="gold">a</b> abilities · <b class="gold">p</b> pray (altar, mazar) · <b class="gold">^</b> your patron
<h3>Your character</h3><b class="gold">m</b> skills · <b class="gold">%</b> character · <b class="gold">\\</b> discoveries · <b class="gold">Ctrl-P</b> messages
<h3>Aiming</h3>Arrows move the cursor, <b class="gold">Tab</b> picks the next target, <b class="gold">Enter</b> or <b class="gold">.</b> fires, <b class="gold">Esc</b> cancels.
</div></div>
<h3>The quest</h3><p>Twelve valleys lead down from the Qara-Chik road. Four regions hide clan tamgas (<b class="gold">}</b>): the Arslanbob Woods, the Moiynkum Sands, the Old Kurgans and the Pass of the Black Blizzard. Carry three to the track under Manas Peak (Valley 10) to open the Hidden Valley of Janyl. Take the Ene Malka (<b style="color:#fff4c0">0</b>) from Morkhan's Herald and bring it back up the road from Valley 1.</p>
<p class="dim">Like Crawl, you grow by training skills with experience (m), finding gear, and choosing a patron at an altar. Flasks, bark scrolls, shakeks and tumars are unknown until used. White is holy and black is Morkhan's. Your game saves in this browser.</p>` });
}
function commandsMenu() {
  const c = (key, label, fnKey) => ({ key, label, act: () => { closeMenu(); handleKey(fnKey || key); } });
  openMenu({ title: 'Commands', wide: true, items: [c('i', 'Pack'), c('m', 'Skills'), c('z', 'Cast a spell'), c('M', 'Memorise spells'), c('I', 'Your spells'), c('a', 'Abilities'), c('^', 'Patron'),
    c('%', 'Character'), c('x', 'Look around'), c('O', 'Places and travel'), c('\\', 'Discoveries'), c('H', 'Message history'), c('Q', 'Choose quiver'), c('C', 'Close a door'), c('g', 'Pick up'), c('p', 'Pray'), c('?', 'Help')] });
}

// --- the end screen ---
function showEnd(title, text) {
  const dump = morgue();
  openMenu({ title, locked: true, text: `${text}<br><span class="gold">Score: ${score()}</span><textarea id="dump" readonly rows="12">${esc(dump)}</textarea>`,
    items: [{ key: 'c', label: 'Copy character file', act: () => { const t = document.getElementById('dump'); try { navigator.clipboard.writeText(dump).then(() => msg('Copied.'), () => { t.select(); }); } catch (e) { t.select(); } } },
      { key: 'Enter', label: 'Start a new game', act: titleScreen }], wide: true });
}

// --- title and character creation ---
function titleScreen() {
  G = null; stopRunSafe(); tgt = null; render();
  document.getElementById('side').innerHTML = ''; document.getElementById('log').innerHTML = '';
  const sv = loadSave(); let name = randomName(); let sp = null;
  const head = `<div class="title">Steppe Crawl</div><p class="dim">A roguelike set in Irad. ${window.TILES ? '<a href="index.html" style="color:var(--gold)">Play in ASCII</a>' : '<a href="tiles.html" style="color:var(--gold)">Play with tiles</a>'} · your saved game works in both.</p>
  <p>Twelve valleys run down from the Qara-Chik road into the dark. Clan tamgas lie in four wild regions; three of them open the hidden track to the ruin of the First Church, where the <span class="star">Ene Malka</span>, the Mother Leaven of St. Janyl, waits with the bull-headed Herald of Morkhan. Bring the leaven home.</p>`;
  const step1 = () => {
    ui = { title: 'title' }; ov.hidden = false;
    ov.innerHTML = `<div class="card wide">${head}
    ${sv && !sv.over ? `<div class="opt" id="cont"><span class="k">*)</span><span>Continue ${esc(sv.p.name)} <small>${SPECIES[sv.p.sp].n} ${BACKGROUNDS[sv.p.bg].n}, level ${sv.p.xl}, ${esc(levelName.call(null, sv.cur))}</small></span></div>` : ''}
    <div class="row"><label for="nm">Name</label><input type="text" id="nm" value="${esc(name)}" maxlength="40"><button id="rn">Random name</button></div>
    <h3>Choose your people</h3><div class="cols">${SPECIES_ORDER.map((k, i) => `<div class="opt" data-s="${k}"><span class="k">${letter(i)})</span><span>${SPECIES[k].n}<small>${esc(SPECIES[k].desc)}</small></span></div>`).join('')}</div></div>`;
    const nm = document.getElementById('nm'); nm.oninput = () => name = nm.value;
    document.getElementById('rn').onclick = () => { name = randomName(); nm.value = name; };
    ov.querySelectorAll('[data-s]').forEach(el => el.onclick = () => { sp = el.dataset.s; step2(); });
    const c = document.getElementById('cont'); if (c) c.onclick = cont;
    ui.key = k => {
      if (document.activeElement === nm && k !== 'Enter') return false;
      if (k === '*' && sv && !sv.over) { cont(); return true; }
      const i = LETTERS.indexOf(k); if (k.length === 1 && i >= 0 && i < SPECIES_ORDER.length) { sp = SPECIES_ORDER[i]; step2(); return true; }
      return false;
    };
  };
  const cont = () => { G = sv; for (const id in G.levels) G.levels[id]._dm = null; closeMenu(); updateFOV(); msg(`Welcome back, ${G.p.name}.`, '#d8a640'); render(); };
  const step2 = () => {
    const S = SPECIES[sp]; ui = { title: 'title' };
    const apt = Object.entries(S.apt).filter(([, v]) => v >= 2).map(([k]) => SK[k] ? SK[k].n : k);
    ov.innerHTML = `<div class="card wide"><h2>${esc(name.trim() || 'Nameless')} the ${S.n}</h2><p class="dim">${esc(S.desc)} ${S.traits.map(esc).join('. ')}.${apt.length ? ' Gifted at: ' + apt.join(', ') + '.' : ''} <a href="#" id="back" style="color:var(--gold)">Choose again</a></p>
    <h3>Choose your calling</h3><div class="cols">${BG_ORDER.map((k, i) => { const B = BACKGROUNDS[k]; return `<div class="opt" data-b="${k}"><span class="k">${letter(i)})</span><span>${B.n}<small>${esc(B.desc)}${B.spells ? ' Starts with ' + B.spells.map(s => SPELLS[s].n).join(', ') + '.' : ''}${B.god ? ' Starts devoted to ' + GODS[B.god].n + '.' : ''}</small></span></div>`; }).join('')}</div><p class="dim">Esc to go back.</p></div>`;
    document.getElementById('back').onclick = e => { e.preventDefault(); step1(); };
    ov.querySelectorAll('[data-b]').forEach(el => el.onclick = () => start(el.dataset.b));
    ui.key = k => { if (k === 'Escape') { step1(); return true; } const i = LETTERS.indexOf(k); if (k.length === 1 && i >= 0 && i < BG_ORDER.length) { start(BG_ORDER[i]); return true; } return false; };
  };
  const start = bg => { newGame(name.trim(), sp, bg); closeMenu(); render(); };
  step1();
}
function stopRunSafe() { if (running) { clearTimeout(running); running = null; } }
