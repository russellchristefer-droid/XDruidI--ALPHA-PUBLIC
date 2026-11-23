# Save Schema Catalog — XDruid I / Assay Homestead

**Dated:** 2026-11-22  
**Work order:** SAVE-ARCH-001  
**Status:** Living. Source of truth: src/game/save.ts, content.ts GameState and ensure* chain.  
**Hyper-realism check:** A long-term player’s months-old save loads without silent data loss. The farmer’s history survives.

## Envelope versions

Only one envelope version has ever been produced in this repository and the live build:

| Version | Introduced | Key | Notes |
|---------|------------|-----|-------|
| 1 | Earliest public alpha (~2026-09) | assay-homestead-v2 | Current. FNV-1a32 checksum of JSON.stringify(state without uiEvent). Rotating bak1/bak2 + landmark farmland. |

No version 0 or 2 has been written. Earlier prototype keys (guthix-osrs-life-v*, guthix-grove-v1) from private workspace memory are outside this public save system and are not migrated.

## GameState internal evolution (all under envelope version 1, additive only)

All changes have been additive. Missing fields are filled by the ensure* chain on load. No fields have been removed or renamed. Unknown fields are preserved (not stripped). Destructive changes require owner approval.

### Baseline (initial public, ~2026-09-28)
- Core: version:1, x/y/dir/speed/stamina/downed/day/time/season/clock, pack[28], hotbar, selected, activeId, body, vault, purse, plots, flowers, animals, branches, structures, ground, cat (basic), birds, reaper, hand, stats, nextId, rng, action, pending, message, summary, weather, weatherLeft, wet, flash, bolts, life, auto, fishing, magic, mana, health, skills, rune, cast, wing, cross, uiEvent?, mansion?, courtSpawn?, handPlace?, goatPen?, goatLoose?, goatSlash?, xiang64?, maid?, stablePlace?, stable?, farmRack?

### Additive deltas (field-by-field)

1. **SAVE-005 / SAVE-006 (2026-10-31)**  
   No GameState field changes. Quarantine behavior and more frequent writes. Diff: none.

2. **MEMORY-001 (2026-11-12)**  
   Added optional `Animal.memory?: CreatureMemory` and `cat.memory?: CreatureMemory`.  
   CreatureMemory: { bond: number; interactions: number; lastClock: number; closeApproach: number; toolReaction: string; moodEcho: number; /* plus any later */ }  
   Migration: ensureCreatureMemory fills defaults (bond:0, interactions:0, etc.) if missing. Lossless and reversible (old build ignores unknown optional fields).  
   Diff: +memory on animals and cat.

3. Subsequent ensure* (ongoing)  
   ensureFarmRack, ensureSow, ensureCourtHerd, ensureGoatPen, ensureStable, ensureXiang64, ensureMaid, ensureHand, ensureReaper, ensureBirds, ensureFishing, ensureHealth, ensureLife, ensureMagic, ensureSkills, ensureWeather, ensureWing, ensureAuto, lockBeds, placeCourtSpawn, placeHerd fill missing optional or defaulted structures. All additive.

## Migration paths

- Every historical save under version 1 loads via loadSave → decodeState (checksum + shape) → finishLoad (ensure* chain).  
- Paths are lossless: existing fields untouched; missing filled with defaults.  
- Reversible: a save written by current build loads in prior builds (unknown optionals ignored; required fields present).  
- No silent deletion of unknown state.

## Backup integrity

- On write: rotate current → bak1 → bak2; write new envelope with checksum. Landmark written once.  
- Checksum computed on encode; re-verified on decode. Mismatch → quarantine.  
- Rotating backups are restorable (loadSave tries them in order).  
- Schedule: re-verify on every load (immediate); no separate background schedule yet (see risks).

## Representative historical saves for harness

- v1-baseline: minimal valid state with pack length 28, version 1, no optional memory.  
- v1-with-memory: current createGame() after ensureCreatureMemory.  
- Corrupt variants for quarantine tests (already in save.test.ts).

Hyper-realism: yes — the world remembers the farmer’s animals’ bonds, the plots, the day, the purse. History survives across sessions and builds.
