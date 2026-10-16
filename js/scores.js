"use strict";
// Scoreboard: Top 10 scores and the 10 most recent deaths, shared through Supabase
// (see supabase/scores.sql and js/config.js). Without a configured backend, or when the
// network is down, it falls back to this browser's own games. Failed submissions are
// queued and retried next time the page loads.

const SCORES_ONLINE = !!(SCORES_CONFIG.url && SCORES_CONFIG.anonKey);
const LOCAL_SCORES_KEY = 'steppe-crawl-scores-local';
const PENDING_KEY = 'steppe-crawl-scores-pending';
const SHARE_KEY = 'steppe-crawl-share-scores';

function lsGet(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
const shareScores = () => lsGet(SHARE_KEY, true) !== false;
const setShareScores = on => lsSet(SHARE_KEY, !!on);

// A short list of words that should not appear as public names.
const NAME_BLOCK = ['fuck', 'shit', 'cunt', 'nigg', 'fag', 'rape', 'nazi', 'hitler', 'whore', 'bitch', 'slut', 'retard'];
function cleanName(n) {
  n = String(n || '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
  const flat = n.toLowerCase().replace(/[^a-zа-яё]/g, '');
  if (!n || NAME_BLOCK.some(w => flat.includes(w))) return 'A nameless rider';
  return n;
}

// Called when a game ends.
function recordGame() {
  const p = G.p;
  const entry = {
    name: cleanName(p.name), species: SPc().n, background: BGc().n, xl: p.xl, score: score(),
    place: placeName(), days: daysFromHome(), cause: String(G.cause || 'unknown').slice(0, 120), won: !!G.won,
    turns: Math.floor(G.turn), kills: G.kills, god: p.god ? GODS[p.god].n : null, tamgas: p.tamgas.length, version: VERSION,
  };
  const local = lsGet(LOCAL_SCORES_KEY, []);
  local.unshift(Object.assign({ created_at: new Date().toISOString(), mine: true }, entry));
  lsSet(LOCAL_SCORES_KEY, local.slice(0, 100));
  if (SCORES_ONLINE && shareScores()) {
    const pending = lsGet(PENDING_KEY, []); pending.push(entry); lsSet(PENDING_KEY, pending.slice(-20));
    flushPendingScores();
  }
  scoreCache = null;
}

function sbFetch(path, opts = {}) {
  // Older projects use a JWT "anon" key, which also goes in the Authorization header;
  // newer "publishable" keys (sb_publishable_...) go only in the apikey header.
  const key = SCORES_CONFIG.anonKey, auth = key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {};
  return fetch(`${SCORES_CONFIG.url.replace(/\/$/, '')}/rest/v1/${path}`, Object.assign({}, opts, {
    headers: Object.assign({ apikey: key, 'Content-Type': 'application/json' }, auth, opts.headers || {}),
  }));
}
let flushing = false;
async function flushPendingScores() {
  if (!SCORES_ONLINE || flushing) return;
  const pending = lsGet(PENDING_KEY, []); if (!pending.length) return;
  flushing = true;
  try {
    const r = await sbFetch('games', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(pending) });
    if (r.ok) lsSet(PENDING_KEY, []);
  } catch (e) { /* offline: try again later */ }
  flushing = false;
}

const SCORE_FIELDS = 'name,species,background,xl,score,place,days,cause,won,turns,kills,god,tamgas,created_at';
let scoreCache = null;
// Returns { top, recent, online }. top: highest scores (any outcome); recent: most recent deaths.
async function fetchScores(n = 10) {
  if (scoreCache && Date.now() - scoreCache.at < 30000 && scoreCache.n >= n) return scoreCache.data;
  let data = null;
  if (SCORES_ONLINE) {
    try {
      await flushPendingScores();
      const [top, recent] = await Promise.all([
        sbFetch(`games?select=${SCORE_FIELDS}&order=score.desc,created_at.asc&limit=${n}`).then(r => r.ok ? r.json() : Promise.reject(r.status)),
        sbFetch(`games?select=${SCORE_FIELDS}&won=eq.false&order=created_at.desc&limit=${n}`).then(r => r.ok ? r.json() : Promise.reject(r.status)),
      ]);
      data = { top, recent, online: true };
    } catch (e) { data = null; }
  }
  if (!data) {
    const local = lsGet(LOCAL_SCORES_KEY, []);
    data = { top: local.slice().sort((a, b) => b.score - a.score).slice(0, n), recent: local.filter(e => !e.won).slice(0, n), online: false };
  }
  scoreCache = { at: Date.now(), n, data };
  return data;
}

// --- rendering helpers shared by the start page and scores.html ---
function ago(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (!(s >= 0)) return '';
  if (s < 90) return 'just now'; if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`; return `${Math.round(s / 86400)} d ago`;
}

function scoreListsHTML(d) {
  const top = d.top.length ? `<ol class="sclist">${d.top.map(e => `<li><span class="scn">${esc(e.name)}</span> <span class="scs">${e.score}</span><small>L${e.xl} ${esc(e.species)} ${esc(e.background)} · ${e.won ? '<span class="gold">won</span>' : esc(e.place)}</small></li>`).join('')}</ol>` : '<p class="dim">No scores yet. Be the first.</p>';
  const rec = d.recent.length ? `<ol class="sclist">${d.recent.map(e => `<li><span class="scn">${esc(e.name)}</span>, level ${e.xl}<small>${esc(e.cause)} · ${esc(ago(e.created_at))}</small></li>`).join('')}</ol>` : '<p class="dim">No deaths yet.</p>';
  return `<div class="cols"><div><h3>Top 10 scores</h3>${top}</div><div><h3>10 most recent deaths</h3>${rec}</div></div>`;
}
