# Steppe Crawl

A roguelike set in Irad, in the tradition of [Dungeon Crawl Stone Soup](https://github.com/crawl/crawl).

Ten valleys run out from the Qara-Chik road toward Manas Peak, each a day farther from home, joined by passes, fords and old caravan tracks. Clan tamgas lie in four wild regions off the road; three of them open the sealed cleft to the ruin of the First Church, where the **Ene Malka**, the Mother Leaven of St. Janyl, waits with the bull-headed Herald of Morkhan. Bring the leaven home.

## Play

Play in your browser at **https://steppecrawl.online/**, or open `index.html` locally. A classic ASCII version is at **https://steppecrawl.online/ascii.html** (`ascii.html`); both versions share the same saved game, and each title screen links to the other.

New to the game? Read the **[instructions and game guide](https://steppecrawl.online/guide.html)** (`guide.html`), or press `?` in the game. There is no build step; fonts load from Google Fonts. Your game saves in the browser as you play.

## What's in it

Modelled on Crawl's systems, re-themed for Irad:

- **8 peoples** with Crawl-style aptitudes: Iradi, Tash-Kishi, Peri, Dev-born, At-Kishi, Börü-kin, Ajdaha-born, Kichi.
- **9 callings**: Baatyr, Berkutchi (with a golden eagle companion), Ïrchy, Jaychy, Kashysh, Bakshy, Tabyp, Ulakchy, Soodager.
- **28 skills** trained by experience, with manual or automatic training and focus, as in Crawl. Weapon skill speeds up attacks down to a minimum delay.
- **37 spells** in 10 schools, a spell library filled by books, memorisation by spell levels, and failure rates using the same inputs as Crawl's formula.
- **6 patrons** with piety, conduct, wrath and invoked abilities: St. Janyl, Kambar-Ata, Umay, Kök Tengri, Morkhan, and Kydyr-Ata (who deals in silver).
- **A ten-day journey plus seven regions (29 areas)**: the Valleys, the White Yurts (every altar), the Smugglers' Tunnels, the Arslanbob Woods, the Moiynkum Sands, the Old Kurgans, the Pass of the Black Blizzard, and the Hidden Valley of Janyl. Each region has its own map generator, monsters and boss.
- **About 60 creatures** with spells, packs and bands, resistances and sleeping, wandering and hunting behaviour, including uniques such as Tökö the Marmot King, Mystan Kempir and Jelmoguz the Seven-Headed.
- **Item identification** (flasks, bark scrolls, shakeks, tumars), weapon brands, armour egos, wands, magic staves, evocables that recharge with experience, eight artefacts, shops, traps, doors, clouds, mutations and corpses for necromancy.
- **Crawl conveniences**: auto-explore, auto-fight, rest, travel between levels, a targeting cursor, look mode, a monster threat list, and a character file when the game ends.

## Keys

| Key | Action |
| --- | --- |
| arrows, numpad, `hjklyubn` | move; walk into a foe to attack |
| `o` / `Tab` / `5` / `s` | explore / fight nearest / rest / wait |
| `>` `<` | go on or go back (a pass, ford, track or trail), or travel to the way |
| `G` or `O` | travel to a place you've been |
| `x` | look around |
| `i` `g` `d` | pack, pick up, drop |
| `w` `W` `T` `P` `R` | wield, wear, take off, put on, remove |
| `q` `r` `v` `f` `Q` | quaff, read, evoke, fire or throw, choose quiver |
| `z` `I` `M` | cast, list spells, memorise |
| `a` `p` `^` | abilities, pray, patron |
| `m` `%` `\` `Ctrl-P` | skills, character, discoveries, messages |
| `?` | instructions and game guide |

On a phone, use the on-screen pad and buttons (More has every command), or tap the map to travel and to aim.

## Code

Plain JavaScript, no dependencies. Data tables live in `js/data/` (species, skills, items, monsters, spells, patrons, regions and vaults); the engine is split into `levelgen`, `fov`, `player`, `items`, `combat`, `monsters`, `magic`, `religion`, `world`, `ui` and `input`.

## Tiles

The tiles version uses the public-domain (CC0) [Dungeon Crawl 32x32 tiles](https://opengameart.org/content/dungeon-crawl-32x32-tiles) from Dungeon Crawl Stone Soup, made by many artists; see `tiles/dcss/LICENSE.txt`. Only the tiles the game uses are included. Things the set has no tile for (yurts and felt doors, mazars, balbals, steppe trees, horses and the tulpar, golden eagles, the kumai, big cats, clan tamgas, the komuz and the Ene Malka) are drawn in code in `js/tiles-custom.js`. The tile mapping and renderer are in `js/tiles.js`.

## Public scoreboard

The start page shows the **Top 10 scores** and the **10 most recent deaths**, and [`scores.html`](https://steppecrawl.online/scores.html) shows them in detail. Finished games are posted automatically under the character's name; players can turn this off with the tick box on the start page. Until a database is connected, the lists show the games played in that browser.

To make the scoreboard shared by everyone (on GitHub Pages and on itch.io):

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project, open **SQL Editor**, paste the contents of [`supabase/scores.sql`](supabase/scores.sql), and run it. It creates the `games` table and lets the public key read scores and add new ones, but not change or delete them.
3. Open **Project Settings > API** and copy the **Project URL** and the **anon / publishable** key.
4. Put them in [`js/config.js`](js/config.js) and publish.

The public key is meant to be visible in the page. Scores are checked for sensible values, names are length-limited and filtered, and you can delete any spam yourself in Supabase's **Table Editor**. As with any browser game, a determined player could still post a fake score.
