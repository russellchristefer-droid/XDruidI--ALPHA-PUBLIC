import { tileBlocks } from "./tiles";
export const WORLD_W = 347;
export const WORLD_H = 960;
/** The frame that fits on screen. The yard stays this size; the meadow is below it. */
export const VIEW_W = 347;
export const VIEW_H = 194;
/** South of the new field. Under this line is the void. */
export const MEADOW = { x: 0, y: 528, w: 347, h: 432 } as const;
export const TILE = 8;
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
    icon: T(64, 32),
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
    name: "Pond fish",
    kind: "product",
    weight: 0.35,
    floor: 8,
    quality: 40,
    stack: true,
    stamina: 8,
    icon: V(64, 32),
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

export type Face = "ok" | "happy" | "tired" | "ill" | "need" | "heart";

export type Life = {
  hunger: number;
  thirst: number;
  dirt: number;
  mood: number;
  face: Face;
  emote: number;
  errand: "eat" | "drink" | "wash" | "rest" | "look" | null;
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
    tx: 78,
    ty: 136,
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
  if (typeof life.tx !== "number") life.tx = 78;
  if (typeof life.ty !== "number") life.ty = 136;
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
    route?: number[];
    intent?: "court" | "drink" | "yard" | "follow";
  };
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
  magic: number;
  cast: Cast | null;
  /** -1 west copy, 0 home, 1 east copy. */
  wing: -1 | 0 | 1;
  /** A portal crossing. The land changes halfway through the fade. */
  cross: {
    t: number;
    wing: -1 | 0 | 1;
    x: number;
    y: number;
    dir: Dir;
    name: string;
    moved: boolean;
  } | null;
  uiEvent?: { panel?: PanelId; save?: boolean; summary?: boolean };
};

export type PanelId = "pack" | "body" | "vault" | "craft" | "map" | "pause" | "summary" | "controls" | "backpack";

export type Rect = { x: number; y: number; w: number; h: number };

export const SOLIDS: Rect[] = [
  { x: 14, y: 22, w: 312, h: 12 },
  { x: 14, y: 22, w: 12, h: 146 },
  { x: 14, y: 154, w: 142, h: 14 },
  { x: 186, y: 154, w: 140, h: 14 },
  { x: 116, y: 74, w: 40, h: 22 },
  { x: 164, y: 62, w: 30, h: 38 },
  { x: 112, y: 16, w: 96, h: 60 },
  { x: 198, y: 78, w: 16, h: 16 },
  { x: 196, y: 98, w: 26, h: 18 },
  { x: 98, y: 36, w: 42, h: 16 },
  { x: 44, y: 70, w: 20, h: 16 },
  { x: 228, y: 78, w: 66, h: 64 },
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
  { id: "gate", name: "Fence gate", kind: "gate", x: 156, y: 146, w: 34, h: 22 },
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

export const FARMER_HOME = { x: 172, y: 132 } as const;

export function placeFarmer(s: GameState): void {
  if (s.y >= MEADOW.y - 16) {
    s.x = FARMER_HOME.x;
    s.y = FARMER_HOME.y;
    if (s.life) {
      s.life.tx = FARMER_HOME.x;
      s.life.ty = FARMER_HOME.y;
      s.life.route = [];
      s.life.pause = 0.4;
    }
    return;
  }
  if (s.life && s.life.ty >= MEADOW.y - 16) {
    s.life.tx = s.x;
    s.life.ty = s.y;
    s.life.route = [];
  }
}

export function placeHerd(s: GameState): void {
  const home = {
    cow: { x: 80, y: 112 },
    rooster: { x: 188, y: 136 },
    goat: { x: 304, y: 112 },
  } as const;
  for (const a of s.animals) {
    const spot = home[a.kind];
    if (!spot || a.y < MEADOW.y - 12) continue;
    a.x = spot.x;
    a.y = spot.y;
    a.tx = spot.x;
    a.ty = spot.y;
    a.pause = a.kind === "cow" ? 1.4 : 0.5;
  }
  if (s.cat && s.cat.y >= MEADOW.y - 12) {
    s.cat.x = 274;
    s.cat.y = 148;
    s.cat.tx = 274;
    s.cat.ty = 148;
    s.cat.mode = "sit";
    s.cat.pause = 1.2;
  }
  placeFarmer(s);
}

/** Open water on the farm pond. */
export const FISH_WATER: Rect = { x: 118, y: 79, w: 32, h: 17 };

export type SeamRock = { x: number; y: number; i: number; s: number };
/** Nothing sits in the void. */
export const SEAM_ROCKS: SeamRock[] = [];

let realmWing: -1 | 0 | 1 = 0;

/** Farm collision stays on the homestead. Svarga and Naraka have their own ground. */
export function setRealm(wing: -1 | 0 | 1): void {
  realmWing = wing === -1 || wing === 1 ? wing : 0;
}

function realmFeet(x: number, y: number): boolean {
  const box = { x: x - 4, y: y - 4, w: 8, h: 5 };
  if (box.y + box.h > MEADOW.y) return true;
  if (box.x < 22 || box.x + box.w > 330) return true;
  if (box.y < 48) return true;
  if (onPortal(x, y)) return true;
  if (realmWing === 1) {
    if (overlap(box, { x: 128, y: 52, w: 112, h: 72 })) return true;
    if (overlap(box, { x: 158, y: 352, w: 64, h: 44 })) return true;
    if (overlap(box, { x: 56, y: 156, w: 58, h: 24 })) return true;
  } else {
    const onBridge = y > 196 && y < 224;
    if (!onBridge && overlap(box, { x: 214, y: 48, w: 34, h: 460 })) return true;
    if (overlap(box, { x: 78, y: 270, w: 22, h: 16 })) return true;
    if (overlap(box, { x: 36, y: 372, w: 78, h: 52 })) return true;
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

export function footBlocked(x: number, y: number): boolean {
  if (realmWing !== 0) return realmFeet(x, y);
  const box = { x: x - 4, y: y - 4, w: 8, h: 5 };
  if (box.y + box.h > MEADOW.y) return true;
  if (box.x < 22 || box.x + box.w > 330) return true;
  if (box.y < 36) return true;
  const onSouthPath = x > 156 && x < 186;
  if (y > 170 && y < 184 && !onSouthPath) return true;
  if (overlap(box, { x: 168, y: 160, w: 8, h: 24 })) return true;
  for (const s of SOLIDS) if (overlap(box, s)) return true;
  for (const s of PROP_SOLIDS) if (overlap(box, s)) return true;
  for (const s of tileBlocks()) if (overlap(box, s)) return true;
  for (const r of SEAM_ROCKS) {
    const w = 14 * r.s;
    const h = 8 * r.s;
    if (overlap(box, { x: r.x - w / 2, y: r.y - h, w, h })) return true;
  }
  if (overlap(box, FISH_WATER)) return true;
  if (onPortal(x, y)) return true;
  if (extraFeet(x, y)) return true;
  return false;
}

export function ensureFishing(s: GameState): void {
  if (typeof s.fishing !== "number") s.fishing = 0;
}

export function ensureMagic(s: GameState): void {
  if (typeof s.magic !== "number" || Number.isNaN(s.magic)) s.magic = 0;
  const spell = s.cast?.spell;
  if (!s.cast || !SPELLS.includes(spell as SpellId) || typeof s.cast.t !== "number") s.cast = null;
}

export function ensureAuto(s: GameState): void {
  if (typeof s.auto !== "boolean") s.auto = true;
}

export function onPortal(x: number, y: number): boolean {
  for (const cx of [40, 308]) {
    const dx = x - cx;
    const dy = y - 202;
    if ((dx * dx) / 144 + (dy * dy) / 400 < 1) return true;
  }
  return false;
}

export function ensureWing(s: GameState): void {
  if (s.wing !== -1 && s.wing !== 0 && s.wing !== 1) s.wing = 0;
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
  if (typeof s.weatherLeft !== "number") s.weatherLeft = 24;
  if (typeof s.wet !== "number") s.wet = 0;
  if (typeof s.flash !== "number") s.flash = 0;
  if (typeof s.bolts !== "number") s.bolts = 0;
}

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
    x: FARMER_HOME.x,
    y: FARMER_HOME.y,
    dir: "s",
    speed: 0,
    stamina: 100,
    downed: false,
    day: 1,
    time: 0.08,
    season: "Spring",
    clock: 0,
    pack,
    hotbar: [can.id, shovel.id, scythe.id, axe.id, hammer.id, rod.id, loaf.id, null],
    selected: 0,
    activeId: can.id,
    body: emptyBody(),
    vault: Array.from({ length: VAULT_SLOTS }, () => null),
    purse: 0,
    plots: freshPlots(),
    flowers: defaultFlowers(),
    animals: [
      { id: "cow", kind: "cow", name: "Cow", x: 80, y: 112, dir: "s", fed: false, ready: false, tx: 80, ty: 112, pause: 1.4 },
      { id: "rooster", kind: "rooster", name: "Rooster", x: 188, y: 136, dir: "e", fed: false, ready: false, tx: 188, ty: 136, pause: 0.4 },
      { id: "goat", kind: "goat", name: "Goat", x: 304, y: 112, dir: "w", fed: false, ready: false, tx: 304, ty: 112, pause: 0.6 },
    ],
    branches: [],
    structures: [
      { id: "gate", name: "Fence gate", quality: 38, floor: 14, floorMax: 30 },
      { id: "shed", name: "House door", quality: 60, floor: 22, floorMax: 40 },
      { id: "bench", name: "Workbench", quality: 44, floor: 12, floorMax: 26 },
    ],
    ground: [],
    cat: { x: 274, y: 148, face: -1, petCd: 0, tx: 274, ty: 148, pause: 2.2, mode: "sit" },
    stats: { harvested: 0, cooked: 0, floorEarned: 0, gateRepaired: false, boughtTool: false, daysSlept: 0 },
    nextId: next.n,
    rng: 0xa55a1,
    action: null,
    pending: null,
    message: "Tomato, cauliflower, and peas are growing on the three beds.",
    summary: false,
    weather: "clear",
    weatherLeft: 28,
    wet: 0.15,
    flash: 0,
    bolts: 0,
    life: freshLife(),
    auto: true,
    fishing: 0,
    magic: 0,
    cast: null,
    wing: 0,
    cross: null,
  };
}
