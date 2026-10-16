"use strict";
// Skills, modelled on Crawl: skill points come from experience and are split
// between the skills you are training, scaled by your species' aptitude.

const SKILLS = [
  ['fighting', 'Fighting', 'Melee'], ['short', 'Short Blades', 'Melee'], ['long', 'Long Blades', 'Melee'],
  ['axes', 'Axes', 'Melee'], ['maces', 'Maces & Flails', 'Melee'], ['polearms', 'Polearms', 'Melee'],
  ['staves', 'Staves', 'Melee'], ['unarmed', 'Unarmed Combat', 'Melee'],
  ['bows', 'Bows', 'Ranged'], ['slings', 'Slings', 'Ranged'], ['throwing', 'Throwing', 'Ranged'],
  ['armour', 'Armour', 'Defence'], ['dodging', 'Dodging', 'Defence'], ['shields', 'Shields', 'Defence'],
  ['stealth', 'Stealth', 'Defence'],
  ['spellcasting', 'Spellcasting', 'Magic'], ['conj', 'Conjurations', 'Magic'], ['hexes', 'Hexes', 'Magic'],
  ['summ', 'Summonings', 'Magic'], ['necro', 'Necromancy', 'Magic'], ['tloc', 'Translocations', 'Magic'],
  ['alch', 'Alchemy', 'Magic'], ['fire', 'Fire Magic', 'Magic'], ['ice', 'Ice Magic', 'Magic'],
  ['air', 'Air Magic', 'Magic'], ['earth', 'Earth Magic', 'Magic'],
  ['invo', 'Invocations', 'Other'], ['evo', 'Evocations', 'Other'],
].map(([id, n, grp]) => ({ id, n, grp }));
const SK = Object.fromEntries(SKILLS.map(s => [s.id, s]));
const MAGIC_SCHOOLS = ['conj', 'hexes', 'summ', 'necro', 'tloc', 'alch', 'fire', 'ice', 'air', 'earth'];
const MELEE_SKILLS = ['short', 'long', 'axes', 'maces', 'polearms', 'staves'];

// Points needed to reach each level (cumulative).
const SKILL_TOTAL = [0];
for (let n = 1; n <= 27; n++) SKILL_TOTAL[n] = SKILL_TOTAL[n - 1] + Math.round(4 * Math.pow(n, 1.8));
function skillLevelFromPts(p) { let n = 0; while (n < 27 && SKILL_TOTAL[n + 1] <= p) n++; return n; }
function skillFrac(p) {
  const n = skillLevelFromPts(p); if (n >= 27) return 27;
  return n + (p - SKILL_TOTAL[n]) / (SKILL_TOTAL[n + 1] - SKILL_TOTAL[n]);
}
// Aptitude: each point is worth about 19% more (or less) skill per experience.
const aptMult = apt => Math.pow(2, apt / 4);

// Experience needed for each level (cumulative).
function xpForLevel(L) { const n = L - 1; return Math.round(4 * n * n * n + 6 * n); }
