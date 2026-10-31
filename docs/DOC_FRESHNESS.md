# Doc Freshness Check

**Dated:** 2026-10-31  
**Purpose:** Flag any section whose code has diverged.

## How to check

1. Compare each docs/*.md "Source of truth" line against the actual file.
2. If a constant, type, key, or ensure* list differs, mark the doc stale.
3. Docs that describe code that no longer exists are defects — delete or rewrite them in the same slice.

## Current known state (2026-10-31)

| Doc | Source | Status |
|-----|--------|--------|
| ARCHITECTURE.md | src/game/*, package.json | Current |
| SAVE_FORMAT.md | src/game/save.ts | Current |
| CONTENT_REGISTRY.md | src/game/content.ts | Current (types partial; full GameState still in content.ts) |
| SYSTEM_MAPS.md | logic.ts + content.ts + README | Current for alpha scope |
| STYLE_GUIDE.md | AGENTS.project.md + mandate + VISUAL_STYLE_GUIDE.md | Current |
| VISUAL_STYLE_GUIDE.md | AGENTS.project.md + Farm Life pack + live realm references | Current (initial enforceable bar 2026-10-31) |
| DRUIDI_BOT_CONTRACT.md | this file + AGENTS.project.md + mandate | Current (PROCESS-001 ownership lock 2026-10-29) |
| Public changelog | src/routes/changelog.tsx | Current (CHANGELOG-003) |

## Flagged

- No `docs/DRUIDI_BOT_CONTRACT.md` existed at the start of the 2026-10-26 slice. Stub added then; elevated 2026-10-28; process ownership locked 2026-10-29.
- Full GameState type is large and lives only in content.ts; the schema docs summarize the visible parts. A complete extracted type dump would be a useful next slice.
- Public-facing changelog page maintained at /changelog. Newest first, plain language, grouped by theme, each entry links to work-order ID. History kept. East house mentioned only if relevant. Updated with 2026-10-29 process lock and modding framework entries.
- Active automation prompts (in Grok Bot app) require audit against the elevated contract (PROCESS-001).
- VISUAL_STYLE_GUIDE.md established 2026-10-31 as the living art-direction reference. Remaining realm identities (Combat, Quarry, Floor 332, Mansion) require definition before art ships.

Run this check whenever a system file is touched.
