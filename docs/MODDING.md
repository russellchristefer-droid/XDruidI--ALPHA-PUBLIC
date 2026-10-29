# XDruid I Extension Contract

**Dated:** 2026-10-29  
**API Version:** 1  
**Status:** Stable. Old mods continue to work as the engine evolves via version adapters.  
**Hyper-realism check:** This is the infrastructure a real studio ships so the game can grow forever without rewrite. A non-engineer can add one new crop by following this document alone.

## What a mod author must provide

A single typed definition file (JSON) dropped into the registry. No engine code changes.

Supported kinds in v1:

- Crop
- Creature
- Item
- Realm
- Ritual
- Sound

Every definition must include `"apiVersion": 1`.

### Crop example (the one a non-engineer adds)

```json
{
  "apiVersion": 1,
  "id": "pumpkin",
  "name": "Pumpkin",
  "stages": 5,
  "growthSeconds": 120,
  "waterRequired": true,
  "wiltSeconds": 180,
  "productDefId": "pumpkin",
  "seedDefId": "seed_pumpkin",
  "icon": { "sheet": "veg", "x": 64, "y": 32, "w": 32, "h": 32 },
  "blurb": "Heavy autumn fruit. Needs water. Harvests into the pack."
}
```

Place the file at `mods/crops/pumpkin.json` (or any path the loader watches). The engine loads it at startup.

## What is validated

- `apiVersion` matches current (or has an adapter)
- `id` is unique, lowercase snake_case, starts with a letter
- Required fields present and in range (stages 1-8, positive numbers, referenced product/seed exist or will be registered)
- Icon sheet is known or allowed
- No reserved core ids overwritten (tomato, cabbage, greens, cow, etc. are protected)

Invalid definitions are rejected with a list of errors.

## What fails gracefully

- Broken JSON → mod quarantined, reason logged, simulation continues with base content
- Missing referenced item → warning, crop registered but planting will report "unknown product"
- Sandbox: pure data only. No executable code in definition files. Load is wrapped so a throw cannot corrupt GameState or localStorage
- Bad mod never touches the save format or existing plots/animals

## Versioning

`EXTENSION_API_VERSION = 1` in `src/game/modding.ts`.

Mods declare the version they were written against. The registry refuses unknown versions with a clear error. Future versions will ship adapters so v1 mods keep loading.

## Exact API signatures (engine side)

```ts
export const EXTENSION_API_VERSION = 1;

export function registerCrop(def: CropDefinition): ValidationResult;
export function getCrop(id: string): CropDefinition | undefined;
export function allCrops(): CropDefinition[];

// identical pattern for Creature, Item, Realm, Ritual, Sound

export function loadDefinitionFile(raw: string, modId: string): ValidationResult;

export const registry: ContentRegistry;
```

See `src/game/modding.ts` for the full TypeScript interfaces.

## Sandbox guarantee

A broken mod cannot:
- Corrupt a save (no write access to persistence)
- Crash the simulation (load and registration are try/caught; bad mods are skipped)
- Overwrite core definitions
- Execute arbitrary code (data-only definitions)

## How the engine uses it

Base content in `content.ts` is loaded into the registry at startup. Mods are loaded after. Lookups in `logic.ts` and `draw.ts` prefer the registry. Unknown ids fall back to base behavior or a safe "unknown" state.

## Freshness

Update this contract in the same slice as any API change. Date the entry.
