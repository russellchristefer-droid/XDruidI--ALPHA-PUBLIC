/** Space behind every map. The world is drawn on top, so this fills the whole screen. */

const FAR = ["#2a3c68", "#6a4030", "#403060", "#1e4a48", "#584020"] as const;
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
  ctx.fillStyle = "#02030a";
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 2) {
    ctx.fillStyle = (y & 2) === 0 ? "#050712" : "#080c18";
    ctx.fillRect(0, y, w, 1);
  }

  nebula(ctx, w * 0.22, h * 0.28, Math.max(28, w * 0.16), Math.max(16, h * 0.1), "#ff7ae0", "#c02098", "#401050", 11);
  nebula(ctx, w * 0.72, h * 0.22, Math.max(24, w * 0.14), Math.max(14, h * 0.08), "#9af6ff", "#1a90c8", "#062838", 29);
  nebula(ctx, w * 0.48, h * 0.62, Math.max(30, w * 0.18), Math.max(12, h * 0.07), "#ffe070", "#e06018", "#381008", 47);
  nebula(ctx, w * 0.82, h * 0.55, Math.max(18, w * 0.1), Math.max(14, h * 0.09), "#c8a0ff", "#5830b0", "#180830", 71);

  const farCount = Math.min(900, Math.max(140, (w * h) / 280 | 0));
  for (let i = 0; i < farCount; i++) {
    const x = hash(i * 3 + 1) * w | 0;
    const y = hash(i * 3 + 2) * h | 0;
    pix(ctx, x, y, FAR[i % FAR.length]!);
  }

  const nearCount = Math.min(220, Math.max(40, (w * h) / 1400 | 0));
  for (let i = 0; i < nearCount; i++) {
    const x = hash(i * 7 + 4) * w | 0;
    const y = hash(i * 7 + 8) * h | 0;
    const color = NEAR[i % NEAR.length]!;
    pix(ctx, x, y, color);
    if (i % 5 === 0) {
      pix(ctx, x - 1, y, color);
      pix(ctx, x + 1, y, color);
      pix(ctx, x, y - 1, color);
      pix(ctx, x, y + 1, color);
    } else if (i % 3 === 0) {
      pix(ctx, x + 1, y, "#8b95b0");
    }
  }

  const clusters: Array<[number, number, number, number]> = [
    [0.18, 0.2, 17, 28],
    [0.72, 0.12, 41, 22],
    [0.3, 0.7, 63, 34],
    [0.86, 0.62, 89, 18],
    [0.5, 0.46, 13, 16],
  ];
  for (const [ux, uy, seed, count] of clusters) {
    const cx = ux * w | 0;
    const cy = uy * h | 0;
    for (let i = 0; i < count; i++) {
      const a = hash(seed + i) * Math.PI * 2;
      const rad = 1 + hash(seed + i + 3) * (8 + (i % 5) * 3);
      pix(ctx, cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.62, NEAR[i % NEAR.length]!);
    }
  }

  paintMoon(ctx, w * 0.88 | 0, h * 0.12 | 0, Math.max(6, Math.min(w, h) / 48 | 0));
  paintPlanet(ctx, w * 0.14 | 0, h * 0.8 | 0, Math.max(7, Math.min(w, h) / 32 | 0), "#f0d7a6", "#c49858", "#6e4c2c", true);
  paintPlanet(ctx, w * 0.78 | 0, h * 0.74 | 0, Math.max(4, Math.min(w, h) / 70 | 0), "#d7e8f4", "#6a98b8", "#1c3044", false);
  paintGalaxy(ctx, w * 0.42 | 0, h * 0.22 | 0);
  paintComet(ctx, w * 0.62 | 0, h * 0.3 | 0);
  for (let i = 0; i < 14; i++) {
    const x = hash(200 + i) * w | 0;
    const y = (h * 0.9 + hash(300 + i) * h * 0.08) | 0;
    pix(ctx, x, y, "#6a5844");
    pix(ctx, x + 1, y, "#3a3028");
  }
}

function nebula(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  core: string,
  mid: string,
  edge: string,
  seed: number,
): void {
  const steps = Math.min(420, Math.max(80, (rx * ry * 0.22) | 0));
  for (let i = 0; i < steps; i++) {
    const a = hash(seed + i * 1.7) * Math.PI * 2;
    const u = Math.pow(hash(seed + i * 2.3 + 4), 0.55);
    const x = cx + Math.cos(a) * rx * u;
    const y = cy + Math.sin(a) * ry * u;
    const color = u < 0.22 ? core : u < 0.55 ? mid : edge;
    pix(ctx, x, y, color);
    if (u < 0.18 && (i & 3) === 0) pix(ctx, x + 1, y, "#ffffff");
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
  for (let x = -16; x <= 16; x++) {
    const bulge = 3 - (Math.abs(x) / 6 | 0);
    for (let y = -bulge; y <= bulge; y++) {
      if (hash(x * 9 + y * 4 + 80) > 0.45) continue;
      const color = Math.abs(x) < 3 ? "#fff6d0" : Math.abs(y) === bulge ? "#3a2068" : "#9eb6ff";
      pix(ctx, cx + x, cy + y, color);
    }
  }
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
  for (let i = 0; i < 42; i++) {
    const x = (hash(i * 5 + 2) * w) | 0;
    const y = (hash(i * 5 + 6) * h) | 0;
    const color = NEAR[i % NEAR.length]!;
    const pulse = Math.sin(time * (1.2 + (i % 6) * 0.45) + i * 0.8);
    if (pulse < -0.15) continue;
    pix(ctx, x, y, pulse > 0.65 ? "#ffffff" : color);
    if (pulse > 0.45) {
      pix(ctx, x - 1, y, color);
      pix(ctx, x + 1, y, color);
      pix(ctx, x, y - 1, color);
      pix(ctx, x, y + 1, color);
    }
    if (pulse > 0.82) {
      pix(ctx, x - 2, y, color);
      pix(ctx, x + 2, y, color);
    }
  }
  const blink = Math.sin(time * 3.2);
  if (blink > 0.2) {
    const px = (w * 0.58) | 0;
    const py = (h * 0.16) | 0;
    pix(ctx, px, py, "#ffffff");
    if (blink > 0.75) {
      for (let k = 1; k <= 5; k++) {
        pix(ctx, px + k, py, "#7ec8ff");
        pix(ctx, px - k, py, "#7ec8ff");
      }
    }
  }
  const comet = ((time * 22) | 0) % (w + 48);
  const cy = (h * 0.4) | 0;
  ctx.fillStyle = "#ff4ad8";
  ctx.fillRect(comet - 12, cy, 4, 1);
  ctx.fillStyle = "#7ec8ff";
  ctx.fillRect(comet - 8, cy, 6, 1);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(comet, cy - 1, 2, 2);
}
