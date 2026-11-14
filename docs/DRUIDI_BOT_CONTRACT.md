# DRUIDI Bot Contract

**Dated:** 2026-11-05 (owner's latest explicit instruction locked; god-tier professional webmaster and hyper-realistic 2D game development bar reaffirmed and elevated)  
**Status:** Living constitution. Owner's latest explicit instruction supersedes all prior text.  
**Hyper-realism check:** This document and every process that cites it must themselves read as god-tier professional craft. The most exacting webmaster and art director must approve the workflow without reservation.

## Purpose

This file is the shared production contract that every specialist bot (Chief of Staff, Repo Engine Auditor, World & Content, Audio Lead, QA & Playtest, and all others) must read first and obey. It is the single source of truth for process, quality bar, ownership, and escalation.

## Current governing sources (in order)

1. Owner's latest explicit instruction (including this elevation).
2. This contract (`docs/DRUIDI_BOT_CONTRACT.md`).
3. `AGENTS.project.md` (vision, pillars, non-negotiable rules, asset gap policy).
4. `src/game/xdruid-mandate.ts` (brief-writing contract).
5. Verified repository state.
6. Live site https://xdruidi.grok.me.
7. Farm Life pack listing (https://sophi-x-x.itch.io/farm-life-pixel-art-pack-animated-asset-pack).

## Four locations every bot must read in full before any work

1. Knowledge base and asset stockpile (this docs/ folder + .grok/project_memory.md + AGENTS.project.md + this contract).
2. Implementation workspace and build history (the git repo itself, especially `src/game/`).
3. Live deployed build (https://xdruidi.grok.me).
4. Art pack reference (https://sophi-x-x.itch.io/farm-life-pixel-art-pack-animated-asset-pack).

## Professional standard (locked 2026-10-28, reaffirmed 2026-10-29, elevated and locked 2026-11-03, reaffirmed and elevated 2026-11-05)

All Druidi / XDruid I / Assay Homestead development must start and remain at god-tier professional webmaster and hyper-realistic 2D game development level — better than the combined output of every major studio and MMORPG team. This is non-negotiable and applies to every bot, every slice, every automation, and every human decision.

Concretely this means:

- Perfect pixel-grid integrity. Nearest-neighbor sampling only. Disciplined 16×16 density. No mixed resolutions, no smoothed scaling, no visual noise that fakes detail.
- Material-accurate response (wood, soil, stone, cloth, metal, water, leaves, food, fire each behave and sound distinctly). Wet soil differs from dry. Particles come from the pack or code-driven overlays that respect it.
- Cause-and-effect realism in every system. Realism arrives from animation timing, lighting, material response, weather, contact, persistent consequence, and readable behavior — never from unrelated high-resolution art or decorative noise.
- Version-controlled discipline, documented decisions (dated entries), test-first where feasible, no shortcuts, no half-finished slices, no placeholder text or art shipped as final, no broken links or dead systems, clean commit hygiene.
- Every system readable, testable, and persistent. A system that cannot be unit-tested, explained in the watcher, and round-tripped through a save does not ship.
- Craft that would survive scrutiny from the most demanding senior engineers and art directors in the world.

Hyper-realism is non-negotiable. If a request for "hyperrealism" would break the pixel style, keep the pixel style and state the conflict.

## Definition of done (every slice, before release-gate review) — locked 2026-10-28, enforced 2026-10-29, reaffirmed 2026-11-03, reaffirmed 2026-11-05

A slice is not done until all of the following are true:

1. Tests pass (unit, integration, or the specific tests named in the work order). No new lint errors.
2. Docs updated with dated entries in the same slice (this contract, ARCHITECTURE, SAVE_FORMAT, SYSTEM_MAPS, DOC_FRESHNESS, or the relevant file).
3. Hyper-realism check answered at the highest standard: does the change itself feel like god-tier professional craft? Would the most exacting webmaster and art director approve it without reservation? Pixel integrity, material response, timing, lighting, and persistent consequence preserved or improved.
4. Uniqueness check answered where applicable (does this advance the living homestead identity without copying protected content?).
5. No self-verification. Another bot or the owner must confirm; the implementing bot does not mark its own work complete.
6. Live site remains runnable with no console errors after the change.
7. Technical debt, if any was incurred, is filed as an explicit work-order issue (never left implicit).

## Roster operating principles

- Clear ownership. No overlapping mandates.
- Escalation paths defined (owner for licensing, destructive migrations, major restructuring; Lead Engineer for engine integrity; Art Director for style conflicts).
- Single source of truth: this contract + the verified repository state + the live site.
- Technical debt is tracked explicitly as work orders (GitHub issues labeled `tech-debt` or `hyper-realism-gap`). Never accumulate silently.

## Process ownership and audit log (locked 2026-10-29, reaffirmed and extended 2026-11-03, extended 2026-11-05)

The professional development standard is owned by the roster under this contract. Every active automation's prompt must be audited for consistency with the elevated contract. Any that fall short of webmaster/hyper-realism excellence are flagged and either updated or retired. The definition-of-done checklist above is the release gate for every slice. Technical debt is filed as work orders immediately.

- 2026-10-29: Contract reaffirmed as living constitution. DoD checklist locked and enforced. Automation prompts (resident in the owner's Grok Bot app, outside this repository) flagged for full audit against the god-tier standard. Work order PROCESS-001 filed for prompt alignment. Hyper-realism check for the development process itself: the combination of dated entries, explicit DoD, single source of truth, and explicit debt tracking would survive scrutiny from the most exacting senior engineers and art directors without reservation.
- 2026-11-03: Restored after accidental truncation to empty in ERR-001 (commit 170bd50). Owner's latest elevation of the god-tier bar (perfect pixel-grid, nearest-neighbor only, disciplined 16x16 density, material-accurate response, cause-and-effect realism, version-controlled discipline, documented decisions, test-first, no shortcuts, no half-finished slices, no placeholders shipped as final, clean commit hygiene, craft that survives scrutiny from the most demanding senior engineers and art directors) is locked. DoD checklist reaffirmed as the release gate. Automation audit remains open under PROCESS-001. Hyper-realism check for the development process itself: yes — restoring the constitution, dating the elevation, enforcing the DoD, and tracking the accidental empty as explicit debt produces a workflow that the most exacting webmaster and art director would approve without reservation.
- 2026-11-05: Owner's latest explicit instruction reaffirms and elevates the god-tier professional webmaster and hyper-realistic 2D game development standard (perfect pixel-grid integrity, nearest-neighbor only, disciplined 16x16 density, material-accurate response, cause-and-effect realism, version-controlled discipline, documented decisions, test-first where feasible, no shortcuts, no half-finished slices, no placeholders as final, clean commit hygiene, craft surviving scrutiny from the most demanding senior engineers and art directors). Process ownership, DoD checklist, and roster principles locked. Hyper-realism check for the development process itself: yes — the living constitution, dated entries, explicit DoD as release gate, single source of truth, and explicit debt tracking produce a workflow the most exacting webmaster and art director would approve without reservation. Automation audit (PROCESS-001) remains open; prompts in the owner's Grok Bot app must be reviewed for consistency.

## Report format (for every slice)

Work order ID  
Files changed  
Contract updates with dated entries  
Audits performed  
Tests  
Acceptance criteria pass/fail  
Unverified items  
Risks  
ONE next slice  
No self-verification.

## Freshness

Update this contract whenever a new mandate, lane, or rule is added. Date every entry. Flag stale sections in DOC_FRESHNESS.md.

## 2026-10-29 — Modding & extensibility framework (MOD-001)

The extension contract is now live. New content is added by dropping typed definition files into the registry without touching engine code. Sandbox prevents broken mods from corrupting saves or crashing the simulation. API is versioned so old mods keep working. Documented in docs/MODDING.md. Hyper-realism check: a non-engineer can add one new crop by following the docs.

## 2026-11-11 — Creature memory and bonding (MEMORY-001)

Individual animals retain typed persistent memory across sessions. Bond emerges from repeated interaction. Schema lives on Animal and cat. Ensure function migrates old saves. Visible behavioral influence required. Hyper-realism check: a real farmer would notice the difference. No menu toggle.

## 2026-11-13 — Public changelog maintenance (CHANGELOG-005)

The public-facing changelog page remains the visible proof of continuous development. Dated entries in plain language, grouped by theme, newest first, each linking to its work-order ID, are kept in the public source. History is never removed. The east house is mentioned only when relevant. Publication to the live yard at https://xdruidi.grok.me/changelog awaits the owner; the address currently returns Not Found. Hyper-realism check: a returning visitor reading the public source sees immediately what has changed.

## 2026-11-14 — Knowledge base ownership and freshness (DOCS-001)

Docs/ is maintained as the complete, current knowledge base. Architecture overview, system maps, content registry schema reference, save format spec, extension API docs, style guide cross-links, and plain-English README are current. Doc-freshness check performed and updated. Hyper-realism check: a new developer reading the docs folder alone can understand the whole game in one afternoon. No docs describe code that no longer exists.

## 2026-11-14 — Release management (REL-001)

Semantic versioning (MAJOR.MINOR.PATCH) is established and tied to the contract's milestone definitions. Automated release notes are generated from the day's work orders and changelog entries. Version tags in the repo and a VERSION file the game reads at runtime for display in the HUD or main menu. Release archive via git tags so any prior version can be rebuilt. Version bumps happen only on successful gated deploys (coordinate with Build Pipeline). Public roadmap reflects committed versus aspirational work without overpromising. Documented in docs/RELEASE_MANAGEMENT.md and docs/ROADMAP.md. Hyper-realism check: a player or journalist looking at the version number and release notes can trust them as accurate for the public source.
