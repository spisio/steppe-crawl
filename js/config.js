"use strict";
// Public scoreboard (Supabase). From your Supabase project: the Project URL, and the
// public key ("publishable" sb_publishable_..., or the legacy "anon" key).
// The public key is meant to be visible; the database only lets it read scores and add new ones.
// Leave them empty to keep scores in this browser only.
// The public link used when players share a death or victory.
const GAME_URL = 'https://spisio.github.io/steppe-crawl/';

const SCORES_CONFIG = {
  url: 'https://kknjsybrxqibacysjuxg.supabase.co',
  anonKey: 'sb_publishable_JvdfmzZZxb67e03CaEIsDw_nsaY081m',
};
