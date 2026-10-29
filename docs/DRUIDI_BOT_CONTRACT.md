# DRUIDI Bot Contract

**Dated:** 2026-10-29 (process ownership locked; elevated standard of 2026-10-28 retained)  
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

## Professional standard (locked 2026-10-28, reaffirmed 2026-10-29)

All Druidi / XDruid I / Assay Homestead development must start and remain at god-tier professional webmaster and hyper-realistic 2D game development level — better than the combined output of every major studio and MMORPG team. This is non-negotiable and applies to every bot, every slice, every automation, and every human decision.

Concretely this means:

- Perfect pixel-grid integrity. Nearest-neighbor sampling only. Disciplined 16×16 density. No mixed resolutions, no smoothed scaling, no visual noise that fakes detail.
- Material-accurate response (wood, soil, stone, cloth, metal, water, leaves, food, fire each behave and sound distinctly). Wet soil differs from dry. Particles come from the pack or code-driven overlays that respect it.
- Cause-and-effect realism in every system. Realism arrives from animation timing, lighting, material response, weather, contact, persistent consequence, and readable behavior — never from unrelated high-resolution art or decorative noise.
- Version-controlled discipline, documented decisions (dated entries), test-first where feasible, no shortcuts, no half-finished slices, no placeholder text or art shipped as final, no broken links or dead systems, clean commit hygiene.
- Every system readable, testable, and persistent. A system that cannot be unit-tested, explained in the watcher, and round-tripped through a save does not ship.
- Craft that would survive scrutiny from the most demanding senior engineers and art directors in the world.

Hyper-realism is non-negotiable. If a request for "hyperrealism" would break the pixel style, keep the pixel style and state the conflict.

## Definition of done (every slice, before release-gate review) — locked 2026-10-28, enforced 2026-10-29

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

## Process ownership and audit log (locked 2026-10-29)

The professional development standard is owned by the roster under this contract. Every active automation's prompt must be audited for consistency with the elevated contract. Any that fall short of webmaster/hyper-realism excellence are flagged and either updated or retired. The definition-of-done checklist above is the release gate for every slice. Technical debt is filed as work orders immediately.

- 2026-10-29: Contract reaffirmed as living constitution. DoD checklist locked and enforced. Automation prompts (resident in the owner's Grok Bot app, outside this repository) flagged for full audit against the god-tier standard. Work order PROCESS-001 filed for prompt alignment. Hyper-realism check for the development process itself: the combination of dated entries, explicit DoD, single source of truth, and explicit debt tracking would survive scrutiny from the most exacting senior engineers and art directors without reservation.

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
