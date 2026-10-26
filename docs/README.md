# XDruid I / Assay Homestead — Project Knowledge Base

**Last updated:** 2026-10-26  
**Status:** Alpha — living document. Update in the same slice as any system change.  
**Hyper-realism check:** A new developer reading this folder alone should understand the whole game in one afternoon. If a section fails that test, flag it in DOC_FRESHNESS.md.

## What this is

XDruid I (Assay Homestead) is a SNES-style persistent homestead life-sim in the browser. One druid tends a floating yard, farms, keeps animals, trains magic in the courtyard, and travels through portals to other lands. The live build is at https://xdruidi.grok.me. It is not Unity, not Godot, not a finished product.

## Stack

- Client: Vite + React 19 + TanStack Start (see package.json).
- Game engine: pure TypeScript in `src/game/` (logic.ts, content.ts, draw.ts, save.ts, audio.ts, etc.).
- Rendering: canvas-based pixel drawing (draw.ts is large).
- Persistence: browser localStorage under key `assay-homestead-v2`, with checksum, backups, and quarantine.
- Sidecars: SNES LoROM (`snes/xdruid.sfc`) and Python desktop window (`python/xdruid.py`). Neither is the browser game.
- Art: Farm Life pixel pack by sophi-x-x (16×16 grid, 32×32 display). Credit required in spirit; do not redistribute raw files.

## How to read the code in an afternoon

1. Start with `README.md` (repo root) for player-facing description.
2. Read `docs/ARCHITECTURE.md` for structure.
3. Skim `src/game/content.ts` for world constants, item definitions (DEFS), plots, animals.
4. Read `src/game/save.ts` for the exact save contract.
5. `src/game/logic.ts` owns simulation rules (needs, autonomy, growth, interactions).
6. `src/components/AssayGame.tsx` wires the React UI and canvas.
7. Governing vision: `AGENTS.project.md` and `src/game/xdruid-mandate.ts`.

## Non-negotiable rules (from vision)

- Preserve Farm Life identity. Do not invent missing art.
- Never silently destroy save state.
- Every system must be testable, inspectable, and persistent.
- Runnable always. Live site must stay up.
- Stop for approval on destructive migrations or licensing changes.

## Current alpha scope (as of 2026-10-26)

Homestead yard with beds, animals (cow, rooster, goat, sow, cat), fishing pond, magic courtyard, portals to many lands (Svarga, Naraka, Skill Grove, Combat, Quarry, Floor 332, Mansion, etc.). Pack of 28 slots with weight. Tools spend Floor. Day/night clock. Local save only.

See the other files in this folder for schemas and maps.
