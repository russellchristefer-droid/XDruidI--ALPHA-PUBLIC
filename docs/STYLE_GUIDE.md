# Style Guide Cross-Links

**Dated:** 2026-10-31

## Governing documents

- Vision and non-negotiable rules: `AGENTS.project.md`
- Implementation mandate for briefs: `src/game/xdruid-mandate.ts`
- Player-facing description: root `README.md`
- Art pack ground truth: https://sophi-x-x.itch.io/farm-life-pixel-art-pack-animated-asset-pack
- **Visual style (living, enforceable):** `docs/VISUAL_STYLE_GUIDE.md`

## Visual identity

- Farm Life pack by sophi-x-x. 16×16 grid, displayed at 32×32.
- Warm palette, readable silhouettes, disciplined outlines.
- High-fidelity pixel realism = timing, light, material response, weather, cause-and-effect — never high-res noise or mixed resolutions.
- Integer scaling, nearest-neighbor only.
- Credit to sophi-x-x in credits and README. Do not redistribute raw files.
- Per-realm identities and pass/fail checklists live in `docs/VISUAL_STYLE_GUIDE.md`. No asset ships without a style-guide pass.

## Code style

- TypeScript, ESM.
- Content is data (DEFS). Logic consumes stable IDs.
- No silent state destruction.
- Tests live beside the code (`*.test.ts`).

## Freshness

If the pack listing, the mandate, or the visual style guide changes, update the cross-links here.
