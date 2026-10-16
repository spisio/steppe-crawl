"use strict";
// Tiled renderer. Uses the public-domain Dungeon Crawl 32x32 tiles
// (https://opengameart.org/content/dungeon-crawl-32x32-tiles) where they fit,
// and the hand-drawn tiles in tiles-custom.js for Irad-specific things.
// Loaded by index.html (the main, tiled game); it replaces resize/render/viewOrigin from ui.js.

window.TILES = true;
const TILE_ROOT = 'tiles/dcss/';
const DF = 'dungeon/floor/', DW = 'dungeon/wall/';

// --- terrain sets per place ---
const rep = (a, n) => Array(n).fill(a).flat();
const GRASS = [...rep([DF + 'grass/grass_0_new', DF + 'grass/grass_1_new', DF + 'grass/grass_2_new'], 5), DF + 'grass/grass_flowers_yellow_1_new', DF + 'grass/grass_flowers_blue_1_new', DF + 'grass/grass_flowers_red_1_new'];
const BROWN_ROCK = [DW + 'stone2_brown_2_new', DW + 'stone2_brown_3_new', DW + 'stone_2_brown_0', DW + 'stone_2_brown_1'];
const GREY_ROCK = [DW + 'stone_gray_0', DW + 'stone_gray_1', DW + 'stone_gray_2', DW + 'stone_gray_3'];
const DARK_ROCK = [DW + 'stone_dark_0', DW + 'stone_dark_1', DW + 'stone_dark_2', DW + 'stone_dark_3'];
const SETS = {
  meadow: { floor: GRASS, wall: BROWN_ROCK, cliff: "meadow" },
  canyon: { floor: [0, 1, 2, 3, 4, 5].map(i => DF + `pebble_brown_${i}_new`), wall: [0, 1, 2, 3].map(i => DW + `pebble_red_${i}_new`), cliff: "canyon" },
  highland: { floor: [...GRASS, ...[0, 1, 2, 3].map(i => DF + `grey_dirt_${i}_new`)], wall: GREY_ROCK, cliff: "highland" },
  pass: { floor: [0, 1, 2, 3, 4, 5, 6, 7].map(i => DF + `grey_dirt_${i}_new`), wall: GREY_ROCK, cliff: "highland" },
  steppe: { floor: [1, 2, 3, 4, 5, 6, 7, 8].map(i => DF + `sand_${i}`), wall: [0, 1, 2, 3, 4].map(i => DW + `sandstone_wall_${i}`), cliff: "steppe" },
  plateau: { floor: [0, 1, 2, 3, 4, 5, 6, 7].map(i => DF + `frozen_${i}`), wall: GREY_ROCK, cliff: "snowy" },
  manas: { floor: [0, 1, 2, 3, 4, 5, 6, 7].map(i => DF + `grey_dirt_b_${i}`), wall: DARK_ROCK, cliff: "dark" },
  temple: { floor: GRASS, wall: GREY_ROCK, cliff: "meadow" },
  tunnels: { floor: [DF + 'dirt_0_new', DF + 'dirt_1_new', DF + 'dirt_2_new'], wall: [0, 1, 2, 3, 4, 5].map(i => DW + `orc_${i}`), stone: [1, 2, 3, 4].map(i => DW + `stone_brick_${i}`) },
  woods: { floor: [...[0, 1, 2, 3].map(i => DF + `lair_${i}_new`), ...GRASS], wall: [0, 1, 2, 3].map(i => DW + `lair_${i}_new`) },
  sands: { floor: [1, 2, 3, 4, 5, 6, 7, 8].map(i => DF + `sand_${i}`), wall: [0, 1, 2, 3, 4, 5].map(i => DW + `sandstone_wall_${i}`) },
  kurgan: { floor: [0, 1, 2, 3, 4, 5].map(i => DF + `sandstone_floor_${i}`), wall: [0, 1, 2, 3].map(i => DW + `undead_brown_${i}`), stone: [0, 1, 2, 3].map(i => DW + `tomb_${i}`) },
  blizzard: { floor: [...[0, 1, 2, 3].map(i => DF + `ice_${i}_new`), ...[0, 1, 2, 3, 4, 5].map(i => DF + `frozen_${i}`)], wall: DARK_ROCK, cliff: "dark" },
  hidden: { floor: [0, 1, 2, 3, 4, 5, 6, 7].map(i => DF + `limestone_${i}`), wall: DARK_ROCK, stone: [0, 1, 2, 3, 4].map(i => DW + `church_${i}`), cliff: "hidden" },
};
const STONE_DEFAULT = [1, 2, 3, 4].map(i => DW + `stone_brick_${i}`);
function setFor(lev) {
  if (lev.br !== 'V') return SETS[lev.br];
  return SETS[['', 'meadow', 'meadow', 'meadow', 'meadow', 'canyon', 'highland', 'pass', 'steppe', 'plateau', 'manas'][lev.d]];
}
const TREE_KIND = { juniper: 'juniper', poplar: 'poplar', spruce: 'spruce', 'walnut tree': 'walnut', tamarisk: 'tamarisk', saxaul: 'saxaul', 'dwarf juniper': 'juniper',
  'frozen juniper': 'frozen', 'withered juniper': 'dead', 'dead tree': 'dead', 'root-tangle': 'root' };
const WATER = { deep: ['dungeon/water/deep_water', 'dungeon/water/deep_water_2'], shallow: ['dungeon/water/shallow_water', 'dungeon/water/shallow_water_2'] };
const ALTAR_TILE = { janyl: 'dungeon/altars/altar_shining_one', kambar: 'dungeon/altars/altar_okawaru', umay: 'dungeon/altars/altar_elyvilon',
  tengri: 'dungeon/altars/qazlal_0', morkhan: 'dungeon/altars/altar_makhleb_flame_1', kydyr: 'dungeon/altars/gozag_0' };
const SHOP_TILE = { general: 'dungeon/shops/shop_general', smith: 'dungeon/shops/shop_weapon', saddler: 'dungeon/shops/shop_armor', tabyp: 'dungeon/shops/shop_potions', books: 'dungeon/shops/shop_scrolls', zerger: 'dungeon/shops/shop_jewellery' };
const TRAP_TILE = { net: 'dungeon/traps/trap_net', pit: 'dungeon/traps/trap_shaft', alarm: 'dungeon/traps/trap_alarm', dust: 'dungeon/traps/trap_teleport', arrow: 'dungeon/traps/trap_arrow', mark: 'dungeon/traps/trap_zot' };
const CLOUD_TILE = { fire: 'effect/cloud_fire_1', cold: 'effect/cloud_cold_1', bitter: 'effect/cloud_meph_1', fog: 'effect/cloud_grey_smoke' };

// --- monsters: path, or [path, canvas filter], or custom:name ---
const M_ = 'monster/';
const MON_TILE = {
  marmot: M_ + 'animals/quokka_new', jackal: M_ + 'animals/jackal_new', bat: M_ + 'animals/bat', viper: M_ + 'animals/viper',
  karakurt: M_ + 'animals/spider', soodager: M_ + 'human_new', tazy: M_ + 'animals/hound', watersnake: M_ + 'animals/sea_snake_new',
  lynx: 'custom:lynx', archer: M_ + 'deep_elf_master_archer', wolf: M_ + 'animals/wolf', boar: M_ + 'animals/hog_new', eagle: 'custom:eagle',
  tarantula: M_ + 'animals/wolf_spider_new', imp: M_ + 'demons/imp', argali: [M_ + 'animals/sheep', 'sepia(.7) brightness(.9)'],
  kuyun: [M_ + 'nonliving/air_elemental_new', 'sepia(1) saturate(1.6)'], skeleton: M_ + 'undead/skeletal_warrior_new', vampbat: M_ + 'animals/giant_bat',
  bakshy: M_ + 'necromancer_new', kumai: 'custom:vulture', bear: M_ + 'animals/grizzly_bear', captain: M_ + 'unique/edmund_new',
  leopard: 'custom:leopard', scorpion: M_ + 'animals/giant_scorpion', rider: M_ + 'undead/skeletons/skeleton_centaur', bull: M_ + 'animals/death_yak_new',
  almasty: [M_ + 'deep_troll', 'sepia(.6) brightness(1.1)'], ayaz: M_ + 'undead/freezing_wraith', albasty: M_ + 'unique/erica_new', wight: M_ + 'undead/revenant',
  jeztyrnak: [M_ + 'unique/margery_new', 'sepia(.8) saturate(2)'], cultist: M_ + 'hell_knight_new', youngajdaha: M_ + 'forest_drake',
  tiger: 'custom:tiger', boran: M_ + 'demons/blizzard_demon', mummy: M_ + 'undead/mummy', karabakshy: [M_ + 'necromancer_old', 'hue-rotate(250deg)'],
  dev: M_ + 'ogre_new', balbal: ['custom:balbal', 'brightness(1.15)'], akdev: M_ + 'frost_giant_new', ajdaha: M_ + 'dragons/dragon',
  akajdaha: M_ + 'dragons/ice_dragon_new',
  toko: [M_ + 'animals/quokka_new', 'sepia(1) saturate(3) brightness(1.2)'], kyzylkoz: M_ + 'unique/sonja_new', kempir: M_ + 'unique/kirke_new',
  oldkurt: [M_ + 'animals/trapdoor_spider_new', 'hue-rotate(300deg) saturate(1.5)'], alpkara: [M_ + 'hill_giant_new', 'brightness(.6) contrast(1.3)'],
  jelmoguz: [M_ + 'dragons/hydra_5_new', 'hue-rotate(200deg)'], bakai: M_ + 'unique/frederick_new', akboru: [M_ + 'animals/warg', 'grayscale(1) brightness(2.2)'],
  sarychayan: M_ + 'animals/emperor_scorpion', golden: [M_ + 'undead/greater_mummy', 'sepia(1) saturate(4) brightness(1.2)'],
  boranene: [M_ + 'demons/ice_fiend', 'brightness(.8) saturate(1.4)'], herald: [M_ + 'minotaur', 'brightness(.55) contrast(1.4)'],
  spiritwolf: [M_ + 'animals/wolf', 'grayscale(1) brightness(1.6) sepia(1) hue-rotate(170deg) saturate(3) opacity(.8)'], goldeagle: 'custom:eagle',
  chongtor: 'custom:horse', tulpar: 'custom:tulpar',
};
const RISEN_SMALL = M_ + 'undead/skeletons/skeleton_humanoid_small_new', RISEN_LARGE = M_ + 'undead/skeletons/skeleton_humanoid_large_new';

// --- items ---
const I_ = 'item/';
const WEAPON_ITEM = { pichak: I_ + 'weapon/knife', kanjar: I_ + 'weapon/short_sword_1_new', shamshir: I_ + 'weapon/scimitar_1_new', kylych: I_ + 'weapon/sabre_2',
  alash: I_ + 'weapon/falchion_1_new', ekikol: I_ + 'weapon/greatsword_1_new', balta: I_ + 'weapon/hand_axe_1_new', jekebalta: I_ + 'weapon/war_axe_1',
  chongbalta: I_ + 'weapon/broad_axe_1', chokmor: I_ + 'weapon/club_new', kamchy: I_ + 'weapon/bullwhip_new', kurzu: I_ + 'weapon/mace_1_new',
  chakan: I_ + 'weapon/hammer_1_new', temirchokmor: I_ + 'weapon/mace_large_1_new', naiza: I_ + 'weapon/spear_1', sungu: I_ + 'weapon/spear_3',
  aibalta: I_ + 'weapon/halberd_1', taiak: I_ + 'weapon/quarterstaff_new', uzuntaiak: I_ + 'weapon/quarterstaff_2', jaa: I_ + 'weapon/ranged/shortbow_1',
  kuramajaa: I_ + 'weapon/ranged/longbow_1', salyng: I_ + 'weapon/ranged/sling_1' };
const STAFF_ITEM = { fire: 'staff_0', cold: 'staff_1', air: 'staff_2', earth: 'staff_3', death: 'staff_4', poison: 'staff_5', verse: 'staff_6' };
const ARMOUR_ITEM = { chapan: 'torso/robe_1_new', ton: 'torso/animal_skin_1_new', kementai: 'torso/robe_2_new', kuyak: 'torso/scale_mail_1_new',
  sooyt: 'torso/chain_mail_1', temirkuyak: 'torso/plate_mail_1', ajdahascale: 'torso/green_dragon_scales', akscale: 'torso/ice_dragon_hide_new',
  chepken: 'back/cloak_1_leather', kalpak: 'headgear/hat_1', tumak: 'headgear/cap_1', dulyga: 'headgear/helmet_1', kolkap: 'hands/glove_1_new',
  etik: 'feet/boots_1_brown_new', kichikalkan: 'shields/buckler_1_new', kalkan: 'shields/shield_2_kite', chongkalkan: 'shields/large_shield_1_new' };
const MISSILE_ITEM = { ok: 'weapon/ranged/orcish_arrow', tash: 'weapon/ranged/stone_new', korgoshun: 'weapon/ranged/sling_bullet_1_new', javelin: 'weapon/spear_1', dart: 'weapon/ranged/needle-c' };
const POTION_BY_LOOK = { horn: 'brown_new', 'felt-wrapped': 'white_new', silver: 'silver', clay: 'orange_new', 'birch-bark': 'yellow_new', copper: 'ruby_new',
  lacquered: 'black_new', leather: 'murky', gourd: 'golden', 'blue glass': 'brilliant_blue_new', bone: 'cloudy', painted: 'magenta_new', 'walnut-wood': 'puce' };
const SCROLL_COLOURS = ['scroll-blue', 'scroll-brown', 'scroll-cyan', 'scroll-green', 'scroll-grey', 'scroll-purple', 'scroll-red', 'scroll-yellow'];
const RING_BY_LOOK = { turquoise: 'ring_sapphire', carnelian: 'ring_ruby', jade: 'jade', coral: 'coral', silver: 'silver', copper: 'copper', iron: 'iron', bone: 'ring_ivory',
  horn: 'wooden', gold: 'gold', lapis: 'ring_plain_blue', agate: 'agate', amber: 'ring_topaz', garnet: 'ruby', jet: 'ring_black_onyx', pearl: 'pearl' };
const AMULET_BY_LOOK = { 'triangular felt': 'celtic_red', beaded: 'stone_3_blue', 'silver-chased': 'cameo_blue', 'carved bone': 'bone_gray', 'red-thread': 'ring_red',
  'owl-feather': 'eye_green', cowrie: 'stone_1_cyan', leather: 'cylinder_gray' };
const WAND_ITEM = { flame: 'gem_copper_new', iceblast: 'gem_glass_new', lightning: 'gem_silver_new', para: 'gem_gold_new', dig: 'gem_wood_new', charm: 'gem_ivory_new', away: 'gem_brass_new' };
const BOOK_ITEM = { duel: 'red_new', yada: 'light_blue_new', drum: 'dark_brown_new', herbal: 'dark_green_new', fire: 'magenta_new', winter: 'cyan_new', sky: 'turquoise_new',
  stone: 'tan_new', roads: 'parchment_new', morkhan: 'book_of_the_dead_new', calling: 'plaid_new', verses: 'purple_new', poisons: 'light_green_new' };
const MISC_ITEM = { horn: I_ + 'misc/misc_horn', yada: I_ + 'misc/misc_stone_new', komuz: 'custom:komuz' };

// --- the player figure, built from Crawl's doll layers ---
const P_ = 'player/';
const BASE_TILE = { iradi: 'human', tash: 'dwarf', peri: 'elf', dev: 'ogre', at: 'centaur_brown', boru: 'human', ajdaha: 'draconian_green', kichi: 'halfling' };
const BODY_TILE = { chapan: 'robe_brown', ton: 'animal_skin', kementai: 'robe_white', kuyak: 'scalemail', sooyt: 'chainmail', temirkuyak: 'plate',
  ajdahascale: 'dragon_armor_green', akscale: 'dragon_armor_white_new' };
const HEAD_TILE = { kalpak: 'hood_white', tumak: 'bear', dulyga: 'iron_1' };
const HAND_TILE = { pichak: 'knife', kanjar: 'short_sword', shamshir: 'scimitar_new', kylych: 'sabre', alash: 'broadsword', ekikol: 'great_sword', balta: 'hand_axe_new',
  jekebalta: 'axe', chongbalta: 'great_axe', chokmor: 'club', kamchy: 'whip_new', kurzu: 'mace_new', chakan: 'hammer_new', temirchokmor: 'great_mace',
  naiza: 'spear', sungu: 'lance', aibalta: 'halberd_new', taiak: 'quarterstaff', uzuntaiak: 'quarterstaff_2_new', jaa: 'bow', kuramajaa: 'great_bow', salyng: 'sling' };
const SHIELD_TILE = { kichikalkan: 'buckler_round_2', kalkan: 'lshield_quartered', chongkalkan: 'lshield_long_red' };

// Every Crawl tile this file can ask for, so they can be preloaded (and copied into the repo).
function allTilePaths() {
  const s = new Set();
  for (const k in SETS) for (const part of ['floor', 'wall', 'stone']) { if (part === 'wall' && SETS[k].cliff) continue; (SETS[k][part] || []).forEach(p => s.add(p)); }
  STONE_DEFAULT.forEach(p => s.add(p)); WATER.deep.forEach(p => s.add(p)); WATER.shallow.forEach(p => s.add(p));
  for (const o of [ALTAR_TILE, SHOP_TILE, TRAP_TILE, CLOUD_TILE, WEAPON_ITEM]) Object.values(o).forEach(p => s.add(p));
  for (const v of Object.values(MON_TILE)) { const p = Array.isArray(v) ? v[0] : v; if (!p.startsWith('custom:')) s.add(p); }
  s.add(RISEN_SMALL); s.add(RISEN_LARGE);
  Object.values(STAFF_ITEM).forEach(p => s.add(I_ + 'staff/' + p));
  Object.values(ARMOUR_ITEM).forEach(p => s.add(I_ + 'armor/' + p));
  Object.values(MISSILE_ITEM).forEach(p => s.add(I_ + p));
  Object.values(POTION_BY_LOOK).forEach(p => s.add(I_ + 'potion/' + p));
  SCROLL_COLOURS.forEach(p => s.add(I_ + 'scroll/' + p));
  Object.values(RING_BY_LOOK).forEach(p => s.add(I_ + 'ring/' + p));
  Object.values(AMULET_BY_LOOK).forEach(p => s.add(I_ + 'amulet/' + p));
  Object.values(WAND_ITEM).forEach(p => s.add(I_ + 'wand/' + p));
  Object.values(BOOK_ITEM).forEach(p => s.add(I_ + 'book/' + p));
  Object.values(MISC_ITEM).forEach(p => { if (!p.startsWith('custom:')) s.add(p); });
  [I_ + 'gold/gold_pile', I_ + 'gold/gold_pile_3', I_ + 'gold/gold_pile_10', I_ + 'food/chunk', I_ + 'potion/clear', 'dungeon/altars/altar_base'].forEach(p => s.add(p));
  for (const b of Object.values(BASE_TILE)) for (const g of ['male', 'female']) s.add(`${P_}base/${b}_${g}`);
  Object.values(BODY_TILE).forEach(p => s.add(P_ + 'body/' + p));
  Object.values(HEAD_TILE).forEach(p => s.add(P_ + 'head/' + p));
  Object.values(HAND_TILE).forEach(p => s.add(P_ + 'hand_right/' + p));
  Object.values(SHIELD_TILE).forEach(p => s.add(P_ + 'hand_left/' + p));
  [P_ + 'cloak/brown', P_ + 'gloves/glove_brown', P_ + 'boots/middle_brown', P_ + 'hand_right/great_staff'].forEach(p => s.add(p));
  return [...s];
}

// --- loading ---
const IMG = {}; let tilesReady = false, tilesLoaded = 0, tilesTotal = 0;
function loadTiles() {
  const paths = allTilePaths(); tilesTotal = paths.length;
  return Promise.all(paths.map(p => new Promise(res => {
    const im = new Image(); im.onload = () => { IMG[p] = im; tilesLoaded++; res(); }; im.onerror = () => { tilesLoaded++; res(); };
    im.src = TILE_ROOT + p + '.png';
  }))).then(() => { tilesReady = true; render(); });
}
const FILTERED = {};
function tileSource(spec) {
  // spec: 'path' | 'custom:name' | [spec, filter]
  let p = spec, filter = null;
  if (Array.isArray(spec)) [p, filter] = spec;
  const src = p.startsWith('custom:') ? CUSTOM_TILES[p.slice(7)] : IMG[p];
  if (!src) return null;
  if (!filter) return src;
  const key = p + '|' + filter;
  if (!FILTERED[key]) { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); g.filter = filter; g.drawImage(src, 0, 0); FILTERED[key] = c; }
  return FILTERED[key];
}
const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return (h ^ (h >>> 16)) >>> 0; };
const pickV = (arr, x, y, s = 0) => arr[hash(x, y, s) % arr.length];

// --- what to draw for each thing ---
function terrainSpecs(lev, x, y) {
  const out = terrainSpecsBase(lev, x, y), t = lev.t[idx(x, y)], S = setFor(lev);
  if (t === T.WALL) return out;
  // cliff shadow on the ground at the foot of a cliff face
  if (S.cliff && y > 0 && lev.t[idx(x, y - 1)] === T.WALL) out.splice(1, 0, 'fx:shadow');
  // make the ways on and back easy to spot: a glow on the ground and a frame
  if (t === T.DOWN || t === T.BRANCH || t === T.UP) {
    const kind = t === T.UP ? 'back' : 'on';
    out.splice(out.length - 1, 0, 'fx:glow_' + kind); out.push('fx:frame_' + kind);
  }
  return out;
}
function terrainSpecsBase(lev, x, y) {
  const i = idx(x, y), t = lev.t[i], S = setFor(lev), seed = lev.d * 7 + lev.br.length;
  const floor = pickV(S.floor, x, y, seed);
  switch (t) {
    case T.WALL: {
      if (!S.cliff) return [pickV(S.wall, x, y, seed)];
      const open = y + 1 < H && lev.t[idx(x, y + 1)] !== T.WALL;
      return [`custom:cliff_${open ? 'face' : 'top'}_${S.cliff}_${hash(x, y, seed) % 3}`];
    }
    case T.STONE: return [pickV(S.stone || STONE_DEFAULT, x, y, seed)];
    case T.FELT: return ['custom:felt'];
    case T.DEEP: return [pickV(WATER.deep, x, y, seed)];
    case T.SHALLOW: return [pickV(WATER.shallow, x, y, seed)];
    case T.TREE: return [floor, 'custom:tree_' + (TREE_KIND[curTheme().treeN] || 'juniper')];
    case T.DOWN: return [floor, 'custom:' + onwardInfo(lev).kind];
    case T.UP: return [floor, 'custom:' + backInfo(lev).kind];
    case T.BRANCH: { const e = lev.entries.find(e => idx(e.x, e.y) === i); const to = e ? e.to : 'temple';
      return [floor, 'custom:' + (to === 'hidden' && G.p.tamgas.length >= 3 ? 'cleft_open' : entryInfo(to).kind)]; }
    case T.MAZAR: return [floor, 'custom:mazar'];
    case T.USED: return [floor, 'custom:mazar_used'];
    case T.ALTAR: return [floor, ALTAR_TILE[lev.altars[i]] || 'dungeon/altars/altar_base'];
    case T.SHOP: { const s = lev.shops.find(s => s.x === x && s.y === y), ty = s ? s.ty : 'general';
      return [floor, 'custom:stall_' + ty, 'fx:goods|' + SHOP_TILE[ty]]; }
    case T.DOORC: return [floor, 'custom:door_c'];
    case T.DOORO: return [floor, 'custom:door_o'];
    case T.STATUE: return [floor, 'custom:balbal'];
  }
  return [floor];
}
function itemSpec(it) {
  switch (it.k) {
    case 'gold': return I_ + (it.qty > 60 ? 'gold/gold_pile_10' : it.qty > 20 ? 'gold/gold_pile_3' : 'gold/gold_pile');
    case 'orb': return 'custom:malka';
    case 'tamga': return 'custom:tamga_' + it.t;
    case 'remains': return [I_ + 'food/chunk', 'saturate(.7)'];
    case 'missile': return I_ + MISSILE_ITEM[it.t];
    case 'weapon': if (it.staff) return I_ + 'staff/' + STAFF_ITEM[it.staff]; return it.art ? [WEAPON_ITEM[it.t], 'drop-shadow(0 0 2px #ffd700)'] : WEAPON_ITEM[it.t];
    case 'armour': return it.art ? [I_ + 'armor/' + ARMOUR_ITEM[it.t], 'drop-shadow(0 0 2px #ffd700)'] : I_ + 'armor/' + ARMOUR_ITEM[it.t];
    case 'potion': return I_ + 'potion/' + (POTION_BY_LOOK[G.looks.potion[it.t]] || 'clear');
    case 'scroll': { let h = 0; for (const c of G.looks.scroll[it.t] || '') h = (h * 31 + c.charCodeAt(0)) | 0; return I_ + 'scroll/' + SCROLL_COLOURS[Math.abs(h) % SCROLL_COLOURS.length]; }
    case 'ring': return I_ + 'ring/' + (RING_BY_LOOK[G.looks.ring[it.t]] || 'silver');
    case 'amulet': return I_ + 'amulet/' + (AMULET_BY_LOOK[G.looks.amulet[it.t]] || 'bone_gray');
    case 'wand': return I_ + 'wand/' + WAND_ITEM[it.t];
    case 'book': return I_ + 'book/' + BOOK_ITEM[it.t];
    case 'misc': return MISC_ITEM[it.t];
  }
  return null;
}
function monSpec(m) {
  if (m.k === 'risen') return T_(m).hd >= 8 ? RISEN_LARGE : RISEN_SMALL;
  return MON_TILE[m.k] || null;
}
function playerLayers() {
  const p = G.p, fem = / kyzy$/.test(p.name) || NAMES_F.includes(p.name.split(' ')[0]);
  const L_ = [];
  const cl = equipped('cloak'); if (cl) L_.push(P_ + 'cloak/brown');
  L_.push(`${P_}base/${BASE_TILE[p.sp]}_${fem ? 'female' : 'male'}`);
  const ft = equipped('feet'); if (ft) L_.push(P_ + 'boots/middle_brown');
  const b = equipped('body'); if (b) L_.push(P_ + 'body/' + BODY_TILE[b.t]);
  const gl = equipped('hands'); if (gl) L_.push(P_ + 'gloves/glove_brown');
  const sh = equipped('shield'); if (sh) L_.push(P_ + 'hand_left/' + SHIELD_TILE[sh.t]);
  const w = equipped('weapon'); if (w) L_.push(P_ + 'hand_right/' + (w.staff ? 'great_staff' : HAND_TILE[w.t]));
  const hd = equipped('head');
  if (hd) L_.push(P_ + 'head/' + HEAD_TILE[hd.t]);
  else if (p.sp === 'boru') L_.push([P_ + 'head/bear', 'grayscale(1) brightness(1.3)']);
  return L_;
}

// --- the renderer (replaces the ASCII one) ---
function resize() {
  const r = cv.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
  cv.width = Math.max(1, Math.floor(r.width * dpr)); cv.height = Math.max(1, Math.floor(r.height * dpr));
  const ts = r.width < 520 ? 24 : 32;
  cell = { fs: Math.round(ts * 0.55), w: ts, h: ts };
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false; render();
}
const MARK = { on: [255, 210, 110], back: [180, 215, 255] };
function drawFx(fxName, sx, sy) {
  const X = sx * cell.w, Y = sy * cell.h, w = cell.w, h = cell.h;
  if (fxName === 'shadow') {
    const g = ctx.createLinearGradient(0, Y, 0, Y + h * 0.45); g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(X, Y, w, h * 0.45); return;
  }
  if (fxName.startsWith('goods|')) { // a shop's goods icon, set on the stall counter
    const im = IMG[fxName.slice(6)]; if (im) ctx.drawImage(im, X + w * 0.15, Y + h * 0.24, w * 0.7, h * 0.7); return;
  }
  const [kind, which] = fxName.split('_'), [r, gg, b] = MARK[which];
  if (kind === 'glow') {
    const g = ctx.createRadialGradient(X + w / 2, Y + h / 2, 1, X + w / 2, Y + h / 2, w * 0.75);
    g.addColorStop(0, `rgba(${r},${gg},${b},.9)`); g.addColorStop(.55, `rgba(${r},${gg},${b},.45)`); g.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    ctx.fillStyle = g; ctx.fillRect(X - w * 0.25, Y - h * 0.25, w * 1.5, h * 1.5);
  } else if (kind === 'frame') {
    ctx.strokeStyle = `rgb(${r},${gg},${b})`; ctx.lineWidth = 2.5;
    const k = Math.max(4, w / 4); // corner brackets
    for (const [cx, cy, dx, dy] of [[X + 1, Y + 1, 1, 1], [X + w - 1, Y + 1, -1, 1], [X + 1, Y + h - 1, 1, -1], [X + w - 1, Y + h - 1, -1, -1]]) {
      ctx.beginPath(); ctx.moveTo(cx + dx * k, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + dy * k); ctx.stroke();
    }
    ctx.lineWidth = 1;
  }
}
function drawSpec(spec, sx, sy, alpha) {
  if (typeof spec === 'string' && spec.startsWith('fx:')) { drawFx(spec.slice(3), sx, sy); return true; }
  const src = spec && tileSource(spec); if (!src) return false;
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  ctx.drawImage(src, sx * cell.w, sy * cell.h, cell.w, cell.h);
  ctx.globalAlpha = 1; return true;
}
function glyphFallback(g, c, sx, sy) {
  ctx.fillStyle = c; ctx.font = `600 ${cell.fs}px 'IBM Plex Mono',monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(g, sx * cell.w + cell.w / 2, sy * cell.h + cell.h / 2);
}
function render() {
  const r = cv.getBoundingClientRect();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#05050a'; ctx.fillRect(0, 0, r.width, r.height);
  if (!G) return;
  if (G.noRender) return;
  if (!tilesReady) { glyphFallback(`Loading tiles ${tilesLoaded}/${tilesTotal}`, '#8a8499', 6, 1); renderSide(); renderLog(); return; }
  const { ox, oy, cols, rows } = viewOrigin(), p = G.p, lev = L();
  const itemAt = {}; for (const o of lev.items) itemAt[idx(o.x, o.y)] = o.it;
  const trapAt = {}; for (const tr of lev.traps) if (tr.known) trapAt[idx(tr.x, tr.y)] = tr;
  const cloudAtI = {}; for (const c of lev.clouds) cloudAtI[idx(c.x, c.y)] = c;
  for (let sy = 0; sy < rows + 1; sy++) for (let sx = 0; sx < cols + 1; sx++) {
    const x = sx + ox, y = sy + oy; if (!inb(x, y)) continue;
    const i = idx(x, y); if (!lev.seen[i]) continue;
    for (const s of terrainSpecs(lev, x, y)) if (!drawSpec(s, sx, sy)) { const [g, c] = terrainGlyph(lev, i); glyphFallback(g, c, sx, sy); }
    if (trapAt[i]) drawSpec(TRAP_TILE[trapAt[i].ty], sx, sy);
    if (itemAt[i]) { if (!drawSpec(itemSpec(itemAt[i]), sx, sy)) { const [g, c] = itemGlyph(itemAt[i]); glyphFallback(g, c, sx, sy); } }
    if (vis[i] && cloudAtI[i]) drawSpec(CLOUD_TILE[cloudAtI[i].ty], sx, sy, 0.75);
    if (!vis[i]) { ctx.fillStyle = 'rgba(5,5,12,.58)'; ctx.fillRect(sx * cell.w, sy * cell.h, cell.w, cell.h); }
    else if (lev.br === 'blizzard' && Math.random() < .04) { ctx.fillStyle = 'rgba(220,230,255,.7)'; ctx.fillRect(sx * cell.w + rnd(cell.w), sy * cell.h + rnd(cell.h), 2, 2); }
  }
  if (lev.sanct && G.turn < lev.sanct.until) { ctx.strokeStyle = '#f0c0d8'; const s = lev.sanct; ctx.strokeRect((s.x - 3 - ox) * cell.w + .5, (s.y - 3 - oy) * cell.h + .5, cell.w * 7, cell.h * 7); }
  for (const m of lev.mons) {
    if (m.dead || !vis[idx(m.x, m.y)] || !monVisible(m)) continue;
    const sx = m.x - ox, sy = m.y - oy; if (sx < 0 || sy < 0 || sx > cols || sy > rows) continue;
    const Tm = T_(m), X = sx * cell.w, Y = sy * cell.h;
    if (m.ally) { ctx.strokeStyle = '#6fb0ff'; ctx.lineWidth = 1; ctx.strokeRect(X + .5, Y + .5, cell.w - 1, cell.h - 1); }
    if (!drawSpec(monSpec(m), sx, sy)) glyphFallback(Tm.g, Tm.c, sx, sy);
    if (m.hp < m.mhp) { const f = clamp(m.hp / m.mhp, 0, 1); ctx.fillStyle = '#300'; ctx.fillRect(X + 2, Y + cell.h - 3, cell.w - 4, 2); ctx.fillStyle = f > .5 ? '#5c5' : f > .25 ? '#dc4' : '#e44'; ctx.fillRect(X + 2, Y + cell.h - 3, (cell.w - 4) * f, 2); }
    const tag = m.state === 'sleep' ? ['z', '#8fb0ff'] : m.st.fear ? ['!', '#ff9090'] : m.st.para ? ['=', '#e55a5a'] : null;
    if (tag) { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(X + cell.w - 9, Y, 9, 10); ctx.fillStyle = tag[1]; ctx.font = `700 9px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(tag[0], X + cell.w - 4.5, Y + 1); }
    if (Tm.fl.has('unique') && !m.ally) { ctx.fillStyle = '#ff86e4'; ctx.fillRect(X + 1, Y + 1, 3, 3); }
  }
  for (const f of fx) { const sx = f.x - ox, sy = f.y - oy; ctx.fillStyle = f.col; ctx.globalAlpha = .5; ctx.fillRect(sx * cell.w, sy * cell.h, cell.w, cell.h); ctx.globalAlpha = 1; }
  if (tgt) renderTargeting(ox, oy);
  const sx = p.x - ox, sy = p.y - oy;
  if (st('invis')) ctx.globalAlpha = .5;
  let any = false; for (const l of playerLayers()) any = drawSpec(l, sx, sy) || any;
  ctx.globalAlpha = 1;
  if (!any) glyphFallback('@', '#fffaf0', sx, sy);
  if (G.over && !G.won) { ctx.fillStyle = 'rgba(200,30,40,.35)'; ctx.fillRect(sx * cell.w, sy * cell.h, cell.w, cell.h); }
  renderSide(); renderLog();
}
loadTiles();
