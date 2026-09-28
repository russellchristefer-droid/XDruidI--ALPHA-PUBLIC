/** Space behind every map. The world is drawn on top, so this fills the whole screen. */

const FAR = ["#1a2438", "#241820", "#1c1830", "#102028", "#201810"] as const;
const NEAR = ["#ffffff", "#7ec8ff", "#ffe14a", "#ff5a4a", "#ff4ad8", "#5aff9a", "#c080ff"] as const;

function hash(n: number): number {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return v - Math.floor(v);
}

function pix(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  if (x < 0 || y < 0) return;
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, 1, 1);
}

function disk(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, lit: string, mid: string, shade: string): void {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r) continue;
      let color = mid;
      if (x < -r * 0.25) color = shade;
      if (x > r * 0.2 && y < r * 0.15) color = lit;
      pix(ctx, cx + x, cy + y, color);
    }
  }
}

function renderMargin(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#010106";
  ctx.fillRect(0, 0, w, h);
  const dust = Math.min(900, Math.max(80, (w * h) / 700 | 0));
  for (let i = 0; i < dust; i++) {
    const x = hash(i * 3 + 1) * w | 0;
    const y = hash(i * 3 + 2) * h | 0;
    pix(ctx, x, y, i % 5 === 0 ? "#14101c" : "#0a0c14");
  }

  const veils: Array<[number, number, number, string, string, number]> = [
    [0.2, 0.32, 520, "#2a1038", "#8a3878", 11],
    [0.68, 0.26, 480, "#062028", "#1a6870", 29],
    [0.46, 0.7, 560, "#241408", "#6a4018", 47],
    [0.84, 0.55, 360, "#140828", "#4a2878", 71],
    [0.1, 0.74, 280, "#1c0c10", "#5a2018", 91],
  ];
  for (const [ux, uy, len, dustC, glow, seed] of veils) {
    wisp(ctx, ux * w, uy * h, len, dustC, glow, seed);
  }

  const farCount = Math.min(700, Math.max(100, (w * h) / 420 | 0));
  for (let i = 0; i < farCount; i++) {
    pix(ctx, hash(i * 3 + 9) * w, hash(i * 3 + 4) * h, FAR[i % FAR.length]!);
  }
  const nearCount = Math.min(90, Math.max(24, (w * h) / 4000 | 0));
  for (let i = 0; i < nearCount; i++) {
    const x = hash(i * 7 + 4) * w | 0;
    const y = hash(i * 7 + 8) * h | 0;
    const color = i % 6 === 0 ? NEAR[i % NEAR.length]! : "#c8d0dc";
    pix(ctx, x, y, color);
    if (i % 11 === 0) {
      pix(ctx, x - 1, y, "#6a7488");
      pix(ctx, x + 1, y, "#6a7488");
    }
  }

  paintMoon(ctx, w * 0.88 | 0, h * 0.18 | 0, Math.max(5, Math.min(w, h) / 64 | 0));
  paintPlanet(ctx, w * 0.18 | 0, h * 0.78 | 0, Math.max(6, Math.min(w, h) / 40 | 0), "#c8b090", "#7a6244", "#2c2014", true);
  paintPlanet(ctx, w * 0.74 | 0, h * 0.22 | 0, Math.max(3, Math.min(w, h) / 90 | 0), "#b8c8d4", "#4a6878", "#141c24", false);
  paintGalaxy(ctx, w * 0.42 | 0, h * 0.48 | 0);
  for (let i = 0; i < 9; i++) {
    const x = hash(400 + i) * w | 0;
    const y = hash(500 + i) * h | 0;
    pix(ctx, x, y, "#5a5048");
    if (i % 2 === 0) pix(ctx, x + 1, y + (i % 3) - 1, "#2a241c");
  }
}

function wisp(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  len: number,
  dust: string,
  glow: string,
  seed: number,
): void {
  let x = x0;
  let y = y0;
  let vx = hash(seed) * 2 - 1;
  let vy = hash(seed + 1) * 1.2 - 0.6;
  for (let i = 0; i < len; i++) {
    const roll = hash(seed + i * 1.7);
    if (roll > 0.22) pix(ctx, x, y, dust);
    if (roll > 0.93) pix(ctx, x + 1, y, glow);
    if (i % 17 === 0) pix(ctx, x, y + 1, dust);
    vx += (hash(seed + i * 3.1) - 0.5) * 0.45;
    vy += (hash(seed + i * 2.3) - 0.5) * 0.28;
    const sp = Math.hypot(vx, vy) || 1;
    vx = (vx / sp) * (0.8 + hash(seed + i) * 1.6);
    vy = (vy / sp) * (0.5 + hash(seed + i + 2) * 1.1);
    x += vx;
    y += vy;
    if (x < 4 || y < 4 || x > 8000 || y > 8000) break;
  }
}

function paintMoon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r) continue;
      const bx = x - r * 0.46;
      const by = y - r * 0.08;
      if (bx * bx + by * by < (r * 0.74) * (r * 0.74)) continue;
      let color = x < 0 ? "#c5d0e4" : "#f7f9ff";
      if ((x * 3 + y * 5) % 11 === 0) color = "#9aa6be";
      pix(ctx, cx + x, cy + y, color);
    }
  }
}

function paintPlanet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  lit: string,
  mid: string,
  shade: string,
  rings: boolean,
): void {
  if (rings) {
    const rx = r * 2.2;
    const ry = Math.max(2, r * 0.36);
    const ring = (front: boolean) => {
      for (let y = -ry - 1 | 0; y <= ry + 1; y++) {
        for (let x = -rx - 1 | 0; x <= rx + 1; x++) {
          const e = (x * x) / (rx * rx) + (y * y) / (ry * ry);
          if (e < 0.8 || e > 1.2) continue;
          if (front ? y < -1 : y > 1) continue;
          if (!front && x * x + y * y < (r - 1) * (r - 1)) continue;
          pix(ctx, cx + x, cy + y, Math.abs(e - 1) > 0.12 ? "#8c7b64" : "#f3e6cf");
        }
      }
    };
    ring(false);
    disk(ctx, cx, cy, r, lit, mid, shade);
    for (const row of [0, r * 0.35 | 0, -r * 0.4 | 0]) {
      for (let x = -r; x <= r; x++) {
        if (x * x + row * row > (r - 1) * (r - 1)) continue;
        if ((x + row) & 1) pix(ctx, cx + x, cy + row, "#6a4820");
      }
    }
    ring(true);
    return;
  }
  disk(ctx, cx, cy, r, lit, mid, shade);
  pix(ctx, cx - 1, cy - 1, "#f4fbff");
}

function paintGalaxy(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  for (let arm = 0; arm < 2; arm++) {
    const turn = arm * Math.PI;
    for (let i = 0; i < 90; i++) {
      const t = i / 90;
      const a = turn + t * 3.4;
      const rad = 2 + t * 16;
      const x = Math.cos(a) * rad;
      const y = Math.sin(a) * rad * 0.42;
      const color = t < 0.2 ? "#fff6d0" : t < 0.55 ? "#9eb6ff" : "#5a3888";
      pix(ctx, cx + x, cy + y, color);
      if (i % 4 === 0) pix(ctx, cx + x, cy + y + 1, "#3a2068");
    }
  }
  disk(ctx, cx, cy, 3, "#fffaf0", "#ffe9a0", "#c08040");
}

function paintComet(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  for (let i = 12; i >= 1; i--) {
    const fade = i > 8 ? "#3a4a68" : i > 4 ? "#8aa0c8" : "#d7e4ff";
    pix(ctx, x - i, y + (i >> 2), fade);
    if (i < 6) pix(ctx, x - i, y + (i >> 2) + 1, "#243048");
  }
  pix(ctx, x, y, "#fffaf0");
  pix(ctx, x + 1, y, "#fff6d0");
}

let skyPlate: { w: number; h: number; canvas: HTMLCanvasElement } | null = null;

export function drawMarginSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  _ox: number,
  _oy: number,
  _vw: number,
  _vh: number,
  time: number,
): void {
  if (w < 1 || h < 1) return;
  if (!skyPlate || skyPlate.w !== w || skyPlate.h !== h) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext("2d");
    if (!g) {
      ctx.fillStyle = "#03040c";
      ctx.fillRect(0, 0, w, h);
      return;
    }
    renderMargin(g, w, h);
    skyPlate = { w, h, canvas };
  }
  ctx.drawImage(skyPlate.canvas, 0, 0);
  for (let i = 0; i < 64; i++) {
    const x = (hash(i * 5 + 2) * w) | 0;
    const y = (hash(i * 5 + 6) * h) | 0;
    const pulse = Math.sin(time * (2.1 + (i % 5) * 0.3) + i * 0.6);
    const dim = i % 5 === 0 ? NEAR[i % NEAR.length]! : "#8a96a8";
    pix(ctx, x, y, pulse > 0.82 ? "#fffaf0" : pulse > 0.1 ? dim : "#2a3140");
    if (pulse > 0.5) {
      const arm = i % 3 === 0 ? "#d8c8a0" : "#9ec4e8";
      pix(ctx, x - 1, y, arm);
      pix(ctx, x + 1, y, arm);
      pix(ctx, x, y - 1, arm);
      pix(ctx, x, y + 1, arm);
    }
    if (pulse > 0.88) {
      pix(ctx, x - 2, y, "#fffaf0");
      pix(ctx, x + 2, y, "#fffaf0");
    }
  }
  const blink = Math.sin(time * 2.2);
  if (blink > 0.35) {
    const px0 = (w * 0.63) | 0;
    const py0 = (h * 0.22) | 0;
    pix(ctx, px0, py0, "#d0d8e8");
    if (blink > 0.8) {
      pix(ctx, px0 - 1, py0, "#3a5878");
      pix(ctx, px0 + 1, py0, "#3a5878");
    }
  }
  const comet = ((time * 18) | 0) % (w + 40);
  const cy = (h * 0.36 + Math.sin(time * 0.4) * h * 0.04) | 0;
  ctx.fillStyle = "#3a2848";
  ctx.fillRect(comet - 10, cy, 6, 1);
  ctx.fillStyle = "#c8b8d8";
  ctx.fillRect(comet - 3, cy, 2, 1);
  ctx.fillStyle = "#f4f0e8";
  ctx.fillRect(comet, cy, 1, 1);
  const drift = ((time * 6) | 0) % (w + 16);
  pix(ctx, drift, (h * 0.58 + Math.sin(time * 0.3) * 6) | 0, "#4a443c");
}
