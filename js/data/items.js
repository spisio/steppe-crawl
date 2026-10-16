"use strict";
// Item tables. Names are Iradi with an English gloss.

const WEAPONS = {
  pichak: { n: 'pichak', gl: 'knife', sk: 'short', dmg: 4, acc: 6, delay: 10, v: 10 },
  kanjar: { n: 'kanjar', gl: 'short sword', sk: 'short', dmg: 6, acc: 4, delay: 11, v: 30 },
  shamshir: { n: 'shamshir', gl: 'scimitar', sk: 'short', dmg: 7, acc: 4, delay: 12, v: 60, d: 5 },
  kylych: { n: 'kylych', gl: 'sabre', sk: 'long', dmg: 8, acc: 2, delay: 13, v: 40 },
  alash: { n: 'alash kylych', gl: 'broadsword', sk: 'long', dmg: 10, acc: 1, delay: 14, v: 80, d: 4 },
  ekikol: { n: 'eki-kol kylych', gl: 'great sword', sk: 'long', dmg: 17, acc: -1, delay: 17, two: 1, v: 140, d: 8 },
  balta: { n: 'balta', gl: 'hand axe', sk: 'axes', dmg: 7, acc: 3, delay: 13, v: 30 },
  jekebalta: { n: 'jeke balta', gl: 'war axe', sk: 'axes', dmg: 11, acc: 0, delay: 15, v: 70, d: 4 },
  chongbalta: { n: 'chong balta', gl: 'broad axe', sk: 'axes', dmg: 15, acc: -2, delay: 17, two: 1, v: 130, d: 8 },
  chokmor: { n: 'chokmor', gl: 'club', sk: 'maces', dmg: 5, acc: 3, delay: 12, v: 8 },
  kamchy: { n: 'kamchy', gl: 'horsewhip', sk: 'maces', dmg: 6, acc: 2, delay: 11, v: 25 },
  kurzu: { n: 'kürzü', gl: 'mace', sk: 'maces', dmg: 8, acc: 3, delay: 14, v: 40 },
  chakan: { n: 'chakan', gl: 'war hammer', sk: 'maces', dmg: 11, acc: 0, delay: 15, v: 70, d: 4 },
  temirchokmor: { n: 'temir chokmor', gl: 'great mace', sk: 'maces', dmg: 17, acc: -4, delay: 17, two: 1, v: 120, d: 8 },
  naiza: { n: 'naiza', gl: 'spear', sk: 'polearms', dmg: 6, acc: 4, delay: 11, v: 25 },
  sungu: { n: 'süngü', gl: 'lance', sk: 'polearms', dmg: 9, acc: 1, delay: 13, v: 55, d: 3 },
  aibalta: { n: 'aibalta', gl: 'moon-axe', sk: 'polearms', dmg: 13, acc: -3, delay: 15, two: 1, v: 100, d: 6 },
  taiak: { n: 'taiak', gl: "shepherd's staff", sk: 'staves', dmg: 5, acc: 5, delay: 12, v: 15 },
  uzuntaiak: { n: 'uzun taiak', gl: 'quarterstaff', sk: 'staves', dmg: 10, acc: 3, delay: 13, two: 1, v: 50, d: 3 },
  jaa: { n: 'jaa', gl: 'bow', sk: 'bows', dmg: 2, acc: 0, delay: 12, two: 1, shoot: 8, sacc: 2, ammo: 'ok', v: 40 },
  kuramajaa: { n: 'kurama jaa', gl: 'composite longbow', sk: 'bows', dmg: 3, acc: 0, delay: 15, two: 1, shoot: 13, sacc: 0, ammo: 'ok', v: 120, d: 6 },
  salyng: { n: 'salyng', gl: 'sling', sk: 'slings', dmg: 1, acc: 0, delay: 11, shoot: 5, sacc: 2, ammo: 'sling', v: 15 },
};
// Magic staves are taiaks that strengthen one school and guard against one element.
const STAVES = {
  fire: { n: 'ajdaha staff', school: 'fire', res: 'rf' },
  cold: { n: 'boran staff', school: 'ice', res: 'rc' },
  air: { n: 'tengri staff', school: 'air', res: 're' },
  earth: { n: 'tash staff', school: 'earth', res: null },
  death: { n: 'kara staff', school: 'necro', res: 'rn' },
  poison: { n: 'karakurt staff', school: 'alch', res: 'rp' },
  verse: { n: 'ırchy staff', school: 'hexes', res: 'will' },
};

const MISSILES = {
  ok: { n: 'ok', pl: 'ok', gl: 'arrow', launcher: 'bows', dmg: 0, v: 1 },
  tash: { n: 'sling stone', pl: 'sling stones', gl: 'stone', launcher: 'slings', dmg: 0, throwDmg: 3, v: 0.5 },
  korgoshun: { n: 'korgoshun', pl: 'korgoshun', gl: 'lead shot', launcher: 'slings', dmg: 3, throwDmg: 4, v: 2 },
  javelin: { n: 'kichi naiza', pl: 'kichi naiza', gl: 'javelin', throwDmg: 10, acc: 1, v: 8 },
  dart: { n: 'karakurt dart', pl: 'karakurt darts', gl: 'poison dart', throwDmg: 2, acc: 3, poison: 1, v: 4 },
};

const ARMOURS = {
  chapan: { n: 'chapan', gl: 'quilted robe', slot: 'body', ac: 2, er: 0, v: 15 },
  ton: { n: 'ton', gl: 'sheepskin coat', slot: 'body', ac: 3, er: 4, v: 25 },
  kementai: { n: 'kementai', gl: 'felt coat', slot: 'body', ac: 4, er: 6, v: 40 },
  kuyak: { n: 'kuyak', gl: 'lamellar', slot: 'body', ac: 6, er: 10, v: 80 },
  sooyt: { n: 'sooyt', gl: 'mail', slot: 'body', ac: 8, er: 15, v: 130, d: 4 },
  temirkuyak: { n: 'temir kuyak', gl: 'iron plate', slot: 'body', ac: 10, er: 18, v: 200, d: 7 },
  ajdahascale: { n: 'ajdaha scales', gl: 'dragon scales', slot: 'body', ac: 8, er: 11, res: { rf: 1, rc: -1 }, v: 500, d: 9 },
  akscale: { n: 'ak ajdaha scales', gl: 'white dragon scales', slot: 'body', ac: 8, er: 11, res: { rc: 1, rf: -1 }, v: 500, d: 9 },
  chepken: { n: 'chepken', gl: 'cloak', slot: 'cloak', ac: 1, er: 0, v: 20 },
  kalpak: { n: 'ak-kalpak', gl: 'felt hat', slot: 'head', ac: 0, er: 0, v: 10 },
  tumak: { n: 'tumak', gl: 'fur hat', slot: 'head', ac: 1, er: 0, v: 20 },
  dulyga: { n: 'dulyga', gl: 'helmet', slot: 'head', ac: 1, er: 0, v: 30 },
  kolkap: { n: 'kolkap', gl: 'gloves', slot: 'hands', ac: 1, er: 0, v: 20 },
  etik: { n: 'etik', gl: 'riding boots', slot: 'feet', ac: 1, er: 0, v: 20 },
  kichikalkan: { n: 'kichi kalkan', gl: 'buckler', slot: 'shield', sh: 3, er: 1, v: 20 },
  kalkan: { n: 'kalkan', gl: 'shield', slot: 'shield', sh: 8, er: 3, v: 45 },
  chongkalkan: { n: 'chong kalkan', gl: 'tower shield', slot: 'shield', sh: 13, er: 6, v: 90, d: 4 },
};
const SLOT_NAMES = { weapon: 'weapon', body: 'body', cloak: 'cloak', head: 'head', hands: 'hands', feet: 'feet', shield: 'shield', ringL: 'left ring', ringR: 'right ring', amulet: 'amulet' };

const BRANDS = {
  flame: { n: 'of the Ajdaha', short: 'flame', elem: 'fire', d: 'Burns what it hits (fire).' },
  frost: { n: 'of Black Frost', short: 'freeze', elem: 'cold', d: 'Chills what it hits (cold).' },
  venom: { n: 'of the Karakurt', short: 'venom', d: 'Poisons what it hits.' },
  holy: { n: 'of the White Rider', short: 'holy', d: 'Strikes evil and undead with holy force (+75%).' },
  elec: { n: 'of Tengri', short: 'elec', elem: 'elec', d: 'Sometimes looses a crack of lightning.' },
  speed: { n: 'of the Tulpar', short: 'speed', d: 'Strikes a third faster.' },
  prot: { n: 'of Felt', short: 'protect', d: 'Grants +5 AC while wielded.' },
  drain: { n: 'of Morkhan', short: 'drain', evil: 1, d: 'Drains the life of the living. St. Janyl abhors it.' },
  vamp: { n: 'of the Albasty', short: 'vamp', evil: 1, d: 'Heals you as it wounds the living. St. Janyl abhors it.' },
};
const ARMOUR_EGOS = {
  rf: { n: 'of the Hearth', d: 'Fire resistance.', slots: ['body', 'cloak', 'shield'] },
  rc: { n: 'of Winter', d: 'Cold resistance.', slots: ['body', 'cloak', 'shield', 'head'] },
  rp: { n: 'of Juniper', d: 'Poison resistance.', slots: ['body', 'cloak'] },
  sinv: { n: 'of the Eagle', d: 'Lets you see invisible things.', slots: ['head'] },
  stealth: { n: 'of the Snow Leopard', d: 'Stealth.', slots: ['feet', 'cloak'] },
  will: { n: 'of the Aksakal', d: 'Stronger will against hexes.', slots: ['head', 'cloak', 'body'] },
  str: { n: 'of the Ram', d: '+3 Strength.', slots: ['hands'] },
  dex: { n: 'of the Lark', d: '+3 Dexterity.', slots: ['hands'] },
  int: { n: 'of the Owl', d: '+3 Intelligence.', slots: ['head'] },
  run: { n: 'of the Tulpar', d: 'You move faster.', slots: ['feet'] },
  prot: { n: 'of Felt', d: '+3 AC.', slots: ['shield', 'cloak'] },
  refl: { n: 'of the Lake', d: 'Reflects missiles and bolts back at their source.', slots: ['shield'] },
  regen: { n: "of Mare's Milk", d: 'Regenerates health.', slots: ['body', 'cloak'] },
};

const POTIONS = {
  kymyz: { n: 'kymyz', gl: 'curing', w: 30, v: 25 },
  aksut: { n: 'ak süt', gl: 'heal wounds', w: 22, v: 50 },
  bozo: { n: 'bozo', gl: 'berserk rage', w: 8, v: 30 },
  tulpar: { n: "Tulpar's sweat", gl: 'haste', w: 12, v: 60 },
  arashan: { n: 'arashan water', gl: 'magic', w: 12, v: 40 },
  shoro: { n: 'shoro', gl: 'might', w: 10, v: 40 },
  chai: { n: 'kara chai', gl: 'brilliance', w: 6, v: 40 },
  ayran: { n: 'salkyn ayran', gl: 'resistance', w: 6, v: 60 },
  tuman: { n: 'tuman water', gl: 'invisibility', w: 6, v: 60 },
  oldkymyz: { n: 'ancient kymyz', gl: 'experience', w: 1.5, v: 500 },
  karasuu: { n: 'kara suu', gl: 'mutation', w: 5, v: 10 },
  tears: { n: "albasty's tears", gl: 'confusion', w: 4, v: 5 },
  janylmilk: { n: "Janyl's milk", gl: 'cure mutation', w: 3, v: 120 },
};
const POTION_LOOKS = ['horn', 'felt-wrapped', 'silver', 'clay', 'birch-bark', 'copper', 'lacquered', 'leather', 'gourd', 'blue glass', 'bone', 'painted', 'walnut-wood'];

const SCROLLS = {
  wind: { n: 'Wind Bata', gl: 'teleportation', w: 16, v: 40 },
  leap: { n: "Eagle's Leap", gl: 'blinking', w: 10, v: 50 },
  sanjyra: { n: 'Sanjyra of the Land', gl: 'magic mapping', w: 10, v: 50 },
  smith: { n: "Smith's Bata", gl: 'enchant weapon', w: 12, v: 60 },
  felt: { n: 'Bata of Felt', gl: 'enchant armour', w: 10, v: 60 },
  verse: { n: "Ïrchy's Verse", gl: 'identify', w: 20, v: 20 },
  crack: { n: 'Kamchy Crack', gl: 'fear', w: 8, v: 40 },
  juniper: { n: 'Juniper Smoke', gl: 'fog', w: 8, v: 20 },
  stillness: { n: 'Bata of Stillness', gl: 'silence', w: 5, v: 40 },
  burning: { n: 'Burning Steppe', gl: 'immolation', w: 5, v: 40 },
  bellow: { n: "Morkhan's Bellow", gl: 'noise', w: 6, v: 5 },
  torment: { n: "Morkhan's Torment", gl: 'torment', w: 3, v: 10 },
  mark: { n: "Kambar's Mark", gl: 'brand weapon', w: 4, v: 150 },
  clans: { n: 'Call of the Clans', gl: 'summoning', w: 4, v: 80 },
  kydyr: { n: "Kydyr's Gift", gl: 'acquirement', w: 1.5, v: 600 },
};
const SYL = ['ak', 'kara', 'tör', 'kosh', 'bel', 'jol', 'suu', 'tash', 'ala', 'kök', 'sary', 'bür', 'oomin', 'kuble', 'nur', 'jer', 'salyba', 'tulpar', 'arsha', 'ırda', 'bata', 'kel', 'achyk', 'boz', 'jıldız', 'aryk', 'too'];

const WANDS = {
  flame: { n: 'ajdaha tooth', gl: 'flame', w: 10, v: 150 },
  iceblast: { n: 'blizzard horn', gl: 'iceblast', w: 7, v: 200 },
  lightning: { n: 'thunder bone', gl: 'lightning', w: 5, v: 220 },
  para: { n: 'albasty hair', gl: 'paralysis', w: 7, v: 180 },
  dig: { n: 'marmot claw', gl: 'digging', w: 6, v: 120 },
  charm: { n: 'kuda ribbon', gl: 'charming', w: 4, v: 250 },
  away: { n: 'wind feather', gl: 'teleport other', w: 6, v: 150 },
};

const RINGS = {
  prot: { n: 'protection', ench: 1, w: 8 }, ev: { n: 'evasion', ench: 1, w: 7 }, str: { n: 'strength', ench: 1, w: 6 },
  dex: { n: 'dexterity', ench: 1, w: 6 }, int: { n: 'intelligence', ench: 1, w: 6 }, slay: { n: 'slaying', ench: 1, w: 6 },
  rf: { n: 'fire resistance', w: 5 }, rc: { n: 'cold resistance', w: 5 }, rp: { n: 'poison resistance', w: 5 },
  sinv: { n: 'see invisible', w: 4 }, stealth: { n: 'stealth', w: 4 }, wiz: { n: 'wizardry', w: 4 },
  mp: { n: 'magical power', w: 4 }, will: { n: 'willpower', w: 4 },
};
const RING_LOOKS = ['turquoise', 'carnelian', 'jade', 'coral', 'silver', 'copper', 'iron', 'bone', 'horn', 'gold', 'lapis', 'agate', 'amber', 'garnet', 'jet', 'pearl'];
const AMULETS = {
  janyl: { n: 'tumar of Janyl', gl: 'life-saving', w: 3 }, regen: { n: "tumar of Mare's Milk", gl: 'regeneration', w: 6 },
  mregen: { n: 'tumar of the Hearth', gl: 'magic regeneration', w: 6 }, faith: { n: 'tumar of the Kurultai', gl: 'faith', w: 4 },
  refl: { n: 'tumar of the Lake', gl: 'reflection', w: 4 }, guard: { n: 'tumar of the Arbak', gl: 'guardian spirit', w: 4 },
};
const AMULET_LOOKS = ['triangular felt', 'beaded', 'silver-chased', 'carved bone', 'red-thread', 'owl-feather', 'cowrie', 'leather'];

const MISC = {
  horn: { n: 'Horn of Kambar', gl: 'summons horses', max: 3, v: 400 },
  yada: { n: 'yada stone', gl: 'calls a freezing storm', max: 3, v: 400 },
  komuz: { n: 'old komuz', gl: 'plays a sleeping song', max: 3, v: 400 },
};

const BOOKS = {
  duel: { n: 'Dastan of the Duel', spells: ['barb', 'confuse', 'slow', 'sleep'] },
  yada: { n: "Jaychy's Weather Book", spells: ['shock', 'freeze', 'swift', 'hoarfrost', 'discharge'] },
  drum: { n: "Bakshy's Drum-Skin", spells: ['pain', 'marmots', 'wolf', 'drain', 'raise'] },
  herbal: { n: "Tabyp's Herbal", spells: ['sting', 'blink', 'smoke', 'venombolt'] },
  fire: { n: 'Dastan of the Ajdaha', spells: ['flame', 'fireball', 'firestorm'] },
  winter: { n: 'Winter Dastan', spells: ['freeze', 'hoarfrost', 'frostbolt', 'blizzardsong'] },
  sky: { n: 'Dastan of the Sky', spells: ['shock', 'swift', 'airstrike', 'lightning'] },
  stone: { n: 'Dastan of Stone', spells: ['stones', 'dig', 'kurshot'] },
  roads: { n: 'Book of Roads', spells: ['blink', 'sendaway', 'teleself'] },
  morkhan: { n: 'Black Book of Morkhan', spells: ['pain', 'drain', 'agony', 'raise', 'barrowdead'] },
  calling: { n: 'Book of Calling', spells: ['marmots', 'wolf', 'spiders', 'tulpar'] },
  verses: { n: 'Book of Verses', spells: ['confuse', 'sleep', 'fear', 'kinship'] },
  poisons: { n: 'Second Herbal', spells: ['venombolt', 'smoke', 'miasma'] },
};

// Unique artefacts.
const UNRANDS = [
  { id: 'janylkylych', k: 'weapon', t: 'kylych', ench: 6, brand: 'holy', n: 'Kylych of Janyl Baatyr', props: { rn: 1 }, d: 'The sabre of the epic heroine, white as milk at the edge.', minD: 6 },
  { id: 'kurultai', k: 'weapon', t: 'kamchy', ench: 5, brand: 'speed', n: 'Kamchy of the Kurultai', props: { will: 1, fear: 1 }, d: 'The veto whip. Its crack can send a foe running.', minD: 5 },
  { id: 'greymane', k: 'weapon', t: 'jekebalta', ench: 4, brand: 'frost', n: 'Axe of the Grey Mane', props: { str: 3 }, d: 'A Kökjal heirloom with a wolf on the cheek of the blade.', minD: 6 },
  { id: 'toshtuk', k: 'weapon', t: 'kuramajaa', ench: 5, brand: 'flame', n: 'Bow of Er Töshtük', props: { dex: 2 }, d: 'The bow of the hero who rode into the underworld and back.', minD: 8 },
  { id: 'kiss', k: 'weapon', t: 'pichak', ench: 6, brand: 'venom', n: "Karakurt's Kiss", props: { stealth: 1, rp: 1 }, d: 'A thin black knife. It never shines.', minD: 4 },
  { id: 'firstchurch', k: 'armour', t: 'kementai', ench: 4, n: 'Felt of the First Church', props: { rn: 1, regen: 1, will: 1 }, d: 'White felt said to have been cut for the First Church of Janyl.', minD: 7 },
  { id: 'goldenhelm', k: 'armour', t: 'dulyga', ench: 4, n: 'Helm of the Golden Warrior', props: { rf: 1, str: 2 }, d: 'Gold leaf on bronze, from a kurgan older than the clans.', minD: 9 },
  { id: 'oldbards', k: 'weapon', t: 'taiak', ench: 3, staff: 'verse', n: 'Staff of the Old Bards', props: { int: 3, mp: 5 }, d: 'Carved with a thousand lines of verse.', minD: 5 },
];
