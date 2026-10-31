# Error Handling & Resilience

**Dated:** 2026-10-30  
**Work order:** ERR-001  
**Hyper-realism check:** When something breaks, the game fails like a real product would — informatively, with a clear message, a filed defect, and recovery choices — never a white screen or silent loss.

## Coverage

- Global React ErrorBoundary (`src/components/ErrorBoundary.tsx`). Until OBS-001 (2026-10-31, in review) nothing rendered it; OBS-001 mounts it around the app in `src/routes/__root.tsx`. Catches render failures. Player sees a recoverable notice, not a blank page.
- Sentry (OBS-001, in review): `src/lib/sentry` loads `@sentry/react` only when `VITE_SENTRY_DSN` is set at build time (Vercel Production). `logError` forwards every entry. No personal data (`sendDefaultPii: false`), no tracing. Project: `xdruidi`.
- Window `error` and `unhandledrejection` listeners. No unhandled promise rejection reaches the player.
- Asset load failures in `assets.ts` already retry once then omit the sheet. Draw path uses colored pixel placeholders (material-accurate tints) instead of crashing.
- Save corruption: `listRecoveryOptions` exposes Current / Backup 1 / Backup 2 / Landmark with reasons. Correction 2026-10-31: no screen calls it yet, so the player is NOT offered a choice; the loader falls back automatically. SAVE-005 (in review) adds a dismissible alert saying what happened (see SAVE_FORMAT.md).
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

Live deployment of the boundary and Sentry (not on xdruidi.grok.me; needs owner publish and the DSN set in Vercel). Verified locally 2026-10-31 (vite preview, headless Chromium): no console errors on load; a thrown error produced one envelope request to the xdruidi ingest URL (intercepted in the test, nothing sent).

## Risks

Telemetry endpoint may be absent; defects still land in local log and console. Snapshot is deliberately partial to avoid size or circular issues.
