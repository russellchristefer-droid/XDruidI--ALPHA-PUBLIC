import { ARMOUR_DOOR, ARMOUR_PLOTS, ARMOUR_RETURN, CHAR_FOOT_Y, CHAR_H, CHAR_W, COMBAT_DOOR, COMBAT_PLOTS, COMBAT_RETURN, DEFS, DESCENT_DOOR, DESCENT_RETURN, ENCHANT_DOOR, ENCHANT_PLOTS, ENCHANT_RETURN, FISH_WATER, GOAT_PEN, GROVE_DOOR, GROVE_PLOTS, GROVE_RETURN, HEAVEN_GATE, MARKET_DOOR, MARKET_PLOTS, MARKET_RETURN, MEADOW, QUARRY_DOOR, QUARRY_PLOTS, QUARRY_RETURN, REAPER_FRAMES, RING_DOOR, RING_RETURN, RING_STONES, SANCTUM_DOOR, SANCTUM_PLOTS, SANCTUM_RETURN, SEAM_ROCKS, STAIR_COUNT, STAIR_LAND, STAIR_PITCH, STAIR_SEAL, STAIR_WELL, TILE, WEAPON_DOOR, WEAPON_PLOTS, WEAPON_RETURN, WILDS_DOOR, WILDS_PLOTS, WILDS_RETURN, WORLD_H, WORLD_W, defOf, type Bird, type Dir, type GameState, type Plot, type ReaperPose, type SpellId } from "./content.ts";
import { devSpriteLayers } from "./dev-sprites.ts";
import type { Sheets } from "./assets.ts";
import { birdGlow } from "./birdsong.ts";
import { TOOL_ANIM, findItem, ringFoes } from "./logic.ts";
import { drawEastGate } from "./paint/eastGate.ts";
import { drawWestGate } from "./paint/westGate.ts";
import { drawMosaicFloors } from "./paint/mosaicFloor.ts";
import { CAT_CELL, catClip } from "./paint/blackCat.ts";
import { drawFarmRack, farmPlate, farmSeed } from "./paint/farmPortals.ts";

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
  if (s.cast && s.cast.t >= 0 && s.cast.t <= 0.46) {
    if (s.speed > 1) return { sheet: "handsUpWalk", frames: 8, col: Math.floor(s.clock * 10) % 8 };
    return { sheet: "handsUpIdle", frames: 2, col: Math.floor(s.clock * 1.6) % 2 };
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

function drawFlower(ctx: CanvasRenderingContext2D, img: HTMLImageElement, f: GameState["flowers"][number], clock: number): void {
  const x0 = f.x - f.w / 2;
  const y0 = f.y - f.h / 2;
  const across = f.w > f.h;
  const n = Math.max(3, Math.floor((across ? f.w : f.h) / 8));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const sway = Math.sin(clock * 1.6 + i + f.row) * 0.45;
    const cx = across ? x0 + t * f.w : f.x + sway;
    const cy = across ? f.y + sway : y0 + t * f.h;
    blit(ctx, img, Math.min(2, f.bloom) * 16, f.row * 16, 16, 16, cx, cy, 0.9, false, 8, 15);
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
  if (court) paintCourtSheen(ctx, sheet, pose.col, row, flip, footX, s, true);
  blit(ctx, sheet, pose.col * CHAR_W, row * CHAR_H, CHAR_W, CHAR_H, s.x, s.y, CHAR, flip, footX, CHAR_FOOT_Y);
  if (court) paintCourtSheen(ctx, sheet, pose.col, row, flip, footX, s, false);
  paintTackle(ctx, sheets, s, pose, row, flip);
  ctx.globalAlpha = 1;
  drawEffect(ctx, sheets, s);
  ctx.restore();
}

const CHAKRA = ["#ffb7d0", "#ffd0aa", "#fff3ae", "#c6f5c4", "#b6ecff", "#d6c6ff", "#ffe6fb"];
let courtVeil: HTMLCanvasElement | null = null;

function courtChakra(sheet: CanvasImageSource, col: number, row: number, clock: number): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  if (!courtVeil) {
    courtVeil = document.createElement("canvas");
    courtVeil.width = CHAR_W;
    courtVeil.height = CHAR_H;
  }
  const g = courtVeil.getContext("2d");
  if (!g) return null;
  g.clearRect(0, 0, CHAR_W, CHAR_H);
  g.imageSmoothingEnabled = false;
  g.drawImage(sheet, col * CHAR_W, row * CHAR_H, CHAR_W, CHAR_H, 0, 0, CHAR_W, CHAR_H);
  g.globalCompositeOperation = "source-atop";
  const shift = clock * 1.1;
  for (let y = 0; y < CHAR_H; y++) {
    const i = Math.floor(shift + y / 7);
    g.globalAlpha = 0.78;
    g.fillStyle = CHAKRA[((i % CHAKRA.length) + CHAKRA.length) % CHAKRA.length]!;
    g.fillRect(0, y, CHAR_W, 1);
  }
  g.globalCompositeOperation = "source-over";
  g.globalAlpha = 1;
  return courtVeil;
}

function paintCourtSheen(
  ctx: CanvasRenderingContext2D,
  sheet: CanvasImageSource,
  col: number,
  row: number,
  flip: boolean,
  footX: number,
  s: GameState,
  halo: boolean,
): void {
  const veil = courtChakra(sheet, col, row, s.clock);
  if (!veil) return;
  const stamp = (ox: number, oy: number, alpha: number) => {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(s.x + ox), Math.round(s.y + oy));
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(
      veil,
      Math.round(-footX * CHAR),
      Math.round(-CHAR_FOOT_Y * CHAR),
      Math.max(1, Math.round(CHAR_W * CHAR)),
      Math.max(1, Math.round(CHAR_H * CHAR)),
    );
    ctx.restore();
  };
  if (halo) {
    stamp(0, -1, 0.2);
    stamp(-1, 0, 0.16);
    stamp(1, 0, 0.16);
  } else {
    stamp(0, 0, 0.48);
  }
}

function rodAim(dir: Dir, fishing: boolean): { dx: number; dy: number } {
  const aim = dir === "s" ? { dx: -12, dy: -21 } : dir === "n" ? { dx: 12, dy: -21 } : dir === "e" ? { dx: 16, dy: -14 } : { dx: -16, dy: -14 };
  if (!fishing) return aim;
  return { dx: Math.round(aim.dx * 1.05), dy: aim.dy + 10 };
}

const armMemo = new Map<string, { fist: { x: number; y: number }; shoulder: { x: number; y: number } } | null>();

function peachAt(data: Uint8ClampedArray, x: number, y: number): boolean {
  const i = (y * CHAR_W + x) * 4;
  const r = data[i] ?? 0;
  const g = data[i + 1] ?? 0;
  const b = data[i + 2] ?? 0;
  const a = data[i + 3] ?? 0;
  return a >= 200 && r > 150 && g > 110 && b > 95 && r > g && g > b && g - b < 40 && r - g > 15 && r - g < 80;
}

function rodArm(img: HTMLImageElement, col: number, row: number, side: "l" | "r"): { fist: { x: number; y: number }; shoulder: { x: number; y: number } } | null {
  const key = `${img.src}|${img.naturalWidth}|${col}|${row}|${side}`;
  const cached = armMemo.get(key);
  if (cached !== undefined) return cached;
  let found: { fist: { x: number; y: number }; shoulder: { x: number; y: number } } | null = null;
  if (img.naturalWidth > 0 && typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = CHAR_W;
    canvas.height = CHAR_H;
    const g = canvas.getContext("2d", { willReadFrequently: true });
    if (g) {
      g.drawImage(img, col * CHAR_W, row * CHAR_H, CHAR_W, CHAR_H, 0, 0, CHAR_W, CHAR_H);
      const data = g.getImageData(0, 0, CHAR_W, CHAR_H).data;
      const take = (loose: boolean) => {
        const pts: Array<[number, number]> = [];
        for (let y = 46; y <= 72; y++) {
          for (let x = 0; x < CHAR_W; x++) {
            if (!peachAt(data, x, y)) continue;
            if (!loose && (side === "l" ? x > 30 : x < 40)) continue;
            pts.push([x, y]);
          }
        }
        return pts;
      };
      const pool = take(false);
      const pts = pool.length ? pool : side === "r" ? take(true) : [];
      if (pts.length) {
        const low = Math.max(...pts.map((p) => p[1]));
        const high = Math.min(...pts.map((p) => p[1]));
        const fistPts = pts.filter((p) => p[1] >= low - 2);
        const shoulderPts = pts.filter((p) => p[1] <= high + 2);
        const mid = (list: Array<[number, number]>) => ({
          x: list.reduce((n, p) => n + p[0], 0) / list.length,
          y: list.reduce((n, p) => n + p[1], 0) / list.length,
        });
        found = { fist: mid(fistPts), shoulder: mid(shoulderPts) };
      }
    }
  }
  armMemo.set(key, found);
  return found;
}

function paintRod(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number): void {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  const px = (x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  };
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t);
    const shaft = t < 0.16 ? "#6a4828" : t > 0.82 ? "#f0d8a0" : t > 0.5 ? "#e0b060" : "#c48838";
    px(x + 1, y + 1, "#1a120c");
    px(x, y, shaft);
    if (i === Math.round(n * 0.35) || i === Math.round(n * 0.62)) px(x, y - 1, "#2a1c10");
  }
  px(x0, y0, "#3a2818");
  px(x0 + Math.sign(x1 - x0 || 1), y0, "#3a2818");
  px(x0, y0 + 1, "#c8a060");
  px(x1, y1, "#fff4d4");
  px(x1, y1 - 1, "#fff4d4");
}

function paintTackle(
  ctx: CanvasRenderingContext2D,
  sheets: Sheets,
  s: GameState,
  pose: { sheet: string; col: number },
  row: number,
  flip: boolean,
): void {
  const act = s.action;
  const fishing = act?.kind === "fish";
  const held = findItem(s, s.activeId);
  const worn = s.body.hands;
  const rodItem = held && defOf(held).tool === "rod" ? held : worn && defOf(worn).tool === "rod" ? worn : null;
  if (!fishing && !rodItem) return;
  const aim = rodAim(s.dir, fishing);
  const source = sheets[pose.sheet];
  const arm = source instanceof HTMLImageElement ? rodArm(source, pose.col, row, row === 0 ? "l" : "r") : null;
  const footX = row === 1 ? 37 : 35;
  const toWorld = (px: number, py: number) => {
    let lx = (px - footX) * CHAR;
    if (flip) lx = -lx;
    return { x: s.x + lx, y: s.y + (py - CHAR_FOOT_Y) * CHAR };
  };
  let hx: number;
  let hy: number;
  let dx = aim.dx;
  let dy = aim.dy;
  if (arm) {
    const hand = toWorld(arm.fist.x, arm.fist.y);
    const shoulder = toWorld(arm.shoulder.x, arm.shoulder.y);
    hx = hand.x;
    hy = hand.y;
    const ax = hand.x - shoulder.x;
    const ay = hand.y - shoulder.y;
    if (ax * ax + ay * ay > 4) {
      let delta = Math.atan2(ay, ax) - Math.PI / 2;
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;
      const gain = fishing ? 0.45 : 1.35;
      delta = Math.max(-0.85, Math.min(0.85, -delta * gain));
      const c = Math.cos(delta);
      const sn = Math.sin(delta);
      dx = aim.dx * c - aim.dy * sn;
      dy = aim.dx * sn + aim.dy * c;
    }
  } else {
    const parked = s.dir === "s" ? { x: -4, y: -13 } : s.dir === "n" ? { x: 4, y: -13 } : s.dir === "e" ? { x: 2, y: -12 } : { x: -2, y: -12 };
    hx = s.x + parked.x;
    hy = s.y + parked.y;
  }
  const x0 = Math.round(hx);
  const y0 = Math.round(hy);
  const x1 = Math.round(hx + dx);
  const y1 = Math.round(hy + dy);
  paintRod(ctx, x0, y0, x1, y1);
  if ((s.catchFlash ?? 0) <= 0) return;
  ctx.fillStyle = "#3dba4a";
  ctx.fillRect(x1, y1 - 6, 1, 5);
  ctx.fillRect(x1 - 2, y1 - 4, 5, 1);
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

function paintPool(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, color: string, alpha: number, deep?: string): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / Math.max(1, rx));
  ctx.lineWidth = 1;
  if (rx < 2.2) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1.1, rx), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }
  ctx.globalAlpha = alpha * 0.8;
  const glow = ctx.createRadialGradient(0, 0, rx * 0.28, 0, 0, rx);
  glow.addColorStop(0, "rgba(0,0,0,0)");
  glow.addColorStop(0.42, deep ?? color);
  glow.addColorStop(0.7, color);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = Math.min(0.95, alpha + 0.2);
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, rx * 0.58, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = alpha * 0.7;
  ctx.strokeStyle = deep ?? color;
  ctx.beginPath();
  ctx.arc(0, 0, rx * 0.8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function spellInk(spell: SpellId): { deep: string; core: string; pale: string; veil: string; neon: string; scale: number } {
  switch (spell) {
    case "fireball":
      return { deep: "#4a0810", core: "#c81828", pale: "#e84048", veil: "#ffb0a8", neon: "#ff2d6a", scale: 0.95 };
    case "nova":
      return { deep: "#6a2208", core: "#e25810", pale: "#f07828", veil: "#ffc890", neon: "#ff6a18", scale: 1.12 };
    case "holy":
      return { deep: "#3a1468", core: "#7a38c8", pale: "#b070e8", veil: "#e8c8ff", neon: "#d24bff", scale: 1 };
    case "ice":
      return { deep: "#0c3058", core: "#1878c8", pale: "#38a0e0", veil: "#c8ecff", neon: "#2ad8ff", scale: 1 };
    case "iceball":
      return { deep: "#124868", core: "#2890c0", pale: "#40b0d4", veil: "#c8f4f0", neon: "#24e6d4", scale: 0.78 };
    case "spark":
      return { deep: "#6a4808", core: "#d89810", pale: "#f0c040", veil: "#ffe8a0", neon: "#ffe036", scale: 0.64 };
    case "bolt":
      return { deep: "#1a1048", core: "#4030c8", pale: "#7060e0", veil: "#d8d0ff", neon: "#7a4dff", scale: 1 };
    case "poison":
      return { deep: "#0c3018", core: "#188838", pale: "#30b858", veil: "#c8f0c0", neon: "#3cf06e", scale: 0.86 };
    case "drip":
      return { deep: "#102010", core: "#146028", pale: "#2a8040", veil: "#d8ecd0", neon: "#4ee070", scale: 0.58 };
  }
}

function strokeMark(ctx: CanvasRenderingContext2D, color: string, alpha: number, draw: () => void, shadow?: string): void {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (shadow) {
    ctx.save();
    ctx.translate(0.7, 1);
    ctx.globalAlpha = alpha * 0.7;
    ctx.strokeStyle = shadow;
    ctx.fillStyle = shadow;
    ctx.lineWidth = 2.6;
    draw();
    ctx.restore();
  }
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.15;
  draw();
  ctx.restore();
}

function paintHealSeal(ctx: CanvasRenderingContext2D, color: string, deep: string, big: boolean): void {
  const k = big ? 1.25 : 0.72;
  strokeMark(ctx, color, 0.92, () => {
    ctx.beginPath();
    ctx.moveTo(0, -6 * k);
    ctx.lineTo(0, 5.5 * k);
    ctx.moveTo(-3.4 * k, -0.4 * k);
    ctx.lineTo(3.4 * k, -0.4 * k);
    ctx.moveTo(0, -4 * k);
    ctx.bezierCurveTo(-5 * k, -1.5 * k, -4.5 * k, 3.2 * k, 0, 4.2 * k);
    ctx.moveTo(0, -4 * k);
    ctx.bezierCurveTo(5 * k, -1.5 * k, 4.5 * k, 3.2 * k, 0, 4.2 * k);
    ctx.moveTo(-1.4 * k, -6 * k);
    ctx.bezierCurveTo(-3.2 * k, -9 * k, 3.2 * k, -9 * k, 1.4 * k, -6 * k);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 1.35 * k, 0, Math.PI * 2);
    ctx.stroke();
  }, deep);
}

function paintWord(ctx: CanvasRenderingContext2D, spell: SpellId, color: string, deep: string): void {
  const word: Record<SpellId, ReadonlyArray<readonly [number, number, number]>> = {
    fireball: [
      [0, -8, 1],
      [-6, 2, -1],
      [6, 3, 1],
    ],
    nova: [
      [-7, -4, -1],
      [7, -4, 1],
      [-5, 5, 1],
      [5, 5, -1],
    ],
    holy: [
      [-7, 0, -1],
      [7, 0, 1],
      [0, 7, 1],
    ],
    ice: [
      [-6, -5, -1],
      [6, -5, 1],
      [0, 6, 1],
    ],
    iceball: [
      [-5, -3, -1],
      [6, 1, 1],
    ],
    spark: [
      [0, -6, 1],
      [5, 4, -1],
    ],
    bolt: [
      [-5, -6, -1],
      [5, -6, 1],
      [0, 7, 1],
    ],
    poison: [
      [-6, -2, -1],
      [6, -2, 1],
      [0, 6, -1],
    ],
    drip: [
      [0, 6, 1],
      [4, -4, 1],
    ],
  };
  strokeMark(ctx, color, 0.8, () => {
    ctx.beginPath();
    for (const [x, y, s] of word[spell]) {
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 3.2 * s, y - 2.4, x + 1.6 * s, y + 3.2, x + 0.4 * s, y + 0.8);
    }
    ctx.stroke();
  }, deep);
}

function tracePoly(ctx: CanvasRenderingContext2D, r: number, n: number, rot: number): void {
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}

function traceStar(ctx: CanvasRenderingContext2D, r: number, n: number, rot: number): void {
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = rot + i * ((Math.PI * 4) / n);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function paintLattice(ctx: CanvasRenderingContext2D, color: string, deep: string, spin: number): void {
  strokeMark(ctx, deep, 0.5, () => {
    ctx.beginPath();
    ctx.arc(0, 0, 3.6, 0, Math.PI * 2);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + spin * 0.15;
      const cx = Math.cos(a) * 3.6;
      const cy = Math.sin(a) * 3.6;
      ctx.moveTo(cx + 3.6, cy);
      ctx.arc(cx, cy, 3.6, 0, Math.PI * 2);
    }
    ctx.stroke();
  });
  strokeMark(ctx, color, 0.38, () => {
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = spin * 0.2 + (i / 12) * Math.PI * 2;
      const b = a + (5 / 12) * Math.PI * 2;
      ctx.moveTo(Math.cos(a) * 9, Math.sin(a) * 9);
      ctx.lineTo(Math.cos(b) * 9, Math.sin(b) * 9);
    }
    ctx.stroke();
    tracePoly(ctx, 10.4, 12, -spin * 0.2);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.moveTo(Math.cos(a) * 6.2, Math.sin(a) * 6.2);
      ctx.quadraticCurveTo(Math.cos(a + 0.4) * 10.6, Math.sin(a + 0.4) * 10.6, Math.cos(a + 0.78) * 6.2, Math.sin(a + 0.78) * 6.2);
    }
    ctx.stroke();
  });
}

function kochLine(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, depth: number): void {
  if (depth <= 0) {
    ctx.lineTo(x1, y1);
    return;
  }
  const dx = (x1 - x0) / 3;
  const dy = (y1 - y0) / 3;
  const ax = x0 + dx;
  const ay = y0 + dy;
  const bx = x0 + dx * 2;
  const by = y0 + dy * 2;
  const px = ax + dx * 0.5 - dy * 0.866;
  const py = ay + dx * 0.866 + dy * 0.5;
  kochLine(ctx, x0, y0, ax, ay, depth - 1);
  kochLine(ctx, ax, ay, px, py, depth - 1);
  kochLine(ctx, px, py, bx, by, depth - 1);
  kochLine(ctx, bx, by, x1, y1, depth - 1);
}

function paintFractal(ctx: CanvasRenderingContext2D, color: string, deep: string, spin: number): void {
  strokeMark(ctx, color, 0.62, () => {
    const r = 11;
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + spin * 0.08 + (i / 6) * Math.PI * 2;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    const first = pts[0]!;
    ctx.beginPath();
    ctx.moveTo(first[0], first[1]);
    for (let i = 0; i < 6; i++) {
      const a = pts[i]!;
      const b = pts[(i + 1) % 6]!;
      kochLine(ctx, a[0], a[1], b[0], b[1], 2);
    }
    ctx.stroke();
  }, deep);
  const bubble = (x: number, y: number, r: number, depth: number) => {
    if (r < 1.15) return;
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (depth <= 0) return;
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + spin + (i / 3) * Math.PI * 2;
      bubble(x + Math.cos(a) * r * 0.52, y + Math.sin(a) * r * 0.52, r * 0.4, depth - 1);
    }
  };
  strokeMark(ctx, deep, 0.5, () => {
    ctx.beginPath();
    bubble(0, 0, 5.2, 2);
    ctx.stroke();
  });
}

function paintTriangles(ctx: CanvasRenderingContext2D, pale: string, core: string, deep: string, spin: number): void {
  strokeMark(ctx, pale, 0.82, () => {
    tracePoly(ctx, 10, 3, -Math.PI / 2 + spin * 0.12);
    ctx.stroke();
    tracePoly(ctx, 10, 3, Math.PI / 2 - spin * 0.12);
    ctx.stroke();
    tracePoly(ctx, 6.4, 3, -Math.PI / 2 - spin * 0.2);
    ctx.stroke();
    tracePoly(ctx, 6.4, 3, Math.PI / 2 + spin * 0.2);
    ctx.stroke();
    tracePoly(ctx, 3.3, 3, -Math.PI / 2);
    ctx.stroke();
    tracePoly(ctx, 3.3, 3, Math.PI / 2);
    ctx.stroke();
  }, deep);
  strokeMark(ctx, core, 0.5, () => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
      const b = a + Math.PI / 3;
      const mx = (Math.cos(a) * 10 + Math.cos(b) * 10) / 2;
      const my = (Math.sin(a) * 10 + Math.sin(b) * 10) / 2;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10);
      ctx.moveTo(mx, my);
      ctx.lineTo(Math.cos((a + b) / 2) * 5, Math.sin((a + b) / 2) * 5);
    }
    ctx.stroke();
  });
}

function paintSigil(ctx: CanvasRenderingContext2D, spell: SpellId, x: number, y: number, clock: number): void {
  const ink = spellInk(spell);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(ink.scale, ink.scale * 0.82);
  const spin = clock * 0.35;
  paintPool(ctx, 0, 1, 13, 13, ink.core, 0.42, ink.deep);
  paintLattice(ctx, ink.core, ink.deep, spin);
  paintFractal(ctx, ink.pale, ink.deep, spin);
  paintTriangles(ctx, ink.pale, ink.core, ink.deep, spin);
  strokeMark(ctx, ink.pale, 0.75, () => {
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
    ctx.stroke();
  }, ink.deep);
  strokeMark(ctx, ink.core, 0.55, () => {
    tracePoly(ctx, 9, 6, spin);
    ctx.stroke();
    tracePoly(ctx, 5.5, 6, spin + Math.PI / 6);
    ctx.stroke();
  }, ink.deep);
  if (spell === "fireball") {
    strokeMark(ctx, ink.core, 0.95, () => {
      tracePoly(ctx, 8, 3, -Math.PI / 2);
      ctx.stroke();
      tracePoly(ctx, 4.5, 3, Math.PI / 2);
      ctx.stroke();
      traceStar(ctx, 6, 5, spin);
      ctx.stroke();
    }, ink.deep);
    paintPool(ctx, 0, -9, 2.2, 3.2, ink.pale, 0.8, ink.core);
    paintPool(ctx, 0, 0, 2.2, 2.2, ink.core, 0.85, ink.deep);
  } else if (spell === "nova") {
    strokeMark(ctx, ink.pale, 0.9, () => {
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const a = spin + (i / 16) * Math.PI * 2;
        const inner = i % 2 === 0 ? 3 : 5;
        const outer = i % 2 === 0 ? 12 : 8;
        ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
      }
      ctx.stroke();
      traceStar(ctx, 7, 8, -spin);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
      ctx.stroke();
    }, ink.deep);
    paintPool(ctx, 0, 0, 3.2, 3.2, ink.core, 0.85, ink.deep);
  } else if (spell === "holy") {
    strokeMark(ctx, ink.pale, 0.92, () => {
      ctx.beginPath();
      ctx.arc(-2.2, 0, 4.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(2.2, 0, 4.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(0, 8);
      ctx.moveTo(-6, -1);
      ctx.lineTo(6, -1);
      ctx.stroke();
      tracePoly(ctx, 4, 3, -Math.PI / 2 + spin * 0.4);
      ctx.stroke();
      tracePoly(ctx, 4, 3, Math.PI / 2 + spin * 0.4);
      ctx.stroke();
    }, ink.deep);
    paintPool(ctx, 0, -1, 2.4, 2.4, ink.pale, 0.75, ink.core);
  } else if (spell === "ice") {
    strokeMark(ctx, ink.pale, 0.92, () => {
      tracePoly(ctx, 9, 6, -Math.PI / 2);
      ctx.stroke();
      tracePoly(ctx, 6, 6, Math.PI / 6 + spin * 0.3);
      ctx.stroke();
      traceStar(ctx, 5, 6, spin);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
      ctx.stroke();
    }, ink.deep);
    paintPool(ctx, 0, 0, 2.4, 2.4, ink.pale, 0.45, ink.core);
  } else if (spell === "iceball") {
    strokeMark(ctx, ink.pale, 0.55, () => {
      tracePoly(ctx, 7, 6, spin);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.moveTo(Math.cos(a) * 2, Math.sin(a) * 2);
        ctx.lineTo(Math.cos(a) * 6, Math.sin(a) * 6);
      }
      ctx.stroke();
    }, ink.deep);
    strokeMark(ctx, ink.pale, 0.95, () => {
      ctx.beginPath();
      ctx.arc(-1, 0, 6, 0.55, Math.PI * 2 - 0.35);
      ctx.arc(2.1, 0, 4.5, Math.PI * 2 - 0.45, 0.65, true);
      ctx.fill();
    });
  } else if (spell === "spark") {
    strokeMark(ctx, ink.pale, 0.95, () => {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 3 + clock;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * 7, Math.sin(a) * 7);
      }
      ctx.stroke();
      tracePoly(ctx, 6, 3, -Math.PI / 2 + clock);
      ctx.stroke();
      tracePoly(ctx, 3, 3, Math.PI / 2 - clock);
      ctx.stroke();
    }, ink.deep);
    paintPool(ctx, 0, 0, 1.8, 1.8, ink.core, 0.9, ink.deep);
  } else if (spell === "bolt") {
    strokeMark(ctx, ink.pale, 0.95, () => {
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(0, 11);
      ctx.moveTo(-4.5, -7);
      ctx.lineTo(0, -13);
      ctx.lineTo(4.5, -7);
      ctx.moveTo(-4.5, 7);
      ctx.lineTo(0, 13);
      ctx.lineTo(4.5, 7);
      ctx.moveTo(-3, -8);
      ctx.lineTo(3, -6);
      ctx.moveTo(-3, 8);
      ctx.lineTo(3, 6);
      ctx.stroke();
      tracePoly(ctx, 3.5, 4, Math.PI / 4 + spin);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 2.1, 0, Math.PI * 2);
      ctx.stroke();
    }, ink.deep);
    paintPool(ctx, 0, 0, 2.2, 2.2, ink.pale, 0.7, ink.core);
  } else if (spell === "poison") {
    strokeMark(ctx, ink.core, 0.92, () => {
      tracePoly(ctx, 8, 3, Math.PI / 2);
      ctx.stroke();
      tracePoly(ctx, 5, 3, -Math.PI / 2 + spin * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 1, 2.4, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const a = Math.PI / 2 + (i * Math.PI * 2) / 3;
        ctx.moveTo(0, 1);
        ctx.lineTo(Math.cos(a) * 7, 1 + Math.sin(a) * 7);
      }
      ctx.stroke();
    }, ink.deep);
    paintPool(ctx, 0, 1, 2, 2, ink.pale, 0.75, ink.core);
  } else {
    strokeMark(ctx, ink.core, 0.55, () => {
      tracePoly(ctx, 5, 3, Math.PI / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 2, 3.2, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }, ink.deep);
    strokeMark(ctx, ink.pale, 0.92, () => {
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.bezierCurveTo(4.2, -1, 3.2, 5, 0, 7);
      ctx.bezierCurveTo(-3.2, 5, -4.2, -1, 0, -7);
      ctx.fill();
    }, ink.deep);
    paintPool(ctx, 0, -2, 1.6, 2, ink.pale, 0.7, ink.core);
  }
  paintHealSeal(ctx, ink.pale, ink.deep, spell === "holy");
  paintWord(ctx, spell, ink.core, ink.deep);
  paintGrain(ctx, ink.pale, ink.core, ink.deep);
  paintRough(ctx, spell, ink.pale, ink.core, ink.deep);
  for (let i = 0; i < 8; i++) {
    const a = clock * 1.3 + (i / 8) * Math.PI * 2;
    paintPool(ctx, Math.cos(a) * 10, Math.sin(a) * 10, 0.9, 0.9, i % 2 ? ink.pale : ink.core, 0.5, ink.deep);
  }
  ctx.restore();
}

function paintRough(ctx: CanvasRenderingContext2D, spell: SpellId, pale: string, core: string, deep: string): void {
  const wob = (n: number) => {
    const s = Math.sin(n * 12.9898) * 43758.5453;
    return s - Math.floor(s);
  };
  ctx.save();
  ctx.lineWidth = 1;
  ctx.lineJoin = "bevel";
  ctx.lineCap = "round";
  ctx.strokeStyle = deep;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const r = 11 + (wob(i + 2) - 0.5) * 1.8;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.strokeStyle = pale;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = wob(i + 4) * Math.PI * 2;
    const r0 = 2.2 + wob(i) * 2.4;
    const r1 = r0 + 1.8 + wob(i + 1) * 3;
    const bend = (wob(i + 8) - 0.5) * 0.55;
    ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
    ctx.lineTo(Math.cos(a + bend) * r1, Math.sin(a + bend) * r1);
    if (wob(i + 6) > 0.45) {
      const fork = a + bend + (wob(i + 9) - 0.5) * 0.8;
      ctx.moveTo(Math.cos(a + bend) * r1, Math.sin(a + bend) * r1);
      ctx.lineTo(Math.cos(fork) * (r1 + 1.6), Math.sin(fork) * (r1 + 1.6));
    }
  }
  ctx.stroke();
  ctx.strokeStyle = core;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  if (spell === "fireball" || spell === "nova") {
    for (let i = 0; i < 5; i++) {
      const lean = (i - 2) * 0.7;
      ctx.moveTo(lean * 0.4, -3);
      ctx.lineTo(lean + (i % 2 ? 0.8 : -0.8), -7 - (i % 3));
    }
  } else if (spell === "ice" || spell === "iceball") {
    ctx.moveTo(-2, 1);
    ctx.lineTo(-5, -1);
    ctx.lineTo(-6, -4);
    ctx.moveTo(-5, -1);
    ctx.lineTo(-3, -3);
    ctx.moveTo(2, 2);
    ctx.lineTo(5, 4);
    ctx.lineTo(4, 7);
  } else if (spell === "bolt" || spell === "spark") {
    ctx.moveTo(-1, -6);
    ctx.lineTo(2, -2);
    ctx.lineTo(-1, 1);
    ctx.lineTo(2, 6);
    ctx.moveTo(2, -2);
    ctx.lineTo(5, -1);
  } else if (spell === "poison" || spell === "drip") {
    ctx.moveTo(0, 2);
    ctx.lineTo(1, 5);
    ctx.lineTo(-1, 8);
    ctx.moveTo(1, 5);
    ctx.lineTo(3, 7);
  } else {
    ctx.moveTo(0, -6);
    ctx.lineTo(1, -2);
    ctx.lineTo(-1, 2);
    ctx.lineTo(1, 6);
  }
  ctx.stroke();
  ctx.restore();
}

function paintGrain(ctx: CanvasRenderingContext2D, pale: string, core: string, deep: string): void {
  ctx.save();
  ctx.lineWidth = 1;
  ctx.lineCap = "butt";
  ctx.strokeStyle = core;
  ctx.globalAlpha = 0.32;
  ctx.beginPath();
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    const inner = 2.2 + (i % 4) * 0.45;
    const outer = 6.4 + (i % 5) * 0.85;
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
  }
  ctx.stroke();
  ctx.strokeStyle = deep;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + 0.08;
    const r = 9.2;
    const t = a + Math.PI / 2;
    ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a) * r + Math.cos(t) * 1.6, Math.sin(a) * r + Math.sin(t) * 1.6);
  }
  ctx.stroke();
  ctx.fillStyle = pale;
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const r = i % 2 === 0 ? 7.6 : 4.6;
    ctx.fillRect(Math.cos(a) * r - 0.5, Math.sin(a) * r - 0.5, 1, 1);
  }
  ctx.strokeStyle = pale;
  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 + 0.13;
    const r0 = 3.4 + (i % 3) * 1.7;
    const r1 = r0 + 2.1;
    const b = a + 0.22;
    ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
    ctx.lineTo(Math.cos(b) * r1, Math.sin(b) * r1);
    ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.lineTo(Math.cos(b) * r0, Math.sin(b) * r0);
  }
  ctx.stroke();
  ctx.strokeStyle = core;
  ctx.globalAlpha = 0.34;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ctx.arc(Math.cos(a) * 8.4, Math.sin(a) * 8.4, 1.15, a, a + 1.1);
  }
  ctx.stroke();
  ctx.fillStyle = deep;
  ctx.globalAlpha = 0.45;
  for (let i = 0; i < 36; i++) {
    const a = (i * 2.399) % (Math.PI * 2);
    const r = 1.8 + (i % 7) * 1.15;
    ctx.fillRect(Math.cos(a) * r - 0.5, Math.sin(a) * r - 0.5, 1, 1);
  }
  ctx.restore();
}

function paintPetal(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, fill: string, pale: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = fill;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(1, 0);
  ctx.bezierCurveTo(4, -2.2, 9, -1.6, 11, 0);
  ctx.bezierCurveTo(9, 1.6, 4, 2.2, 1, 0);
  ctx.stroke();
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = pale;
  ctx.beginPath();
  ctx.moveTo(3, 0);
  ctx.lineTo(10, 0);
  ctx.stroke();
  ctx.restore();
}

function paintCircleRite(ctx: CanvasRenderingContext2D, cx: number, cy: number, deep: string, core: string, pale: string, clock: number): void {
  const breath = 1 + 0.035 * Math.sin(clock * 2.2);
  const rx = 26 * breath;
  const ry = 15 * breath;
  paintPool(ctx, cx, cy + 2, rx + 8, ry + 5, core, 0.34, deep);
  paintPool(ctx, cx, cy + 1, rx * 0.55, ry * 0.55, pale, 0.28, core);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);
  ctx.globalCompositeOperation = "source-over";
  ctx.lineJoin = "round";
  ctx.lineWidth = 3;
  ctx.strokeStyle = deep;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.35;
  ctx.strokeStyle = pale;
  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = core;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(0, 0, rx * 0.68, 0, Math.PI * 2);
  ctx.stroke();
  ctx.save();
  ctx.rotate(clock * 0.15);
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = deep;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const b = a + (5 / 12) * Math.PI * 2;
    ctx.moveTo(Math.cos(a) * rx * 0.84, Math.sin(a) * rx * 0.84);
    ctx.lineTo(Math.cos(b) * rx * 0.84, Math.sin(b) * rx * 0.84);
  }
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.rotate(clock * 0.4);
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = pale;
  tracePoly(ctx, rx * 0.5, 3, -Math.PI / 2);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.rotate(clock * 0.22);
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = pale;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI / 2 + (i / 12) * Math.PI * 2;
    const r = rx * 0.72;
    const tip = r + rx * 0.1;
    ctx.moveTo(Math.cos(a) * tip, Math.sin(a) * tip);
    ctx.lineTo(Math.cos(a + 0.16) * r, Math.sin(a + 0.16) * r);
    ctx.lineTo(Math.cos(a - 0.16) * r, Math.sin(a - 0.16) * r);
    ctx.closePath();
  }
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.rotate(-clock * 0.28);
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = core;
  tracePoly(ctx, rx * 0.34, 3, Math.PI / 2);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = core;
  ctx.globalAlpha = 0.26;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const inner = rx * (0.28 + (i % 4) * 0.03);
    const outer = rx * (0.62 + (i % 3) * 0.06);
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
  }
  ctx.stroke();
  ctx.strokeStyle = pale;
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2 + 0.1;
    const r0 = rx * 0.4;
    const r1 = rx * 0.78;
    const b = a + 0.16;
    ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
    ctx.lineTo(Math.cos(b) * r1, Math.sin(b) * r1);
    ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.lineTo(Math.cos(b) * r0, Math.sin(b) * r0);
  }
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * Math.PI * 2 + clock * 0.2;
    paintPetal(ctx, cx + Math.cos(a) * rx * 0.92, cy + Math.sin(a) * ry * 0.92, a, i % 2 ? core : pale, pale);
  }
  for (let i = 0; i < 12; i++) {
    const a = clock * 0.75 + (i / 12) * Math.PI * 2;
    paintPool(ctx, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 1.3, 1.3, i % 3 === 0 ? pale : core, 0.55, deep);
  }
}

function paintAether(ctx: CanvasRenderingContext2D, spell: SpellId, x: number, y: number, rx: number, ry: number, clock: number): void {
  const ink = spellInk(spell);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.imageSmoothingEnabled = false;
  const breath = Math.floor(clock * 3);
  for (let py = -ry; py <= ry; py++) {
    for (let px = -rx; px <= rx; px++) {
      const nx = px / rx;
      const ny = py / ry;
      const d = nx * nx + ny * ny;
      if (d > 0.92 || d < 0.08) continue;
      const hash = (px * 13 + py * 7 + breath) & 7;
      if (hash > 2) continue;
      ctx.globalAlpha = 0.16 + 0.22 * (1 - d);
      ctx.fillStyle = hash === 0 ? ink.veil : ink.pale;
      ctx.fillRect(px, py, 1, 1);
    }
  }
  ctx.fillStyle = ink.veil;
  const n = Math.max(14, Math.round(rx * 5));
  for (let i = 0; i < n; i++) {
    if ((i + breath) % 3 === 0) continue;
    const a = (i / n) * Math.PI * 2 + clock * 0.15;
    ctx.globalAlpha = 0.28 + 0.18 * Math.sin(clock * 2 + i);
    ctx.fillRect(Math.round(Math.cos(a) * rx * 0.78), Math.round(Math.sin(a) * ry * 0.78), 1, 1);
  }
  for (let i = 0; i < 6; i++) {
    const a = clock * 0.4 + (i / 6) * Math.PI * 2;
    const rise = (clock * 5 + i * 2.2) % (ry + 4);
    const fade = 1 - rise / (ry + 4);
    ctx.globalAlpha = 0.2 + 0.45 * fade;
    ctx.fillStyle = i % 2 === 0 ? ink.veil : ink.pale;
    ctx.fillRect(Math.round(Math.cos(a) * rx * 0.62), Math.round(Math.sin(a) * ry * 0.55 - rise), 1, 1);
  }
  ctx.restore();
}

function paintSpellGleam(ctx: CanvasRenderingContext2D, spell: SpellId, x: number, y: number, clock: number): void {
  const ink = spellInk(spell);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = ink.pale;
  for (let i = 0; i < 12; i++) {
    const a = clock * 0.7 + (i / 12) * Math.PI * 2;
    const px = Math.round(Math.cos(a) * 18);
    const py = Math.round(Math.sin(a) * 11);
    ctx.globalAlpha = 0.28 + 0.55 * (0.5 + 0.5 * Math.sin(clock * 5 + i));
    ctx.fillRect(px, py, 1, 1);
    if (i % 3 === 0) ctx.fillRect(px + Math.sign(Math.cos(a) || 1), py, 1, 1);
  }
  ctx.fillStyle = ink.core;
  ctx.globalAlpha = 0.85;
  const sweep = clock * 1.6;
  ctx.fillRect(Math.round(Math.cos(sweep) * 13), Math.round(Math.sin(sweep) * 8), 1, 1);
  ctx.fillRect(Math.round(Math.cos(sweep + Math.PI) * 13), Math.round(Math.sin(sweep + Math.PI) * 8), 1, 1);
  ctx.fillStyle = ink.pale;
  if (spell === "fireball" || spell === "nova") {
    for (let i = 0; i < 5; i++) {
      const rise = (clock * 12 + i * 2.4) % 9;
      ctx.globalAlpha = 0.9 - rise / 10;
      ctx.fillRect(-8 + i * 4, -6 - Math.floor(rise), 1, i % 2 ? 2 : 1);
    }
  } else if (spell === "ice" || spell === "iceball") {
    ctx.globalAlpha = 0.8;
    for (let i = 0; i < 4; i++) {
      const a = clock * 0.4 + (i / 4) * Math.PI * 2;
      const px = Math.round(Math.cos(a) * 15);
      const py = Math.round(Math.sin(a) * 9);
      ctx.fillRect(px, py, 1, 1);
      ctx.fillRect(px + 1, py, 1, 1);
      ctx.fillRect(px, py - 1, 1, 1);
    }
  } else if (spell === "holy") {
    ctx.globalAlpha = 0.75;
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + (i / 4) * Math.PI * 2 + clock * 0.3;
      const px = Math.round(Math.cos(a) * 16);
      const py = Math.round(Math.sin(a) * 10);
      ctx.fillRect(px, py - 1, 1, 3);
      ctx.fillRect(px - 1, py, 3, 1);
    }
  } else if (spell === "bolt" || spell === "spark") {
    ctx.globalAlpha = 0.9;
    const j = Math.floor(clock * 10);
    ctx.fillRect(-2 + (j % 3), -12, 1, 2);
    ctx.fillRect(1 - (j % 2), -10, 1, 1);
    ctx.fillRect(3, -8 + (j % 4), 1, 1);
  } else if (spell === "poison" || spell === "drip") {
    for (let i = 0; i < 3; i++) {
      const bob = Math.sin(clock * 3 + i) * 2;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(-6 + i * 6, Math.round(-4 + bob), 2, 2);
    }
  }
  ctx.restore();
}

function castHands(s: GameState): { x: number; y: number } {
  const { row, flip } = rowOf(s.dir);
  const footX = row === 1 ? 37 : 35;
  let lx = (36 - footX) * CHAR;
  if (flip) lx = -lx;
  return { x: s.x + lx, y: s.y + (21 - CHAR_FOOT_Y) * CHAR };
}

function paintKiOrb(ctx: CanvasRenderingContext2D, spell: SpellId, x: number, y: number, clock: number): void {
  const ink = spellInk(spell);
  const r = 3;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.imageSmoothingEnabled = false;
  for (let py = -r; py <= r; py++) {
    for (let px = -r; px <= r; px++) {
      if (px * px + py * py > r * r) continue;
      ctx.globalAlpha = 0.94;
      ctx.fillStyle = -px - py > 1 ? ink.core : ink.deep;
      ctx.fillRect(px, py, 1, 1);
    }
  }
  ctx.fillStyle = ink.neon;
  for (let i = 0; i < 8; i++) {
    if (i % 3 === 1) continue;
    const a = (i / 8) * Math.PI * 2 + clock * 0.9;
    ctx.globalAlpha = 0.72 + 0.22 * Math.sin(clock * 5 + i);
    ctx.fillRect(Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r), 1, 1);
  }
  ctx.globalAlpha = 0.95;
  ctx.fillRect(0, 0, 1, 1);
  ctx.globalAlpha = 0.65;
  ctx.fillRect(-1, -1, 1, 1);
  for (let i = 0; i < 3; i++) {
    const a = clock * 3.2 + (i / 3) * Math.PI * 2;
    ctx.globalAlpha = 0.5 + 0.45 * Math.sin(clock * 6 + i);
    ctx.fillRect(Math.round(Math.cos(a) * (r + 2)), Math.round(Math.sin(a) * (r + 2)), 1, 1);
  }
  ctx.restore();
}

function drawCastRite(ctx: CanvasRenderingContext2D, sheets: Sheets, s: GameState): void {
  const cast = s.cast;
  if (!cast) return;
  const img = sheets[cast.spell];
  if (!img || img.width < 72) return;
  const ink = spellInk(cast.spell);
  const frames = Math.max(1, Math.floor(img.width / 72));
  const frame = Math.floor(s.clock * 8) % frames;
  paintAether(ctx, cast.spell, s.x, s.y + 2, 16, 9, s.clock);
  paintPool(ctx, s.x, s.y + 3, 18, 10, ink.veil, 0.14, ink.neon);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.46 + 0.1 * Math.sin(s.clock * 1.8);
  ctx.drawImage(img, frame * 72, 0, 72, 72, Math.round(s.x) - 18, Math.round(s.y + 3) - 10, 36, 20);
  ctx.restore();
  paintSpellGleam(ctx, cast.spell, s.x, s.y + 1, s.clock);
  paintAether(ctx, cast.spell, s.x, s.y + 2, 16, 9, s.clock + 1.3);
  const hand = castHands(s);
  paintKiOrb(ctx, cast.spell, hand.x, hand.y - 7, s.clock);
}

function drawSpell(ctx: CanvasRenderingContext2D, sheets: Sheets, s: GameState): void {
  void ctx;
  void sheets;
  void s;
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

function drawPlotSoil(ctx: CanvasRenderingContext2D, sheets: Sheets, p: Plot) {
  const w = p.w || 20;
  const h = p.h || 16;
  const x = Math.round(p.x - w / 2);
  const y = Math.round(p.y - h / 2);
  const tilled = p.tilled || (!!p.crop && p.stage !== 0);
  if (!tilled || !sheets.landTilled) return;
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

function drawPlotCrop(ctx: CanvasRenderingContext2D, sheets: Sheets, p: Plot) {
  if (!p.crop || p.stage === 0 || !sheets[p.crop]) return;
  const w = p.w || 20;
  const h = p.h || 16;
  const x = Math.round(p.x - w / 2);
  const y = Math.round(p.y - h / 2);
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

const HAND_SHEET: Record<ReaperPose, string> = {
  idle: "handIdle",
  walk: "handWalk",
  handsidle: "handHandsIdle",
  handswalk: "handHandsWalk",
  water: "handWater",
  shovel: "handShovel",
  scythe: "handScythe",
  axe: "handAxe",
  hammer: "handHammer",
  pickaxe: "handPickaxe",
};

function paintHand(ctx: CanvasRenderingContext2D, sheets: Sheets, s: GameState): void {
  if ((s.wing ?? 0) !== 0) return;
  const h = s.hand;
  if (!h) return;
  const img = sheets[HAND_SHEET[h.pose]] ?? sheets.handIdle;
  if (!img || img.width < CHAR_W) return;
  const frames = Math.max(1, Math.min(REAPER_FRAMES[h.pose], Math.floor(img.width / CHAR_W)));
  const { row, flip } = rowOf(h.dir);
  const moving = h.pose === "walk" || h.pose === "handswalk";
  const col = moving
    ? Math.floor(h.poseT * 5) % frames
    : h.pose === "idle" || h.pose === "handsidle"
      ? Math.floor(h.poseT * 2) % frames
      : Math.min(frames - 1, Math.floor(h.poseT * 6));
  const footX = row === 1 ? 37 : 35;
  blit(ctx, img, col * CHAR_W, row * CHAR_H, CHAR_W, CHAR_H, h.x, h.y, 0.36, flip, footX, CHAR_FOOT_Y);
}

const XIANG64_SCALE = 0.67;

function paintXiang64(ctx: CanvasRenderingContext2D, sheets: Sheets, s: GameState): void {
  if ((s.wing ?? 0) !== 0) return;
  const n = s.xiang64;
  if (!n) return;
  const img = sheets.xiang64Idle;
  if (!img || img.width < 64) return;
  const frames = Math.max(1, Math.floor(img.width / 64));
  const col = Math.floor(n.poseT * 8) % frames;
  blit(ctx, img, col * 64, 0, 64, 64, n.x, n.y, XIANG64_SCALE, false, 32, 63);
}

function paintMaid(ctx: CanvasRenderingContext2D, sheets: Sheets, s: GameState): void {
  if ((s.wing ?? 0) !== 2) return;
  const m = s.maid;
  if (!m) return;
  const east = m.dir === "e";
  const key = m.dir === "n" ? "maidN" : m.dir === "s" ? "maidS" : "maidW";
  const img = sheets[key];
  if (!img || img.width < 72) return;
  const frames = Math.max(1, Math.floor(img.width / 72));
  const moving = m.pause <= 0 && (m.route?.length ?? 0) >= 2;
  const col = moving ? Math.floor(m.poseT * 8) % frames : 0;
  blit(ctx, img, col * 72, 0, 72, 72, m.x, m.y, 0.46, east, 36, 70);
}

const STABLE_ROW: Record<"s" | "w" | "e" | "n", number> = { s: 0, w: 1, e: 2, n: 3 };
const STABLE_SCALE = 0.18;
const STABLE_CELLS = 14;
const stablePlain = new Map<string, HTMLCanvasElement>();

function stableBlock(img: HTMLImageElement, col: number, row: number): HTMLCanvasElement | null {
  const key = `${img.width}:${col}:${row}`;
  const cached = stablePlain.get(key);
  if (cached) return cached;
  if (typeof document === "undefined") return null;
  const src = document.createElement("canvas");
  src.width = 144;
  src.height = 144;
  const sg = src.getContext("2d", { willReadFrequently: true });
  if (!sg) return null;
  sg.imageSmoothingEnabled = false;
  sg.drawImage(img, col * 144, row * 144, 144, 144, 0, 0, 144, 144);
  const data = sg.getImageData(0, 0, 144, 144).data;
  const out = document.createElement("canvas");
  out.width = STABLE_CELLS;
  out.height = STABLE_CELLS;
  const cg = out.getContext("2d");
  if (!cg) return null;
  const pixels = cg.createImageData(STABLE_CELLS, STABLE_CELLS);
  const step = 144 / STABLE_CELLS;
  for (let cy = 0; cy < STABLE_CELLS; cy++) {
    for (let cx = 0; cx < STABLE_CELLS; cx++) {
      const counts = new Map<number, number>();
      let bestKey = -1;
      let bestN = 0;
      let bestAt = 0;
      const x0 = Math.floor(cx * step);
      const y0 = Math.floor(cy * step);
      const x1 = Math.floor((cx + 1) * step);
      const y1 = Math.floor((cy + 1) * step);
      for (let y = y0; y < y1; y += 2) {
        for (let x = x0; x < x1; x += 2) {
          const i = (y * 144 + x) * 4;
          if ((data[i + 3] ?? 0) < 128) continue;
          const bucket = ((data[i] ?? 0) >> 4) * 256 + ((data[i + 1] ?? 0) >> 4) * 16 + ((data[i + 2] ?? 0) >> 4);
          const n = (counts.get(bucket) ?? 0) + 1;
          counts.set(bucket, n);
          if (n > bestN) {
            bestN = n;
            bestKey = bucket;
            bestAt = i;
          }
        }
      }
      const o = (cy * STABLE_CELLS + cx) * 4;
      if (bestKey < 0) pixels.data[o + 3] = 0;
      else {
        pixels.data[o] = data[bestAt] ?? 0;
        pixels.data[o + 1] = data[bestAt + 1] ?? 0;
        pixels.data[o + 2] = data[bestAt + 2] ?? 0;
        pixels.data[o + 3] = 255;
      }
    }
  }
  cg.putImageData(pixels, 0, 0);
  stablePlain.set(key, out);
  return out;
}

function paintStable(ctx: CanvasRenderingContext2D, sheets: Sheets, s: GameState): void {
  if ((s.wing ?? 0) !== 2) return;
  const n = s.stable;
  if (!n) return;
  const moving = n.pause <= 0 && (n.route?.length ?? 0) >= 2;
  const img = moving ? sheets.stableWalk : sheets.stableIdle;
  if (!img || img.width < 144) return;
  const row = STABLE_ROW[n.dir] ?? 0;
  const frames = moving ? Math.max(1, Math.floor(img.width / 144)) : 1;
  const col = moving ? Math.floor(n.poseT * 8) % frames : 0;
  const block = stableBlock(img, col, row);
  if (!block) return;
  const show = Math.round(144 * STABLE_SCALE);
  blit(ctx, block, 0, 0, STABLE_CELLS, STABLE_CELLS, n.x, n.y, show / STABLE_CELLS, false, (72 / 144) * STABLE_CELLS, (139 / 144) * STABLE_CELLS);
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

function portalCovers(px: number, py: number): boolean {
  const boxes: Array<[number, number, number]> = [
    [40, 64, 112],
    [308, 72, 104],
  ];
  for (const [cx, dw, dh] of boxes) {
    const x = Math.max(1, Math.min(WORLD_W - dw - 1, Math.round(cx - dw / 2)));
    const y = PORTAL_BASE - dh;
    if (px >= x && px < x + dw && py >= y && py < PORTAL_BASE) return true;
  }
  return false;
}

function drawPortal(
  ctx: CanvasRenderingContext2D,
  sheets: Sheets,
  cx: number,
  cy: number,
  east: boolean,
  clock: number,
  home = false,
  foot = PORTAL_BASE,
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
    const y = Math.round(foot - dh);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, dw, dh);
    const mouthL = x + Math.round(dw * 0.22);
    const mouthW = Math.max(1, dw - Math.round(dw * 0.44));
    ctx.rect(mouthL, y + dh - 8, mouthW, 8);
    ctx.clip("evenodd");
    ctx.drawImage(img, 0, 0, img.width, img.height, x, y, dw, dh);
    ctx.restore();
    paintPortalMouth(ctx, x, y, dw, dh, east, clock, home);
    seatArchInSidewalk(ctx, x, dw, east, foot);
    return;
  }
  if (east) drawEastGate(ctx, cx, cy, clock);
  else drawWestGate(ctx, cx, cy, clock);
}

function flagBounds(x: number, y: number, dw: number, dh: number) {
  const cx = Math.round(x + dw * 0.5);
  const rx = Math.max(10, Math.round(dw * 0.22));
  const top = Math.round(y + dh * 0.32);
  const bot = Math.round(y + dh * 0.8);
  return { cx, left: cx - rx, right: cx + rx, top, bot, notch: 5 };
}

function flagPath(ctx: CanvasRenderingContext2D, b: ReturnType<typeof flagBounds>): void {
  const mid = (b.top + b.bot) >> 1;
  ctx.moveTo(b.left, b.top);
  ctx.lineTo(b.right, b.top);
  ctx.lineTo(b.right - b.notch, mid);
  ctx.lineTo(b.right, b.bot);
  ctx.lineTo(b.left, b.bot);
  ctx.closePath();
}

function plotLine(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
): void {
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  ctx.fillStyle = color;
  for (let n = 0; n < 48; n++) {
    ctx.fillRect(x, y, 1, 1);
    if (x === x1 && y === y1) break;
    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

function paintFlagHem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dw: number,
  dh: number,
  east: boolean,
  clock: number,
  home: boolean,
): void {
  const b = flagBounds(x, y, dw, dh);
  const mid = (b.top + b.bot) >> 1;
  const ink = home ? "#3a2410" : east ? "#4a3010" : "#1c0808";
  const hem = home ? "#c9962c" : east ? "#e2b340" : "#a02818";
  const hemHi = home ? "#fff1b8" : east ? "#fff6d0" : "#ffb070";
  const gleam = Math.floor(clock * 4) % 2 === 0 ? "#fffef8" : hemHi;
  const w = b.right - b.left;
  const h = b.bot - b.top;

  ctx.fillStyle = "#6a5030";
  ctx.fillRect(b.left - 3, b.top - 7, 3, h + 10);
  ctx.fillStyle = ink;
  ctx.fillRect(b.left - 2, b.top - 6, 1, h + 8);
  ctx.fillStyle = hemHi;
  ctx.fillRect(b.left - 2, b.top - 6, 1, 2);
  ctx.fillStyle = hem;
  ctx.fillRect(b.left - 3, b.top - 1, 2, 2);
  ctx.fillRect(b.left - 3, b.top + 4, 2, 1);

  ctx.fillStyle = hem;
  ctx.fillRect(b.left - 1, b.top - 3, w + 2, 2);
  ctx.fillStyle = hemHi;
  ctx.fillRect(b.left, b.top - 3, w, 1);

  ctx.fillStyle = ink;
  ctx.fillRect(b.left - 1, b.top, 2, h + 1);
  ctx.fillRect(b.left, b.top, w, 2);
  ctx.fillRect(b.left, b.bot - 1, w, 2);
  ctx.fillStyle = hem;
  ctx.fillRect(b.left + 1, b.top + 1, 1, h - 1);
  ctx.fillRect(b.left + 2, b.top + 1, w - 4, 1);
  ctx.fillRect(b.left + 2, b.bot - 2, w - 6, 1);
  plotLine(ctx, b.right, b.top, b.right - b.notch, mid, ink);
  plotLine(ctx, b.right - b.notch, mid, b.right, b.bot, ink);
  plotLine(ctx, b.right - 1, b.top + 2, b.right - b.notch + 1, mid, hem);
  plotLine(ctx, b.right - b.notch + 1, mid, b.right - 1, b.bot - 2, hem);

  const spark = Math.floor(clock * 6) % Math.max(4, h - 6);
  ctx.fillStyle = gleam;
  ctx.fillRect(b.left + 2, b.top + 3 + spark, 1, 2);
  for (let i = 3; i < w - 6; i += 4) {
    ctx.fillStyle = i % 8 === 3 ? hemHi : hem;
    ctx.fillRect(b.left + i, b.top + 2, 1, 1);
    ctx.fillRect(b.left + i, b.bot - 3, 1, 1);
  }

  ctx.fillStyle = hem;
  ctx.fillRect(b.right - b.notch, mid, 1, 5);
  ctx.fillStyle = hemHi;
  ctx.fillRect(b.right - b.notch - 1, mid + 5, 3, 1);
  ctx.fillStyle = ink;
  ctx.fillRect(b.right - b.notch, mid + 6, 1, 2);

  const shade = home ? "#6a5030" : east ? "#8a6840" : "#2a0808";
  const lit = home ? "#fff6d0" : east ? "#fff8e0" : "#ffb090";
  for (let i = 0; i < 3; i++) {
    const fx = b.left + 5 + i * Math.max(4, Math.floor((w - 10) / 3));
    for (let fy = b.top + 5; fy < b.bot - 4; fy += 2) {
      ctx.fillStyle = i % 2 === 0 ? shade : lit;
      ctx.fillRect(fx, fy, 1, 1);
    }
  }
}

function paintPortalMouth(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dw: number,
  dh: number,
  east: boolean,
  clock: number,
  home = false,
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  paintMouthSunAndLand(ctx, x, y, dw, dh, east, clock, home);
  paintFlagHem(ctx, x, y, dw, dh, east, clock, home);
  ctx.restore();
}

function diskRamp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  colors: readonly string[],
): void {
  const last = colors.length - 1;
  for (let dy = -r; dy <= r; dy++) {
    const span = Math.sqrt(r * r - dy * dy);
    const half = Math.floor(span);
    for (let dx = -half; dx <= half; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy) / r;
      const light = (-dx - dy) / (r * 1.6);
      let band = Math.min(last, Math.floor(dist * colors.length));
      if (light > 0.45 && band > 0) band -= 1;
      if (light < -0.2 && band < last) band += 1;
      ctx.fillStyle = colors[band]!;
      ctx.fillRect(cx + dx, cy + dy, 1, 1);
    }
  }
}

function dither(colors: readonly string[], u: number, x: number, y: number): string {
  const last = colors.length - 1;
  const f = Math.max(0, Math.min(0.999, u)) * last;
  const i = Math.floor(f);
  const frac = f - i;
  if (i >= last) return colors[last]!;
  const bayer = (x & 1) + ((y & 1) << 1);
  const gate = [0.2, 0.6, 0.8, 0.4][bayer]!;
  return frac > gate ? colors[i + 1]! : colors[i]!;
}

const mouthPlates = new Map<string, HTMLCanvasElement>();

function paintMouthSunAndLand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dw: number,
  dh: number,
  east: boolean,
  clock: number,
  home = false,
): void {
  const key = `flag2:${home ? "h" : east ? "e" : "w"}:${dw}x${dh}`;
  let plate = mouthPlates.get(key);
  if (!plate && typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = dw;
    canvas.height = dh;
    const g = canvas.getContext("2d");
    if (g) {
      paintMouthScene(g, 0, 0, dw, dh, east, 0, home);
      plate = canvas;
      mouthPlates.set(key, canvas);
    }
  }
  if (plate) {
    ctx.drawImage(plate, x, y);
    return;
  }
  paintMouthScene(ctx, x, y, dw, dh, east, clock, home);
}

function paintMouthScene(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dw: number,
  dh: number,
  east: boolean,
  clock: number,
  home = false,
): void {
  const b = flagBounds(x, y, dw, dh);
  const cx = b.cx;
  const rx = b.cx - b.left;
  const top = b.top;
  const bot = b.bot;
  ctx.save();
  ctx.beginPath();
  flagPath(ctx, b);
  ctx.clip();
  if (home) {
    paintHomeMouth(ctx, cx, rx, top, bot);
    ctx.restore();
    return;
  }

  const sky = east
    ? ["#10163c", "#1e3f92", "#7eb4ee", "#f4b8c4", "#ffe6a8"]
    : ["#0c0608", "#3a0810", "#9a1418", "#e04018", "#ffb060"];
  const height = Math.max(1, bot - top);
  for (let py = top; py < top + Math.floor(height * 0.58); py++) {
    const u = (py - top) / height;
    for (let px = cx - rx - 2; px <= cx + rx + 2; px++) {
      ctx.fillStyle = dither(sky, u * 1.15, px, py);
      ctx.fillRect(px, py, 1, 1);
    }
  }
  ctx.fillStyle = east ? "#fffaf4" : "#2a1010";
  ctx.fillRect(cx - rx + 2, top + 4, 5, 2);
  ctx.fillRect(cx - rx + 3, top + 3, 3, 1);
  ctx.fillStyle = east ? "#d8e8ff" : "#4a1814";
  ctx.fillRect(cx - rx + 3, top + 4, 2, 1);
  ctx.fillRect(cx + 2, top + 8, 4, 2);

  const sy = top + Math.round(height * 0.28);
  const sunR = east ? 5 : 4;
  diskRamp(
    ctx,
    cx,
    sy,
    sunR,
    east ? ["#fffef8", "#ffe9a4", "#f0c060", "#d09040"] : ["#fff0a0", "#ff7020", "#c01810", "#4a0808"],
  );
  ctx.fillStyle = east ? "#fffef8" : "#ffe080";
  ctx.fillRect(cx - 2, sy - 2, 2, 1);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.fillStyle = east ? (i % 2 === 0 ? "#fff6d0" : "#f0c060") : i % 2 === 0 ? "#ff5010" : "#ffd060";
    ctx.fillRect(Math.round(cx + Math.cos(a) * (sunR + 2)), Math.round(sy + Math.sin(a) * (sunR + 2)), 1, 1);
  }

  const horizon = top + Math.round(height * 0.58);
  const land = east
    ? ["#fff8d8", "#f0d48a", "#7ec85a", "#3f9a48", "#1c5a32"]
    : ["#ff4810", "#6a1814", "#3a1010", "#1a0808", "#080404"];
  const landH = Math.max(1, bot - horizon);
  for (let py = horizon; py < bot; py++) {
    const u = (py - horizon) / landH;
    for (let px = cx - rx - 2; px <= cx + rx + 2; px++) {
      ctx.fillStyle = dither(land, u, px, py);
      ctx.fillRect(px, py, 1, 1);
    }
  }
  ctx.fillStyle = east ? "#fffef4" : "#ffd0a0";
  ctx.fillRect(cx - rx, horizon, rx * 2 + 1, 1);
  for (let i = 0; i < 6; i++) {
    const px = cx - 6 + i * 2;
    const peak = 3 + (i % 3);
    ctx.fillStyle = east ? (i === 3 ? "#fffef4" : "#c8a060") : i === 3 ? "#ff4010" : "#140808";
    ctx.fillRect(px, horizon - peak, 2, peak);
    ctx.fillStyle = east ? "#8a6840" : "#2a1010";
    ctx.fillRect(px + 1, horizon - peak + 1, 1, peak);
  }
  if (east) {
    ctx.fillStyle = "#8a5a28";
    ctx.fillRect(cx + 3, horizon - 8, 7, 1);
    ctx.fillStyle = "#ffe08a";
    ctx.fillRect(cx + 4, horizon - 7, 5, 2);
    ctx.fillStyle = "#fff6e4";
    ctx.fillRect(cx + 4, horizon - 5, 5, 5);
    ctx.fillStyle = "#c8b090";
    ctx.fillRect(cx + 7, horizon - 5, 2, 5);
    ctx.fillStyle = "#3ec8c4";
    ctx.fillRect(cx + 5, horizon - 3, 2, 2);
    ctx.fillStyle = "#e87898";
    ctx.fillRect(cx + 7, horizon - 8, 1, 1);
    ctx.fillStyle = "#e6c878";
    ctx.fillRect(cx - 1, horizon + 2, 1, landH);
    ctx.fillStyle = "#fff0b0";
    ctx.fillRect(cx, horizon + 2, 2, landH);
    ctx.fillStyle = "#1f7a38";
    ctx.fillRect(cx - 7, horizon - 5, 4, 3);
    ctx.fillStyle = "#0e3a18";
    ctx.fillRect(cx - 4, horizon - 4, 1, 3);
    ctx.fillStyle = "#c8f090";
    ctx.fillRect(cx - 6, horizon - 4, 2, 1);
    ctx.fillStyle = "#8a5a30";
    ctx.fillRect(cx - 6, horizon - 2, 1, 2);
  } else {
    ctx.fillStyle = "#0c0808";
    ctx.fillRect(cx - 6, horizon - 8, 2, 8);
    ctx.fillRect(cx + 4, horizon - 8, 2, 8);
    ctx.fillStyle = "#3a2418";
    ctx.fillRect(cx - 6, horizon - 9, 12, 1);
    ctx.fillStyle = "#a07840";
    ctx.fillRect(cx - 5, horizon - 8, 10, 1);
    ctx.fillStyle = "#ffe080";
    ctx.fillRect(cx - 1, horizon + 2, 1, landH);
    ctx.fillStyle = "#ff3010";
    ctx.fillRect(cx, horizon + 2, 1, landH);
    ctx.fillStyle = "#6a1008";
    ctx.fillRect(cx + 1, horizon + 2, 1, landH);
    ctx.fillStyle = "#18080a";
    ctx.fillRect(cx - 2, horizon - 12, 2, 2);
    ctx.fillRect(cx + 1, horizon - 14, 2, 2);
    ctx.fillStyle = "#ff6820";
    ctx.fillRect(cx, horizon + 6, 1, 1);
    ctx.fillRect(cx - 3, horizon + 5, 1, 1);
    ctx.fillStyle = "#ffd060";
    ctx.fillRect(cx + 2, horizon + 8, 1, 1);
    ctx.fillRect(cx - 4, horizon + 10, 1, 1);
  }
  ctx.fillStyle = east || home ? "#fffef8" : "#ffd0a0";
  ctx.fillRect(cx - rx + 4, horizon + 3, 2, 1);
  ctx.fillRect(cx + 4, horizon + 5, 3, 1);
  ctx.restore();
}

function paintHomeMouth(ctx: CanvasRenderingContext2D, cx: number, rx: number, top: number, bot: number): void {
  const height = Math.max(1, bot - top);
  const sky = ["#1a4a90", "#3a78c8", "#7ec4f0", "#d8f2ff"];
  const horizon = top + Math.round(height * 0.58);
  for (let py = top; py < horizon; py++) {
    const u = (py - top) / height;
    for (let px = cx - rx - 2; px <= cx + rx + 2; px++) {
      ctx.fillStyle = dither(sky, u * 1.3, px, py);
      ctx.fillRect(px, py, 1, 1);
    }
  }
  ctx.fillStyle = "#fffef8";
  ctx.fillRect(cx - rx + 2, top + 5, 5, 2);
  ctx.fillRect(cx - rx + 3, top + 4, 3, 1);
  const sy = top + Math.round(height * 0.22);
  diskRamp(ctx, cx + 4, sy, 4, ["#fffef4", "#ffe98a", "#f0c050", "#d09030"]);
  const land = ["#e8f0a0", "#8fbe52", "#3f8a38", "#2a6a30"];
  const landH = Math.max(1, bot - horizon);
  for (let py = horizon; py < bot; py++) {
    const u = (py - horizon) / landH;
    for (let px = cx - rx - 2; px <= cx + rx + 2; px++) {
      ctx.fillStyle = dither(land, u, px, py);
      ctx.fillRect(px, py, 1, 1);
    }
  }
  ctx.fillStyle = "#f4e2a0";
  ctx.fillRect(cx - rx, horizon, rx * 2 + 1, 1);
  ctx.fillStyle = "#6a3018";
  ctx.fillRect(cx - 6, horizon - 8, 8, 2);
  ctx.fillStyle = "#c07848";
  ctx.fillRect(cx - 5, horizon - 6, 6, 6);
  ctx.fillStyle = "#e8d0b0";
  ctx.fillRect(cx - 5, horizon - 6, 4, 1);
  ctx.fillStyle = "#6eb0e0";
  ctx.fillRect(cx - 3, horizon - 4, 2, 2);
  ctx.fillStyle = "#2f6a28";
  ctx.fillRect(cx + 4, horizon - 5, 4, 3);
  ctx.fillStyle = "#1a4018";
  ctx.fillRect(cx + 7, horizon - 4, 1, 3);
  ctx.fillStyle = "#6b4428";
  ctx.fillRect(cx + 5, horizon - 2, 1, 2);
  ctx.fillStyle = "#c8a868";
  ctx.fillRect(cx - 1, horizon + 2, 1, landH);
  ctx.fillStyle = "#f0e0b0";
  ctx.fillRect(cx, horizon + 2, 2, landH);
  ctx.fillStyle = "#fffef8";
  ctx.fillRect(cx - rx + 3, top + 8, 4, 1);
  ctx.fillRect(cx + 2, horizon + 4, 3, 1);
  ctx.fillStyle = "#6eb0e0";
  ctx.fillRect(cx - 2, horizon + 3, 1, 1);
}

/** The arch stays. The sidewalk's curb turns up into the posts, and the pavement runs through the opening. */
function seatArchInSidewalk(ctx: CanvasRenderingContext2D, x: number, dw: number, east: boolean, foot = PORTAL_BASE): void {
  const left = x + Math.round(dw * 0.22);
  const right = x + dw - Math.round(dw * 0.22);
  const stone = east ? "#c4a060" : "#3a2820";
  const deep = east ? "#6a4010" : "#140c0c";
  const lit = east ? "#ffe0a0" : "#6a4030";
  ctx.fillStyle = deep;
  ctx.fillRect(left, foot - 1, right - left, 1);
  ctx.fillStyle = stone;
  ctx.fillRect(x, foot - 8, 4, 8);
  ctx.fillRect(x + dw - 4, foot - 8, 4, 8);
  ctx.fillStyle = lit;
  ctx.fillRect(x, foot - 8, 4, 1);
  ctx.fillRect(x + dw - 4, foot - 8, 4, 1);
  ctx.fillStyle = deep;
  ctx.fillRect(x + 3, foot - 7, 1, 6);
  ctx.fillRect(x + dw - 1, foot - 7, 1, 6);
  for (let px = left + 2; px < right; px += 8) {
    ctx.fillStyle = Math.floor(px / 4) % 2 === 0 ? (east ? "#e2b657" : "#5a3018") : east ? "#3a5280" : "#2a1814";
    ctx.fillRect(px, foot + 1, 1, 1);
  }
}

function drawFarmFrame(ctx: CanvasRenderingContext2D, _clock: number): void {
  const bot = 191;
  const gilt = "#e2b657";
  const deep = "#785018";
  const ink = "#120e0c";
  const black = "#1c1814";
  const ivory = "#fff8e8";
  const bands = [ink, deep, black, gilt, black, gilt, ink];
  const pix = (x: number, y: number, color: string) => {
    if (y < 0 || y > bot || x < 0 || x >= WORLD_W) return;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  };
  for (let y = 0; y <= bot; y++) {
    const yBand = Math.min(y, bot - y);
    const reach = 7;
    for (let x = 0; x < reach; x++) {
      const band = Math.min(x, yBand);
      const color = bands[band] ?? ink;
      pix(x, y, color);
      pix(WORLD_W - 1 - x, y, color);
    }
    if (yBand < bands.length) {
      for (let x = reach; x < WORLD_W - reach; x++) pix(x, y, bands[yBand] ?? ink);
    }
  }
  const jade = "#1f6a48";
  const chevron = (x: number, y: number, ix: number, iy: number) => {
    pix(x, y, ivory);
    pix(x - iy, y - ix, gilt);
    pix(x + iy, y + ix, gilt);
    pix(x + ix, y + iy, deep);
    pix(x + ix * 2, y + iy * 2, jade);
  };
  for (let x = 18; x < WORLD_W - 18; x += 6) {
    chevron(x, 3, 0, 1);
    chevron(x, bot - 3, 0, -1);
    if (x % 12 === 0) {
      pix(x, 4, jade);
      pix(x, bot - 4, jade);
    }
  }
  for (let y = 18; y <= bot - 18; y += 6) {
    chevron(3, y, 1, 0);
    chevron(WORLD_W - 4, y, -1, 0);
    if (y % 12 === 0) {
      pix(4, y, jade);
      pix(WORLD_W - 5, y, jade);
    }
  }
  const mid = Math.floor(WORLD_W / 2);
  for (let i = -3; i <= 3; i++) {
    pix(mid + i, 3, i === 0 ? ivory : gilt);
    pix(mid + i, bot - 3, i === 0 ? ivory : gilt);
    pix(3, Math.floor(bot / 2) + i, i === 0 ? ivory : gilt);
    pix(WORLD_W - 4, Math.floor(bot / 2) + i, i === 0 ? ivory : gilt);
  }
  for (let x = 8; x < WORLD_W - 8; x++) {
    if (x % 2 === 0) {
      pix(x, 3, deep);
      pix(x, 5, deep);
      pix(x, bot - 3, deep);
      pix(x, bot - 5, deep);
    } else if (x % 4 === 1) {
      pix(x, 5, ivory);
      pix(x, bot - 5, ivory);
    }
  }
  for (let y = 8; y <= bot - 8; y++) {
    if (y % 2 === 0) {
      pix(3, y, deep);
      pix(5, y, deep);
      pix(WORLD_W - 4, y, deep);
      pix(WORLD_W - 6, y, deep);
    } else if (y % 4 === 1) {
      pix(5, y, ivory);
      pix(WORLD_W - 6, y, ivory);
    }
  }
  const curl = (x: number, y: number, ix: number, iy: number) => {
    pix(x, y, gilt);
    pix(x + ix, y + iy, gilt);
    pix(x + ix * 2, y + iy, ivory);
    pix(x + ix * 2, y + iy * 2, gilt);
    pix(x + ix, y + iy * 2, deep);
    pix(x, y + iy * 2, gilt);
    pix(x - ix, y + iy, deep);
    pix(x + ix * 3, y + iy, gilt);
  };
  for (let x = 22; x < WORLD_W - 22; x += 12) {
    curl(x, 7, 1, 1);
    curl(x, bot - 7, 1, -1);
  }
  for (let y = 22; y <= bot - 22; y += 12) {
    curl(7, y, 1, 1);
    curl(WORLD_W - 8, y, -1, 1);
  }
  const bead = (x: number, y: number) => {
    pix(x, y, ivory);
    pix(x - 1, y, deep);
    pix(x + 1, y, deep);
    pix(x, y - 1, gilt);
    pix(x, y + 1, gilt);
  };
  for (let x = 28; x < WORLD_W - 28; x += 12) {
    bead(x, 6);
    bead(x, bot - 6);
    pix(x, 9, gilt);
    pix(x - 1, 10, deep);
    pix(x + 1, 10, deep);
    pix(x, bot - 9, gilt);
    pix(x - 1, bot - 10, deep);
    pix(x + 1, bot - 10, deep);
  }
  for (let y = 28; y <= bot - 28; y += 12) {
    bead(6, y);
    bead(WORLD_W - 7, y);
    pix(9, y, gilt);
    pix(10, y - 1, deep);
    pix(10, y + 1, deep);
    pix(WORLD_W - 10, y, gilt);
    pix(WORLD_W - 11, y - 1, deep);
    pix(WORLD_W - 11, y + 1, deep);
  }
  for (let x = 12; x < WORLD_W - 12; x += 3) {
    pix(x, 8, x % 6 === 0 ? ivory : gilt);
    pix(x, bot - 8, x % 6 === 0 ? ivory : gilt);
  }
  for (let y = 12; y <= bot - 12; y += 3) {
    pix(8, y, y % 6 === 0 ? ivory : gilt);
    pix(WORLD_W - 9, y, y % 6 === 0 ? ivory : gilt);
  }
  const fan = (cx: number, cy: number, sx: number, sy: number) => {
    for (let s = 4; s >= 0; s--) {
      pix(cx - sx * s, cy, s === 0 ? ivory : gilt);
      pix(cx, cy - sy * s, s === 0 ? ivory : gilt);
      pix(cx - sx * s, cy - sy * s, deep);
    }
    for (let i = 1; i <= 7; i++) {
      pix(cx + sx * i, cy, i % 2 === 0 ? ivory : gilt);
      pix(cx, cy + sy * i, i % 2 === 0 ? ivory : gilt);
      pix(cx + sx * i, cy + sy * i, i % 2 === 0 ? ivory : gilt);
      pix(cx + sx * i, cy + sy * Math.max(1, i - 2), jade);
      pix(cx + sx * Math.max(1, i - 2), cy + sy * i, jade);
    }
    pix(cx, cy, ivory);
    pix(cx + sx, cy + sy, gilt);
    pix(cx + sx * 2, cy + sy, ivory);
    pix(cx + sx, cy + sy * 2, ivory);
    pix(cx + sx * 3, cy + sy * 2, jade);
    pix(cx + sx * 2, cy + sy * 3, jade);
  };
  fan(6, 6, 1, 1);
  fan(WORLD_W - 7, 6, -1, 1);
  fan(6, bot - 6, 1, -1);
  fan(WORLD_W - 7, bot - 6, -1, -1);
}

function onFarmFrame(y: number): boolean {
  return y < 250;
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
  if ((s.wing ?? 0) === 1) {
    return Math.abs(s.x - HEAVEN_GATE.x) < 40 && s.y > HEAVEN_GATE.y - 48 && s.y < HEAVEN_GATE.y + 18;
  }
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

function ditherRgb(
  colors: readonly (readonly [number, number, number])[],
  u: number,
  x: number,
  y: number,
): readonly [number, number, number] {
  const last = colors.length - 1;
  const f = Math.max(0, Math.min(0.999, u)) * last;
  const i = Math.floor(f);
  if (i >= last) return colors[last]!;
  const bayer = (x & 1) + ((y & 1) << 1);
  const gate = [0.2, 0.6, 0.8, 0.4][bayer]!;
  return f - i > gate ? colors[i + 1]! : colors[i]!;
}

function shade(
  rgb: readonly [number, number, number],
  x: number,
  y: number,
  amp: number,
): readonly [number, number, number] {
  const block = ((noise(x >> 2, y >> 2) & 7) - 3) * amp;
  const fine = (noise(x, y) & 3) - 1;
  return [rgb[0] + block + fine, rgb[1] + block + fine, rgb[2] + block + fine];
}

function putPix(d: Uint8ClampedArray, w: number, x: number, y: number, rgb: readonly [number, number, number], a = 255): void {
  const i = (y * w + x) * 4;
  d[i] = Math.max(0, Math.min(255, rgb[0]));
  d[i + 1] = Math.max(0, Math.min(255, rgb[1]));
  d[i + 2] = Math.max(0, Math.min(255, rgb[2]));
  d[i + 3] = a;
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
  const midX = WORLD_W * 0.5;
  for (let y = 0; y < h; y++) {
    const u = y / h;
    const lift = Math.sin(u * Math.PI);
    for (let x = 0; x < WORLD_W; x++) {
      const edge = Math.abs(x - midX) / midX;
      const dim = edge * edge * 8;
      putPix(d, WORLD_W, x, y, [4 + lift * 6 - dim, 6 + lift * 8 - dim, 16 + lift * 22 - dim]);
    }
  }
  g.putImageData(img, 0, 0);
  for (let y = 100; y < h - 12; y++) {
    const cx = Math.round(48 + (y - 100) * 0.5 + Math.sin(y * 0.035) * 10);
    const half = 3 + ((y >> 4) % 3);
    g.fillStyle = y % 2 === 0 ? "#121a40" : "#1c2a58";
    g.fillRect(cx - half, y, half * 2, 1);
    if (y % 6 === 0) {
      g.fillStyle = "#8aa0d8";
      g.fillRect(cx, y, 1, 1);
    }
  }
  fillOval(g, 72, 168, 34, 18, "#140828");
  fillOval(g, 72, 166, 22, 11, "#3a1868");
  fillOval(g, 76, 162, 12, 6, "#7a38a8");
  fillOval(g, 80, 158, 4, 2, "#f0c8ff");
  fillOval(g, 274, 300, 32, 16, "#1a0c0c");
  fillOval(g, 274, 298, 18, 9, "#6a2818");
  fillOval(g, 278, 294, 8, 4, "#e08040");
  fillOval(g, 278, 292, 3, 2, "#ffe0a0");
  fillOval(g, 160, 360, 20, 8, "#0c2030");
  fillOval(g, 160, 358, 10, 4, "#1a5870");
  fillOval(g, 164, 356, 3, 2, "#b8e8f0");
  for (let i = 0; i < 110; i++) {
    const x = (i * 53 + 7) % WORLD_W;
    const y = 84 + ((i * 37) % (h - 96));
    g.fillStyle = i % 3 === 0 ? "#3a4466" : i % 7 === 0 ? "#fff6d0" : "#c8d4ee";
    g.fillRect(x, y, 1, 1);
  }
  voidPlate = canvas;
  return canvas;
}

function vimanaSeat(x: number): { top: number; bottom: number } | null {
  const left = 105;
  const slot = 24;
  const i = Math.floor((x - left) / slot);
  if (i < 0 || i > 5) return null;
  const sx = left + i * slot;
  if (x < sx || x >= sx + 18) return null;
  const along = 1 - Math.abs(i - 2.5) / 2.5;
  const top = 18 + Math.round(along * along * 20);
  return { top, bottom: top + 22 };
}

const CONDUITS = [52, 100, 148, 172, 204, 252, 300];

function vimanaSpan(x: number): number {
  const t = x / (WORLD_W - 1);
  return Math.max(0, 1 - Math.abs(t - 0.5) * 2);
}

function vimanaBot(x: number): number {
  return 6 + Math.round(vimanaSpan(x) * 76);
}

function conduitX(feed: number, drop: number): number {
  const mid = (WORLD_W - 1) * 0.5;
  const lean = (feed - mid) / mid;
  return feed - lean * drop * drop * 18;
}

function ensureRock(): HTMLCanvasElement | null {
  if (rockPlate) return rockPlate;
  if (typeof document === "undefined") return null;
  const h = 96;
  const canvas = document.createElement("canvas");
  canvas.width = WORLD_W;
  canvas.height = h;
  const g = canvas.getContext("2d");
  if (!g) return null;
  const img = g.createImageData(WORLD_W, h);
  const d = img.data;
  for (let x = 0; x < WORLD_W; x++) {
    const t = x / (WORLD_W - 1);
    const dome = vimanaSpan(x);
    const bot = Math.min(h - 1, vimanaBot(x));
    const keel = 1 - Math.abs(t - 0.5) * 2;
    for (let y = 0; y < bot; y++) {
      const u = y / Math.max(1, bot - 1);
      const n = noise(x, y);
      const spec = (n & 5) - 2;
      const lx = x & 7;
      const ly = y & 3;
      const light = ((x >> 3) + (y >> 2)) % 2 === 0;
      let rgb: readonly [number, number, number];
      if (y === 0) {
        rgb = [232, 196, 110];
        for (const feed of [52, 100, 148, 172, 204, 252, 300]) {
          const dx = x - feed;
          if (Math.abs(dx) > 3) continue;
          if (dx === 0) rgb = [214, 240, 255];
          else if (Math.abs(dx) === 1) rgb = [36, 48, 72];
          else if (Math.abs(dx) === 2) rgb = [236, 196, 96];
          else rgb = [236, 228, 250];
          break;
        }
      } else if (u < 0.5) {
        const drop = u / 0.5;
        const sun = 1 - drop * drop * 0.62;
        const cool = drop * 16;
        const tile = (c: readonly [number, number, number]) =>
          [c[0] * sun, c[1] * sun * (1 - drop * 0.08), c[2] * sun + cool] as const;
        if (lx === 0 || ly === 0) rgb = tile([28, 18, 14]);
        else if (light) {
          rgb = tile(ly === 1 ? [255, 238, 204] : ly === 3 ? [132, 96, 58] : [224, 190, 132]);
          if (lx === 3 && ly === 2 && drop < 0.5) rgb = tile([255, 214, 120]);
        } else {
          rgb = tile(ly === 1 ? [58, 52, 74] : ly === 3 ? [8, 6, 12] : [26, 22, 34]);
          if (lx === 4 && ly === 2 && n % 3 === 0) rgb = tile([72, 96, 150]);
        }
        for (const feed of CONDUITS) {
          const dx = Math.round(x - conduitX(feed, drop));
          if (Math.abs(dx) > 3) continue;
          if (dx === 0) rgb = tile(ly === 1 ? [214, 240, 255] : [108, 156, 186]);
          else if (Math.abs(dx) === 1) rgb = tile([36, 48, 72]);
          else if (Math.abs(dx) === 2) rgb = tile(ly === 1 ? [236, 196, 96] : [132, 88, 36]);
          else rgb = tile(ly === 1 ? [236, 228, 250] : [168, 156, 198]);
          break;
        }
      } else {
        const depth = (u - 0.5) / 0.5;
        const round = 0.58 + dome * 0.42;
        const row = y >> 2;
        const seam = lx === 0 || ly === 0;
        const gem = lx >= 3 && lx <= 4 && ly >= 1 && ly <= 2 && ((x >> 3) + row) % 5 === 2;
        const kind = ((x >> 3) + row) % 3;
        let r: number;
        let gch: number;
        let b: number;
        if (depth < 0.06) {
          r = 14;
          gch = 10;
          b = 20;
        } else if (gem) {
          if (kind === 0) {
            r = 196;
            gch = 42;
            b = 72;
          } else if (kind === 1) {
            r = 46;
            gch = 112;
            b = 204;
          } else {
            r = 36;
            gch = 176;
            b = 104;
          }
          if (lx === 3 && ly === 1) {
            r = 255;
            gch = 244;
            b = 220;
          }
        } else if (seam) {
          r = ly === 0 ? 112 : 176;
          gch = ly === 0 ? 78 : 132;
          b = ly === 0 ? 34 : 58;
        } else if (ly === 1) {
          r = 72;
          gch = 56;
          b = 96;
        } else if (ly === 3) {
          r = 18;
          gch = 14;
          b = 32;
        } else {
          r = 40 + spec;
          gch = 30 + spec;
          b = 64;
          if (lx === 6 && ly === 2) {
            r = 210;
            gch = 168;
            b = 78;
          }
        }
        if (keel > 0.92 && Math.abs(x - (WORLD_W >> 1)) <= 1 && !gem) {
          r = ly === 1 ? 248 : 188;
          gch = ly === 1 ? 220 : 146;
          b = 92;
        }
        const plane = t < 0.5 ? 1.14 : 0.72;
        const lift = (0.78 + depth * 0.16) * round * plane;
        rgb = [r * lift, gch * lift, b * lift];
      }
      if (y === 6) rgb = [rgb[0] * 0.42, rgb[1] * 0.38, rgb[2] * 0.5];
      if (dome > 0.94 && y > bot - 5 && y < bot - 1) rgb = t < 0.5 ? [228, 190, 104] : [132, 92, 42];
      if (y === bot - 1) rgb = [4, 4, 10];
      else if (y === bot - 2 && dome > 0.04) rgb = t < 0.5 ? [220, 176, 86] : [86, 60, 30];
      if (y > 0 && y < 6) {
        const shade = 0.68 + (y / 6) * 0.32;
        rgb = [rgb[0] * shade, rgb[1] * shade, rgb[2] * shade];
      }
      putPix(d, WORLD_W, x, y, rgb);
    }
  }
  g.putImageData(img, 0, 0);
  rockPlate = canvas;
  return canvas;
}

function drawSpace(ctx: CanvasRenderingContext2D, clock: number, space?: HTMLImageElement): void {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#010106";
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  if (space && space.naturalWidth > 0) {
    ctx.drawImage(space, 0, FARM_H, WORLD_W, WORLD_H - FARM_H);
  } else {
    const nebula = ensureVoid();
    if (nebula) ctx.drawImage(nebula, 0, FARM_H);
  }
  for (let i = 0; i < 10; i++) {
    const fall = 1 - i / 10;
    ctx.fillStyle = `rgba(1, 1, 6, ${0.42 * fall * fall})`;
    ctx.fillRect(0, FARM_H + i * 8, WORLD_W, 8);
  }
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  fillOval(ctx, 64, FARM_H + 168, 46, 16, "rgba(72, 28, 96, 0.22)");
  fillOval(ctx, 250, FARM_H + 210, 40, 14, "rgba(28, 48, 96, 0.2)");
  fillOval(ctx, 170, FARM_H + 280, 28, 10, "rgba(96, 36, 48, 0.16)");
  ctx.restore();
  const skyTop = FARM_H + 100;
  const skyH = Math.max(8, WORLD_H - skyTop - 6);
  for (let i = 0; i < 72; i++) {
    const x = (i * 47 + 13) % WORLD_W;
    const y = skyTop + ((i * 29) % skyH);
    const pulse = Math.sin(clock * (2.4 + (i % 5) * 0.35) + i * 0.7);
    const dim = i % 6 === 0 ? "#b8a8d0" : i % 4 === 0 ? "#9eb6c8" : "#8a94a4";
    ctx.fillStyle = pulse > 0.82 ? "#fffaf0" : pulse > 0.15 ? dim : "#3a4250";
    ctx.fillRect(x, y, 1, 1);
    if (pulse > 0.45) {
      ctx.fillStyle = i % 3 === 0 ? "#d8c8a0" : "#9ec4e8";
      ctx.fillRect(x - 1, y, 1, 1);
      ctx.fillRect(x + 1, y, 1, 1);
      ctx.fillRect(x, y - 1, 1, 1);
      ctx.fillRect(x, y + 1, 1, 1);
    }
    if (pulse > 0.88) {
      ctx.fillStyle = "#fffaf0";
      ctx.fillRect(x - 2, y, 1, 1);
      ctx.fillRect(x + 2, y, 1, 1);
    }
  }
  const comet = (clock * 12) % (WORLD_W + 36);
  const bow = Math.sin(clock * 0.35) * 4;
  ctx.fillStyle = "#2a2038";
  ctx.fillRect(comet - 12, skyTop + 36 + bow, 7, 1);
  ctx.fillStyle = "#d8d0e4";
  ctx.fillRect(comet - 3, skyTop + 36 + bow, 2, 1);
  ctx.fillStyle = "#f4f0e8";
  ctx.fillRect(comet, skyTop + 35 + bow, 1, 1);
}

function paintCrescent(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r) continue;
      const bx = x - r * 0.45;
      const by = y - r * 0.08;
      if (bx * bx + by * by < (r * 0.78) * (r * 0.78)) continue;
      ctx.fillStyle = x < 0 ? "#d5deef" : "#f7f9ff";
      ctx.fillRect(cx + x, cy + y, 1, 1);
    }
  }
}

function paintRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number): void {
  for (let y = -ry - 1; y <= ry + 1; y++) {
    for (let x = -rx; x <= rx; x++) {
      const e = (x * x) / (rx * rx) + (y * y) / (ry * ry);
      if (e < 0.82 || e > 1.16) continue;
      if (x * x + y * y < 15 * 15 && y > -2) continue;
      ctx.fillStyle = Math.abs(e - 1) < 0.08 ? "#fff6d4" : "#a88858";
      ctx.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
    }
  }
}

function paintGalaxy(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  diskRamp(ctx, cx, cy, 4, ["#fff6d0", "#d0d8ff", "#5a6cb0", "#1c2858"]);
  for (let arm = 0; arm < 2; arm++) {
    for (let i = 0; i < 28; i++) {
      const a = arm * Math.PI + i * 0.28;
      const rad = 5 + i * 0.45;
      ctx.fillStyle = i % 4 === 0 ? "#fff6d0" : i % 2 === 0 ? "#9eb6ff" : "#3a5280";
      ctx.fillRect(Math.round(cx + Math.cos(a) * rad), Math.round(cy + Math.sin(a) * rad * 0.42), 1, 1);
    }
  }
}

function paintRocklet(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "#2a261f";
  ctx.fillRect(x, y, 5, 3);
  ctx.fillStyle = "#6a6054";
  ctx.fillRect(x, y, 3, 1);
  ctx.fillStyle = "#12100c";
  ctx.fillRect(x + 3, y + 2, 2, 1);
}

function paintPulsar(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.fillStyle = "#3a5280";
  ctx.fillRect(cx - 10, cy, 7, 1);
  ctx.fillRect(cx + 3, cy, 7, 1);
  ctx.fillRect(cx, cy - 10, 1, 7);
  ctx.fillRect(cx, cy + 3, 1, 7);
  ctx.fillStyle = "#d7e4ff";
  ctx.fillRect(cx - 4, cy, 3, 1);
  ctx.fillRect(cx + 1, cy, 3, 1);
  ctx.fillRect(cx, cy - 4, 1, 3);
  ctx.fillRect(cx, cy + 1, 1, 3);
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(cx, cy, 1, 1);
}

function paintBinary(ctx: CanvasRenderingContext2D, cx: number, cy: number, clock: number): void {
  const a = clock * 0.7;
  const x1 = Math.round(cx + Math.cos(a) * 7);
  const y1 = Math.round(cy + Math.sin(a) * 3);
  const x2 = Math.round(cx - Math.cos(a) * 7);
  const y2 = Math.round(cy - Math.sin(a) * 3);
  paintOrb(ctx, x1, y1, 3, "#fff6d0", "#e2b657", "#6a4820");
  paintOrb(ctx, x2, y2, 2, "#f4fbff", "#8ab4d8", "#2a4868");
}

function paintVimana(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "#8a6428";
  ctx.fillRect(x, y + 3, 14, 1);
  ctx.fillStyle = "#e2b657";
  ctx.fillRect(x + 1, y + 2, 12, 2);
  ctx.fillStyle = "#fff6d0";
  ctx.fillRect(x + 4, y, 6, 2);
  ctx.fillStyle = "#7ec8e0";
  ctx.fillRect(x + 6, y + 1, 2, 2);
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(x - 2, y + 3, 2, 1);
  ctx.fillRect(x + 14, y + 3, 2, 1);
}

function paintOrb(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  lit: string,
  mid: string,
  shade: string,
): void {
  diskRamp(ctx, Math.round(cx), Math.round(cy), r, [lit, lit, mid, shade]);
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(Math.round(cx - r * 0.35), Math.round(cy - r * 0.4), 2, 1);
}

function drawGoatSlash(ctx: CanvasRenderingContext2D, s: GameState): void {
  const list = s.goatSlash;
  if (!list?.length || (s.wing ?? 0) !== 0) return;
  const ink = "#1a1018";
  const core = "#fff4d4";
  const gold = "#e2b44a";
  const deep = "#7a4214";
  const edge = "#4c2468";
  const dot = (x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  };
  for (const fx of list) {
    const u = Math.max(0, Math.min(1, fx.t / 0.52));
    const bloom = u > 0.72 ? (1 - u) / 0.28 : u < 0.18 ? u / 0.18 : 1;
    const cx = Math.round(fx.x);
    const cy = Math.round(fx.y) - 6;
    ctx.save();
    ctx.globalAlpha = 0.55 + bloom * 0.45;
    const rx = 7 + bloom * 8;
    const ry = 3 + bloom * 3;
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const x = Math.round(cx + Math.cos(a) * rx);
      const y = Math.round(cy + 8 + Math.sin(a) * ry);
      dot(x, y + 1, ink);
      dot(x, y, i % 3 === 0 ? core : i % 2 === 0 ? gold : deep);
    }
    for (let i = 0; i < 16; i++) {
      const t = i / 15;
      const a = -2.35 + t * 2.15;
      const rad = 8 + bloom * 7;
      const x = Math.round(cx - 2 + Math.cos(a) * rad);
      const y = Math.round(cy - 2 + Math.sin(a) * rad * 0.62);
      const thick = t > 0.15 && t < 0.82;
      dot(x + 1, y + 1, ink);
      dot(x, y + 1, deep);
      dot(x, y, t < 0.55 ? core : gold);
      if (thick) {
        dot(x - 1, y, edge);
        dot(x, y - 1, i % 2 === 0 ? core : gold);
      }
    }
    const sparks: Array<[number, number]> = [
      [-6, -8],
      [2, -11],
      [8, -6],
      [5, -2],
      [-2, -4],
    ];
    for (let i = 0; i < sparks.length; i++) {
      const [sx, sy] = sparks[i]!;
      const px = Math.round(cx + sx * bloom);
      const py = Math.round(cy + sy * bloom);
      dot(px, py + 1, ink);
      dot(px, py, i % 2 === 0 ? core : gold);
      if (i % 2 === 0) dot(px - 1, py, edge);
    }
    ctx.restore();
  }
}

function skyWash(time: number): { tone: string; alpha: number } | null {
  const hour = 6 + time * 16;
  if (hour < 8) return { tone: "255, 168, 80", alpha: ((8 - hour) / 2) * 0.22 };
  if (hour >= 17 && hour < 20) return { tone: "92, 54, 92", alpha: ((hour - 17) / 3) * 0.28 };
  if (hour >= 20) return { tone: "8, 14, 36", alpha: Math.min(0.62, 0.28 + ((hour - 20) / 2) * 0.34) };
  return null;
}

function drawVimanaTone(ctx: CanvasRenderingContext2D, time: number): void {
  const wash = skyWash(time);
  if (!wash) return;
  const top = FARM_H;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, top);
  for (let x = 0; x <= WORLD_W; x += 4) {
    ctx.lineTo(x, top + vimanaBot(x));
  }
  ctx.lineTo(WORLD_W, top);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = `rgba(${wash.tone}, ${wash.alpha})`;
  ctx.fillRect(0, top, WORLD_W, 96);
  ctx.restore();
}

function clipVimana(ctx: CanvasRenderingContext2D): void {
  const top = FARM_H;
  ctx.beginPath();
  ctx.moveTo(0, top);
  for (let x = 0; x <= WORLD_W; x += 4) {
    ctx.lineTo(x, top + vimanaBot(x));
  }
  ctx.lineTo(WORLD_W, top);
  ctx.closePath();
  ctx.clip();
}

function arcBolt(t: number): string {
  const stops: Array<[number, number, number]> = [
    [255, 70, 190],
    [255, 230, 70],
    [70, 255, 150],
    [70, 220, 255],
    [180, 90, 255],
  ];
  const h = ((t % 1) + 1) % 1;
  const f = h * stops.length;
  const i = Math.floor(f) % stops.length;
  const j = (i + 1) % stops.length;
  const u = f - Math.floor(f);
  const a = stops[i]!;
  const b = stops[j]!;
  return `${Math.round(a[0] + (b[0] - a[0]) * u)}, ${Math.round(a[1] + (b[1] - a[1]) * u)}, ${Math.round(a[2] + (b[2] - a[2]) * u)}`;
}

function oilSheen(t: number): string {
  const stops: Array<[number, number, number]> = [
    [255, 176, 214],
    [255, 228, 168],
    [150, 228, 206],
    [168, 206, 255],
    [214, 176, 255],
  ];
  const h = ((t % 1) + 1) % 1;
  const f = h * stops.length;
  const i = Math.floor(f) % stops.length;
  const j = (i + 1) % stops.length;
  const u = f - Math.floor(f);
  const a = stops[i]!;
  const b = stops[j]!;
  return `${Math.round(a[0] + (b[0] - a[0]) * u)}, ${Math.round(a[1] + (b[1] - a[1]) * u)}, ${Math.round(a[2] + (b[2] - a[2]) * u)}`;
}

function drawVimanaLight(ctx: CanvasRenderingContext2D, clock: number): void {
  const top = FARM_H;
  ctx.save();
  clipVimana(ctx);
  ctx.globalCompositeOperation = "lighter";
  const filmShift = clock * 0.02;
  for (let x = 0; x < WORLD_W; x += 8) {
    const dome = vimanaSpan(x);
    const bot = vimanaBot(x);
    const face = Math.floor(bot * 0.5);
    const h = bot - face - 2;
    if (h < 2) continue;
    const film = 0.5 + 0.5 * Math.sin(x * 0.02 + clock * 0.25);
    ctx.fillStyle = `rgba(${oilSheen(film + filmShift)}, ${(0.03 + dome * 0.04) * (0.7 + 0.3 * film)})`;
    ctx.fillRect(x, top + face + 1, 8, h);
  }
  const climb = (clock * 0.32) % 1;
  ctx.fillStyle = `rgba(${arcBolt(climb + 0.15)}, 0.4)`;
  for (const feed of CONDUITS) {
    const face = Math.floor(vimanaBot(feed) * 0.5);
    const head = face * (1 - climb);
    const y0 = Math.max(2, Math.floor(head));
    const y1 = Math.min(face, y0 + Math.floor(face * 0.42));
    for (let y = y0; y < y1; y += 3) {
      const x = Math.round(conduitX(feed, y / Math.max(1, face)));
      const trail = (y - head) / Math.max(8, face * 0.42);
      ctx.globalAlpha = Math.max(0, 1 - trail) * 0.42;
      ctx.fillRect(x, top + y, 1, 1);
    }
  }
  ctx.globalAlpha = 1;
  const breathe = 0.75 + 0.25 * Math.sin(clock * 0.7);
  const hue = clock * 0.04;
  for (let x = 0; x < WORLD_W; x += 2) {
    const dome = vimanaSpan(x);
    const bot = vimanaBot(x);
    const face = Math.max(1, Math.floor(bot * 0.5));
    const deep = 0.45 + dome * 0.2;
    const along = x / (WORLD_W - 1);
    ctx.fillStyle = `rgba(${arcBolt(along + hue)}, ${0.08 * breathe * deep})`;
    ctx.fillRect(x, top + face + 1, 2, Math.max(1, bot - face - 3));
    ctx.fillStyle = `rgba(${arcBolt(along + hue)}, ${0.32 * breathe * deep})`;
    ctx.fillRect(x, top + bot - 1, 2, 1);
    ctx.fillStyle = `rgba(${arcBolt(along + hue + 0.2)}, ${0.18 * breathe * deep})`;
    ctx.fillRect(x, top + face, 2, 1);
  }
  ctx.restore();
}

function drawUnderside(ctx: CanvasRenderingContext2D, _vimana?: HTMLImageElement): void {
  const rock = ensureRock();
  if (!rock) return;
  ctx.drawImage(rock, 0, FARM_H);
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
  const colors: ReadonlyArray<readonly [number, number, number]> = east
    ? [
        [12, 16, 40],
        [28, 36, 78],
        [92, 64, 88],
        [176, 120, 72],
        [232, 196, 128],
      ]
    : [
        [10, 6, 14],
        [28, 10, 18],
        [72, 18, 20],
        [120, 36, 24],
        [168, 64, 36],
      ];
  for (let y = 0; y < h; y++) {
    const u = y / h;
    for (let x = 0; x < WORLD_W; x++) {
      let rgb = ditherRgb(colors, Math.min(0.98, u * 0.85 + (0.5 + 0.5 * Math.sin(x * 0.04)) * 0.1), x, y);
      const grit = (noise(x, y) & 3) - 1;
      rgb = [rgb[0] + grit, rgb[1] + grit, rgb[2] + grit];
      if (noise(x, y) % 240 === 0) rgb = east ? [255, 246, 220] : [196, 120, 88];
      putPix(d, WORLD_W, x, y, rgb);
    }
  }
  g.putImageData(img, 0, 0);
  if (east) eastSky = canvas;
  else westSky = canvas;
  return canvas;
}

let eastCliff: HTMLCanvasElement | null = null;
let westCliff: HTMLCanvasElement | null = null;

function ensureCliff(east: boolean): HTMLCanvasElement | null {
  const cached = east ? eastCliff : westCliff;
  if (cached) return cached;
  if (typeof document === "undefined") return null;
  const h = 52;
  const canvas = document.createElement("canvas");
  canvas.width = WORLD_W;
  canvas.height = h;
  const g = canvas.getContext("2d");
  if (!g) return null;
  const img = g.createImageData(WORLD_W, h);
  const d = img.data;
  const stone: ReadonlyArray<readonly [number, number, number]> = east
    ? [
        [243, 226, 168],
        [230, 197, 106],
        [168, 136, 72],
        [106, 78, 40],
        [58, 42, 22],
      ]
    : [
        [90, 70, 52],
        [58, 36, 28],
        [36, 24, 18],
        [18, 12, 10],
        [8, 6, 6],
      ];
  for (let x = 0; x < WORLD_W; x++) {
    const dome = Math.sin((x / (WORLD_W - 1)) * Math.PI);
    const depth = 12 + Math.round(dome ** 0.6 * 24);
    for (let y = 0; y < depth; y++) {
      let rgb = ditherRgb(stone, y / depth, x, y);
      const grit = (noise(x, y) & 3) - 1;
      rgb = [rgb[0] + grit, rgb[1] + grit, rgb[2] + grit];
      if (y % 6 === 0) rgb = [rgb[0] + 14, rgb[1] + 10, rgb[2] + 6];
      if (noise(x, y) % 23 === 0) rgb = [rgb[0] - 16, rgb[1] - 12, rgb[2] - 8];
      putPix(d, WORLD_W, x, y, rgb);
    }
    if (noise(x, 8) % 28 === 0) {
      const drop = 8 + (noise(x, 9) % 12);
      for (let y = depth; y < Math.min(h, depth + drop); y++) {
        putPix(d, WORLD_W, x, y, stone[4]!);
      }
    }
  }
  g.putImageData(img, 0, 0);
  if (east) eastCliff = canvas;
  else westCliff = canvas;
  return canvas;
}

function drawRealmCliff(ctx: CanvasRenderingContext2D, east: boolean): void {
  const cliff = ensureCliff(east);
  if (cliff) ctx.drawImage(cliff, 0, ABYSS - 2);
}

let heavenPlate: HTMLCanvasElement | null = null;
let hellPlate: HTMLCanvasElement | null = null;

function ensureHeavenLand(): HTMLCanvasElement | null {
  if (heavenPlate) return heavenPlate;
  if (typeof document === "undefined") return null;
  const h = 168;
  const canvas = document.createElement("canvas");
  canvas.width = WORLD_W;
  canvas.height = h;
  const g = canvas.getContext("2d");
  if (!g) return null;
  const img = g.createImageData(WORLD_W, h);
  const d = img.data;
  const rock: ReadonlyArray<readonly [number, number, number]> = [
    [168, 140, 96],
    [112, 86, 56],
    [72, 54, 36],
    [40, 30, 20],
  ];
  for (let x = 28; x < 320; x++) {
    const t = (x - 28) / 292;
    const dome = Math.sin(t * Math.PI);
    const top = 16 + ((noise(x, 3) % 3) - 1);
    const thick = 36 + Math.round(dome ** 0.55 * 86);
    for (let y = 0; y < thick; y++) {
      const py = top + y;
      if (py >= h) break;
      const field = y < thick - 28;
      let rgb: readonly [number, number, number];
      if (!field) {
        const u = (y - (thick - 28)) / 28;
        rgb = rock[Math.min(3, Math.floor(u * 4))]!;
        if (y % 7 === 0) rgb = [rgb[0] + 18, rgb[1] + 14, rgb[2] + 8];
      } else if (Math.abs(x - 174) < 4) {
        rgb = [214, 186, 112];
      } else if (Math.abs(x - (96 + Math.round(Math.sin(y * 0.18) * 6))) < 3 && y > 10) {
        rgb = y % 2 === 0 ? [120, 196, 214] : [42, 120, 168];
      } else {
        const furrow = y % 5 === 2;
        const rgbRow = furrow ? [186, 214, 72] : y % 5 === 0 ? [42, 96, 34] : [78, 140, 48];
        rgb = [rgbRow[0], rgbRow[1], rgbRow[2]];
      }
      const grit = (noise(x, py) & 3) - 1;
      putPix(d, WORLD_W, x, py, [rgb[0] + grit, rgb[1] + grit, rgb[2] + grit]);
      if (field && y === 0) putPix(d, WORLD_W, x, py, [232, 240, 150]);
      if (y === thick - 1) putPix(d, WORLD_W, x, py, [22, 16, 10]);
    }
  }
  g.putImageData(img, 0, 0);
  const house = (x: number, y: number, w: number) => {
    g.fillStyle = "#8a4030";
    g.fillRect(x - 1, y + 3, w + 2, 2);
    g.fillRect(x + 2, y + 1, w - 4, 2);
    g.fillRect(x + 4, y, w - 8, 2);
    g.fillStyle = "#2a1c10";
    g.fillRect(x, y + 5, w, 1);
    g.fillRect(x, y + 12, w, 1);
    g.fillStyle = "#f0d8a0";
    g.fillRect(x + 1, y + 6, w - 2, 6);
    g.fillStyle = "#c8a060";
    g.fillRect(x + w - 2, y + 6, 1, 6);
    g.fillStyle = "#fff6d0";
    g.fillRect(x + 1, y + 6, w - 3, 1);
    g.fillStyle = "#2a1c10";
    g.fillRect(x + Math.floor(w / 2) - 1, y + 8, 3, 5);
    g.fillStyle = "#7ec8e0";
    g.fillRect(x + 2, y + 7, 3, 3);
    g.fillStyle = "#8a4030";
    g.fillRect(x + w - 5, y + 2, 2, 3);
  };
  house(132, 28, 16);
  house(188, 34, 18);
  house(214, 26, 12);
  const tree = (x: number, y: number) => {
    g.fillStyle = "#5a3820";
    g.fillRect(x + 3, y + 6, 2, 6);
    g.fillStyle = "#246028";
    g.fillRect(x, y + 2, 8, 6);
    g.fillStyle = "#62a84a";
    g.fillRect(x + 1, y, 6, 4);
    g.fillStyle = "#d8f090";
    g.fillRect(x + 2, y + 1, 2, 1);
  };
  for (const [x, y] of [
    [58, 30],
    [78, 40],
    [248, 32],
    [270, 42],
    [118, 46],
    [236, 48],
  ] as const) {
    tree(x, y);
  }
  g.fillStyle = "#2a78a8";
  g.fillRect(64, 48, 18, 8);
  g.fillStyle = "#8ad4e8";
  g.fillRect(66, 49, 10, 2);
  g.fillStyle = "#e8f8ff";
  g.fillRect(70, 50, 2, 1);
  g.fillStyle = "#3a6a28";
  g.fillRect(62, 50, 1, 3);
  g.fillRect(82, 49, 1, 4);
  g.fillStyle = "#6b4428";
  for (let i = 0; i < 7; i++) {
    g.fillRect(169, 40 + i * 6, 1, 4);
    g.fillRect(178, 40 + i * 6, 1, 4);
  }
  g.fillStyle = "#e2b657";
  g.fillRect(169, 42, 9, 1);
  g.fillRect(169, 54, 9, 1);
  g.fillRect(169, 66, 9, 1);
  g.fillStyle = "#8a8078";
  g.fillRect(152, 56, 8, 6);
  g.fillStyle = "#2a78a8";
  g.fillRect(154, 58, 4, 3);
  g.fillStyle = "#5a3820";
  g.fillRect(154, 52, 1, 6);
  g.fillRect(159, 52, 1, 6);
  g.fillStyle = "#c49458";
  g.fillRect(153, 52, 7, 1);
  g.fillStyle = "#6b4428";
  g.fillRect(88, 42, 16, 3);
  g.fillStyle = "#e2b657";
  g.fillRect(88, 42, 16, 1);
  g.fillStyle = "#e6c84a";
  for (let x = 104; x < 126; x += 2) {
    g.fillRect(x, 38, 1, 2);
    g.fillRect(x, 42, 1, 2);
  }
  for (const [x, y] of [
    [96, 34],
    [148, 46],
    [204, 52],
    [242, 36],
  ] as const) {
    g.fillStyle = "#f07090";
    g.fillRect(x, y, 2, 2);
    g.fillStyle = "#fff0c0";
    g.fillRect(x, y, 1, 1);
  }
  fillOval(g, 174, 132, 96, 7, "rgba(0,0,0,0.28)");
  g.fillStyle = "#e8c878";
  g.fillRect(196, 22, 14, 2);
  g.fillRect(198, 20, 10, 2);
  g.fillRect(200, 18, 6, 2);
  g.fillStyle = "#fff6d0";
  g.fillRect(196, 22, 14, 1);
  g.fillStyle = "#f4e2a8";
  g.fillRect(201, 24, 4, 6);
  g.fillStyle = "#7ec8c8";
  g.fillRect(202, 26, 2, 2);
  g.fillStyle = "#f7fbff";
  for (const [x, y] of [
    [40, 18],
    [300, 14],
    [24, 40],
  ] as const) {
    g.fillRect(x, y, 10, 3);
    g.fillRect(x + 3, y - 2, 8, 3);
    g.fillRect(x + 6, y + 2, 6, 2);
  }
  heavenPlate = canvas;
  return canvas;
}

function ensureHellLand(): HTMLCanvasElement | null {
  if (hellPlate) return hellPlate;
  if (typeof document === "undefined") return null;
  const h = 168;
  const canvas = document.createElement("canvas");
  canvas.width = WORLD_W;
  canvas.height = h;
  const g = canvas.getContext("2d");
  if (!g) return null;
  const img = g.createImageData(WORLD_W, h);
  const d = img.data;
  for (let x = 36; x < 312; x++) {
    const t = (x - 36) / 276;
    const dome = Math.sin(t * Math.PI);
    const top = 18 + (noise(x, 5) % 4);
    const thick = 34 + Math.round(dome ** 0.6 * 80);
    for (let y = 0; y < thick; y++) {
      const py = top + y;
      if (py >= h) break;
      const vein = 174 + Math.round(Math.sin(y * 0.16) * 12);
      const inLava = Math.abs(x - vein) < 5 && y > 8 && y < thick - 26;
      const core = inLava && Math.abs(x - vein) < 2;
      const crust = !inLava && y < thick - 26;
      let rgb: readonly [number, number, number] = crust ? (y < 5 ? [90, 48, 36] : [42, 26, 20]) : [28, 16, 12];
      if (inLava) {
        const bank = Math.abs(x - vein) >= 4;
        rgb = core ? [255, 236, 140] : bank ? [90, 24, 12] : [220, 72, 16];
      }
      if (!inLava && y >= thick - 26) {
        const u = (y - (thick - 26)) / 26;
        rgb = u < 0.35 ? [58, 32, 24] : u < 0.7 ? [28, 16, 12] : [12, 8, 6];
        if (y % 6 === 0) rgb = [rgb[0] + 16, rgb[1] + 8, rgb[2] + 4];
      }
      if (crust && noise(x, py) % 17 === 0) rgb = [10, 6, 6];
      putPix(d, WORLD_W, x, py, rgb);
      if (y === thick - 1) putPix(d, WORLD_W, x, py, [6, 4, 4]);
    }
  }
  g.putImageData(img, 0, 0);
  g.fillStyle = "#1a100c";
  g.fillRect(120, 26, 4, 22);
  g.fillRect(210, 26, 4, 22);
  g.fillStyle = "#c8a050";
  g.fillRect(118, 24, 98, 3);
  g.fillStyle = "#f0d890";
  g.fillRect(118, 24, 98, 1);
  g.fillStyle = "#3a1810";
  g.fillRect(156, 22, 8, 4);
  g.fillStyle = "#e8d8c0";
  g.fillRect(70, 40, 8, 6);
  g.fillRect(72, 38, 4, 2);
  g.fillStyle = "#2a1814";
  g.fillRect(73, 41, 2, 2);
  g.fillStyle = "#1a100c";
  g.fillRect(92, 34, 3, 18);
  g.fillRect(236, 38, 3, 16);
  g.fillRect(94, 32, 12, 2);
  g.fillStyle = "#4a2820";
  for (let i = 0; i < 5; i++) g.fillRect(148, 46 + i * 3, 8 + i * 2, 2);
  for (const x of [78, 104, 248, 270]) {
    g.fillStyle = "#120c0a";
    g.fillRect(x, 28, 2, 10);
    g.fillRect(x - 1, 32, 4, 2);
  }
  g.fillStyle = "#e8d8c0";
  g.fillRect(248, 48, 8, 3);
  g.fillRect(249, 46, 2, 2);
  g.fillRect(253, 46, 2, 2);
  g.fillStyle = "#3a1810";
  g.fillRect(158, 44, 4, 2);
  g.fillRect(188, 54, 5, 2);
  g.fillRect(170, 64, 4, 2);
  g.fillStyle = "#ffd060";
  g.fillRect(174, 40, 1, 1);
  g.fillRect(176, 52, 1, 1);
  g.fillRect(172, 62, 1, 1);
  fillOval(g, 174, 136, 90, 7, "rgba(0,0,0,0.4)");
  g.fillStyle = "#2a1814";
  g.fillRect(140, 30, 6, 3);
  g.fillRect(196, 30, 6, 3);
  g.fillStyle = "#6a1008";
  g.fillRect(146, 33, 1, 8);
  g.fillRect(200, 33, 1, 8);
  g.fillStyle = "#ff7820";
  g.fillRect(146, 40, 1, 2);
  g.fillRect(200, 40, 1, 2);
  g.fillStyle = "#120c0a";
  g.fillRect(108, 48, 18, 3);
  g.fillRect(200, 52, 16, 3);
  g.fillStyle = "#4a2820";
  g.fillRect(108, 46, 18, 1);
  g.fillRect(200, 50, 16, 1);
  hellPlate = canvas;
  return canvas;
}

function drawHeavenBelow(ctx: CanvasRenderingContext2D, clock: number, sheet?: HTMLImageElement): void {
  ctx.imageSmoothingEnabled = false;
  if (sheet && sheet.naturalWidth > 0) {
    const y = ABYSS + 16;
    const h = hSky() - 16;
    ctx.drawImage(sheet, 0, y, WORLD_W, h);
    return;
  }
  const plate = ensureHeavenLand();
  if (plate) ctx.drawImage(plate, 0, ABYSS + 48);
}

function drawEvilBelow(ctx: CanvasRenderingContext2D, _clock: number, sheet?: HTMLImageElement): void {
  ctx.imageSmoothingEnabled = false;
  if (sheet && sheet.naturalWidth > 0) {
    ctx.drawImage(sheet, 0, ABYSS + 16, WORLD_W, hSky() - 16);
    return;
  }
  const plate = ensureHellLand();
  if (plate) ctx.drawImage(plate, 0, ABYSS + 56);
}

function drawRealmBelow(ctx: CanvasRenderingContext2D, wing: -1 | 1, clock: number, sheets: Sheets): void {
  const east = wing === 1;
  drawRealmAbyss(ctx, east, clock);
  if (east) drawHeavenBelow(ctx, clock, sheets.heavenIsle);
  else drawEvilBelow(ctx, clock, sheets.hellIsle);
  drawRealmCliff(ctx, east);
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
  { x: 170, y: 250 },
  { x: 80, y: 320 },
  { x: 70, y: 400 },
  { x: 150, y: 490 },
  { x: 270, y: 430 },
  { x: 280, y: 320 },
  { x: 200, y: 270 },
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
  { x: 80, y: 200 },
  { x: 50, y: 320 },
  { x: 70, y: 450 },
  { x: 160, y: 340 },
  { x: 250, y: 450 },
  { x: 290, y: 300 },
  { x: 240, y: 190 },
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

function ink(hex: string, n: number): string {
  const v = Number.parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((v >> 16) & 255) - n);
  const g = Math.max(0, ((v >> 8) & 255) - n);
  const b = Math.max(0, (v & 255) - n);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function paintFlatPortal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  clock: number,
  kind: "skill" | "combat" | "home" | "ring" | "armour" | "weapon" | "quarry" | "sanctum" | "market" | "enchant" | "wilds",
): void {
  const rx = 12;
  const ry = 6;
  const drift = clock * 1.2;
  const tone =
    kind === "combat"
      ? { mist: ["#f6d6e4", "#e8c8f2", "#f8e0d0", "#d8c8f4"], deep: "#c4a0b8", heart: "#fff0f6", glow: "244, 210, 230" }
      : kind === "skill"
        ? { mist: ["#d8f6ea", "#c8e8f6", "#e6d8f8", "#d0f0dc"], deep: "#9cc8c8", heart: "#f4fffb", glow: "200, 236, 228" }
        : kind === "ring"
          ? { mist: ["#f6c0b4", "#f8d0a8", "#e8a8a4", "#f4d4c0"], deep: "#c07870", heart: "#fff2ea", glow: "236, 168, 140" }
          : kind === "armour"
            ? { mist: ["#c8f4b4", "#d8f8c8", "#b8e8a8", "#e4f8d4"], deep: "#7aaa72", heart: "#f4fff0", glow: "188, 228, 168" }
            : kind === "weapon"
              ? { mist: ["#fff0b4", "#ffe6a4", "#fff6cc", "#f8e49a"], deep: "#c8b070", heart: "#fffce8", glow: "240, 220, 150" }
              : kind === "quarry"
                ? { mist: ["#f0c4a4", "#e8a878", "#f6d2b4", "#d89870"], deep: "#a87858", heart: "#fff3ea", glow: "228, 168, 128" }
                : kind === "sanctum"
                  ? { mist: ["#e6d6f8", "#d8c8f0", "#f0e6ff", "#c8b4e8"], deep: "#9884c0", heart: "#faf6ff", glow: "196, 176, 224" }
                  : kind === "market"
                    ? { mist: ["#ffe0a4", "#f6c888", "#fff0c4", "#e8b878"], deep: "#b88848", heart: "#fff8e6", glow: "232, 184, 110" }
                    : kind === "enchant"
                      ? { mist: ["#d6e6f8", "#c8d8f2", "#eef4ff", "#b4c6e6"], deep: "#8090b4", heart: "#f7faff", glow: "180, 204, 230" }
                      : kind === "wilds"
                        ? { mist: ["#b8ebe4", "#9adcd4", "#d4f6f2", "#88ccc4"], deep: "#5e9890", heart: "#f3fffc", glow: "140, 206, 196" }
                        : { mist: ["#efe6d4", "#d8dcf0", "#e8e0d0", "#dce6f4"], deep: "#c0b8a8", heart: "#fffaf0", glow: "232, 226, 210" };
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      const nx = x / rx;
      const ny = y / ry;
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      const wx = cx + x;
      const wy = cy + y;
      const ang = Math.atan2(ny, nx);
      const crest = 0.5 + 0.5 * Math.sin(ang * 5 + drift);
      const splash = (ny < 0.2 ? 0.18 : 0.06) * crest;
      const wave = 0.5 + 0.5 * Math.sin(ang * 3 + drift + d * 5);
      const inner = tone.mist[Math.min(tone.mist.length - 1, Math.floor(wave * tone.mist.length))]!;
      if (d > 0.76 - splash) {
        ctx.fillStyle = d > 0.9 ? ink(inner, 78) : ink(inner, 42);
        ctx.fillRect(wx, wy, 1, 1);
        continue;
      }
      ctx.fillStyle = d < 0.22 ? tone.heart : d > 0.62 ? tone.deep : inner;
      ctx.fillRect(wx, wy, 1, 1);
    }
  }
  const parts = tone.glow.split(",").map((n) => Number(n.trim()));
  const lift = (c: number, k: number) => Math.min(255, Math.round(c + (255 - c) * k));
  const hot = `rgb(${lift(parts[0] ?? 255, 0.7)}, ${lift(parts[1] ?? 255, 0.7)}, ${lift(parts[2] ?? 255, 0.45)})`;
  const core = `rgb(${lift(parts[0] ?? 255, 0.95)}, ${lift(parts[1] ?? 255, 0.95)}, ${lift(parts[2] ?? 255, 0.88)})`;
  for (let i = 0; i < 5; i++) {
    const life = (clock * 0.55 + i * 0.37) % 1;
    if (life < 0.12 || life > 0.94) continue;
    const x = cx + Math.round(Math.sin(i * 2.4 + clock * 0.7) * 6);
    const y = cy - 1 - Math.round(life * 12);
    ctx.fillStyle = hot;
    ctx.fillRect(x, y, 1, 1);
    if (life > 0.3 && life < 0.72) {
      ctx.fillStyle = core;
      ctx.fillRect(x, y - 1, 1, 1);
    }
  }
}

let grovePlate: HTMLCanvasElement | null = null;

function fitStamp(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
  sx = 0,
  sy = 0,
  sw = 0,
  sh = 0,
): void {
  if (!img || img.width < 2) return;
  const srcW = sw > 0 ? sw : img.width;
  const srcH = sh > 0 ? sh : img.height;
  const dw = Math.max(1, Math.round(w));
  const dh = Math.max(1, Math.round(h));
  ctx.drawImage(img, sx, sy, srcW, srcH, x, y, dw, dh);
}

function tileFill(ctx: CanvasRenderingContext2D, img: HTMLImageElement | undefined, x: number, y: number, w: number, h: number): void {
  if (!img || img.width < 2) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  for (let yy = y; yy < y + h; yy += img.height) {
    for (let xx = x; xx < x + w; xx += img.width) ctx.drawImage(img, xx, yy);
  }
  ctx.restore();
}

const YARD_GROUT = "#302418";
const YARD_GOLD = "#e2b657";
const YARD_GOLD_H = "#ffecaa";
const YARD_GOLD_D = "#785018";
const YARD_IVORY = "#d6c4a0";
const YARD_LIGHT = "#ead8b4";
const YARD_SHADE = "#6e5438";
const YARD_LAPIS = "#3a5280";
const YARD_LAPIS_D = "#20304a";
const YARD_SUN = "#fff4d2";
const YARD_CURB = "#4e3824";

function yardLip(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  g.fillStyle = YARD_GROUT;
  g.fillRect(x, y, w, 1);
  g.fillRect(x, y + h - 1, w, 1);
  g.fillRect(x, y, 1, h);
  g.fillRect(x + w - 1, y, 1, h);
  g.fillStyle = YARD_GOLD_H;
  g.fillRect(x + 1, y + 1, Math.max(1, w - 2), 1);
  g.fillStyle = YARD_SHADE;
  g.fillRect(x + 1, y + h - 2, Math.max(1, w - 2), 1);
}

function sitSprite(
  g: CanvasRenderingContext2D,
  img: HTMLImageElement | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
  sx = 0,
  sy = 0,
  sw = 0,
  sh = 0,
): void {
  if (!img || img.width < 2) return;
  const srcW = sw > 0 ? sw : img.width;
  const srcH = sh > 0 ? sh : img.height;
  const scale = Math.min(1, (w - 4) / srcW, (h - 2) / srcH);
  const dw = Math.max(1, Math.round(srcW * scale));
  const dh = Math.max(1, Math.round(srcH * scale));
  g.drawImage(img, sx, sy, srcW, srcH, x + Math.round((w - dw) / 2), y + h - dh - 1, dw, dh);
}

function paintGrovePlots(g: CanvasRenderingContext2D, sheets: Sheets): void {
  const bed = (x: number, y: number, w: number, h: number, img?: HTMLImageElement) => {
    tileFill(g, img, x + 1, y + 1, w - 2, h - 2);
    yardLip(g, x, y, w, h);
  };
  const pool = (x: number, y: number, w: number, h: number) => {
    bed(x, y, w, h, sheets.landWater);
    g.fillStyle = YARD_SUN;
    g.fillRect(x + 4, y + 3, Math.max(2, Math.floor(w / 3)), 1);
    g.fillStyle = YARD_LAPIS_D;
    g.fillRect(x + 3, y + h - 4, Math.max(2, w - 6), 1);
  };
  for (const plot of GROVE_PLOTS) {
    const { id, x, y, w, h } = plot;
    if (id === "g-farm") {
      bed(x, y, w, h, sheets.landTilled);
      g.fillStyle = YARD_SHADE;
      for (let row = y + 6; row < y + h - 3; row += 5) g.fillRect(x + 3, row, w - 6, 1);
      g.fillStyle = YARD_LIGHT;
      for (let row = y + 5; row < y + h - 3; row += 5) g.fillRect(x + 3, row, w - 6, 1);
      sitSprite(g, sheets.greens, x + 4, y, 24, h, 0, 0, 16, 16);
      sitSprite(g, sheets.tomato, x + 32, y, 24, h, 0, 0, 16, 16);
      sitSprite(g, sheets.cabbage, x + 58, y, 24, h, 0, 0, 16, 16);
    } else if (id === "g-herb") {
      bed(x, y, w, h, sheets.landSoil);
      for (let i = 0; i < 6; i++) sitSprite(g, sheets.flowers, x + (i % 3) * 26, y + Math.floor(i / 3) * 14, 26, 16, (i % 3) * 16, Math.floor(i / 3) * 16, 16, 16);
    } else if (id === "g-herd" || id === "g-fish" || id === "g-heal") {
      pool(x, y, w, h);
      if (id === "g-herd") {
        g.fillStyle = YARD_GOLD_D;
        g.fillRect(x, y, w, 2);
        g.fillStyle = YARD_GOLD_H;
        g.fillRect(x, y, w, 1);
      }
    } else if (id === "g-build" || id === "g-track") {
      sitSprite(g, sheets.rocks, x, y, w, h, id === "g-track" ? 48 : 0, 0, 48, 48);
      yardLip(g, x, y, w, h);
    } else if (id === "g-explore") {
      g.fillStyle = YARD_IVORY;
      g.fillRect(x + 2, y + 2, w - 4, h - 3);
      yardLip(g, x, y, w, h);
      g.fillStyle = YARD_GOLD;
      g.fillRect(x + 6, y + 8, 4, 1);
      g.fillRect(x + 7, y + 6, 2, 5);
    } else if (id === "g-forage") {
      sitSprite(g, sheets.treePine, x, y, w, h);
    } else if (id === "g-wood") {
      sitSprite(g, sheets.treeStump, x, y, w, h);
    } else if (id === "g-cook") {
      sitSprite(g, sheets.campfire, x, y, w, h, 0, 56, 48, 40);
    } else if (id === "g-live") {
      g.fillStyle = YARD_GOLD_D;
      g.fillRect(x, y + 4, 2, h - 4);
      g.fillRect(x + w - 2, y + 4, 2, h - 4);
      g.fillStyle = YARD_IVORY;
      g.fillRect(x, y, w, 5);
      g.fillStyle = YARD_GOLD_H;
      g.fillRect(x, y, w, 1);
      g.fillStyle = YARD_GROUT;
      g.fillRect(x, y + 4, w, 1);
      g.fillStyle = YARD_LAPIS_D;
      g.fillRect(x + 4, y + 7, w - 8, h - 9);
    } else if (id === "g-rite") {
      yardLip(g, x, y, w, h);
      g.fillStyle = YARD_IVORY;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.fillRect(Math.round(x + w / 2 + Math.cos(a) * (w / 2 - 5)), Math.round(y + h / 2 + Math.sin(a) * (h / 2 - 5)), 2, 2);
      }
      g.fillStyle = YARD_GOLD;
      g.fillRect(x + Math.floor(w / 2) - 1, y + Math.floor(h / 2) - 1, 2, 2);
    } else if (id === "g-magic") {
      yardLip(g, x, y, w, h);
      for (let ty = 0; ty < 4; ty++) {
        for (let tx = 0; tx < 2; tx++) {
          g.fillStyle = (tx + ty) % 2 === 0 ? YARD_IVORY : YARD_LAPIS;
          g.fillRect(x + 2 + tx * 5, y + 3 + ty * 4, 4, 3);
        }
      }
    }
  }
}

function paintPlotSigns(g: CanvasRenderingContext2D, plots: Array<{ name: string; x: number; y: number; w: number; h: number }>): void {
  g.save();
  g.imageSmoothingEnabled = false;
  g.font = "8px 'Courier New', monospace";
  g.textBaseline = "top";
  for (const plot of plots) {
    const tw = Math.ceil(g.measureText(plot.name).width);
    const w = tw + 4;
    const h = 9;
    let x = Math.round(plot.x + plot.w / 2 - w / 2);
    let y = plot.y + plot.h + 2;
    if (x < 12) x = 12;
    if (x + w > WORLD_W - 12) x = WORLD_W - 12 - w;
    if (y + h > 516) y = plot.y - h - 2;
    g.fillStyle = YARD_IVORY;
    g.fillRect(x, y, w, h);
    g.fillStyle = YARD_GROUT;
    g.fillRect(x, y, w, 1);
    g.fillRect(x, y + h - 1, w, 1);
    g.fillRect(x, y, 1, h);
    g.fillRect(x + w - 1, y, 1, h);
    g.fillStyle = YARD_GOLD_H;
    g.fillRect(x + 1, y + 1, Math.max(1, w - 2), 1);
    g.fillStyle = YARD_GROUT;
    g.fillText(plot.name, x + 2, y + 1);
  }
  g.restore();
}

function ensureGrove(sheets: Sheets): HTMLCanvasElement | null {
  if (grovePlate) return grovePlate;
  if (typeof document === "undefined") return null;
  const grass = sheets.landGrass;
  if (!grass || grass.width < 2) return null;
  const canvas = document.createElement("canvas");
  canvas.width = WORLD_W;
  canvas.height = 528;
  const g = canvas.getContext("2d");
  if (!g) return null;
  g.imageSmoothingEnabled = false;
  for (let y = 0; y < 528; y += grass.height) {
    for (let x = 0; x < WORLD_W; x += grass.width) g.drawImage(grass, x, y);
  }
  g.fillStyle = YARD_CURB;
  g.fillRect(0, 0, WORLD_W, 8);
  g.fillRect(0, 520, WORLD_W, 8);
  g.fillRect(0, 0, 10, 528);
  g.fillRect(WORLD_W - 10, 0, 10, 528);
  g.fillStyle = YARD_GOLD_H;
  g.fillRect(0, 0, WORLD_W, 1);
  g.fillRect(0, 0, 1, 528);
  g.fillStyle = YARD_GROUT;
  g.fillRect(0, 7, WORLD_W, 1);
  g.fillRect(0, 527, WORLD_W, 1);
  g.fillRect(9, 0, 1, 528);
  g.fillRect(WORLD_W - 1, 0, 1, 528);
  for (let i = 0; i < 8; i++) {
    const py = 36 + i * 58;
    fitStamp(g, sheets.treePine, i % 2 === 0 ? 16 : WORLD_W - 48, py, 32, 48);
  }
  paintGrovePlots(g, sheets);
  paintPlotSigns(g, GROVE_PLOTS);
  grovePlate = canvas;
  return canvas;
}

let combatPlate: HTMLCanvasElement | null = null;

function paintCombatPlots(g: CanvasRenderingContext2D): void {
  for (const plot of COMBAT_PLOTS) {
    const { id, x, y, w, h } = plot;
    if (id === "c-plot") {
      g.fillStyle = "#4a1c22";
      g.fillRect(x + 4, y + 4, w - 8, h - 8);
      g.fillStyle = "#8a3038";
      g.fillRect(x + 10, y + 10, w - 20, h - 20);
      yardLip(g, x, y, w, h);
      g.fillStyle = YARD_IVORY;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        g.fillRect(Math.round(x + w / 2 + Math.cos(a) * (w / 2 - 8)), Math.round(y + h / 2 + Math.sin(a) * (h / 2 - 8)), 2, 2);
      }
      g.fillStyle = "#e07070";
      g.fillRect(x + w / 2 - 2, y + h / 2 - 1, 4, 2);
    } else if (id === "c-dummy") {
      g.fillStyle = YARD_GOLD_D;
      g.fillRect(x + 12, y + 16, 4, h - 16);
      g.fillStyle = "#c4a06a";
      g.fillRect(x + 6, y + 8, 16, 16);
      g.fillStyle = YARD_IVORY;
      g.fillRect(x + 10, y + 2, 8, 8);
      g.fillStyle = "#3a2414";
      g.fillRect(x + 12, y + 5, 2, 2);
      g.fillRect(x + 16, y + 5, 2, 2);
    } else if (id === "c-arch") {
      g.fillStyle = YARD_IVORY;
      g.fillRect(x + 6, y + 4, w - 12, h - 8);
      yardLip(g, x, y, w, h);
      g.fillStyle = "#8a3038";
      g.fillRect(x + 12, y + 8, w - 24, h - 16);
      g.fillStyle = YARD_GOLD_H;
      g.fillRect(x + w / 2 - 2, y + h / 2 - 2, 4, 4);
    } else if (id === "c-blade") {
      g.fillStyle = YARD_GOLD_D;
      g.fillRect(x + 8, y + 8, 6, h - 8);
      g.fillStyle = "#d8dce4";
      g.fillRect(x + 6, y + 2, 4, 16);
      g.fillStyle = YARD_GOLD_H;
      g.fillRect(x + 6, y + 2, 1, 16);
    } else if (id === "c-shield") {
      g.fillStyle = "#8a3038";
      g.fillRect(x + 4, y + 4, 16, 18);
      g.fillStyle = YARD_LAPIS;
      g.fillRect(x + 26, y + 4, 16, 18);
      g.fillStyle = YARD_GOLD_H;
      g.fillRect(x + 10, y + 10, 4, 4);
      g.fillRect(x + 32, y + 10, 4, 4);
      g.fillStyle = YARD_GROUT;
      g.fillRect(x, y + h - 4, w, 4);
    }
  }
}

function ensureCombat(sheets: Sheets): HTMLCanvasElement | null {
  if (combatPlate) return combatPlate;
  if (typeof document === "undefined") return null;
  const grass = sheets.landGrass;
  if (!grass || grass.width < 2) return null;
  const canvas = document.createElement("canvas");
  canvas.width = WORLD_W;
  canvas.height = 528;
  const g = canvas.getContext("2d");
  if (!g) return null;
  g.imageSmoothingEnabled = false;
  for (let y = 0; y < 528; y += grass.height) {
    for (let x = 0; x < WORLD_W; x += grass.width) g.drawImage(grass, x, y);
  }
  g.fillStyle = YARD_CURB;
  g.fillRect(0, 0, WORLD_W, 8);
  g.fillRect(0, 520, WORLD_W, 8);
  g.fillRect(0, 0, 10, 528);
  g.fillRect(WORLD_W - 10, 0, 10, 528);
  g.fillStyle = "#e07070";
  g.fillRect(0, 0, WORLD_W, 1);
  g.fillRect(0, 0, 1, 528);
  g.fillStyle = YARD_GROUT;
  g.fillRect(0, 7, WORLD_W, 1);
  g.fillRect(0, 527, WORLD_W, 1);
  g.fillRect(9, 0, 1, 528);
  g.fillRect(WORLD_W - 1, 0, 1, 528);
  for (let i = 0; i < 8; i++) {
    const py = 36 + i * 58;
    fitStamp(g, sheets.treePine, i % 2 === 0 ? 16 : WORLD_W - 48, py, 32, 48);
  }
  paintCombatPlots(g);
  paintPlotSigns(g, COMBAT_PLOTS);
  combatPlate = canvas;
  return canvas;
}

let ringPlate: HTMLCanvasElement | null = null;

function ensureRing(sheets: Sheets): HTMLCanvasElement | null {
  if (ringPlate) return ringPlate;
  if (typeof document === "undefined") return null;
  const grass = sheets.landGrass;
  if (!grass || grass.width < 2) return null;
  const canvas = document.createElement("canvas");
  canvas.width = WORLD_W;
  canvas.height = 528;
  const g = canvas.getContext("2d");
  if (!g) return null;
  g.imageSmoothingEnabled = false;
  for (let y = 0; y < 528; y += grass.height) {
    for (let x = 0; x < WORLD_W; x += grass.width) g.drawImage(grass, x, y);
  }
  g.fillStyle = "#d4d8ee";
  for (let y = 200; y < 300; y++) {
    for (let x = 90; x < 260; x++) {
      const dx = (x - 174) / 78;
      const dy = (y - 246) / 46;
      if (dx * dx + dy * dy <= 1) g.fillRect(x, y, 1, 1);
    }
  }
  g.fillStyle = YARD_IVORY;
  for (const stone of RING_STONES) g.fillRect(stone.x, stone.y, stone.w, stone.h);
  g.fillStyle = YARD_GROUT;
  for (const stone of RING_STONES) g.fillRect(stone.x, stone.y, stone.w, 1);
  g.fillStyle = YARD_CURB;
  g.fillRect(0, 0, WORLD_W, 8);
  g.fillRect(0, 520, WORLD_W, 8);
  g.fillRect(0, 0, 10, 528);
  g.fillRect(WORLD_W - 10, 0, 10, 528);
  paintPlotSigns(g, [{ name: "Combat ring", x: 130, y: 308, w: 88, h: 8 }]);
  ringPlate = canvas;
  return canvas;
}

function paintShade(ctx: CanvasRenderingContext2D, x: number, y: number, hurt: number): void {
  const flash = hurt > 0;
  ctx.fillStyle = flash ? "#f4f6ff" : "#3a3458";
  ctx.fillRect(x - 3, y - 12, 6, 8);
  ctx.fillStyle = flash ? "#fff" : "#dce6ff";
  ctx.fillRect(x - 1, y - 10, 2, 2);
  ctx.fillStyle = "#2a243c";
  ctx.fillRect(x - 2, y - 4, 4, 4);
}

function drawGrove(ctx: CanvasRenderingContext2D, sheets: Sheets): void {
  ctx.imageSmoothingEnabled = false;
  const plate = ensureGrove(sheets);
  if (plate) ctx.drawImage(plate, 0, 0);
  else if (sheets.grove && sheets.grove.width > 0) ctx.drawImage(sheets.grove, 0, 0);
}

function drawRealmGate(ctx: CanvasRenderingContext2D, s: GameState, sheets: Sheets): void {
  const wing = s.wing ?? 0;
  if (wing === 1) {
    drawPortal(ctx, sheets, HEAVEN_GATE.x, HEAVEN_GATE.y, true, s.clock, true, HEAVEN_GATE.y);
    return;
  }
  for (const cx of gateXs(wing)) drawPortal(ctx, sheets, cx, 202, portalIsEast(wing, cx), s.clock, true);
}

const smithPlates = new Map<string, HTMLCanvasElement>();

function paintSmithPlots(g: CanvasRenderingContext2D, kind: "armour" | "weapon" | "quarry" | "sanctum" | "market" | "enchant" | "wilds"): void {
  const plots =
    kind === "armour" ? ARMOUR_PLOTS : kind === "weapon" ? WEAPON_PLOTS : kind === "quarry" ? QUARRY_PLOTS : kind === "sanctum" ? SANCTUM_PLOTS : kind === "market" ? MARKET_PLOTS : kind === "enchant" ? ENCHANT_PLOTS : WILDS_PLOTS;
  const cloth = kind === "armour" ? "#7aaa72" : kind === "weapon" ? "#c8b070" : kind === "quarry" ? "#c48860" : kind === "sanctum" ? "#a898d0" : kind === "market" ? "#e0a858" : kind === "enchant" ? "#8090b4" : "#5e9890";
  const pale = kind === "armour" ? "#d8f4c8" : kind === "weapon" ? "#fff0b4" : kind === "quarry" ? "#f0d0b8" : kind === "sanctum" ? "#ece4f8" : kind === "market" ? "#ffe6b8" : kind === "enchant" ? "#e4eef8" : "#d4f4f0";
  for (const plot of plots) {
    const { id, x, y, w, h } = plot;
    if (id.endsWith("plot")) {
      g.fillStyle = pale;
      g.fillRect(x + 4, y + 4, w - 8, h - 8);
      yardLip(g, x, y, w, h);
      g.fillStyle = cloth;
      g.fillRect(x + w / 2 - 2, y + h / 2 - 1, 4, 2);
    } else if (id === "a-stand" || id === "w-haft") {
      g.fillStyle = YARD_GOLD_D;
      g.fillRect(x + 10, y + 8, 4, h - 8);
      g.fillStyle = pale;
      g.fillRect(x + 4, y + 4, 16, 12);
      g.fillStyle = cloth;
      g.fillRect(x + 6, y + 6, 12, 8);
    } else if (id === "a-helm") {
      g.fillStyle = YARD_IVORY;
      g.fillRect(x + 6, y + 6, 18, 12);
      yardLip(g, x, y, w, h);
      g.fillStyle = cloth;
      g.fillRect(x + 12, y + 8, 6, 4);
    } else if (id === "a-mail" || id === "w-bench") {
      g.fillStyle = YARD_GOLD_D;
      g.fillRect(x, y + 6, w, h - 6);
      g.fillStyle = YARD_IVORY;
      g.fillRect(x, y, w, 6);
      g.fillStyle = YARD_GOLD_H;
      g.fillRect(x, y, w, 1);
      g.fillStyle = cloth;
      g.fillRect(x + 6, y + 8, w - 12, 4);
    } else if (id === "a-fit" || id === "w-blade") {
      g.fillStyle = YARD_IVORY;
      g.fillRect(x + 4, y + 4, w - 8, h - 6);
      yardLip(g, x, y, w, h);
      g.fillStyle = "#d8dce4";
      g.fillRect(x + 8, y + 6, 3, h - 12);
    } else if (id === "w-forge") {
      g.fillStyle = "#5c3828";
      g.fillRect(x + 4, y + 8, w - 8, h - 10);
      yardLip(g, x, y, w, h);
      g.fillStyle = "#e07040";
      g.fillRect(x + 10, y + 12, 8, 4);
    } else if (id === "q-face" || id === "q-stone") {
      g.fillStyle = "#8a6848";
      g.fillRect(x + 2, y + 6, w - 4, h - 8);
      yardLip(g, x, y, w, h);
      g.fillStyle = "#e8c090";
      g.fillRect(x + 8, y + 10, 4, 3);
      g.fillRect(x + 16, y + 16, 3, 3);
    } else if (id === "q-ingot" || id === "q-cart" || id === "m-crate") {
      g.fillStyle = YARD_GOLD_D;
      g.fillRect(x + 2, y + 6, w - 4, h - 8);
      g.fillStyle = pale;
      g.fillRect(x + 6, y + 4, w - 12, 6);
      g.fillStyle = cloth;
      g.fillRect(x + 8, y + 10, w - 16, 4);
    } else if (id === "s-shrine" || id === "s-lamp") {
      g.fillStyle = YARD_IVORY;
      g.fillRect(x + 6, y + 8, w - 12, h - 10);
      yardLip(g, x, y, w, h);
      g.fillStyle = cloth;
      g.fillRect(x + Math.floor(w / 2) - 1, y + 4, 2, 6);
    } else if (id === "s-bowl" || id === "s-incense") {
      g.fillStyle = pale;
      g.fillRect(x + 4, y + 6, w - 8, h - 8);
      yardLip(g, x, y, w, h);
      g.fillStyle = cloth;
      g.fillRect(x + 8, y + 4, 2, 6);
    } else if (id === "m-stall" || id === "m-counter" || id === "m-scale") {
      g.fillStyle = YARD_GOLD_D;
      g.fillRect(x, y + 8, w, h - 8);
      g.fillStyle = pale;
      g.fillRect(x, y, w, 8);
      g.fillStyle = cloth;
      g.fillRect(x + 4, y + 2, w - 8, 2);
    } else if (id === "e-bind" || id === "e-oil") {
      g.fillStyle = pale;
      g.fillRect(x + 4, y + 6, w - 8, h - 8);
      yardLip(g, x, y, w, h);
      g.fillStyle = cloth;
      g.fillRect(x + Math.floor(w / 2) - 2, y + Math.floor(h / 2) - 2, 4, 4);
    } else if (id === "e-rune" || id === "e-rack") {
      g.fillStyle = YARD_IVORY;
      g.fillRect(x + 2, y + 6, w - 4, h - 8);
      yardLip(g, x, y, w, h);
      g.fillStyle = cloth;
      g.fillRect(x + 6, y + 8, w - 12, 2);
      g.fillRect(x + 8, y + 12, 2, h - 16);
    } else if (id === "v-trail" || id === "v-camp") {
      g.fillStyle = "#6a5038";
      g.fillRect(x + 2, y + 8, w - 4, h - 10);
      yardLip(g, x, y, w, h);
      g.fillStyle = pale;
      g.fillRect(x + 6, y + 4, w - 12, 4);
    } else if (id === "v-forage" || id === "v-thicket") {
      g.fillStyle = "#3e6a48";
      g.fillRect(x + 4, y + 8, w - 8, h - 10);
      yardLip(g, x, y, w, h);
      g.fillStyle = pale;
      g.fillRect(x + 8, y + 6, 4, 4);
      g.fillRect(x + 16, y + 12, 3, 3);
    }
  }
}

function ensureSmith(sheets: Sheets, kind: "armour" | "weapon" | "quarry" | "sanctum" | "market" | "enchant" | "wilds"): HTMLCanvasElement | null {
  const hit = smithPlates.get(kind);
  if (hit) return hit;
  if (typeof document === "undefined") return null;
  const grass = sheets.landGrass;
  if (!grass || grass.width < 2) return null;
  const canvas = document.createElement("canvas");
  canvas.width = WORLD_W;
  canvas.height = 528;
  const g = canvas.getContext("2d");
  if (!g) return null;
  g.imageSmoothingEnabled = false;
  for (let y = 0; y < 528; y += grass.height) {
    for (let x = 0; x < WORLD_W; x += grass.width) g.drawImage(grass, x, y);
  }
  g.fillStyle = YARD_CURB;
  g.fillRect(0, 0, WORLD_W, 8);
  g.fillRect(0, 520, WORLD_W, 8);
  g.fillRect(0, 0, 10, 528);
  g.fillRect(WORLD_W - 10, 0, 10, 528);
  for (let i = 0; i < 6; i++) {
    const py = 48 + i * 70;
    fitStamp(g, sheets.treePine, i % 2 === 0 ? 16 : WORLD_W - 48, py, 32, 48);
  }
  paintSmithPlots(g, kind);
  paintPlotSigns(g, kind === "armour" ? ARMOUR_PLOTS : kind === "weapon" ? WEAPON_PLOTS : kind === "quarry" ? QUARRY_PLOTS : kind === "sanctum" ? SANCTUM_PLOTS : kind === "market" ? MARKET_PLOTS : kind === "enchant" ? ENCHANT_PLOTS : WILDS_PLOTS);
  smithPlates.set(kind, canvas);
  return canvas;
}

function paintDnaHole(ctx: CanvasRenderingContext2D, cx: number, cy: number, clock: number): void {
  const rx = 12;
  const ry = 6;
  const spin = clock * 2.4;
  for (let y = -ry; y <= ry; y++) {
    const ny = y / ry;
    const twist = spin + ny * Math.PI * 2.2;
    const span = Math.cos(ny * 0.6) * rx * 0.62;
    const a = Math.sin(twist) * span;
    const b = -a;
    const rung = Math.abs(Math.sin(twist)) < 0.38;
    for (let x = -rx; x <= rx; x++) {
      const d = (x / rx) * (x / rx) + ny * ny;
      if (d > 1) continue;
      const depth = (y + ry) / (ry * 2);
      let color = depth > 0.72 ? "#120c08" : depth > 0.35 ? "#24180e" : "#3a2814";
      if (rung && x > Math.min(a, b) && x < Math.max(a, b)) color = depth > 0.6 ? "#785018" : "#e2b657";
      if (Math.abs(x - a) <= 0.8 || Math.abs(x - b) <= 0.8) color = Math.sin(twist) > 0 && Math.abs(x - a) <= 0.8 ? "#ffecaa" : "#b08034";
      if (d > 0.78) color = y < 0 ? (d > 0.9 ? "#ffecaa" : "#e2b657") : d > 0.9 ? "#3a2410" : "#785018";
      ctx.fillStyle = color;
      ctx.fillRect(cx + x, cy + y, 1, 1);
    }
  }
}

let descentPlate: HTMLCanvasElement | null = null;

function ensureDescent(): HTMLCanvasElement | null {
  if (descentPlate) return descentPlate;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = WORLD_W;
  canvas.height = WORLD_H;
  const g = canvas.getContext("2d");
  if (!g) return null;
  g.imageSmoothingEnabled = false;
  g.fillStyle = "#100e0c";
  g.fillRect(0, 0, WORLD_W, WORLD_H);
  const x0 = STAIR_WELL.x - 10;
  const x1 = STAIR_WELL.x + STAIR_WELL.w + 10;
  g.fillStyle = "#4e3824";
  g.fillRect(x0, 32, 10, STAIR_SEAL + 28);
  g.fillRect(x1 - 10, 32, 10, STAIR_SEAL + 28);
  g.fillStyle = "#ead8b4";
  g.fillRect(x0, 32, 2, STAIR_SEAL + 28);
  g.fillRect(x1 - 2, 32, 2, STAIR_SEAL + 28);
  const paintTiles = (y0: number, y1: number, shade: number) => {
    for (let y = y0; y < y1; y++) {
      for (let x = STAIR_WELL.x; x < STAIR_WELL.x + STAIR_WELL.w; x++) {
        const tx = Math.floor(x / 8);
        const ty = Math.floor(y / 4);
        let color = (tx + ty) % 2 === 0 ? "#d6c4a0" : "#c4ae86";
        color = ink(color, shade);
        const lx = x % 8;
        const ly = y % 4;
        if (ly === 0 && lx > 0 && lx < 3) color = ink("#ead8b4", shade);
        if (ly === 3 && lx >= 5) color = ink("#6e5438", Math.max(0, shade - 8));
        if (lx === 0 && ly === 0) color = "#302418";
        g.fillStyle = color;
        g.fillRect(x, y, 1, 1);
      }
    }
  };
  paintTiles(40, STAIR_LAND, 0);
  for (let i = 0; i < STAIR_COUNT; i++) {
    const y = STAIR_LAND + i * STAIR_PITCH;
    const shade = Math.min(70, Math.floor((i / STAIR_COUNT) * 56));
    paintTiles(y, y + STAIR_PITCH - 4, shade);
    g.fillStyle = ink("#4e3824", Math.max(0, shade - 10));
    g.fillRect(STAIR_WELL.x, y + STAIR_PITCH - 4, STAIR_WELL.w, 3);
    g.fillStyle = ink("#2a1c12", Math.max(0, shade - 16));
    g.fillRect(STAIR_WELL.x, y + STAIR_PITCH - 1, STAIR_WELL.w, 1);
  }
  g.fillStyle = "#1a140f";
  g.fillRect(STAIR_WELL.x, STAIR_SEAL, STAIR_WELL.w, 36);
  g.fillStyle = "#6e5438";
  g.fillRect(STAIR_WELL.x, STAIR_SEAL, STAIR_WELL.w, 2);
  g.fillStyle = "#302418";
  g.fillRect(STAIR_WELL.x + 70, STAIR_SEAL + 12, STAIR_WELL.w - 140, 10);
  descentPlate = canvas;
  return canvas;
}

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  sheets: Sheets,
  hover: { x: number; y: number } | null,
  showTill: boolean,
) {
  const wing = s.wing ?? 0;
  if (wing === 2) {
    drawGrove(ctx, sheets);
    paintFlatPortal(ctx, GROVE_RETURN.x, GROVE_RETURN.y, s.clock, "home");
    const grovePaint: Array<{ y: number; paint: () => void }> = [];
    const cow = s.animals.find((a) => a.kind === "cow");
    if (cow) {
      grovePaint.push({
        y: cow.y,
        paint: () => drawAnimal(ctx, sheets.cowIdle, sheets.cowWalk, s, cow.x, cow.y, cow.dir, cow.pause <= 0, 0.5, 69, 4),
      });
    }
    if (s.maid) grovePaint.push({ y: s.maid.y, paint: () => paintMaid(ctx, sheets, s) });
    if (sheets.idle) {
      grovePaint.push({
        y: s.y,
        paint: () => {
          drawCastRite(ctx, sheets, s);
          paintPlayer(ctx, sheets, s);
          drawSpell(ctx, sheets, s);
        },
      });
    }
    grovePaint.sort((a, b) => a.y - b.y);
    for (const bit of grovePaint) bit.paint();
    if (s.cross) {
      const u = Math.max(0, Math.min(1, s.cross.t / 0.85));
      const a = u < 0.5 ? u * 2 : (1 - u) * 2;
      ctx.fillStyle = `rgba(226, 210, 140, ${0.12 + a * 0.7})`;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    return;
  }
  if (wing === 3) {
    const yard = ensureCombat(sheets);
    if (yard) ctx.drawImage(yard, 0, 0);
    paintFlatPortal(ctx, COMBAT_RETURN.x, COMBAT_RETURN.y, s.clock, "home");
    if (sheets.idle) {
      drawCastRite(ctx, sheets, s);
      paintPlayer(ctx, sheets, s);
      drawSpell(ctx, sheets, s);
    }
    if (s.cross) {
      const u = Math.max(0, Math.min(1, s.cross.t / 0.85));
      const a = u < 0.5 ? u * 2 : (1 - u) * 2;
      ctx.fillStyle = `rgba(160, 48, 56, ${0.1 + a * 0.55})`;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    return;
  }
  if (wing === 4) {
    const yard = ensureRing(sheets);
    if (yard) ctx.drawImage(yard, 0, 0);
    paintFlatPortal(ctx, RING_RETURN.x, RING_RETURN.y, s.clock, "home");
    const bits: Array<{ y: number; paint: () => void }> = [];
    for (const foe of ringFoes()) {
      if (foe.hp <= 0) continue;
      bits.push({ y: foe.y, paint: () => paintShade(ctx, foe.x, foe.y, foe.hurt) });
    }
    if (sheets.idle) {
      bits.push({
        y: s.y,
        paint: () => {
          drawCastRite(ctx, sheets, s);
          paintPlayer(ctx, sheets, s);
          drawSpell(ctx, sheets, s);
        },
      });
    }
    bits.sort((a, b) => a.y - b.y);
    for (const bit of bits) bit.paint();
    if (s.cross) {
      const u = Math.max(0, Math.min(1, s.cross.t / 0.85));
      const a = u < 0.5 ? u * 2 : (1 - u) * 2;
      ctx.fillStyle = `rgba(220, 120, 100, ${0.1 + a * 0.45})`;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    return;
  }
  if (wing >= 5 && wing <= 11) {
    const kind = wing === 5 ? "armour" : wing === 6 ? "weapon" : wing === 7 ? "quarry" : wing === 8 ? "sanctum" : wing === 9 ? "market" : wing === 10 ? "enchant" : "wilds";
    const back = wing === 5 ? ARMOUR_RETURN : wing === 6 ? WEAPON_RETURN : wing === 7 ? QUARRY_RETURN : wing === 8 ? SANCTUM_RETURN : wing === 9 ? MARKET_RETURN : wing === 10 ? ENCHANT_RETURN : WILDS_RETURN;
    const yard = ensureSmith(sheets, kind);
    if (yard) ctx.drawImage(yard, 0, 0);
    paintFlatPortal(ctx, back.x, back.y, s.clock, "home");
    if (sheets.idle) {
      drawCastRite(ctx, sheets, s);
      paintPlayer(ctx, sheets, s);
      drawSpell(ctx, sheets, s);
    }
    if (s.cross) {
      const u = Math.max(0, Math.min(1, s.cross.t / 0.85));
      const a = u < 0.5 ? u * 2 : (1 - u) * 2;
      ctx.fillStyle = kind === "quarry" ? `rgba(210, 150, 110, ${0.1 + a * 0.45})` : kind === "sanctum" ? `rgba(180, 160, 210, ${0.1 + a * 0.45})` : kind === "market" ? `rgba(220, 170, 90, ${0.1 + a * 0.45})` : kind === "enchant" ? `rgba(170, 196, 224, ${0.1 + a * 0.45})` : kind === "wilds" ? `rgba(120, 190, 180, ${0.1 + a * 0.45})` : wing === 5 ? `rgba(180, 220, 160, ${0.1 + a * 0.45})` : `rgba(230, 200, 120, ${0.1 + a * 0.45})`;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    return;
  }
  if (wing === 12) {
    const well = ensureDescent();
    if (well) ctx.drawImage(well, 0, 0);
    paintFlatPortal(ctx, DESCENT_RETURN.x, DESCENT_RETURN.y, s.clock, "home");
    if (sheets.idle) {
      drawCastRite(ctx, sheets, s);
      paintPlayer(ctx, sheets, s);
      drawSpell(ctx, sheets, s);
    }
    if (s.cross) {
      const u = Math.max(0, Math.min(1, s.cross.t / 0.85));
      const a = u < 0.5 ? u * 2 : (1 - u) * 2;
      ctx.fillStyle = `rgba(90, 140, 170, ${0.1 + a * 0.45})`;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    return;
  }
  if (wing !== 0) {
    if (wing === 1) {
      drawSvarga(ctx, s.clock, sheets.svarga);
      const angels = svargaAngels(s.clock).sort((a, b) => a.y - b.y);
      for (const a of angels) if (a.y <= s.y) paintAngel(ctx, sheets, a);
      if (sheets.idle) drawCastRite(ctx, sheets, s);
      if (sheets.idle) paintPlayer(ctx, sheets, s);
      for (const a of angels) if (a.y > s.y) paintAngel(ctx, sheets, a);
      drawRealmBelow(ctx, 1, s.clock, sheets);
    } else {
      drawNaraka(ctx, s.clock, sheets.naraka);
      const demon = sheets.demonMage ? narakaDemon(s.clock) : null;
      if (demon && demon.y <= s.y && sheets.demonMage) paintDemon(ctx, sheets.demonMage, demon);
      if (sheets.idle) drawCastRite(ctx, sheets, s);
      if (sheets.idle) paintPlayer(ctx, sheets, s);
      if (demon && demon.y > s.y && sheets.demonMage) paintDemon(ctx, sheets.demonMage, demon);
      drawRealmBelow(ctx, -1, s.clock, sheets);
    }
    drawRealmGate(ctx, s, sheets);
    if (sheets.idle && playerInPortal(s)) paintPlayer(ctx, sheets, s);
    if (sheets.idle) drawSpell(ctx, sheets, s);
    if (s.cross) {
      const u = Math.max(0, Math.min(1, s.cross.t / 0.85));
      const a = u < 0.5 ? u * 2 : (1 - u) * 2;
      ctx.fillStyle = wing === 1 ? `rgba(255, 228, 160, ${0.12 + a * 0.78})` : `rgba(20, 8, 6, ${0.2 + a * 0.75})`;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    return;
  }
  drawSpace(ctx, s.clock, sheets.space);
  const yard = sheets.yard;
  const plate = farmPlate(sheets, farmSeed(s));
  if (plate) ctx.drawImage(plate, 0, 0);
  else if (yard && yard.naturalWidth > 0) ctx.drawImage(yard, 0, 0, WORLD_W, PLATE, 0, 0, WORLD_W, PLATE);
  drawMosaicFloors(ctx, s.clock, s.wet, yard, sheets.svarga, sheets.naraka);
  paintDnaHole(ctx, DESCENT_DOOR.x, DESCENT_DOOR.y, s.clock);
  paintFlatPortal(ctx, ENCHANT_DOOR.x, ENCHANT_DOOR.y, s.clock, "enchant");
  paintFlatPortal(ctx, WILDS_DOOR.x, WILDS_DOOR.y, s.clock, "wilds");
  paintFlatPortal(ctx, QUARRY_DOOR.x, QUARRY_DOOR.y, s.clock, "quarry");
  paintFlatPortal(ctx, SANCTUM_DOOR.x, SANCTUM_DOOR.y, s.clock, "sanctum");
  paintFlatPortal(ctx, MARKET_DOOR.x, MARKET_DOOR.y, s.clock, "market");
  paintFlatPortal(ctx, ARMOUR_DOOR.x, ARMOUR_DOOR.y, s.clock, "armour");
  paintFlatPortal(ctx, WEAPON_DOOR.x, WEAPON_DOOR.y, s.clock, "weapon");
  paintFlatPortal(ctx, RING_DOOR.x, RING_DOOR.y, s.clock, "ring");
  paintFlatPortal(ctx, COMBAT_DOOR.x, COMBAT_DOOR.y, s.clock, "combat");
  paintFlatPortal(ctx, GROVE_DOOR.x, GROVE_DOOR.y, s.clock, "skill");

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

  for (const p of s.plots) drawPlotSoil(ctx, sheets, p);
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

  type D = { y: number; x?: number; paint: () => void };
  const queue: D[] = [];
  const over: D[] = [];
  const stage = (y: number, paint: () => void, x?: number) => {
    const d = { y, x, paint };
    queue.push(d);
    if (onFarmFrame(y)) over.push(d);
  };
  for (const a of s.animals) {
    if (a.kind === "cow") continue;
    const moving = a.pause <= 0;
    const scale = a.kind === "goat" ? 0.46 : 0.56;
    const idle = sheets[a.kind === "goat" ? "goatIdle" : "roosterIdle"];
    const walk = sheets[a.kind === "goat" ? "goatWalk" : "roosterWalk"];
    const footY = 66;
    const rate = 8;
    stage(a.y, () => drawAnimal(ctx, idle, walk, s, a.x, a.y, a.dir, moving, scale, footY, rate), a.x);
  }
  const black = sheets.blackCat;
  if (black && black.naturalWidth > 0) {
    stage(s.cat.y, () => {
      const clip = catClip(s.cat.clip);
      const fps = clip.kind === "run" ? 12 : clip.kind === "walk" ? 8 : clip.kind === "jump" ? 10 : clip.kind === "sleep" ? 1.6 : 6;
      const col = Math.floor((s.cat.clipT ?? s.clock) * fps) % Math.max(1, clip.frames);
      blit(ctx, black, col * CAT_CELL, clip.row * CAT_CELL, CAT_CELL, CAT_CELL, s.cat.x, s.cat.y, 0.32, false, 32, 63);
    }, s.cat.x);
  } else {
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
      stage(s.cat.y, () => {
        const frames = Math.max(1, Math.floor(catSheet.width / 64));
        const col = moving ? Math.floor(s.clock * (mode === "run" ? 12 : 8)) % frames : Math.floor(s.clock * 2) % frames;
        blit(ctx, catSheet, col * 64, 0, 64, 64, s.cat.x, s.cat.y, 0.36, s.cat.face > 0, 32, 48);
      }, s.cat.x);
    }
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
    for (const b of s.birds) stage(b.y, () => paintBird(ctx, sheets, b), b.x);
  }
  if (s.hand) queue.push({ y: s.hand.y, paint: () => paintHand(ctx, sheets, s) });
  if (s.xiang64) stage(s.xiang64.y, () => paintXiang64(ctx, sheets, s), s.xiang64.x);
  if (s.maid) stage(s.maid.y, () => paintMaid(ctx, sheets, s), s.maid.x);
  if (sheets.idle) {
    stage(s.y - 1, () => drawCastRite(ctx, sheets, s), s.x);
    stage(s.y, () => paintPlayer(ctx, sheets, s), s.x);
  }
  const cover: Array<() => void> = [];
  const behindCrop = (x: number, y: number) => {
    for (const p of s.plots) {
      if (!p.crop || p.stage < 1) continue;
      const w = p.w || 20;
      const front = p.y + (p.h || 16) / 2;
      if (x >= p.x - w / 2 - 8 && x <= p.x + w / 2 + 8 && y < front) return true;
    }
    return false;
  };
  for (const p of s.plots) {
    if (!p.crop || p.stage === 0) continue;
    const foot = Math.round(p.y + (p.h || 16) / 2 + 12);
    const paint = () => {
      drawPlotCrop(ctx, sheets, p);
      if (p.watered && p.stage > 0) {
        const bob = Math.sin(s.clock * 6 + p.x) > 0 ? 0 : 1;
        ctx.fillStyle = "#b7e6f5";
        ctx.fillRect(p.x + 5, p.y - 7 + bob, 2, 2);
      }
    };
    queue.push({ y: foot, paint });
    if (p.stage >= 2) cover.push(paint);
  }
  const flowerSheet = sheets.flowers;
  if (flowerSheet && s.flowers) {
    for (const f of s.flowers) {
      stage(Math.round(f.y + f.h / 2 + 8), () => drawFlower(ctx, flowerSheet, f, s.clock));
    }
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
  drawFarmFrame(ctx, s.clock);
  if (sheets.campfire) drawCampfire(ctx, sheets.campfire, s.clock);
  drawSideGates(ctx, s, sheets);
  over.sort((a, b) => a.y - b.y);
  for (const d of over) d.paint();
  for (const paint of cover) paint();
  drawFarmFrame(ctx, s.clock);
  drawSideGates(ctx, s, sheets);
  for (const d of over) {
    if (d.x == null || behindCrop(d.x, d.y)) continue;
    d.paint();
  }
  if ((s.wing ?? 0) === 0 && sheets.occlude && sheets.occlude.naturalWidth > 0) {
    ctx.drawImage(sheets.occlude, 0, 0, WORLD_W, PLATE, 0, 0, WORLD_W, PLATE);
  }
  if ((s.wing ?? 0) === 0 && sheets.campfire) drawCampfire(ctx, sheets.campfire, s.clock);
  drawFarmFrame(ctx, s.clock);
  drawSideGates(ctx, s, sheets);
  for (const d of over) {
    if (d.y < 188) continue;
    if (d.x != null && behindCrop(d.x, d.y)) continue;
    d.paint();
  }
  const penned = s.animals.find((a) => a.kind === "goat" && (s.goatPen ?? 1) !== 2);
  if (
    penned &&
    penned.x >= GOAT_PEN.x - 6 &&
    penned.x <= GOAT_PEN.x + GOAT_PEN.w + 6 &&
    penned.y >= GOAT_PEN.y - 6 &&
    penned.y <= GOAT_PEN.y + GOAT_PEN.h + 12
  ) {
    drawAnimal(ctx, sheets.goatIdle, sheets.goatWalk, s, penned.x, penned.y, penned.dir, penned.pause <= 0, 0.46, 66, 8);
  }
  if (sheets.idle && (playerInPortal(s) || feetOnPath(sheets, s.x, s.y)) && !onFarmFrame(s.y)) paintPlayer(ctx, sheets, s);
  drawSpell(ctx, sheets, s);

  const wash = skyWash(s.time);
  if (wash) {
    ctx.fillStyle = `rgba(${wash.tone}, ${wash.alpha})`;
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
          if (py < 0 || py >= landH || px < 0 || px >= WORLD_W || portalCovers(px, py)) continue;
          ctx.fillStyle = k < 2 ? `rgba(236, 244, 252, ${fade})` : `rgba(150, 186, 208, ${fade * 0.35})`;
          ctx.fillRect(px, py, 1, 1);
        }
      } else if ((n & 3) === 0) {
        const frame = Math.min(3, Math.floor(((t - 0.82) / 0.18) * 4));
        const blot = (dx: number, dy: number, a: number, bright: boolean) => {
          const px = x + dx;
          const py = ground + dy;
          if (px < 0 || py < 0 || px >= WORLD_W || py >= landH || portalCovers(px, py)) return;
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
  drawUnderside(ctx, sheets.vimana);
  drawFarmRack(ctx, s);
  drawVimanaTone(ctx, s.time);
  drawVimanaLight(ctx, s.clock);
  drawGoatSlash(ctx, s);
}
