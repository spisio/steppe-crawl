"use strict";
// Regions (branches), level themes and vault layouts.

const BRANCHES = {
  V: { n: 'the Valleys', short: 'Valley', depth: 10, gen: 'valley', c: '#d8a640', absd: d => d },
  temple: { n: 'the White Yurts', short: 'Yurts', depth: 1, parent: 'V', entry: [2, 4], gen: 'temple', c: '#ffffff', absd: () => 3 },
  tunnels: { n: "the Smugglers' Tunnels", short: 'Tunnels', depth: 2, parent: 'V', entry: [3, 5], gen: 'rooms', c: '#d0a070', absd: d => 4 + d, boss: 'bakai' },
  woods: { n: 'the Arslanbob Woods', short: 'Woods', depth: 4, parent: 'V', entry: [4, 6], gen: 'woods', c: '#6fc46f', absd: d => 5 + d, boss: 'akboru', tamga: 'chubar' },
  sands: { n: 'the Moiynkum Sands', short: 'Sands', depth: 3, parent: 'woods', entry: [2, 3], gen: 'sands', c: '#e8c94a', absd: d => 7 + d, boss: 'sarychayan', tamga: 'boztorgoy' },
  kurgan: { n: 'the Old Kurgans', short: 'Kurgans', depth: 3, parent: 'V', entry: [7, 8], gen: 'tomb', c: '#d8b070', absd: d => 9 + d, boss: 'golden', tamga: 'karakoyun' },
  blizzard: { n: 'the Pass of the Black Blizzard', short: 'Blizzard', depth: 3, parent: 'V', entry: [7, 9], gen: 'blizzard', c: '#7aa0f0', absd: d => 9 + d, boss: 'boranene', tamga: 'tanip' },
  hidden: { n: 'the Hidden Valley of Janyl', short: 'Hidden', depth: 3, parent: 'V', entry: [10, 10], gen: 'hidden', c: '#c070ff', absd: d => 12 + d, boss: 'herald', needs: 3 },
};
const BRANCH_ORDER = ['V', 'temple', 'tunnels', 'woods', 'sands', 'kurgan', 'blizzard', 'hidden'];

// Valley themes, one per level of the main line.
const VALLEY_THEMES = [null,
  { name: 'Kara-Oi Meadows', floor: '#7f9a55', wall: '#8d877a', tree: '#3f7f4c', treeN: 'juniper', fill: .44, trees: .025, rivers: 0, deep: 0, camps: 1,
    intro: 'Summer grass and juniper below the Qara-Chik road. The herders went down at first frost. Something else stayed.' },
  { name: 'Besh-Tash Valley', floor: '#86a35a', wall: '#9a9284', tree: '#4d8a52', treeN: 'poplar', fill: .43, trees: .03, rivers: 1, deep: .35, camps: 1,
    intro: 'Five stones stand over the river where the Akjele water their horses. The water is loud enough to hide footsteps.' },
  { name: 'Kara-Koyun Valley', floor: '#9aa55a', wall: '#857d70', tree: '#5a7d44', treeN: 'juniper', fill: .40, trees: .02, rivers: 1, deep: .2, camps: 3,
    intro: 'Black-sheep pasture of the senior clan. The yurt rings stand empty and the felt doors are slashed.' },
  { name: 'Uzun-Akmat', floor: '#7e9d5e', wall: '#8f8c80', tree: '#2f7a46', treeN: 'spruce', fill: .44, trees: .06, rivers: 1, deep: .3, camps: 1,
    intro: 'The long valley above Ozgörüsh. Spruce on the north slopes, wolves on the south.' },
  { name: 'Kara-Suu Canyon', floor: '#a07f62', wall: '#a5553f', tree: '#5f7a48', treeN: 'tamarisk', fill: .50, trees: .015, rivers: 1, deep: .5, camps: 0,
    intro: 'Red walls close in on the black water. Smugglers used this canyon long before the line was drawn.' },
  { name: 'Chatkal Highlands', floor: '#8fa36a', wall: '#a39b8b', tree: '#4a7a50', treeN: 'juniper', fill: .47, trees: .03, rivers: 2, deep: .3, camps: 1,
    intro: 'Where the malka is carried between pastures in felt-wrapped pots. Tonight no one is carrying anything.' },
  { name: 'Ala-Bel Pass', floor: '#93a383', wall: '#9aa0a8', tree: '#4f7059', treeN: 'juniper', fill: .48, trees: .02, rivers: 1, deep: .25, camps: 1,
    intro: 'The high road over the pass, where the wind takes your breath before anything else can.' },
  { name: 'Betpak-Dala', floor: '#b8a979', wall: '#968b6b', tree: '#7e8a5a', treeN: 'saxaul', fill: .31, trees: .01, rivers: 0, deep: 0, camps: 2, sight: 10,
    intro: 'The Hunger Steppe. You can see for a day in every direction, and everything can see you.' },
  { name: 'Aksay Plateau', floor: '#c8d3dc', wall: '#9aa7b5', tree: '#5b7d6a', treeN: 'dwarf juniper', fill: .42, trees: .02, rivers: 1, deep: .25, camps: 2,
    intro: 'The Kurultai ground under early snow. The tör stands empty and the white felt is trampled black.' },
  { name: 'Under Manas Peak', floor: '#8a94a8', wall: '#5e6678', tree: '#3f5a52', treeN: 'juniper', fill: .47, trees: .02, rivers: 1, deep: .3, camps: 0,
    intro: 'The highest valley under the highest peak. At its head a track runs into the rock where no map shows a road.' },
];
const BRANCH_THEMES = {
  temple: { name: 'the White Yurts', floor: '#9bb86a', wall: '#8d877a', tree: '#3f7f4c', treeN: 'juniper',
    intro: 'A ring of white yurts on a green rise, each with a different altar inside. A good place to choose a patron.' },
  tunnels: { name: "the Smugglers' Tunnels", floor: '#8a7a66', wall: '#6a5a48', tree: '#5f6a48', treeN: 'root-tangle', stone: '#7a6a58',
    intro: 'Old mine galleries the smugglers widened into a road. Lanterns, crates, and the smell of tazy hounds.' },
  woods: { name: 'the Arslanbob Woods', floor: '#6f8f4f', wall: '#7d776a', tree: '#3c6b34', treeN: 'walnut tree', fill: .40, trees: .12,
    intro: 'Old walnut forest under the Fergana Range. The shade is deep and the animals are bold.' },
  sands: { name: 'the Moiynkum Sands', floor: '#c9ab6a', wall: '#b08b55', tree: '#8d9a5a', treeN: 'saxaul', fill: .36, trees: .03, sight: 9,
    intro: 'The Talas river dies here in the sand. Scorpions sleep under the saxaul until something warm walks by.' },
  kurgan: { name: 'the Old Kurgans', floor: '#9a8f7a', wall: '#6f6658', tree: '#5f6a48', treeN: 'dead tree', stone: '#b8a888',
    intro: 'Burial mounds of the Saka, opened by robbers and closed again by something else.' },
  blizzard: { name: 'the Pass of the Black Blizzard', floor: '#5b6a8c', wall: '#46506a', tree: '#3a5a5a', treeN: 'frozen juniper', fill: .45, trees: .03, sight: 5,
    intro: 'The pass of the old laments, where the wind has never stopped. You can barely see your own hands.' },
  hidden: { name: 'the Hidden Valley of Janyl', floor: '#8a7f9a', wall: '#5c4f6e', tree: '#4d5c4a', treeN: 'withered juniper', fill: .42, trees: .02,
    intro: 'The valley no map shows. Somewhere ahead is the ruin of the First Church, and the Mother Leaven, and the bull-headed thing that keeps it.' },
};
const THEME_BOOST = { 8: ['scorpion', 'viper', 'kumai'], 9: ['leopard', 'argali', 'wolf'], 6: ['leopard', 'wolf'], 3: ['soodager', 'archer'], 4: ['wolf', 'boar'], 5: ['soodager', 'captain'] };

// Vault layouts. Legend: # wall (by vault's wall type), . floor, + felt door, T tree, ~ shallow, w deep,
// _ altar, M mazar, S shop, O balbal statue, * item, 9 good item, $ silver, 1 monster, 2 tougher monster.
const VAULTS = [
  { id: 'yurt', where: ['V', 'woods', 'blizzard', 'sands', 'hidden'], wall: 'felt', map: [
    '..###..',
    '.#...#.',
    '#..*..#',
    '#.....#',
    '#..1..#',
    '.#...#.',
    '..#+#..'] },
  { id: 'richyurt', where: ['V'], minD: 4, wall: 'felt', map: [
    '...###...',
    '..#...#..',
    '.#.*.$.#.',
    '#...9...#',
    '#.2...2.#',
    '.#.....#.',
    '..##+##..'] },
  { id: 'balbals', where: ['V', 'sands', 'kurgan', 'hidden'], wall: 'rock', map: [
    '..O.O..',
    '.O...O.',
    'O..*..O',
    '.O...O.',
    '..O.O..'] },
  { id: 'mazar', where: ['V', 'woods'], wall: 'rock', map: [
    '.......',
    '.T...T.',
    '...M...',
    '.T...T.',
    '.......'] },
  { id: 'shrine', where: ['V'], minD: 2, maxD: 9, wall: 'rock', map: [
    '.......',
    '.O...O.',
    '...\_...',
    '.O...O.',
    '.......'] },
  { id: 'cache', where: ['V', 'tunnels'], minD: 2, wall: 'rock', map: [
    '#######',
    '#*.$.*#',
    '#..1..#',
    '###+###'] },
  { id: 'rabat', where: ['V', 'sands'], minD: 3, wall: 'stone', map: [
    '###########',
    '#.........#',
    '#.#.....#.#',
    '#....S....#',
    '+.........+',
    '#....*....#',
    '#.#.....#.#',
    '#....1....#',
    '###########'] },
  { id: 'pond', where: ['V', 'woods'], wall: 'rock', map: [
    '..~~~..',
    '.~www~.',
    '~ww*ww~',
    '.~www~.',
    '..~~~..'] },
  { id: 'kurganmound', where: ['kurgan', 'V'], minD: 7, wall: 'stone', map: [
    '..#####..',
    '.##...##.',
    '##..9..##',
    '#...2...#',
    '##.....##',
    '.###+###.'] },
  { id: 'bazaar', where: ['V', 'tunnels'], minD: 2, wall: 'felt', map: [
    '..#####..',
    '.#.....#.',
    '#...S...#',
    '#.......#',
    '.##.+.##.'] },
];

const SHOP_TYPES = {
  general: { n: 'bazaar stall', owner: ['Aigul', 'Bolot', 'Nurlan', 'Saltanat', 'Kanat', 'Meerim'], kinds: null },
  smith: { n: 'temirchi (weaponsmith)', owner: ['Usta Temir', 'Usta Bakyt'], kinds: ['weapon', 'missile'] },
  saddler: { n: 'armourer', owner: ['Usta Ormon', 'Usta Kadyr'], kinds: ['armour'] },
  tabyp: { n: "tabyp's tent (remedies)", owner: ['Apa Jyldyz', 'Apa Cholpon'], kinds: ['potion'] },
  books: { n: 'manuscript seller', owner: ['Moldo Asan', 'Moldo Ishak'], kinds: ['scroll', 'book'] },
  zerger: { n: 'zerger (silversmith)', owner: ['Zerger Myrza', 'Zerger Ainura'], kinds: ['ring', 'amulet', 'wand'] },
};

const NAMES_M = ['Bolot', 'Nurbek', 'Temir', 'Asan', 'Kubat', 'Erkin', 'Azamat', 'Bakyt', 'Yusup', 'Toma', 'Luka', 'Daniyar', 'Ermek', 'Kanat', 'Maksat', 'Tilek'];
const NAMES_F = ['Aigerim', 'Cholpon', 'Jyldyz', 'Meerim', 'Saltanat', 'Nazgul', 'Maryam', 'Aruuke', 'Begimai', 'Kanykei', 'Elnura', 'Ainura', 'Klara', 'Gulnara'];
const FATHERS = ['Asan', 'Tash', 'Bek', 'Moldo', 'Sultan', 'Kadyr', 'Joldosh', 'Ishak', 'Tabyl', 'Myrza', 'Ormon', 'Duishön'];
function randomName() { const fm = Math.random() < .5; return (fm ? pick(NAMES_F) : pick(NAMES_M)) + ' ' + pick(FATHERS) + (fm ? ' kyzy' : ' uulu'); }

// How the valleys connect. Each valley is a day farther from home; the way on is a pass,
// ford, gorge path or caravan track, and each region opens from a landmark of its own.
// [tile kind, name]
const VALLEY_ONWARD = [null,
  ['pass', 'the Kara-Oi ashuu'], ['ford', 'the Besh-Tash ford'], ['pass', 'the Kök-Bel ashuu'], ['gorge', 'the gorge path into Kara-Suu'],
  ['ford', 'the Kara-Suu crossing'], ['pass', 'the Otmek ashuu'], ['track', 'the old caravan track'], ['track', 'the salt track across the Hunger Steppe'],
  ['pass', 'the Manas ashuu'], null];
const BRANCH_LINKS = {
  temple: { entry: ['whiteyurts', 'a path up a green rise'] },
  tunnels: { entry: ['adit', 'an old mine adit'], on: ['shaft', 'a shaft to the lower galleries'], back: ['ladder', 'a ladder back up'] },
  woods: { entry: ['woodpath', 'a path in under the walnut trees'], on: ['woodpath', 'a path deeper into the woods'], back: ['trail', 'the path back'] },
  sands: { entry: ['dryriver', 'a dry riverbed running out into the Moiynkum'], on: ['dryriver', 'the dry riverbed, farther into the dunes'], back: ['trail', 'your tracks back'] },
  kurgan: { entry: ['mound', 'an opened kurgan'], on: ['mound', 'a passage into an older mound'], back: ['trail', 'the passage back'] },
  blizzard: { entry: ['snowcairn', 'a cairn-marked trail into the snow'], on: ['snowcairn', 'the trail farther into the blizzard'], back: ['trail', 'the trail back'] },
  hidden: { entry: ['cleft', 'a cleft in the rock under Manas Peak'], on: ['cleft', 'a cleft farther into the hidden valley'], back: ['trail', 'the way back'] },
};
