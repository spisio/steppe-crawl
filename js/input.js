"use strict";
// Keyboard, pointer and the targeting cursor.

const DIRS = { h: [-1, 0], j: [0, 1], k: [0, -1], l: [1, 0], y: [-1, -1], u: [1, -1], b: [-1, 1], n: [1, 1],
  ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1], ArrowRight: [1, 0], Home: [-1, -1], PageUp: [1, -1], End: [-1, 1], PageDown: [1, 1] };
const NUMPAD = { Numpad1: [-1, 1], Numpad2: [0, 1], Numpad3: [1, 1], Numpad4: [-1, 0], Numpad6: [1, 0], Numpad7: [-1, -1], Numpad8: [0, -1], Numpad9: [1, -1] };

// --- targeting ---
function startTargeting(o) {
  stopRun();
  const p = G.p;
  tgt = Object.assign({ x: p.x, y: p.y, range: 8 }, o);
  tgt.list = visibleHostiles().filter(m => cheb(m, p) <= (tgt.range || 99));
  tgt.li = 0;
  if (tgt.kind !== 'blink' && tgt.kind !== 'look' && tgt.list.length) { tgt.x = tgt.list[0].x; tgt.y = tgt.list[0].y; }
  document.getElementById('tbar').hidden = false;
  updateLook(); render();
}
function endTargeting() { tgt = null; document.getElementById('tbar').hidden = true; lookbox.hidden = true; render(); }
function updateLook() {
  if (!tgt) return;
  lookbox.hidden = false;
  const head = tgt.prompt ? `<b class="gold">${esc(tgt.prompt)}</b> <span class="dim">Tab: next target · Enter: confirm · Esc: cancel</span><br>` : '<span class="dim">Move the cursor to look. Enter on a creature for details. Esc to stop.</span><br>';
  lookbox.innerHTML = head + lookText(tgt.x, tgt.y);
}
function confirmTarget() {
  const t = tgt, p = G.p;
  if (t.kind === 'look') { const m = monAt(t.x, t.y); if (m && canSee(t.x, t.y) && monVisible(m)) openMenu({ title: esc(cap(T_(m).n)), text: describeMonster(m), items: [] }); return; }
  if ((t.kind === 'smite' || t.kind === 'blink') && (!canSee(t.x, t.y))) return failMsg('You cannot see that place.');
  if (t.range && cheb(t, p) > t.range) return failMsg('That is out of range.');
  if (t.x === p.x && t.y === p.y && t.kind !== 'smite') return failMsg('Choose a target other than yourself.');
  const cb = t.cb; endTargeting(); cb(t.x, t.y);
}
function targetingKey(k, code) {
  const t = tgt;
  const d = DIRS[k] || (code && NUMPAD[code]);
  if (d) { t.x = clamp(t.x + d[0], 0, W - 1); t.y = clamp(t.y + d[1], 0, H - 1); updateLook(); render(); return true; }
  if (k === 'Tab' || k === '+' || k === '=' || k === ' ' || k === '*') { if (t.list.length) { t.li = (t.li + 1) % t.list.length; t.x = t.list[t.li].x; t.y = t.list[t.li].y; } updateLook(); render(); return true; }
  if (k === '-') { if (t.list.length) { t.li = (t.li - 1 + t.list.length) % t.list.length; t.x = t.list[t.li].x; t.y = t.list[t.li].y; } updateLook(); render(); return true; }
  if (k === 'Enter' || k === '.' || k === 'f' || k === 'v' || k === 'z' || k === '5') { confirmTarget(); return true; }
  if (k === 'Escape' || k === 'x') { const c = t.cancel; endTargeting(); if (c) c(); return true; }
  return true;
}

// --- commands ---
function handleKey(k, code, ctrl) {
  if (ui) {
    if (ui.key) return ui.key(k);
    if (k === 'Escape' && !ui.locked) { closeMenu(); return true; }
    const it = ui.items && ui.items.find(x => x.key === k || (x.key === 'Enter' && k === 'Enter') || (x.key === 'Esc' && k === 'Escape'));
    if (it && !it.off && it.act) { it.act(); return true; }
    return false;
  }
  if (!G || G.over) return false;
  if (tgt) return targetingKey(k, code);
  if (running) { stopRun(); if (k !== 'o') return true; }
  if (ctrl) { if (k === 'p' || k === 'P') { historyScreen(); return true; } if (k === 'o' || k === 'O') { overviewScreen(); return true; } return false; }
  if (code && NUMPAD[code]) { playerMove(...NUMPAD[code]); return true; }
  if (code === 'Numpad5') { rest(); return true; }
  if (DIRS[k]) { playerMove(...DIRS[k]); return true; }
  const p = G.p, all = () => true;
  switch (k) {
    case 's': case '.': case 'Clear': endTurn(10); return true;
    case '5': rest(); return true;
    case 'o': explore(); return true;
    case 'Tab': autoFight(); return true;
    case 'g': case ',': pickupHere(); return true;
    case 'i': inventoryMenu('Your pack', all, itemActions, 'Your pack is empty.'); return true;
    case 'w': inventoryMenu('Wield which weapon?', it => it.k === 'weapon', wield, 'You have no weapons.'); return true;
    case 'W': inventoryMenu('Wear which armour?', it => it.k === 'armour' && !it.eq, wear, 'You have nothing else to wear.'); return true;
    case 'T': inventoryMenu('Take off which armour?', it => it.k === 'armour' && it.eq, takeOff, 'You are wearing no armour.'); return true;
    case 'P': inventoryMenu('Put on which jewellery?', it => (it.k === 'ring' || it.k === 'amulet') && !it.eq, putOn, 'You have no shakeks or tumars.'); return true;
    case 'R': inventoryMenu('Remove which jewellery?', it => (it.k === 'ring' || it.k === 'amulet') && it.eq, takeOff, 'You are wearing no jewellery.'); return true;
    case 'q': inventoryMenu('Drink which flask?', it => it.k === 'potion', quaff, 'You have nothing to drink.'); return true;
    case 'r': inventoryMenu('Read which scroll?', it => it.k === 'scroll', read, 'You have nothing to read.'); return true;
    case 'v': case 'V': inventoryMenu('Evoke which item?', it => it.k === 'wand' || it.k === 'misc', evoke, 'You have nothing to evoke.'); return true;
    case 'd': inventoryMenu('Drop which item?', all, i => { p.inv[i].dropped = 1; drop(i); }, 'You have nothing to drop.'); return true;
    case 'Q': inventoryMenu('Quiver which missiles?', it => it.k === 'missile', i => { p.quiver = i; msg(`Quivered: ${itemName(p.inv[i])}.`); render(); }, 'You have no missiles.'); return true;
    case 'f': {
      const qi = quiverItem();
      if (qi === null) return failMsg(equipped('weapon') && WEAPONS[equipped('weapon').t].shoot ? 'You have nothing to shoot.' : 'You have nothing to throw. (Javelins, darts and stones can be thrown.)'), true;
      startTargeting({ kind: 'bolt', range: 9, prompt: `${launcherFor(p.inv[qi]) ? 'Shoot' : 'Throw'} ${itemName(p.inv[qi])}.`, cb: (x, y) => fireMissile(qi, x, y) });
      return true;
    }
    case 'z': castMenu(); return true;
    case 'I': spellsScreen(); return true;
    case 'M': memoriseMenu(); return true;
    case 'a': abilitiesMenu(); return true;
    case 'p': pray(); return true;
    case '^': religionScreen(); return true;
    case 'm': skillsScreen(); return true;
    case '%': case '@': characterScreen(); return true;
    case 'x': startTargeting({ kind: 'look', range: 0 }); return true;
    case 'O': case 'G': overviewScreen(); return true;
    case '\\': discoveriesScreen(); return true;
    case 'H': historyScreen(); return true;
    case 'C': closeDoor(); return true;
    case '>': takeStairs(1); return true;
    case '<': takeStairs(-1); return true;
    case '?': guideMenu(); return true;
    case 'More': commandsMenu(); return true;
  }
  return false;
}

document.addEventListener('keydown', e => {
  if (e.altKey || e.metaKey) return;
  if (e.target.tagName === 'INPUT' && e.key !== 'Enter' && e.key !== 'Escape') return;
  if (e.target.tagName === 'TEXTAREA') return;
  const code = /^Numpad[1-9]$/.test(e.code || '') ? e.code : null;
  if (handleKey(e.key, code, e.ctrlKey)) e.preventDefault();
});
document.getElementById('bar').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; handleKey(b.dataset.k); b.blur(); });
document.getElementById('tbar').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || !tgt) return; targetingKey(b.dataset.k); b.blur(); });
cv.addEventListener('click', e => {
  if (!G || G.over || ui) return;
  const r = cv.getBoundingClientRect(); const { ox, oy } = viewOrigin();
  const x = Math.floor((e.clientX - r.left) / cell.w) + ox, y = Math.floor((e.clientY - r.top) / cell.h) + oy;
  if (!inb(x, y)) return;
  if (tgt) { if (tgt.x === x && tgt.y === y) confirmTarget(); else { tgt.x = x; tgt.y = y; updateLook(); render(); } return; }
  const p = G.p;
  if (x === p.x && y === p.y) { pickupHere(); return; }
  if (cheb({ x, y }, p) === 1) { playerMove(x - p.x, y - p.y); return; }
  if (L().seen[idx(x, y)] && walkable(L().t[idx(x, y)])) travelTo({ x, y });
});
window.addEventListener('resize', resize);
