# Save Format Specification

**Dated:** 2026-10-26  
**Source of truth:** `src/game/save.ts` and the `ensure*` functions in `content.ts`  
**Key:** `assay-homestead-v2` (localStorage)

## Envelope

```ts
type Envelope = { version: 1; sum: string; state: GameState };
```

- `sum` is an FNV-1a 32-bit checksum of `JSON.stringify(state)` (without the transient `uiEvent`).
- On write: rotate current → bak1 → bak2, write new envelope.
- Landmark key `assay-homestead-v2.farmland` is written once and never rotated.

## Validation on read

1. Try SAVE_KEY, BAK1, BAK2, LANDMARK in that order.
2. Parse JSON. If envelope present, recompute checksum; mismatch → quarantine.
3. Accept only if `version === 1` and `pack` is array of length 28.
4. Run a chain of `ensure*` functions (ensureAuto, ensureBirds, ensureFishing, ensureHealth, ensureLife, ensureMagic, ensureReaper, ensureHand, ensureXiang64, ensureMaid, ensureStable, ensureGoatPen, ensureCourtHerd, ensureSow, ensureSkills, ensureWeather, ensureWing, lockBeds, placeCourtSpawn, placeHerd, ensureFarmRack).
5. On any failure, quarantine the raw string under `assay-homestead-v2-quarantine` (or keyed variant) and continue to next backup.

## Quarantine

Failed saves are preserved rather than deleted. Never silently discard unknown fields.

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
