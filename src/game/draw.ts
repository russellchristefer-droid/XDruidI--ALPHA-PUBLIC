import { MEADOW, TILE, WORLD_H, WORLD_W, type Dir, type GameState } from "./content.ts";
import type { Sheets } from "./assets.ts";
import { applyLokaPaint, applyIslandVoid } from "./paint/applyLoka.ts";

const CHAR = 0.42;
const PLATE = 192;
const FARM_H = MEADOW.y;

function rowOf(dir: Dir): { row: number; flip: boolean } {
  if (dir === "n") return { row: 2, flip: false };
  if (dir === "w") return { row: 1, flip: true };
  if (dir === "e") return { row: 1, flip: false };
  return { row: 0, flip: false };
}

function blit(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  x: number,
  y: number,
  scale: number,
  flip: boolean,
  footX: number,
  footY: number,
) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, sx, sy, sw, sh, -footX * scale, -footY * scale, sw * scale, sh * scale);
  ctx.restore();
}

function paintPlayer(ctx: CanvasRenderingContext2D, sheets: Sheets, s: GameState) {
  const sheet = s.speed > 1 ? sheets.walk ?? sheets.idle : sheets.idle;
  if (!sheet) return;
  const { row, flip } = rowOf(s.dir);
  const frames = s.speed > 1 ? 8 : 2;
  const col = Math.floor(s.clock * (s.speed > 1 ? 10 : 1.6)) % frames;
  blit(ctx, sheet, col * 80, row * 112, 80, 112, s.x, s.y, CHAR, flip, row === 1 ? 37 : 35, 95);
}

function animalRow(dir: Dir): number {
  if (dir === "w") return 1;
  if (dir === "e") return 2;
  if (dir === "n") return 3;
  return 0;
}

function drawAnimal(
  ctx: CanvasRenderingContext2D,
  idle: HTMLImageElement | undefined,
  walk: HTMLImageElement | undefined,
  s: GameState,
  x: number,
  y: number,
  dir: Dir,
  moving: boolean,
  scale: number,
) {
  const img = moving && walk ? walk : idle;
  if (!img) return;
  blit(ctx, img, (moving ? Math.floor(s.clock * 8) % 6 : 0) * 72, animalRow(dir) * 72, 72, 72, x, y, scale, false, 36, 66);
}

function drawUnderside(ctx: CanvasRenderingContext2D): void {
  for (let x = 0; x < WORLD_W; x++) {
    const dome = Math.sin((x / Math.max(1, WORLD_W - 1)) * Math.PI);
    const depth = 14 + Math.round(dome ** 0.72 * 58) + ((x * 13) & 7);
    for (let i = 0; i < depth; i++) {
      ctx.fillStyle = i < 2 ? "#2a221c" : i < 6 ? "#3a281c" : "#1c140e";
      ctx.fillRect(x, FARM_H + i, 1, 1);
    }
  }
}

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  sheets: Sheets,
  hover: { x: number; y: number } | null,
  _showTill: boolean,
) {
  const wing = s.wing ?? 0;
  if (wing !== 0) {
    applyLokaPaint(ctx, wing, s.clock);
    if (sheets.idle) paintPlayer(ctx, sheets, s);
    return;
  }

  ctx.fillStyle = "#07091a";
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  applyIslandVoid(ctx, s.clock, 0, 0, WORLD_W, WORLD_H);
  if (sheets.yard) ctx.drawImage(sheets.yard, 0, 0, WORLD_W, PLATE, 0, 0, WORLD_W, PLATE);
  if (sheets.farmExtend) ctx.drawImage(sheets.farmExtend, 0, PLATE);
  applyLokaPaint(ctx, 0, s.clock);
  if (sheets.idle) paintPlayer(ctx, sheets, s);

  for (const a of s.animals ?? []) {
    const moving = a.pause <= 0;
    const scale = a.kind === "cow" ? 0.5 : a.kind === "goat" ? 0.46 : 0.56;
    const idle = sheets[a.kind === "cow" ? "cowIdle" : a.kind === "goat" ? "goatIdle" : "roosterIdle"];
    const walk = sheets[a.kind === "cow" ? "cowWalk" : a.kind === "goat" ? "goatWalk" : "roosterWalk"];
    drawAnimal(ctx, idle, walk, s, a.x, a.y, a.dir, moving, scale);
  }

  const catSheet = sheets.catSit ?? sheets.cat;
  if (catSheet && s.cat) {
    const frames = Math.max(1, Math.floor(catSheet.width / 64));
    blit(ctx, catSheet, (Math.floor(s.clock * 2) % frames) * 64, 0, 64, 64, s.cat.x, s.cat.y, 0.36, s.cat.face < 0, 32, 48);
  }

  if (sheets.occlude) ctx.drawImage(sheets.occlude, 0, 0, WORLD_W, PLATE, 0, 0, WORLD_W, PLATE);

  if (hover && hover.x >= 0 && hover.y >= 0 && hover.x < WORLD_W && hover.y < WORLD_H) {
    ctx.strokeStyle = "#ffe14a";
    ctx.strokeRect(Math.floor(hover.x / TILE) * TILE + 0.5, Math.floor(hover.y / TILE) * TILE + 0.5, TILE - 1, TILE - 1);
  }

  drawUnderside(ctx);
}
