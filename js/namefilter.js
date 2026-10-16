"use strict";
// Offensive-name filter for the character name (and for names posted to the scoreboard).
// It looks through common disguises: look-alike digits and symbols, stretched letters,
// spaces or punctuation between letters, accents, and Cyrillic letters.
// Long, unambiguous words are matched anywhere in the name; short words that also occur
// inside ordinary names are only matched as whole words, to avoid false alarms.

const NAME_BAD_ANYWHERE = [
  // English
  'fuck', 'fck', 'fvck', 'phuck', 'cnt', 'shit', 'cunt', 'nigger', 'nigga', 'faggot', 'fagot', 'retard', 'whore', 'bitch', 'slut',
  'rapist', 'raping', 'nazi', 'hitler', 'kike', 'chink', 'tranny', 'penis', 'vagina', 'dildo', 'wank', 'twat', 'pussy',
  'porn', 'molest', 'pedo', 'paedo', 'jizz', 'blowjob', 'handjob', 'cocksuck', 'motherf', 'asshole', 'arsehole',
  'bastard', 'buttplug', 'masturb', 'orgasm', 'killyourself', 'genocide', 'holocaust',
  // Russian, transliterated (Cyrillic is transliterated before matching)
  'blyat', 'blyad', 'bljad', 'pizd', 'khuy', 'khui', 'huyl', 'yebat', 'yobany', 'mudak', 'pidor', 'pidar', 'gandon', 'zalup', 'shlyukh',
  // Kyrgyz / Kazakh / Turkish
  'amyna', 'amina koy', 'sikeyin', 'siktir', 'orospu', 'kotak', 'jalap',
];
const NAME_BAD_WORDS = ['ass', 'arse', 'cock', 'dick', 'cum', 'anal', 'tit', 'tits', 'fag', 'fags', 'gook', 'spic', 'rape',
  'sex', 'sexy', 'nude', 'kys', 'suka', 'sik', 'sikt', 'amk', 'shlyukha', 'dyke', 'nig', 'kkk'];

// Real names and places that contain a blocked word inside them.
const NAME_ALLOW = ['scunthorpe', 'shitov', 'shitova', 'shitikov', 'penistone', 'cockburn', 'hancock', 'dickens', 'dickinson'];

const CYR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ы: 'y', э: 'e', ю: 'yu', я: 'ya', ь: '', ъ: '',
  ө: 'o', ү: 'u', ң: 'n', қ: 'k', ғ: 'g', ә: 'a', і: 'i', ұ: 'u', һ: 'h' };
const LEET = { '0': 'o', '1': 'i', '!': 'i', '|': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's', '7': 't', '8': 'b', '9': 'g', '+': 't', '€': 'e' };

function nameLetters(s) {
  s = String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
  s = [...s].map(ch => CYR[ch] !== undefined ? CYR[ch] : LEET[ch] !== undefined ? LEET[ch] : ch).join('');
  return s.replace(/ı/g, 'i');
}
const squeeze = s => s.replace(/(.)\1+/g, '$1');

// True if the name contains an offensive word.
function isOffensiveName(name) {
  const base = nameLetters(name);
  let flat = base.replace(/[^a-z]/g, '');                   // "f.u-c k" -> "fuck"
  for (const a of NAME_ALLOW) flat = flat.split(a).join('');
  const forms = [flat, squeeze(flat)];                       // "fuuuck" -> "fuck"
  if (NAME_BAD_ANYWHERE.some(w => { const k = w.replace(/[^a-z]/g, ''); return forms.some(f => f.includes(k)); })) return true;
  const words = base.split(/[^a-z]+/).filter(Boolean);
  return words.some(w => NAME_BAD_WORDS.includes(w) || NAME_BAD_WORDS.includes(squeeze(w)));
}

// Tidy a name for display and posting; offensive or empty names become a neutral one.
function cleanName(n) {
  n = String(n || '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
  if (!n || isOffensiveName(n)) return 'A nameless rider';
  return n;
}
