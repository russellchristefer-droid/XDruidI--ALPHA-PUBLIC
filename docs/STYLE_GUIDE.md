# Style Guide Cross-Links

**Dated:** 2026-10-26

## Governing documents

- Vision and non-negotiable rules: `AGENTS.project.md`
- Implementation mandate for briefs: `src/game/xdruid-mandate.ts`
- Player-facing description: root `README.md`
- Art pack ground truth: https://sophi-x-x.itch.io/farm-life-pixel-art-pack-animated-asset-pack

## Visual identity

- Farm Life pack by sophi-x-x. 16×16 grid, displayed at 32×32.
- Warm palette, readable silhouettes, disciplined outlines.
- High-fidelity pixel realism = timing, light, material response, weather, cause-and-effect — never high-res noise or mixed resolutions.
- Integer scaling, nearest-neighbor only.
- Credit to sophi-x-x in credits and README. Do not redistribute raw files.

## Code style

- TypeScript, ESM.
- Content is data (DEFS). Logic consumes stable IDs.
- No silent state destruction.
- Tests live beside the code (`*.test.ts`).

## Freshness

If the pack listing or the mandate changes, update the cross-links here.
