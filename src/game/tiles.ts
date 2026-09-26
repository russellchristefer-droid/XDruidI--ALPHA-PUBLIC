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

export function editorOrder(rect: Rect, note: string): string {
  const x1 = rect.x + rect.w;
  const y1 = rect.y + rect.h;
  return [
    "MAP EDIT",
    `Square: x ${rect.x}–${x1}, y ${rect.y}–${y1} (${rect.w}×${rect.h} px).`,
    `Tiles: column ${Math.floor(rect.x / GRID)}–${Math.floor((x1 - 1) / GRID)}, row ${Math.floor(rect.y / GRID)}–${Math.floor((y1 - 1) / GRID)}.`,
    `Do this: ${note.trim()}`,
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
