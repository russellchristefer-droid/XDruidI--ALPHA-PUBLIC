# Release Management — XDruid I / Assay Homestead

**Dated:** 2026-11-14  
**Work order:** REL-001  
**Status:** Living. Version numbers and release notes must be accurate enough that a player or journalist can trust them.  
**Hyper-realism check:** A senior release engineer at a major studio would approve this process. Semantic versions map to contract milestones. Notes are generated from work orders and changelog. Bumps happen only after green gated deploys. The roadmap distinguishes committed from aspirational without overpromising.

## Semantic versioning (MAJOR.MINOR.PATCH)

Tied to the contract's milestone definitions in DRUIDI_BOT_CONTRACT.md and AGENTS.project.md.

- **0.x.y-alpha**: Current stage. Persistent homestead, needs, autonomy, animals with memory, portals, local save, public docs and changelog in source. Live yard at https://xdruidi.grok.me is the player-facing surface (served from the Grok project host, not this public repo).
- **1.0.0**: First stable when the definition of done for a full living homestead (readable, testable, persistent systems for farming, animals, magic, survival, and one complete portal land) is met on the live yard, with no known data-loss bugs, and the public changelog is published.
- MAJOR: breaking save format, engine rewrite, or pillar change that requires owner approval.
- MINOR: new systems that ship to live (e.g., full animal bonding visible, new realm).
- PATCH: fixes, docs, process, non-breaking improvements.

Current: 0.1.0-alpha (established 2026-11-14).

## Automated release notes

Generated from the day's work-order IDs and changelog entries in src/routes/changelog.tsx.  
Script: scripts/generate-release-notes.mjs (reads VERSION, recent commits or a CHANGELOG.md fragment, produces notes).  
Notes must be plain language, newest first, grouped by theme, link to work-order IDs. Never remove history. East house mentioned only when relevant.

## Version tags and archive

- Tags: vMAJOR.MINOR.PATCH (e.g. v0.1.0-alpha) created only after successful gated deploy (see BUILD_PIPELINE.md).  
- Release archive: git tags + source tree allow any prior version to be rebuilt with `git checkout vX.Y.Z && npm ci && npm run build:ci`.  
- No binary artifacts committed; rebuild from source is the archive.

## Coordination with Build Pipeline

Version bumps happen only on successful gated deploys (CI green on the exact SHA, platform deploy of that SHA). See docs/BUILD_PIPELINE.md. Manual version edits without a green deploy are forbidden. The VERSION file is updated in the same commit as the notes when a bump is authorized.

## Runtime display

The game reads VERSION at runtime (import or fetch of /VERSION) and displays it in the HUD or main menu (e.g. "XDruid I · 0.1.0-alpha"). Implementation is a thin read in src/game or a React component; placeholder until wired.

## Public roadmap

See docs/ROADMAP.md. Committed work is what is in the current alpha scope and recent work orders that have landed in source. Aspirational is marked clearly and not promised for any date.

## Freshness

Update this document and VERSION in the same slice as any version bump or process change. Flag stale sections in DOC_FRESHNESS.md.
