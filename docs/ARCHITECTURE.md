# Architecture Overview

**Dated:** 2026-10-26  
**Engine location:** `src/game/`  
**UI entry:** `src/components/AssayGame.tsx`

## Layers

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Presentation | `src/components/AssayGame.tsx`, `src/game/draw.ts`, paint/ | Canvas rendering, React chrome, HUD, zoom, mute |
| Simulation | `src/game/logic.ts` | Needs decay, autonomy pipeline, crop growth, animal behavior, interactions, magic |
| Content | `src/game/content.ts` | World constants, item definitions (DEFS), plots, animals, flowers, type shapes |
| Persistence | `src/game/save.ts` | Encode/decode with FNV checksum, localStorage rotation, quarantine, ensure* migrations |
| Audio | `src/game/audio.ts` + *sound.ts | Buses (Master, Music, Weather, Animals, Bell), event-triggered |
| Assets | `src/game/assets.ts`, public/ | Sprite sheets referenced by IconRef |
| Localization | `src/game/i18n.ts`, `public/locales/` | Stable-key English source; drop-in JSON locales; t() fallback |
| Tiles / collision | `src/game/tiles.ts`, `realmFeet.ts` | Stamps, blocks, plate solid |
| Dev tools | `dev-sprites.ts`, `dev-sprite-api.ts`, MapEditor | Console briefs, sprite inspection |

## Data flow

1. GameState lives in memory (typed in content.ts).
2. logic.ts mutates it each tick (DAY_SECONDS = 90).
3. draw.ts reads state + content to paint.
4. On change, save.ts encodes and writes to localStorage.
5. On load, save.ts reads, validates checksum/shape, runs ensure* functions, returns state.

## Key constants (from content.ts)

- WORLD_W = 347, WORLD_H = 960
- VIEW_W = 347, VIEW_H = 194
- TILE = 8 (placement grid)
- PACK_SLOTS = 28, VAULT_SLOTS = 40
- MASS_CAP = 21, MASS_RUN = 16
- SAVE_KEY = "assay-homestead-v2"
- MAGIC_PLOT, BEDS, HERD_HOME, etc. define spatial layout

## Not present

No Unity, no Godot, no ECS framework beyond plain objects. No server-authoritative multiplayer in the current alpha (though lib/multiplayer exists as scaffolding).

## Freshness

If any file listed above no longer matches this description, this document is stale. See DOC_FRESHNESS.md.
