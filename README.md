# Turkey Run — Escape Thanksgiving

[![turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/Nghyuu/turkey-run-game-01-entry/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/Nghyuu/turkey-run-game-01-entry/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

A turkey is about to become Thanksgiving dinner. Run.

**Turkey Run** is a complete 2D canvas escape game, played with keyboard
and mouse (touch works too). The turkey sprints across the farm with the
farmer on its heels — dodge fences, hay bales and puddles in the farmyard,
slide under the low beams in the barn, then jump the glowing oven and the
swinging carving knife in the farmhouse kitchen. Grab corn for score (corn
also widens the gap to the farmer), chain pickups for streaks, and cover
1500 m through all three stages to escape to the woods.

## How to play

| Control | Action |
| --- | --- |
| Space / ↑ / W, or click / tap | Jump, then flap again mid-air (double jump) |
| ↓ / S, or a low click / tap | Slide (under the barn beams) |
| P / Esc | Pause |
| R / Enter | Restart from the end screen |
| M | Mute |

Three lives: every stumble costs one and lets the farmer surge closer.
Run clean and he falls back — stay clean for a while and he stops to
search, giving you breathing room. Get caught, or reach 1500 m and escape.

## Features

- Three stages with their own palette and obstacle mix: farmyard, barn, kitchen
- A farmer who chases, surges after your stumbles, and searches when you run clean
- Score, distance, stage, lives and a farmer-proximity meter in the HUD
- Corn, golden corn and pumpkin-pie pickups with streaks
- Synthesized WebAudio sound effects (no audio files): flap, pickup, stumble, the farmer's shout, caught and escape jingles
- Title, pause and end screens (caught or escaped) with restart
- Deterministic screenshot mode: `?shot=title|play|end&seed=N`

## Play it

Serve `game/` with any static server and open `game/index.html`, or just
open the file directly. Everything is self-contained: vanilla JavaScript,
no libraries, no network requests, no external assets.

## Layout

- `game/` — the game: `index.html` plus `src/` (`config.js`, `random.js`,
  `input.js`, `audio.js`, `world.js`, `render.js`, `main.js`)
- `screenshots/` — title, gameplay and end-screen renders of the game itself
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `main.ts` — copies `game/` and `screenshots/` to `$MAKEFUN_OUTPUT_DIR`
  and writes `dossier.json`
- `shots.json` — the screenshot scenes (`?shot=` queries) used to capture them

## License

MIT — see [LICENSE](LICENSE).
