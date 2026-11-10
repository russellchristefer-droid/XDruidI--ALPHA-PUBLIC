# Release Management

**Dated:** 2026-11-10 (REL-001)
**Hyper-realism check:** A player or journalist looking at the version number and release notes can trust them as accurate. Notes contain only verified, dated work-order outcomes. No aspirational claims are presented as shipped.

## Semantic versioning

Format: MAJOR.MINOR.PATCH (SemVer).

- MAJOR: breaking change to save format, public API, or fundamental homestead rules that would invalidate existing saves without an explicit migration.
- MINOR: new systems, content, or capabilities that are backward-compatible with existing saves (additive ensure* functions, new portals, new skills).
- PATCH: bug fixes, documentation, performance, or small polish that do not change behavior contracts.

Current version: **0.1.0** (Alpha). Pre-versioning history lives in the public changelog and git history.

Versions are tied to the milestone definitions in docs/DRUIDI_BOT_CONTRACT.md. A version bump occurs only after a successful gated deploy (CI green + owner publish to the live host).

## Files kept in sync

- `VERSION` (plain text, single line) — source of truth for the number.
- `package.json` "version" field.
- `src/game/version.ts` — exported constant the game reads at runtime for display in the HUD or main menu.

## Release notes

Generated from the day's completed work orders and the entries already present in `src/routes/changelog.tsx`. Notes stay in plain language, newest first, grouped by theme, each linking to the work-order ID. History is never removed.

## Version tags and rebuild archive

Every released version is tagged in the repository (`v0.1.0`, etc.). The tag points at the exact commit that was gated and published. Source at that tag, plus the locked package-lock (when present), is sufficient to rebuild the prior version. No binary artifacts are stored; the live host serves the published build.

## Coordination with the build pipeline

Version bumps happen only on successful gated deploys. The CI workflow (CI-001) must be green. The owner publishes to the live host (xdruidi.grok.me). Only then is the VERSION file, package.json, and version.ts advanced and a tag created.

## Public roadmap

See docs/ROADMAP.md. Committed work is what is already in the changelog or an accepted work order. Aspirational work is drawn from AGENTS.project.md pillars and is explicitly marked as such. Nothing is promised that has not been scheduled.
