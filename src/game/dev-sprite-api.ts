import { createServerFn } from "@tanstack/react-start";
import { placeBounds, type SpriteBook, type SpriteDef, type SpritePlace } from "@/game/dev-sprites";

const FILE = "public/game/sprites/manifest.json";

function safeId(name: string): string {
  const base = name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return base || "sprite";
}

function extFor(mime: string): string {
  if (mime === "image/gif") return "gif";
  if (mime === "image/webp") return "webp";
  if (mime === "image/jpeg") return "jpg";
  return "png";
}

async function readBook(): Promise<SpriteBook> {
  const { readFile } = await import("node:fs/promises");
  try {
    const raw = JSON.parse(await readFile(FILE, "utf8")) as SpriteBook;
    return {
      rev: Number(raw.rev) || 0,
      library: Array.isArray(raw.library) ? raw.library : [],
      placed: Array.isArray(raw.placed) ? raw.placed : [],
    };
  } catch {
    return { rev: 0, library: [], placed: [] };
  }
}

async function writeBook(book: SpriteBook): Promise<void> {
  const { mkdir, writeFile } = await import("node:fs/promises");
  await mkdir("public/game/sprites", { recursive: true });
  await writeFile(FILE, JSON.stringify(book, null, 2));
}

export const saveDevSprite = createServerFn({ method: "POST" })
  .validator((data: { name?: string; mime?: string; b64?: string; w?: number; h?: number }) => {
    const name = String(data?.name ?? "sprite");
    const mime = String(data?.mime ?? "image/png");
    const b64 = String(data?.b64 ?? "");
    const w = Math.round(Number(data?.w));
    const h = Math.round(Number(data?.h));
    if (!b64 || b64.length > 1_500_000) throw new Error("That sprite is empty or too large.");
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1 || w > 512 || h > 512) {
      throw new Error("Sprites must be between 1 and 512 pixels.");
    }
    return { name, mime, b64, w, h };
  })
  .handler(async ({ data }): Promise<SpriteDef> => {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const id = safeId(data.name);
    const ext = extFor(data.mime);
    const file = `/game/sprites/${id}.${ext}`;
    await mkdir("public/game/sprites", { recursive: true });
    await writeFile(`public/game/sprites/${id}.${ext}`, Buffer.from(data.b64, "base64"));
    const book = await readBook();
    const def: SpriteDef = { id, file, w: data.w, h: data.h };
    book.library = book.library.filter((d) => d.id !== id);
    book.library.push(def);
    book.rev += 1;
    await writeBook(book);
    return def;
  });

export const placeDevSprite = createServerFn({ method: "POST" })
  .validator((data: { id?: string; x?: number; y?: number }) => {
    const id = String(data?.id ?? "");
    const x = Math.round(Number(data?.x));
    const y = Math.round(Number(data?.y));
    if (!id || !Number.isFinite(x) || !Number.isFinite(y)) throw new Error("Need a sprite and a grid point.");
    return { id, x, y };
  })
  .handler(async ({ data }): Promise<SpritePlace> => {
    const book = await readBook();
    if (!book.library.some((d) => d.id === data.id)) throw new Error("Attach that sprite first.");
    const place = { id: data.id, x: data.x, y: data.y };
    book.placed.push(place);
    book.rev += 1;
    await writeBook(book);
    return place;
  });

export const liftDevSprite = createServerFn({ method: "POST" })
  .validator((data: { x?: number; y?: number; w?: number; h?: number }) => {
    const x = Math.round(Number(data?.x));
    const y = Math.round(Number(data?.y));
    const w = Math.round(Number(data?.w));
    const h = Math.round(Number(data?.h));
    if (![x, y, w, h].every(Number.isFinite) || w < 1 || h < 1) throw new Error("Need a rectangle to lift.");
    return { x, y, w, h };
  })
  .handler(async ({ data }): Promise<{ lifted: number }> => {
    const book = await readBook();
    const before = book.placed.length;
    book.placed = book.placed.filter((place) => {
      const def = book.library.find((d) => d.id === place.id);
      const box = placeBounds(place, def);
      const hit = box.x < data.x + data.w && box.x + box.w > data.x && box.y < data.y + data.h && box.y + box.h > data.y;
      return !hit;
    });
    const lifted = before - book.placed.length;
    if (lifted) {
      book.rev += 1;
      await writeBook(book);
    }
    return { lifted };
  });

function cleanPlace(place: SpritePlace): SpritePlace | null {
  const id = String(place?.id ?? "");
  const x = Math.round(Number(place?.x));
  const y = Math.round(Number(place?.y));
  const rot = Number(place?.rot);
  if (!id || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  return {
    id,
    x,
    y,
    flipX: !!place.flipX,
    flipY: !!place.flipY,
    rot: rot === 90 || rot === 180 || rot === 270 ? rot : 0,
  };
}

export const replaceDevPlaced = createServerFn({ method: "POST" })
  .validator((data: { placed?: SpritePlace[] }) => {
    const raw = Array.isArray(data?.placed) ? data.placed : [];
    if (raw.length > 400) throw new Error("Too many stamps.");
    return { placed: raw.map(cleanPlace).filter((p): p is SpritePlace => !!p) };
  })
  .handler(async ({ data }): Promise<{ count: number }> => {
    const book = await readBook();
    const known = new Set(book.library.map((d) => d.id));
    book.placed = data.placed.filter((p) => known.has(p.id));
    book.rev += 1;
    await writeBook(book);
    return { count: book.placed.length };
  });
