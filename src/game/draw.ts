import { MEADOW, SEAM_ROCKS, TILE, WORLD_H, WORLD_W, type Dir, type GameState, type Plot } from "./content.ts";
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
  img: HTMLImageElement,
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
  blit(ctx, sheet, pose.col * 80, row * 112, 80, 112, s.x, s.y, CHAR, flip, 40, 96);
  drawHat(ctx, s, pose, row, flip);
  drawFace(ctx, sheets, s, pose, row, flip);
  ctx.restore();
}

const HAT_DARK = "#152656";
const HAT_BLUE = "#2a4cb8";
const HAT_LITE = "#8eb4f4";
const HAT_GOLD = "#e6c86a";

type HatPix = [number, number, string];

function hatPixels(kind: "front" | "side" | "back"): HatPix[] {
  const out: HatPix[] = [];
  const put = (x: number, y: number, color: string) => out.push([x, y, color]);
  const band = (y: number, x0: number, x1: number, color: string) => {
    for (let x = x0; x <= x1; x++) put(x, y, color);
  };
  if (kind === "side") {
    put(-1, -7, HAT_GOLD);
    band(-6, -2, -1, HAT_BLUE);
    put(-2, -6, HAT_DARK);
    put(0, -6, HAT_DARK);
    band(-5, -2, 0, HAT_BLUE);
    put(-1, -5, HAT_LITE);
    band(-4, -2, 1, HAT_BLUE);
    put(-2, -4, HAT_DARK);
    put(1, -4, HAT_DARK);
    band(-3, -1, 2, HAT_BLUE);
    put(-1, -3, HAT_DARK);
    put(2, -3, HAT_DARK);
    band(-1, -2, 4, HAT_BLUE);
    band(0, -2, 4, HAT_DARK);
    return out;
  }
  const point = kind === "back" ? HAT_BLUE : HAT_GOLD;
  put(0, -8, point);
  put(0, -7, HAT_BLUE);
  band(-6, -1, 1, HAT_BLUE);
  put(-1, -6, HAT_DARK);
  put(1, -6, HAT_DARK);
  if (kind === "front") put(0, -6, HAT_LITE);
  band(-5, -2, 2, HAT_BLUE);
  put(-2, -5, HAT_DARK);
  put(2, -5, HAT_DARK);
  band(-4, -3, 3, HAT_BLUE);
  put(-3, -4, HAT_DARK);
  put(3, -4, HAT_DARK);
  if (kind === "front") put(0, -4, HAT_LITE);
  band(-3, -3, 3, HAT_BLUE);
  band(-1, -5, 5, HAT_BLUE);
  band(0, -5, 5, HAT_DARK);
  return out;
}

function drawHat(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  _pose: { sheet: string; col: number },
  row: number,
  flip: boolean,
) {
  const anchor = row === 1 ? { x: 38, y: 26 } : row === 2 ? { x: 36, y: 25 } : { x: 35, y: 25 };
  const shape = hatPixels(row === 1 ? "side" : row === 2 ? "back" : "front");
  ctx.save();
  ctx.translate(s.x, s.y);
  if (flip) ctx.scale(-1, 1);
  for (const [dx, dy, color] of shape) {
    ctx.fillStyle = color;
    ctx.fillRect((anchor.x + dx - 40) * CHAR, (anchor.y + dy - 96) * CHAR, CHAR, CHAR);
  }
  ctx.restore();
}

const FACES = {
  ok: [2, 2],
  happy: [4, 2],
  tired: [7, 2],
  ill: [8, 2],
  need: [9, 2],
  heart: [6, 2],
} as const;

function drawFace(
  ctx: CanvasRenderingContext2D,
  sheets: Sheets,
  s: GameState,
  _pose: { sheet: string; col: number },
  row: number,
  flip: boolean,
) {
  const img = sheets.emoji;
  const life = s.life;
  if (!img || !life) return;
  const show = life.emote > 0 || life.face === "need" || life.face === "ill" || life.face === "tired" || life.face === "heart" || life.face === "happy";
  if (!show) return;
  const cell = FACES[life.face] ?? FACES.ok;
  const anchor = row === 1 ? { x: 38, y: 26 } : row === 2 ? { x: 36, y: 25 } : { x: 35, y: 25 };
  const hx = s.x + (anchor.x - 40) * CHAR * (flip ? -1 : 1);
  const tip = s.y + (anchor.y - 9 - 96) * CHAR - 1;
  blit(ctx, img, cell[1] * 16 + 1, cell[0] * 16 + 7, 14, 8, hx, tip, 1, false, 7, 8);
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

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  sheets: Sheets,
  hover: { x: number; y: number } | null,
  showTill: boolean,
) {
  const yard = sheets.yard;
  if (yard) ctx.drawImage(yard, 0, 0, WORLD_W, WORLD_H);
  const meadow = sheets.meadow;
  if (meadow) ctx.drawImage(meadow, MEADOW.x, MEADOW.y);

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
  const pose = charPose(s);
  const sheet = sheets[pose.sheet];
  if (sheet) {
    queue.push({
      y: s.y,
      paint: () => paintPlayer(ctx, sheets, s),
    });
  }
  queue.sort((a, b) => a.y - b.y);
  for (const d of queue) d.paint();
  if (sheets.occlude) ctx.drawImage(sheets.occlude, 0, 0);
  if (sheet && feetOnPath(sheets, s.x, s.y)) paintPlayer(ctx, sheets, s);

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
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }
  if (hour >= 20) {
    ctx.fillStyle = "rgba(255, 244, 210, 0.85)";
    for (let i = 0; i < 28; i++) {
      const sx = (i * 53 + 11) % WORLD_W;
      const sy = (i * 37 + 8) % WORLD_H;
      if ((i + Math.floor(s.clock * 2)) % 5 === 0) continue;
      ctx.fillRect(sx, sy, 1, 1);
    }
  }
  if (s.wet > 0.04) {
    ctx.fillStyle = `rgba(28, 58, 72, ${Math.min(0.28, s.wet * 0.26)})`;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const glow = ctx.createRadialGradient(54, 78, 2, 54, 78, 34);
  glow.addColorStop(0, `rgba(255, 170, 60, ${0.35 + skyA})`);
  glow.addColorStop(1, "rgba(255, 120, 20, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(20, 40, 70, 70);
  ctx.restore();

  if (s.weather === "rain" || s.weather === "storm") {
    const drops = s.weather === "storm" ? 110 : 58;
    ctx.strokeStyle = s.weather === "storm" ? "rgba(210, 226, 238, 0.55)" : "rgba(190, 214, 230, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < drops; i++) {
      const x = (i * 47 + s.clock * (s.weather === "storm" ? 90 : 60)) % WORLD_W;
      const y = (i * 83 + s.clock * (s.weather === "storm" ? 160 : 110)) % WORLD_H;
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2, y + (s.weather === "storm" ? 7 : 5));
    }
    ctx.stroke();
  }
  if (s.flash > 0) {
    ctx.fillStyle = `rgba(235, 242, 255, ${Math.min(0.55, s.flash * 3.2)})`;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }

  if (hover && hover.x >= 0 && hover.y >= 0 && hover.x < WORLD_W && hover.y < WORLD_H) {
    const tx = Math.floor(hover.x / TILE) * TILE;
    const ty = Math.floor(hover.y / TILE) * TILE;
    ctx.strokeStyle = "#ffe14a";
    ctx.lineWidth = 1;
    ctx.strokeRect(tx + 0.5, ty + 0.5, TILE - 1, TILE - 1);
  }
}
