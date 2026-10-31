# Save Format Specification

**Dated:** 2026-10-26 (updated 2026-10-31 for SAVE-005 / SAVE-006, in review, not live)  
**Source of truth:** `src/game/save.ts` and the `ensure*` functions in `content.ts`  
**Key:** `assay-homestead-v2` (localStorage)

## Envelope

```ts
type Envelope = { version: 1; sum: string; state: GameState };
```

- `sum` is an FNV-1a 32-bit checksum of `JSON.stringify(state)` (without the transient `uiEvent`).
- On write: rotate current → bak1 → bak2, write new envelope.
- Landmark key `assay-homestead-v2.farmland` is written once and never rotated.
- When written (SAVE-006): on interactions that return `save: true`, when a timed action (harvest, water, chop, ...) finishes in `step()` (it sets `uiEvent.save`), when the tab is hidden or closed, on quit to title, and on panel actions. Each write rotates the backups.

## Validation on read

1. Try SAVE_KEY, BAK1, BAK2, LANDMARK in that order.
2. Parse JSON. If envelope present, recompute checksum; mismatch → quarantine.
3. Accept only if `version === 1` and `pack` is array of length 28.
4. Run a chain of `ensure*` functions (ensureAuto, ensureBirds, ensureFishing, ensureHealth, ensureLife, ensureMagic, ensureReaper, ensureHand, ensureXiang64, ensureMaid, ensureStable, ensureGoatPen, ensureCourtHerd, ensureSow, ensureSkills, ensureWeather, ensureWing, lockBeds, placeCourtSpawn, placeHerd, ensureFarmRack).
5. On any failure, quarantine the raw string and continue to the next backup.
6. `loadSave(store)` returns `{ status, state, from, quarantined, message }`. `status` is `loaded`, `recovered` (a backup was used), `all-corrupt` (saves existed, none readable; a new homestead starts) or `empty`. The game shows `message` as a dismissible alert. `readSaveFrom` still returns only the state.

## Quarantine

Failed saves are preserved rather than deleted. Never silently discard unknown fields.

Keys (SAVE-005): the first bad copy ever kept uses `assay-homestead-v2-quarantine` (legacy key, unchanged). Later copies use `assay-homestead-v2-quarantine-<slot key>`, then `-2`, `-3`, ... up to 99. An existing quarantine key is never overwritten. Byte-identical bad backups are each kept.

Not yet implemented (v2 plan rule, WIRE-PERSIST-001): quarantining unknown *fields* inside an otherwise good save. Today unknown fields are kept as they are, not removed.

## GameState shape (inferred from usage)

Must contain at minimum:
- `version: 1`
- `pack: Item[]` of length 28
- `rng: number`
- `flowers: Flower[]`
- `plots: Plot[]`
- animals, skills, weather, wing, life, magic, health, auto, etc. (populated by ensure*)

Exact TypeScript definition lives in `content.ts`. Do not invent fields; read the type.

## Migration policy

Additive only. `ensure*` functions fill missing pieces. Destructive changes require owner approval (see AGENTS.project.md).

## Freshness

If save.ts or the ensure* list changes, update this file in the same commit.
