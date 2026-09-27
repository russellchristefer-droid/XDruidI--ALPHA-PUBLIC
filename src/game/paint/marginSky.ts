/** Outer void around the floating homestead. Never stamp stars onto farm tiles. */

export const FARM_TOP = 0;
export const FARM_BOTTOM = 528;
export const FARM_LEFT = 0;
export const FARM_RIGHT = 347;

function mote(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function inFarm(x: number, y: number): boolean {
  return x >= FARM_LEFT && x < FARM_RIGHT && y >= FARM_TOP && y < FARM_BOTTOM;
}

export function drawMarginSky(
  ctx: CanvasRenderingContext2D,
  clock: number,
  viewX: number,
  viewY: number,
  viewW: number,
  viewH: number,
): void {
  ctx.save();
  for (let i = 0; i < 80; i++) {
    const x = Math.floor(viewX + mote(i + 1) * viewW);
    const y = Math.floor(viewY + mote(i + 9) * viewH);
    if (inFarm(x, y)) continue;
    const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(clock * 1.7 + i));
    ctx.fillStyle =
      i % 8 === 0
        ? `rgba(255,214,160,${0.22 + twinkle * 0.5})`
        : `rgba(220,230,255,${0.22 + twinkle * 0.55})`;
    ctx.fillRect(x, y, i % 11 === 0 ? 2 : 1, 1);
  }

  const dustY = FARM_BOTTOM + 8;
  if (dustY < viewY + viewH) {
    for (let i = 0; i < 22; i++) {
      const x = Math.floor(mote(i + 40) * 347);
      const y = dustY + Math.floor(mote(i + 70) * 48) + Math.floor(Math.sin(clock * 0.4 + i) * 2);
      ctx.fillStyle = i % 2 === 0 ? "rgba(80,70,110,0.2)" : "rgba(48,24,36,0.16)";
      ctx.fillRect(x, y, 22, 2);
    }
  }

  const px = 280;
  const py = FARM_BOTTOM + 36;
  if (!inFarm(px, py)) {
    ctx.fillStyle = "#6a5a88";
    ctx.fillRect(px, py, 8, 8);
    ctx.fillStyle = "#c8b8e0";
    ctx.fillRect(px + 1, py + 1, 4, 4);
    ctx.fillStyle = "rgba(180,160,120,0.7)";
    ctx.fillRect(px - 3, py + 4, 14, 1);
  }

  const qx = 48;
  const qy = FARM_BOTTOM + 58;
  if (!inFarm(qx, qy)) {
    ctx.fillStyle = "#4a6078";
    ctx.fillRect(qx, qy, 6, 6);
    ctx.fillStyle = "#a8c0d0";
    ctx.fillRect(qx + 1, qy + 1, 3, 3);
  }
  ctx.restore();
}

export function drawIslandCliff(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  const y0 = FARM_BOTTOM;
  ctx.fillStyle = "#2a2218";
  ctx.fillRect(0, y0, 347, 14);
  ctx.fillStyle = "#3a2e22";
  ctx.fillRect(4, y0 + 4, 339, 10);
  ctx.fillStyle = "#1a1410";
  for (let x = 0; x < 347; x += 8) {
    const drop = 12 + (x * 13 + 7) % 10;
    ctx.fillRect(x, y0 + 12, 8, drop);
  }
  ctx.fillStyle = "#4a3a28";
  ctx.fillRect(0, y0, 347, 2);
  ctx.fillStyle = "#1a1410";
  ctx.fillRect(8, y0 + 2, 4, 6);
  ctx.fillRect(40, y0 + 3, 6, 8);
  ctx.fillRect(300, y0 + 2, 5, 7);
  ctx.restore();
}
