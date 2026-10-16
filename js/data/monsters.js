"use strict";
// Bestiary. lv = absolute depth range; br = regions where it spawns.
// atk: [damage, verb, effect, value]. sp: [spell, chance per turn].
// Flags: animal evil undead demonic holy unique fly swim sinv invis nocorpse mindless erratic summoned

const MT = {};
function M(k, o) {
  o.k = k; o.spd = o.spd || 10; o.ac = o.ac || 0; o.ev = o.ev === undefined ? 5 : o.ev;
  o.atk = o.atk || [[3, 'hits']]; o.br = o.br || ['V']; o.res = o.res || {};
  o.fl = new Set((o.f || '').split(' ').filter(Boolean));
  if (o.will === undefined) o.will = o.hd * 7 + (o.fl.has('unique') ? 25 : 0);
  if (o.fl.has('mindless')) o.will = 999;
  o.xp = Math.round((1 + o.hd * o.hd * 0.8) * (o.sp ? 1.3 : 1) * (o.spd > 12 ? 1.2 : 1) * (o.fl.has('unique') ? 2 : 1));
  o.lv = o.lv || [99, 99];
  MT[k] = o;
}

// --- the valleys and their wildlife ---
M('marmot', { g: 'r', c: '#b98f5c', n: 'steppe marmot', hd: 1, hp: 4, ev: 6, atk: [[3, 'bites']], lv: [1, 3], br: ['V', 'woods'], f: 'animal',
  desc: 'A fat, whistling ground-dweller. It bites when cornered.' });
M('jackal', { g: 'j', c: '#d9b45a', n: 'jackal', hd: 1, hp: 5, ac: 1, ev: 7, spd: 14, atk: [[3, 'bites']], lv: [1, 4], pack: [2, 4], f: 'animal',
  desc: 'Thin, quick and never alone.' });
M('bat', { g: 'b', c: '#9a8a7a', n: 'cave bat', hd: 1, hp: 4, ev: 14, spd: 20, atk: [[2, 'bites']], lv: [2, 7], br: ['tunnels', 'kurgan'], f: 'animal fly erratic',
  desc: 'It flits about in the dark and never flies straight.' });
M('viper', { g: 'S', c: '#86b84e', n: 'steppe viper', hd: 2, hp: 8, ac: 1, ev: 9, atk: [[3, 'bites', 'poison', 3]], lv: [2, 6], br: ['V', 'sands'], f: 'animal',
  desc: 'A grey steppe viper, warm from the stones.' });
M('karakurt', { g: 's', c: '#c94f84', n: 'karakurt', hd: 2, hp: 7, ac: 1, ev: 8, spd: 12, atk: [[2, 'bites', 'poison', 5]], lv: [2, 7], br: ['V', 'tunnels', 'sands'], f: 'animal',
  desc: 'The black widow of the steppe. Its bite burns for days.' });
M('soodager', { g: '@', c: '#c99d6c', n: 'soodager', hd: 3, hp: 14, ac: 2, ev: 10, atk: [[6, 'hits']], lv: [2, 8], br: ['V', 'tunnels'], drops: 1,
  desc: 'A smuggler working the old routes. Every pocket holds something.' });
M('tazy', { g: 'h', c: '#c9a070', n: 'tazy hound', hd: 3, hp: 12, ac: 2, ev: 10, spd: 15, atk: [[5, 'bites']], lv: [3, 7], br: ['V', 'tunnels'], pack: [2, 3], f: 'animal',
  desc: 'A lean sighthound. The smugglers keep them hungry.' });
M('watersnake', { g: 'S', c: '#5aa0c0', n: 'water snake', hd: 3, hp: 11, ac: 1, ev: 10, atk: [[4, 'bites']], lv: [2, 7], br: ['V', 'woods'], f: 'animal swim',
  desc: 'It hunts in the rivers and the shallows.' });
M('lynx', { g: 'f', c: '#c8a878', n: 'lynx', hd: 3, hp: 12, ac: 1, ev: 12, spd: 14, atk: [[5, 'claws']], lv: [3, 8], br: ['V', 'woods'], f: 'animal',
  desc: 'Tufted ears, silent paws.' });
M('archer', { g: '@', c: '#e0bb85', n: 'soodager archer', hd: 4, hp: 16, ac: 2, ev: 10, atk: [[4, 'hits']], sp: [['arrow', 0.5]], lv: [3, 9], br: ['V', 'tunnels'], drops: 1,
  desc: 'A smuggler who prefers to settle things from a distance.' });
M('wolf', { g: 'h', c: '#bcb7ad', n: 'grey wolf', hd: 4, hp: 15, ac: 2, ev: 10, spd: 14, atk: [[6, 'bites']], lv: [3, 9], br: ['V', 'woods', 'blizzard'], pack: [2, 4], f: 'animal',
  desc: 'Kökbörü, the grey wolf the old clans claim as an ancestor. It does not return the courtesy.' });
M('boar', { g: 'q', c: '#a0704a', n: 'wild boar', hd: 4, hp: 18, ac: 4, ev: 6, spd: 12, atk: [[7, 'gores']], lv: [3, 9], br: ['V', 'woods'], f: 'animal',
  desc: 'Walnut-fed and furious.' });
M('eagle', { g: 'B', c: '#c8a050', n: 'wild golden eagle', hd: 4, hp: 14, ac: 1, ev: 14, spd: 18, atk: [[6, 'claws']], lv: [3, 8], f: 'animal fly',
  desc: 'A golden eagle no berkutchi has ever hooded.' });
M('tarantula', { g: 's', c: '#8a5a3a', n: 'bii tarantula', hd: 4, hp: 16, ac: 3, ev: 10, atk: [[6, 'bites', 'poison', 4]], lv: [4, 9], br: ['sands', 'tunnels'], f: 'animal',
  desc: 'A hairy desert spider as wide as a hand-span. Its name means "dancer".' });
M('imp', { g: 'i', c: '#ff6050', n: 'Morkhan imp', hd: 4, hp: 14, ac: 2, ev: 15, spd: 16, atk: [[5, 'claws']], sp: [['blink', 0.12], ['firebolt', 0.2]], lv: [5, 12], br: ['V', 'hidden'], f: 'evil demonic nocorpse', res: { f: 1 },
  desc: 'A little horned thing that smells of scorched felt.' });
M('argali', { g: 'Y', c: '#eadfc4', n: 'argali ram', hd: 5, hp: 24, ac: 3, ev: 7, spd: 12, atk: [[9, 'butts']], lv: [4, 10], br: ['V', 'blizzard'], f: 'animal',
  desc: 'A wild ram with horns like coiled millstones.' });
M('kuyun', { g: 'v', c: '#d8c890', n: 'kuyun', hd: 5, hp: 18, ev: 18, spd: 18, atk: [[5, 'buffets', 'conf', 0]], lv: [5, 11], br: ['sands', 'V'], f: 'fly nocorpse mindless erratic', res: { p: 3, e: 1 },
  desc: 'A whirlwind of dust that walks the steppe on its own business.' });
M('skeleton', { g: 'z', c: '#e8e2d0', n: 'kurgan skeleton', hd: 5, hp: 22, ac: 4, ev: 6, atk: [[8, 'hits']], lv: [6, 12], br: ['kurgan'], f: 'undead mindless evil nocorpse', res: { p: 3, c: 1, n: 3 },
  desc: 'Old bones in rotten felt, still holding a bronze blade.' });
M('vampbat', { g: 'b', c: '#c04050', n: 'blood bat', hd: 3, hp: 10, ev: 16, spd: 20, atk: [[4, 'bites', 'vamp', 0]], lv: [5, 11], br: ['tunnels', 'kurgan'], f: 'animal fly erratic',
  desc: 'It drinks, and grows stronger as it drinks.' });
M('bakshy', { g: '@', c: '#c862d8', n: 'bakshy', hd: 6, hp: 22, ac: 1, ev: 10, atk: [[5, 'hits']], sp: [['dark', 0.3], ['healo', 0.2]], lv: [5, 12], br: ['V', 'tunnels', 'kurgan'], f: 'evil', drops: 1,
  desc: 'A shaman who serves Morkhan with frame drum and bone.' });
M('kumai', { g: 'B', c: '#7a7a8a', n: 'kumai', hd: 6, hp: 26, ac: 2, ev: 10, spd: 16, atk: [[8, 'tears at']], lv: [5, 11], br: ['V', 'sands'], f: 'animal fly',
  desc: 'The giant vulture of the old stories, big enough to carry off a lamb, or a child.' });
M('bear', { g: 'U', c: '#93603d', n: 'brown bear', hd: 7, hp: 36, ac: 5, ev: 6, atk: [[11, 'claws'], [8, 'bites']], lv: [5, 11], br: ['V', 'woods'], f: 'animal',
  desc: 'A brown bear of the high forests, fat on walnuts and bad-tempered.' });
M('captain', { g: '@', c: '#f0c070', n: 'soodager captain', hd: 7, hp: 32, ac: 4, ev: 10, atk: [[11, 'hits']], sp: [['arrow', 0.15]], lv: [5, 11], br: ['V', 'tunnels'],
  band: [['soodager', 1, 3], ['archer', 0, 2]], drops: 2, desc: 'A smuggler chief with a scar for every crossing.' });
M('leopard', { g: 'f', c: '#ececf4', n: 'jolbors', hd: 7, hp: 30, ac: 2, ev: 16, spd: 16, atk: [[10, 'claws'], [7, 'bites']], lv: [6, 13], br: ['V', 'blizzard', 'woods'], f: 'animal',
  desc: 'The snow leopard. You hear it after it lands.' });
M('scorpion', { g: 's', c: '#e2c443', n: 'giant scorpion', hd: 7, hp: 28, ac: 8, ev: 7, atk: [[9, 'stings', 'poison', 6]], lv: [7, 13], br: ['sands', 'V'], f: 'animal',
  desc: 'A sand scorpion the size of a saddle.' });
M('rider', { g: 'Z', c: '#a7c0d2', n: 'restless rider', hd: 8, hp: 34, ac: 4, ev: 10, spd: 15, atk: [[11, 'strikes', 'drain', 0]], lv: [7, 14], br: ['V', 'kurgan', 'blizzard'], f: 'undead evil nocorpse', res: { p: 3, n: 3, c: 1 },
  desc: 'A horseman whose saddle faces backward. He fell long ago and was never laid to rest.' });
M('bull', { g: 'Y', c: '#8a8aa2', n: 'black bull', hd: 8, hp: 40, ac: 6, ev: 5, spd: 12, atk: [[13, 'gores']], lv: [6, 13], br: ['V', 'hidden'], f: 'evil',
  desc: 'A black bull with ember eyes. Cattle are an ill omen in Irad, and this one is why.' });
M('almasty', { g: 'H', c: '#a89880', n: 'almasty', hd: 8, hp: 44, ac: 3, ev: 8, atk: [[12, 'claws']], lv: [8, 13], br: ['blizzard', 'V'], res: { c: 1 },
  desc: 'The hairy wild man of the high passes. Herders leave it bread, and it leaves them alone. You have no bread.' });
M('ayaz', { g: 'W', c: '#b0d0ff', n: 'ayaz spirit', hd: 7, hp: 28, ac: 3, ev: 12, atk: [[8, 'touches', 'cold', 0]], lv: [8, 13], br: ['blizzard'], f: 'nocorpse fly', res: { c: 3, p: 3 },
  desc: 'A spirit of hard frost that drifts across the snowfields.' });
M('albasty', { g: 'A', c: '#e55a5a', n: 'albasty', hd: 9, hp: 36, ac: 3, ev: 14, spd: 13, atk: [[8, 'touches', 'para', 0.2]], sp: [['scream', 0.1]], lv: [8, 15], br: ['V', 'hidden', 'kurgan'], f: 'evil demonic nocorpse', res: { n: 1 },
  desc: 'A demon woman with yellow hair and her feet turned backward. Her touch stops the breath.' });
M('wight', { g: 'W', c: '#9ab0a0', n: 'kurgan wight', hd: 9, hp: 36, ac: 4, ev: 10, atk: [[9, 'hits', 'drain', 0]], sp: [['dark', 0.15]], lv: [9, 14], br: ['kurgan'], f: 'undead evil nocorpse', res: { p: 3, n: 3, c: 1 },
  desc: 'Something that sleeps in a burial mound and resents being woken.' });
M('jeztyrnak', { g: 'J', c: '#d8853c', n: 'jeztyrnak', hd: 9, hp: 42, ac: 5, ev: 11, spd: 12, atk: [[11, 'claws'], [11, 'claws']], lv: [9, 15], br: ['V', 'hidden'], f: 'evil demonic nocorpse',
  desc: 'A crone with copper claws on every finger.' });
M('cultist', { g: '@', c: '#d04a5a', n: 'horned cultist', hd: 9, hp: 45, ac: 5, ev: 8, atk: [[13, 'hits']], sp: [['berserkself', 0.15]], lv: [8, 14], br: ['V', 'hidden'], f: 'evil', drops: 1,
  desc: "A follower of Morkhan in a bull-horned cap, fighting as if pain were a rumour." });
M('youngajdaha', { g: 'D', c: '#6ad08f', n: 'young ajdaha', hd: 9, hp: 50, ac: 7, ev: 6, atk: [[12, 'bites']], sp: [['firebreath', 0.2]], lv: [8, 13], br: ['woods', 'V'], res: { f: 2 },
  desc: 'A serpent-dragon no longer than a cart. It already breathes fire.' });
M('tiger', { g: 'f', c: '#e09a3a', n: 'Turan tiger', hd: 10, hp: 48, ac: 3, ev: 12, spd: 14, atk: [[14, 'claws'], [11, 'bites']], lv: [9, 14], br: ['woods', 'V'], f: 'animal',
  desc: 'The striped tiger of the river thickets, thought gone from the world. It is not.' });
M('boran', { g: 'E', c: '#7091e0', n: 'kara boran', hd: 10, hp: 45, ac: 4, ev: 18, spd: 15, atk: [[8, 'buffets', 'cold', 0]], sp: [['coldbolt', 0.35]], lv: [10, 15], br: ['blizzard', 'hidden'], f: 'nocorpse fly mindless', res: { c: 3, p: 3, e: 1 },
  desc: 'A knot of black wind with voices in it.' });
M('mummy', { g: 'M', c: '#d8c070', n: 'Saka mummy', hd: 11, hp: 55, ac: 6, ev: 5, spd: 8, atk: [[14, 'hits']], sp: [['curse', 0.15]], lv: [10, 15], br: ['kurgan'], f: 'undead evil nocorpse', res: { p: 3, n: 3, c: 1, f: -1 },
  desc: 'A chieftain of the old Saka, wrapped in gold thread and spite.' });
M('karabakshy', { g: '@', c: '#a64ad0', n: 'kara bakshy', hd: 11, hp: 45, ac: 2, ev: 10, atk: [[8, 'hits']], sp: [['darkbolt', 0.25], ['animate', 0.15], ['summonbull', 0.08], ['slow', 0.15]], lv: [10, 15], br: ['V', 'kurgan', 'hidden'], f: 'evil', drops: 2,
  desc: 'An elder of the dark path, who raises what falls around him.' });
M('dev', { g: 'O', c: '#b9a983', n: 'dev', hd: 12, hp: 70, ac: 6, ev: 4, spd: 9, atk: [[20, 'hits']], lv: [9, 15], br: ['V', 'hidden', 'woods'], f: 'evil',
  desc: 'A dev: a hill-sized brute of the old tales.' });
M('balbal', { g: '8', c: '#b0a898', n: 'balbal guardian', hd: 12, hp: 70, ac: 12, ev: 2, spd: 8, atk: [[16, 'strikes']], lv: [10, 15], br: ['kurgan'], f: 'nocorpse mindless', res: { p: 3, f: 1, c: 1, e: 1, n: 3 },
  desc: 'A stone figure from a kurgan, cup in hand. It has started to walk.' });
M('akdev', { g: 'O', c: '#e0f0ff', n: 'ak dev', hd: 14, hp: 90, ac: 8, ev: 4, spd: 9, atk: [[22, 'hits']], sp: [['coldbolt', 0.2]], lv: [11, 15], br: ['blizzard', 'hidden'], f: 'evil', res: { c: 2 },
  desc: 'A white dev of the glaciers, who breathes out winter.' });
M('ajdaha', { g: 'D', c: '#43b86f', n: 'ajdaha', hd: 15, hp: 110, ac: 10, ev: 5, atk: [[20, 'bites'], [13, 'claws']], sp: [['firebreath', 0.2]], lv: [12, 15], br: ['hidden', 'woods'], res: { f: 2, c: -1 },
  desc: 'A great serpent-dragon that breathes fire.' });
M('akajdaha', { g: 'D', c: '#e8f4ff', n: 'ak ajdaha', hd: 15, hp: 110, ac: 10, ev: 5, atk: [[20, 'bites'], [13, 'claws']], sp: [['coldbreath', 0.2]], lv: [12, 15], br: ['blizzard'], res: { c: 2, f: -1 },
  desc: 'A white serpent-dragon that breathes frost.' });

// --- uniques ---
M('toko', { g: 'r', c: '#ffd27a', n: 'Tökö the Marmot King', hd: 4, hp: 32, ac: 2, ev: 8, atk: [[7, 'bites']], sp: [['callmarmots', 0.25]], lv: [2, 4], f: 'unique animal',
  desc: 'The fattest marmot in Irad, with a court of lesser marmots.', speech: ['Tökö whistles furiously.', 'Tökö puffs up his cheeks at you.'] });
M('kyzylkoz', { g: '@', c: '#ff6050', n: 'Kyzyl-Köz the Cutpurse', hd: 5, hp: 36, ac: 3, ev: 14, spd: 12, atk: [[9, 'slashes']], sp: [['knife', 0.3], ['blink', 0.1]], lv: [3, 6], br: ['V', 'tunnels'], f: 'unique', drops: 2,
  desc: 'A red-eyed knife-thrower with a gold tooth and no friends.', speech: ['"Your silver or your ears!"', 'Kyzyl-Köz grins with a gold tooth.'] });
M('kempir', { g: '@', c: '#ff86e4', n: 'Mystan Kempir', hd: 8, hp: 55, ac: 2, ev: 10, atk: [[7, 'hits']], sp: [['dark', 0.25], ['slow', 0.2], ['confuse', 0.15]], lv: [5, 9], br: ['V', 'woods'], f: 'unique evil', drops: 2,
  desc: 'The witch-crone of the tales, with a ladle of poison and a tongue of curses.', speech: ['Mystan Kempir cackles: "Come closer, child."', 'Mystan Kempir stirs her ladle.'] });
M('oldkurt', { g: 's', c: '#ff4f90', n: 'Old Kara-Kurt', hd: 10, hp: 75, ac: 6, ev: 10, spd: 12, atk: [[12, 'bites', 'poison', 9]], lv: [6, 10], br: ['woods', 'V', 'tunnels'], f: 'unique animal', drops: 1,
  desc: 'A karakurt grown huge on a century of lost travellers.' });
M('alpkara', { g: 'O', c: '#ffd27a', n: 'Alp-Kara the Dev', hd: 15, hp: 150, ac: 9, ev: 4, spd: 9, atk: [[28, 'hits']], lv: [10, 13], br: ['V', 'hidden'], f: 'unique evil', drops: 2,
  desc: 'The black dev of the passes. Shepherds pile stones to keep him away.', speech: ['"Little rider. Little bones."', 'Alp-Kara laughs like a rockslide.'] });
M('jelmoguz', { g: 'D', c: '#c060c0', n: 'Jelmoguz the Seven-Headed', hd: 16, hp: 160, ac: 8, ev: 6, atk: [[12, 'bites'], [12, 'bites'], [12, 'bites'], [12, 'bites']], sp: [['dark', 0.2]], lv: [13, 15], br: ['hidden'], f: 'unique evil', drops: 2,
  desc: 'The seven-headed witch-serpent of the old stories. Every head is hungry.' });
// Region bosses (placed, not spawned).
M('bakai', { g: '@', c: '#ffc040', n: 'Bakai, King of the Tunnels', hd: 10, hp: 85, ac: 6, ev: 12, atk: [[15, 'slashes']], sp: [['arrow', 0.2], ['hasteself', 0.08]], br: ['tunnels'], f: 'unique', drops: 3,
  band: [['soodager', 2, 3], ['archer', 1, 2]], desc: 'The smuggler king, who has never paid a toll in his life.', speech: ['"Nobody walks my tunnels for free."'] });
M('akboru', { g: 'h', c: '#ffffff', n: 'Ak Börü, the White Wolf', hd: 11, hp: 85, ac: 4, ev: 15, spd: 17, atk: [[15, 'bites']], sp: [['callwolves', 0.15]], br: ['woods'], f: 'unique animal',
  desc: 'A white wolf as big as a pony, leader of every pack in the woods.', speech: ['Ak Börü howls, and the woods answer.'] });
M('sarychayan', { g: 's', c: '#ffe060', n: 'Sary Chayan, the Sand Mother', hd: 14, hp: 120, ac: 12, ev: 8, atk: [[20, 'stings', 'poison', 12], [14, 'pinches']], br: ['sands'], f: 'unique animal',
  desc: 'The mother of all the scorpions of the Moiynkum, yellow as the sand.' });
M('golden', { g: 'M', c: '#ffd700', n: 'the Golden Warrior', hd: 16, hp: 140, ac: 12, ev: 8, atk: [[24, 'strikes']], sp: [['darkbolt', 0.15], ['animate', 0.1]], br: ['kurgan'], f: 'unique undead evil nocorpse', res: { p: 3, n: 3, c: 1 }, drops: 2,
  desc: 'A Saka prince in a suit of gold plaques, older than any clan.', speech: ['The Golden Warrior raises a sword older than the clans.'] });
M('boranene', { g: 'E', c: '#4a68ff', n: 'Kara Boran Ene', hd: 16, hp: 130, ac: 8, ev: 16, spd: 15, atk: [[14, 'buffets', 'cold', 0]], sp: [['coldbolt2', 0.3], ['iceblast', 0.15]], br: ['blizzard'], f: 'unique nocorpse fly', res: { c: 3, p: 3, e: 1 },
  desc: 'The mother of the black blizzard. Where she walks, the wind has teeth.', speech: ['"Lie down in the snow. Sleep."'] });
M('herald', { g: '&', c: '#ff3348', n: "Morkhan's Herald", hd: 22, hp: 320, ac: 14, ev: 8, spd: 11, atk: [[30, 'gores'], [18, 'hits']], sp: [['darkbolt2', 0.2], ['summonbull', 0.1], ['smite', 0.1]], br: ['hidden'], f: 'unique evil demonic nocorpse', res: { n: 3, f: 1, c: 1, p: 3 },
  desc: "A bull-headed giant in black felt. It speaks with Morkhan's voice.", speech: ['"The leaven is Morkhan\'s now."', "The Herald's breath smells of burnt felt."] });

// --- companions and summons (never generated as wanderers) ---
M('spiritwolf', { g: 'h', c: '#a4e4ff', n: 'spirit wolf', hd: 5, hp: 20, ac: 2, ev: 10, spd: 14, atk: [[7, 'bites']], f: 'nocorpse', desc: 'A wolf of blue wind.' });
M('goldeagle', { g: 'B', c: '#e8c050', n: 'golden eagle', hd: 3, hp: 14, ac: 1, ev: 14, spd: 18, atk: [[5, 'claws']], f: 'animal fly', desc: 'Your hunting eagle.' });
M('chongtor', { g: 'u', c: '#c8a070', n: 'chongtor horse', hd: 7, hp: 35, ac: 3, ev: 8, spd: 15, atk: [[9, 'kicks']], f: 'animal', desc: 'A stocky mountain horse with rock-hard hooves.' });
M('tulpar', { g: 'u', c: '#ffffff', n: 'tulpar', hd: 13, hp: 80, ac: 6, ev: 16, spd: 18, atk: [[16, 'kicks'], [12, 'bites']], f: 'fly holy nocorpse', desc: 'The winged horse of the epics.' });
M('risen', { g: 'Z', c: '#8aa070', n: 'risen dead', hd: 3, hp: 12, ac: 2, ev: 4, spd: 9, atk: [[6, 'hits']], f: 'undead mindless nocorpse', res: { p: 3, n: 3 }, desc: 'Something raised from its remains.' });

const UNIQUE_KEYS = Object.keys(MT).filter(k => MT[k].fl.has('unique') && MT[k].lv[0] < 99);
