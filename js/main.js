"use strict";
// Boot.
window.addEventListener('error', e => { try { if (G) msg('Error: ' + e.message, '#ff4040'); render(); } catch (_) { } });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
resize();
titleScreen();
