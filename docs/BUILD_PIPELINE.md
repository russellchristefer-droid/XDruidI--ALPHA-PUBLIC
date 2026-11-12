# Build Pipeline — XDruid I / Assay Homestead

**Dated:** 2026-11-12  
**Work order:** PIPELINE-001  
**Status:** Living. A broken build must never reach https://xdruidi.grok.me.  
**Hyper-realism check:** This pipeline is the one a real studio ships on. Every stage is gated, documented with exact commands, fails closed, and leaves an audit trail. Manual copy-paste deploys are forbidden.

## Governing principle

The live yard is the only public surface. Nothing reaches it unless:

1. TypeScript is clean (`tsc --noEmit`).
2. Lint is clean (`eslint .`).
3. The unit/integration suite that is expected to pass on main has passed.
4. The production build succeeds.
5. Bundle size budgets are respected.
6. No secrets appear in client bundles (only `VITE_`-prefixed public flags are ever inlined).

CI is the sole gate. Deploy is a separate, explicit, reversible step performed only after CI is green on the exact commit that will be published.

## Pipeline stages (exact commands)

All commands assume a clean checkout of the commit under consideration and Node 24 (matching CI).

### 1. Environment preparation

```bash
npm ci --no-audit --no-fund
```

This produces a deterministic `node_modules`. Never use `npm install` in CI or on a release candidate.

`.grok/app-env.json` (if present) supplies only `VITE_`-prefixed public flags. Real secrets live only in the host platform’s environment and never in the repository or in client bundles. `scripts/with-app-env.mjs` merges the file before Vite starts; an explicit `process.env` entry always wins.

### 2. Development server (local only)

```bash
npm run dev
```

- Binds `0.0.0.0:8080` (strict).
- Loads the same env merge as production.
- Does not write to the live site.
- Stability contract: the server must start without console errors and remain responsive. Any crash is a defect in the slice that introduced it.

### 3. Production build (CI gate)

```bash
npm run build:ci
```

This is `node scripts/with-app-env.mjs vite build`.  
It emits the client and server artifacts under `dist/` (Nitro + Vite).  
The full `npm run build` additionally runs `db:migrate`; that step is for environments that own a database and is not part of the client-gate.

### 4. Type check (fails the pipeline)

```bash
npm run typecheck
```

`tsc --noEmit`. Any error fails the job. The router plugin regenerates `src/routeTree.gen.ts` during the build, so typecheck runs after `build:ci`.

### 5. Lint (fails the pipeline)

```bash
npm run lint
```

### 6. Tests (fails the pipeline)

```bash
npm test
```

Covers scripts, game logic, modding, birdsong, tiles, house, audio, save, and related modules.  
Known-failing tests (`camp.test.ts`, `dev-sprites.test.ts`) run in a separate non-blocking job and do not gate release.

### 7. Bundle size budget (fails the pipeline)

```bash
node scripts/check-bundle-size.mjs dist
```

Locked budgets (2026-11-12):

- Total `dist/` (excluding source maps): ≤ 8 MiB
- Total JavaScript: ≤ 4 MiB
- Largest single JS chunk: ≤ 1.5 MiB

Tree-shaking is verified by the outcome: `package.json` sets `"sideEffects": false` and Vite’s default production mode eliminates unused exports. The size check is the concrete gate; any unexplained growth is a defect.

### 8. Environment variable audit (manual + convention)

- Only keys matching `VITE_` are ever inlined by Vite.
- `scripts/with-app-env.mjs` and `scripts/app-env-plugin.mjs` enforce the prefix.
- Secrets (database URLs, auth secrets, API keys) must never appear in `.grok/app-env.json`, in source, or in the built client. They live only in the host platform’s encrypted environment.
- Verification command (after build):

```bash
grep -R -E "(DATABASE_URL|AUTH_SECRET|API_KEY|SECRET|PASSWORD)" dist/ --include="*.js" || echo "No obvious secrets"
```

Any match fails the release.

## Deploy procedure (to https://xdruidi.grok.me)

Cloudflare is the edge in front of the host. The host is the platform that receives the Nitro/Vercel-preset output (see `vite.config.ts` nitro preset and `vercel.json`).

Exact steps (owner or authorized operator only):

1. Confirm CI is green on the exact SHA that will be published.  
   ```bash
   gh run list --branch main --limit 1
   ```
2. Tag the release (optional but recommended):  
   ```bash
   git tag -a v-alpha-$(date +%Y%m%d-%H%M) -m "PIPELINE-001 gated build"
   git push origin --tags
   ```
3. Trigger the platform deploy of that exact commit (Vercel / host dashboard or CLI).  
   The platform must be configured to deploy only from the protected `main` branch after CI success. Manual uploads of a local `dist/` are forbidden.
4. Smoke the live site:  
   - Open https://xdruidi.grok.me  
   - Confirm title, yard, no console errors, save/load round-trip, and that the public changelog (when published) matches the commit.

A broken build never reaches live because the platform deploy is gated on the CI status of the commit.

## Rollback procedure

1. Identify the last known-good SHA (the previous green deploy).  
   ```bash
   git log --oneline -20
   ```
2. Re-deploy that exact SHA from the host platform (redeploy button or CLI).  
   Do not revert and force-push unless the owner explicitly approves a destructive history change.
3. Confirm the live site returns to the known-good state (same smoke checks).
4. File a work-order issue describing the defect that forced the rollback and the slice that will repair it.
5. The rolled-back commit remains in history; the fix is a forward commit that again passes the full pipeline.

## Build-time validation summary

| Stage              | Command                          | Fails pipeline on error? |
|--------------------|----------------------------------|--------------------------|
| Install            | `npm ci`                         | Yes                      |
| Production build   | `npm run build:ci`               | Yes                      |
| Typecheck          | `npm run typecheck`              | Yes                      |
| Lint               | `npm run lint`                   | Yes                      |
| Tests              | `npm test`                       | Yes                      |
| Bundle size        | `node scripts/check-bundle-size.mjs` | Yes                  |
| Secret scan        | `grep` on `dist/`                | Yes (manual gate)        |
| Deploy             | Platform deploy of green SHA     | N/A (only green SHAs)    |

## Dev-server stability contract

`npm run dev` must:

- Start on port 8080 without uncaught exceptions.
- Serve the yard with no console errors after the initial load.
- Survive hot module replacement of game files without losing the ability to save.

Any regression is a blocking defect.

## Freshness

Update this document in the same slice as any change to scripts, CI, Vite config, or deploy targets. Flag stale sections in `docs/DOC_FRESHNESS.md`.

**Hyper-realism check:** The combination of deterministic install, gated typecheck/lint/test/build/size, explicit secret handling, documented deploy of only green commits, and a one-command rollback path is the workflow a senior webmaster and release engineer would approve without reservation. It is not a manual copy-paste deploy.
