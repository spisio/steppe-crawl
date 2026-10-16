"use strict";
// Hand-drawn 32x32 tiles for things the Crawl tileset does not have:
// yurts, felt doors, mazars, balbals, steppe trees, horses, eagles, big cats,
// tamgas, the komuz and the Ene Malka. Drawn once onto small canvases at load.

const CUSTOM_TILES = {};
function ctile(name, draw) {
  const c = document.createElement('canvas'); c.width = 32; c.height = 32;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const P = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const E = (cx, cy, rx, ry, col) => { // pixel ellipse
    g.fillStyle = col;
    for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry)))); g.fillRect(cx - w, cy + y, w * 2 + 1, 1); }
  };
  draw(P, E, g);
  CUSTOM_TILES[name] = c;
}

// --- yurt felt and doors ---
ctile('felt', (P) => {
  P(0, 0, 32, 32, '#d9ccb0'); P(0, 0, 32, 3, '#efe5cf'); P(0, 29, 32, 3, '#a8987a');
  for (let x = 0; x < 32; x += 4) P(x, 3, 1, 26, '#cbbd9e');
  P(0, 12, 32, 8, '#a3263a'); P(0, 12, 32, 1, '#7a1828'); P(0, 19, 32, 1, '#7a1828');
  for (let x = 0; x < 32; x += 8) { P(x + 1, 14, 2, 2, '#f0e4c8'); P(x + 3, 15, 2, 2, '#f0e4c8'); P(x + 5, 14, 2, 2, '#f0e4c8'); P(x + 3, 17, 2, 1, '#f0e4c8'); }
});
ctile('door_c', (P) => {
  P(2, 1, 28, 31, '#6e4a2a'); P(5, 4, 22, 28, '#e3d6b8'); P(5, 4, 22, 2, '#f4ecd8');
  P(5, 14, 22, 5, '#a3263a'); for (let x = 7; x < 26; x += 5) P(x, 15, 3, 3, '#f0e4c8');
  P(15, 24, 2, 3, '#6e4a2a');
});
ctile('door_o', (P) => {
  P(2, 1, 28, 31, '#6e4a2a'); P(5, 4, 22, 28, '#1a1410'); P(5, 4, 7, 28, '#e3d6b8'); P(5, 14, 7, 5, '#a3263a');
});

// --- mazar (cairn with white ribbons) and balbal ---
function cairn(P, E, ribbons) {
  E(16, 25, 11, 5, '#6d6a62'); E(16, 22, 9, 5, '#8a867c'); E(16, 18, 6, 4, '#a19c90'); E(14, 17, 2, 1, '#bdb8ac');
  P(15, 2, 2, 16, '#6e4a2a');
  const rc = ribbons ? '#ffffff' : '#9a968c';
  for (const [y, len, dx] of [[4, 8, 1], [7, 6, -1], [10, 9, 1], [13, 5, -1]]) {
    for (let i = 0; i < len; i++) P(dx > 0 ? 17 + i : 14 - i, y + (i % 3 === 2 ? 1 : 0), 1, 2, rc);
  }
}
ctile('mazar', (P, E) => cairn(P, E, true));
ctile('mazar_used', (P, E) => cairn(P, E, false));
ctile('balbal', (P, E) => {
  E(16, 29, 9, 2, 'rgba(0,0,0,.35)');
  P(10, 6, 12, 23, '#8f8a80'); P(11, 4, 10, 4, '#8f8a80'); P(10, 6, 2, 23, '#a8a397'); P(20, 6, 2, 23, '#706b62');
  P(13, 9, 2, 1, '#3c3a35'); P(17, 9, 2, 1, '#3c3a35'); P(15, 10, 2, 3, '#77726a');
  P(12, 13, 8, 1, '#3c3a35'); P(12, 14, 2, 2, '#3c3a35'); P(18, 14, 2, 2, '#3c3a35');
  P(13, 18, 6, 4, '#706b62'); P(14, 17, 4, 1, '#3c3a35'); P(12, 20, 2, 2, '#77726a');
  P(11, 24, 10, 1, '#5f5b54');
});

// --- trees ---
function tree(P, E, kind) {
  E(16, 29, 9, 2, 'rgba(0,0,0,.35)');
  const trunk = (h, w = 3) => P(16 - (w >> 1), 30 - h, w, h, '#5b3d22');
  if (kind === 'juniper' || kind === 'spruce' || kind === 'frozen') {
    trunk(6);
    const dark = kind === 'juniper' ? '#25523c' : '#1d4a36', mid = kind === 'juniper' ? '#3a7552' : '#2f6b4a', lit = kind === 'frozen' ? '#e8f0ff' : (kind === 'juniper' ? '#5e9a6a' : '#4f8a5f');
    for (let i = 0; i < 4; i++) { const y = 4 + i * 5, w = 4 + i * 3; E(16, y + 3, w, 3, dark); E(15, y + 2, w - 1, 2, mid); P(16 - w + 2, y + 1, w - 1, 1, lit); }
  } else if (kind === 'poplar') {
    trunk(5); E(16, 14, 5, 13, '#3d7a3c'); E(15, 12, 3, 10, '#5a9a4e'); P(14, 4, 2, 6, '#7bb862');
  } else if (kind === 'walnut' || kind === 'tamarisk') {
    trunk(10, 4);
    const a = kind === 'walnut' ? ['#2e5e2a', '#43803a', '#64a24f'] : ['#8a6a7a', '#b08aa0', '#d4b0c4'];
    E(16, 12, 13, 9, a[0]); E(11, 10, 7, 6, a[1]); E(20, 9, 7, 6, a[1]); E(13, 7, 5, 3, a[2]); E(21, 7, 3, 2, a[2]);
  } else if (kind === 'saxaul' || kind === 'dead' || kind === 'root') {
    const c = kind === 'saxaul' ? '#7a7c58' : kind === 'root' ? '#6a5236' : '#5f5246';
    P(15, 14, 3, 16, c); P(10, 12, 2, 8, c); P(11, 19, 5, 2, c); P(20, 9, 2, 10, c); P(17, 17, 4, 2, c); P(7, 8, 2, 5, c); P(8, 12, 3, 2, c); P(23, 6, 2, 4, c);
    if (kind === 'saxaul') { E(10, 10, 4, 3, '#9aa070'); E(21, 8, 4, 3, '#9aa070'); E(16, 12, 3, 2, '#a8ae7c'); }
  }
}
for (const k of ['juniper', 'spruce', 'frozen', 'poplar', 'walnut', 'tamarisk', 'saxaul', 'dead', 'root']) ctile('tree_' + k, (P, E) => tree(P, E, k));

// --- horses ---
function horse(P, E, body, mane, wings) {
  E(16, 30, 11, 2, 'rgba(0,0,0,.35)');
  if (wings) { E(13, 9, 9, 5, '#dfe8f4'); E(11, 8, 6, 3, '#ffffff'); P(5, 9, 3, 1, '#c8d4e4'); }
  for (const x of [9, 12, 19, 22]) { P(x, 21, 2, 8, body); P(x, 28, 2, 2, '#2a2420'); }
  E(16, 17, 9, 5, body); P(23, 9, 4, 8, body); E(26, 9, 4, 3, body); P(28, 9, 2, 3, body);
  P(22, 8, 2, 9, mane); P(21, 7, 3, 2, mane); P(26, 8, 1, 1, '#141010'); P(29, 11, 1, 1, '#141010');
  P(6, 15, 2, 9, mane); P(5, 22, 2, 3, mane);
  E(15, 15, 6, 1, 'rgba(255,255,255,.25)');
}
ctile('horse', (P, E) => horse(P, E, '#9a6a3c', '#3b2616'));
ctile('tulpar', (P, E) => horse(P, E, '#f2f2f6', '#c8c8d8', true));

// --- birds ---
function bird(P, E, body, wing, head, beak) {
  E(16, 30, 8, 2, 'rgba(0,0,0,.3)');
  E(8, 13, 7, 4, wing); E(24, 13, 7, 4, wing); P(2, 14, 4, 2, wing); P(26, 14, 4, 2, wing);
  for (let i = 0; i < 5; i++) { P(3 + i * 2, 17, 1, 2, body); P(20 + i * 2, 17, 1, 2, body); }
  E(16, 16, 4, 7, body); E(16, 7, 3, 3, head); P(16, 8, 3, 2, beak); P(18, 9, 1, 1, beak); P(15, 6, 1, 1, '#141010');
  P(14, 23, 1, 4, '#c8a040'); P(18, 23, 1, 4, '#c8a040'); P(13, 26, 3, 1, '#c8a040'); P(17, 26, 3, 1, '#c8a040');
}
ctile('eagle', (P, E) => bird(P, E, '#7a5022', '#5a3a18', '#c8962e', '#e8c040'));
ctile('vulture', (P, E) => bird(P, E, '#3c3a40', '#24222a', '#d8b0a0', '#c8c0a0'));

// --- big cats ---
function cat(P, E, base, dark, spots) {
  E(16, 30, 11, 2, 'rgba(0,0,0,.35)');
  for (const x of [8, 11, 20, 23]) P(x, 21, 2, 8, base);
  E(15, 18, 9, 5, base); E(25, 14, 5, 4, base); P(22, 9, 2, 3, base); P(27, 9, 2, 3, base);
  P(24, 13, 1, 1, '#1a1a10'); P(27, 13, 1, 1, '#1a1a10'); P(26, 16, 2, 1, '#3a2a20');
  P(3, 12, 2, 8, base); P(2, 10, 2, 3, base);
  if (spots === 'stripes') for (let x = 9; x < 23; x += 3) P(x, 14, 1, 8, dark);
  else if (spots === 'rosettes') for (const [x, y] of [[10, 15], [14, 17], [18, 15], [12, 20], [17, 20], [21, 18], [25, 12]]) { P(x, y, 2, 2, dark); }
  else { P(22, 8, 1, 2, dark); P(28, 8, 1, 2, dark); }
}
ctile('lynx', (P, E) => cat(P, E, '#c8a878', '#5a4630', 'tufts'));
ctile('leopard', (P, E) => cat(P, E, '#e8e8ee', '#6a6a78', 'rosettes'));
ctile('tiger', (P, E) => cat(P, E, '#e0902e', '#2a1a10', 'stripes'));

// --- the Ene Malka and the tamgas ---
ctile('malka', (P, E, g) => {
  const grd = g.createRadialGradient(16, 16, 2, 16, 16, 16); grd.addColorStop(0, 'rgba(255,240,180,.75)'); grd.addColorStop(1, 'rgba(255,240,180,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 32, 32);
  E(16, 20, 9, 8, '#9a5a32'); E(16, 19, 8, 7, '#b8703e'); P(10, 11, 12, 3, '#9a5a32');
  E(16, 20, 10, 5, '#f4ecd8'); E(16, 19, 9, 4, '#ffffff'); P(6, 19, 20, 1, '#a3263a'); P(15, 15, 2, 9, '#a3263a');
  E(16, 10, 5, 2, '#f8f0dc'); P(14, 8, 4, 2, '#ffffff');
});
const TAMGA_MARKS = {
  chubar: [[15, 8, 2, 16], [10, 8, 2, 6], [20, 8, 2, 6], [11, 13, 10, 2]],
  boztorgoy: [[10, 10, 12, 2], [10, 20, 12, 2], [10, 10, 2, 12], [20, 10, 2, 12], [15, 6, 2, 20]],
  karakoyun: [[9, 9, 2, 2], [11, 11, 2, 2], [13, 13, 2, 2], [15, 15, 2, 2], [17, 17, 2, 2], [19, 19, 2, 2], [21, 21, 2, 2], [21, 9, 2, 2], [19, 11, 2, 2], [17, 13, 2, 2], [13, 17, 2, 2], [11, 19, 2, 2], [9, 21, 2, 2]],
  tanip: [[15, 7, 2, 18], [11, 11, 10, 2], [10, 7, 2, 5], [20, 7, 2, 5], [12, 23, 8, 2]],
};
for (const t in TAMGA_MARKS) ctile('tamga_' + t, (P, E, g) => {
  E(16, 29, 9, 2, 'rgba(0,0,0,.35)');
  P(8, 4, 16, 24, '#6f6a60'); P(7, 6, 18, 20, '#6f6a60'); P(9, 5, 14, 22, '#8a857a'); P(9, 5, 14, 1, '#a8a397');
  const col = TAMGAS[t].c;
  for (const [x, y, w, h] of TAMGA_MARKS[t]) P(x, y, w, h, col);
});

// --- the komuz ---
ctile('komuz', (P, E) => {
  E(12, 21, 7, 8, '#7a4a22'); E(12, 21, 5, 6, '#9a6232'); P(15, 3, 3, 15, '#6a3e1a'); P(14, 2, 5, 3, '#4a2a10');
  P(12, 6, 1, 18, '#e8d8a0'); P(14, 6, 1, 18, '#e8d8a0'); P(16, 6, 1, 18, '#e8d8a0'); E(12, 20, 2, 2, '#3a2010');
});

// --- the ways between valleys: passes, fords, tracks and trails ---
const PATH = '#b89a6a', PATH_D = '#8f7450';
function pathStrip(P, pts, w = 4) { for (const [x, y] of pts) P(x - (w >> 1), y, w, 2, PATH); }
ctile('pass', (P) => {
  // two snow-capped peaks with a low saddle between, and a path climbing into the saddle
  for (let x = 0; x < 32; x++) {
    const top = Math.round(Math.min(26, 4 + Math.abs(x - 7) * 1.7, 3 + Math.abs(x - 25) * 1.7));
    const shade = x < 7 || (x > 16 && x < 25) ? '#6f6a62' : '#5f5a53';
    P(x, top, 1, 31 - top, shade);
    if (top < 11) P(x, top, 1, 3, '#f2f2f6');
  }
  pathStrip(P, [[16, 29], [15, 27], [14, 25], [15, 23], [17, 21], [16, 19]], 4);
  P(15, 15, 3, 3, '#a19c90'); P(16, 12, 1, 3, '#ffffff'); P(17, 12, 3, 1, '#ffffff');
});
ctile('ford', (P) => {
  P(0, 9, 32, 14, '#3f6fc8'); P(0, 9, 32, 2, '#6fa0e0'); P(0, 21, 32, 2, '#2f5aa8');
  for (let x = 2; x < 32; x += 7) P(x, 14, 3, 1, '#a8c8f0');
  for (const [x, y] of [[4, 12], [11, 15], [18, 12], [25, 15]]) { P(x, y, 5, 4, '#8f8a80'); P(x, y, 5, 1, '#b8b3a6'); }
  pathStrip(P, [[16, 2], [16, 4], [16, 6], [16, 25], [16, 27], [16, 29]], 4);
});
ctile('gorge', (P) => {
  P(0, 0, 11, 32, '#5b4a3e'); P(21, 0, 11, 32, '#4a3c32'); P(9, 0, 3, 32, '#7a6450'); P(20, 0, 2, 32, '#3a2e26');
  for (let y = 2; y < 32; y += 6) { P(2, y, 6, 1, '#6e5b4c'); P(23, y + 3, 6, 1, '#5a4a3e'); }
  pathStrip(P, [[16, 2], [15, 6], [16, 10], [17, 14], [16, 18], [15, 22], [16, 26], [16, 29]], 5);
});
ctile('track', (P) => {
  for (let y = 0; y < 32; y += 2) { const off = Math.round(Math.sin(y / 6) * 3); P(10 + off, y, 2, 2, PATH_D); P(20 + off, y, 2, 2, PATH_D); }
  P(25, 12, 4, 12, '#8f8a80'); P(25, 12, 4, 1, '#b8b3a6'); P(26, 15, 2, 1, '#5f5b54'); P(29, 13, 3, 1, '#ffffff'); P(29, 15, 2, 1, '#ffffff');
});
ctile('trail', (P, E) => {
  pathStrip(P, [[16, 14], [15, 17], [14, 20], [15, 23], [17, 26], [16, 29]], 4);
  E(16, 11, 5, 3, '#6d6a62'); E(16, 9, 4, 2, '#8a867c'); E(16, 7, 2, 2, '#a19c90');
});
ctile('road', (P) => {
  // the Qara-Chik road home: wheel ruts and a signpost pointing back toward the checkpoint
  for (let y = 0; y < 32; y += 2) { P(7, y, 2, 2, PATH_D); P(15, y, 2, 2, PATH_D); }
  P(23, 8, 2, 23, '#6e4a2a'); P(22, 29, 4, 2, '#4a3018');
  P(18, 7, 11, 6, '#9a6a3c'); P(18, 7, 11, 1, '#c08850'); P(16, 9, 2, 2, '#9a6a3c'); P(17, 8, 1, 4, '#9a6a3c');
  for (let x = 20; x < 28; x += 2) P(x, 10, 1, 1, '#3a2614');
  P(25, 14, 5, 1, '#ffffff'); P(25, 16, 4, 1, '#ffffff');
});
// --- region landmarks ---
ctile('adit', (P) => {
  P(0, 0, 32, 32, '#5f5246'); for (let y = 3; y < 32; y += 7) P(0, y, 32, 1, '#4f4438');
  P(7, 6, 18, 26, '#0e0a08'); P(5, 5, 4, 27, '#7a5530'); P(23, 5, 4, 27, '#6a4826'); P(5, 4, 22, 4, '#8a6236');
  P(14, 11, 4, 5, '#e8b040'); P(15, 12, 2, 3, '#fff0a0');
});
ctile('shaft', (P) => {
  P(5, 6, 22, 20, '#7a5530'); P(8, 9, 16, 14, '#0e0a08'); P(12, 9, 2, 14, '#9a7040'); P(18, 9, 2, 14, '#9a7040');
  for (let y = 11; y < 23; y += 3) P(12, y, 8, 1, '#9a7040');
});
ctile('ladder', (P) => {
  P(0, 0, 32, 32, '#5f5246'); P(10, 0, 12, 4, '#e8d8a0');
  P(11, 2, 2, 30, '#9a7040'); P(19, 2, 2, 30, '#9a7040'); for (let y = 5; y < 32; y += 4) P(11, y, 10, 2, '#b8844e');
});
ctile('mound', (P, E) => {
  E(16, 22, 15, 9, '#6a7a3e'); E(16, 21, 13, 7, '#7e8e48'); E(13, 17, 6, 3, '#94a45a');
  P(12, 20, 8, 10, '#a89a7a'); P(13, 21, 6, 9, '#0e0c0a'); P(12, 19, 8, 2, '#c8b898');
});
ctile('woodpath', (P, E) => {
  E(16, 6, 15, 6, '#2e5e2a'); E(8, 8, 8, 5, '#43803a'); E(24, 8, 8, 5, '#3a7232');
  P(5, 10, 5, 22, '#5b3d22'); P(22, 10, 5, 22, '#4f341c'); P(6, 10, 1, 22, '#6e4c2c');
  pathStrip(P, [[16, 14], [15, 18], [16, 22], [17, 26], [16, 29]], 6);
});
ctile('dryriver', (P) => {
  P(0, 8, 32, 16, '#d8c8a0'); P(0, 8, 32, 2, '#b8a478'); P(0, 22, 32, 2, '#b8a478');
  for (const [x, y, w] of [[3, 12, 6], [8, 12, 1], [14, 16, 7], [20, 14, 1], [24, 18, 6], [5, 19, 5]]) P(x, y, w, 1, '#a08a60');
  for (const [x, y] of [[11, 10], [27, 12], [18, 20], [2, 16], [22, 10]]) P(x, y, 2, 2, '#8f8a80');
});
ctile('snowcairn', (P, E) => {
  E(16, 27, 14, 4, '#e8eef8'); E(16, 24, 9, 4, '#6d6a62'); E(16, 21, 7, 3, '#8a867c'); E(16, 18, 5, 2, '#a19c90');
  P(12, 17, 9, 1, '#ffffff'); P(13, 20, 7, 1, '#ffffff'); P(15, 4, 2, 14, '#6e4a2a');
  for (const [y, len] of [[5, 7], [8, 5], [11, 6]]) for (let i = 0; i < len; i++) P(17 + i, y + (i % 3 === 2 ? 1 : 0), 1, 2, '#ffffff');
});
function cleftTile(open) {
  return (P) => {
    P(0, 0, 32, 32, '#3e3848'); for (let y = 4; y < 32; y += 8) P(0, y, 32, 1, '#332e3c');
    for (let y = 2; y < 32; y++) { const w = 2 + Math.round(4 * Math.sin((y / 32) * Math.PI)); P(16 - w + (y % 5 === 0 ? 1 : 0), y, w * 2, 1, open ? '#e8d8ff' : '#141018'); }
    if (open) for (let y = 4; y < 30; y++) { const w = 1 + Math.round(2 * Math.sin((y / 32) * Math.PI)); P(16 - w, y, w * 2, 1, '#ffffff'); }
    else for (const [x, y] of [[13, 10], [17, 15], [14, 21], [16, 26]]) P(x, y, 3, 3, '#5a5266');
    for (const [x, y] of [[4, 8], [26, 12], [5, 22], [25, 24]]) { P(x, y, 3, 1, '#c070ff'); P(x + 1, y - 1, 1, 3, '#c070ff'); }
  };
}
ctile('cleft', cleftTile(false));
ctile('cleft_open', cleftTile(true));
ctile('whiteyurts', (P, E) => {
  pathStrip(P, [[16, 24], [16, 26], [16, 28], [16, 30]], 4);
  E(16, 16, 12, 9, '#f2ece0'); P(4, 16, 25, 9, '#f2ece0'); P(4, 18, 25, 2, '#a3263a'); P(13, 6, 6, 3, '#e0d6c4');
  P(13, 18, 6, 7, '#6e4a2a'); P(14, 19, 4, 6, '#3a2614'); P(4, 24, 25, 1, '#c8bca6');
});
