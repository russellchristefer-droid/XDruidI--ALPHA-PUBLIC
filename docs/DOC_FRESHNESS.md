# Doc Freshness Check

**Dated:** 2026-11-22  
**Purpose:** Flag any section whose code has diverged.

## How to check

1. Compare each docs/*.md "Source of truth" line against the actual file.
2. If a constant, type, key, or ensure* list differs, mark the doc stale.
3. Docs that describe code that no longer exists are defects — delete or rewrite them in the same slice.

## Current known state (2026-11-22)

| Doc | Source | Status |
|-----|--------|--------|
| ARCHITECTURE.md | src/game/*, package.json | Current |
| SAVE_FORMAT.md | src/game/save.ts | Current (includes MEMORY-001 additive) |
| CONTENT_REGISTRY.md | src/game/content.ts | Current (types partial; full GameState still in content.ts) |
| SYSTEM_MAPS.md | logic.ts + content.ts + README | Current for alpha scope |
| STYLE_GUIDE.md | AGENTS.project.md + mandate + VISUAL_STYLE_GUIDE.md | Current |
| VISUAL_STYLE_GUIDE.md | AGENTS.project.md + Farm Life pack + live realm references | Current (initial enforceable bar 2026-10-31) |
| DRUIDI_BOT_CONTRACT.md | this file + AGENTS.project.md + mandate | Current (elevations through 2026-11-22, PROCESS-005) |
| Public changelog | src/routes/changelog.tsx | Current (CHANGELOG series through 2026-11-19; live /changelog still Not Found pending owner publish) |
| CI | .github/workflows/ci.yml, package.json scripts | Current (CI-001, 2026-10-31) |
| BUILD_PIPELINE.md | package.json scripts, .github/workflows/ci.yml, scripts/check-bundle-size.mjs, vite.config.ts | Current (PIPELINE-001) |
| MODDING.md / EXTENSION_API.md | src/game/modding.ts | Current |
| .grok/project_memory.md | historical notes | Stale for current alpha (describes prior Three.js / private-repo prototype; not authoritative for XDruidI canvas engine) |

## Flagged

- No `docs/DRUIDI_BOT_CONTRACT.md` existed at the start of the 2026-10-26 slice. Stub added then; elevated 2026-10-28; process ownership locked 2026-10-29. Accidentally emptied in ERR-001 (170bd50, 2026-10-30); restored and re-elevated in PROCESS-002 (2026-11-03). Elevated again in PROCESS-003 (2026-11-05). Reaffirmed and elevated PROCESS-005 (2026-11-22).
- Full GameState type is large and lives only in content.ts; the schema docs summarize the visible parts. A complete extracted type dump would be a useful next slice.
- Public-facing changelog page maintained at /changelog in source. Newest first, plain language, grouped by theme, each entry links to work-order ID. History kept. East house mentioned only if relevant. Live yard at xdruidi.grok.me/changelog still returns Not Found; publication awaits the owner.
- Active automation prompts (in Grok Bot app) require audit against the elevated contract (PROCESS-001 remains open).
- VISUAL_STYLE_GUIDE.md established 2026-10-31 as the living art-direction reference. Remaining realm identities (Combat, Quarry, Floor 332, Mansion) require definition before art ships.
- `.grok/project_memory.md` retains 2026-09 notes about a prior Three.js prototype and private repo. It is historical; the living knowledge base is docs/ + AGENTS.project.md + src/game/ for the current canvas alpha. Do not treat it as current system truth.

- CI-001 (2026-10-31): `npm test` covers scripts + logic, modding, birdsong, tiles, house, audio. `camp.test.ts` and `dev-sprites.test.ts` already fail on main and run in a non-blocking job (`npm run test:known-failing`) until fixed.

Run this check whenever a system file is touched.

## 2026-11-12 — PIPELINE-001

| Doc | Source | Status |
|-----|--------|--------|
| BUILD_PIPELINE.md | package.json scripts, .github/workflows/ci.yml, scripts/check-bundle-size.mjs, vite.config.ts | Current (PIPELINE-001) |

CI now fails on bundle size budget exceedance. Deploy remains gated to green commits only. Rollback procedure documented.

## 2026-11-14 — DOCS-001

Knowledge base refreshed. README, DOC_FRESHNESS, and cross-links updated to match verified repository state and live site. Hyper-realism check passed: a new developer reading docs/ alone can understand the whole game (stack, architecture, save contract, content model, extension path, vision, and current alpha scope including CreatureMemory) in one afternoon. No stale sections describing non-existent code. Full GameState dump remains a useful future slice.

## 2026-11-19 — DOCS-002

Four locations read in full (docs/ + AGENTS.project.md + contract, repo especially src/game/, live https://xdruidi.grok.me, Farm Life pack listing). Constants, types, save envelope, extension API, and system maps match source. Hyper-realism check: yes — a new developer can understand the whole current alpha (architecture, systems, content registry, save format, extension path, style, roadmap, non-negotiables) from docs/ alone in one afternoon. `.grok/project_memory.md` flagged as historical. No docs describe code that no longer exists. Live changelog remains unpublished (Not Found).

## 2026-11-20 — DOCS-003

Four locations read in full (docs/ + AGENTS.project.md + contract, repo especially src/game/, live https://xdruidi.grok.me, Farm Life pack listing). Constants, types, save envelope (FNV-1a, version 1, pack length 28, ensure* including ensureCreatureMemory), extension API, and system maps match source. Hyper-realism check: yes — a new developer reading docs/ alone can understand the whole game (stack, architecture, save contract, content model, extension path, vision, current alpha scope including CreatureMemory and portals) in one afternoon. No docs describe code that no longer exists. Live changelog remains unpublished (Not Found). Full GameState dump remains a useful future slice.

## 2026-11-22 — PROCESS-005

Contract updated with dated elevation of process ownership and four-location mandate. Hyper-realism check for the development process itself: yes. DOC_FRESHNESS updated in the same slice. No other docs diverged.

## 2026-11-22 — DOCS-004

Four locations read in full before work (knowledge base docs/ + AGENTS.project.md + contract + historical .grok/project_memory.md; implementation workspace git repo especially src/game/; live deployed build https://xdruidi.grok.me showing ONE YARD with pack and Floor; Farm Life pack listing matching gap policy). All living docs match verified source. Hyper-realism check: yes — a new developer can understand the whole game (architecture, system maps, content registry, save format, extension API, style guides, plain-English README, non-negotiables, current alpha scope) from docs/ alone in one afternoon. No docs describe code that no longer exists. Live /changelog remains Not Found pending owner publish. Full GameState type dump remains a useful next slice.
