# Error Handling & Resilience

**Dated:** 2026-10-30  
**Work order:** ERR-001  
**Hyper-realism check:** When something breaks, the game fails like a real product would — informatively, with a clear message, a filed defect, and recovery choices — never a white screen or silent loss.

## Coverage

- Global React ErrorBoundary (`src/components/ErrorBoundary.tsx`) wraps the yard. Catches render and logic failures. Player sees a recoverable notice, not a blank page.
- Window `error` and `unhandledrejection` listeners. No unhandled promise rejection reaches the player.
- Asset load failures in `assets.ts` already retry once then omit the sheet. Draw path uses colored pixel placeholders (material-accurate tints) instead of crashing.
- Save corruption: `listRecoveryOptions` exposes Current / Backup 1 / Backup 2 / Landmark with reasons. Player is offered an explicit choice rather than silent new-game or fail.
- Structured log (`src/game/errorLog.ts`): stack, safe state snapshot (position, wing, pack length, rng), context, UA, URL. Stored locally (last 50). Every entry automatically files a defect via telemetry `failure` event.

## Paths covered

- React render throw
- Logic throw inside step / interact
- Image onerror / timeout
- JSON parse / checksum / shape failure on load
- localStorage quota / private mode
- Unhandled promise rejection

## Tests

Unit: errorLog.safeSnapshot does not throw on partial state. Recovery list includes invalid entries with reason. Boundary renders fallback. (See errorLog.test.ts once added.)

## Unverified

Live deployment of the new boundary and recovery UI. Console after forced throw.

## Risks

Telemetry endpoint may be absent; defects still land in local log and console. Snapshot is deliberately partial to avoid size or circular issues.
