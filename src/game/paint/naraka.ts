/** Naraka as filed Yamapaṭṭa — viscid river, clerk lamp, short air. No farm leftover. */

function fillOval(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
): void {
  ctx.fillStyle = color;
  const ry2 = ry * ry;
  for (let y = -ry; y <= ry; y++) {
    const t = 1 - (y * y) / ry2;
    if (t <= 0) continue;
    const nx = Math.floor(rx * Math.sqrt(t));
    ctx.fillRect(cx - nx, cy + y, nx * 2 + 1, 1);
  }
}

export function drawNaraka(
  ctx: CanvasRenderingContext2D,
  clock: number,
  w = 347,
  h = 528,
): void {
  const pulse = 0.35 + 0.25 * Math.sin(clock * 0.7);

  ctx.fillStyle = "#140c08";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(28,16,10,0.55)";
  ctx.fillRect(0, 0, w, 90);
  ctx.fillStyle = "rgba(18,10,8,0.4)";
  ctx.fillRect(0, 180, w, 40);
  ctx.fillStyle = "rgba(10,6,4,0.5)";
  ctx.fillRect(0, 360, w, 50);

  fillOval(ctx, 28, 240, 18, 28, "#2a1008");
  fillOval(ctx, 24, 242, 8, 12, `rgba(120,48,16,${0.25 + pulse * 0.2})`);
  ctx.fillStyle = "#1a0a06";
  ctx.fillRect(20, 250, 16, 3);

  const riverY = 300;
  ctx.fillStyle = "#1a100c";
  ctx.fillRect(0, riverY, w, 56);
  ctx.fillStyle = "#2a1610";
  ctx.fillRect(0, riverY + 8, w, 40);
  ctx.fillStyle = "#3a2218";
  ctx.fillRect(0, riverY + 16, w, 24);
  const sheen = Math.floor((0.5 + 0.5 * Math.sin(clock * 0.55)) * 18);
  ctx.fillStyle = `rgba(90,50,28,${0.18 + pulse * 0.12})`;
  ctx.fillRect(40 + sheen, riverY + 20, w - 90, 2);
  ctx.fillStyle = "rgba(20,8,6,0.45)";
  for (let i = 0; i < 9; i++) {
    ctx.fillRect(18 + i * 36, riverY + 10 + ((i + Math.floor(clock)) % 3), 22, 3);
  }
  ctx.fillStyle = "#241810";
  ctx.fillRect(0, riverY, w, 4);
  ctx.fillStyle = "#3a2a1c";
  ctx.fillRect(72, riverY - 6, 48, 6);
  ctx.fillStyle = "#2a1c14";
  ctx.fillRect(76, riverY - 14, 3, 10);
  ctx.fillRect(92, riverY - 14, 3, 10);
  ctx.fillRect(108, riverY - 14, 3, 10);

  ctx.fillStyle = "#1c1410";
  ctx.fillRect(210, 86, 96, 64);
  ctx.fillStyle = "#2a1c16";
  ctx.fillRect(214, 90, 88, 56);
  ctx.fillStyle = "#4a3424";
  ctx.fillRect(214, 90, 88, 3);
  ctx.fillStyle = "#6a5040";
  ctx.fillRect(248, 84, 20, 8);
  ctx.fillStyle = `rgba(196,138,72,${0.35 + pulse * 0.4})`;
  ctx.fillRect(256, 98, 3, 3);
  ctx.fillRect(255, 101, 5, 2);
  ctx.fillStyle = "#c48a48";
  ctx.fillRect(257, 99, 1, 1);
  ctx.fillStyle = "#3a2a20";
  for (let i = 0; i < 6; i++) ctx.fillRect(222 + i * 12, 108, 8, 28);
  ctx.fillStyle = "#8a6a3a";
  ctx.fillRect(236, 140, 44, 4);
  ctx.fillStyle = "#2a1a12";
  ctx.fillRect(238, 141, 8, 2);
  ctx.fillRect(252, 141, 8, 2);
  ctx.fillRect(266, 141, 8, 2);

  ctx.fillStyle = "#2a1810";
  ctx.fillRect(40, 120, 8, 22);
  ctx.fillRect(56, 128, 6, 14);
  ctx.fillStyle = "#3a2014";
  ctx.fillRect(41, 118, 6, 3);
  ctx.fillStyle = "#4a2818";
  ctx.fillRect(42, 116, 4, 2);

  ctx.fillStyle = `rgba(16,10,8,${0.2 + pulse * 0.08})`;
  ctx.fillRect(0, 70, w, 10);
  ctx.fillRect(0, 200, w, 8);
}
