"use strict";
// Peoples (species) and callings (backgrounds).

const ALL_SCHOOLS = s => Object.fromEntries(['spellcasting', ...MAGIC_SCHOOLS].map(k => [k, s]));

const SPECIES = {
  iradi: {
    n: 'Iradi', str: 8, int: 8, dex: 8, hp: 0, mp: 0, xp: 1, will: 0,
    apt: { polearms: 1, bows: 1, invo: 1 },
    desc: 'Herders of the star, born to the saddle. They learn faster than any other folk and turn their hand to anything.',
    traits: ['Quick learner (+1 experience aptitude)', 'Good with lance, bow and prayer'],
  },
  tash: {
    n: 'Tash-Kishi', str: 11, int: 7, dex: 6, hp: 2, mp: -1, xp: 0, will: 10, ac: 2, res: { p: 1 },
    apt: { fighting: 1, axes: 1, maces: 1, armour: 2, shields: 1, earth: 2, fire: 1, dodging: -1, stealth: -1, air: -2, tloc: -2, bows: -1, spellcasting: -1, evo: 1 },
    desc: 'Stone folk from under the Talas Alatau. Slow to anger, slower to fall, and handy with an axe.',
    traits: ['Stony hide (+2 AC)', 'Poison resistance'],
  },
  peri: {
    n: 'Peri', str: 6, int: 12, dex: 10, hp: -2, mp: 2, xp: -1, will: 20, ev: 2, sinv: 1,
    apt: Object.assign(ALL_SCHOOLS(1), { spellcasting: 2, hexes: 2, air: 2, necro: -1, earth: 0, long: 1, short: 1, bows: 1, dodging: 2, stealth: 2, armour: -2, shields: -2, maces: -2, axes: -2, unarmed: -1, fighting: -1, evo: 1 }),
    desc: 'Fairy folk of the high springs. Frail, quick, and full of magic.',
    traits: ['Sees invisible things', 'Light on their feet (+2 EV)', 'Strong will'],
  },
  dev: {
    n: 'Dev-born', str: 15, int: 5, dex: 6, hp: 3, mp: -2, xp: -1, will: 0, regen: 1.4,
    apt: Object.assign(ALL_SCHOOLS(-2), { spellcasting: -3, fighting: 1, maces: 2, axes: 1, unarmed: 1, throwing: 1, armour: -1, dodging: -2, stealth: -3, bows: -2, slings: -2, short: -1, evo: -1 }),
    desc: 'Half-blood of the giants of the tales. Hits like a falling rock and heals like one too, but casts like one as well.',
    traits: ['Great strength', 'Heals quickly'],
  },
  at: {
    n: 'At-Kishi', str: 10, int: 7, dex: 9, hp: 1, mp: -1, xp: -1, will: 0, move: 7, noBoots: 1,
    apt: Object.assign(ALL_SCHOOLS(-1), { bows: 3, throwing: 1, slings: 1, polearms: 1, fighting: 1, dodging: -1, stealth: -3, armour: -1, shields: -1, unarmed: -1 }),
    desc: 'Horse-folk, human to the waist. They cross open ground faster than anyone and shoot from the gallop.',
    traits: ['Fast movement', 'Superb archers', 'Cannot wear boots'],
  },
  boru: {
    n: 'Börü-kin', str: 10, int: 6, dex: 10, hp: 0, mp: -1, xp: 0, will: 0, claws: 3, regen: 1.5, noGloves: 1,
    apt: Object.assign(ALL_SCHOOLS(-1), { unarmed: 3, short: 1, fighting: 1, dodging: 1, stealth: 2, armour: -2, shields: -1, bows: -1, necro: -2 }),
    desc: 'Wolf-folk of the grey-mane line. Sharp claws, sharp noses, and wounds that close overnight.',
    traits: ['Claws (+3 unarmed damage)', 'Heals quickly', 'Cannot wear gloves'],
  },
  ajdaha: {
    n: 'Ajdaha-born', str: 10, int: 8, dex: 7, hp: 1, mp: 0, xp: -1, will: 10, res: { f: 1 }, breath: 1, scales: 1, maxER: 6,
    apt: { fire: 2, conj: 1, armour: -2, dodging: 0 },
    desc: 'Scaled kin of the dragons. They breathe fire, and their scales thicken as they grow.',
    traits: ['Breathes fire', 'Scales (+1 AC per 4 levels)', 'Fire resistance', 'Cannot wear heavy body armour'],
  },
  kichi: {
    n: 'Kichi', str: 6, int: 9, dex: 12, hp: -2, mp: 0, xp: 0, will: 10, ev: 1, small: 1,
    apt: { short: 2, slings: 3, throwing: 1, dodging: 3, stealth: 4, tloc: 2, hexes: 1, alch: 1, armour: -2, shields: -2, axes: -2, maces: -2, polearms: -3, long: -1, fighting: -1 },
    desc: 'Small folk of the walnut woods. Nobody hears a Kichi coming, and nobody hits one easily.',
    traits: ['Very stealthy', 'Small: cannot use two-handed weapons except slings and bows'],
  },
};
const SPECIES_ORDER = ['iradi', 'tash', 'peri', 'dev', 'at', 'boru', 'ajdaha', 'kichi'];

// Kit entries: [kind, type, {ench, qty, brand, ego}]
const BACKGROUNDS = {
  baatyr: {
    n: 'Baatyr', desc: 'A champion of the epics. Sabre, lamellar and shield, and no patience for spells.', str: 2,
    skills: { fighting: 3, long: 3, armour: 3, shields: 3, dodging: 1 },
    kit: [['weapon', 'kylych'], ['armour', 'kuyak'], ['armour', 'kalkan'], ['potion', 'kymyz', { qty: 2 }]],
  },
  berkut: {
    n: 'Berkutchi', desc: 'An eagle hunter of the high ground, with a bow, a knife, and a golden eagle that follows from valley to valley.', dex: 2,
    skills: { bows: 4, fighting: 1, dodging: 2, stealth: 2, short: 1 },
    kit: [['weapon', 'jaa'], ['weapon', 'pichak'], ['missile', 'ok', { qty: 40 }], ['armour', 'ton'], ['armour', 'tumak'], ['potion', 'kymyz']],
    eagle: 1,
  },
  irchy: {
    n: 'Ïrchy', desc: 'A bard who wins duels with verse. Confuses, slows and lulls foes, then cuts them with words.', int: 2,
    skills: { spellcasting: 2, hexes: 3, conj: 2, dodging: 2, stealth: 1, staves: 1 },
    kit: [['weapon', 'taiak'], ['armour', 'chapan'], ['armour', 'kalpak'], ['potion', 'arashan'], ['book', 'duel']],
    spells: ['barb', 'confuse'],
  },
  jaychy: {
    n: 'Jaychy', desc: 'A weather-maker with a yada stone. Calls lightning and frost out of a clear sky.', int: 2,
    skills: { spellcasting: 2, air: 3, ice: 2, conj: 1, dodging: 2 },
    kit: [['weapon', 'taiak'], ['armour', 'chapan'], ['potion', 'arashan'], ['book', 'yada']],
    spells: ['shock', 'freeze'],
  },
  kashysh: {
    n: 'Kashysh', desc: 'A priest of the yurt chapels, sworn to St. Janyl. Heals with a blessing and fights with a club.', str: 1, int: 1,
    skills: { invo: 4, maces: 3, fighting: 2, armour: 2, shields: 2 },
    kit: [['weapon', 'chokmor'], ['armour', 'kementai'], ['armour', 'kichikalkan'], ['potion', 'aksut']],
    god: 'janyl',
  },
  bakshy: {
    n: 'Bakshy', desc: 'A shaman on the dark path the church condemns. Drinks breath, calls spirits, and raises the fallen.', int: 2,
    skills: { spellcasting: 2, necro: 3, summ: 2, dodging: 1, short: 1 },
    kit: [['weapon', 'pichak'], ['armour', 'chapan'], ['book', 'drum'], ['potion', 'kymyz']],
    spells: ['pain', 'marmots'],
  },
  tabyp: {
    n: 'Tabyp', desc: 'A herbalist-healer who knows which plants cure and which ones kill. Carries extra remedies.', int: 1, dex: 1,
    skills: { spellcasting: 2, alch: 3, tloc: 1, dodging: 2, short: 1 },
    kit: [['weapon', 'pichak'], ['armour', 'chapan'], ['potion', 'kymyz', { qty: 2 }], ['potion', 'aksut'], ['book', 'herbal']],
    spells: ['sting'],
  },
  ulakchy: {
    n: 'Ulakchy', desc: 'A rider of the goat-dragging game and a wrestler of the oodarysh ring. Fights with fists and thrown javelins.', str: 1, dex: 1,
    skills: { unarmed: 4, fighting: 3, dodging: 3, throwing: 2 },
    kit: [['armour', 'ton'], ['missile', 'javelin', { qty: 5 }], ['potion', 'kymyz'], ['potion', 'shoro']],
  },
  soodager: {
    n: 'Soodager', desc: 'A smuggler who knows every gap in the line. Knife, poisoned darts and soft boots.', dex: 2,
    skills: { short: 3, throwing: 3, stealth: 4, dodging: 2, fighting: 1 },
    kit: [['weapon', 'pichak', { ench: 2 }], ['armour', 'chepken'], ['armour', 'etik'], ['missile', 'dart', { qty: 14 }], ['scroll', 'leap']],
  },
};
const BG_ORDER = ['baatyr', 'berkut', 'irchy', 'jaychy', 'kashysh', 'bakshy', 'tabyp', 'ulakchy', 'soodager'];

// Mutations, from black water and Morkhan's touch.
const MUTS = {
  claws: { n: 'claws', good: 1, max: 3, d: l => `Your fingernails are claws (+${l * 2} unarmed damage).` },
  horns: { n: 'horns', good: 1, max: 2, d: l => `You have horns and sometimes headbutt (${l * 3} damage).` },
  thick: { n: 'thick skin', good: 1, max: 3, d: l => `Your skin is thick (+${l} AC).` },
  robust: { n: 'robust', good: 1, max: 3, d: l => `You are robust (+${l * 10}% HP).` },
  regen: { n: 'fast healing', good: 1, max: 3, d: l => `Your wounds close quickly.` },
  eyes: { n: 'eagle eyes', good: 1, max: 1, d: () => 'You can see invisible things.' },
  rf: { n: 'heat resistance', good: 1, max: 1, d: () => 'You resist fire.' },
  rc: { n: 'cold resistance', good: 1, max: 1, d: () => 'You resist cold.' },
  rp: { n: 'poison resistance', good: 1, max: 1, d: () => 'You resist poison.' },
  strong: { n: 'strong', good: 1, max: 2, d: l => `+${l * 2} Strength.` },
  clever: { n: 'clever', good: 1, max: 2, d: l => `+${l * 2} Intelligence.` },
  agile: { n: 'agile', good: 1, max: 2, d: l => `+${l * 2} Dexterity.` },
  frail: { n: 'frail', good: 0, max: 3, d: l => `You are frail (-${l * 10}% HP).` },
  weak: { n: 'weak', good: 0, max: 2, d: l => `-${l * 2} Strength.` },
  dopey: { n: 'dopey', good: 0, max: 2, d: l => `-${l * 2} Intelligence.` },
  clumsy: { n: 'clumsy', good: 0, max: 2, d: l => `-${l * 2} Dexterity.` },
  slowheal: { n: 'slow healing', good: 0, max: 2, d: () => 'Your wounds heal slowly.' },
  stink: { n: 'cattle stink', good: 0, max: 2, d: l => `You smell like a byre (-${l * 30} stealth).` },
  thin: { n: 'thin skin', good: 0, max: 2, d: l => `Your skin is thin (-${l} AC).` },
};
