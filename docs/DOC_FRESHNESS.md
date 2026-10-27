# Doc Freshness Check

**Dated:** 2026-10-26  
**Purpose:** Flag any section whose code has diverged.

## How to check

1. Compare each docs/*.md "Source of truth" line against the actual file.
2. If a constant, type, key, or ensure* list differs, mark the doc stale.
3. Docs that describe code that no longer exists are defects — delete or rewrite them in the same slice.

## Current known state (2026-10-26)

| Doc | Source | Status |
|-----|--------|--------|
| ARCHITECTURE.md | src/game/*, package.json | Current |
| SAVE_FORMAT.md | src/game/save.ts | Current |
| CONTENT_REGISTRY.md | src/game/content.ts | Current (types partial; full GameState still in content.ts) |
| SYSTEM_MAPS.md | logic.ts + content.ts + README | Current for alpha scope |
| STYLE_GUIDE.md | AGENTS.project.md + mandate | Current |
| Public changelog | src/routes/changelog.tsx | Current (CHANGELOG-001) |

## Flagged

- No `docs/DRUIDI_BOT_CONTRACT.md` existed at the start of this slice. A stub has been added.
- Full GameState type is large and lives only in content.ts; the schema docs summarize the visible parts. A complete extracted type dump would be a useful next slice.
- Public-facing changelog page added at /changelog. Newest first, plain language, grouped by theme, each entry links to work-order ID. History kept. East house mentioned only if relevant.

Run this check whenever a system file is touched.
