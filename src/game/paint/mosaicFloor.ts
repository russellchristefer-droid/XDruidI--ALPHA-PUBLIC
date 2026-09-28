/** Opaque magic floors. Sidewalk is a mosaic pavement. Courtyard is an inlaid sealing floor. */

const W = 347;
const SIDE_Y = 192;
const SIDE_H = 40;
const COURT_Y = 232;
const FLOOR_END = 528;
const FLOOR_H = FLOOR_END - SIDE_Y;

const INK = "#0c0a08";
const BLACK = "#1c1814";
const BLACK_H = "#302820";
const WHITE = "#ece2cc";
const WHITE_H = "#fff8e8";
const WHITE_S = "#beb08a";
const GOLD = "#e2b657";
const GOLD_H = "#ffecaa";
const GOLD_D = "#785018";
const GOLD_M = "#b08034";
const IVORY = "#d6c4a0";
const IVORY_B = "#c4ae86";
const LIGHT = "#ead8b4";
const SHADE = "#6e5438";
const GROUT = "#302418";
const LAPIS = "#3a5280";
const LAPIS_H = "#6e8cb0";
const LAPIS_D = "#20304a";
const SUN = "#fff4d2";
const PEARL = "#d8d0be";
const TRI = "#e8c46e";
const CURB = "#4e3824";
const VIOLET = "#6a3a8a";
const VIOLET_H = "#c49adf";
const EMERALD = "#1f6a48";
const EMERALD_H = "#8ed4ae";

type Motif = "plain" | "diamond" | "square" | "cross" | "bars" | "medallion";

let plate: HTMLCanvasElement | null = null;

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || iy < 0 || ix >= W || iy >= FLOOR_H) return;
  ctx.fillStyle = color;
  ctx.fillRect(ix, iy, 1, 1);
}

function line(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string): void {
  const n = Math.max(Math.abs(Math.round(x1) - Math.round(x0)), Math.abs(Math.round(y1) - Math.round(y0)), 1);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    px(ctx, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, color);
  }
}

function disk(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string): void {
  const rr = r * r;
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= rr) px(ctx, cx + x, cy + y, color);
    }
  }
}

function band(ctx: CanvasRenderingContext2D, cx: number, cy: number, r0: number, r1: number, color: string): void {
  const reach = Math.ceil(r1);
  for (let y = -reach; y <= reach; y++) {
    for (let x = -reach; x <= reach; x++) {
      const d = Math.hypot(x, y);
      if (d >= r0 && d <= r1) px(ctx, cx + x, cy + y, color);
    }
  }
}

function inside(x: number, y: number, pts: ReadonlyArray<readonly [number, number]>): boolean {
  let hit = false;
  let j = pts.length - 1;
  for (let i = 0; i < pts.length; i++) {
    const xi = pts[i]![0];
    const yi = pts[i]![1];
    const xj = pts[j]![0];
    const yj = pts[j]![1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-9) + xi) hit = !hit;
    j = i;
  }
  return hit;
}

function fillPoly(ctx: CanvasRenderingContext2D, pts: ReadonlyArray<readonly [number, number]>, color: string): void {
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
      if (inside(x + 0.5, y + 0.5, pts)) px(ctx, x, y, color);
    }
  }
}

function starPts(cx: number, cy: number, rOut: number, rIn: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rOut : rIn;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

function strokePoly(ctx: CanvasRenderingContext2D, pts: ReadonlyArray<readonly [number, number]>, color: string): void {
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    line(ctx, a[0], a[1], b[0], b[1], color);
  }
}

function lodgeMark(ctx: CanvasRenderingContext2D, cx: number, cy: number, mirror: number): void {
  disk(ctx, cx, cy, 8, INK);
  band(ctx, cx, cy, 7, 8, GOLD);
  line(ctx, cx, cy - 5, cx - 5 * mirror, cy + 4, GOLD_H);
  line(ctx, cx + mirror, cy - 5, cx - 4 * mirror, cy + 4, GOLD);
  line(ctx, cx, cy - 5, cx + 5 * mirror, cy + 4, GOLD);
  line(ctx, cx + mirror, cy - 5, cx + 6 * mirror, cy + 4, GOLD_D);
  const ox = -6 * mirror;
  for (let i = 0; i < 7; i++) {
    px(ctx, cx + ox, cy - 1 + i, GOLD_H);
    px(ctx, cx + ox + mirror, cy - 1 + i, GOLD_D);
  }
  for (let i = 0; i < 6; i++) {
    px(ctx, cx + ox + i * mirror, cy + 5, GOLD);
    px(ctx, cx + ox + i * mirror, cy + 4, GOLD_H);
  }
}

function roundel(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  disk(ctx, cx, cy, 5, INK);
  band(ctx, cx, cy, 4, 5, GOLD_D);
  fillPoly(ctx, starPts(cx, cy, 3.2, 1.4), GOLD_H);
  px(ctx, cx, cy, SUN);
}

function courtMotif(tx: number, ty: number): Motif {
  const dx = Math.abs(tx - 21);
  const dy = Math.abs(ty - 18);
  if (dx <= 1 && dy <= 1) return "medallion";
  if (dx === 0 || dy === 0) return "cross";
  if (dx === dy && dx >= 8 && dx <= 14) return "diamond";
  if (dx > 15 && dy > 15 && (dx + dy) % 4 === 0) return "cross";
  return "plain";
}

function bake(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, FLOOR_H);

  for (let y = 6; y < 34; y++) {
    for (let x = 0; x < 344; x++) {
      const tx = Math.floor(x / 4);
      const ty = Math.floor((y - 6) / 4);
      const lx = x % 4;
      const ly = (y - 6) % 4;
      const light = (tx + ty) % 2 === 0;
      const edge = ly === 0 || lx === 0;
      const shade = ly === 3 || lx === 3;
      const color = light ? (edge ? WHITE_H : shade ? WHITE_S : WHITE) : edge ? BLACK_H : shade ? INK : BLACK;
      px(ctx, x, y, color);
    }
  }
  for (let y = 6; y < 34; y++) {
    if ((y - 6) % 4 !== 0) continue;
    for (let x = 0; x < 344; x++) px(ctx, x, y, GROUT);
  }
  for (let x = 0; x < 344; x += 4) {
    for (let y = 6; y < 34; y++) px(ctx, x, y, GROUT);
  }

  for (let y = 6; y < 34; y++) {
    for (let x = 0; x < 344; x++) {
      if (x % 4 !== 2 || (y - 6) % 4 !== 2) continue;
      const tx = Math.floor(x / 4);
      const ty = Math.floor((y - 6) / 4);
      if (Math.abs(x - 172) < 16 && Math.abs(y - 20) < 14) continue;
      const light = (tx + ty) % 2 === 0;
      const mark = (tx + ty) % 6;
      if (mark === 0) px(ctx, x, y, light ? GOLD : LAPIS_H);
      else if (mark === 3) px(ctx, x, y, light ? GOLD_D : LAPIS);
    }
  }
  for (let x = 8; x < 336; x += 8) {
    if (Math.abs(x - 172) < 22) continue;
    px(ctx, x, 7, GOLD_H);
    px(ctx, x - 1, 8, GOLD);
    px(ctx, x + 1, 8, GOLD);
    px(ctx, x, 32, GOLD_M);
    px(ctx, x, 31, GOLD_D);
  }

  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 344; x++) {
      const cell = Math.floor(x / 6);
      const lx = x % 6;
      const stone = cell % 2 === 0 ? lx <= y : lx >= 5 - y;
      px(ctx, x, y, stone ? (lx === 0 ? WHITE_H : WHITE) : y === 0 ? BLACK_H : BLACK);
      px(ctx, x, 39 - y, stone ? (y === 0 ? WHITE_S : WHITE) : y === 0 ? INK : BLACK);
    }
  }
  for (let x = 0; x < 344; x++) {
    px(ctx, x, 6, GOLD_D);
    px(ctx, x, 33, GOLD_D);
    if (x % 2 === 0) {
      px(ctx, x, 5, GOLD);
      px(ctx, x, 34, GOLD_M);
    }
  }

  const walk = 20;
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    for (let t = 16; t <= 19; t++) px(ctx, 172 + Math.cos(a) * t, walk + Math.sin(a) * t, i % 2 === 0 ? GOLD_H : GOLD);
  }
  disk(ctx, 172, walk, 13, INK);
  band(ctx, 172, walk, 12, 13, GOLD_D);
  band(ctx, 172, walk, 11, 12, GOLD);
  const star = starPts(172, walk, 10, 4);
  fillPoly(ctx, star, GOLD_M);
  for (let i = 0; i < 10; i += 2) {
    const tip = star[i]!;
    const prev = star[(i + 9) % 10]!;
    const next = star[(i + 1) % 10]!;
    fillPoly(
      ctx,
      [
        tip,
        [(tip[0] + prev[0]) / 2, (tip[1] + prev[1]) / 2],
        [(tip[0] + next[0]) / 2, (tip[1] + next[1]) / 2],
      ],
      GOLD_H,
    );
  }
  fillPoly(ctx, [[166, walk + 4], [178, walk + 4], [172, walk - 5]], GOLD_D);
  for (let y = -2; y <= 2; y++) {
    const span = 3 - Math.abs(y);
    for (let x = -span; x <= span; x++) px(ctx, 172 + x, walk + 1 + y, WHITE);
  }
  px(ctx, 172, walk + 1, INK);
  px(ctx, 173, walk + 1, LAPIS_D);
  px(ctx, 171, walk, WHITE_H);

  lodgeMark(ctx, 172 - 62, walk, 1);
  lodgeMark(ctx, 172 + 62, walk, -1);
  for (const dx of [-154, -118, 118, 154]) roundel(ctx, 172 + dx, walk);

  const courtTop = SIDE_H;
  for (let ty = 0; ty < 37; ty++) {
    for (let tx = 0; tx < 43; tx++) {
      const x0 = tx * 8;
      const y0 = courtTop + ty * 8;
      const rim = tx === 0 || tx === 42 || ty === 0 || ty === 36;
      const dist = Math.hypot(tx - 21, ty - 18);
      let tone = rim ? CURB : (tx + ty) % 2 === 0 ? IVORY : IVORY_B;
      if (!rim && dist > 9 && dist < 11) tone = (tx + ty) % 2 === 0 ? LAPIS : LAPIS_D;
      else if (!rim && dist > 13 && dist < 14.6) tone = (tx + ty) % 2 === 0 ? "#8a6230" : GOLD_D;
      ctx.fillStyle = tone;
      ctx.fillRect(x0, y0, 8, 8);
      if (rim) continue;
      px(ctx, x0, y0, LIGHT);
      px(ctx, x0 + 1, y0, LIGHT);
      px(ctx, x0, y0 + 1, LIGHT);
      px(ctx, x0 + 7, y0 + 7, SHADE);
      px(ctx, x0 + 6, y0 + 7, SHADE);
      px(ctx, x0 + 7, y0 + 6, SHADE);
      px(ctx, x0 + 2, y0 + 2, (tx + ty) % 2 === 0 ? WHITE : IVORY);
      px(ctx, x0 + 5, y0 + 5, SHADE);
      const mx = x0 + 3;
      const my = y0 + 4;
      const motif = courtMotif(tx, ty);
      if (motif === "cross") {
        px(ctx, mx, my, GOLD_H);
        px(ctx, mx - 1, my, GOLD);
        px(ctx, mx + 1, my, GOLD);
        px(ctx, mx, my - 1, GOLD);
        px(ctx, mx, my + 1, GOLD_D);
      } else if (motif === "diamond") {
        px(ctx, mx, my, SUN);
        px(ctx, mx, my - 1, GOLD_H);
        px(ctx, mx - 1, my, GOLD);
        px(ctx, mx + 1, my, GOLD);
        px(ctx, mx, my + 1, GOLD_D);
      } else if ((tx + ty) % 5 === 0) {
        const pip = (tx + ty) % 10 === 0 ? EMERALD_H : (tx + ty) % 10 === 5 ? VIOLET_H : GOLD;
        px(ctx, mx, my, pip);
      }
      px(ctx, x0, y0, GROUT);
    }
  }

  const cx = 172;
  const cy = courtTop + 18 * 8 + 4;
  band(ctx, cx, cy, 102, 112, GOLD_D);
  band(ctx, cx, cy, 104, 110, GOLD);
  band(ctx, cx, cy, 104, 105, GOLD_H);
  band(ctx, cx, cy, 60, 72, LAPIS_D);
  band(ctx, cx, cy, 62, 70, LAPIS);
  band(ctx, cx, cy, 62, 63, LAPIS_H);
  band(ctx, cx, cy, 84, 90, VIOLET);
  band(ctx, cx, cy, 85, 87, VIOLET_H);
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    const r0 = i % 2 === 0 ? 74 : 76;
    line(ctx, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * (r0 + 4), cy + Math.sin(a) * (r0 + 4), i % 2 === 0 ? EMERALD_H : GOLD_H);
  }

  for (const d of [118, 122]) {
    line(ctx, cx - d, cy - d, cx + d, cy - d, GOLD_D);
    line(ctx, cx - d, cy + d, cx + d, cy + d, GOLD_D);
    line(ctx, cx - d, cy - d, cx - d, cy + d, GOLD_D);
    line(ctx, cx + d, cy - d, cx + d, cy + d, GOLD_D);
  }
  line(ctx, cx - 120, cy - 120, cx + 120, cy - 120, GOLD_H);
  line(ctx, cx - 120, cy + 120, cx + 120, cy + 120, GOLD);
  line(ctx, cx - 120, cy - 120, cx - 120, cy + 120, GOLD_H);
  line(ctx, cx + 120, cy - 120, cx + 120, cy + 120, GOLD);

  const up: Array<[number, number]> = [];
  const dn: Array<[number, number]> = [];
  const R = 50;
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
    up.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
    const b = Math.PI / 2 + (i * Math.PI * 2) / 3;
    dn.push([cx + Math.cos(b) * R, cy + Math.sin(b) * R]);
  }
  fillPoly(ctx, up, TRI);
  fillPoly(ctx, dn, PEARL);
  for (let y = cy - R - 1; y <= cy + R + 1; y++) {
    for (let x = cx - R - 1; x <= cx + R + 1; x++) {
      if (inside(x + 0.5, y + 0.5, up) && inside(x + 0.5, y + 0.5, dn)) px(ctx, x, y, "#f3e2b0");
    }
  }
  strokePoly(ctx, up, GOLD_D);
  strokePoly(ctx, dn, GOLD_D);

  fillPoly(ctx, starPts(cx, cy, 36, 16), EMERALD);
  fillPoly(ctx, starPts(cx, cy, 32, 14), "#c6e090");
  fillPoly(ctx, starPts(cx, cy, 22, 9), GOLD);
  fillPoly(ctx, starPts(cx, cy, 20, 8), GOLD_H);
  disk(ctx, cx, cy, 7, SUN);
  band(ctx, cx, cy, 6, 7, GOLD);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + 0.2;
    line(ctx, cx + Math.cos(a) * 3, cy + Math.sin(a) * 3, cx + Math.cos(a) * 5, cy + Math.sin(a) * 5, GOLD_D);
  }
  px(ctx, cx, cy, GOLD_D);
  px(ctx, cx - 1, cy - 1, WHITE_H);
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 4;
    const sx = Math.round(cx + Math.cos(a) * 46);
    const sy = Math.round(cy + Math.sin(a) * 46);
    disk(ctx, sx, sy, 4, INK);
    band(ctx, sx, sy, 3, 4, i % 2 === 0 ? EMERALD_H : GOLD);
    px(ctx, sx, sy, SUN);
  }

  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12;
    const rr = i % 2 === 0 ? 78 : 82;
    px(ctx, Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr), i % 3 === 0 ? SUN : GOLD_H);
  }

  for (let i = 0; i < 4; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 2;
    const sx = Math.round(cx + Math.cos(a) * 87);
    const sy = Math.round(cy + Math.sin(a) * 87);
    disk(ctx, sx, sy, 10, INK);
    band(ctx, sx, sy, 8, 10, GOLD);
    fillPoly(ctx, starPts(sx, sy, 7, 3), GOLD_H);
    px(ctx, sx, sy, SUN);
  }
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const sx = Math.round(cx + Math.cos(a) * 87);
    const sy = Math.round(cy + Math.sin(a) * 87);
    disk(ctx, sx, sy, 4, LAPIS);
    band(ctx, sx, sy, 3, 4, GOLD);
    px(ctx, sx, sy, SUN);
    for (let k = 0; k < 4; k++) {
      const q = (k * Math.PI) / 2;
      px(ctx, Math.round(sx + Math.cos(q) * 2), Math.round(sy + Math.sin(q) * 2), GOLD_H);
    }
  }
  for (let i = 0; i < 32; i++) {
    const a = (i * Math.PI) / 16;
    px(ctx, Math.round(cx + Math.cos(a) * 97), Math.round(cy + Math.sin(a) * 97), i % 2 === 0 ? GOLD_H : GOLD_D);
  }
  for (const mx of [-1, 1]) {
    for (const my of [-1, 1]) {
      const sx = cx + mx * 104;
      const sy = cy + my * 100;
      for (let y = -8; y <= 8; y++) {
        for (let x = -8; x <= 8; x++) {
          const e = Math.max(Math.abs(x), Math.abs(y));
          if (e >= 7) px(ctx, sx + x, sy + y, GOLD_D);
          else if (e === 6) px(ctx, sx + x, sy + y, GOLD);
          else if (e >= 3) px(ctx, sx + x, sy + y, (x + y) % 2 === 0 ? LAPIS_D : LAPIS);
          else px(ctx, sx + x, sy + y, e <= 1 ? SUN : GOLD_H);
        }
      }
      px(ctx, sx, sy, GOLD_D);
    }
  }

  courtRite(ctx, cx, cy);
  plotBound(ctx);

  ctx.fillStyle = "#241810";
  ctx.fillRect(0, FLOOR_H - 6, W, 6);
  ctx.fillStyle = "#3a2c22";
  ctx.fillRect(0, FLOOR_H - 6, W, 2);
  ctx.fillStyle = GROUT;
  ctx.fillRect(344, 0, W - 344, FLOOR_H);
}

function courtRite(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 8;
    const px0 = Math.round(cx + Math.cos(a) * 36);
    const py0 = Math.round(cy + Math.sin(a) * 36);
    const tip = i % 2 === 0 ? 3 : 2;
    px(ctx, px0, py0, i % 2 === 0 ? SUN : GOLD_H);
    px(ctx, px0, py0 - tip, GOLD);
    px(ctx, px0 - 1, py0 - 1, GOLD_D);
    px(ctx, px0 + 1, py0 - 1, GOLD_D);
    px(ctx, px0, py0 + 1, TRI);
  }
  band(ctx, cx, cy, 28, 29, GOLD_H);
  band(ctx, cx, cy, 30, 31, GOLD_D);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const sx = Math.round(cx + Math.cos(a) * 44);
    const sy = Math.round(cy + Math.sin(a) * 44);
    disk(ctx, sx, sy, 3, INK);
    band(ctx, sx, sy, 2, 3, GOLD);
    px(ctx, sx, sy, SUN);
  }
  for (let q = 0; q < 4; q++) {
    const ox = q % 2 === 0 ? -1 : 1;
    const oy = q < 2 ? -1 : 1;
    const sx = cx + ox * 16;
    const sy = cy + oy * 16;
    px(ctx, sx, sy, SUN);
    px(ctx, sx - ox, sy, GOLD_H);
    px(ctx, sx, sy - oy, GOLD_H);
    px(ctx, sx + ox, sy + oy, GOLD_D);
  }
  const span = 52;
  line(ctx, cx - span, cy - span, cx + span, cy - span, GOLD);
  line(ctx, cx + span, cy - span, cx + span, cy + span, GOLD_D);
  line(ctx, cx + span, cy + span, cx - span, cy + span, GOLD_D);
  line(ctx, cx - span, cy + span, cx - span, cy - span, GOLD);
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 6;
    const r0 = 64;
    const r1 = i % 3 === 0 ? 70 : 67;
    line(
      ctx,
      cx + Math.cos(a) * r0,
      cy + Math.sin(a) * r0,
      cx + Math.cos(a) * r1,
      cy + Math.sin(a) * r1,
      i % 3 === 0 ? SUN : GOLD_D,
    );
  }
  px(ctx, cx, cy - 40, SUN);
  px(ctx, cx - 1, cy - 39, GOLD);
  px(ctx, cx + 1, cy - 39, GOLD);
  px(ctx, cx, cy - 38, GOLD_D);
  px(ctx, cx + 40, cy, LAPIS_H);
  px(ctx, cx + 41, cy - 1, GOLD_H);
  px(ctx, cx + 42, cy, LAPIS);
  px(ctx, cx + 41, cy + 1, GOLD);
  px(ctx, cx, cy + 40, GOLD_D);
  px(ctx, cx - 1, cy + 41, SHADE);
  px(ctx, cx + 1, cy + 41, SHADE);
  px(ctx, cx, cy + 39, SUN);
  px(ctx, cx - 40, cy, GOLD_H);
  px(ctx, cx - 41, cy - 1, GOLD);
  px(ctx, cx - 42, cy, GOLD_D);
  px(ctx, cx - 41, cy + 1, LAPIS_H);
}

function plotBound(ctx: CanvasRenderingContext2D): void {
  const x0 = 16;
  const y0 = SIDE_H;
  const x1 = 331;
  const y1 = SIDE_H + 287;
  for (let x = x0; x <= x1; x++) {
    px(ctx, x, y0, x % 4 === 0 ? GOLD_H : GOLD);
    px(ctx, x, y0 + 1, x % 6 === 0 ? EMERALD_H : LAPIS);
    px(ctx, x, y1, x % 4 === 0 ? GOLD_H : GOLD_D);
    px(ctx, x, y1 - 1, x % 6 === 0 ? VIOLET_H : LAPIS_D);
  }
  for (let y = y0; y <= y1; y++) {
    px(ctx, x0, y, y % 4 === 0 ? GOLD_H : GOLD);
    px(ctx, x0 + 1, y, y % 6 === 0 ? EMERALD_H : LAPIS);
    px(ctx, x1, y, y % 4 === 0 ? GOLD_H : GOLD_D);
    px(ctx, x1 - 1, y, y % 6 === 0 ? VIOLET_H : LAPIS_D);
  }
  for (const [sx, sy] of [
    [x0 + 4, y0 + 4],
    [x1 - 4, y0 + 4],
    [x0 + 4, y1 - 4],
    [x1 - 4, y1 - 4],
  ] as const) {
    disk(ctx, sx, sy, 4, INK);
    band(ctx, sx, sy, 3, 4, GOLD);
    px(ctx, sx, sy, SUN);
    px(ctx, sx, sy - 2, GOLD_H);
    px(ctx, sx - 2, sy, LAPIS_H);
    px(ctx, sx + 2, sy, EMERALD_H);
    px(ctx, sx, sy + 2, VIOLET_H);
  }
  const ix0 = x0 + 12;
  const iy0 = y0 + 12;
  const ix1 = x1 - 12;
  const iy1 = y1 - 12;
  for (let x = ix0; x <= ix1; x += 2) {
    px(ctx, x, iy0, GOLD_H);
    px(ctx, x, iy1, GOLD_D);
  }
  for (let y = iy0; y <= iy1; y += 2) {
    px(ctx, ix0, y, GOLD_H);
    px(ctx, ix1, y, GOLD_D);
  }
  for (const [sx, sy] of [
    [(x0 + x1) >> 1, y0 + 4],
    [(x0 + x1) >> 1, y1 - 4],
    [x0 + 4, (y0 + y1) >> 1],
    [x1 - 4, (y0 + y1) >> 1],
  ] as const) {
    disk(ctx, sx, sy, 5, INK);
    band(ctx, sx, sy, 4, 5, GOLD);
    band(ctx, sx, sy, 2, 3, LAPIS_H);
    px(ctx, sx, sy, SUN);
  }
}

const STONE_LIGHT = new Set([0xece2cc, 0xfff8e8, 0xbeb08a]);
const STONE_DARK = new Set([0x1c1814, 0x302820]);
const STONE_COURT = new Set([0xd6c4a0, 0xc4ae86, 0xead8b4, 0x6e5438, 0x4e3824]);

function stoneGrain(x: number, y: number): number {
  let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  const v = (n >>> 24) & 255;
  return 0.84 + (v / 255) * 0.32;
}

function dress(ctx: CanvasRenderingContext2D, _svarga?: HTMLImageElement, _naraka?: HTMLImageElement, _yard?: HTMLImageElement): void {
  const img = ctx.getImageData(0, 0, W, FLOOR_H);
  const d = img.data;
  for (let y = 0; y < FLOOR_H - 6; y++) {
    for (let x = 0; x < 344; x++) {
      if (y < SIDE_H) {
        const dx = x - 172;
        const dy = y - 20;
        if (dx * dx + dy * dy < 256) continue;
      }
      const i = (y * W + x) * 4;
      const key = ((d[i]! << 16) | (d[i + 1]! << 8) | d[i + 2]!) >>> 0;
      const stone =
        (y < SIDE_H && (STONE_LIGHT.has(key) || STONE_DARK.has(key))) ||
        key === 0x4e3824 ||
        key === 0x6e5438 ||
        (y >= SIDE_H && STONE_COURT.has(key));
      if (!stone) continue;
      const f = stoneGrain(x, y);
      d[i] = Math.max(0, Math.min(255, Math.round(d[i]! * f)));
      d[i + 1] = Math.max(0, Math.min(255, Math.round(d[i + 1]! * f)));
      d[i + 2] = Math.max(0, Math.min(255, Math.round(d[i + 2]! * f)));
    }
  }
  ctx.putImageData(img, 0, 0);
}

function ensurePlate(svarga?: HTMLImageElement, naraka?: HTMLImageElement, yard?: HTMLImageElement): HTMLCanvasElement | null {
  if (plate) return plate;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = FLOOR_H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  bake(ctx);
  dress(ctx);
  plate = canvas;
  return plate;
}

const PUDDLES: Array<[number, number, number, number]> = [
  [48, 96, 18, 6],
  [250, 140, 22, 5],
  [120, 220, 16, 5],
  [200, 270, 20, 6],
  [70, 300, 14, 4],
];

function paintTileSparkle(ctx: CanvasRenderingContext2D, clock: number): void {
  for (let i = 0; i < 22; i++) {
    const n = Math.imul(i + 17, 1103515245) >>> 0;
    const period = 3.2 + (i % 6) * 0.4;
    const phase = (clock / period + (n % 97) / 97) % 1;
    if (phase > 0.16) continue;
    const fade = 1 - phase / 0.16;
    const onSide = i % 3 === 0;
    const span = onSide ? SIDE_H - 6 : FLOOR_END - COURT_Y - 10;
    const x = 6 + (n % (W - 14));
    const y = (onSide ? SIDE_Y + 2 : COURT_Y + 4) + ((n >>> 10) % span);
    const tx = Math.floor(x / 8) * 8 + 3;
    const ty = Math.floor(y / 8) * 8 + 3;
    ctx.globalAlpha = 0.25 + fade * 0.7;
    ctx.fillStyle = i % 2 === 0 ? "#fff8e8" : "#e2b657";
    ctx.fillRect(tx, ty, 1, 1);
    ctx.globalAlpha = fade * 0.4;
    ctx.fillRect(tx - 1, ty, 1, 1);
    ctx.fillRect(tx + 1, ty, 1, 1);
    ctx.fillRect(tx, ty - 1, 1, 1);
    ctx.fillRect(tx, ty + 1, 1, 1);
  }
  ctx.globalAlpha = 1;
}

/** Draw the sidewalk and courtyard as one solid floor. Grass cannot show through. */
export function drawMosaicFloors(
  ctx: CanvasRenderingContext2D,
  clock: number,
  wet: number,
  yard?: HTMLImageElement,
  svarga?: HTMLImageElement,
  naraka?: HTMLImageElement,
): void {
  const baked = ensurePlate(svarga, naraka, yard);
  if (baked) ctx.drawImage(baked, 0, SIDE_Y);
  else {
    ctx.fillStyle = "#5c4634";
    ctx.fillRect(0, SIDE_Y, W, FLOOR_H);
  }
  if (yard) ctx.drawImage(yard, 0, 148, W, 44, 0, 148, W, 44);
  paintTileSparkle(ctx, clock);

  const glint = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(clock * 2.2));
  ctx.fillStyle = `rgba(255, 244, 214, ${0.2 + glint * 0.45})`;
  for (let ty = 0; ty < 37; ty++) {
    for (let tx = 0; tx < 43; tx++) {
      if (courtMotif(tx, ty) === "plain") continue;
      if ((tx * 13 + ty * 7 + Math.floor(clock * 2)) % 17 !== 0) continue;
      ctx.fillRect(tx * 8 + 3, COURT_Y + ty * 8 + 3, 1, 1);
    }
  }
  const slide = Math.floor(clock * 22) % 344;
  ctx.fillStyle = "#fff8e8";
  ctx.fillRect(slide, SIDE_Y + 20, 1, 1);
  ctx.fillRect((slide + 86) % 344, SIDE_Y + 12, 1, 1);
  ctx.fillRect((slide + 172) % 344, SIDE_Y + 28, 1, 1);
  const sealX = 172;
  const sealY = COURT_Y + 18 * 8 + 4;
  const walkY = SIDE_Y + 20;
  for (let i = 0; i < 7; i++) {
    const px = Math.floor((clock * 14 + i * 48) % 340);
    ctx.fillStyle = i % 2 === 0 ? "#fff4d2" : "#e2b657";
    ctx.fillRect(px, walkY, 1, 1);
    ctx.fillStyle = i % 3 === 0 ? "#6e8cb0" : "#785018";
    ctx.fillRect((px + 338) % 344, walkY + (i % 2 === 0 ? -1 : 1), 1, 1);
  }
  const beat = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(clock * 1.5));
  ctx.fillStyle = `rgba(255, 244, 210, ${beat})`;
  ctx.fillRect(171, walkY, 2, 1);
  ctx.fillRect(172, walkY - 1, 1, 1);
  for (let i = 0; i < 12; i++) {
    const a = clock * 0.4 + (i * Math.PI) / 6;
    ctx.fillStyle = i % 2 === 0 ? "#fff4d2" : "#e2b657";
    ctx.fillRect(Math.round(sealX + Math.cos(a) * 104), Math.round(sealY + Math.sin(a) * 104), 1, 1);
  }
  for (let i = 0; i < 8; i++) {
    const a = -clock * 0.65 + (i * Math.PI) / 4;
    ctx.fillStyle = i % 2 === 0 ? "#fff6d8" : "#6e8cb0";
    ctx.fillRect(Math.round(sealX + Math.cos(a) * 66), Math.round(sealY + Math.sin(a) * 66), 1, 1);
  }
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + clock * 0.15 + (i * Math.PI) / 3;
    const bx = sealX + Math.cos(a) * 28;
    const by = sealY + Math.sin(a) * 28;
    const c = sealX + Math.cos(a + Math.PI / 3) * 28;
    const d = sealY + Math.sin(a + Math.PI / 3) * 28;
    ctx.fillStyle = i % 2 === 0 ? "#fff6d4" : "#c4a05a";
    for (let k = 0; k <= 6; k++) {
      const u = k / 6;
      ctx.fillRect(Math.round(bx + (c - bx) * u), Math.round(by + (d - by) * u), 1, 1);
    }
  }
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 2 - clock * 0.22 + (i * Math.PI) / 3;
    const bx = sealX + Math.cos(a) * 14;
    const by = sealY + Math.sin(a) * 14;
    const c = sealX + Math.cos(a + Math.PI / 3) * 14;
    const d = sealY + Math.sin(a + Math.PI / 3) * 14;
    ctx.fillStyle = i % 2 === 0 ? "#fffaf0" : "#e7b8bc";
    for (let k = 0; k <= 4; k++) {
      const u = k / 4;
      ctx.fillRect(Math.round(bx + (c - bx) * u), Math.round(by + (d - by) * u), 1, 1);
    }
  }
  const walk = (clock * 0.12) % 4;
  const side = Math.floor(walk);
  const along = walk - side;
  const corners: Array<[number, number]> = [
    [-52, -52],
    [52, -52],
    [52, 52],
    [-52, 52],
  ];
  const from = corners[side]!;
  const to = corners[(side + 1) % 4]!;
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(Math.round(sealX + from[0] + (to[0] - from[0]) * along), Math.round(sealY + from[1] + (to[1] - from[1]) * along), 1, 1);
  const breath = Math.floor(clock) % 4;
  for (let i = 0; i < 4; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 2;
    ctx.fillStyle = i === breath ? "#fffaf0" : "#e2b657";
    ctx.fillRect(Math.round(sealX + Math.cos(a) * 40), Math.round(sealY + Math.sin(a) * 40), 1, 1);
  }
  for (let i = 0; i < 5; i++) {
    const p = (clock * 0.22 + i * 0.17) % 1;
    ctx.fillStyle = i % 2 === 0 ? "#fff8ea" : "#e7b8bc";
    ctx.fillRect(sealX - 8 + i * 4, Math.round(sealY - p * 18), 1, 1);
  }
  const lamp = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(clock * 1.2));
  ctx.fillStyle = `rgba(255, 244, 210, ${lamp})`;
  for (const [dx, dy] of [
    [0, -87],
    [0, 87],
    [-87, 0],
    [87, 0],
  ] as const) {
    ctx.fillRect(sealX + dx, sealY + dy, 1, 1);
    ctx.fillRect(sealX + dx, sealY + dy - 1, 1, 1);
  }
  const perim = 316 * 2 + 288 * 2;
  const glow = (clock * 48) % perim;
  for (let i = 0; i < 8; i++) {
    const t = (glow + i * (perim / 8)) % perim;
    let x = 16;
    let y = 232;
    if (t < 316) x += t;
    else if (t < 316 + 288) {
      x = 332;
      y += t - 316;
    } else if (t < 316 * 2 + 288) {
      x = 332 - (t - 316 - 288);
      y = 520;
    } else {
      y = 520 - (t - 316 * 2 - 288);
    }
    ctx.globalAlpha = 0.35 + 0.65 * (1 - i / 8);
    ctx.fillStyle = i % 3 === 0 ? "#fff6d4" : i % 3 === 1 ? "#c49adf" : "#8ed4ae";
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    ctx.fillRect(Math.round(x), Math.round(y) + 1, 1, 1);
  }
  ctx.globalAlpha = 1;

  if (wet > 0.08) {
    const a = Math.min(0.42, wet * 0.38);
    ctx.fillStyle = `rgba(28, 44, 52, ${a})`;
    for (const [x, y, w, h] of PUDDLES) {
      if ((Math.floor(x / 8) + Math.floor(y / 8)) % 3 === 0 && wet < 0.35) continue;
      ctx.fillRect(x, COURT_Y + y, w, h);
    }
    ctx.fillStyle = `rgba(186, 206, 214, ${a * 0.35})`;
    for (const [x, y, w] of PUDDLES) ctx.fillRect(x + 1, COURT_Y + y, Math.max(1, w - 4), 1);
  }
}
