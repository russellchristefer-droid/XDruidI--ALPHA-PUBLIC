import { CHAR_FOOT_Y, CHAR_H, CHAR_W, FISH_WATER, MEADOW, REAPER_FRAMES, SEAM_ROCKS, TILE, WORLD_H, WORLD_W, defOf, type Bird, type Dir, type GameState, type Plot, type ReaperPose, type SpellId } from "./content.ts";
import { devSpriteLayers } from "./dev-sprites.ts";
import type { Sheets } from "./assets.ts";
import { birdGlow } from "./birdsong.ts";
import { TOOL_ANIM, findItem } from "./logic.ts";
import { drawEastGate } from "./paint/eastGate.ts";
import { drawWestGate } from "./paint/westGate.ts";
import { drawMosaicFloors } from "./paint/mosaicFloor.ts";

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
  if (img instanceof HTMLImageElement && img.naturalWidth <= 0) return;
  const dw = Math.max(1, Math.round(sw * scale));
  const dh = Math.max(1, Math.round(sh * scale));
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, sx, sy, sw, sh, Math.round(-footX * scale), Math.round(-footY * scale), dw, dh);
  ctx.restore();
}

function heldTool(s: GameState): string | null {
  const it = findItem(s, s.activeId);
  const tool = it ? defOf(it).tool : null;
  if (tool === "water") return "water";
  if (tool === "shovel") return "shovel";
  if (tool === "scythe") return "scythe";
  if (tool === "axe") return "axe";
  if (tool === "hammer") return "hammer";
  return null;
}

function charPose(s: GameState): { sheet: string; frames: number; col: number } {
  const act = s.action;
  if (act) {
    const spec = TOOL_ANIM[act.kind];
    if (spec) {
      const col = Math.min(spec.frames - 1, Math.floor((act.elapsed / Math.max(0.05, act.dur)) * spec.frames));
      return { sheet: spec.sheet, frames: spec.frames, col };
    }
    return { sheet: "handsidle", frames: 2, col: Math.floor(s.clock * 6) % 2 };
  }
  const hands = !!s.body.hands;
  if (s.speed > 1) {
    return {
      sheet: hands ? "handswalk" : "walk",
      frames: 8,
      col: Math.floor(s.clock * 10) % 8,
    };
  }
  const held = heldTool(s);
  if (held && !hands) return { sheet: held, frames: 1, col: 0 };
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

function wornSheet(base: string, s: GameState): string {
  const named = base.charAt(0).toUpperCase() + base.slice(1);
  if ((s.wing ?? 0) === 0 && s.y >= 250 && s.y < 528) return `court${named}`;
  return `plain${named}`;
}

function paintPlayer(ctx: CanvasRenderingContext2D, sheets: Sheets, s: GameState) {
  const pose = charPose(s);
  const key = wornSheet(pose.sheet, s);
  const picked = sheets[key];
  const sheet = picked && picked.width > 0 ? picked : sheets[pose.sheet];
  if (!sheet) return;
  const { row, flip } = rowOf(s.dir);
  const footX = row === 1 ? 37 : 35;
  ctx.save();
  if (s.downed) ctx.translate(0, 4);
  const court = key.startsWith("court");
  if (court) {
    ctx.globalAlpha = 0.22;
    blit(ctx, sheet, pose.col * CHAR_W, row * CHAR_H, CHAR_W, CHAR_H, s.x, s.y - 2, CHAR, flip, footX, CHAR_FOOT_Y);
    ctx.globalAlpha = 0.62;
  }
  blit(ctx, sheet, pose.col * CHAR_W, row * CHAR_H, CHAR_W, CHAR_H, s.x, s.y, CHAR, flip, footX, CHAR_FOOT_Y);
  ctx.globalAlpha = 1;
  if (court) {
    for (let i = 0; i < 7; i++) {
      const p = (s.clock * 0.35 + i / 7) % 1;
      const sway = Math.sin(s.clock * 1.2 + i) * 3;
      ctx.fillStyle = i % 2 === 0 ? "rgba(255, 246, 220, 0.85)" : "rgba(226, 196, 140, 0.7)";
      ctx.fillRect(Math.round(s.x - 6 + (i % 4) * 4 + sway), Math.round(s.y - 8 - p * 22), 1, 1);
    }
  }
  drawEffect(ctx, sheets, s);
  ctx.restore();
}

const SPELL_KIND: Record<SpellId, "bolt" | "burst" | "strike" | "drip"> = {
  fireball: "bolt",
  iceball: "bolt",
  spark: "bolt",
  poison: "bolt",
  nova: "burst",
  holy: "burst",
  ice: "burst",
  bolt: "strike",
  drip: "drip",
};

function riteRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, color: string): void {
  const n = Math.max(16, Math.round(rx * 5));
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    ctx.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1);
  }
}

function drawCastRite(ctx: CanvasRenderingContext2D, s: GameState): void {
  const cast = s.cast;
  if (!cast) return;
  const t = Math.max(0, Math.min(1, cast.t));
  const cx = Math.round(s.x);
  const cy = Math.round(s.y) - 1;
  const holy = cast.spell === "holy";
  const ink = cast.spell === "ice" || cast.spell === "iceball"
    ? { gold: "#d7e4ee", pale: "#f7fbff", deep: "#6a8498" }
    : cast.spell === "spark" || cast.spell === "bolt"
      ? { gold: "#e6c86a", pale: "#fff4d2", deep: "#8a6830" }
      : cast.spell === "poison" || cast.spell === "drip"
        ? { gold: "#a08060", pale: "#e4d2b4", deep: "#4a2818" }
        : holy
          ? { gold: "#f6e7c0", pale: "#fff8ea", deep: "#b89048" }
          : { gold: "#e2b657", pale: "#fff1c8", deep: "#785018" };
  const gold = ink.gold;
  const pale = ink.pale;
  const deep = ink.deep;
  const blue = "#1e3470";
  const rx = 10 + t * 12;
  riteRing(ctx, cx, cy, rx, rx * 0.42, gold);
  riteRing(ctx, cx, cy, Math.max(5, rx - 3), Math.max(2, rx - 3) * 0.42, pale);
  riteRing(ctx, cx, cy, Math.max(3, rx - 6), Math.max(2, rx - 6) * 0.42, blue);
  const box = 7 + Math.round(t * 6);
  ctx.fillStyle = deep;
  ctx.fillRect(cx - box, cy - Math.round(box * 0.4), box * 2, 1);
  ctx.fillRect(cx - box, cy + Math.round(box * 0.4), box * 2, 1);
  ctx.fillRect(cx - box, cy - Math.round(box * 0.4), 1, Math.round(box * 0.8));
  ctx.fillRect(cx + box, cy - Math.round(box * 0.4), 1, Math.round(box * 0.8));
  const R = 6 + t * 8;
  for (let pass = 0; pass < 2; pass++) {
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < 3; i++) {
      const a = (pass === 0 ? -Math.PI / 2 : Math.PI / 2) + (i * Math.PI * 2) / 3;
      pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.42]);
    }
    ctx.fillStyle = pass === 0 ? pale : deep;
    for (let i = 0; i < 3; i++) {
      const a = pts[i]!;
      const b = pts[(i + 1) % 3]!;
      for (let k = 0; k <= 8; k++) {
        const u = k / 8;
        ctx.fillRect(Math.round(a[0] + (b[0] - a[0]) * u), Math.round(a[1] + (b[1] - a[1]) * u), 1, 1);
      }
    }
  }
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 4 + t;
    ctx.fillStyle = i % 2 === 0 ? pale : gold;
    ctx.fillRect(Math.round(cx + Math.cos(a) * (R + 3)), Math.round(cy + Math.sin(a) * (R + 3) * 0.42), 1, 1);
  }
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(cx, cy, 1, 1);
  ctx.fillStyle = holy ? "#fff6e4" : gold;
  ctx.fillRect(cx - 1, cy, 1, 1);
  ctx.fillRect(cx + 1, cy, 1, 1);
  for (const [dx, dy] of [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ] as const) {
    const qx = cx + dx * (box + 3);
    const qy = cy + Math.round(dy * (box + 3) * 0.42);
    ctx.fillStyle = pale;
    ctx.fillRect(qx, qy, 1, 1);
    ctx.fillStyle = deep;
    ctx.fillRect(qx + dx, qy + (dy === 0 ? 0 : dy), 1, 1);
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + t * 0.4;
    ctx.fillStyle = i % 3 === 0 ? pale : gold;
    ctx.fillRect(Math.round(cx + Math.cos(a) * (rx + 2)), Math.round(cy + Math.sin(a) * (rx + 2) * 0.42), 1, 1);
  }
  for (let i = 0; i < 8; i++) {
    const p = (t * 0.9 + i / 8) % 1;
    ctx.fillStyle = i % 2 === 0 ? pale : "#e7b8bc";
    ctx.fillRect(cx - 8 + i * 2, Math.round(cy - 2 - p * 18), 1, 1);
  }
}

function paintWorking(ctx: CanvasRenderingContext2D, spell: SpellId, x: number, y: number, spin: number, wide: boolean): void {
  const hx = Math.round(x);
  const hy = Math.round(y);
  const r = wide ? 7 : 4;
  const ring = (radius: number, color: string, n: number) => {
    ctx.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const a = spin + (i / n) * Math.PI * 2;
      ctx.fillRect(Math.round(hx + Math.cos(a) * radius), Math.round(hy + Math.sin(a) * radius * 0.72), 1, 1);
    }
  };
  if (spell === "poison" || spell === "drip") {
    ring(r, "#6a4030", 8);
    ring(r - 2, "#e2c48a", 6);
    ctx.fillStyle = "#f3e2c0";
    ctx.fillRect(hx, hy - r - 1, 1, 1);
    ctx.fillStyle = "#4a2818";
    ctx.fillRect(hx - 1, hy + 2, 1, 2);
    return;
  }
  if (spell === "ice" || spell === "iceball") {
    ctx.fillStyle = "#f7fbff";
    for (let i = 0; i < 6; i++) {
      const a = spin * 0.4 + (i * Math.PI) / 3;
      const x0 = hx + Math.cos(a) * 2;
      const y0 = hy + Math.sin(a) * 1;
      ctx.fillRect(Math.round(x0), Math.round(y0), 1, 1);
      ctx.fillStyle = i % 2 === 0 ? "#d5e6f0" : "#8aa4b4";
      ctx.fillRect(Math.round(hx + Math.cos(a) * r), Math.round(hy + Math.sin(a) * (r * 0.7)), 1, 2);
      ctx.fillStyle = "#f7fbff";
    }
    ctx.fillRect(hx, hy, 1, 1);
    return;
  }
  if (spell === "spark" || spell === "bolt") {
    ctx.fillStyle = "#e6c86a";
    const pts = [
      [0, -r],
      [2, -1],
      [-1, 0],
      [2, 2],
      [0, r],
    ];
    for (const [px, py] of pts) ctx.fillRect(hx + px, hy + py, 1, 1);
    ctx.fillStyle = "#fff6d4";
    ctx.fillRect(hx, hy, 1, 1);
    return;
  }
  if (spell === "holy") {
    ring(r, "#f0ddb0", 10);
    ring(Math.max(2, r - 3), "#fffaf0", 6);
    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(hx, hy, 1, 1);
    return;
  }
  ring(r, "#c47828", 8);
  ring(Math.max(2, r - 2), "#ffe7a4", 6);
  ctx.fillStyle = "#fff6d4";
  ctx.fillRect(hx, hy, 1, 1);
  ctx.fillStyle = "#e09040";
  ctx.fillRect(hx, hy - 1, 1, 1);
  ctx.fillRect(hx + 1, hy + 1, 1, 1);
}

function drawSpell(ctx: CanvasRenderingContext2D, _sheets: Sheets, s: GameState): void {
  const cast = s.cast;
  if (!cast) return;
  const kind = SPELL_KIND[cast.spell];
  const dx = s.dir === "e" ? 1 : s.dir === "w" ? -1 : 0;
  const dy = s.dir === "s" ? 1 : s.dir === "n" ? -1 : 0;
  const t = Math.max(0, Math.min(1, cast.t));
  let reach = 0;
  if (kind === "bolt") {
    const flying = t < 0.68;
    reach = flying ? 8 + (t / 0.68) * 28 : 36;
  } else if (kind === "strike") reach = 12;
  else if (kind === "drip") reach = 6;
  const handX = s.x + dx * 5;
  const handY = s.y - 12;
  const x = handX + dx * reach;
  const y = handY + dy * (kind === "bolt" ? reach : kind === "strike" ? 4 : 0);
  paintWorking(ctx, cast.spell, x, y, s.clock + t, kind === "burst");
  const ink =
    cast.spell === "ice" || cast.spell === "iceball"
      ? ["#f7fbff", "#b9d4e6", "#4e7088"]
      : cast.spell === "spark" || cast.spell === "bolt"
        ? ["#fff6d4", "#e4c56a", "#7a5828"]
        : cast.spell === "poison" || cast.spell === "drip"
          ? ["#efe0c4", "#8a6240", "#3a2414"]
          : cast.spell === "holy"
            ? ["#fffaf0", "#f0ddb0", "#a88440"]
            : ["#fff1d0", "#e09040", "#7a3014"];
  const hx = Math.round(x);
  const hy = Math.round(y);
  const ox = Math.round(handX);
  const oy = Math.round(handY);
  for (let i = 1; i <= 6; i++) {
    const u = i / 7;
    ctx.fillStyle = ink[i % 3]!;
    ctx.fillRect(Math.round(ox + (hx - ox) * u), Math.round(oy + (hy - oy) * u), 1, 1);
  }
  ctx.fillStyle = ink[1]!;
  ctx.fillRect(ox, oy, 1, 1);
  ctx.fillStyle = ink[0]!;
  ctx.fillRect(ox, oy - 1, 1, 1);
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
  footY = 66,
  rate = 8,
) {
  const img = moving && walk ? walk : idle;
  if (!img) return;
  const row = animalRow(dir);
  const frames = moving ? Math.max(1, Math.floor(img.width / 72)) : 1;
  const col = moving ? Math.floor(s.clock * rate) % frames : 0;
  blit(ctx, img, col * 72, row * 72, 72, 72, x, y, scale, false, 36, footY);
}

const REAPER_SHEET: Record<ReaperPose, string> = {
  idle: "reaperIdle",
  walk: "reaperWalk",
  handsidle: "reaperHandsIdle",
  handswalk: "reaperHandsWalk",
  water: "reaperWater",
  shovel: "reaperShovel",
  scythe: "reaperScythe",
  axe: "reaperAxe",
  hammer: "reaperHammer",
  pickaxe: "reaperPickaxe",
};

function reaperRow(dir: Dir): { row: number; flip: boolean } {
  if (dir === "n") return { row: 2, flip: false };
  if (dir === "e") return { row: 1, flip: true };
  if (dir === "w") return { row: 1, flip: false };
  return { row: 0, flip: false };
}

/** Frames that keep one facing. The sheet mixes profiles into the front cycle. */
const REAPER_STRIDE: Record<Dir, number[]> = {
  s: [5, 6, 2, 6],
  n: [0, 1, 2, 6, 7, 6, 2, 1],
  w: [0, 6, 5, 6],
  e: [0, 6, 5, 6],
};

type ReaperAnchors = { x: Float32Array; y: Uint16Array; frames: number };

const reaperAnchors = new WeakMap<HTMLImageElement, ReaperAnchors>();

function reaperAnchor(img: HTMLImageElement, col: number, row: number): { x: number; y: number } {
  const frames = Math.max(1, Math.floor(img.width / 32));
  const rows = Math.max(1, Math.floor(img.height / 32));
  let table = reaperAnchors.get(img);
  if (!table) {
    table = { x: new Float32Array(frames * rows), y: new Uint16Array(frames * rows), frames };
    table.x.fill(16);
    table.y.fill(30);
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext("2d", { willReadFrequently: true });
    if (g && img.width > 0) {
      g.drawImage(img, 0, 0);
      const data = g.getImageData(0, 0, c.width, c.height).data;
      for (let r = 0; r < rows; r++) {
        for (let f = 0; f < frames; f++) {
          let sum = 0;
          let n = 0;
          let ground = 0;
          for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
              const a = data[((r * 32 + y) * c.width + f * 32 + x) * 4 + 3] ?? 0;
              if (a <= 16) continue;
              if (y > ground) ground = y;
              if (y >= 8 && y <= 20) {
                sum += x;
                n++;
              }
            }
          }
          const i = r * frames + f;
          table.x[i] = n > 0 ? sum / n : 16;
          table.y[i] = ground || 30;
        }
      }
    }
    reaperAnchors.set(img, table);
  }
  const i = row * table.frames + (col % table.frames);
  return { x: table.x[i] ?? 16, y: table.y[i] ?? 30 };
}

function paintReaper(ctx: CanvasRenderingContext2D, sheets: Sheets, s: GameState) {
  const r = s.reaper;
  if (!r) return;
  const img = sheets[REAPER_SHEET[r.pose]];
  if (!img || img.width < 32) return;
  const frames = REAPER_FRAMES[r.pose];
  const { row, flip } = reaperRow(r.dir);
  const moving = r.pose === "walk" || r.pose === "handswalk";
  const col = moving
    ? REAPER_STRIDE[r.dir][Math.floor(r.poseT * 4) % REAPER_STRIDE[r.dir].length]! % frames
    : r.pose === "idle" || r.pose === "handsidle"
      ? Math.floor(r.poseT * 2) % frames
      : Math.min(frames - 1, Math.floor(r.poseT * 6));
  const anchor = reaperAnchor(img, col, row);
  blit(ctx, img, col * 32, row * 32, 32, 32, r.x, r.y, 1, flip, anchor.x, anchor.y);
}

const PLATE = 192;
const FARM_H = MEADOW.y;

function fillOval(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, color: string): void {
  ctx.fillStyle = color;
  const ry2 = ry * ry;
  for (let y = -ry; y <= ry; y++) {
    const t = 1 - (y * y) / ry2;
    if (t <= 0) continue;
    const nx = Math.floor(rx * Math.sqrt(t));
    ctx.fillRect(cx - nx, cy + y, nx * 2 + 1, 1);
  }
}

function gateXs(wing: number): number[] {
  const gates: number[] = [];
  if (wing !== -1) gates.push(40);
  if (wing !== 1) gates.push(308);
  return gates;
}

const PORTAL_BASE = 228;

function drawPortal(
  ctx: CanvasRenderingContext2D,
  sheets: Sheets,
  cx: number,
  cy: number,
  east: boolean,
  clock: number,
): void {
  const img = sheets[east ? "portalSvarga" : "portalNaraka"];
  if (img && img.width > 0) {
    ctx.imageSmoothingEnabled = false;
    const maxW = 80;
    const maxH = 112;
    const scale = Math.min(1, maxW / img.width, maxH / img.height);
    const dw = Math.max(1, Math.round(img.width * scale));
    const dh = Math.max(1, Math.round(img.height * scale));
    const x = Math.max(1, Math.min(WORLD_W - dw - 1, Math.round(cx - dw / 2)));
    const y = Math.round(PORTAL_BASE - dh);
    ctx.drawImage(img, 0, 0, img.width, img.height, x, y, dw, dh);
    paintPortalMouth(ctx, x, y, dw, dh, east, clock);
    paintThreshold(ctx, cx, east, clock);
    return;
  }
  if (east) drawEastGate(ctx, cx, cy, clock);
  else drawWestGate(ctx, cx, cy, clock);
}

function paintPortalMouth(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dw: number,
  dh: number,
  east: boolean,
  clock: number,
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (east) {
    const stars: Array<[number, number]> = [
      [0.42, 0.5],
      [0.58, 0.46],
      [0.5, 0.62],
    ];
    for (let i = 0; i < stars.length; i++) {
      if (Math.floor(clock * 1.6 + i * 1.7) % 4 === 0) continue;
      const [sx, sy] = stars[i]!;
      ctx.fillStyle = "rgba(255, 252, 232, 0.95)";
      ctx.fillRect(Math.round(x + dw * sx), Math.round(y + dh * sy), 1, 1);
    }
  } else {
    const stars: Array<[number, number]> = [
      [0.44, 0.58],
      [0.56, 0.66],
      [0.5, 0.74],
    ];
    const span = Math.max(8, Math.round(dh * 0.28));
    for (let i = 0; i < stars.length; i++) {
      const [sx, sy] = stars[i]!;
      const rise = Math.floor(clock * 6 + i * 5) % span;
      ctx.fillStyle = "rgba(255, 150, 48, 0.95)";
      ctx.fillRect(Math.round(x + dw * sx), Math.round(y + dh * sy) - rise, 1, 1);
    }
  }
  ctx.restore();
}

function paintThreshold(ctx: CanvasRenderingContext2D, cx: number, east: boolean, clock: number): void {
  const y = PORTAL_BASE - 1;
  if (east) {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      ctx.fillStyle = i % 2 === 0 ? "#fff6d4" : "#e2b657";
      ctx.fillRect(Math.round(cx + Math.cos(a) * 8), Math.round(y + Math.sin(a) * 3), 1, 1);
    }
    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(Math.round(cx), y, 1, 1);
    return;
  }
  ctx.fillStyle = "#5a4630";
  ctx.fillRect(cx - 7, y, 6, 1);
  ctx.fillRect(cx - 7, y - 5, 1, 5);
  ctx.fillRect(cx + 2, y, 6, 1);
  ctx.fillRect(cx + 7, y - 5, 1, 5);
  ctx.fillStyle = "#4a1016";
  ctx.fillRect(cx - 1, y - (Math.floor(clock * 3) % 4), 1, 1);
}

function portalIsEast(wing: number, cx: number): boolean {
  if (wing === 1) return true;
  if (wing === -1) return false;
  return cx > 170;
}

function drawSideGates(ctx: CanvasRenderingContext2D, s: GameState, sheets: Sheets): void {
  const wing = s.wing ?? 0;
  for (const cx of gateXs(wing)) drawPortal(ctx, sheets, cx, 202, portalIsEast(wing, cx), s.clock);
}

function playerInPortal(s: GameState): boolean {
  for (const cx of gateXs(s.wing ?? 0)) {
    if (Math.abs(s.x - cx) < 36 && s.y >= 200) return true;
  }
  return false;
}

let voidPlate: HTMLCanvasElement | null = null;
let rockPlate: HTMLCanvasElement | null = null;

function noise(x: number, y: number): number {
  let n = (x * 374761393 + y * 668265263) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n >>> 24) & 255;
}

function ensureVoid(): HTMLCanvasElement | null {
  if (voidPlate) return voidPlate;
  if (typeof document === "undefined") return null;
  const h = WORLD_H - FARM_H;
  const canvas = document.createElement("canvas");
  canvas.width = WORLD_W;
  canvas.height = h;
  const g = canvas.getContext("2d");
  if (!g) return null;
  const img = g.createImageData(WORLD_W, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      const i = (y * WORLD_W + x) * 4;
      const east = x / WORLD_W;
      const n = noise(x, y);
      let r = 8 + east * 22;
      let gr = 10 + (1 - east) * 8;
      let b = 18 + (1 - east) * 14;
      const blob = (cx: number, cy: number, rx: number, ry: number) => {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        return Math.max(0, 1 - (dx * dx + dy * dy));
      };
      const gold = blob(250, 70, 90, 36) + blob(280, 180, 70, 28);
      const rust = blob(70, 90, 80, 40) + blob(40, 220, 60, 30);
      const ink = blob(174, 200, 120, 50);
      r += gold * 48 + rust * 36;
      gr += gold * 28 + rust * 10;
      b += gold * 8 + ink * 10;
      const lane = Math.exp(-((y - h * 0.42) * (y - h * 0.42)) / 1800);
      r += lane * (10 + east * 18);
      gr += lane * 8;
      b += lane * (14 - east * 6);
      if (n % 97 === 0) {
        r = east > 0.5 ? 255 : 210;
        gr = east > 0.5 ? 236 : 180;
        b = east > 0.5 ? 190 : 160;
      }
      r += (n % 17) - 8;
      gr += ((n >> 2) % 15) - 7;
      b += ((n >> 4) % 11) - 5;
      if (n % 5 === 0) {
        r += 14;
        gr += 10;
        b += 6;
      }
      if (n % 47 === 0) {
        r += 30;
        gr += east > 0.5 ? 22 : 8;
        b += east > 0.5 ? 6 : 16;
      }
      d[i] = Math.max(0, Math.min(255, r));
      d[i + 1] = Math.max(0, Math.min(255, gr));
      d[i + 2] = Math.max(0, Math.min(255, b));
      d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  voidPlate = canvas;
  return canvas;
}

function ensureRock(): HTMLCanvasElement | null {
  if (rockPlate) return rockPlate;
  if (typeof document === "undefined") return null;
  const h = 72;
  const canvas = document.createElement("canvas");
  canvas.width = WORLD_W;
  canvas.height = h;
  const g = canvas.getContext("2d");
  if (!g) return null;
  const img = g.createImageData(WORLD_W, h);
  const d = img.data;
  for (let x = 0; x < WORLD_W; x++) {
    const dome = Math.sin((x / (WORLD_W - 1)) * Math.PI);
    const depth = 16 + Math.round(dome ** 0.65 * 34) + (noise(x, 1) % 6);
    const crack = noise(x, 4) % 29 === 0;
    for (let y = 0; y < h; y++) {
      const i = (y * WORLD_W + x) * 4;
      if (y > depth + 8) continue;
      const n = noise(x, y);
      const east = x > 174;
      let r = 28;
      let gr = 18;
      let b = 12;
      if (y < 2) {
        r = 78 + (n % 28);
        gr = 112 + (n % 22);
        b = 38;
      } else if (y < 5) {
        r = 96 + (n % 18);
        gr = 64 + (n % 10);
        b = 36;
      } else if (y < 12) {
        r = 72 + (n % 16);
        gr = 46 + (n % 8);
        b = 26;
      } else if (y < 28) {
        r = 48 + (n % 14) + (east ? 12 : 0);
        gr = 30 + (n % 8);
        b = 16;
      } else {
        r = 22 + (n % 10);
        gr = 14 + (n % 6);
        b = 10;
      }
      if ((y + Math.floor(x / 17)) % 9 === 0 && y > 8) {
        r -= 10;
        gr -= 8;
        b -= 4;
      }
      if (crack && y > 6) {
        r = Math.floor(r * 0.45);
        gr = Math.floor(gr * 0.45);
        b = Math.floor(b * 0.45);
      }
      if (n % 23 === 0 && y > 10 && y < 26) {
        r = east ? 168 : 86;
        gr = east ? 124 : 40;
        b = east ? 54 : 24;
      }
      d[i] = Math.max(0, Math.min(255, r));
      d[i + 1] = Math.max(0, Math.min(255, gr));
      d[i + 2] = Math.max(0, Math.min(255, b));
      d[i + 3] = y > depth ? 0 : 255;
    }
  }
  g.putImageData(img, 0, 0);
  rockPlate = canvas;
  return canvas;
}

function drawSpace(ctx: CanvasRenderingContext2D, clock: number): void {
  ctx.fillStyle = "#04060e";
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  const nebula = ensureVoid();
  if (nebula) ctx.drawImage(nebula, 0, FARM_H);
  for (let i = 0; i < 280; i++) {
    const x = (i * 53 + 9) % WORLD_W;
    const y = FARM_H + 6 + ((i * 37) % (WORLD_H - FARM_H - 12));
    const east = x > 174;
    const tw = (i + Math.floor(clock * 2)) % 11 === 0;
    ctx.fillStyle = east ? (i % 8 === 0 ? "#f6d48a" : "#fff6d0") : i % 8 === 0 ? "#c46a4a" : "#b7c0d4";
    ctx.fillRect(x, y, tw ? 2 : 1, 1);
    if (i % 17 === 0) {
      ctx.fillStyle = east ? "#e2b657" : "#6a4038";
      ctx.fillRect(x - 2, y, 5, 1);
      ctx.fillRect(x, y - 2, 1, 5);
    }
  }
  const ringY = FARM_H + 118;
  for (let i = 0; i < 56; i++) {
    const a = clock * 0.12 + (i / 56) * Math.PI * 2;
    ctx.fillStyle = i % 7 === 0 ? "#fff4d2" : i % 2 === 0 ? "#3a5280" : "#1c2436";
    ctx.fillRect(Math.round(174 + Math.cos(a) * 96), Math.round(ringY + Math.sin(a) * 26), 1, 1);
  }
  ctx.fillStyle = "#fff4d2";
  ctx.fillRect(174, ringY, 1, 1);
  const figures: Array<Array<[number, number]>> = [
    [
      [36, 48],
      [52, 40],
      [44, 62],
      [28, 70],
    ],
    [
      [250, 54],
      [268, 46],
      [284, 60],
      [270, 74],
      [252, 68],
    ],
    [
      [120, 200],
      [140, 188],
      [156, 206],
      [134, 214],
    ],
  ];
  for (const fig of figures) {
    ctx.fillStyle = fig[0]![0] > 174 ? "#e2b657" : "#8a6848";
    for (let i = 0; i < fig.length; i++) {
      const a = fig[i]!;
      const b = fig[(i + 1) % fig.length]!;
      ctx.fillRect(a[0], FARM_H + a[1], 2, 1);
      ctx.fillRect(b[0], FARM_H + b[1], 1, 2);
      ctx.fillRect(Math.round((a[0] + b[0]) / 2), FARM_H + Math.round((a[1] + b[1]) / 2), 1, 1);
    }
  }
  const bob = Math.sin(clock * 0.35);
  paintOrb(ctx, 56, FARM_H + 46 + bob, 11, "#e8eef8", "#6a7a90");
  paintOrb(ctx, 300, FARM_H + 78 - bob, 15, "#7eb0d4", "#243848");
  ctx.fillStyle = "#d5e4f0";
  ctx.fillRect(248, Math.round(FARM_H + 76 - bob), 92, 1);
  ctx.fillRect(258, Math.round(FARM_H + 80 - bob), 72, 1);
  ctx.fillStyle = "#8aa4c0";
  ctx.fillRect(270, Math.round(FARM_H + 82 - bob), 48, 1);
  paintOrb(ctx, 168, FARM_H + 150, 18, "#e6c878", "#7a5a30");
  ctx.fillStyle = "#f3e6c0";
  ctx.fillRect(128, FARM_H + 148, 80, 1);
  ctx.fillStyle = "#a88858";
  ctx.fillRect(140, FARM_H + 152, 56, 1);
  paintOrb(ctx, 40, FARM_H + 220, 7, "#c46a4a", "#4a241c");
  paintOrb(ctx, 250, FARM_H + 280, 5, "#d8d2ea", "#5a5878");
  for (let i = 0; i < 110; i++) {
    const x = (i * 11 + Math.floor(clock * 0.6)) % WORLD_W;
    const y = FARM_H + 12 + ((i * 13) % (WORLD_H - FARM_H - 20));
    ctx.fillStyle = i % 4 === 0 ? "rgba(220, 226, 250, 0.5)" : "rgba(90, 110, 160, 0.28)";
    ctx.fillRect(x, y, 1, 1);
  }
  const comet = (clock * 22) % (WORLD_W + 40);
  ctx.fillStyle = "#9ecbff";
  ctx.fillRect(comet - 14, FARM_H + 64, 14, 1);
  ctx.fillStyle = "#f4f7ff";
  ctx.fillRect(comet, FARM_H + 63, 2, 2);
  ctx.fillStyle = "rgba(158, 203, 255, 0.45)";
  ctx.fillRect(comet - 8, FARM_H + 65, 6, 1);
}

function paintOrb(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string, shade: string): void {
  for (let dy = -r; dy <= r; dy++) {
    const span = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
    ctx.fillStyle = dy > r * 0.2 ? shade : fill;
    ctx.fillRect(cx - span, cy + dy, span * 2, 1);
  }
  ctx.fillStyle = "rgba(255, 250, 240, 0.85)";
  ctx.fillRect(cx - Math.floor(r * 0.35), cy - Math.floor(r * 0.45), 2, 1);
  ctx.fillStyle = shade;
  ctx.fillRect(cx + Math.floor(r * 0.25), cy + Math.floor(r * 0.15), 2, 1);
}

function drawUnderside(ctx: CanvasRenderingContext2D): void {
  const rock = ensureRock();
  if (rock) ctx.drawImage(rock, 0, FARM_H);
}

function drawCampfire(ctx: CanvasRenderingContext2D, sheet: HTMLImageElement, clock: number) {
  const frame = Math.floor(clock * 6) % 4;
  const flick = 0.5 + 0.5 * Math.sin(clock * 9);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = `rgba(255, 150, 48, ${0.05 + flick * 0.04})`;
  ctx.beginPath();
  ctx.arc(44, 78, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.drawImage(sheet, frame * 48, 56, 48, 40, 28, 58, 32, 27);
}

function drawSvarga(ctx: CanvasRenderingContext2D, _clock: number, sheet?: HTMLImageElement): void {
  ctx.imageSmoothingEnabled = false;
  if (sheet && sheet.width > 0) ctx.drawImage(sheet, 0, 0);
  else {
    ctx.fillStyle = "#c4a060";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }
}

function giltOver(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  fillOval(ctx, x, y, 16, 10, "#e6c060");
  fillOval(ctx, x, y - 3, 10, 6, "#fff1c4");
  ctx.fillStyle = "#e87898";
  ctx.fillRect(x - 6, y - 1, 2, 2);
  ctx.fillRect(x + 5, y + 2, 2, 2);
  ctx.fillStyle = "#7ec8c3";
  ctx.fillRect(x + 1, y - 4, 2, 2);
  ctx.fillStyle = "#c9a24a";
  ctx.fillRect(x - 1, y + 8, 3, 6);
}

function drawApsara(ctx: CanvasRenderingContext2D, x: number, y: number, pose: number): void {
  ctx.fillStyle = "#f7e7c0";
  ctx.fillRect(x, y, 2, 8);
  ctx.fillStyle = "#fff6d0";
  ctx.fillRect(x, y - 2, 2, 2);
  ctx.fillStyle = "#e87898";
  ctx.fillRect(x - 2, y + 2, 2, 1 + (pose % 2));
  ctx.fillRect(x + 2, y + 1 + (pose % 3), 2, 2);
  ctx.fillStyle = "#c9a24a";
  ctx.fillRect(x - 1, y + 7, 4, 1);
}

function drawAmaravatI(ctx: CanvasRenderingContext2D, clock: number): void {
  const x = 128;
  const y = 52;
  ctx.fillStyle = "#f3e2b0";
  ctx.fillRect(x, y + 36, 112, 36);
  ctx.fillStyle = "#d7efe8";
  ctx.fillRect(x + 4, y + 64, 104, 6);
  ctx.fillStyle = "#f7fffd";
  ctx.fillRect(x + 8, y + 64, 36, 2);
  for (let i = 0; i < 5; i++) {
    const sx = x + 8 + i * 22;
    ctx.fillStyle = "#e8d7a4";
    ctx.fillRect(sx, y + 28, 6, 40);
    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(sx, y + 28, 1, 40);
    ctx.fillStyle = "#a88848";
    ctx.fillRect(sx + 5, y + 28, 1, 40);
    ctx.fillStyle = "#f4e2a8";
    ctx.fillRect(sx - 2, y + 22, 10, 6);
    ctx.fillRect(sx, y + 18, 6, 4);
  }
  ctx.fillStyle = "#e8c878";
  ctx.fillRect(x - 6, y + 16, 124, 6);
  ctx.fillRect(x + 8, y + 10, 96, 6);
  ctx.fillRect(x + 28, y + 4, 56, 6);
  ctx.fillStyle = "#fff6d0";
  ctx.fillRect(x - 6, y + 16, 124, 1);
  ctx.fillStyle = "#f4e2a8";
  ctx.fillRect(x + 50, y - 4, 10, 8);
  ctx.fillRect(x + 46, y + 2, 18, 3);
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(x + 53, y - 6, 4, 3);
  ctx.fillStyle = "#6a4030";
  ctx.fillRect(x + 50, y + 48, 14, 24);
  ctx.fillStyle = "#2a1c10";
  ctx.fillRect(x + 52, y + 50, 10, 22);
  const glow = 0.28 + 0.12 * Math.sin(clock * 1.2);
  ctx.fillStyle = `rgba(255, 244, 210, ${glow})`;
  ctx.fillRect(x + 54, y + 54, 6, 12);
  ctx.fillStyle = "#e87898";
  ctx.fillRect(x + 4, y + 44, 2, 10);
  ctx.fillRect(x + 106, y + 44, 2, 10);
  ctx.fillStyle = "#7ec8c3";
  ctx.fillRect(x + 16, y + 40, 2, 2);
  ctx.fillRect(x + 94, y + 40, 2, 2);
}

function drawAiravata(ctx: CanvasRenderingContext2D, clock: number): void {
  const bob = Math.sin(clock * 0.7) > 0 ? 0 : 1;
  const x = 236;
  const y = 128 + bob;
  fillOval(ctx, x + 34, y + 40, 26, 4, "rgba(80, 60, 20, 0.28)");
  ctx.fillStyle = "#f4efe6";
  ctx.fillRect(x + 16, y + 10, 42, 18);
  ctx.fillStyle = "#fffaf4";
  ctx.fillRect(x + 22, y + 12, 16, 6);
  ctx.fillStyle = "#e4ddd0";
  ctx.fillRect(x + 18, y + 26, 5, 10);
  ctx.fillRect(x + 28, y + 26, 5, 10);
  ctx.fillRect(x + 42, y + 26, 5, 10);
  ctx.fillRect(x + 50, y + 26, 5, 10);
  ctx.fillStyle = "#f7f3ea";
  ctx.fillRect(x + 4, y + 12, 16, 12);
  ctx.fillStyle = "#e7e0d4";
  ctx.fillRect(x, y + 6, 7, 14);
  ctx.fillRect(x + 16, y + 8, 6, 10);
  ctx.fillStyle = "#2a241c";
  ctx.fillRect(x + 8, y + 16, 2, 2);
  ctx.fillStyle = "#f4efe6";
  ctx.fillRect(x + 6, y + 22, 4, 12);
  ctx.fillRect(x + 3, y + 32, 5, 3);
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(x + 2, y + 20, 6, 2);
  ctx.fillRect(x + 14, y + 20, 6, 2);
  ctx.fillRect(x + 3, y + 22, 2, 4);
  ctx.fillRect(x + 15, y + 22, 2, 4);
  ctx.fillStyle = "#a33b3b";
  ctx.fillRect(x + 20, y + 14, 34, 5);
  ctx.fillStyle = "#e6c86a";
  ctx.fillRect(x + 24, y + 15, 4, 3);
  ctx.fillRect(x + 32, y + 15, 4, 3);
  ctx.fillRect(x + 40, y + 15, 4, 3);
}

function drawKamadhenu(ctx: CanvasRenderingContext2D, clock: number): void {
  const bob = Math.sin(clock * 1.1) > 0 ? 0 : 1;
  fillOval(ctx, 82, 168 + bob, 22, 9, "#f7f3ea");
  fillOval(ctx, 104, 162 + bob, 8, 6, "#fffaf2");
  ctx.fillStyle = "#e7c56a";
  ctx.fillRect(70, 162 + bob, 10, 2);
  ctx.fillRect(74, 160 + bob, 2, 2);
  ctx.fillStyle = "#f4e2a8";
  ctx.fillRect(96, 166 + bob, 6, 2);
  ctx.fillStyle = "rgba(255, 250, 230, 0.95)";
  ctx.fillRect(74 + (Math.floor(clock * 2) % 5) * 4, 166 + bob, 2, 1);
  ctx.fillStyle = "#c9a24a";
  ctx.fillRect(64, 172 + bob, 3, 6);
  ctx.fillRect(78, 174 + bob, 3, 6);
  ctx.fillRect(92, 174 + bob, 3, 6);
}

function drawMoonstone(ctx: CanvasRenderingContext2D, clock: number): void {
  ctx.fillStyle = "#e7dcc4";
  ctx.fillRect(150, 346, 80, 56);
  ctx.save();
  ctx.beginPath();
  ctx.rect(158, 352, 64, 44);
  ctx.clip();
  ctx.fillStyle = "#d5ebe8";
  ctx.fillRect(158, 352, 64, 44);
  ctx.fillStyle = "#f7fffd";
  ctx.fillRect(166, 358, 30, 8);
  ctx.fillStyle = "#c9a24a";
  ctx.fillRect(174, 360, 16, 4);
  ctx.fillStyle = "#f3e2b0";
  ctx.fillRect(178, 366, 8, 6);
  const grow = (clock * 0.18) % 1;
  const rx = 5 + grow * 18;
  const ry = 2 + grow * 7;
  ctx.fillStyle = "rgba(255, 252, 244, 0.9)";
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    ctx.fillRect(190 + Math.cos(a) * rx, 374 + Math.sin(a) * ry, 1, 1);
  }
  ctx.restore();
  ctx.fillStyle = "#f7f1e4";
  ctx.fillRect(156, 348, 68, 2);
  ctx.fillRect(156, 394, 68, 2);
}

function drawKalpa(ctx: CanvasRenderingContext2D, clock: number): void {
  ctx.fillStyle = "#c9a24a";
  for (let i = 0; i < 9; i++) ctx.fillRect(164 + i * 6, 340, 8, 2);
  ctx.fillStyle = "#f3e2a4";
  ctx.fillRect(186, 250, 8, 96);
  ctx.fillStyle = "#fff6d0";
  ctx.fillRect(187, 250, 1, 96);
  ctx.fillStyle = "#a88848";
  ctx.fillRect(193, 250, 1, 96);
  fillOval(ctx, 190, 248, 24, 16, "#e8c56a");
  fillOval(ctx, 190, 244, 16, 10, "#fff1c4");
  const gems = ["#e87898", "#fff1c8", "#7ec8c3", "#f0c878", "#f7f1e4"];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + clock * 0.05;
    const rad = 10 + (i % 3) * 6;
    const x = 190 + Math.cos(a) * rad;
    const y = 246 + Math.sin(a) * rad * 0.6;
    ctx.fillStyle = gems[i % gems.length]!;
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawParijata(ctx: CanvasRenderingContext2D, clock: number): void {
  ctx.fillStyle = "#e8b0c0";
  ctx.fillRect(276, 292, 5, 36);
  ctx.fillStyle = "#fff0f4";
  ctx.fillRect(277, 292, 1, 36);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    ctx.fillStyle = i % 2 ? "#e87898" : "#f6e2a4";
    ctx.fillRect(278 + Math.cos(a) * 10, 286 + Math.sin(a) * 6, 3, 2);
  }
  if (Math.floor(clock) % 2 === 0) {
    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(274, 284, 1, 1);
    ctx.fillRect(286, 288, 1, 1);
  }
}

function drawNaraka(ctx: CanvasRenderingContext2D, _clock: number, sheet?: HTMLImageElement): void {
  ctx.imageSmoothingEnabled = false;
  if (sheet && sheet.width > 0) ctx.drawImage(sheet, 0, 0);
  else {
    ctx.fillStyle = "#100c0a";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }
}

const ABYSS = 528;

function drawRealmAbyss(ctx: CanvasRenderingContext2D, east: boolean, clock: number): void {
  const sky = ensureRealmSky(east);
  if (sky) ctx.drawImage(sky, 0, ABYSS);
  else {
    ctx.fillStyle = east ? "#140e06" : "#070504";
    ctx.fillRect(0, ABYSS, WORLD_W, hSky());
  }
  const h = hSky();
  for (let i = 0; i < 180; i++) {
    const x = (i * 47 + 11) % WORLD_W;
    const y = ABYSS + 10 + ((i * 31) % (h - 18));
    const tw = (i + Math.floor(clock * 2)) % 14 === 0;
    ctx.fillStyle = east ? (i % 5 === 0 ? "#fff6d4" : "#e6c878") : i % 8 === 0 ? "#8a3828" : "#5c564c";
    ctx.fillRect(x, y, tw ? 2 : 1, 1);
  }
}

function hSky(): number {
  return WORLD_H - ABYSS;
}

let eastSky: HTMLCanvasElement | null = null;
let westSky: HTMLCanvasElement | null = null;

function ensureRealmSky(east: boolean): HTMLCanvasElement | null {
  const cached = east ? eastSky : westSky;
  if (cached) return cached;
  if (typeof document === "undefined") return null;
  const h = hSky();
  const canvas = document.createElement("canvas");
  canvas.width = WORLD_W;
  canvas.height = h;
  const g = canvas.getContext("2d");
  if (!g) return null;
  const img = g.createImageData(WORLD_W, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      const i = (y * WORLD_W + x) * 4;
      const n = noise(x + (east ? 0 : 90), y + 40);
      const mote = n % 5 === 0;
      let r = east ? 16 + (n % 22) : 10 + (n % 14);
      let gr = east ? 12 + (n % 14) : 7 + (n % 8);
      let b = east ? 6 + (n % 8) : 5 + (n % 5);
      if (mote) {
        r += east ? 36 : 22;
        gr += east ? 24 : 6;
        b += east ? 8 : 4;
      }
      d[i] = r;
      d[i + 1] = gr;
      d[i + 2] = b;
      d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  if (east) eastSky = canvas;
  else westSky = canvas;
  return canvas;
}

function drawRealmCliff(ctx: CanvasRenderingContext2D, east: boolean): void {
  for (let x = 0; x < WORLD_W; x++) {
    const dome = Math.sin((x / (WORLD_W - 1)) * Math.PI);
    const depth = 10 + Math.round(dome ** 0.65 * 22) + (noise(x, 3) % 5);
    for (let y = 0; y < depth + 8; y++) {
      const py = ABYSS - 2 + y;
      if (y > depth) continue;
      const n = noise(x, y + 9);
      let color = "#3a2a18";
      if (east) {
        if (y < 2) color = n % 3 === 0 ? "#f3e2a8" : "#e6c56a";
        else if (y < 6) color = n % 2 === 0 ? "#c9a24a" : "#a88848";
        else color = n % 5 === 0 ? "#fff1c4" : "#6a4e28";
      } else if (y < 2) color = n % 3 === 0 ? "#5a4634" : "#3a2418";
      else if (y < 6) color = n % 4 === 0 ? "#6a2818" : "#2a1c14";
      else color = n % 6 === 0 ? "#8a4030" : "#120c0a";
      ctx.fillStyle = color;
      ctx.fillRect(x, py, 1, 1);
    }
    if (noise(x, 8) % 31 === 0) {
      ctx.fillStyle = east ? "#3a2a14" : "#0c0806";
      ctx.fillRect(x, ABYSS + 4, 1, 18 + (noise(x, 9) % 10));
    }
  }
}

function drawHeavenBelow(ctx: CanvasRenderingContext2D, clock: number, sheet?: HTMLImageElement): void {
  if (sheet && sheet.width > 0) {
    const bob = Math.sin(clock * 0.4) > 0 ? 0 : 1;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, Math.round((WORLD_W - sheet.width) / 2), ABYSS + 56 + bob);
    return;
  }
  const cx = 174;
  const top = ABYSS + 78;
  const bob = Math.sin(clock * 0.4) > 0 ? 0 : 1;
  for (let x = 48; x < 300; x++) {
    const t = (x - 48) / 252;
    const edge = Math.sin(t * Math.PI);
    const body = Math.round(edge ** 0.55 * 36);
    for (let y = 0; y < body + 16; y++) {
      const py = top + bob + y;
      const n = noise(x, y);
      let color = "#5a4020";
      if (y < 3) color = n % 2 === 0 ? "#fff6d4" : "#f3e2a8";
      else if (y < 8) color = "#e6c56a";
      else if (y < body) color = n % 7 === 0 ? "#fff1c4" : "#a88848";
      else if (y < body + 8) color = "#6a4e28";
      else color = "#3a2a16";
      if (y > body + 10 && n % 3 !== 0) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, py, 1, 1);
    }
  }
  ctx.fillStyle = "#f7fffd";
  ctx.fillRect(cx - 18, top + bob + 6, 36, 8);
  ctx.fillStyle = "#d5ebe8";
  ctx.fillRect(cx - 14, top + bob + 8, 28, 4);
  ctx.fillStyle = "#e87898";
  ctx.fillRect(cx - 2, top + bob + 4, 2, 2);
  ctx.fillRect(cx + 4, top + bob + 9, 2, 2);
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(cx - 1, top + bob - 8, 3, 10);
  ctx.fillStyle = "#e6c86a";
  ctx.fillRect(cx - 4, top + bob - 10, 9, 3);
  ctx.fillStyle = "#fff6d4";
  ctx.fillRect(cx - 1, top + bob - 14, 3, 4);
  const glow = 0.35 + 0.2 * Math.sin(clock * 1.4);
  ctx.fillStyle = `rgba(255, 246, 212, ${glow})`;
  ctx.fillRect(cx - 2, top + bob - 6, 5, 2);
}

function drawEvilBelow(ctx: CanvasRenderingContext2D, clock: number, sheet?: HTMLImageElement): void {
  if (sheet && sheet.width > 0) {
    const bob = Math.sin(clock * 0.55) > 0 ? 0 : 1;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, Math.round((WORLD_W - sheet.width) / 2), ABYSS + 64 + bob);
    return;
  }
  const top = ABYSS + 86;
  const bob = Math.sin(clock * 0.55) > 0 ? 0 : 1;
  for (let x = 70; x < 278; x++) {
    const t = (x - 70) / 208;
    const edge = Math.sin(t * Math.PI);
    const body = 14 + Math.round(edge * 28) + (noise(x, 2) % 4);
    for (let y = 0; y < body; y++) {
      const n = noise(x, y + 4);
      let color = "#1a100c";
      if (y < 2) color = n % 4 === 0 ? "#6a2818" : "#2a1c14";
      else if (y < 7) color = n % 5 === 0 ? "#4a2018" : "#241610";
      else color = n % 8 === 0 ? "#8a4030" : "#0c0806";
      ctx.fillStyle = color;
      ctx.fillRect(x, top + bob + y, 1, 1);
    }
  }
  ctx.fillStyle = "#1a0c08";
  ctx.fillRect(150, top + bob + 8, 48, 16);
  const coal = 0.25 + 0.2 * Math.sin(clock * 3);
  ctx.fillStyle = `rgba(160, 48, 24, ${coal})`;
  ctx.fillRect(162, top + bob + 12, 24, 6);
  ctx.fillStyle = "#8a4030";
  ctx.fillRect(168, top + bob + 4, 2, 8);
  ctx.fillRect(178, top + bob + 2, 2, 10);
  for (const x of [158, 174, 188]) {
    const drip = Math.floor(clock * 6 + x) % 7;
    ctx.fillStyle = "#6a1820";
    ctx.fillRect(x, top + bob + 22 + drip, 1, 2);
  }
  ctx.fillStyle = "#5a4630";
  ctx.fillRect(96, top + bob + 6, 2, 14);
  ctx.fillRect(248, top + bob + 4, 2, 16);
}

function drawRealmBelow(ctx: CanvasRenderingContext2D, wing: -1 | 1, clock: number, sheets: Sheets): void {
  const east = wing === 1;
  drawRealmAbyss(ctx, east, clock);
  drawRealmCliff(ctx, east);
  if (east) drawHeavenBelow(ctx, clock, sheets.heavenIsle);
  else drawEvilBelow(ctx, clock, sheets.hellIsle);
}

function drawFurnace(ctx: CanvasRenderingContext2D, clock: number): void {
  ctx.fillStyle = "#3a2a18";
  ctx.fillRect(28, 64, 56, 46);
  ctx.fillStyle = "#5a4630";
  ctx.fillRect(32, 68, 48, 36);
  ctx.fillStyle = "#1a0c08";
  ctx.fillRect(40, 74, 32, 24);
  ctx.fillStyle = `rgba(90, 40, 18, ${0.15 + 0.08 * Math.sin(clock * 5)})`;
  ctx.fillRect(46, 80, 18, 12);
  ctx.fillStyle = "#6a5438";
  ctx.fillRect(30, 60, 52, 3);
  ctx.fillRect(26, 108, 60, 3);
  const shim = Math.sin(clock * 9) > 0 ? 1 : 0;
  ctx.fillStyle = "#4a3828";
  ctx.fillRect(36, 72 + shim, 10, 1);
  ctx.fillStyle = "#4a2418";
  ctx.fillRect(48, 108, 2, 6);
  ctx.fillRect(54, 110, 2, 4);
}

function drawRaurava(ctx: CanvasRenderingContext2D, clock: number): void {
  for (let i = 0; i < 10; i++) {
    const shiver = Math.sin(clock * 5 + i) > 0 ? 1 : 0;
    ctx.fillStyle = "#2a2420";
    ctx.fillRect(96 + (i % 5) * 6, 150 + (i % 3) * 5, 1, 6);
    ctx.fillStyle = "#4a4038";
    ctx.fillRect(94 + (i % 5) * 6, 148 + shiver, 4, 1);
  }
  ctx.fillStyle = Math.floor(clock * 2) % 5 !== 0 ? "#6a3018" : "#1a100c";
  ctx.fillRect(108, 156, 1, 1);
  ctx.fillRect(122, 162, 1, 1);
}

function drawVaitarani(ctx: CanvasRenderingContext2D, clock: number): void {
  ctx.fillStyle = "#1a100c";
  ctx.fillRect(200, 48, 62, 470);
  ctx.fillStyle = "#140c0a";
  ctx.fillRect(220, 48, 22, 470);
  ctx.fillStyle = "#3a1410";
  ctx.fillRect(214, 48, 8, 470);
  ctx.fillRect(240, 48, 8, 470);
  ctx.fillStyle = "#241810";
  ctx.fillRect(206, 48, 8, 470);
  ctx.fillRect(248, 48, 8, 470);
  for (let y = 52; y < 500; y += 9) {
    if (y > 194 && y < 226) continue;
    const slide = Math.floor(clock * 2 + y * 0.15) % 8;
    ctx.fillStyle = "#5a2418";
    ctx.fillRect(218 + (slide % 4), y, 7, 2);
    if (y % 18 === 0) {
      ctx.fillStyle = "#243028";
      ctx.fillRect(222, y + 3, 5, 2);
    }
  }
  const croc = 80 + ((clock * 6) % 340);
  if (croc < 190 || croc > 230) {
    ctx.fillStyle = "#1a1410";
    ctx.fillRect(226, croc, 10, 3);
  }
  ctx.fillStyle = "#2a2018";
  ctx.fillRect(206, 198, 50, 24);
  ctx.fillStyle = "#1a140e";
  for (let i = 0; i < 5; i++) ctx.fillRect(208, 200 + i * 4, 46, 1);
  ctx.fillStyle = "#3a3028";
  ctx.fillRect(210, 206, 2, 12);
  ctx.fillRect(246, 206, 2, 12);
  ctx.fillStyle = "#4a3828";
  ctx.fillRect(214, 196, 36, 2);
}

function drawKalasutra(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#3a3028";
  ctx.fillRect(86, 270, 6, 16);
  ctx.fillStyle = "#6a5848";
  ctx.fillRect(87, 270, 1, 16);
  ctx.fillStyle = "#5a4630";
  ctx.fillRect(40, 276, 150, 1);
  for (let x = 44; x < 186; x += 8) ctx.fillRect(x, 274, 1, 4);
}

function drawAsipatra(ctx: CanvasRenderingContext2D, clock: number): void {
  for (let i = 0; i < 12; i++) {
    const shiver = Math.sin(clock * 7 + i) > 0 ? 1 : 0;
    const x = 96 + (i % 4) * 8;
    const y = 286 + Math.floor(i / 4) * 10;
    ctx.fillStyle = "#2a2420";
    ctx.fillRect(x, y, 1, 8);
    ctx.fillStyle = "#8a8680";
    ctx.fillRect(x - 2, y + shiver, 3, 1);
    ctx.fillRect(x + 1, y + 2 - shiver, 3, 1);
    ctx.fillStyle = "#c8c4bc";
    ctx.fillRect(x + 2, y + shiver, 1, 1);
  }
}

function drawSabha(ctx: CanvasRenderingContext2D, clock: number): void {
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? "#1a100c" : "#241612";
    ctx.fillRect(18 + i * 8, 360 - i, 6, 8 + i);
  }
  ctx.fillStyle = "#241810";
  ctx.fillRect(36, 372, 78, 52);
  ctx.fillStyle = "#120c0a";
  ctx.fillRect(36, 372, 78, 8);
  ctx.fillStyle = "#3a2a18";
  ctx.fillRect(24, 366, 16, 4);
  ctx.fillRect(110, 366, 16, 4);
  ctx.fillStyle = "#0a0808";
  ctx.fillRect(62, 390, 18, 34);
  const lamp = 0.55 + 0.2 * Math.sin(clock * 1.6);
  ctx.fillStyle = `rgba(196, 160, 96, ${lamp})`;
  ctx.fillRect(90, 378, 3, 2);
  ctx.fillStyle = "#8a6840";
  ctx.fillRect(88, 380, 1, 6);
  ctx.fillStyle = "#6a5438";
  ctx.fillRect(40, 420, 70, 1);
  ctx.fillStyle = "#4a3828";
  ctx.fillRect(46, 386, 6, 16);
  ctx.fillRect(100, 386, 6, 16);
  fillOval(ctx, 54, 412, 8, 4, "#2a2420");
  ctx.fillStyle = "#1a140e";
  ctx.fillRect(60, 406, 6, 4);
  ctx.fillStyle = "#5a4630";
  ctx.fillRect(84, 396, 4, 8);
}

function drawSalmali(ctx: CanvasRenderingContext2D, clock: number): void {
  ctx.fillStyle = "#2c2824";
  ctx.fillRect(162, 270, 6, 62);
  ctx.fillStyle = "#4a4038";
  ctx.fillRect(163, 270, 1, 62);
  for (let i = 0; i < 10; i++) {
    const shiver = Math.sin(clock * 6 + i) > 0 ? 1 : 0;
    ctx.fillStyle = "#6a6864";
    ctx.fillRect(150 + (i % 5) * 5, 262 + (i % 3) * 4 + shiver, 5, 1);
    ctx.fillRect(154 + (i % 4), 258 + (i % 5) * 3, 1, 3);
  }
  ctx.fillStyle = "#1a1210";
  ctx.fillRect(148, 292, 10, 2);
  ctx.fillRect(172, 304, 8, 2);
}

function drawAvici(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#1a100c";
  ctx.fillRect(68, 440, 56, 36);
  fillOval(ctx, 96, 458, 22, 12, "#070606");
  ctx.fillStyle = "#2a1c14";
  ctx.fillRect(74, 446, 44, 1);
}

const ANGEL = 108;
const SERAPHIM_PATH = [
  { x: 100, y: 220 },
  { x: 150, y: 250 },
  { x: 236, y: 292 },
  { x: 286, y: 340 },
  { x: 248, y: 430 },
  { x: 130, y: 448 },
  { x: 78, y: 340 },
  { x: 86, y: 250 },
];

function alongPath(clock: number, speed: number, pts: { x: number; y: number }[]): { x: number; y: number; flip: boolean } {
  let total = 0;
  const seg: { a: { x: number; y: number }; b: { x: number; y: number }; d: number; at: number }[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    seg.push({ a, b, d, at: total });
    total += d;
  }
  let dist = (clock * speed) % total;
  for (const s of seg) {
    if (dist <= s.at + s.d) {
      const t = (dist - s.at) / s.d;
      return { x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t, flip: s.b.x < s.a.x };
    }
  }
  return { x: pts[0]!.x, y: pts[0]!.y, flip: false };
}

type AngelPaint = { x: number; y: number; key: string; frame: number; flip: boolean; scale: number; footY: number; shadow: boolean };

function svargaAngels(clock: number): AngelPaint[] {
  const out: AngelPaint[] = [];
  const cycle = 22;
  const t = clock % cycle;
  const laps = Math.floor(clock / cycle);
  const moving = t < 9 ? t : t < 11 ? 9 : t < 18 ? 9 + (t - 11) : 16;
  const walked = alongPath(laps * 16 + moving, 26, SERAPHIM_PATH);
  const flying = t >= 11 && t < 18;
  const lift = flying ? Math.sin(((t - 11) / 7) * Math.PI) * 22 : 0;
  const attacking = t >= 18 && t < 20;
  out.push({
    x: walked.x,
    y: walked.y - lift,
    flip: walked.flip,
    key: attacking ? "seraphimAttack" : flying ? "seraphimFly" : t < 9 ? "seraphimWalk" : "seraphimIdle",
    frame: attacking ? Math.floor((t - 18) * 8) % 4 : flying ? Math.floor(clock * 10) % 9 : t < 9 ? Math.floor(clock * 8) % 4 : Math.floor(clock * 4) % 4,
    scale: 0.56,
    footY: flying ? 64 : 82,
    shadow: !flying,
  });
  const th = clock * 0.45;
  const archAttack = clock % 12 < 0.5;
  out.push({
    x: 168 + Math.cos(th) * 108,
    y: 108 + Math.sin(th * 0.85) * 30,
    flip: -Math.sin(th) < 0,
    key: archAttack ? "archangelAttack" : "archangelFly",
    frame: archAttack ? Math.floor((clock % 12) * 8) % 3 : Math.floor(clock * 8) % 4,
    scale: 0.64,
    footY: 58,
    shadow: false,
  });
  const th2 = clock * 0.7;
  const shoot = clock % 8;
  const shooting = shoot < 0.65;
  const cherubFlip = -Math.sin(th2) < 0;
  const cx = 246 + Math.cos(th2) * 46;
  const cy = 308 + Math.sin(th2 * 1.2) * 22;
  out.push({
    x: cx,
    y: cy,
    flip: cherubFlip,
    key: shooting ? "cherubShoot" : "cherubFly",
    frame: shooting ? Math.floor(shoot * 8) % 5 : Math.floor(clock * 8) % 4,
    scale: 0.78,
    footY: 56,
    shadow: false,
  });
  if (shoot < 1.35) {
    const u = Math.min(1, shoot / 1.1);
    const dir = cherubFlip ? -1 : 1;
    out.push({
      x: cx + dir * (16 + u * 52),
      y: cy + 1,
      flip: cherubFlip,
      key: "cherubArrow",
      frame: 0,
      scale: 0.78,
      footY: 54,
      shadow: false,
    });
  }
  return out;
}

function paintAngel(ctx: CanvasRenderingContext2D, sheets: Sheets, a: AngelPaint): void {
  const img = sheets[a.key];
  if (!img) return;
  if (a.shadow) fillOval(ctx, a.x, a.y + 1, 10, 3, "rgba(90, 60, 20, 0.35)");
  blit(ctx, img, a.frame * ANGEL, 0, ANGEL, ANGEL, a.x, a.y, a.scale, a.flip, 54, a.footY);
}

const DEMON_W = 160;
const DEMON_H = 128;
const DEMON_PATH = [
  { x: 292, y: 248 },
  { x: 300, y: 330 },
  { x: 272, y: 210 },
  { x: 188, y: 210 },
  { x: 140, y: 250 },
  { x: 124, y: 330 },
  { x: 168, y: 450 },
  { x: 96, y: 478 },
  { x: 220, y: 490 },
  { x: 300, y: 420 },
];

function narakaDemon(clock: number): { x: number; y: number; flip: boolean; row: number; frame: number } {
  const cycle = 16;
  const t = clock % cycle;
  const laps = Math.floor(clock / cycle);
  const pos = alongPath(laps * 10 + Math.min(t, 10), 26, DEMON_PATH);
  const spell = laps % 4;
  if (t < 10) return { ...pos, row: 1, frame: Math.floor(clock * 10) % 8 };
  if (t < 12) return { ...pos, row: 0, frame: Math.floor(clock * 6) % 8 };
  const u = t - 12;
  if (spell === 0) return { ...pos, row: 2, frame: Math.min(23, Math.floor(u * 6)) };
  if (spell === 1) return { ...pos, row: 3, frame: Math.min(7, Math.floor(u * 4)) };
  if (spell === 2) return { ...pos, row: 4, frame: Math.min(15, Math.floor(u * 4)) };
  if (u < 2) return { ...pos, row: 5, frame: Math.min(15, Math.floor(u * 8)) };
  return { ...pos, row: 6, frame: Math.floor((u - 2) * 6) % 8 };
}


function paintBird(ctx: CanvasRenderingContext2D, sheets: Sheets, b: Bird) {
  if (b.z > 1) fillOval(ctx, b.x, b.y + 1, 3, 1, "rgba(20, 16, 10, 0.35)");
  const key = b.mode === "fly" ? "birdFly" : b.mode === "walk" ? "birdWalk" : "birdTakeoff";
  const frame =
    b.mode === "fly"
      ? Math.floor(b.t * 12) % 4
      : b.mode === "walk"
        ? Math.floor(b.t * 8) % 4
        : b.mode === "land"
          ? 4 - Math.min(4, Math.floor(b.t / 0.1))
          : b.mode === "takeoff"
            ? Math.min(4, Math.floor(b.t / 0.1))
            : 0;
  const sheet = sheets[key];
  if (!sheet) return;
  blit(ctx, sheet, frame * 16, 0, 16, 16, Math.round(b.x), Math.round(b.y - b.z), 1, b.face > 0, 8, 15);
}

function paintDemon(ctx: CanvasRenderingContext2D, sheet: HTMLImageElement, d: { x: number; y: number; flip: boolean; row: number; frame: number }): void {
  fillOval(ctx, d.x, d.y + 1, 9, 3, "rgba(0, 0, 0, 0.45)");
  blit(ctx, sheet, d.frame * DEMON_W, d.row * DEMON_H, DEMON_W, DEMON_H, d.x, d.y, 0.7, d.flip, 80, 112);
}


function drawRealmFringe(ctx: CanvasRenderingContext2D, s: GameState): void {
  const y0 = s.y + 6;
  if ((s.wing ?? 0) === 1) {
    for (let i = 0; i < 12; i++) {
      const x = 20 + i * 26;
      const y = 498 + (i % 3) * 4;
      if (y < y0) continue;
      ctx.fillStyle = "#e6d090";
      ctx.fillRect(x, y, 1, 5);
      ctx.fillStyle = "#fff6d0";
      ctx.fillRect(x, y, 1, 1);
    }
  } else if ((s.wing ?? 0) === -1) {
    for (let i = 0; i < 12; i++) {
      const x = 22 + i * 26;
      const y = 496 + (i % 4) * 3;
      if (y < y0) continue;
      ctx.fillStyle = "#120c0a";
      ctx.fillRect(x, y, 2, 4);
    }
  }
}

function drawRealmGate(ctx: CanvasRenderingContext2D, s: GameState, sheets: Sheets): void {
  const wing = s.wing ?? 0;
  for (const cx of gateXs(wing)) drawPortal(ctx, sheets, cx, 202, portalIsEast(wing, cx), s.clock);
}

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  sheets: Sheets,
  hover: { x: number; y: number } | null,
  showTill: boolean,
) {
  const wing = s.wing ?? 0;
  if (wing !== 0) {
    if (wing === 1) {
      drawSvarga(ctx, s.clock, sheets.svarga);
      const angels = svargaAngels(s.clock).sort((a, b) => a.y - b.y);
      for (const a of angels) if (a.y <= s.y) paintAngel(ctx, sheets, a);
      if (sheets.idle) paintPlayer(ctx, sheets, s);
      for (const a of angels) if (a.y > s.y) paintAngel(ctx, sheets, a);
      drawRealmBelow(ctx, 1, s.clock, sheets);
    } else {
      drawNaraka(ctx, s.clock, sheets.naraka);
      const demon = sheets.demonMage ? narakaDemon(s.clock) : null;
      if (demon && demon.y <= s.y && sheets.demonMage) paintDemon(ctx, sheets.demonMage, demon);
      if (sheets.idle) paintPlayer(ctx, sheets, s);
      if (demon && demon.y > s.y && sheets.demonMage) paintDemon(ctx, sheets.demonMage, demon);
      drawRealmBelow(ctx, -1, s.clock, sheets);
    }
    drawRealmGate(ctx, s, sheets);
    if (sheets.idle && playerInPortal(s)) paintPlayer(ctx, sheets, s);
    if (s.cross) {
      const u = Math.max(0, Math.min(1, s.cross.t / 0.85));
      const a = u < 0.5 ? u * 2 : (1 - u) * 2;
      ctx.fillStyle = wing === 1 ? `rgba(255, 228, 160, ${0.12 + a * 0.78})` : `rgba(20, 8, 6, ${0.2 + a * 0.75})`;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    return;
  }
  drawSpace(ctx, s.clock);
  const yard = sheets.yard;
  if (yard && yard.naturalWidth > 0) ctx.drawImage(yard, 0, 0, WORLD_W, PLATE, 0, 0, WORLD_W, PLATE);
  drawMosaicFloors(ctx, s.clock, s.wet, yard, sheets.svarga, sheets.naraka);

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
  ctx.clip();
  const span = FISH_WATER.w;
  for (let i = 0; i < 7; i++) {
    const x = FISH_WATER.x + ((s.clock * 10 + i * 11) % (span - 4));
    const y = FISH_WATER.y + 1 + ((i * 5) % Math.max(1, FISH_WATER.h - 3));
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
    const footY = a.kind === "cow" ? 69 : 66;
    const rate = a.kind === "cow" ? 4 : 8;
    queue.push({
      y: a.y,
      paint: () => drawAnimal(ctx, idle, walk, s, a.x, a.y, a.dir, moving, scale, footY, rate),
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
        blit(ctx, catSheet, col * 64, 0, 64, 64, s.cat.x, s.cat.y, 0.36, s.cat.face > 0, 32, 48);
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
  if (s.birds) {
    for (const b of s.birds) {
      queue.push({ y: b.y, paint: () => paintBird(ctx, sheets, b) });
    }
  }
  if (sheets.idle) {
    queue.push({ y: s.y - 1, paint: () => drawCastRite(ctx, s) });
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
  if (birdGlow(s.clock) > 0) {
    const k = birdGlow(s.clock);
    ctx.fillStyle = `rgba(232, 196, 110, ${0.35 + k * 0.45})`;
    const r = 10 + Math.round((1 - k) * 4);
    ctx.fillRect(Math.round(s.x) - r, Math.round(s.y) - 2, 2, 2);
    ctx.fillRect(Math.round(s.x) + r, Math.round(s.y) - 2, 2, 2);
    ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - r, 2, 2);
    ctx.fillStyle = `rgba(255, 236, 190, ${0.5 * k})`;
    ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 18, 2, 2);
  }
  if (sheets.occlude && sheets.occlude.naturalWidth > 0) ctx.drawImage(sheets.occlude, 0, 0, WORLD_W, PLATE, 0, 0, WORLD_W, PLATE);
  if (sheets.campfire) drawCampfire(ctx, sheets.campfire, s.clock);
  drawSideGates(ctx, s, sheets);
  if (sheets.idle && (playerInPortal(s) || feetOnPath(sheets, s.x, s.y))) paintPlayer(ctx, sheets, s);
  drawSpell(ctx, sheets, s);

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

  if (s.weather === "rain" || s.weather === "storm") {
    const storm = s.weather === "storm";
    const drops = storm ? 160 : 100;
    const landH = FARM_H;
    for (let i = 0; i < drops; i++) {
      const period = (storm ? 0.36 : 0.52) + (i % 9) * 0.025;
      const turns = s.clock / period;
      const cycle = Math.floor(turns);
      const t = turns - cycle;
      const n = (Math.imul(i + cycle * 13 + 1, 1103515245) + 12345) >>> 0;
      const fallPx = storm ? 72 : 52;
      const x = n % WORLD_W;
      const ground = 12 + ((n >>> 12) % Math.max(1, landH - 16));
      const falling = t < 0.82;
      if (falling) {
        const u = t / 0.82;
        const y = Math.floor(ground - (1 - u) * fallPx);
        const len = 3 + Math.floor(u * (storm ? 8 : 5));
        const fade = 0.55 + ((n >>> 24) % 30) / 100;
        for (let k = 0; k < len; k++) {
          const py = y - k;
          const px = x + (k >> 1);
          if (py < 0 || py >= landH || px < 0 || px >= WORLD_W) continue;
          ctx.fillStyle = k < 2 ? `rgba(236, 244, 252, ${fade})` : `rgba(150, 186, 208, ${fade * 0.35})`;
          ctx.fillRect(px, py, 1, 1);
        }
      } else if ((n & 3) === 0) {
        const frame = Math.min(3, Math.floor(((t - 0.82) / 0.18) * 4));
        const blot = (dx: number, dy: number, a: number, bright: boolean) => {
          const px = x + dx;
          const py = ground + dy;
          if (px < 0 || py < 0 || px >= WORLD_W || py >= landH) return;
          ctx.fillStyle = bright ? `rgba(244, 250, 255, ${a})` : `rgba(176, 208, 224, ${a})`;
          ctx.fillRect(px, py, 1, 1);
        };
        if (frame === 0) {
          blot(0, 0, 0.95, true);
          blot(-1, 0, 0.7, true);
          blot(1, 0, 0.7, true);
          blot(0, -1, 0.9, true);
        } else if (frame === 1) {
          blot(-2, -1, 0.8, true);
          blot(2, -1, 0.8, true);
          blot(0, -2, 0.85, true);
          blot(-1, 0, 0.4, false);
          blot(1, 0, 0.4, false);
        } else if (frame === 2) {
          blot(-3, 0, 0.45, false);
          blot(3, 0, 0.45, false);
          blot(-2, -1, 0.55, true);
          blot(2, -1, 0.55, true);
          blot(0, -1, 0.25, false);
        } else {
          blot(-4, 0, 0.22, false);
          blot(4, 0, 0.22, false);
          blot(-2, 0, 0.16, false);
          blot(2, 0, 0.16, false);
        }
      }
    }
  }
  if (s.flash > 0) {
    ctx.fillStyle = `rgba(235, 242, 255, ${Math.min(0.55, s.flash * 3.2)})`;
    ctx.fillRect(0, 0, WORLD_W, FARM_H);
  }
  if (s.cross) {
    const u = Math.max(0, Math.min(1, s.cross.t / 0.85));
    const a = u < 0.5 ? u * 2 : (1 - u) * 2;
    ctx.fillStyle = `rgba(8, 36, 22, ${0.15 + a * 0.82})`;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.fillStyle = `rgba(170, 255, 190, ${a * 0.35})`;
    ctx.fillRect(0, 190, WORLD_W, 40);
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
