"use strict";
// Patrons: the saint of the church and the old spirits the herders still honour.
// Piety thresholds for stars, as in Crawl.
const PIETY_STARS = [0, 30, 50, 75, 100, 120, 160];

const GODS = {
  janyl: {
    n: 'St. Janyl', title: 'Mother of Irad', c: '#ffffff',
    desc: 'The saint who saw the White Rider and found the First Church. She guards the faithful and hates the servants of Morkhan.',
    likes: 'You gain piety by destroying evil and undead creatures.',
    hates: 'She abhors necromancy and weapons of Morkhan or the albasty.',
    abil: [
      { id: 'jheal', n: 'Bata of Healing', star: 1, mp: 2, piety: 1, d: 'Heals you.' },
      { id: 'cleanse', n: 'Cleansing Milk', star: 2, mp: 3, piety: 2, d: 'Cures poison, confusion and slowness, and may lift a bad mutation.' },
      { id: 'ward', n: 'Felt Ward', star: 3, mp: 4, piety: 3, d: 'A holy ward that raises your AC and blocks for a while.' },
      { id: 'riderlight', n: "The White Rider's Light", star: 4, mp: 5, piety: 5, d: 'Holy light burns every evil creature in sight.' },
      { id: 'mantle', n: "Janyl's Mantle", star: 5, mp: 6, piety: 15, d: 'Fully heals you and drives away every foe nearby.' },
    ],
  },
  kambar: {
    n: 'Kambar-Ata', title: 'Patron of Horses', c: '#e0b070',
    desc: 'The herder-ancestor who first tamed the horse. He loves a bold rider and rewards the brave with gifts.',
    likes: 'You gain piety by killing anything hostile.',
    hates: 'He does not forgive those who leave him.',
    abil: [
      { id: 'hooves', n: 'Swift Hooves', star: 1, mp: 2, piety: 1, d: 'You become hasted for a short time.' },
      { id: 'heroism', n: 'Spirit of the Baatyr', star: 2, mp: 2, piety: 2, d: 'Raises your fighting skill and accuracy for a while.' },
      { id: 'herd', n: "Kambar's Herd", star: 3, mp: 4, piety: 4, d: 'Calls chongtor horses to fight beside you.' },
      { id: 'tulpargift', n: 'Gift of the Tulpar', star: 6, mp: 0, piety: 80, d: 'Once only: a tulpar joins you for good.' },
    ],
    passive: 'At high piety, Kambar-Ata sometimes gifts you weapons and armour.',
  },
  umay: {
    n: 'Umay', title: 'the Hearth Mother', c: '#f0c0d8',
    desc: 'The old mother-spirit of the hearth and cradle. She favours wanderers who see new country.',
    likes: 'You gain piety by exploring new ground and by killing evil things.',
    hates: 'She dislikes cruelty to the helpless (attacking sleeping or fleeing creatures).',
    abil: [
      { id: 'warmth', n: 'Hearth Warmth', star: 1, mp: 2, piety: 1, d: 'You regenerate much faster for a while.' },
      { id: 'cradle', n: "Umay's Cradle", star: 2, mp: 4, piety: 3, d: 'Creates a sanctuary where no one can fight.' },
      { id: 'lullaby', n: "Umay's Lullaby", star: 4, mp: 5, piety: 5, d: 'Puts every creature in sight to sleep.' },
    ],
    passive: 'At five stars, Umay will once bring you back from death (and take all your piety).',
  },
  tengri: {
    n: 'Kök Tengri', title: 'the Blue Sky', c: '#7ab0ff',
    desc: 'The sky over the steppe. He answers prayer with thunder.',
    likes: 'You gain piety by killing anything hostile.',
    hates: 'He does not forgive those who leave him.',
    abil: [
      { id: 'thunder', n: 'Thunderclap', star: 1, mp: 2, piety: 1, d: 'Lightning strikes a foe you can see.' },
      { id: 'skyeye', n: 'Eye of the Sky', star: 2, mp: 3, piety: 4, d: 'Reveals the layout of the valley.' },
      { id: 'storm', n: 'Storm Ward', star: 4, mp: 4, piety: 4, d: 'For a while, lightning strikes foes next to you.' },
      { id: 'wrath', n: "Heaven's Wrath", star: 5, mp: 6, piety: 8, d: 'Lightning strikes every foe in sight.' },
    ],
    passive: 'From two stars you resist lightning.',
  },
  morkhan: {
    n: 'Morkhan', title: 'the Bull-Headed', c: '#ff4050', evil: 1,
    desc: 'The dark bull-god of the old steppe, called Satan by the church. He gives strength for blood, and asks nothing else.',
    likes: 'You gain piety by killing anything at all.',
    hates: 'Nothing. But St. Janyl will not forgive you.',
    abil: [
      { id: 'rage', n: "Bull's Rage", star: 1, mp: 0, piety: 2, d: 'You go berserk.' },
      { id: 'minordestr', n: 'Minor Destruction', star: 2, mp: 2, piety: 1, d: 'A bolt of black force.' },
      { id: 'bulls', n: 'Summon Black Bulls', star: 3, mp: 4, piety: 4, d: 'Black bulls fight for you for a while.' },
      { id: 'majordestr', n: "Morkhan's Horns", star: 5, mp: 6, piety: 6, d: 'A huge burst of black force.' },
    ],
    passive: 'You sometimes heal when you kill.',
  },
  kydyr: {
    n: 'Kydyr-Ata', title: 'the Wandering Saint', c: '#e8c050',
    desc: 'The grey-bearded wanderer who brings luck to those who share their bread. He deals in silver, not piety.',
    likes: 'He needs no piety. His gifts are paid for in silver.',
    hates: 'Nothing.',
    abil: [
      { id: 'purse', n: "Kydyr's Purse", star: 0, silver: 1, d: 'Pay silver to be fully healed and cured.' },
      { id: 'caravan', n: 'Call the Caravan', star: 0, silver: 1, d: 'Pay silver for a trader to come to you.' },
      { id: 'bribe', n: 'Bribe', star: 0, silver: 1, d: 'Pay silver to make a foe leave you alone.' },
    ],
    passive: 'You find half again as much silver, and traders give you a discount.',
  },
};
const GOD_ORDER = ['janyl', 'kambar', 'umay', 'tengri', 'morkhan', 'kydyr'];
