import { FISH_CROWN, FISH_WATER, MEADOW, SEAM_ROCKS, TILE, WORLD_H, WORLD_W, type Dir, type GameState, type Plot } from "./content.ts";
import { devSpriteLayers } from "./dev-sprites.ts";
import type { Sheets } from "./assets.ts";

const CHAR = 0.42;

function rowOf(dir: Dir): { row: number; flip: boolean } {
  if (dir === "n") return { row: 2, flip: false };
  if (dir === "w") return { row: 1, flip: true };
  if (dir === "e") return { row: 1, flip: false };
  return { row: 0, flip: false };
}

function animalRow(dir: Dir): number {
  if (dir === "w") return 1;
  if (dir === "e") return 2;
  if (dir === "n") return 3;
  return 0;
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
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, sx, sy, sw, sh, -footX * scale, -footY * scale, dw, dh);
  ctx.restore();
}

function charPose(s: GameState): { sheet: string; frames: number; col: number } {
  const act = s.action;
  if (act) {
    const map: Record<string, [string, number]> = {
      water: ["water", 8],
      fill: ["water", 8],
      till: ["shovel", 7],
      harvest: ["scythe", 5],
      clear: ["scythe", 5],
      chop: ["axe", 6],
      repair: ["hammer", 6],
      sharpen: ["hammer", 6],
      plant: ["handsidle", 2],
      cook: ["handsidle", 2],
      feed: ["handsidle", 2],
      collect: ["handsidle", 2],
    };
    const pair = map[act.kind] ?? ["handsidle", 2];
    const col = Math.min(pair[1] - 1, Math.floor((act.elapsed / act.dur) * pair[1]));
    return { sheet: pair[0], frames: pair[1], col };
  }
  const hands = !!s.body.hands;
  if (s.speed > 1) {
    return {
      sheet: hands ? "handswalk" : "walk",
      frames: 8,
      col: Math.floor(s.clock * 10) % 8,
    };
  }
  return {
    sheet: hands ? "handsidle" : "idle",
    frames: 2,
    col: Math.floor(s.clock * 1.6) % 2,
  };
}

function drawFlowers(ctx: CanvasRenderingContext2D, sheets: Sheets, s: GameState) {
  const img = sheets.flowers;
  if (!img || !s.flowers) return;
  for (const f of s.flowers) {
    const x0 = f.x - f.w / 2;
    const y0 = f.y - f.h / 2;
    const across = f.w > f.h;
    const n = Math.max(3, Math.floor((across ? f.w : f.h) / 8));
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const sway = Math.sin(s.clock * 1.6 + i + f.row) * 0.45;
      const cx = across ? x0 + t * f.w : f.x + sway;
      const cy = across ? f.y + sway : y0 + t * f.h;
      blit(ctx, img, Math.min(2, f.bloom) * 16, f.row * 16, 16, 16, cx, cy, 0.9, false, 8, 15);
    }
  }
}

let pathBits: Uint8Array | null = null;

function feetOnPath(sheets: Sheets, x: number, y: number): boolean {
  const img = sheets.path;
  if (!img) return false;
  if (!pathBits || pathBits.length !== img.width * img.height) {
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext("2d", { willReadFrequently: true });
    if (!g) return false;
    g.drawImage(img, 0, 0);
    const data = g.getImageData(0, 0, c.width, c.height).data;
    pathBits = new Uint8Array(c.width * c.height);
    for (let i = 0; i < pathBits.length; i++) pathBits[i] = data[i * 4] > 128 ? 1 : 0;
  }
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || iy < 0 || ix >= img.width || iy >= img.height) return false;
  return pathBits[iy * img.width + ix] === 1;
}

function paintPlayer(ctx: CanvasRenderingContext2D, sheets: Sheets, s: GameState) {
  const pose = charPose(s);
  const sheet = sheets[pose.sheet];
  if (!sheet) return;
  const { row, flip } = rowOf(s.dir);
  ctx.save();
  if (s.downed) ctx.translate(0, 4);
  blit(ctx, sheet, pose.col * 80, row * 112, 80, 112, s.x, s.y, CHAR, flip, 36, 96);
  drawEffect(ctx, sheets, s);
  ctx.restore();
}

function drawEffect(ctx: CanvasRenderingContext2D, sheets: Sheets, s: GameState) {
  const life = s.life;
  let key: keyof Sheets | null = null;
  if (s.downed || life?.face === "ill") key = "fxDebuff";
  else if (life && life.emote > 0 && life.face === "heart") key = "fxHearts";
  else if (life && life.emote > 0 && life.face === "happy") key = "fxHeartsPink";
  else if (life && life.emote > 0 && life.face === "tired") key = "fxTired";
  else if (life && life.emote > 0 && life.face === "need") key = "fxDebuff";
  else if (s.action) key = life?.errand === "wash" || s.action.kind === "fill" || s.action.kind === "water" ? "fxMagic" : "fxBuff";
  else if (life && life.mood > 70 && Math.floor(s.clock) % 6 === 0) key = "fxStars";
  if (!key) return;
  const img = sheets[key];
  if (!img) return;
  const frame = Math.floor(s.clock * 8) % 5;
  blit(ctx, img, frame * 80, 0, 80, 64, s.x, s.y - 16, 0.4, false, 40, 40);
}

const HAT_DARK = "#152a66";
const HAT_BLUE = "#2a4ec4";
const HAT_LITE = "#96baff";
const HAT_GOLD = "#e6c86a";
const HAT_SHADOW = "#101c46";

function paintHat(kind: "front" | "side" | "back"): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = kind === "side" ? 18 : 21;
  canvas.height = kind === "side" ? 12 : 16;
  const g = canvas.getContext("2d");
  if (!g) return canvas;
  const px = (x: number, y: number, color: string) => {
    g.fillStyle = color;
    g.fillRect(x, y, 1, 1);
  };
  const band = (y: number, x0: number, x1: number, color: string) => {
    for (let x = x0; x <= x1; x++) px(x, y, color);
  };
  if (kind === "side") {
    px(6, 1, HAT_GOLD);
    band(2, 5, 7, HAT_BLUE);
    px(5, 2, HAT_DARK);
    px(7, 2, HAT_DARK);
    band(3, 5, 8, HAT_BLUE);
    px(6, 3, HAT_LITE);
    band(4, 4, 9, HAT_BLUE);
    px(4, 4, HAT_DARK);
    px(9, 4, HAT_DARK);
    band(5, 4, 10, HAT_BLUE);
    px(4, 5, HAT_DARK);
    px(10, 5, HAT_DARK);
    band(6, 5, 12, HAT_BLUE);
    px(5, 6, HAT_DARK);
    px(12, 6, HAT_DARK);
    band(7, 3, 14, HAT_BLUE);
    band(8, 3, 14, HAT_DARK);
    band(9, 4, 13, HAT_SHADOW);
    return canvas;
  }
  const cx = 10;
  px(cx, 0, kind === "front" ? HAT_GOLD : HAT_BLUE);
  px(cx, 1, HAT_BLUE);
  [1, 2, 3, 3, 4, 5, 6, 7].forEach((half, i) => {
    const y = 2 + i;
    for (let x = cx - half; x <= cx + half; x++) {
      const edge = x === cx - half || x === cx + half;
      px(x, y, edge ? HAT_DARK : kind === "front" && x === cx && (i === 1 || i === 4) ? HAT_LITE : HAT_BLUE);
    }
  });
  band(11, cx - 9, cx + 9, HAT_BLUE);
  band(12, cx - 9, cx + 9, HAT_DARK);
  band(13, cx - 8, cx + 8, HAT_SHADOW);
  return canvas;
}

const hats: Partial<Record<"front" | "side" | "back", HTMLCanvasElement>> = {};

function hatSheet(kind: "front" | "side" | "back"): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  return (hats[kind] ??= paintHat(kind));
}

const WALK_TOP = [
  [24, 25, 26, 25, 24, 25, 26, 25],
  [26, 25, 24, 25, 26, 25, 24, 25],
  [24, 25, 26, 25, 24, 25, 26, 25],
];
const IDLE_TOP = [
  [24, 25],
  [25, 26],
  [24, 25],
];

function headTop(pose: { sheet: string; col: number }, row: number): number {
  if (pose.sheet.endsWith("walk")) return WALK_TOP[row]?.[pose.col] ?? 24;
  return IDLE_TOP[row]?.[pose.col % 2] ?? 24;
}

function drawHat(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  pose: { sheet: string; col: number },
  row: number,
  flip: boolean,
) {
  const kind = row === 1 ? "side" : row === 2 ? "back" : "front";
  const hat = hatSheet(kind);
  if (!hat) return;
  const headX = row === 1 ? 38 : row === 2 ? 36 : 35;
  const headY = headTop(pose, row) + 2;
  const ax = kind === "side" ? 8 : 10;
  const ay = kind === "side" ? 8 : 12;
  blit(ctx, hat, 0, 0, hat.width, hat.height, s.x, s.y, CHAR, flip, ax - headX + 40, ay - headY + 96);
}

const FACES = {
  ok: [2, 2],
  happy: [4, 2],
  tired: [7, 2],
  ill: [8, 2],
  need: [9, 2],
  heart: [6, 2],
} as const;

const vividFaces = new Map<string, HTMLCanvasElement>();

function vividFace(sheet: CanvasImageSource, col: number, row: number): HTMLCanvasElement | null {
  const key = `${col},${row}`;
  const cached = vividFaces.get(key);
  if (cached) return cached;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 18;
  canvas.height = 12;
  const g = canvas.getContext("2d");
  if (!g) return null;
  g.imageSmoothingEnabled = false;
  g.drawImage(sheet, col * 16, row * 16 + 6, 16, 10, 1, 1, 16, 10);
  const img = g.getImageData(0, 0, 18, 12);
  const src = new Uint8ClampedArray(img.data);
  const opaque = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= 18 || y >= 12) return false;
    return src[(y * 18 + x) * 4 + 3]! > 20;
  };
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 18; x++) {
      const i = (y * 18 + x) * 4;
      if (src[i + 3]! > 20) {
        const r = src[i]!;
        const gr = src[i + 1]!;
        const b = src[i + 2]!;
        if (r + gr + b >= 140) {
          img.data[i] = Math.min(255, Math.round(r * 1.4 + 36));
          img.data[i + 1] = Math.min(255, Math.round(gr * 1.32 + 24));
          img.data[i + 2] = Math.min(255, Math.round(b * 1.15 + 10));
        }
        continue;
      }
      if (opaque(x - 1, y) || opaque(x + 1, y) || opaque(x, y - 1) || opaque(x, y + 1)) {
        img.data[i] = 0;
        img.data[i + 1] = 0;
        img.data[i + 2] = 0;
        img.data[i + 3] = 255;
      }
    }
  }
  g.putImageData(img, 0, 0);
  vividFaces.set(key, canvas);
  return canvas;
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  sheets: Sheets,
  s: GameState,
  pose: { sheet: string; col: number },
  row: number,
  flip: boolean,
) {
  const img = sheets.emoji;
  const life = s.life;
  if (!img || !life || life.emote <= 0 || life.face === "ok") return;
  const cell = FACES[life.face] ?? FACES.ok;
  const headX = row === 1 ? 38 : row === 2 ? 36 : 35;
  const headY = headTop(pose, row) + 2;
  const hx = s.x + (headX - 40) * CHAR * (flip ? -1 : 1);
  const hy = s.y + (headY - 16 - 96) * CHAR;
  const face = vividFace(img, cell[1], cell[0]);
  blit(ctx, face ?? img, face ? 0 : cell[1] * 16, face ? 0 : cell[0] * 16 + 6, face ? 18 : 16, face ? 12 : 10, hx, hy, 1.6, false, face ? 9 : 8, face ? 11 : 10);
}

function drawPlot(ctx: CanvasRenderingContext2D, sheets: Sheets, p: Plot) {
  const w = p.w || 20;
  const h = p.h || 16;
  const x = Math.round(p.x - w / 2);
  const y = Math.round(p.y - h / 2);
  const tilled = p.tilled || (!!p.crop && p.stage !== 0);
  if (tilled && sheets.landTilled) {
    const img = sheets.landTilled;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    for (let ty = y; ty < y + h; ty += img.height) {
      for (let tx = x; tx < x + w; tx += img.width) {
        ctx.drawImage(img, tx, ty);
      }
    }
    ctx.restore();
  }
  if (!p.crop || p.stage === 0 || !sheets[p.crop]) return;
  const img = sheets[p.crop]!;
  const fw = 32;
  const fh = img.height;
  const frames = Math.max(1, Math.floor(img.width / fw));
  const frame = p.stage < 0 ? 0 : Math.min(frames - 1, p.stage);
  const count = w >= 48 ? 2 : 1;
  for (let i = 0; i < count; i++) {
    const cx = x + ((i + 0.5) * w) / count;
    const cy = y + h - 1;
    blit(ctx, img, frame * fw, 0, fw, fh, cx, cy, 1, false, fw / 2, fh - 1);
  }
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
  const row = animalRow(dir);
  const frames = moving ? 6 : 1;
  const col = moving ? Math.floor(s.clock * 8) % frames : 0;
  blit(ctx, img, col * 72, row * 72, 72, 72, x, y, scale, false, 36, 66);
}

const PLATE = 192;
const FARM_H = MEADOW.y;

function drawSpace(ctx: CanvasRenderingContext2D, clock: number): void {
  ctx.fillStyle = "#07091a";
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  for (let i = 0; i < 520; i++) {
    const x = (i * 47 + 13) % WORLD_W;
    const y = FARM_H + ((i * 29 + 5) % (WORLD_H - FARM_H));
    const band = (x * 3 + y) % 17;
    if (band > 4) continue;
    ctx.fillStyle = band === 0 ? "#3a2068" : band === 1 ? "#1a4060" : "#2a1848";
    ctx.fillRect(x, y, band === 0 ? 3 : 2, 1);
  }
  for (let i = 0; i < 260; i++) {
    const x = (i * 53 + 9) % WORLD_W;
    const y = FARM_H + 8 + ((i * 37) % (WORLD_H - FARM_H - 8));
    const tw = (i + Math.floor(clock * 2)) % 11 === 0;
    ctx.fillStyle = i % 9 === 0 ? "#f6d48a" : i % 4 === 0 ? "#9ecbff" : "#f4f7ff";
    ctx.fillRect(x, y, tw ? 2 : 1, tw ? 2 : 1);
    if (i % 23 === 0 && y > FARM_H + 4) {
      ctx.fillRect(x - 2, y, 5, 1);
      ctx.fillRect(x, y - 2, 1, 5);
    }
  }
  paintOrb(ctx, 70, 640, 12, "#d5deea", "#9aabc0");
  paintOrb(ctx, 290, 700, 16, "#8eb8d8", "#3a5870");
  ctx.fillStyle = "#c9d7e4";
  ctx.fillRect(258, 700, 64, 1);
  ctx.fillRect(264, 702, 52, 1);
  paintOrb(ctx, 180, 820, 20, "#d8c48a", "#8a7040");
  ctx.fillStyle = "#efe6c4";
  ctx.fillRect(144, 818, 72, 1);
  ctx.fillRect(136, 820, 88, 1);
  ctx.fillRect(150, 822, 60, 1);
  paintOrb(ctx, 40, 900, 10, "#c46a4a", "#7a3028");
}

function paintOrb(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string, shade: string): void {
  for (let dy = -r; dy <= r; dy++) {
    const span = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
    ctx.fillStyle = dy > r * 0.25 ? shade : fill;
    ctx.fillRect(cx - span, cy + dy, span * 2, 1);
  }
}

function drawUnderside(ctx: CanvasRenderingContext2D): void {
  for (let x = 0; x < WORLD_W; x++) {
    const dome = Math.sin((x / (WORLD_W - 1)) * Math.PI);
    const jag = (x * 13) & 7;
    const depth = 14 + Math.round(dome ** 0.72 * 58) + jag;
    const n = (x * 7) & 7;
    for (let i = 0; i < depth; i++) {
      const shelf = i < 3 ? "#6f8a3a" : i < 8 ? ((n + i) % 5 === 0 ? "#7a5340" : "#5c4030") : (n + i) % 4 === 0 ? "#1c140e" : "#3a281c";
      ctx.fillStyle = shelf;
      ctx.fillRect(x, FARM_H + i, 1, 1);
    }
    if ((x * 11) % 19 > 16) {
      ctx.fillStyle = "#241810";
      ctx.fillRect(x, FARM_H + depth, 2, 3 + (n % 5));
    }
  }
}

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  sheets: Sheets,
  hover: { x: number; y: number } | null,
  showTill: boolean,
) {
  drawSpace(ctx, s.clock);
  const yard = sheets.yard;
  if (yard) ctx.drawImage(yard, 0, 0, WORLD_W, PLATE, 0, 0, WORLD_W, PLATE);
  if (sheets.farmExtend) ctx.drawImage(sheets.farmExtend, 0, PLATE);

  ctx.save();
  ctx.beginPath();
  ctx.rect(121, 79, 30, 14);
  ctx.clip();
  for (let i = 0; i < 5; i++) {
    const x = 122 + ((s.clock * 14 + i * 7) % 26);
    const y = 81 + ((i * 3) % 10);
    ctx.fillStyle = i % 2 === 0 ? "rgba(233, 251, 255, 0.55)" : "rgba(90, 180, 196, 0.45)";
    ctx.fillRect(Math.floor(x), y, 3, 1);
  }
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.rect(FISH_WATER.x, FISH_WATER.y, FISH_WATER.w, FISH_WATER.h);
  ctx.rect(FISH_CROWN.x, FISH_CROWN.y, FISH_CROWN.w, FISH_CROWN.h);
  ctx.clip();
  const span = FISH_WATER.w;
  for (let i = 0; i < 7; i++) {
    const x = FISH_WATER.x + ((s.clock * 10 + i * 11) % (span - 4));
    const y = FISH_CROWN.y + 2 + ((i * 7) % (FISH_WATER.y + FISH_WATER.h - FISH_CROWN.y - 6));
    ctx.fillStyle = i % 2 === 0 ? "rgba(210, 244, 248, 0.45)" : "rgba(70, 150, 168, 0.35)";
    ctx.fillRect(Math.floor(x), y, 4, 1);
  }
  ctx.restore();

  for (const p of s.plots) {
    drawPlot(ctx, sheets, p);
    if (p.watered && p.stage > 0) {
      const bob = Math.sin(s.clock * 6 + p.x) > 0 ? 0 : 1;
      ctx.fillStyle = "#b7e6f5";
      ctx.fillRect(p.x + 5, p.y - 7 + bob, 2, 2);
    }
  }
  drawFlowers(ctx, sheets, s);
  if (showTill) {
    ctx.save();
    ctx.strokeStyle = "rgba(226, 182, 87, 0.9)";
    for (const p of s.plots) {
      if (p.tilled || (p.crop && p.stage !== 0)) continue;
      const w = p.w || 20;
      const h = p.h || 16;
      ctx.strokeRect(Math.round(p.x - w / 2) + 0.5, Math.round(p.y - h / 2) + 0.5, w - 1, h - 1);
    }
    ctx.restore();
  }
  for (const b of s.branches) {
    if (!b.left) continue;
    const res = sheets.res;
    if (res) blit(ctx, res, 16, 0, 16, 16, b.x, b.y, 1, false, 8, 12);
    else {
      ctx.fillStyle = "#6b4428";
      ctx.fillRect(b.x - 5, b.y - 2, 10, 3);
    }
  }
  for (const g of s.ground) {
    ctx.fillStyle = "#e2b657";
    ctx.fillRect(g.x - 3, g.y - 3, 6, 6);
    ctx.strokeStyle = "#2a2118";
    ctx.strokeRect(g.x - 3, g.y - 3, 6, 6);
  }

  const bee = sheets.bee;
  if (bee) {
    const col = Math.floor(s.clock * 8) % 3;
    blit(ctx, bee, col * 16, 0, 16, 16, 108 + Math.sin(s.clock * 1.6) * 16, 88 + Math.cos(s.clock) * 6, 1, false, 8, 12);
  }
  const fly = sheets.butterfly;
  if (fly) {
    const col = Math.floor(s.clock * 6) % 3;
    blit(
      ctx,
      fly,
      col * 16,
      0,
      16,
      16,
      70 + Math.sin(s.clock * 1.1) * 20,
      100 + Math.cos(s.clock * 0.8) * 8,
      1,
      false,
      8,
      12,
    );
  }

  type D = { y: number; paint: () => void };
  const queue: D[] = [];
  for (const a of s.animals) {
    const moving = a.pause <= 0;
    const scale = a.kind === "cow" ? 0.5 : a.kind === "goat" ? 0.46 : 0.56;
    const idle = sheets[a.kind === "cow" ? "cowIdle" : a.kind === "goat" ? "goatIdle" : "roosterIdle"];
    const walk = sheets[a.kind === "cow" ? "cowWalk" : a.kind === "goat" ? "goatWalk" : "roosterWalk"];
    queue.push({
      y: a.y,
      paint: () => drawAnimal(ctx, idle, walk, s, a.x, a.y, a.dir, moving, scale),
    });
  }
  const mode = s.cat.mode || "sit";
  const moving = mode === "walk" || mode === "run";
  const catSheet =
    mode === "run"
      ? sheets.catRun ?? sheets.cat
      : mode === "walk"
        ? sheets.catWalk ?? sheets.cat
        : mode === "stand"
          ? sheets.catStand ?? sheets.catSit ?? sheets.cat
          : sheets.catSit ?? sheets.cat;
  if (catSheet) {
    queue.push({
      y: s.cat.y,
      paint: () => {
        const frames = Math.max(1, Math.floor(catSheet.width / 64));
        const col = moving ? Math.floor(s.clock * (mode === "run" ? 12 : 8)) % frames : Math.floor(s.clock * 2) % frames;
        blit(ctx, catSheet, col * 64, 0, 64, 64, s.cat.x, s.cat.y, 0.36, s.cat.face < 0, 32, 48);
      },
    });
  }
  const rocks = sheets.rocks;
  if (rocks) {
    for (const r of SEAM_ROCKS) {
      queue.push({
        y: r.y,
        paint: () => blit(ctx, rocks, r.i * 48, 0, 48, 48, r.x, r.y, r.s, false, 24, 40),
      });
    }
  }
  if (sheets.idle) {
    queue.push({
      y: s.y,
      paint: () => paintPlayer(ctx, sheets, s),
    });
  }
  for (const layer of devSpriteLayers()) {
    queue.push({ y: layer.y, paint: () => layer.paint(ctx) });
  }
  queue.sort((a, b) => a.y - b.y);
  for (const d of queue) d.paint();
  if (sheets.occlude) ctx.drawImage(sheets.occlude, 0, 0, WORLD_W, PLATE, 0, 0, WORLD_W, PLATE);
  if (sheets.idle && feetOnPath(sheets, s.x, s.y)) paintPlayer(ctx, sheets, s);

  const hour = 6 + s.time * 16;
  let sky = "rgba(0,0,0,0)";
  let skyA = 0;
  if (hour < 8) {
    sky = "255, 168, 80";
    skyA = ((8 - hour) / 2) * 0.22;
  } else if (hour >= 17 && hour < 20) {
    sky = "92, 54, 92";
    skyA = ((hour - 17) / 3) * 0.28;
  } else if (hour >= 20) {
    sky = "8, 14, 36";
    skyA = Math.min(0.62, 0.28 + ((hour - 20) / 2) * 0.34);
  }
  if (skyA > 0) {
    ctx.fillStyle = `rgba(${sky}, ${skyA})`;
    ctx.fillRect(0, 0, WORLD_W, FARM_H);
  }
  if (s.wet > 0.04) {
    ctx.fillStyle = `rgba(28, 58, 72, ${Math.min(0.28, s.wet * 0.26)})`;
    ctx.fillRect(0, 0, WORLD_W, FARM_H);
  }
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const fx = 40;
  const fy = 80;
  const glow = ctx.createRadialGradient(fx, fy, 1, fx, fy, 22);
  glow.addColorStop(0, `rgba(255, 196, 80, ${0.55 + skyA})`);
  glow.addColorStop(0.4, `rgba(255, 120, 24, ${0.28 + skyA * 0.45})`);
  glow.addColorStop(1, "rgba(255, 80, 10, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(fx, fy, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (s.weather === "rain" || s.weather === "storm") {
    const storm = s.weather === "storm";
    const drops = storm ? 170 : 80;
    const span = FARM_H - 3;
    for (let i = 0; i < drops; i++) {
      const n = (i * 1103515245 + 12345) >>> 0;
      const speed = (storm ? 55 : 28) + ((n >>> 16) % (storm ? 80 : 46));
      const len = 1 + ((n >>> 21) % (storm ? 3 : 2));
      const x = n % WORLD_W;
      const y = Math.floor((((n >>> 8) % span) + s.clock * speed) % span);
      const fade = 0.28 + ((n >>> 24) % 45) / 100;
      ctx.fillStyle = `rgba(206, 224, 236, ${fade})`;
      ctx.fillRect(x, y, 1, len);
      if ((n & 63) === 0 && y + len < FARM_H) {
        ctx.fillStyle = "rgba(220, 236, 246, 0.45)";
        ctx.fillRect(x - 1, y + len, 2, 1);
      }
    }
  }
  if (s.flash > 0) {
    ctx.fillStyle = `rgba(235, 242, 255, ${Math.min(0.55, s.flash * 3.2)})`;
    ctx.fillRect(0, 0, WORLD_W, FARM_H);
  }

  if (hover && hover.x >= 0 && hover.y >= 0 && hover.x < WORLD_W && hover.y < WORLD_H) {
    const tx = Math.floor(hover.x / TILE) * TILE;
    const ty = Math.floor(hover.y / TILE) * TILE;
    ctx.strokeStyle = "#ffe14a";
    ctx.lineWidth = 1;
    ctx.strokeRect(tx + 0.5, ty + 0.5, TILE - 1, TILE - 1);
  }
  drawUnderside(ctx);
}
