# Extension API Notes

**Dated:** 2026-10-26

## Current hooks

- Dev sprite API: `src/game/dev-sprite-api.ts` and `dev-sprites.ts` — inspection and brief generation for the editor console.
- Tile stamps and blocks: `tiles.ts` (load/save under "assay-tiles-v1").
- Paint modules under `src/game/paint/` generate static art elements.
- Mandate string in `xdruid-mandate.ts` is injected into server-side brief writers.

## Planned (not yet)

The vision calls for a formal extension / mod SDK. None is exposed in the current alpha. Content addition today means editing DEFS and the corresponding logic consumers.

## Freshness

If a public API surface appears, document its stable entry points here.

## 2026-10-29 — Formal extension framework shipped

Stable API in `src/game/modding.ts`. See `docs/MODDING.md` for the full contract, exact signatures, validation rules, sandbox guarantees, and the non-engineer crop example.

Hyper-realism check: the registry + typed JSON + quarantine + version field is what a real studio ships so the game can grow through community without a rewrite.
