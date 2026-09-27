function renderMargin(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ox: number,
  oy: number,
  vw: number,
  vh: number,
  time: number,
): void {
  ctx.fillStyle = "#050712";
  ctx.fillRect(0, 0, w, h);

  const farmR = ox + vw;
  const farmB = oy + vh;

  const inside = (cx: number, cy: number): boolean =>
    cx >= ox && cx < farmR && cy >= oy && cy < farmB;

  const paint = (x: number, y: number, s: number, color: string): void => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const size = s < 1 ? 1 : Math.floor(s);
    if (ix >= w || iy >= h || ix + size <= 0 || iy + size <= 0) return;
    ctx.fillStyle = color;
    ctx.fillRect(ix, iy, size, size);
  };

  const rand = (n: number): number => {
    const v = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return v - Math.floor(v);
  };

  const nudgeOut = (x: number, y: number, pad: number): [number, number] => {
    if (!inside(x, y)) return [x, y];
    const dl = x - ox;
    const dr = farmR - x;
    const dt = y - oy;
    const db = farmB - y;
    const m = Math.min(dl, dr, dt, db);
    if (m === dl) return [ox - pad, y];
    if (m === dr) return [farmR + pad, y];
    if (m === dt) return [x, oy - pad];
    return [x, farmB + pad];
  };

  const cloud = (
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    seed: number,
    palette: readonly string[],
  ): void => {
    const steps = Math.max(24, Math.floor(rx * ry * 0.42));
    for (let i = 0; i < steps; i++) {
      const a = rand(seed + i * 1.71) * Math.PI * 2;
      const u = Math.pow(rand(seed + i * 2.37 + 4), 0.5);
      const x = cx + Math.cos(a) * rx * u + Math.sin(time * 0.21 + seed) * 2;
      const y = cy + Math.sin(a) * ry * u + Math.cos(time * 0.17 + seed) * 1.5;
      const edge = u > 0.78;
      const color = palette[Math.floor(rand(seed + i * 3.13) * palette.length)] ?? palette[0];
      paint(x, y, edge ? 1 : rand(seed + i * 0.77) > 0.55 ? 2 : 1, color);
    }
  };

  const violet = [
    "rgba(88, 42, 140, 0.45)",
    "rgba(130, 58, 176, 0.32)",
    "rgba(176, 84, 168, 0.22)",
    "rgba(54, 28, 96, 0.5)",
    "rgba(210, 120, 190, 0.16)",
  ];
  const teal = [
    "rgba(24, 72, 118, 0.48)",
    "rgba(36, 128, 146, 0.3)",
    "rgba(72, 176, 168, 0.18)",
    "rgba(16, 40, 78, 0.5)",
    "rgba(140, 210, 200, 0.14)",
  ];

  const n1 = nudgeOut(w * 0.14, h * 0.18, 28);
  const n2 = nudgeOut(w * 0.84, h * 0.72, 26);
  const nebR = Math.max(18, Math.min(w, h) * 0.22);
  cloud(n1[0], n1[1], nebR, nebR * 0.62, 11, violet);
  cloud(n2[0], n2[1], nebR * 0.86, nebR * 0.5, 47, teal);

  const starCount = Math.min(240, Math.max(48, Math.floor((w * h) / 850)));
  const starColors = ["#f4f7ff", "#d5def8", "#fff1c9", "#9eb6ff", "#ffffff", "#c9d4ee"];
  for (let i = 0; i < starCount; i++) {
    const sx = rand(i * 3 + 1) * w;
    const sy = rand(i * 3 + 2) * h;
    const z = rand(i * 3 + 3);
    const tw = 0.5 + 0.5 * Math.sin(time * (0.9 + z * 2.4) + i * 0.7);
    if (z > 0.82 && tw < 0.18) continue;
    let color = starColors[Math.floor(z * starColors.length)] ?? "#f4f7ff";
    if (tw < 0.28) color = z < 0.4 ? "#5c6888" : "#8b95b0";
    const size = z > 0.94 ? 2 : 1;
    paint(sx, sy, size, color);
    if (z > 0.97 && tw > 0.6) {
      paint(sx - 2, sy, 1, "#c5d0ee");
      paint(sx + 2, sy, 1, "#c5d0ee");
      paint(sx, sy - 2, 1, "#c5d0ee");
      paint(sx, sy + 2, 1, "#c5d0ee");
    }
  }

  const moonR = Math.max(4, Math.round(Math.min(w, h) / 48));
  const moonAt = nudgeOut(w - moonR * 3.2, moonR * 2.6, moonR + 6);
  const mcx = moonAt[0];
  const mcy = moonAt[1];
  for (let y = -moonR - 2; y <= moonR + 2; y++) {
    for (let x = -moonR - 2; x <= moonR + 2; x++) {
      const d2 = x * x + y * y;
      if (d2 > (moonR + 2) * (moonR + 2) || d2 < moonR * moonR) {
        if (d2 <= (moonR + 2) * (moonR + 2) && d2 >= moonR * moonR && (x + y) % 2 === 0) {
          paint(mcx + x, mcy + y, 1, "rgba(200, 214, 255, 0.22)");
        }
        continue;
      }
      const bx = x - moonR * 0.48;
      const by = y - moonR * 0.06;
      if (bx * bx + by * by <= (moonR * 0.78) * (moonR * 0.78)) continue;
      const lit = x < 0 ? "#d5deef" : "#f7f9ff";
      paint(mcx + x, mcy + y, 1, lit);
    }
  }

  const pr = Math.max(6, Math.round(Math.min(w, h) / 28));
  const planetAt = nudgeOut(pr * 3.1, h - pr * 2.8, pr + 10);
  const pcx = planetAt[0];
  const pcy = planetAt[1];
  const rx = pr * 2.15;
  const ry = Math.max(2, pr * 0.42);

  const ring = (front: boolean): void => {
    const x0 = Math.floor(-rx - 1);
    const x1 = Math.ceil(rx + 1);
    const y0 = Math.floor(-ry - 1);
    const y1 = Math.ceil(ry + 1);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x + 0.5;
        const dy = y + 0.5;
        const e = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
        if (e < 0.78 || e > 1.22) continue;
        if (front) {
          if (dy < -0.4) continue;
        } else if (dy > 0.4) {
          continue;
        }
        const onBody = dx * dx + dy * dy <= (pr + 0.35) * (pr + 0.35);
        if (!front && onBody) continue;
        const color = Math.abs(e - 1) > 0.12 ? "#8c7b64" : dy < 0 ? "#f3e6cf" : "#cbb892";
        paint(pcx + x, pcy + y, 1, color);
      }
    }
  };

  ring(false);
  for (let y = -pr; y <= pr; y++) {
    for (let x = -pr; x <= pr; x++) {
      if (x * x + y * y > pr * pr) continue;
      let color = "#d7b07a";
      if (x < -pr * 0.22) color = "#a67c49";
      if (x < -pr * 0.55) color = "#6e4c2c";
      if (x > pr * 0.28 && y < pr * 0.15) color = "#f0d7a6";
      if (y > pr * 0.45) color = "#b88958";
      paint(pcx + x, pcy + y, 1, color);
    }
  }
  ring(true);
}

let skyPlate: { w: number; h: number; canvas: HTMLCanvasElement } | null = null;

export function drawMarginSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ox: number,
  oy: number,
  vw: number,
  vh: number,
  time: number,
): void {
  if (w < 1 || h < 1) return;
  if (!skyPlate || skyPlate.w !== w || skyPlate.h !== h) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext("2d");
    if (!g) {
      ctx.fillStyle = "#050712";
      ctx.fillRect(0, 0, w, h);
      return;
    }
    renderMargin(g, w, h, ox, oy, vw, vh, 0);
    skyPlate = { w, h, canvas };
  }
  ctx.drawImage(skyPlate.canvas, 0, 0);
  ctx.fillStyle = "#f4f7ff";
  for (let i = 0; i < 8; i++) {
    if (Math.sin(time * 1.3 + i * 1.7) < 0.35) continue;
    ctx.fillRect((i * 97 + 13) % w, (i * 53 + 7) % h, 1, 1);
  }
}
