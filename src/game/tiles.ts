import { WORLD_H, WORLD_W, overlap, type Rect } from "./content";

export const GRID = 8;
export const TILE_SIZE = 32;

export type TileId = "grass" | "soil" | "tilled" | "water" | "path";
export type PaintId = TileId | "erase";

export type Stamp = { x: number; y: number; id: TileId };

const KEY = "assay-tiles-v1";

let stamps: Stamp[] = [];
let blocks: Rect[] = [];

export function tileStamps(): Stamp[] {
  return stamps;
}

export function tileBlocks(): Rect[] {
  return blocks;
}

export function loadTileLayer(): void {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null") as { stamps?: Stamp[]; blocks?: Rect[] } | null;
    if (raw?.stamps) stamps = raw.stamps.filter((s) => s && typeof s.x === "number");
    if (raw?.blocks) blocks = raw.blocks.filter((b) => b && b.w > 0 && b.h > 0);
  } catch {
    stamps = [];
    blocks = [];
  }
}

function persist(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify({ stamps, blocks }));
}

export function snapRect(a: { x: number; y: number }, b: { x: number; y: number }): Rect {
  const x0 = Math.floor(Math.min(a.x, b.x) / GRID) * GRID;
  const y0 = Math.floor(Math.min(a.y, b.y) / GRID) * GRID;
  const x1 = Math.ceil(Math.max(a.x, b.x) / GRID) * GRID;
  const y1 = Math.ceil(Math.max(a.y, b.y) / GRID) * GRID;
  const x = Math.max(0, Math.min(WORLD_W - GRID, x0));
  const y = Math.max(0, Math.min(WORLD_H - GRID, y0));
  const w = Math.max(GRID, Math.min(WORLD_W, x1) - x);
  const h = Math.max(GRID, Math.min(WORLD_H, y1) - y);
  return { x, y, w, h };
}

export function paintRect(rect: Rect, id: PaintId, write = true): void {
  stamps = stamps.filter((s) => !overlap({ x: s.x, y: s.y, w: TILE_SIZE, h: TILE_SIZE }, rect));
  if (id !== "erase") {
    const x0 = Math.floor(rect.x / TILE_SIZE) * TILE_SIZE;
    const y0 = Math.floor(rect.y / TILE_SIZE) * TILE_SIZE;
    for (let y = y0; y < rect.y + rect.h; y += TILE_SIZE) {
      for (let x = x0; x < rect.x + rect.w; x += TILE_SIZE) {
        if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) continue;
        stamps.push({ x, y, id });
      }
    }
  }
  if (write) persist();
}

export function flushTiles(): void {
  persist();
}

export function blockRect(rect: Rect, blocked: boolean): void {
  blocks = blocks.filter((b) => !overlap(b, rect));
  if (blocked) blocks.push({ x: rect.x, y: rect.y, w: rect.w, h: rect.h });
  persist();
}

export type SelMode = "rect" | "tile" | "cell" | "row" | "column" | "yard" | "meadow" | "world" | "here" | "sprite" | "select" | "erase" | "move";

export function pickRect(kind: "tile" | "cell" | "row" | "column", w: { x: number; y: number }): Rect {
  if (kind === "tile") {
    const x = Math.max(0, Math.min(WORLD_W - TILE_SIZE, Math.floor(w.x / TILE_SIZE) * TILE_SIZE));
    const y = Math.max(0, Math.min(WORLD_H - TILE_SIZE, Math.floor(w.y / TILE_SIZE) * TILE_SIZE));
    return { x, y, w: Math.min(TILE_SIZE, WORLD_W - x), h: Math.min(TILE_SIZE, WORLD_H - y) };
  }
  if (kind === "cell") {
    const x = Math.max(0, Math.min(WORLD_W - GRID, Math.floor(w.x / GRID) * GRID));
    const y = Math.max(0, Math.min(WORLD_H - GRID, Math.floor(w.y / GRID) * GRID));
    return { x, y, w: GRID, h: GRID };
  }
  if (kind === "row") {
    const y = Math.max(0, Math.min(WORLD_H - GRID, Math.floor(w.y / GRID) * GRID));
    return { x: 0, y, w: WORLD_W, h: GRID };
  }
  const x = Math.max(0, Math.min(WORLD_W - GRID, Math.floor(w.x / GRID) * GRID));
  return { x, y: 0, w: GRID, h: WORLD_H };
}

export type DevRead = {
  x?: number;
  y?: number;
  wing?: -1 | 0 | 1;
  weather?: string;
};

function landName(wing: number | undefined): string {
  if (wing === -1) return "west land";
  if (wing === 1) return "east land";
  return "homestead";
}

function improvement(note: string): string {
  const n = note.toLowerCase();
  if (/grass|lawn|meadow/.test(n)) return "Match the farm grass already in use. No new tile, no seam, no second green.";
  if (/path|dirt|sidewalk|courtyard|mosaic|floor/.test(n)) return "That surface is the floor. Do not leave grass, dirt, or another picture under it, and keep it walkable.";
  if (/house|door|roof|cabin|shack/.test(n)) return "Scale it to the farmer, keep the door a real entrance, and match the warm farm around it.";
  if (/tree|bush|foliage|canopy/.test(n)) return "Keep the silhouette whole. The farmer walks behind trunks and bushes, not through them.";
  if (/pond|water|fish|dock/.test(n)) return "Water stays water. He can fish from the bank or the dock, and he cannot walk on it.";
  if (/cow|goat|chicken|rooster|cat|animal/.test(n)) return "Keep the animal at farm scale, on the ground, with a side view that does not clip.";
  if (/rain|weather|glow|light|fire|campfire/.test(n)) return "Keep the effect on the land. It must not follow the farmer, and it must not blow out the picture.";
  if (/portal|gate|cross|east|west/.test(n)) return "The crossing has to work from the sidewalk and the courtyard, and he must not walk through the portal.";
  return "Make this same spot clearer and more consistent with the rest of the homestead. Do not add a system he did not ask for.";
}

/** A work order the builder can paste. Written here so it does not depend on a network call. */
export function editorOrder(rect: Rect, note: string, read?: DevRead): string {
  const x1 = rect.x + rect.w;
  const y1 = rect.y + rect.h;
  const said = note.trim().replace(/\s+/g, " ");
  const cellsW = Math.max(1, Math.round(rect.w / GRID));
  const cellsH = Math.max(1, Math.round(rect.h / GRID));
  const where =
    read && typeof read.x === "number" && typeof read.y === "number"
      ? `Farmer is at ${Math.round(read.x)}, ${Math.round(read.y)} on the ${landName(read.wing)}${read.weather ? `, weather ${read.weather}` : ""}.`
      : "Farmer position was not sampled.";
  return [
    "XDRUIDI  DEV CONSOLE",
    `target   x ${rect.x}–${x1}   y ${rect.y}–${y1}   ${rect.w}×${rect.h} px   ${cellsW}×${cellsH} cells`,
    "grid     32×32 art, 8×8 placement. Work only inside the target unless the note is a system that has to be wired through the game.",
    `scene    ${where}`,
    "",
    "report",
    `  "${said}"`,
    "",
    "read",
    `  The player said exactly that, about this rectangle. Do that. Do not shorten it into a pixel recipe, and do not do a different job than the one they named.`,
    "",
    "also",
    `  ${improvement(said)}`,
    "",
    "keep",
    "  Warm farm palette. Separate picture, collision, and use. Save anything that changes an item, a need, a crop, or an animal.",
    "",
    "check",
    "  The rectangle shows the change. The rest of the map did not move. He can still walk the path and use what he could use before.",
  ].join("\n");
}

type SheetBag = Record<string, HTMLImageElement | undefined>;

export function drawTileLayer(ctx: CanvasRenderingContext2D, sheets: SheetBag): void {
  for (const s of stamps) {
    if (s.id === "path") {
      ctx.fillStyle = "#8a704c";
      ctx.fillRect(s.x, s.y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = "#6e5838";
      ctx.fillRect(s.x + 2, s.y + 11, 3, 2);
      ctx.fillRect(s.x + 9, s.y + 4, 4, 2);
      continue;
    }
    const key = s.id === "grass" ? "landGrass" : s.id === "soil" ? "landSoil" : s.id === "tilled" ? "landTilled" : "landWater";
    const img = sheets[key];
    if (img) ctx.drawImage(img, 0, 0, Math.min(TILE_SIZE, img.width), Math.min(TILE_SIZE, img.height), s.x, s.y, TILE_SIZE, TILE_SIZE);
  }
  ctx.save();
  ctx.strokeStyle = "rgba(224, 90, 70, 0.85)";
  ctx.lineWidth = 1;
  for (const b of blocks) ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
  ctx.restore();
}

export function drawEditorBox(ctx: CanvasRenderingContext2D, rect: Rect | null): void {
  if (!rect) return;
  ctx.save();
  ctx.fillStyle = "rgba(255, 225, 74, 0.22)";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = "#ffe14a";
  ctx.lineWidth = 1;
  ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, Math.max(1, rect.w - 1), Math.max(1, rect.h - 1));
  ctx.strokeStyle = "rgba(255, 225, 74, 0.45)";
  for (let x = rect.x + GRID; x < rect.x + rect.w; x += GRID) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, rect.y);
    ctx.lineTo(x + 0.5, rect.y + rect.h);
    ctx.stroke();
  }
  for (let y = rect.y + GRID; y < rect.y + rect.h; y += GRID) {
    ctx.beginPath();
    ctx.moveTo(rect.x, y + 0.5);
    ctx.lineTo(rect.x + rect.w, y + 0.5);
    ctx.stroke();
  }
  ctx.restore();
}
