# Content Registry Schema Reference

**Dated:** 2026-10-26  
**Source:** `src/game/content.ts` (DEFS, types, world constants)

## Core types

```ts
type Def = {
  id: string;
  name: string;
  kind: "tool" | "food" | "seed" | "resource" | "product" | "container" | "note" | "coin" | "kit" | "wear";
  weight: number;
  floor: number;          // durability / value
  quality: number;
  stack: boolean;
  tool?: ToolId;          // "water" | "shovel" | "scythe" | "axe" | "hammer" | "rod"
  equip?: EquipSlot;      // head | torso | legs | feet | hands | amulet | ring | belt | container | offhand
  stamina?: number;
  waterMax?: number;
  icon: IconRef;          // { sheet, x, y, w, h }
  crop?: CropId;          // "tomato" | "cabbage" | "greens"
  blurb: string;
};

type Item = {
  id: string;
  defId: string;
  qty: number;
  quality: number;
  floor: number;
  floorMax: number;
  water?: number;
  noteOf?: string;
  contents?: (Item | null)[];  // nested for containers
};

type Plot = { id, kind: "bed"|"extra", name, x, y, w, h, crop, stage, watered, wilt, tilled, revealed };
type Animal = { id, kind: "cow"|"rooster"|"goat"|"sow", name, x, y, dir, fed, ready, tx, ty, pause, route?, intent? };
type Flower = { id, name, row, x, y, w, h, bloom, grow };
```

## Registry

`export const DEFS: Record<string, Def>` — the single source of item definitions.  
Fish and extra rods are generated at module load and added to DEFS and POND_FISH.

## Spatial constants

BEDS (three soil rectangles), MAGIC_PLOT, HERD_HOME, CAT_HOME, GOAT_PEN, FARM_START, FARMER_HOME, MEADOW, etc.  
All coordinates are pixel positions on the 347×960 world.

## Extension

New content must be added as data in DEFS (or generated the same way fish are). Do not bury literals in logic.ts. Stable string IDs. Validate references exist.

## Gaps

Farm Life pack does not contain winter tiles, interiors, livestock beyond the listed animals, clothing sprites, magic effects, or audio. Follow the gap policy in AGENTS.project.md §3.
