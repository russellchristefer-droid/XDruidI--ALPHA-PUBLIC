import { BEDS, ensureFarmRack, type FarmRack, type GameState } from "../content.ts";

/** Buttons sit on the floating rock under the courtyard. The row bows with the rock, mirrored. */
const RACK_LIP = 528;
const RACK_SIZE = 16;
const RACK_GAP = 5;

function rackSpan(): number {
  return 6 * RACK_SIZE + 5 * RACK_GAP;
}

function rackLeft(): number {
  return Math.round((347 - rackSpan()) / 2);
}

/** Center of the row hangs lower, where the rock is thickest. The ends match. */
function rackButton(i: number): { x: number; y: number; w: number; h: number } {
  const mid = 2.5;
  const along = 1 - Math.abs(i - mid) / mid;
  return {
    x: rackLeft() + i * (RACK_SIZE + RACK_GAP),
    y: RACK_LIP + 14 + Math.round(along * 8),
    w: RACK_SIZE,
    h: RACK_SIZE,
  };
}

const RAMP = {
  grass: [
    [86, 98, 42],
    [104, 114, 50],
    [122, 128, 58],
    [140, 142, 68],
  ],
  dirt: [
    [108, 80, 42],
    [132, 100, 52],
    [154, 120, 62],
    [176, 140, 76],
  ],
  bed: [
    [78, 56, 30],
    [104, 76, 40],
    [126, 96, 52],
    [92, 68, 34],
  ],
} as const;

type Kind = "keep" | "grass" | "dirt" | "bed";

type Pics = {
  yard?: HTMLImageElement;
  landGrass?: HTMLImageElement;
  landSoil?: HTMLImageElement;
  landTilled?: HTMLImageElement;
  occlude?: HTMLImageElement;
};

const KEEP = [
  { x: 86, y: 26, w: 62, h: 34 },
  { x: 108, y: 64, w: 54, h: 38 },
  { x: 154, y: 54, w: 48, h: 54 },
  { x: 30, y: 56, w: 40, h: 34 },
  { x: 184, y: 84, w: 42, h: 34 },
  { x: 188, y: 104, w: 46, h: 30 },
  { x: 228, y: 74, w: 96, h: 86 },
  { x: 238, y: 76, w: 60, h: 30 },
  { x: 72, y: 68, w: 24, h: 42 },
  { x: 98, y: 68, w: 24, h: 42 },
  { x: 198, y: 138, w: 66, h: 20 },
];

let kinds: Uint8Array | null = null;
const plates = new Map<number, HTMLCanvasElement>();

function inside(x: number, y: number, r: { x: number; y: number; w: number; h: number }): boolean {
  return x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;
}

function readPixels(img: HTMLImageElement): ImageData | null {
  if (!img.naturalWidth) return null;
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d", { willReadFrequently: true });
  if (!g) return null;
  g.drawImage(img, 0, 0);
  return g.getImageData(0, 0, c.width, c.height);
}

function lumAt(data: ImageData, x: number, y: number): number {
  const w = data.width;
  const h = data.height;
  const ix = ((x % w) + w) % w;
  const iy = ((y % h) + h) % h;
  const i = (iy * w + ix) * 4;
  const d = data.data;
  return (d[i]! + d[i + 1]! + d[i + 2]!) / 3;
}

function buildKinds(yard: ImageData, occlude: ImageData | null): Uint8Array {
  const w = 347;
  const h = 192;
  const out = new Uint8Array(w * h);
  const src = yard.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (x < 8 || x > 338 || y < 8 || y > 183) continue;
      if (KEEP.some((r) => inside(x, y, r))) continue;
      if (occlude && occlude.data[(y * occlude.width + x) * 4 + 3]! > 40) continue;
      const p = i * 4;
      const r = src[p]!;
      const g = src[p + 1]!;
      const b = src[p + 2]!;
      const span = Math.max(r, g, b) - Math.min(r, g, b);
      const dirt = r > g + 6 && r > 90 && r < 175 && b < 105 && g > 55 && r - b > 28;
      const grass = !dirt && g >= r - 6 && r >= 90 && r <= 165 && g >= 90 && g <= 165 && b >= 35 && b <= 95 && span < 58;
      if (!dirt && !grass) continue;
      const bed = BEDS.some((bed) => x >= bed.x0 && x < bed.x0 + bed.w && y >= bed.y0 && y < bed.y0 + bed.h);
      out[i] = bed ? 3 : dirt ? 2 : 1;
    }
  }
  return out;
}

function tint(kind: Exclude<Kind, "keep">, lum: number, wobble: number): [number, number, number] {
  const ramp = RAMP[kind];
  const t = Math.max(0, Math.min(3, Math.floor(lum / 64)));
  const c = ramp[t]!;
  return [
    Math.max(0, Math.min(255, c[0] + wobble)),
    Math.max(0, Math.min(255, c[1] + wobble)),
    Math.max(0, Math.min(255, c[2] + Math.floor(wobble / 2))),
  ];
}

function hash(seed: number, x: number, y: number): number {
  let n = (seed ^ Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263)) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return n >>> 0;
}

/** A generated upper farm. Seed 0 is the painted yard, unchanged. */
export function farmPlate(pics: Pics, seed: number): HTMLCanvasElement | null {
  if (!seed) return null;
  const hit = plates.get(seed);
  if (hit) return hit;
  const yardImg = pics.yard;
  if (!yardImg || yardImg.naturalWidth < 347) return null;
  const yard = readPixels(yardImg);
  const grass = pics.landGrass ? readPixels(pics.landGrass) : null;
  const soil = pics.landSoil ? readPixels(pics.landSoil) : null;
  const tilled = pics.landTilled ? readPixels(pics.landTilled) : null;
  if (!yard || !grass || !soil || !tilled) return null;
  const occ = pics.occlude && pics.occlude.naturalWidth >= 347 ? readPixels(pics.occlude) : null;
  if (!kinds) kinds = buildKinds(yard, occ);
  const canvas = document.createElement("canvas");
  canvas.width = 347;
  canvas.height = 192;
  const g = canvas.getContext("2d");
  if (!g) return null;
  g.drawImage(yardImg, 0, 0, 347, 192, 0, 0, 347, 192);
  const frame = g.getImageData(0, 0, 347, 192);
  const d = frame.data;
  const ox = seed & 15;
  const oy = (seed >>> 4) & 15;
  for (let y = 8; y <= 183; y++) {
    for (let x = 8; x <= 338; x++) {
      const k = kinds[y * 347 + x] ?? 0;
      if (!k) continue;
      const tile = k === 3 ? tilled : k === 2 ? soil : grass;
      const kind: Exclude<Kind, "keep"> = k === 3 ? "bed" : k === 2 ? "dirt" : "grass";
      const wobble = ((hash(seed, x >> 3, y >> 3) & 7) - 3);
      const [r, gv, b] = tint(kind, lumAt(tile, x + ox, y + oy), wobble);
      const p = (y * 347 + x) * 4;
      d[p] = r;
      d[p + 1] = gv;
      d[p + 2] = b;
      d[p + 3] = 255;
    }
  }
  g.putImageData(frame, 0, 0);
  plates.set(seed, canvas);
  return canvas;
}

export function farmSeed(s: GameState): number {
  const rack = ensureFarmRack(s);
  return rack.seeds[rack.at] ?? 0;
}

function buttonBox(i: number): { x: number; y: number; w: number; h: number } {
  return rackButton(i);
}

/** 0 green, 1 blue, 2 yellow, 3-5 purple. -1 if the point misses the rack. */
export function farmRackAt(x: number, y: number): number {
  for (let i = 0; i < 6; i++) {
    const b = buttonBox(i);
    if (x >= b.x && y >= b.y && x < b.x + b.w && y < b.y + b.h) return i;
  }
  return -1;
}

export function pressFarmRack(s: GameState, which: number): string {
  const rack = ensureFarmRack(s);
  if (which === 0) return generateFarm(rack);
  if (which === 1) return stepFarm(rack, -1);
  if (which === 2) return stepFarm(rack, 1);
  if (which >= 3 && which <= 5) return pinFarm(rack, which - 3);
  return "";
}

function generateFarm(rack: FarmRack): string {
  const seed = (Math.floor(Math.random() * 0x7fffffff) || 1) >>> 0;
  rack.seeds = rack.seeds.slice(0, rack.at + 1);
  rack.seeds.push(seed);
  rack.at = rack.seeds.length - 1;
  return "A new farm. The campfire, pond, beds, and trees stayed.";
}

function stepFarm(rack: FarmRack, dir: -1 | 1): string {
  const next = rack.at + dir;
  if (next < 0) return "This is the earliest farm.";
  if (next >= rack.seeds.length) return "No later farm.";
  rack.at = next;
  return rack.seeds[next] === 0 ? "The original farm." : dir < 0 ? "The earlier farm." : "The next farm.";
}

function pinFarm(rack: FarmRack, slot: number): string {
  const saved = rack.pins[slot];
  if (saved == null) {
    rack.pins[slot] = rack.seeds[rack.at] ?? 0;
    return `Pinned this farm in slot ${slot + 1}.`;
  }
  let i = rack.seeds.indexOf(saved);
  if (i < 0) {
    rack.seeds.push(saved);
    i = rack.seeds.length - 1;
  }
  rack.at = i;
  return saved === 0 ? `Slot ${slot + 1} is the original farm.` : `Slot ${slot + 1}.`;
}

function pix(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function stoneButton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fill: string,
  lite: string,
  shade: string,
  live: boolean,
): void {
  const ink = "#100c08";
  ctx.fillStyle = "#060403";
  ctx.fillRect(x + 1, y + 15, 14, 3);
  ctx.fillStyle = ink;
  ctx.fillRect(x, y, 16, 15);
  ctx.fillStyle = "#2a2016";
  ctx.fillRect(x + 1, y + 1, 14, 13);
  ctx.fillStyle = live ? fill : shade;
  ctx.fillRect(x + 2, y + 2, 12, 10);
  ctx.fillStyle = live ? lite : fill;
  ctx.fillRect(x + 2, y + 2, 12, 2);
  ctx.fillRect(x + 2, y + 2, 2, 8);
  ctx.fillStyle = shade;
  ctx.fillRect(x + 3, y + 10, 11, 2);
  ctx.fillRect(x + 12, y + 3, 2, 8);
  ctx.fillStyle = "#1a140e";
  ctx.fillRect(x + 4, y + 13, 8, 1);
}

function shelfY(x: number): number {
  const left = rackButton(0);
  const right = rackButton(5);
  const span = right.x + right.w - left.x;
  const u = span <= 0 ? 0.5 : (x - left.x) / span;
  const mid = Math.abs(u - 0.5) * 2;
  return RACK_LIP + 22 - Math.round((1 - mid) * 8);
}

export function drawFarmRack(ctx: CanvasRenderingContext2D, s: GameState): void {
  if ((s.wing ?? 0) !== 0) return;
  const rack = ensureFarmRack(s);
  const left = rackButton(0);
  const right = rackButton(5);
  for (let x = left.x - 4; x < right.x + right.w + 4; x++) {
    const y = shelfY(x);
    ctx.fillStyle = "#1a120c";
    ctx.fillRect(x, y + 2, 1, 3);
    ctx.fillStyle = x % 4 === 0 ? "#6a5034" : "#4a3824";
    ctx.fillRect(x, y, 1, 2);
    ctx.fillStyle = "#c8b48a";
    ctx.fillRect(x, y, 1, 1);
  }
  const faces: Array<[string, string, string, boolean]> = [
    ["#3c6e28", "#d4ee78", "#1c3810", true],
    ["#24508c", "#b8dcff", "#122848", rack.at > 0],
    ["#e6c25a", "#fff6c8", "#6a4810", rack.at < rack.seeds.length - 1],
    ["#6e3c92", "#f0d4ff", "#341848", rack.pins[0] != null],
    ["#6e3c92", "#f0d4ff", "#341848", rack.pins[1] != null],
    ["#6e3c92", "#f0d4ff", "#341848", rack.pins[2] != null],
  ];
  for (let i = 0; i < 6; i++) {
    const b = rackButton(i);
    const face = faces[i]!;
    const live = i < 3 ? face[3] : true;
    stoneButton(ctx, b.x, b.y, face[0], face[1], face[2], live);
    const cx = b.x + 8;
    const cy = b.y + 7;
    if (i === 0) {
      pix(ctx, cx, cy + 3, "#102008");
      pix(ctx, cx, cy + 2, "#102008");
      pix(ctx, cx, cy + 1, "#214018");
      pix(ctx, cx, cy, "#214018");
      pix(ctx, cx - 2, cy - 1, "#d4ee78");
      pix(ctx, cx - 1, cy - 1, "#d4ee78");
      pix(ctx, cx + 1, cy - 1, "#d4ee78");
      pix(ctx, cx + 2, cy - 1, "#d4ee78");
      pix(ctx, cx, cy - 2, "#fff6c8");
      pix(ctx, cx - 1, cy + 3, "#6a5030");
      pix(ctx, cx + 1, cy + 3, "#6a5030");
    } else if (i === 1) {
      const ink = live ? "#f4fbff" : "#8aa4c4";
      pix(ctx, cx - 3, cy, ink);
      pix(ctx, cx - 2, cy - 1, ink);
      pix(ctx, cx - 2, cy + 1, ink);
      pix(ctx, cx - 1, cy - 2, ink);
      pix(ctx, cx - 1, cy + 2, ink);
      pix(ctx, cx, cy - 3, ink);
      pix(ctx, cx, cy + 3, ink);
      pix(ctx, cx + 1, cy - 1, ink);
      pix(ctx, cx + 1, cy + 1, ink);
    } else if (i === 2) {
      const ink = live ? "#3a2408" : "#8a7040";
      pix(ctx, cx + 3, cy, ink);
      pix(ctx, cx + 2, cy - 1, ink);
      pix(ctx, cx + 2, cy + 1, ink);
      pix(ctx, cx + 1, cy - 2, ink);
      pix(ctx, cx + 1, cy + 2, ink);
      pix(ctx, cx, cy - 3, ink);
      pix(ctx, cx, cy + 3, ink);
      pix(ctx, cx - 1, cy - 1, ink);
      pix(ctx, cx - 1, cy + 1, ink);
    } else {
      const n = i - 2;
      const ink = face[3] ? "#fff6ff" : "#c8a4dc";
      const origin = cx - (n - 1);
      for (let k = 0; k < n; k++) {
        pix(ctx, origin + k * 2, cy, ink);
        pix(ctx, origin + k * 2, cy - 1, ink);
        pix(ctx, origin + k * 2, cy + 1, face[3] ? "#e2b657" : "#6e3c92");
      }
      if (face[3]) pix(ctx, cx, cy - 4, "#e2b657");
    }
  }
}
