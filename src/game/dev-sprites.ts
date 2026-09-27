import { WORLD_H, WORLD_W } from "./content.ts";
import { GRID } from "./tiles.ts";

export type SpriteDef = { id: string; file: string; w: number; h: number };
export type SpritePlace = { id: string; x: number; y: number };
export type SpriteBook = { rev: number; library: SpriteDef[]; placed: SpritePlace[] };

export const EMPTY_SPRITES: SpriteBook = { rev: 0, library: [], placed: [] };

let book: SpriteBook = EMPTY_SPRITES;
const images = new Map<string, HTMLImageElement>();

export function devSpriteBook(): SpriteBook {
  return book;
}

export function snapSprite(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(WORLD_W - GRID, Math.floor(x / GRID) * GRID)),
    y: Math.max(0, Math.min(WORLD_H - GRID, Math.floor(y / GRID) * GRID)),
  };
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
  return book.placed.flatMap((place) => {
    const def = book.library.find((d) => d.id === place.id);
    const img = images.get(place.id);
    if (!def || !img) return [];
    return [
      {
        y: place.y + def.h,
        paint: (ctx: CanvasRenderingContext2D) => {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, place.x, place.y);
        },
      },
    ];
  });
}
