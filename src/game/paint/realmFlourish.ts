/** Realm overlays after the plate. Svarga is leased gold-ground; Naraka is filed smoke. */

const WORLD_W = 347;

function mote(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function flourishSvarga(ctx: CanvasRenderingContext2D, clock: number): void {
  ctx.save();
  ctx.fillStyle = "rgba(255,214,120,0.07)";
  ctx.fillRect(0, 0, WORLD_W, 528);

  ctx.fillStyle = "rgba(255,246,200,0.12)";
  ctx.fillRect(148, 8, 52, 10);
  ctx.fillStyle = "rgba(230,200,106,0.18)";
  ctx.fillRect(156, 4, 36, 6);
  ctx.fillStyle = "#e6c86a";
  ctx.fillRect(168, 2, 4, 4);
  ctx.fillRect(186, 2, 4, 4);
  ctx.fillRect(177, 0, 3, 3);

  const pathY = 188;
  for (let x = 16; x < WORLD_W - 16; x += 8) {
    ctx.fillStyle = (Math.floor(x / 8) + Math.floor(pathY / 8)) % 2 === 0 ? "#f7f1e4" : "#efe4cc";
    ctx.fillRect(x, pathY, 8, 8);
    ctx.fillStyle = "rgba(200,220,230,0.35)";
    ctx.fillRect(x + 1, pathY + 1, 5, 1);
  }

  const canopies = [
    [56, 96],
    [110, 72],
    [230, 80],
    [286, 108],
    [168, 64],
  ];
  for (const [cx, cy] of canopies) {
    ctx.fillStyle = "rgba(40,28,8,0.28)";
    ctx.fillRect(cx + 6, cy + 18, 18, 6);
    ctx.fillStyle = "#6a8a28";
    ctx.fillRect(cx, cy, 24, 20);
    ctx.fillStyle = "#c4a060";
    ctx.fillRect(cx + 2, cy + 2, 20, 16);
    ctx.fillStyle = "#e6c86a";
    ctx.fillRect(cx + 6, cy + 4, 12, 10);
    ctx.fillStyle = "#fff6c8";
    ctx.fillRect(cx + 10, cy + 6, 4, 4);
    ctx.fillStyle = "#8a6a24";
    ctx.fillRect(cx + 10, cy + 20, 4, 10);
  }

  for (let i = 0; i < 28; i++) {
    const u = mote(i + 3);
    const v = mote(i + 17);
    const up = (Math.floor(clock * 6 + i) % 3) === 0 ? -1 : 0;
    const x = Math.floor(u * WORLD_W);
    const y = Math.floor(40 + v * 160 + Math.sin(clock * 0.8 + i) * 4) + up;
    ctx.fillStyle = i % 4 === 0 ? "rgba(255,246,200,0.7)" : "rgba(232,184,200,0.55)";
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();
}

export function flourishNaraka(ctx: CanvasRenderingContext2D, clock: number): void {
  ctx.save();
  ctx.fillStyle = "rgba(12,8,6,0.16)";
  ctx.fillRect(0, 0, WORLD_W, 528);

  ctx.fillStyle = "rgba(18,12,10,0.22)";
  ctx.fillRect(0, 48, WORLD_W, 10);
  ctx.fillStyle = "rgba(10,8,8,0.18)";
  ctx.fillRect(0, 120, WORLD_W, 8);

  ctx.fillStyle = "#2a1008";
  ctx.fillRect(0, 4, 10, 18);
  ctx.fillStyle = `rgba(196,80,32,${0.25 + 0.2 * Math.sin(clock * 1.1)})`;
  ctx.fillRect(2, 8, 6, 10);
  ctx.fillStyle = "#c48a48";
  ctx.fillRect(4, 12, 2, 2);

  const lampX = 210;
  const lampY = 70;
  ctx.fillStyle = "#2a2218";
  ctx.fillRect(lampX, lampY, 5, 9);
  ctx.fillStyle = `rgba(196,138,72,${0.45 + 0.35 * Math.sin(clock * 1.4)})`;
  ctx.fillRect(lampX + 1, lampY + 1, 3, 3);
  ctx.fillStyle = "rgba(196,138,72,0.12)";
  ctx.fillRect(lampX - 6, lampY + 8, 16, 20);

  const riverY = 210;
  ctx.fillStyle = "#1a100c";
  ctx.fillRect(8, riverY, WORLD_W - 16, 36);
  ctx.fillStyle = "#2a1610";
  ctx.fillRect(10, riverY + 2, WORLD_W - 20, 30);
  const sheen = Math.floor((0.5 + 0.5 * Math.sin(clock * 0.7)) * (WORLD_W - 40));
  ctx.fillStyle = "rgba(90,50,28,0.35)";
  ctx.fillRect(16 + sheen, riverY + 8, 28, 2);
  ctx.fillStyle = "#3a2218";
  ctx.fillRect(8, riverY, WORLD_W - 16, 2);

  ctx.fillStyle = "#4a3424";
  for (let i = 0; i < 3; i++) {
    const x = 40 + i * 28;
    ctx.fillRect(x, riverY - 8, 10, 10);
    ctx.fillStyle = "#2a1a12";
    ctx.fillRect(x + 2, riverY + 2, 2, 8);
    ctx.fillStyle = "#4a3424";
  }
  ctx.restore();
}
