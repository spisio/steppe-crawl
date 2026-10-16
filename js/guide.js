"use strict";
// Instructions and game guide. Shown in the game (title screen, ? key) and on guide.html.
// Reference chapters are built from the game's own data tables, so they stay accurate.

const K = s => `<b class="gold">${s}</b>`;
const gTable = (head, rows) => `<div class="gtable"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const statLine = S => `Str ${S.str} · Int ${S.int} · Dex ${S.dex}`;
const bestApts = S => Object.entries(S.apt).filter(([, v]) => v >= 2).map(([k]) => SK[k] ? SK[k].n : k).join(', ') || 'none in particular';
const poorApts = S => Object.entries(S.apt).filter(([, v]) => v <= -2).map(([k]) => SK[k] ? SK[k].n : k).join(', ') || 'none';

const GUIDE = [
  { id: 'start', n: 'Getting started', html: () => `
<p>Steppe Crawl is a turn-based roguelike set in Irad. You ride out from the Qara-Chik road into ten valleys, each a day farther from home. Nothing moves until you do: every step, swing or spell takes time, and then the creatures around you act.</p>
<h3>Your goal</h3>
<p>Under Manas Peak, ten days from home, a sealed cleft leads to the Hidden Valley of Janyl and the ruin of the First Church. There the bull-headed Herald of Morkhan keeps the <span class="star">Ene Malka</span>, the Mother Leaven of St. Janyl. The cleft opens only for someone carrying three clan tamgas (${K('}')}), which lie at the far ends of four wild regions off the road. Win by carrying the leaven all the way back up the Qara-Chik road.</p>
<h3>Your first few minutes</h3>
<ol>
<li>Pick a people and a calling. For a first game, try an <b>Iradi Baatyr</b> (tough, simple) or a <b>Tash-Kishi Kashysh</b> (a priest who can heal).</li>
<li>Press ${K('o')} to explore. You stop automatically when something comes into view.</li>
<li>Press ${K('Tab')} to fight the nearest foe, or walk into it.</li>
<li>When hurt, step away from danger and press ${K('5')} to rest.</li>
<li>When the valley is explored, press ${K('&gt;')} to travel to the way on, and ${K('&gt;')} again to take it.</li>
</ol>
<h3>Death is permanent</h3>
<p>As in Crawl, when you die the game is over and your save is deleted. You get a character file summarising your journey. The game saves automatically in your browser as you play, so you can close the tab and continue later from the title screen.</p>
<h3>Two ways to play</h3>
<p>The main game uses graphical tiles. A classic ASCII version (<a href="ascii.html">ascii.html</a>) plays exactly the same and shares your saved game.</p>` },

  { id: 'controls', n: 'Controls', html: () => `
<h3>Keyboard</h3>
${gTable(['Key', 'Action'], [
    [`arrows, numpad, ${K('h j k l y u b n')}`, 'Move (and attack by walking into a foe)'],
    [K('o'), 'Explore automatically'], [K('Tab'), 'Fight the nearest foe'], [K('5'), 'Rest until healed'], [`${K('s')} or ${K('.')}`, 'Wait one turn'],
    [K('&gt;'), 'Take the way on (a pass, ford, track or region entrance); from elsewhere, travel to it'], [K('&lt;'), 'Take the way back; from elsewhere, travel to it'],
    [`${K('G')} or ${K('O')}`, 'List places you have been and travel there'], [K('x'), 'Look around (move the cursor; Enter on a creature for details)'],
    [K('i'), 'Pack (pick an item to see what you can do with it)'], [`${K('g')} or ${K(',')}`, 'Pick up'], [K('d'), 'Drop'],
    [K('w'), 'Wield a weapon'], [K('W'), 'Wear armour'], [K('T'), 'Take off armour'], [K('P'), 'Put on a shakek or tumar'], [K('R'), 'Remove one'],
    [K('q'), 'Quaff a flask'], [K('r'), 'Read a bark scroll'], [K('v'), 'Evoke a wand or instrument'], [K('f'), 'Fire your bow or sling, or throw'], [K('Q'), 'Choose what to fire'],
    [K('z'), 'Cast a spell'], [K('I'), 'List your spells'], [K('M'), 'Memorise spells from your library'],
    [K('a'), 'Abilities (your patron\'s powers, dragon breath)'], [K('p'), 'Pray at an altar or mazar'], [K('^'), 'Your patron'],
    [K('m'), 'Skills'], [`${K('%')}`, 'Character sheet'], [K('\\'), 'Items you have identified'], [`${K('H')} or ${K('Ctrl-P')}`, 'Message history'], [K('C'), 'Close a door'], [K('?'), 'This guide'],
  ])}
<h3>Aiming</h3>
<p>Spells, wands, bows and abilities that need a target open a cursor on the nearest foe. ${K('Tab')} moves to the next foe, arrows move the cursor, ${K('Enter')} or ${K('.')} fires, ${K('Esc')} cancels. The highlighted path shows where a bolt will go.</p>
<h3>Mouse and touch</h3>
<p>Click or tap a place on the map to travel there; tap next to you to step or attack; tap yourself to pick up. While aiming, tap a target once to move the cursor and again to fire. On a phone, use the arrow pad and the buttons under the map; <b>More</b> has every command.</p>` },

  { id: 'journey', n: 'The journey', html: () => `
<p>The valleys run out from the Qara-Chik road in a line, each one day farther from home. Each has one way on and one way back. Four wild regions branch off the road, and one more holds every altar.</p>
<h3>The ten valleys</h3>
${gTable(['Day', 'Valley', 'The way on'], VALLEY_THEMES.slice(1).map((v, i) => [i + 1, esc(v.name), VALLEY_ONWARD[i + 1] ? esc(VALLEY_ONWARD[i + 1][1]) : 'the sealed cleft (needs three tamgas)']))}
<h3>Regions off the road</h3>
<p>Where each region opens is different in every game; look for its landmark. Days from home count the region's areas on top of the valley it opens from.</p>
${gTable(['Region', 'Opens from', 'Areas', 'At the far end'], BRANCH_ORDER.filter(b => b !== 'V').map(b => {
    const B = BRANCHES[b], par = B.parent === 'V' ? `a valley, days ${B.entry[0]}${B.entry[1] !== B.entry[0] ? '–' + B.entry[1] : ''}` : `${BRANCHES[B.parent].n}, area ${B.entry[0]}–${B.entry[1]}`;
    const end = b === 'hidden' ? "Morkhan's Herald and the Ene Malka" : b === 'temple' ? 'an altar to every patron' : [B.boss ? MT[B.boss].n : '', B.tamga ? 'the ' + TAMGAS[B.tamga].n : ''].filter(Boolean).join('; ');
    return [`${esc(cap(B.n))}<br><small class="dim">${esc(cap(BRANCH_LINKS[b].entry[1]))}</small>`, par, B.depth, esc(end)];
  }))}
<p>Any three of the four tamgas open the cleft. Once you take the leaven, the valleys know it: more creatures come after you on the way home.</p>` },

  { id: 'peoples', n: 'Peoples', html: () => `
<p>Your people set your starting stats, health and magic, and your <b>aptitudes</b>: how quickly each skill grows. A +2 aptitude grows about 40% faster than normal; a -2 about 30% slower.</p>
${gTable(['People', 'Stats', 'Traits', 'Gifted at', 'Weak at'], SPECIES_ORDER.map(k => { const S = SPECIES[k];
    return [`<b>${S.n}</b><br><small class="dim">${esc(S.desc)}</small>`, statLine(S), S.traits.map(esc).join('<br>'), esc(bestApts(S)), esc(poorApts(S))]; }))}` },

  { id: 'callings', n: 'Callings', html: () => `
<p>Your calling sets your starting skills, equipment and spells. Skills are not locked to a calling: anyone can learn anything with experience.</p>
${gTable(['Calling', 'Starts with', 'Spells or patron'], BG_ORDER.map(k => { const B = BACKGROUNDS[k];
    const skills = Object.entries(B.skills).map(([s, v]) => `${SK[s].n} ${v}`).join(', ');
    const extra = [B.spells ? B.spells.map(s => SPELLS[s].n).join(', ') : '', B.god ? 'devoted to ' + GODS[B.god].n : '', B.eagle ? 'a golden eagle companion' : ''].filter(Boolean).join('; ') || '—';
    return [`<b>${B.n}</b><br><small class="dim">${esc(B.desc)}</small>`, esc(skills), esc(extra)]; }))}` },

  { id: 'skills', n: 'Skills and experience', html: () => `
<p>Killing creatures gives experience. Experience raises your <b>experience level</b> (more health and magic) and is shared out between the <b>skills you are training</b>.</p>
<ul>
<li>Press ${K('m')} to see your skills. Press a skill's letter to cycle it between <i>off</i>, <i>train</i> and <i>focus</i> (a double share).</li>
<li>With <b>automatic training</b> on (the default), any skill you use switches itself on. Turn off skills you don't want so experience isn't wasted.</li>
<li>Every third experience level you choose +1 Strength, Intelligence or Dexterity.</li>
</ul>
<h3>What the skills do</h3>
${gTable(['Skill', 'Effect'], [
    ['Fighting', 'More health and accuracy with every melee attack'],
    ['Weapon skills', 'Accuracy and damage with that kind of weapon, and faster attacks down to a minimum delay'],
    ['Bows, Slings, Throwing', 'Accuracy, damage and speed at range'],
    ['Armour', 'More protection from body armour and less of its weight on your dodging and spells'],
    ['Dodging', 'Evasion (EV)'], ['Shields', 'Blocking (SH)'], ['Stealth', 'Creatures wake and notice you less; sneak attacks with short blades'],
    ['Spellcasting', 'More magic, lower failure, more spell levels to memorise'],
    ['Magic schools', 'Spell power and lower failure for spells of that school'],
    ['Invocations', "Your patron's powers fail less and hit harder; a little more magic"],
    ['Evocations', 'Wands and instruments are stronger'],
  ])}` },

  { id: 'combat', n: 'Combat', html: () => `
<ul>
<li><b>AC</b> (armour class) reduces the damage of each hit. <b>EV</b> (evasion) makes you harder to hit. <b>SH</b> (shield) lets you block blows entirely.</li>
<li>Heavy armour gives more AC but lowers EV, slows spells, and makes you noisier. Training Armour reduces the penalty.</li>
<li>Each weapon has a <b>delay</b>; skill lowers it. A big axe hits hard but slowly until you have trained Axes.</li>
<li>Bows and slings need ammunition (${K('f')} fires, ${K('Q')} chooses). Javelins, darts and stones can be thrown without a launcher.</li>
<li>Many creatures start <b>asleep</b> (a blue line under them). Stealth helps you slip past or strike first.</li>
<li>The monster list colours each creature by threat: <span class="dim">grey</span> easy, white fair, <span style="color:#e5c55a">yellow</span> dangerous, <span style="color:#e55a5a">red</span> deadly. Use ${K('x')} and Enter to read about one.</li>
<li>Fighting in a corridor or doorway means only one foe can reach you at a time.</li>
<li><b>Resistances</b> (shown on ${K('%')}) cut damage from fire, cold, poison, lightning and Morkhan's dark magic.</li>
</ul>` },

  { id: 'magic', n: 'Magic', html: () => {
    const bySchool = {};
    for (const id in SPELLS) { const S = SPELLS[id]; (bySchool[S.sch[0]] = bySchool[S.sch[0]] || []).push(S); }
    return `
<p>Spells come from books (${K('+')}). Picking one up adds its spells to your <b>library</b>; ${K('M')} memorises them. Each spell uses as many <b>spell levels</b> as its level, and you gain more spell levels with experience and Spellcasting.</p>
<ul>
<li>Casting costs magic (MP) equal to the spell's level. Magic comes back slowly over time.</li>
<li>Every spell has a <b>failure</b> chance, shown in the cast menu. It falls with school skill, Spellcasting and Intelligence, and rises with heavy armour and shields.</li>
<li><b>Power</b> sets how strong a spell is, up to a cap. Magic staves add half again to their school.</li>
<li>Hexes (sleep, slow, fear, charm) can be resisted; strong-willed and mindless creatures often shrug them off.</li>
</ul>
${MAGIC_SCHOOLS.filter(s => bySchool[s]).map(s => `<h3>${SK[s].n}</h3>` + gTable(['Spell', 'Level', 'Effect'], bySchool[s].sort((a, b) => a.lvl - b.lvl).map(S => [esc(S.n), S.lvl, esc(S.desc)]))).join('')}`;
  } },

  { id: 'patrons', n: 'Patrons', html: () => `
<p>Pray (${K('p')}) at an altar to give yourself to a patron. Altars are scattered through the valleys, and the White Yurts have one for every patron. Patrons grow fonder of you (<b>piety</b>, shown as stars) when you do what they like, and grant powers you use with ${K('a')}. If you leave a patron, they stay angry for a while.</p>
${GOD_ORDER.map(g => { const Gd = GODS[g];
    return `<h3 style="color:${Gd.c}">${Gd.n}, ${Gd.title}</h3><p>${esc(Gd.desc)} ${esc(Gd.likes)} ${esc(Gd.hates)}${Gd.passive ? ' ' + esc(Gd.passive) : ''}</p>` +
      gTable(['Power', 'Needs', 'Effect'], Gd.abil.map(a => [esc(a.n), a.silver ? 'silver' : '*'.repeat(a.star), esc(a.d)])); }).join('')}` },

  { id: 'items', n: 'Items', html: () => `
<h3>Identifying things</h3>
<p>Flasks (${K('!')}), bark scrolls (${K('?')}), shakeks (rings, ${K('=')}) and tumars (amulets, ${K('"')}) look different in every game. Drink, read or put one on to learn what it is; ${K('\\')} lists what you know. An Ïrchy's Verse scroll names one unknown item.</p>
${gTable(['Kind', 'What you might find'], [
    ['Flasks', Object.values(POTIONS).map(p => `${esc(p.n)} <span class="dim">(${p.gl})</span>`).join(', ')],
    ['Bark scrolls', Object.values(SCROLLS).map(s => `${esc(s.n)} <span class="dim">(${s.gl})</span>`).join(', ')],
    ['Wands', Object.values(WANDS).map(w => `${esc(w.n)} <span class="dim">(${w.gl})</span>`).join(', ')],
    ['Shakeks', Object.values(RINGS).map(r => r.n).join(', ')],
    ['Tumars', Object.values(AMULETS).map(a => `${esc(a.n)} <span class="dim">(${a.gl})</span>`).join(', ')],
    ['Instruments', Object.values(MISC).map(m => `${esc(m.n)} <span class="dim">(${m.gl}; recharges as you gain experience)</span>`).join(', ')],
  ])}
<h3>Weapons and armour</h3>
<p>A number like +2 is an enchantment. Some weapons carry a <b>brand</b> and some armour an <b>ego</b>:</p>
${gTable(['Brand', 'Effect'], Object.values(BRANDS).map(b => [esc(b.n), esc(b.d)]))}
<p>Eight named artefacts are hidden in the deeper valleys. Silver (${K('$')}) buys goods from the traders at bazaar stalls.</p>` },

  { id: 'places', n: 'Places and dangers', html: () => `
${gTable(['You see', 'What it is'], [
    ['A pass, ford, gorge path or caravan track (gold glow)', `The way on to the next valley (${K('&gt;')})`],
    ['A trail, ladder or the road home (blue glow)', `The way back (${K('&lt;')})`],
    ['A mine adit, kurgan, wood path, dry riverbed, cairn trail or cleft', 'The entrance to a region'],
    ['A mazar: a cairn hung with white ribbons', `Pray (${K('p')}) once for a full heal and to cure poison`],
    ['An altar', 'Choose a patron'], ['A bazaar stall', `A trader (${K('&gt;')} to trade)`],
    ['A yurt', 'Abandoned felt yurts often hold supplies, and sometimes their new owners'],
    ['A balbal', 'An old stone figure. In the kurgans, some of them walk'],
    [`A trap (${K('^')})`, 'Nets, pits, bells, dust devils, tripwire bows and Morkhan\'s mark. You spot nearby traps by chance; travel avoids the ones you know'],
    ['Smoke and clouds', 'Fire, freezing rain and bitter smoke hurt; juniper smoke blocks sight and stings evil things'],
    ['Deep water', 'Too deep to ford; fliers and swimmers cross it'],
  ])}` },

  { id: 'tips', n: 'Tips', html: () => `
<ul>
<li>Rest to full health before taking the way on. The next valley's creatures will not wait for you.</li>
<li>Retreating is not cowardice. Go back the way you came, fight in a narrow spot, or leave a fight you are losing.</li>
<li>Try unknown flasks and scrolls when you are healthy and safe, not in an emergency.</li>
<li>Kymyz cures poison; ak süt heals deep wounds. Keep a few.</li>
<li>Pick a patron early. The White Yurts, a few days from home, have every altar.</li>
<li>Focus your experience on a few skills rather than many.</li>
<li>Uniques (marked in pink) are much tougher than their kind. It is fine to come back for them later.</li>
<li>Black bulls, horned cultists and the dead serve Morkhan; St. Janyl's holy light and juniper smoke hurt them most.</li>
<li>The regions get much harder than the valleys around them. If a region is too much, come back when you are stronger.</li>
</ul>` },
];

// In-game guide: a chapter list, and each chapter with next/previous.
// From the title screen (no game running) Esc goes back to the title; in a game it closes the guide.
const guideExit = () => G ? [] : [{ key: 'Esc', label: 'Back to the title screen', act: titleScreen }];
function guideMenu(startAt) {
  if (startAt) return guideChapter(GUIDE.findIndex(c => c.id === startAt));
  openMenu({ title: 'Guide', text: '<span class="dim">Also on the web: <a href="guide.html" target="_blank" rel="noopener" style="color:var(--gold)">guide.html</a></span>',
    items: [...GUIDE.map((c, i) => ({ key: letter(i), label: c.n, act: () => guideChapter(i) })), ...guideExit()], wide: true, locked: !G });
}
function guideChapter(i) {
  const c = GUIDE[i]; if (!c) return guideMenu();
  const items = [];
  if (i + 1 < GUIDE.length) items.push({ key: 'n', label: `Next: ${GUIDE[i + 1].n}`, act: () => guideChapter(i + 1) });
  if (i > 0) items.push({ key: 'p', label: `Previous: ${GUIDE[i - 1].n}`, act: () => guideChapter(i - 1) });
  items.push({ key: 'g', label: 'All chapters', act: () => guideMenu() }, ...guideExit());
  openMenu({ title: c.n, text: `<div class="guide">${c.html()}</div>`, items, wide: true, locked: !G });
  ov.scrollTop = 0;
}
