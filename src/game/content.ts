import { tileBlocks } from "./tiles.ts";
import { realmPlateSolid } from "./realmFeet.ts";
export const WORLD_W = 347;
export const WORLD_H = 960;
/** The frame that fits on screen. The yard stays this size; the meadow is below it. */
export const VIEW_W = 347;
export const VIEW_H = 194;
/** South of the new field. Under this line is the void. */
export const MEADOW = { x: 0, y: 528, w: 347, h: 432 } as const;
/** Courtyard starts. Spread so the herd, the cat, and the farmer do not share a tile. */
/** Center of the courtyard, on the seal. */
export const FARMER_HOME = { x: 172, y: 380 } as const;
/** Where a game opens: the path on the upper farmland, not the courtyard or another realm. */
export const FARM_START = { x: 180, y: 140 } as const;

/** The courtyard stone. This is the only plot where magic skill is trained. */
export const MAGIC_PLOT = { x: 16, y: 232, w: 316, h: 288 } as const;

export function onMagicPlot(x: number, y: number, wing: number): boolean {
  if (wing !== 0) return false;
  return x >= MAGIC_PLOT.x && x < MAGIC_PLOT.x + MAGIC_PLOT.w && y >= MAGIC_PLOT.y && y < MAGIC_PLOT.y + MAGIC_PLOT.h;
}
export const HERD_HOME = {
  cow: { x: 174, y: 210 },
  rooster: { x: 112, y: 344 },
  goat: { x: 268, y: 92 },
} as const;
export const CAT_HOME = { x: 248, y: 212 } as const;
/** Masked wizard. Courtyard guest, not stacked on the herd. */
export const REAPER_HOME = { x: 188, y: 412 } as const;
/** Second farmer. Works the beds north of the fence. */
export const HAND_HOME = { x: 56, y: 150 } as const;
/** 7×3 tiles on the upper farm. The goat stays inside this patch. */
export const GOAT_PEN = { x: 240, y: 80, w: 56, h: 24 } as const;
export const TILE = 8;
/** Every player sheet is 80×112 cells, three rows, feet on y=95. */
export const CHAR_W = 80;
export const CHAR_H = 112;
export const CHAR_FOOT_Y = 95;
export const PACK_SLOTS = 28;
export const VAULT_SLOTS = 40;
export const MASS_CAP = 21;
export const MASS_RUN = 16;
export const DAY_SECONDS = 90;
export const SAVE_KEY = "assay-homestead-v2";

export type Dir = "s" | "n" | "e" | "w";
export type CropId = "tomato" | "cabbage" | "greens";
export type ToolId = "water" | "shovel" | "scythe" | "axe" | "hammer" | "rod";

export type IconRef = { sheet: string; x: number; y: number; w: number; h: number };

export type EquipSlot = "head" | "torso" | "legs" | "feet" | "hands" | "amulet" | "ring" | "belt" | "container" | "offhand";

export type Def = {
  id: string;
  name: string;
  kind: "tool" | "food" | "seed" | "resource" | "product" | "container" | "note" | "coin" | "kit" | "wear";
  weight: number;
  floor: number;
  quality: number;
  stack: boolean;
  tool?: ToolId;
  equip?: EquipSlot;
  stamina?: number;
  waterMax?: number;
  icon: IconRef;
  crop?: CropId;
  blurb: string;
};

const T = (x: number, y: number): IconRef => ({ sheet: "tools", x, y, w: 32, h: 32 });
const V = (x: number, y: number): IconRef => ({ sheet: "veg", x, y, w: 32, h: 32 });
const C = (x: number, y: number): IconRef => ({ sheet: "cooked", x, y, w: 32, h: 32 });
const R = (x: number, y: number): IconRef => ({ sheet: "res", x, y, w: 16, h: 16 });

const FISH_ROWS: ReadonlyArray<readonly [number, number]> = [
  [3, 28],
  [36, 58],
  [68, 91],
  [99, 124],
  [131, 155],
  [163, 188],
  [195, 220],
  [228, 251],
  [259, 285],
  [294, 315],
  [329, 343],
];
const FISH_COLS: ReadonlyArray<readonly [number, number]> = [
  [3, 28],
  [36, 60],
  [68, 91],
  [99, 124],
  [131, 156],
  [163, 188],
  [195, 220],
  [227, 253],
  [259, 285],
  [291, 316],
];

function fishIcon(ri: number, ci: number): IconRef {
  const [x0, x1] = FISH_COLS[ci]!;
  const [y0, y1] = FISH_ROWS[ri]!;
  return { sheet: "fish", x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Thin poles on the first row of the sheet. The rest of the cells are the catch. */
const ROD_AT: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [0, 6],
];
const FISH_AT: Array<readonly [number, number]> = [];
for (let ri = 0; ri < FISH_ROWS.length; ri++) {
  for (let ci = 0; ci < FISH_COLS.length; ci++) {
    if (ri === 10 && ci > 0) continue;
    if (ri === 0 && ci <= 6) continue;
    FISH_AT.push([ri, ci]);
  }
}

const FISH_NAMES = [
  "Gold carp",
  "Copper trout",
  "Green perch",
  "Blue dart",
  "Red snapper",
  "Violet eel",
  "Silver bream",
  "Amber fish",
  "Moss bass",
  "Dusk fish",
];

export function isFishId(id: string): boolean {
  return id === "fish" || id.startsWith("fish_");
}

export const DEFS: Record<string, Def> = {
  can: {
    id: "can",
    name: "Watering can",
    kind: "tool",
    weight: 2.2,
    floor: 18,
    quality: 52,
    stack: false,
    tool: "water",
    waterMax: 8,
    icon: T(32, 32),
    blurb: "Fills at the well or the pond. Each pour shaves Floor.",
  },
  fine_can: {
    id: "fine_can",
    name: "Fine watering can",
    kind: "tool",
    weight: 1.8,
    floor: 36,
    quality: 78,
    stack: false,
    tool: "water",
    waterMax: 14,
    icon: T(32, 32),
    blurb: "Lighter, holds more, still spends Floor when it pours.",
  },
  shovel: {
    id: "shovel",
    name: "Shovel",
    kind: "tool",
    weight: 2.0,
    floor: 16,
    quality: 48,
    stack: false,
    tool: "shovel",
    icon: T(96, 0),
    blurb: "Tills the marked dirt beside the beds. Does not move the yard.",
  },
  scythe: {
    id: "scythe",
    name: "Scythe",
    kind: "tool",
    weight: 1.6,
    floor: 14,
    quality: 45,
    stack: false,
    tool: "scythe",
    icon: T(64, 0),
    blurb: "Harvests a ready plant or clears a spent one. Icon is the pack blade.",
  },
  axe: {
    id: "axe",
    name: "Axe",
    kind: "tool",
    weight: 2.4,
    floor: 20,
    quality: 50,
    stack: false,
    tool: "axe",
    icon: T(0, 32),
    blurb: "Only marked branches. The perimeter trees stay.",
  },
  hammer: {
    id: "hammer",
    name: "Hammer",
    kind: "tool",
    weight: 2.2,
    floor: 15,
    quality: 47,
    stack: false,
    tool: "hammer",
    icon: T(0, 0),
    blurb: "Drives a repair kit into the gate, the shed, or the bench.",
  },
  rod: {
    id: "rod",
    name: "Fishing rod",
    kind: "tool",
    weight: 1.2,
    floor: 16,
    quality: 46,
    stack: false,
    tool: "rod",
    icon: fishIcon(0, 0),
    blurb: "Cast into the farm pond. The line needs open water.",
  },
  loaf: {
    id: "loaf",
    name: "Hearth loaf",
    kind: "food",
    weight: 0.4,
    floor: 4,
    quality: 40,
    stack: false,
    stamina: 24,
    icon: C(0, 0),
    blurb: "Cooked food. Restores stamina. Takes a pack slot.",
  },
  tomato: {
    id: "tomato",
    name: "Tomato",
    kind: "product",
    weight: 0.35,
    floor: 8,
    quality: 50,
    stack: false,
    stamina: 8,
    icon: V(0, 0),
    crop: "tomato",
    blurb: "Fresh fruit. Eat it, cook it, or sell it at Floor.",
  },
  cabbage: {
    id: "cabbage",
    name: "Cabbage",
    kind: "product",
    weight: 0.45,
    floor: 6,
    quality: 50,
    stack: false,
    stamina: 7,
    icon: V(32, 64),
    crop: "cabbage",
    blurb: "Heavy head. The ledger pays its Floor.",
  },
  greens: {
    id: "greens",
    name: "Garden greens",
    kind: "product",
    weight: 0.25,
    floor: 5,
    quality: 50,
    stack: false,
    stamina: 6,
    icon: V(0, 64),
    crop: "greens",
    blurb: "Peas and leaf. Light in the pack.",
  },
  flower: {
    id: "flower",
    name: "Cut flower",
    kind: "product",
    weight: 0.08,
    floor: 4,
    quality: 42,
    stack: true,
    stamina: 2,
    icon: V(32, 0),
    blurb: "Picked from a bed. Light, and it sells for Floor.",
  },
  fish: {
    id: "fish",
    name: "Gold carp",
    kind: "product",
    weight: 0.35,
    floor: 8,
    quality: 40,
    stack: true,
    stamina: 8,
    icon: fishIcon(0, 7),
    blurb: "Caught in the fishing pond. Eats, and it sells for Floor.",
  },
  seed_tomato: {
    id: "seed_tomato",
    name: "Tomato seeds",
    kind: "seed",
    weight: 0.05,
    floor: 2,
    quality: 40,
    stack: true,
    icon: V(0, 0),
    crop: "tomato",
    blurb: "Plants an empty bed or a tilled patch.",
  },
  seed_cabbage: {
    id: "seed_cabbage",
    name: "Cabbage seeds",
    kind: "seed",
    weight: 0.05,
    floor: 2,
    quality: 40,
    stack: true,
    icon: V(32, 64),
    crop: "cabbage",
    blurb: "Plants an empty bed or a tilled patch.",
  },
  seed_greens: {
    id: "seed_greens",
    name: "Greens seeds",
    kind: "seed",
    weight: 0.05,
    floor: 1,
    quality: 40,
    stack: true,
    icon: V(0, 64),
    crop: "greens",
    blurb: "Plants an empty bed or a tilled patch.",
  },
  branch: {
    id: "branch",
    name: "Branch",
    kind: "resource",
    weight: 0.8,
    floor: 2,
    quality: 30,
    stack: false,
    icon: R(32, 0),
    blurb: "Two branches make a repair kit at the bench.",
  },
  kit: {
    id: "kit",
    name: "Repair kit",
    kind: "kit",
    weight: 0.6,
    floor: 5,
    quality: 40,
    stack: false,
    icon: R(64, 0),
    blurb: "Spent by the hammer on a structure, or to restore a tool's Floor.",
  },
  milk: {
    id: "milk",
    name: "Milk can",
    kind: "product",
    weight: 0.8,
    floor: 7,
    quality: 45,
    stack: false,
    stamina: 12,
    icon: { sheet: "dairy", x: 0, y: 0, w: 32, h: 32 },
    blurb: "From a fed cow, after dawn.",
  },
  egg: {
    id: "egg",
    name: "Egg",
    kind: "product",
    weight: 0.2,
    floor: 3,
    quality: 40,
    stack: false,
    stamina: 6,
    icon: { sheet: "eggs", x: 0, y: 0, w: 32, h: 32 },
    blurb: "From a fed rooster, after dawn. Does not stack.",
  },
  backpack: {
    id: "backpack",
    name: "Field backpack",
    kind: "container",
    weight: 0.6,
    floor: 3,
    quality: 20,
    stack: false,
    icon: { sheet: "pack", x: 0, y: 0, w: 32, h: 32 },
    blurb: "Eight nested slots. This is what drops first if you go down.",
  },
  hood: {
    id: "hood",
    name: "Field hood",
    kind: "wear",
    weight: 0.3,
    floor: 8,
    quality: 40,
    stack: false,
    equip: "head",
    icon: { sheet: "wear", x: 0, y: 0, w: 32, h: 32 },
    blurb: "Worn on the head. Click it, then the head slot.",
  },
  cloak: {
    id: "cloak",
    name: "Field cloak",
    kind: "wear",
    weight: 0.8,
    floor: 10,
    quality: 44,
    stack: false,
    equip: "torso",
    icon: { sheet: "wear", x: 32, y: 0, w: 32, h: 32 },
    blurb: "Worn on the torso.",
  },
  pants: {
    id: "pants",
    name: "Trail trousers",
    kind: "wear",
    weight: 0.5,
    floor: 8,
    quality: 40,
    stack: false,
    equip: "legs",
    icon: { sheet: "wear", x: 64, y: 0, w: 32, h: 32 },
    blurb: "Worn on the legs.",
  },
  boots: {
    id: "boots",
    name: "Work boots",
    kind: "wear",
    weight: 0.6,
    floor: 9,
    quality: 42,
    stack: false,
    equip: "feet",
    icon: { sheet: "wear", x: 96, y: 0, w: 32, h: 32 },
    blurb: "Worn on the feet.",
  },
  coin: {
    id: "coin",
    name: "Floor coin",
    kind: "coin",
    weight: 0,
    floor: 1,
    quality: 1,
    stack: true,
    icon: { sheet: "coin", x: 0, y: 0, w: 16, h: 16 },
    blurb: "The shed ledger's coin. Stacks. Weightless.",
  },
  note: {
    id: "note",
    name: "Note",
    kind: "note",
    weight: 0,
    floor: 0,
    quality: 1,
    stack: true,
    icon: T(0, 64),
    blurb: "Paper for one stack. No weight, no use, sells for Floor.",
  },
};

export const POND_FISH: string[] = ["fish"];
export const ROD_FRAMES: IconRef[] = ROD_AT.map(([ri, ci]) => fishIcon(ri, ci));
for (let i = 1; i < FISH_AT.length; i++) {
  const id = `fish_${i}`;
  const [ri, ci] = FISH_AT[i]!;
  POND_FISH.push(id);
  DEFS[id] = {
    id,
    name: FISH_NAMES[i % FISH_NAMES.length]!,
    kind: "product",
    weight: 0.35,
    floor: 8,
    quality: 40,
    stack: true,
    stamina: 8,
    icon: fishIcon(ri, ci),
    blurb: "Caught in the fishing pond. Eats, and it sells for Floor.",
  };
}
for (let i = 1; i < ROD_AT.length; i++) {
  const id = `rod_${i}`;
  const [ri, ci] = ROD_AT[i]!;
  DEFS[id] = {
    id,
    name: "Fishing rod",
    kind: "tool",
    weight: 1.2,
    floor: 16,
    quality: 46,
    stack: false,
    tool: "rod",
    icon: fishIcon(ri, ci),
    blurb: "Cast into the farm pond. The line needs open water.",
  };
}

export type Item = {
  id: string;
  defId: string;
  qty: number;
  quality: number;
  floor: number;
  floorMax: number;
  water?: number;
  noteOf?: string;
  contents?: (Item | null)[];
};

export type Flower = {
  id: string;
  name: string;
  row: number;
  x: number;
  y: number;
  w: number;
  h: number;
  bloom: number;
  grow: number;
};

export function defaultFlowers(): Flower[] {
  return [
    { id: "flower-w", name: "Poppy row", row: 0, x: 81, y: 86, w: 14, h: 34, bloom: 2, grow: 0 },
    { id: "flower-c", name: "Rose row", row: 1, x: 106, y: 87, w: 14, h: 34, bloom: 2, grow: 0 },
    { id: "flower-s", name: "Marigold bed", row: 2, x: 220, y: 147, w: 44, h: 12, bloom: 2, grow: 0 },
  ];
}

export type Plot = {
  id: string;
  kind: "bed" | "extra";
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  crop: CropId | null;
  stage: number;
  watered: boolean;
  wilt: number;
  tilled: boolean;
  revealed: boolean;
};

/** The soil rectangles painted in yard.png. One list for the picture and the game. */
export const BEDS = [
  { id: "bed-w", name: "West bed", x0: 30, y0: 121, w: 52, h: 29 },
  { id: "bed-c", name: "Center bed", x0: 102, y0: 121, w: 32, h: 29 },
  { id: "bed-e", name: "East bed", x0: 155, y0: 125, w: 18, h: 22 },
] as const;

const STARTER: Record<string, CropId> = {
  "bed-w": "tomato",
  "bed-c": "cabbage",
  "bed-e": "greens",
};

export function onBed(x: number, y: number): boolean {
  for (const bed of BEDS) {
    if (x >= bed.x0 && x < bed.x0 + bed.w && y >= bed.y0 && y < bed.y0 + bed.h) return true;
  }
  return false;
}

/** How far a point sits inside a crop bed. Zero when he is off the soil. */
export function bedInset(x: number, y: number): number {
  let best = 0;
  for (const bed of BEDS) {
    if (x < bed.x0 || x >= bed.x0 + bed.w || y < bed.y0 || y >= bed.y0 + bed.h) continue;
    const inset = Math.min(x - bed.x0, bed.x0 + bed.w - x, y - bed.y0, bed.y0 + bed.h - y);
    if (inset > best) best = inset;
  }
  return best;
}

export function freshPlots(): Plot[] {
  return BEDS.map((bed) => ({
    id: bed.id,
    kind: "bed" as const,
    name: bed.name,
    x: bed.x0 + bed.w / 2,
    y: bed.y0 + bed.h / 2,
    w: bed.w,
    h: bed.h,
    crop: STARTER[bed.id] ?? null,
    stage: STARTER[bed.id] ? 5 : 0,
    watered: false,
    wilt: 0,
    tilled: true,
    revealed: true,
  }));
}

export function lockBeds(s: GameState): void {
  const kept = new Map(s.plots.map((p) => [p.id, p]));
  s.plots = freshPlots().map((plot) => {
    const old = kept.get(plot.id);
    if (!old) return plot;
    old.x = plot.x;
    old.y = plot.y;
    old.w = plot.w;
    old.h = plot.h;
    old.kind = "bed";
    old.name = plot.name;
    if (!old.crop && !s.plots.some((p) => p.crop)) {
      old.crop = plot.crop;
      old.stage = plot.stage;
      old.tilled = true;
    }
    return old;
  });
}

export type Animal = {
  id: string;
  kind: "cow" | "rooster" | "goat";
  name: string;
  x: number;
  y: number;
  dir: Dir;
  fed: boolean;
  ready: boolean;
  tx: number;
  ty: number;
  pause: number;
  /** Waypoints through the gate. Empty means choose a new errand. */
  route?: number[];
  intent?: "graze" | "drink" | "court" | "wander" | "flee";
};

export type BirdMode = "stand" | "walk" | "takeoff" | "fly" | "land";

export type Bird = {
  id: string;
  x: number;
  y: number;
  z: number;
  face: 1 | -1;
  mode: BirdMode;
  t: number;
  tx: number;
  ty: number;
  pause: number;
  seed: number;
};

export function freshBirds(): Bird[] {
  return [
    { id: "bird-1", x: 84, y: 252, z: 0, face: 1, mode: "walk", t: 0, tx: 156, ty: 268, pause: 0, seed: 11 },
    { id: "bird-2", x: 208, y: 248, z: 0, face: -1, mode: "stand", t: 0, tx: 208, ty: 248, pause: 1.3, seed: 29 },
    { id: "bird-3", x: 140, y: 396, z: 0, face: 1, mode: "takeoff", t: 0, tx: 220, ty: 340, pause: 0, seed: 47 },
    { id: "bird-4", x: 268, y: 368, z: 16, face: -1, mode: "fly", t: 0.15, tx: 96, ty: 308, pause: 0, seed: 71 },
    { id: "bird-5", x: 304, y: 428, z: 12, face: -1, mode: "land", t: 0, tx: 304, ty: 428, pause: 0, seed: 97 },
  ];
}

export function ensureBirds(s: GameState): void {
  if (!s.birds || s.birds.length < 5) s.birds = freshBirds();
  for (const b of s.birds) {
    if (b.mode !== "stand" && b.mode !== "walk" && b.mode !== "takeoff" && b.mode !== "fly" && b.mode !== "land") b.mode = "stand";
    if (typeof b.z !== "number") b.z = b.mode === "fly" ? 16 : 0;
    if (typeof b.t !== "number") b.t = 0;
    if (typeof b.seed !== "number") b.seed = 1;
    if (typeof b.tx !== "number") b.tx = b.x;
    if (typeof b.ty !== "number") b.ty = b.y;
    if (b.face !== 1 && b.face !== -1) b.face = 1;
  }
}

/** Same rows as the farmer: front, side, back. Feet sit on the bottom of the 32px cell. */
export const REAPER_POSES = ["idle", "walk", "handsidle", "handswalk", "water", "shovel", "scythe", "axe", "hammer", "pickaxe"] as const;
export type ReaperPose = (typeof REAPER_POSES)[number];
export const REAPER_FRAMES: Record<ReaperPose, number> = {
  idle: 2,
  walk: 8,
  handsidle: 2,
  handswalk: 8,
  water: 8,
  shovel: 7,
  scythe: 5,
  axe: 6,
  hammer: 6,
  pickaxe: 6,
};

export type Reaper = {
  x: number;
  y: number;
  dir: Dir;
  pause: number;
  route: number[];
  pose: ReaperPose;
  poseT: number;
  greet: number;
};

export function freshReaper(): Reaper {
  return {
    x: REAPER_HOME.x,
    y: REAPER_HOME.y,
    dir: "s",
    pause: 0.8,
    route: [],
    pose: "idle",
    poseT: 0,
    greet: 0,
  };
}

export function ensureReaper(s: GameState): void {
  const r = s.reaper;
  if (!r || typeof r.x !== "number" || typeof r.y !== "number") {
    s.reaper = freshReaper();
    return;
  }
  if (!REAPER_POSES.includes(r.pose)) r.pose = "idle";
  if (!Array.isArray(r.route)) r.route = [];
  if (typeof r.pause !== "number") r.pause = 0.4;
  if (typeof r.poseT !== "number") r.poseT = 0;
  if (typeof r.greet !== "number") r.greet = 0;
  if (r.dir !== "n" && r.dir !== "e" && r.dir !== "s" && r.dir !== "w") r.dir = "s";
  if (r.y > 510 || r.y < 40 || r.x < 28 || r.x > 324) {
    r.x = REAPER_HOME.x;
    r.y = REAPER_HOME.y;
    r.route = [];
    r.pose = "idle";
    r.pause = 0.4;
  }
}

export function freshHand(): Reaper {
  return {
    x: HAND_HOME.x,
    y: HAND_HOME.y,
    dir: "s",
    pause: 0.6,
    route: [],
    pose: "idle",
    poseT: 0,
    greet: 0,
  };
}

export function ensureHand(s: GameState): void {
  if (s.handPlace !== 3 || !s.hand || typeof s.hand.x !== "number") {
    s.hand = freshHand();
    s.handPlace = 3;
    return;
  }
  const h = s.hand;
  if (!REAPER_POSES.includes(h.pose)) h.pose = "idle";
  if (!Array.isArray(h.route)) h.route = [];
  if (typeof h.pause !== "number") h.pause = 0.4;
  if (typeof h.poseT !== "number") h.poseT = 0;
  if (typeof h.greet !== "number") h.greet = 0;
  if (h.dir !== "n" && h.dir !== "e" && h.dir !== "s" && h.dir !== "w") h.dir = "s";
  if (h.y > 175 || h.y < 80 || h.x < 28 || h.x > 310) {
    h.x = HAND_HOME.x;
    h.y = HAND_HOME.y;
    h.route = [];
    h.pose = "idle";
    h.pause = 0.3;
  }
}

export type XiangSu = {
  x: number;
  y: number;
  dir: Dir;
  pause: number;
  route: number[];
  poseT: number;
};

export function freshXiang64(): XiangSu {
  return { x: 220, y: 212, dir: "s", pause: 0.5, route: [], poseT: 0 };
}

export const MAID_HOME = { x: 160, y: 250 } as const;

export function freshMaid(): XiangSu {
  return { x: MAID_HOME.x, y: MAID_HOME.y, dir: "s", pause: 0.8, route: [], poseT: 0 };
}

export function ensureMaid(s: GameState): void {
  const m = s.maid;
  if (!m || typeof m.x !== "number" || typeof m.y !== "number") {
    s.maid = freshMaid();
    return;
  }
  if (!Array.isArray(m.route)) m.route = [];
  if (typeof m.pause !== "number") m.pause = 0.6;
  if (typeof m.poseT !== "number") m.poseT = 0;
  if (m.dir !== "n" && m.dir !== "e" && m.dir !== "s" && m.dir !== "w") m.dir = "s";
  if (m.y < 56 || m.y > 490 || m.x < 36 || m.x > 310) {
    const home = freshMaid();
    m.x = home.x;
    m.y = home.y;
    m.route = [];
    m.pause = 0.4;
    m.dir = "s";
  }
}

export const STABLE_HOME = { x: 156, y: 368 } as const;

export function freshStable(): XiangSu {
  return { x: STABLE_HOME.x, y: STABLE_HOME.y, dir: "s", pause: 0.25, route: [], poseT: 0 };
}

export function ensureStable(s: GameState): void {
  const n = s.stable;
  if (s.stablePlace !== 2 || !n || typeof n.x !== "number" || typeof n.y !== "number") {
    s.stable = freshStable();
    s.stablePlace = 2;
    return;
  }
  if (!Array.isArray(n.route)) n.route = [];
  if (typeof n.pause !== "number") n.pause = 0.4;
  if (typeof n.poseT !== "number") n.poseT = 0;
  if (n.dir !== "n" && n.dir !== "e" && n.dir !== "s" && n.dir !== "w") n.dir = "s";
  if (n.y < 56 || n.y > 490 || n.x < 36 || n.x > 310) {
    const home = freshStable();
    n.x = home.x;
    n.y = home.y;
    n.route = [];
    n.pause = 0.3;
    n.dir = "s";
  }
}

export function ensureXiang64(s: GameState): void {
  const n = s.xiang64;
  if (!n || typeof n.x !== "number" || typeof n.y !== "number") {
    s.xiang64 = freshXiang64();
    return;
  }
  if (!Array.isArray(n.route)) n.route = [];
  if (typeof n.pause !== "number") n.pause = 0.4;
  if (typeof n.poseT !== "number") n.poseT = 0;
  if (n.dir !== "n" && n.dir !== "e" && n.dir !== "s" && n.dir !== "w") n.dir = "s";
  if (n.y < 200 || n.y > 500 || n.x < 80 || n.x > 270) {
    const home = freshXiang64();
    n.x = home.x;
    n.y = home.y;
    n.route = [];
    n.pause = 0.3;
    n.dir = "s";
  }
}

export type Body = {
  head: Item | null;
  torso: Item | null;
  legs: Item | null;
  feet: Item | null;
  hands: Item | null;
  amulet: Item | null;
  ring: Item | null;
  belt: Item | null;
  container: Item | null;
  offhand: Item | null;
};

export type Act = {
  kind: string;
  target: string;
  elapsed: number;
  dur: number;
  hit?: boolean;
};

export type Ground = { id: string; item: Item; x: number; y: number };

export type Branch = { id: string; x: number; y: number; left: boolean };

export type Structure = { id: string; name: string; quality: number; floor: number; floorMax: number };

export type SpellId = "fireball" | "nova" | "holy" | "ice" | "iceball" | "bolt" | "spark" | "poison" | "drip";

export type Cast = { spell: SpellId; t: number };

export const SPELLS: SpellId[] = ["fireball", "nova", "iceball", "ice", "spark", "bolt", "holy", "poison", "drip"];

export const MAGIC_MAX = 100;
export const MANA_MAX = 100;

/** Mana spent when a cast begins. A full bar covers every spell, then it refills. */
export const SPELL_COST: Record<SpellId, number> = {
  fireball: 8,
  nova: 16,
  holy: 14,
  ice: 14,
  iceball: 8,
  bolt: 12,
  spark: 6,
  poison: 10,
  drip: 6,
};

export const SPELL_NAME: Record<SpellId, string> = {
  fireball: "fireball",
  nova: "fire nova",
  holy: "holy light",
  ice: "ice crystal",
  iceball: "iceball",
  bolt: "lightning",
  spark: "lightning orb",
  poison: "poison orb",
  drip: "toxic drip",
};

export type Liturgy = "strike" | "bind" | "mend" | "area";

/** Which sentence a spell is speaking. The realm decides the clothes. */
export function liturgyOf(spell: SpellId): Liturgy {
  if (spell === "holy") return "mend";
  if (spell === "ice" || spell === "iceball" || spell === "poison") return "bind";
  if (spell === "drip") return "area";
  return "strike";
}

/** Homestead keeps the practice names. Each loka speaks the same nine motions in its own pigment. */
export function liturgyName(spell: SpellId, wing: -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18): string {
  if (wing === 0 || wing >= 2) return SPELL_NAME[spell];
  const east = wing === 1;
  switch (spell) {
    case "fireball":
      return east ? "agni-bindu" : "kumbha-bindu";
    case "nova":
      return east ? "bimba-mala" : "kumbha-tapa";
    case "holy":
      return east ? "anugraha" : "rupya-danda";
    case "iceball":
      return east ? "candrakanta" : "atisita";
    case "ice":
      return east ? "candrakanta-vyuha" : "sita-yantra";
    case "spark":
      return east ? "vajra-bija" : "kala-bindu";
    case "bolt":
      return east ? "vajra" : "danda";
    case "poison":
      return east ? "parijata-bija" : "vaitarani-bindu";
    case "drip":
      return east ? "soma-bindu" : "vaitarani-drip";
  }
}

export type Face = "ok" | "happy" | "tired" | "ill" | "need" | "heart";

export type Life = {
  hunger: number;
  thirst: number;
  dirt: number;
  mood: number;
  face: Face;
  emote: number;
  errand: "eat" | "drink" | "wash" | "rest" | "look" | "svarga" | null;
  tx: number;
  ty: number;
  pause: number;
  route: number[];
  chore: string;
  skip: string;
  skipUntil: number;
};

export function freshLife(): Life {
  return {
    hunger: 12,
    thirst: 10,
    dirt: 8,
    mood: 80,
    face: "ok",
    emote: 0,
    errand: null,
    tx: FARM_START.x,
    ty: FARM_START.y,
    pause: 1.1,
    route: [],
    chore: "",
    skip: "",
    skipUntil: 0,
  };
}

export function ensureLife(s: GameState): void {
  if (!s.life) s.life = freshLife();
  const life = s.life;
  if (typeof life.hunger !== "number") life.hunger = 12;
  if (typeof life.thirst !== "number") life.thirst = 10;
  if (typeof life.dirt !== "number") life.dirt = 8;
  if (typeof life.mood !== "number") life.mood = 80;
  if (!life.face) life.face = "ok";
  if (typeof life.emote !== "number") life.emote = 0;
  if (life.errand === undefined) life.errand = null;
  if (typeof life.tx !== "number") life.tx = FARM_START.x;
  if (typeof life.ty !== "number") life.ty = FARM_START.y;
  if (typeof life.pause !== "number") life.pause = 0.4;
  if (!Array.isArray(life.route)) life.route = [];
  if (typeof life.chore !== "string") life.chore = "";
  if (typeof life.skip !== "string") life.skip = "";
  if (typeof life.skipUntil !== "number") life.skipUntil = 0;
}

export type Sky = "clear" | "rain" | "storm";

export type GameState = {
  version: 1;
  x: number;
  y: number;
  dir: Dir;
  speed: number;
  stamina: number;
  downed: boolean;
  day: number;
  time: number;
  season: "Spring";
  clock: number;
  pack: (Item | null)[];
  hotbar: (string | null)[];
  selected: number;
  activeId: string | null;
  body: Body;
  vault: (Item | null)[];
  purse: number;
  plots: Plot[];
  flowers: Flower[];
  animals: Animal[];
  branches: Branch[];
  structures: Structure[];
  ground: Ground[];
  cat: {
    x: number;
    y: number;
    face: number;
    petCd: number;
    tx: number;
    ty: number;
    pause: number;
    mode: "sit" | "stand" | "walk" | "run";
    look?: "n" | "e" | "s" | "w";
    /** Atlas clip from the black cat sheet. */
    clip?: string;
    clipT?: number;
    route?: number[];
    intent?: "court" | "drink" | "yard" | "follow";
    /** Seconds until she speaks again. Not saved as part of the story. */
    mew?: number;
  };
  birds: Bird[];
  /** Friendly masked wizard. Keeps to the courtyard and minds his own work. */
  reaper: Reaper;
  /** Second farmer. Works the yard and leaves the seal alone. */
  hand: Reaper;
  stats: {
    harvested: number;
    cooked: number;
    floorEarned: number;
    gateRepaired: boolean;
    boughtTool: boolean;
    daysSlept: number;
  };
  nextId: number;
  rng: number;
  action: Act | null;
  pending: { px: number; py: number } | null;
  message: string;
  summary: boolean;
  weather: Sky;
  weatherLeft: number;
  wet: number;
  flash: number;
  bolts: number;
  life: Life;
  auto: boolean;
  /** Successful casts into the farm pond. */
  fishing: number;
  catchFlash?: number;
  /** Spellcraft skill. 100 is a full working set of casts. */
  magic: number;
  /** Pool spent by casts. Recovers while he stands or walks, same idea as stamina. */
  mana: number;
  /** Body. 100 is unhurt. Hunger, thirst, and collapse pull it down. */
  health: number;
  /** Use-based skills. The number is experience, not the level. */
  skills: SkillBook;
  /** Next spell in the practice rotation. */
  rune: number;
  cast: Cast | null;
  /** -1 west copy, 0 home, 1 east copy, 2 the skill grove. */
  wing: -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18;
  /** A portal crossing. The land changes halfway through the fade. */
  cross: {
    t: number;
    wing: -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18;
    x: number;
    y: number;
    dir: Dir;
    name: string;
    moved: boolean;
  } | null;
  uiEvent?: { panel?: PanelId; save?: boolean; summary?: boolean };
  /** 5 = opens on the upper farmland. Older saves are moved there on load. */
  courtSpawn?: boolean | 2 | 3 | 4 | 5;
  /** 3 = field hand works the farm beds. */
  handPlace?: number;
  /** 1 = goat lives in the pen. 2 = the old code let him roam the courtyard. */
  goatPen?: number;
  /** Seconds left on the courtyard visit. Then the slash takes him home. */
  goatLoose?: number;
  /** Magic slashes. Each one lives for a fraction of a second. */
  goatSlash?: { x: number; y: number; t: number }[];
  /** Xiang Su at 64, walking the courtyard and the sidewalk. */
  xiang64?: XiangSu;
  /** Milkmaid. She keeps to the courtyard near the cow. */
  maid?: XiangSu;
  /** 2 = stable hand stands by the grove entrance and walks the lanes. */
  stablePlace?: number;
  /** Stable hand. He keeps the lanes of the skill grove. */
  stable?: XiangSu;
  /** Farm portal rack. Seeds are generated farms. 0 is the original yard. */
  farmRack?: FarmRack;
};

export type FarmRack = {
  seeds: number[];
  at: number;
  pins: Array<number | null>;
};

export function freshFarmRack(): FarmRack {
  return { seeds: [0], at: 0, pins: [null, null, null] };
}

export function ensureFarmRack(s: GameState): FarmRack {
  const rack = s.farmRack;
  if (!rack || !Array.isArray(rack.seeds) || rack.seeds.length === 0) {
    s.farmRack = freshFarmRack();
    return s.farmRack;
  }
  if (!Number.isInteger(rack.at) || rack.at < 0 || rack.at >= rack.seeds.length) rack.at = 0;
  if (!Array.isArray(rack.pins) || rack.pins.length !== 3) rack.pins = [null, null, null];
  return rack;
}

export type PanelId = "pack" | "body" | "vault" | "craft" | "map" | "pause" | "summary" | "controls" | "backpack" | "skills";

export const SKILL_IDS = [
  "farming",
  "foraging",
  "cooking",
  "herbalism",
  "fishing",
  "husbandry",
  "woodcraft",
  "construction",
  "tracking",
  "healing",
  "magic",
  "ritual",
  "survival",
  "exploration",
  "combat",
  "armour",
  "weapon",
  "quarry",
  "trade",
  "enchant",
] as const;

export type SkillId = (typeof SKILL_IDS)[number];
export type SkillBook = Record<SkillId, number>;

export const SKILL_NAME: Record<SkillId, string> = {
  farming: "Farming",
  foraging: "Foraging",
  cooking: "Cooking",
  herbalism: "Herbalism",
  fishing: "Fishing",
  husbandry: "Animal care",
  woodcraft: "Woodcraft",
  construction: "Construction",
  tracking: "Tracking",
  healing: "Healing",
  magic: "Elemental magic",
  ritual: "Ritual",
  survival: "Survival",
  exploration: "Exploration",
  combat: "Combat",
  armour: "Armour",
  weapon: "Weapons",
  quarry: "Quarry",
  trade: "Trade",
  enchant: "Enchanting",
};

export const SKILL_NOTE: Record<SkillId, string> = {
  farming: "Till, plant, water, and harvest.",
  foraging: "Pick up what the ground offers.",
  cooking: "Turn raw food into a meal.",
  herbalism: "Know and cut the flowering beds.",
  fishing: "A catch from the farm pond.",
  husbandry: "Feed, gather, and greet the animals.",
  woodcraft: "Take a branch without wasting the tree.",
  construction: "Repair the gate, the door, and the tools.",
  tracking: "Find the herd, the pond, and the way through.",
  healing: "Eat, wash, and sleep the hurt off.",
  magic: "The courtyard is the magic plot. Practice on the seal.",
  ritual: "Cast where the loka can answer.",
  survival: "Last the weather, the night, and an empty belly.",
  exploration: "Step off the homestead into another land.",
  combat: "Drill the combat plot, the dummy, and the range.",
  armour: "Shape the armour plot, the stand, and the mail.",
  weapon: "Work the weapon plot, the blade, and the haft.",
  quarry: "Cut ore, stone, and ingots from the face.",
  trade: "Sell what the homestead has made.",
  enchant: "Bind a working onto a finished piece.",
};

export function freshSkills(): SkillBook {
  const book = {} as SkillBook;
  for (const id of SKILL_IDS) book[id] = 0;
  book.magic = 270;
  return book;
}

/** One level per 30 uses-worth of experience. Level 1 is the start. */
export function skillLevel(xp: number): number {
  return Math.min(99, 1 + Math.floor(Math.max(0, xp) / 30));
}

export function skillFill(xp: number): number {
  return (Math.max(0, xp) % 30) / 30;
}

export function ensureSkills(s: GameState): void {
  if (!s.skills) s.skills = freshSkills();
  for (const id of SKILL_IDS) {
    const n = s.skills[id];
    if (typeof n !== "number" || Number.isNaN(n)) s.skills[id] = id === "magic" ? 270 : 0;
  }
  if ((s.skills.magic ?? 0) < 270) s.skills.magic = 270;
}

export function ensureHealth(s: GameState): void {
  if (typeof s.health !== "number" || Number.isNaN(s.health)) s.health = 100;
  s.health = Math.max(0, Math.min(100, s.health));
}

export type Rect = { x: number; y: number; w: number; h: number };

export const SOLIDS: Rect[] = [
  { x: 14, y: 22, w: 312, h: 12 },
  { x: 14, y: 22, w: 12, h: 146 },
  { x: 14, y: 154, w: 142, h: 18 },
  { x: 191, y: 154, w: 136, h: 18 },
  { x: 116, y: 74, w: 40, h: 22 },
  { x: 164, y: 62, w: 30, h: 38 },
  { x: 112, y: 16, w: 96, h: 60 },
  { x: 198, y: 78, w: 16, h: 16 },
  { x: 196, y: 98, w: 26, h: 18 },
  { x: 98, y: 36, w: 42, h: 16 },
  { x: 44, y: 70, w: 20, h: 16 },
  { x: 228, y: 78, w: 12, h: 64 },
  { x: 240, y: 104, w: 54, h: 38 },
  { x: 52, y: 90, w: 16, h: 16 },
  { x: 232, y: 180, w: 52, h: 12 },
  { x: 292, y: 146, w: 28, h: 24 },
];

export const SPOTS: { id: string; name: string; kind: string; x: number; y: number; w: number; h: number }[] = [
  { id: "well", name: "Well", kind: "well", x: 158, y: 58, w: 42, h: 50 },
  { id: "pond", name: "Pond", kind: "pond", x: 110, y: 68, w: 50, h: 34 },
  { id: "tub", name: "Bathtub", kind: "tub", x: 92, y: 32, w: 52, h: 26 },
  { id: "fire", name: "Campfire", kind: "fire", x: 38, y: 64, w: 30, h: 26 },
  { id: "shed", name: "Shed chest", kind: "shed", x: 236, y: 134, w: 48, h: 24 },
  { id: "bench", name: "Workbench", kind: "bench", x: 196, y: 112, w: 40, h: 22 },
  { id: "grind", name: "Grindstone", kind: "grind", x: 190, y: 92, w: 36, h: 28 },
  { id: "gate", name: "Fence gate", kind: "gate", x: 176, y: 148, w: 16, h: 40 },
];

export const COVERS: { id: string; x: number; y: number; foot: number }[] = [
  { id: "tree-nw", x: 0, y: 0, foot: 400 },
  { id: "tree-n", x: 100, y: 0, foot: 400 },
  { id: "tree-ne", x: 185, y: 0, foot: 400 },
  { id: "tree-e", x: 290, y: 0, foot: 400 },
  { id: "tree-sw", x: 0, y: 140, foot: 400 },
  { id: "tree-s", x: 100, y: 145, foot: 400 },
  { id: "tree-se", x: 280, y: 140, foot: 400 },
  { id: "bush-w", x: 18, y: 55, foot: 400 },
  { id: "bush-e", x: 240, y: 50, foot: 400 },
  { id: "shed", x: 246, y: 78, foot: 142 },
];

const PROP_SOLIDS: Rect[] = [
  { x: 34, y: 58, w: 16, h: 16 },
  { x: 146, y: 28, w: 14, h: 12 },
  { x: 222, y: 44, w: 16, h: 16 },
  { x: 316, y: 40, w: 14, h: 16 },
  { x: 22, y: 166, w: 14, h: 12 },
  { x: 136, y: 168, w: 14, h: 12 },
  { x: 314, y: 166, w: 14, h: 12 },
  { x: 28, y: 72, w: 18, h: 14 },
  { x: 274, y: 68, w: 18, h: 14 },
];

const YARD_FEET: Rect[] = [
  { x: 118, y: 78, w: 32, h: 16 },
  { x: 104, y: 40, w: 28, h: 12 },
  { x: 168, y: 74, w: 18, h: 14 },
  { x: 42, y: 70, w: 14, h: 12 },
  { x: 252, y: 100, w: 36, h: 28 },
  { x: 202, y: 110, w: 24, h: 12 },
  { x: 198, y: 90, w: 16, h: 12 },
  { x: 24, y: 36, w: 8, h: 8 },
  { x: 52, y: 34, w: 8, h: 8 },
  { x: 168, y: 32, w: 8, h: 8 },
  { x: 214, y: 34, w: 8, h: 8 },
  { x: 286, y: 36, w: 8, h: 8 },
  { x: 86, y: 144, w: 10, h: 8 },
  { x: 198, y: 148, w: 10, h: 8 },
];

export function emptyBody(): Body {
  return {
    head: null,
    torso: null,
    legs: null,
    feet: null,
    hands: null,
    amulet: null,
    ring: null,
    belt: null,
    container: null,
    offhand: null,
  };
}

export function defOf(it: Item): Def {
  if (it.defId === "note" && it.noteOf && DEFS[it.noteOf]) {
    return { ...DEFS.note, name: `Note: ${DEFS[it.noteOf].name}`, floor: it.floor };
  }
  return DEFS[it.defId] ?? DEFS.note;
}

export function itemMass(it: Item): number {
  const d = defOf(it);
  let m = d.weight * (d.stack ? it.qty : 1);
  if (it.contents) {
    for (const c of it.contents) if (c) m += itemMass(c);
  }
  return m;
}

/** The south edge is the last walkable stone. He stops there. He is not sent home. */
export function placeFarmer(s: GameState): void {
  const south = MEADOW.y - 1;
  if (s.y > south) {
    s.y = south;
    while (s.y > 48 && footBlocked(s.x, s.y)) s.y -= 2;
  }
  if (s.life && s.life.ty > south) {
    s.life.ty = s.y;
    s.life.route = [];
    s.life.pause = 0.4;
  }
}

export function ensureGoatPen(s: GameState): void {
  const g = s.animals.find((a) => a.kind === "goat");
  if (!g) return;
  if (s.goatPen === 2) {
    if (g.y < 210 || g.y > 510 || g.x < 36 || g.x > 320) {
      g.x = 180;
      g.y = 340;
      g.tx = 180;
      g.ty = 340;
      g.route = [];
      g.pause = 0.3;
      g.intent = "court";
    }
    return;
  }
  const minX = GOAT_PEN.x + 6;
  const maxX = GOAT_PEN.x + GOAT_PEN.w - 6;
  const minY = GOAT_PEN.y + 4;
  const maxY = GOAT_PEN.y + GOAT_PEN.h - 4;
  const x = Math.max(minX, Math.min(maxX, g.x));
  const y = Math.max(minY, Math.min(maxY, g.y));
  const near = Math.abs(g.x - x) < 28 && Math.abs(g.y - y) < 28;
  if (near) {
    if (g.x !== x || g.y !== y) {
      g.x = x;
      g.y = y;
      g.tx = x;
      g.ty = y;
      g.route = [];
    }
    s.goatPen = 1;
    return;
  }
  g.x = HERD_HOME.goat.x;
  g.y = HERD_HOME.goat.y;
  g.tx = HERD_HOME.goat.x;
  g.ty = HERD_HOME.goat.y;
  g.route = [];
  g.pause = 0.6;
  g.intent = "graze";
  s.goatPen = 1;
}

/** Cow lives on the skill grove. Rooster stays on the courtyard. A save that left the cow on the farm comes back. */
export function ensureCourtHerd(s: GameState): void {
  for (const a of s.animals) {
    if (a.kind === "goat") continue;
    const spot = HERD_HOME[a.kind];
    if (!spot) continue;
    if (a.kind === "cow") {
      const lost = a.intent !== "graze" || a.y < 48 || a.y > 510 || a.x < 24 || a.x > 330;
      if (lost) {
        a.x = spot.x;
        a.y = spot.y;
        a.tx = spot.x;
        a.ty = spot.y;
        a.route = [];
        a.pause = 0.6;
        a.intent = "graze";
      }
      continue;
    }
    if (a.y >= MAGIC_PLOT.y) continue;
    a.x = spot.x;
    a.y = spot.y;
    a.tx = spot.x;
    a.ty = spot.y;
    a.route = [];
    a.pause = 0.4;
    a.intent = "court";
  }
}

export function placeHerd(s: GameState): void {
  for (const a of s.animals) {
    const spot = HERD_HOME[a.kind];
    if (!spot || a.y < MEADOW.y - 12) continue;
    a.x = spot.x;
    a.y = spot.y;
    a.tx = spot.x;
    a.ty = spot.y;
    a.pause = a.kind === "cow" ? 1.4 : 0.5;
  }
  if (s.cat && s.cat.y >= MEADOW.y - 12) {
    s.cat.x = CAT_HOME.x;
    s.cat.y = CAT_HOME.y;
    s.cat.tx = CAT_HOME.x;
    s.cat.ty = CAT_HOME.y;
    s.cat.mode = "sit";
    s.cat.pause = 1.2;
  }
  placeFarmer(s);
}

/** Every load opens on the upper farmland. A save that left him in Svarga, Naraka, or the courtyard comes back here. */
export function placeCourtSpawn(s: GameState): void {
  const first = s.courtSpawn !== 5;
  s.courtSpawn = 5;
  setRealm(0);
  s.wing = 0;
  s.cross = null;
  s.x = FARM_START.x;
  s.y = FARM_START.y;
  s.dir = "n";
  s.speed = 0;
  if (s.life) {
    s.life.tx = FARM_START.x;
    s.life.ty = FARM_START.y;
    s.life.route = [];
    s.life.pause = 0.8;
    if (s.life.chore === "svarga" || s.life.errand === "svarga") {
      s.life.chore = "";
      s.life.errand = null;
    }
    s.life.skip = "svarga";
    s.life.skipUntil = s.clock + 20;
  }
  const worn = s.body.hands;
  const scythe = worn && defOf(worn).tool === "scythe" ? worn : s.pack.find((p) => p && p.defId === "scythe");
  if (scythe) {
    s.activeId = scythe.id;
    let idx = s.hotbar.indexOf(scythe.id);
    if (idx < 0) {
      s.hotbar[2] = scythe.id;
      idx = 2;
    }
    s.selected = idx;
  }
  if (!first) return;
  for (const a of s.animals) {
    const spot = HERD_HOME[a.kind];
    if (!spot) continue;
    a.x = spot.x;
    a.y = spot.y;
    a.tx = spot.x;
    a.ty = spot.y;
    a.pause = a.kind === "cow" ? 1.6 : a.kind === "goat" ? 0.9 : 0.5;
  }
  if (s.cat) {
    s.cat.x = CAT_HOME.x;
    s.cat.y = CAT_HOME.y;
    s.cat.tx = CAT_HOME.x;
    s.cat.ty = CAT_HOME.y;
    s.cat.face = 1;
    s.cat.look = "s";
    s.cat.mode = "sit";
    s.cat.pause = 2;
    s.cat.route = [];
  }
}

/** Open water on the farm pond. */
export const FISH_WATER: Rect = { x: 118, y: 79, w: 32, h: 17 };

export type SeamRock = { x: number; y: number; i: number; s: number };
/** Nothing sits in the void. */
export const SEAM_ROCKS: SeamRock[] = [];

let realmWing: -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 = 0;

/** Farm collision stays on the homestead. Each other land has its own ground. */
export function setRealm(wing: -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18): void {
  realmWing = wing;
}

function realmFeet(x: number, y: number): boolean {
  if (realmWing === 2) return groveFeet(x, y);
  if (realmWing === 3) return combatFeet(x, y);
  if (realmWing === 4) return ringFeet(x, y);
  if (realmWing === 5) return armourFeet(x, y);
  if (realmWing === 6) return weaponFeet(x, y);
  if (realmWing === 7) return quarryFeet(x, y);
  if (realmWing === 8) return sanctumFeet(x, y);
  if (realmWing === 9) return marketFeet(x, y);
  if (realmWing === 10) return enchantFeet(x, y);
  if (realmWing === 11) return wildsFeet(x, y);
  if (realmWing === 12) return stairFeet(x, y);
  if (realmWing === 13) return techFeet(x, y);
  if (realmWing === 14) return medicFeet(x, y);
  if (realmWing === 15) return bioFeet(x, y);
  if (realmWing === 16) return libraryFeet(x, y);
  if (realmWing === 17) return jyotishFeet(x, y);
  if (realmWing === 18) return mantraFeet(x, y);
  const box = { x: x - 4, y: y - 4, w: 8, h: 5 };
  if (box.y + box.h > MEADOW.y) return true;
  if (box.x < 22 || box.x + box.w > 330) return true;
  if (box.y < 48) return true;
  if (onPortal(x, y)) return true;
  const wing: -1 | 1 = realmWing === 1 ? 1 : -1;
  for (let yy = box.y; yy < box.y + box.h; yy++) {
    for (let xx = box.x; xx < box.x + box.w; xx++) {
      if (realmPlateSolid(wing, xx, yy)) return true;
    }
  }
  return false;
}

let extraFeet: (x: number, y: number) => boolean = () => false;

export function setExtraFeet(fn: (x: number, y: number) => boolean): void {
  extraFeet = fn;
}

export function overlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Dirt mouth through the wooden gate. Everything else in this band is rail or hedge. */
export const FENCE = { y0: 155, y1: 184, x0: 179, x1: 188, mouthX: 184, northY: 148, southY: 190 } as const;

export function onFenceRail(x: number, y: number): boolean {
  return y >= FENCE.y0 && y <= FENCE.y1 && (x < FENCE.x0 || x > FENCE.x1);
}

export function footBlocked(x: number, y: number): boolean {
  if (realmWing !== 0) return realmFeet(x, y);
  const box = { x: x - 4, y: y - 4, w: 8, h: 5 };
  if (box.y + box.h > MEADOW.y) return true;
  if (box.x < 22 || box.x + box.w > 330) return true;
  if (box.y < 36) return true;
  if (onFenceRail(x, y)) return true;
  for (const s of SOLIDS) if (overlap(box, s)) return true;
  for (const s of PROP_SOLIDS) if (overlap(box, s)) return true;
  for (const s of tileBlocks()) if (overlap(box, s)) return true;
  for (const r of SEAM_ROCKS) {
    const w = 14 * r.s;
    const h = 8 * r.s;
    if (overlap(box, { x: r.x - w / 2, y: r.y - h, w, h })) return true;
  }
  if (overlap(box, FISH_WATER)) return true;
  if (onBed(x, y)) return true;
  for (const s of YARD_FEET) if (overlap(box, s)) return true;
  if (onPortal(x, y)) return true;
  if (extraFeet(x, y)) return true;
  return false;
}

export function ensureFishing(s: GameState): void {
  if (typeof s.fishing !== "number") s.fishing = 0;
}

export function ensureMagic(s: GameState): void {
  if (typeof s.magic !== "number" || Number.isNaN(s.magic) || s.magic < MAGIC_MAX) s.magic = MAGIC_MAX;
  if (typeof s.mana !== "number" || Number.isNaN(s.mana)) s.mana = MANA_MAX;
  s.mana = Math.max(0, Math.min(MANA_MAX, s.mana));
  if (typeof s.rune !== "number" || Number.isNaN(s.rune)) s.rune = 0;
  s.rune = ((Math.floor(s.rune) % SPELLS.length) + SPELLS.length) % SPELLS.length;
  const spell = s.cast?.spell;
  if (!s.cast || !SPELLS.includes(spell as SpellId) || typeof s.cast.t !== "number") s.cast = null;
}

/** The way home from heaven. On the court tiles, to the right of the pond. */
export const HEAVEN_GATE = { x: 268, y: 320 } as const;

/** Flat circle set into the bottom-right courtyard tiles. */
export const GROVE_DOOR = { x: 308, y: 500 } as const;
/** Where that circle lets him out, and the circle that brings him back. */
export const GROVE_ARRIVE = { x: 174, y: 400 } as const;
export const GROVE_RETURN = { x: 174, y: 476 } as const;

export type GrovePlot = {
  id: string;
  name: string;
  skill: SkillId | "magic";
  x: number;
  y: number;
  w: number;
  h: number;
};

/** Training stations painted on the grove plate. Magic is marked, not trained here. */
export const GROVE_PLOTS: GrovePlot[] = [
  { id: "g-farm", name: "Tilled bed", skill: "farming", x: 40, y: 64, w: 88, h: 36 },
  { id: "g-herb", name: "Flower bed", skill: "herbalism", x: 40, y: 128, w: 84, h: 32 },
  { id: "g-herd", name: "Trough", skill: "husbandry", x: 44, y: 188, w: 70, h: 28 },
  { id: "g-build", name: "Stone pile", skill: "construction", x: 44, y: 268, w: 52, h: 28 },
  { id: "g-track", name: "Cairn", skill: "tracking", x: 46, y: 328, w: 28, h: 28 },
  { id: "g-explore", name: "Waystone", skill: "exploration", x: 48, y: 420, w: 16, h: 28 },
  { id: "g-forage", name: "Berry bush", skill: "foraging", x: 228, y: 72, w: 44, h: 34 },
  { id: "g-wood", name: "Stump", skill: "woodcraft", x: 248, y: 152, w: 40, h: 28 },
  { id: "g-cook", name: "Cook fire", skill: "cooking", x: 246, y: 214, w: 32, h: 24 },
  { id: "g-fish", name: "Practice pond", skill: "fishing", x: 230, y: 306, w: 56, h: 14 },
  { id: "g-heal", name: "Spring", skill: "healing", x: 244, y: 376, w: 36, h: 24 },
  { id: "g-live", name: "Lean-to", skill: "survival", x: 220, y: 424, w: 48, h: 22 },
  { id: "g-rite", name: "Ritual ring", skill: "ritual", x: 156, y: 286, w: 36, h: 28 },
  { id: "g-magic", name: "Seal stone", skill: "magic", x: 286, y: 430, w: 14, h: 22 },
];

export const GROVE_SOLIDS: Rect[] = [
  { x: 244, y: 94, w: 12, h: 12 },
  { x: 58, y: 196, w: 28, h: 10 },
  { x: 44, y: 268, w: 52, h: 28 },
  { x: 46, y: 328, w: 26, h: 26 },
  { x: 48, y: 420, w: 16, h: 28 },
  { x: 258, y: 156, w: 20, h: 16 },
  { x: 250, y: 216, w: 24, h: 16 },
  { x: 218, y: 276, w: 80, h: 30 },
  { x: 246, y: 378, w: 32, h: 18 },
  { x: 286, y: 430, w: 14, h: 22 },
];

export function grovePlotAt(px: number, py: number): GrovePlot | null {
  for (let i = GROVE_PLOTS.length - 1; i >= 0; i--) {
    const p = GROVE_PLOTS[i]!;
    if (px >= p.x && px < p.x + p.w && py >= p.y && py < p.y + p.h) return p;
  }
  return null;
}

export function groveBlocked(x: number, y: number): boolean {
  return groveFeet(x, y);
}

function groveFeet(x: number, y: number): boolean {
  const box = { x: x - 4, y: y - 4, w: 8, h: 5 };
  if (box.y + box.h > 512 || box.y < 40) return true;
  if (box.x < 20 || box.x + box.w > 328) return true;
  for (const s of GROVE_SOLIDS) if (overlap(box, s)) return true;
  return false;
}

export function onGroveDoor(x: number, y: number, cx: number = GROVE_DOOR.x, cy: number = GROVE_DOOR.y): boolean {
  const dx = (x - cx) / 16;
  const dy = (y - cy) / 10;
  return dx * dx + dy * dy <= 1;
}

/** Flat circle set into the courtyard tiles just above the skill portal. */
export const COMBAT_DOOR = { x: 308, y: 476 } as const;
export const COMBAT_ARRIVE = { x: 174, y: 360 } as const;
export const COMBAT_RETURN = { x: 174, y: 470 } as const;

export type CombatPlot = {
  id: string;
  name: string;
  skill: "combat";
  x: number;
  y: number;
  w: number;
  h: number;
};

export const COMBAT_PLOTS: CombatPlot[] = [
  { id: "c-plot", name: "Combat plot", skill: "combat", x: 108, y: 168, w: 120, h: 72 },
  { id: "c-dummy", name: "Straw dummy", skill: "combat", x: 40, y: 72, w: 28, h: 40 },
  { id: "c-arch", name: "Archery butt", skill: "combat", x: 248, y: 72, w: 44, h: 36 },
  { id: "c-blade", name: "Blade post", skill: "combat", x: 44, y: 300, w: 24, h: 36 },
  { id: "c-shield", name: "Shield rack", skill: "combat", x: 246, y: 300, w: 52, h: 28 },
];

export const COMBAT_SOLIDS: Rect[] = [
  { x: 46, y: 84, w: 12, h: 22 },
  { x: 258, y: 80, w: 24, h: 20 },
  { x: 50, y: 308, w: 10, h: 22 },
  { x: 252, y: 306, w: 40, h: 16 },
];

export function combatPlotAt(px: number, py: number): CombatPlot | null {
  for (let i = COMBAT_PLOTS.length - 1; i >= 0; i--) {
    const p = COMBAT_PLOTS[i]!;
    if (px >= p.x && px < p.x + p.w && py >= p.y && py < p.y + p.h) return p;
  }
  return null;
}

function combatFeet(x: number, y: number): boolean {
  const box = { x: x - 4, y: y - 4, w: 8, h: 5 };
  if (box.y + box.h > 512 || box.y < 40) return true;
  if (box.x < 20 || box.x + box.w > 328) return true;
  for (const s of COMBAT_SOLIDS) if (overlap(box, s)) return true;
  return false;
}

/** Left courtyard tile, level with the gap between the skill and combat portals. */
export const RING_DOOR = { x: 36, y: 488 } as const;
export const RING_ARRIVE = { x: 174, y: 246 } as const;
export const RING_RETURN = { x: 174, y: 336 } as const;

function buildRingStones(): Rect[] {
  const out: Rect[] = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    if (Math.sin(a) > 0.45) continue;
    out.push({
      x: Math.round(174 + Math.cos(a) * 86 - 5),
      y: Math.round(246 + Math.sin(a) * 52 - 4),
      w: 10,
      h: 8,
    });
  }
  return out;
}

export const RING_STONES: Rect[] = buildRingStones();

function ringFeet(x: number, y: number): boolean {
  const box = { x: x - 4, y: y - 4, w: 8, h: 5 };
  if (box.y + box.h > 512 || box.y < 40) return true;
  if (box.x < 20 || box.x + box.w > 328) return true;
  for (const s of RING_STONES) if (overlap(box, s)) return true;
  return false;
}

/** Top of the courtyard, under the Svarga flag. Mirror of the right-hand portals. */
export const ARMOUR_DOOR = { x: 308, y: 272 } as const;
export const ARMOUR_ARRIVE = { x: 174, y: 200 } as const;
export const ARMOUR_RETURN = { x: 174, y: 460 } as const;

/** Top of the courtyard, under the Naraka gate. Mirror of the left-hand portal. */
export const WEAPON_DOOR = { x: 36, y: 272 } as const;
export const WEAPON_ARRIVE = { x: 174, y: 200 } as const;
export const WEAPON_RETURN = { x: 174, y: 460 } as const;

export type SmithPlot = {
  id: string;
  name: string;
  skill: "armour" | "weapon" | "quarry" | "ritual" | "trade" | "enchant" | "tracking" | "foraging" | "survival";
  x: number;
  y: number;
  w: number;
  h: number;
};

export const ARMOUR_PLOTS: SmithPlot[] = [
  { id: "a-plot", name: "Armour plot", skill: "armour", x: 118, y: 250, w: 110, h: 56 },
  { id: "a-stand", name: "Armour stand", skill: "armour", x: 44, y: 72, w: 28, h: 40 },
  { id: "a-helm", name: "Helm form", skill: "armour", x: 46, y: 160, w: 32, h: 28 },
  { id: "a-mail", name: "Mail bench", skill: "armour", x: 236, y: 80, w: 56, h: 24 },
  { id: "a-fit", name: "Fitting post", skill: "armour", x: 250, y: 180, w: 22, h: 36 },
];

export const WEAPON_PLOTS: SmithPlot[] = [
  { id: "w-plot", name: "Weapon plot", skill: "weapon", x: 118, y: 250, w: 110, h: 56 },
  { id: "w-bench", name: "Weapon bench", skill: "weapon", x: 40, y: 72, w: 56, h: 24 },
  { id: "w-blade", name: "Blade stone", skill: "weapon", x: 48, y: 160, w: 36, h: 28 },
  { id: "w-haft", name: "Haft rack", skill: "weapon", x: 240, y: 72, w: 40, h: 36 },
  { id: "w-forge", name: "Forge", skill: "weapon", x: 246, y: 176, w: 36, h: 28 },
];

export const ARMOUR_SOLIDS: Rect[] = [
  { x: 50, y: 80, w: 14, h: 24 },
  { x: 50, y: 164, w: 24, h: 16 },
  { x: 240, y: 84, w: 48, h: 14 },
  { x: 254, y: 186, w: 12, h: 24 },
];

export const WEAPON_SOLIDS: Rect[] = [
  { x: 44, y: 76, w: 48, h: 14 },
  { x: 52, y: 164, w: 28, h: 16 },
  { x: 246, y: 78, w: 28, h: 22 },
  { x: 250, y: 180, w: 28, h: 18 },
];

export function armourPlotAt(px: number, py: number): SmithPlot | null {
  for (let i = ARMOUR_PLOTS.length - 1; i >= 0; i--) {
    const p = ARMOUR_PLOTS[i]!;
    if (px >= p.x && px < p.x + p.w && py >= p.y && py < p.y + p.h) return p;
  }
  return null;
}

export function weaponPlotAt(px: number, py: number): SmithPlot | null {
  for (let i = WEAPON_PLOTS.length - 1; i >= 0; i--) {
    const p = WEAPON_PLOTS[i]!;
    if (px >= p.x && px < p.x + p.w && py >= p.y && py < p.y + p.h) return p;
  }
  return null;
}

function yardFeet(solids: Rect[], x: number, y: number): boolean {
  const box = { x: x - 4, y: y - 4, w: 8, h: 5 };
  if (box.y + box.h > 512 || box.y < 40) return true;
  if (box.x < 20 || box.x + box.w > 328) return true;
  for (const s of solids) if (overlap(box, s)) return true;
  return false;
}

function armourFeet(x: number, y: number): boolean {
  return yardFeet(ARMOUR_SOLIDS, x, y);
}

function weaponFeet(x: number, y: number): boolean {
  return yardFeet(WEAPON_SOLIDS, x, y);
}

/** Left courtyard, between the weapon portal and the combat ring. */
export const QUARRY_DOOR = { x: 36, y: 380 } as const;
export const QUARRY_ARRIVE = { x: 174, y: 200 } as const;
export const QUARRY_RETURN = { x: 174, y: 460 } as const;

/** Right courtyard, between the armour portal and the combat yard. */
export const SANCTUM_DOOR = { x: 308, y: 380 } as const;
export const SANCTUM_ARRIVE = { x: 174, y: 200 } as const;
export const SANCTUM_RETURN = { x: 174, y: 460 } as const;

/** Right courtyard, just above the sanctum portal. */
export const MARKET_DOOR = { x: 308, y: 356 } as const;
export const MARKET_ARRIVE = { x: 174, y: 200 } as const;
export const MARKET_RETURN = { x: 174, y: 460 } as const;

export const QUARRY_PLOTS: SmithPlot[] = [
  { id: "q-plot", name: "Quarry plot", skill: "quarry", x: 118, y: 250, w: 110, h: 56 },
  { id: "q-face", name: "Ore face", skill: "quarry", x: 44, y: 72, w: 36, h: 40 },
  { id: "q-stone", name: "Stone pile", skill: "quarry", x: 46, y: 168, w: 40, h: 28 },
  { id: "q-ingot", name: "Ingot mold", skill: "quarry", x: 236, y: 80, w: 48, h: 22 },
  { id: "q-cart", name: "Ore cart", skill: "quarry", x: 244, y: 176, w: 40, h: 26 },
];

export const SANCTUM_PLOTS: SmithPlot[] = [
  { id: "s-plot", name: "Offering plot", skill: "ritual", x: 118, y: 250, w: 110, h: 56 },
  { id: "s-shrine", name: "Shrine", skill: "ritual", x: 44, y: 68, w: 32, h: 44 },
  { id: "s-bowl", name: "Offering bowl", skill: "ritual", x: 48, y: 168, w: 28, h: 20 },
  { id: "s-incense", name: "Incense", skill: "ritual", x: 244, y: 76, w: 28, h: 32 },
  { id: "s-lamp", name: "Lamp", skill: "ritual", x: 252, y: 176, w: 18, h: 36 },
];

export const MARKET_PLOTS: SmithPlot[] = [
  { id: "m-plot", name: "Trade plot", skill: "trade", x: 118, y: 250, w: 110, h: 56 },
  { id: "m-stall", name: "Stall", skill: "trade", x: 40, y: 68, w: 56, h: 28 },
  { id: "m-crate", name: "Crates", skill: "trade", x: 48, y: 164, w: 32, h: 24 },
  { id: "m-scale", name: "Scale", skill: "trade", x: 240, y: 76, w: 32, h: 28 },
  { id: "m-counter", name: "Counter", skill: "trade", x: 228, y: 172, w: 56, h: 22 },
];

export const QUARRY_SOLIDS: Rect[] = [
  { x: 48, y: 80, w: 28, h: 24 },
  { x: 50, y: 172, w: 32, h: 18 },
  { x: 240, y: 84, w: 40, h: 14 },
  { x: 248, y: 180, w: 32, h: 16 },
];

export const SANCTUM_SOLIDS: Rect[] = [
  { x: 48, y: 76, w: 24, h: 28 },
  { x: 52, y: 172, w: 20, h: 12 },
  { x: 248, y: 80, w: 16, h: 22 },
  { x: 254, y: 184, w: 12, h: 22 },
];

export const MARKET_SOLIDS: Rect[] = [
  { x: 44, y: 72, w: 48, h: 16 },
  { x: 52, y: 168, w: 24, h: 16 },
  { x: 244, y: 80, w: 24, h: 18 },
  { x: 232, y: 176, w: 48, h: 14 },
];

export function quarryPlotAt(px: number, py: number): SmithPlot | null {
  for (let i = QUARRY_PLOTS.length - 1; i >= 0; i--) {
    const p = QUARRY_PLOTS[i]!;
    if (px >= p.x && px < p.x + p.w && py >= p.y && py < p.y + p.h) return p;
  }
  return null;
}

export function sanctumPlotAt(px: number, py: number): SmithPlot | null {
  for (let i = SANCTUM_PLOTS.length - 1; i >= 0; i--) {
    const p = SANCTUM_PLOTS[i]!;
    if (px >= p.x && px < p.x + p.w && py >= p.y && py < p.y + p.h) return p;
  }
  return null;
}

export function marketPlotAt(px: number, py: number): SmithPlot | null {
  for (let i = MARKET_PLOTS.length - 1; i >= 0; i--) {
    const p = MARKET_PLOTS[i]!;
    if (px >= p.x && px < p.x + p.w && py >= p.y && py < p.y + p.h) return p;
  }
  return null;
}

function quarryFeet(x: number, y: number): boolean {
  return yardFeet(QUARRY_SOLIDS, x, y);
}

function sanctumFeet(x: number, y: number): boolean {
  return yardFeet(SANCTUM_SOLIDS, x, y);
}

function marketFeet(x: number, y: number): boolean {
  return yardFeet(MARKET_SOLIDS, x, y);
}

/** Left courtyard, just below the quarry. */
export const ENCHANT_DOOR = { x: 36, y: 430 } as const;
export const ENCHANT_ARRIVE = { x: 174, y: 200 } as const;
export const ENCHANT_RETURN = { x: 174, y: 460 } as const;

/** Left courtyard, just below the enchanting portal and above the combat ring. */
export const WILDS_DOOR = { x: 36, y: 454 } as const;
export const WILDS_ARRIVE = { x: 174, y: 200 } as const;
export const WILDS_RETURN = { x: 174, y: 460 } as const;

export const ENCHANT_PLOTS: SmithPlot[] = [
  { id: "e-plot", name: "Enchant plot", skill: "enchant", x: 118, y: 250, w: 110, h: 56 },
  { id: "e-bind", name: "Binding stone", skill: "enchant", x: 44, y: 72, w: 32, h: 32 },
  { id: "e-rune", name: "Rune table", skill: "enchant", x: 40, y: 164, w: 52, h: 24 },
  { id: "e-oil", name: "Oil dish", skill: "enchant", x: 244, y: 76, w: 28, h: 20 },
  { id: "e-rack", name: "Aether rack", skill: "enchant", x: 248, y: 168, w: 24, h: 36 },
];

export const WILDS_PLOTS: SmithPlot[] = [
  { id: "v-plot", name: "Wilds plot", skill: "survival", x: 118, y: 250, w: 110, h: 56 },
  { id: "v-trail", name: "Game trail", skill: "tracking", x: 44, y: 72, w: 48, h: 28 },
  { id: "v-forage", name: "Forage patch", skill: "foraging", x: 46, y: 164, w: 40, h: 28 },
  { id: "v-camp", name: "Camp", skill: "survival", x: 236, y: 72, w: 40, h: 32 },
  { id: "v-thicket", name: "Thicket", skill: "foraging", x: 244, y: 168, w: 36, h: 36 },
];

export const ENCHANT_SOLIDS: Rect[] = [
  { x: 48, y: 78, w: 24, h: 20 },
  { x: 44, y: 168, w: 44, h: 14 },
  { x: 248, y: 80, w: 20, h: 12 },
  { x: 252, y: 176, w: 16, h: 22 },
];

export const WILDS_SOLIDS: Rect[] = [
  { x: 48, y: 76, w: 40, h: 16 },
  { x: 50, y: 168, w: 32, h: 16 },
  { x: 240, y: 78, w: 32, h: 18 },
  { x: 248, y: 176, w: 28, h: 20 },
];

export function enchantPlotAt(px: number, py: number): SmithPlot | null {
  for (let i = ENCHANT_PLOTS.length - 1; i >= 0; i--) {
    const p = ENCHANT_PLOTS[i]!;
    if (px >= p.x && px < p.x + p.w && py >= p.y && py < p.y + p.h) return p;
  }
  return null;
}

export function wildsPlotAt(px: number, py: number): SmithPlot | null {
  for (let i = WILDS_PLOTS.length - 1; i >= 0; i--) {
    const p = WILDS_PLOTS[i]!;
    if (px >= p.x && px < p.x + p.w && py >= p.y && py < p.y + p.h) return p;
  }
  return null;
}

function enchantFeet(x: number, y: number): boolean {
  return yardFeet(ENCHANT_SOLIDS, x, y);
}

function wildsFeet(x: number, y: number): boolean {
  return yardFeet(WILDS_SOLIDS, x, y);
}

/** Golden ladder-hole, portal-sized, high in the top-left of the courtyard. */
export const DESCENT_DOOR = { x: 100, y: 248 } as const;
export const DESCENT_ARRIVE = { x: 174, y: 150 } as const;
export const DESCENT_RETURN = { x: 174, y: 120 } as const;

/** Blue ladder-hole. Green sits just to its left, red just to its right. */
export const TECH_DOOR = { x: 244, y: 248 } as const;
export const TECH_ARRIVE = { x: 174, y: 118 } as const;
export const TECH_RETURN = { x: 174, y: 86 } as const;
export const TECH_SOLIDS: Rect[] = [
  { x: 28, y: 168, w: 84, h: 26 },
  { x: 236, y: 168, w: 84, h: 26 },
  { x: 112, y: 248, w: 124, h: 22 },
];

function techFeet(x: number, y: number): boolean {
  const box = { x: x - 4, y: y - 4, w: 8, h: 5 };
  if (box.y < 40 || box.y + box.h > 500) return true;
  if (box.x < 20 || box.x + box.w > 328) return true;
  for (const s of TECH_SOLIDS) if (overlap(box, s)) return true;
  return false;
}

/** Red ladder-hole, just to the right of the blue tech portal. */
export const MEDIC_DOOR = { x: 272, y: 248 } as const;
export const MEDIC_ARRIVE = { x: 174, y: 118 } as const;
export const MEDIC_RETURN = { x: 174, y: 86 } as const;
export const MEDIC_SOLIDS: Rect[] = [
  { x: 36, y: 168, w: 64, h: 22 },
  { x: 248, y: 168, w: 64, h: 22 },
  { x: 132, y: 236, w: 84, h: 20 },
];

function medicFeet(x: number, y: number): boolean {
  const box = { x: x - 4, y: y - 4, w: 8, h: 5 };
  if (box.y < 40 || box.y + box.h > 500) return true;
  if (box.x < 20 || box.x + box.w > 328) return true;
  for (const s of MEDIC_SOLIDS) if (overlap(box, s)) return true;
  return false;
}

/** Green ladder-hole, just to the left of the blue tech portal. */
export const BIO_DOOR = { x: 216, y: 248 } as const;
export const BIO_ARRIVE = { x: 174, y: 118 } as const;
export const BIO_RETURN = { x: 174, y: 86 } as const;
export const BIO_SOLIDS: Rect[] = [
  { x: 32, y: 160, w: 72, h: 28 },
  { x: 244, y: 160, w: 72, h: 28 },
  { x: 118, y: 236, w: 112, h: 24 },
];

function bioFeet(x: number, y: number): boolean {
  const box = { x: x - 4, y: y - 4, w: 8, h: 5 };
  if (box.y < 40 || box.y + box.h > 500) return true;
  if (box.x < 20 || box.x + box.w > 328) return true;
  for (const s of BIO_SOLIDS) if (overlap(box, s)) return true;
  return false;
}

/** Indigo ladder-hole, just above the combat yard portal. */
export const LIBRARY_DOOR = { x: 308, y: 458 } as const;
export const LIBRARY_ARRIVE = { x: 174, y: 118 } as const;
export const LIBRARY_RETURN = { x: 174, y: 86 } as const;
export const LIBRARY_SOLIDS: Rect[] = [
  { x: 24, y: 150, w: 18, h: 120 },
  { x: 306, y: 150, w: 18, h: 120 },
  { x: 118, y: 250, w: 112, h: 20 },
];

function libraryFeet(x: number, y: number): boolean {
  const box = { x: x - 4, y: y - 4, w: 8, h: 5 };
  if (box.y < 40 || box.y + box.h > 500) return true;
  if (box.x < 20 || box.x + box.w > 328) return true;
  for (const s of LIBRARY_SOLIDS) if (overlap(box, s)) return true;
  return false;
}

/** Star-silver ladder-hole, just above the quarry portal. */
export const JYOTISH_DOOR = { x: 36, y: 358 } as const;
export const JYOTISH_ARRIVE = { x: 174, y: 118 } as const;
export const JYOTISH_RETURN = { x: 174, y: 86 } as const;
export const JYOTISH_SOLIDS: Rect[] = [
  { x: 40, y: 168, w: 40, h: 22 },
  { x: 268, y: 168, w: 40, h: 22 },
  { x: 132, y: 244, w: 84, h: 18 },
];

function jyotishFeet(x: number, y: number): boolean {
  const box = { x: x - 4, y: y - 4, w: 8, h: 5 };
  if (box.y < 40 || box.y + box.h > 500) return true;
  if (box.x < 20 || box.x + box.w > 328) return true;
  for (const s of JYOTISH_SOLIDS) if (overlap(box, s)) return true;
  return false;
}

/** Lotus ladder-hole on the Svarga tile, under the pond. */
export const MANTRA_DOOR = { x: 178, y: 340 } as const;
export const MANTRA_ARRIVE = { x: 174, y: 118 } as const;
export const MANTRA_RETURN = { x: 174, y: 86 } as const;
export const MANTRA_SOLIDS: Rect[] = [{ x: 160, y: 210, w: 28, h: 18 }];

function mantraFeet(x: number, y: number): boolean {
  const box = { x: x - 4, y: y - 4, w: 8, h: 5 };
  if (box.y < 40 || box.y + box.h > 500) return true;
  if (box.x < 20 || box.x + box.w > 328) return true;
  for (const s of MANTRA_SOLIDS) if (overlap(box, s)) return true;
  return false;
}

/** Floor 332. A triangle the shape of the cube's ship, point above a band of space. */
export const FLOOR_H = 1560;
const FLOOR_TIP = 22;
const FLOOR_POINT = FLOOR_H - 56;

export function floorEdge(y: number): number {
  if (y < 0 || y >= FLOOR_POINT) return 0;
  const t = y / (FLOOR_POINT - 1);
  return FLOOR_TIP + ((WORLD_W - 1) / 2 - FLOOR_TIP) * (1 - t);
}

export function onFloor332(x: number, y: number): boolean {
  const edge = floorEdge(y);
  if (edge < 16) return false;
  return Math.abs(x - (WORLD_W - 1) / 2) <= edge - 11;
}

function stairFeet(x: number, y: number): boolean {
  return !onFloor332(x, y);
}

export function ensureAuto(s: GameState): void {
  if (typeof s.auto !== "boolean") s.auto = true;
}

export function onPortal(x: number, y: number): boolean {
  if (realmWing >= 2) return false;
  // The picture is wider than this. The body stops on the stone. The step in front, on the sidewalk and in the courtyard, stays open.
  const gates: Array<{ x: number; half: number; top: number }> = [];
  if (realmWing !== -1) gates.push({ x: 40, half: 30, top: 124 });
  if (realmWing !== 1) gates.push({ x: 308, half: 26, top: 116 });
  for (const g of gates) {
    if (Math.abs(x - g.x) <= g.half && y >= g.top && y <= 230) return true;
  }
  return false;
}

export function ensureWing(s: GameState): void {
  if (s.wing !== -1 && (s.wing < 0 || s.wing > 18)) s.wing = 0;
  if (!s.cross || typeof s.cross.t !== "number") s.cross = null;
}

export function lifeLabel(life: Life): string {
  const mood = Math.round(life.mood);
  if (life.hunger > 60) return `Mood ${mood} · Hungry`;
  if (life.thirst > 60) return `Mood ${mood} · Thirsty`;
  if (life.dirt > 60) return `Mood ${mood} · Grimy`;
  if (life.mood < 40) return `Mood ${mood} · Low`;
  return `Mood ${mood}`;
}

export function skyLabel(s: { weather?: Sky; wet?: number }): string {
  if (s.weather === "storm") return "Thunderstorm";
  if (s.weather === "rain") return "Rain";
  if ((s.wet ?? 0) > 0.35) return "Wet ground";
  return "Clear";
}

export function ensureWeather(s: GameState): void {
  if (s.weather !== "clear" && s.weather !== "rain" && s.weather !== "storm") s.weather = "clear";
  if (typeof s.weatherLeft !== "number") s.weatherLeft = 24 * (DAY_LEN / 720);
  if (typeof s.wet !== "number") s.wet = 0;
  if (typeof s.flash !== "number") s.flash = 0;
  if (typeof s.bolts !== "number") s.bolts = 0;
}

/** Real seconds from 6am to 10pm. Weather spells use the same pace. */
export const DAY_LEN = 960;

export function hourOf(time: number): number {
  return 6 + time * 16;
}

export function isNight(time: number): boolean {
  return hourOf(time) >= 20;
}

export function clockLabel(time: number): string {
  const mins = Math.floor(6 * 60 + time * 16 * 60);
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const ap = h >= 12 ? "pm" : "am";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${m.toString().padStart(2, "0")} ${ap}`;
}

function make(next: { n: number }, defId: string, qty = 1): Item {
  const d = DEFS[defId];
  next.n += 1;
  const it: Item = {
    id: "i" + next.n,
    defId,
    qty,
    quality: d.quality,
    floor: d.floor,
    floorMax: d.floor,
  };
  if (d.waterMax) it.water = 0;
  if (d.kind === "container") it.contents = Array.from({ length: 8 }, () => null);
  return it;
}

export function createGame(): GameState {
  setRealm(0);
  const next = { n: 0 };
  const can = make(next, "can");
  const shovel = make(next, "shovel");
  const scythe = make(next, "scythe");
  const axe = make(next, "axe");
  const hammer = make(next, "hammer");
  const rod = make(next, "rod");
  const loaf = make(next, "loaf");
  const packbag = make(next, "backpack");
  const coins = make(next, "coin", 2);
  const seedT = make(next, "seed_tomato", 6);
  const seedC = make(next, "seed_cabbage", 4);
  const seedG = make(next, "seed_greens", 4);
  const hood = make(next, "hood");
  const cloak = make(next, "cloak");
  const pants = make(next, "pants");
  const boots = make(next, "boots");
  const pack: (Item | null)[] = Array.from({ length: PACK_SLOTS }, () => null);
  pack[0] = can;
  pack[1] = shovel;
  pack[2] = scythe;
  pack[3] = axe;
  pack[4] = hammer;
  pack[5] = rod;
  pack[6] = loaf;
  pack[8] = packbag;
  pack[9] = coins;
  pack[10] = seedT;
  pack[11] = seedC;
  pack[12] = seedG;
  pack[13] = hood;
  pack[14] = cloak;
  pack[15] = pants;
  pack[16] = boots;
  return {
    version: 1,
    x: FARM_START.x,
    y: FARM_START.y,
    dir: "n",
    speed: 0,
    stamina: 100,
    downed: false,
    day: 1,
    time: 0.08,
    season: "Spring",
    clock: 0,
    pack,
    hotbar: [can.id, shovel.id, scythe.id, axe.id, hammer.id, rod.id, loaf.id, null],
    selected: 2,
    activeId: scythe.id,
    body: emptyBody(),
    vault: Array.from({ length: VAULT_SLOTS }, () => null),
    purse: 0,
    plots: freshPlots(),
    flowers: defaultFlowers(),
    animals: [
      { id: "cow", kind: "cow", name: "Cow", x: HERD_HOME.cow.x, y: HERD_HOME.cow.y, dir: "e", fed: false, ready: false, tx: HERD_HOME.cow.x, ty: HERD_HOME.cow.y, pause: 1.6 },
      { id: "rooster", kind: "rooster", name: "Rooster", x: HERD_HOME.rooster.x, y: HERD_HOME.rooster.y, dir: "n", fed: false, ready: false, tx: HERD_HOME.rooster.x, ty: HERD_HOME.rooster.y, pause: 0.5 },
      { id: "goat", kind: "goat", name: "Goat", x: HERD_HOME.goat.x, y: HERD_HOME.goat.y, dir: "w", fed: false, ready: false, tx: HERD_HOME.goat.x, ty: HERD_HOME.goat.y, pause: 0.9 },
    ],
    branches: [],
    structures: [
      { id: "gate", name: "Fence gate", quality: 38, floor: 14, floorMax: 30 },
      { id: "shed", name: "House door", quality: 60, floor: 22, floorMax: 40 },
      { id: "bench", name: "Workbench", quality: 44, floor: 12, floorMax: 26 },
    ],
    ground: [],
    cat: { x: CAT_HOME.x, y: CAT_HOME.y, face: 1, petCd: 0, tx: CAT_HOME.x, ty: CAT_HOME.y, pause: 2.2, mode: "sit", look: "s" },
    birds: freshBirds(),
    reaper: freshReaper(),
    hand: freshHand(),
    stats: { harvested: 0, cooked: 0, floorEarned: 0, gateRepaired: false, boughtTool: false, daysSlept: 0 },
    nextId: next.n,
    rng: 0xa55a1,
    action: null,
    pending: null,
    message: "Tomato, cauliflower, and peas are growing on the three beds.",
    summary: false,
    weather: "clear",
    weatherLeft: 28 * (DAY_LEN / 720),
    wet: 0.15,
    flash: 0,
    bolts: 0,
    life: freshLife(),
    auto: true,
    fishing: 0,
    magic: MAGIC_MAX,
    mana: MANA_MAX,
    health: 100,
    skills: freshSkills(),
    rune: 0,
    cast: null,
    wing: 0,
    cross: null,
    courtSpawn: 5,
    handPlace: 3,
    goatPen: 1,
    xiang64: freshXiang64(),
    maid: freshMaid(),
    stable: freshStable(),
    farmRack: freshFarmRack(),
  };
}
