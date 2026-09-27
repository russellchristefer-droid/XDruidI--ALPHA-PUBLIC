import { WORLD_H, WORLD_W } from "./content.ts";
import { GRID } from "./tiles.ts";

export type SpriteDef = { id: string; file: string; w: number; h: number };
export type SpritePlace = {
  id: string;
  x: number;
  y: number;
  flipX?: boolean;
  flipY?: boolean;
  rot?: 0 | 90 | 180 | 270;
};
export type SpriteBook = { rev: number; library: SpriteDef[]; placed: SpritePlace[] };

export const EMPTY_SPRITES: SpriteBook = { rev: 0, library: [], placed: [] };

let book: SpriteBook = EMPTY_SPRITES;
const images = new Map<string, HTMLImageElement>();
let ghost: { index: number; x: number; y: number } | null = null;
let picked = -1;

export function devSpriteBook(): SpriteBook {
  return book;
}

export function snapSprite(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(WORLD_W - GRID, Math.floor(x / GRID) * GRID)),
    y: Math.max(0, Math.min(WORLD_H - GRID, Math.floor(y / GRID) * GRID)),
  };
}

export function placeBounds(place: SpritePlace, def: { w: number; h: number } | undefined): { x: number; y: number; w: number; h: number } {
  const swap = place.rot === 90 || place.rot === 270;
  const w = Math.max(GRID, swap ? def?.h ?? GRID : def?.w ?? GRID);
  const h = Math.max(GRID, swap ? def?.w ?? GRID : def?.h ?? GRID);
  return { x: place.x, y: place.y, w, h };
}

export function spriteIndexAt(x: number, y: number): number {
  for (let i = book.placed.length - 1; i >= 0; i--) {
    const place = book.placed[i];
    const def = book.library.find((d) => d.id === place.id);
    const box = placeBounds(ghost?.index === i ? { ...place, x: ghost.x, y: ghost.y } : place, def);
    if (x >= box.x && x < box.x + box.w && y >= box.y && y < box.y + box.h) return i;
  }
  return -1;
}

export function setSpriteGhost(next: { index: number; x: number; y: number } | null): void {
  ghost = next;
}

export function setSpritePick(index: number): void {
  picked = index;
}

export async function loadDevSprites(): Promise<SpriteBook> {
  try {
    const res = await fetch("/game/sprites/manifest.json", { cache: "no-store" });
    if (!res.ok) {
      book = EMPTY_SPRITES;
      return book;
    }
    const next = (await res.json()) as SpriteBook;
    book = {
      rev: Number(next.rev) || 0,
      library: Array.isArray(next.library) ? next.library : [],
      placed: Array.isArray(next.placed) ? next.placed : [],
    };
  } catch {
    book = EMPTY_SPRITES;
    return book;
  }
  await Promise.all(
    book.library.map(
      (def) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            images.set(def.id, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = `${def.file}?v=${book.rev}`;
        }),
    ),
  );
  return book;
}

export function devSpriteLayers(): { y: number; paint: (ctx: CanvasRenderingContext2D) => void }[] {
  return book.placed.flatMap((place, index) => {
    const def = book.library.find((d) => d.id === place.id);
    const img = images.get(place.id);
    if (!def || !img) return [];
    const at = ghost?.index === index ? { ...place, x: ghost.x, y: ghost.y } : place;
    const box = placeBounds(at, def);
    return [
      {
        y: box.y + box.h,
        paint: (ctx: CanvasRenderingContext2D) => {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.translate(box.x + box.w / 2, box.y + box.h / 2);
          ctx.rotate(((at.rot ?? 0) * Math.PI) / 180);
          ctx.scale(at.flipX ? -1 : 1, at.flipY ? -1 : 1);
          ctx.drawImage(img, Math.round(-def.w / 2), Math.round(-def.h / 2));
          ctx.restore();
          if (index === picked || ghost?.index === index) {
            ctx.save();
            ctx.strokeStyle = "#ffe14a";
            ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);
            ctx.restore();
          }
        },
      },
    ];
  });
}
