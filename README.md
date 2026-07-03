# CHIMERA RED

A Game Boy–style monster-catching RPG built in TypeScript + Next.js, faithful
to the mechanics of the classic Gen 1 games — with **entirely original**
creatures, regions, characters, music, and art.

> The battle math and numeric systems are modeled on the Gen 1 engine (via the
> open `pret/pokered` disassembly), but every name, sprite, map, tune, and line
> of dialogue is original. No Nintendo assets are used or reproduced.

## Play

```bash
npm install
npm run dev
```

Open http://localhost:3000.

**Controls:** Arrow keys / WASD move · `Z` or `Space` = A · `X` or `Esc` = B ·
`Enter` = START · `Shift` = SELECT (toggles sound). On-screen buttons appear on
touch devices.

## What's in it

- **Overworld engine** — 160×144 Game Boy resolution, DMG green palette,
  procedural tiles/sprites/font, grid movement with collision, ledge hops,
  map-to-map connections, doors/warps with fade transitions, wandering NPCs and
  a typewriter dialog box.
- **Full Gen 1 battle system** — the damage formula with STAB, the 15-type
  chart (including era quirks like Ghost↛Psychic), speed-based criticals, stat
  stages, the 1/256 miss, status conditions (PSN/BRN/PAR/SLP/FRZ) + confusion,
  multi-hit/drain/recoil/priority moves, the capture algorithm, escape formula,
  experience with stat-exp and growth curves, move learning and evolution.
- **A region to explore** — Myrtos Town, Kyma Town, Pyrgos Town, Anemos
  Village, three routes, Halite Cave, the Eris Watchtower, Thyella Pass
  (victory road) and the Olympia Plateau.
- **Trainers & story** — line-of-sight trainer battles, your rival, three GYM
  leaders with badges (which grant Gen 1 stat boosts), the villainous TEAM ERIS
  arc, the ELITE FOUR gauntlet and a CHAMPION fight, plus a Hall of Fame.
- **Systems** — party & summary screens, bag and items, a growing dex, save/
  load to localStorage, storage PC, Chimera Centers and Marts, fishing, a
  day-care, in-game trades, and a legendary encounter.
- **Original chiptune audio** — a tiny WebAudio synth plays original title,
  overworld, battle and victory themes, plus sound effects.

## Structure

```
src/game/
  engine/   loop, renderer, input, scene stack, font, audio
  world/    tiles, character + monster sprites, map model
  data/     species, moves, type chart, items, maps, encounters
  battle/   Gen 1 damage/catch/exp math
  scenes/   title, overworld, battle, menus, shop, PC, evolution, hall of fame
  state.ts  save-able game state + Gen 1 stat formulas
  story.ts  scripted events, gyms, Elite Four, endgame
```
