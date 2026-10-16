-- Steppe Crawl public scoreboard.
-- Run this once in your Supabase project: Dashboard > SQL Editor > New query > paste > Run.
--
-- Anyone can read the scores and add a finished game. Nobody (using the public key) can
-- change or delete a row. The checks below reject malformed or absurd entries.

create table if not exists public.games (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 40),
  species     text not null check (char_length(species) between 1 and 30),
  background  text not null check (char_length(background) between 1 and 30),
  xl          int  not null check (xl between 1 and 27),
  score       int  not null check (score between 0 and 10000000),
  place       text not null check (char_length(place) between 1 and 60),
  days        int  not null check (days between 0 and 40),
  cause       text not null check (char_length(cause) between 1 and 120),
  won         boolean not null default false,
  turns       int  not null check (turns between 0 and 10000000),
  kills       int  not null check (kills between 0 and 100000),
  god         text check (god is null or char_length(god) <= 30),
  tamgas      int  not null default 0 check (tamgas between 0 and 4),
  version     int  not null check (version between 1 and 100)
);

create index if not exists games_score_idx  on public.games (score desc);
create index if not exists games_recent_idx on public.games (created_at desc);

alter table public.games enable row level security;

-- Newer Supabase projects don't grant the public roles access to new tables automatically.
-- Allow reading and adding only; there is deliberately no UPDATE or DELETE grant.
grant select, insert on public.games to anon, authenticated;

drop policy if exists "Anyone can read scores" on public.games;
create policy "Anyone can read scores" on public.games
  for select to anon, authenticated using (true);

drop policy if exists "Anyone can add a finished game" on public.games;
create policy "Anyone can add a finished game" on public.games
  for insert to anon, authenticated
  with check (created_at > now() - interval '1 minute' and created_at < now() + interval '1 minute');

-- No update or delete policies: rows cannot be changed or removed with the public key.
-- (You can still remove spam yourself in the Table Editor, which uses your admin access.)
