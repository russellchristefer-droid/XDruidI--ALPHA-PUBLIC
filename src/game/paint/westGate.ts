/** West portal: Yama mouth. Smoked teak, horns, brass three-sided seal, viscid lip. */

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

export function drawWestGate(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  clock: number,
): void {
  const pulse = 0.4 + 0.35 * Math.sin(clock * 1.6);
  const drip = 4 + Math.floor((0.5 + 0.5 * Math.sin(clock * 0.9)) * 4);

  fillOval(ctx, cx + 1, cy + 24, 15, 4, "rgba(8,4,2,0.72)");

  ctx.fillStyle = "#3a2218";
  ctx.fillRect(cx - 13, cy + 18, 26, 5);
  ctx.fillStyle = "#2a1610";
  ctx.fillRect(cx - 13, cy + 22, 26, 1);
  ctx.fillStyle = "#5a3824";
  ctx.fillRect(cx - 11, cy + 18, 22, 1);
  ctx.fillStyle = "#1a100c";
  ctx.fillRect(cx - 9, cy + 19, 18, 1);
  ctx.fillStyle = "rgba(90,50,28,0.45)";
  ctx.fillRect(cx - 8, cy + 20, 16, 1);

  ctx.fillStyle = "#1a100c";
  ctx.fillRect(cx - 16, cy - 22, 32, 6);
  ctx.fillStyle = "#4a2e1c";
  ctx.fillRect(cx - 15, cy - 21, 30, 4);
  ctx.fillStyle = "#6a4030";
  ctx.fillRect(cx - 8, cy - 22, 16, 2);
  ctx.fillStyle = "#c48a48";
  for (let i = 0; i < 7; i++) ctx.fillRect(cx - 10 + i * 3, cy - 20, 1, 2);

  ctx.fillStyle = "#8a6a48";
  ctx.fillRect(cx - 3, cy - 18, 3, 3);
  ctx.fillRect(cx - 2, cy - 17, 5, 1);
  ctx.fillRect(cx - 3, cy - 16, 1, 2);
  ctx.fillStyle = "#2a1a10";
  ctx.fillRect(cx - 1, cy - 17, 1, 1);

  for (const side of [-1, 1] as const) {
    ctx.fillStyle = "#2a1a12";
    ctx.fillRect(cx + side * 14, cy - 26, 3, 8);
    ctx.fillRect(cx + side * 16, cy - 28, 2, 5);
    ctx.fillRect(cx + side * 17, cy - 30, 2, 3);
    ctx.fillRect(cx + side * 15, cy - 24, 4, 3);
    ctx.fillStyle = "#8a6a48";
    ctx.fillRect(cx + side * 14, cy - 25, 1, 4);
    ctx.fillStyle = "#1a100c";
    ctx.fillRect(cx + side * 17, cy - 31, 2, 1);
  }

  fillOval(ctx, cx, cy, 12, 18, "#0a0604");
  fillOval(ctx, cx, cy + 1, 9, 14, "#140a08");
  fillOval(ctx, cx, cy + 2, 6, 10, `rgba(40,16,10,${0.55 + pulse * 0.25})`);
  fillOval(ctx, cx + 1, cy + 4, 3, 6, `rgba(90,40,20,${0.18 + pulse * 0.22})`);

  ctx.fillStyle = "#241610";
  ctx.fillRect(cx - 14, cy - 16, 4, 34);
  ctx.fillRect(cx + 10, cy - 16, 4, 34);
  ctx.fillStyle = "#5a3a24";
  ctx.fillRect(cx - 13, cy - 14, 1, 28);
  ctx.fillRect(cx + 12, cy - 14, 1, 28);
  ctx.fillStyle = "#0c0806";
  ctx.fillRect(cx - 14, cy - 16, 4, 1);
  ctx.fillRect(cx + 10, cy - 16, 4, 1);

  for (const side of [-1, 1] as const) {
    for (let i = 0; i < 3; i++) {
      const y = cy - 10 + i * 10;
      const glow = 0.35 + 0.4 * Math.sin(clock * 1.8 + i + side);
      ctx.fillStyle = `rgba(196,160,96,${0.4 + glow * 0.45})`;
      ctx.fillRect(cx + side * 13 - 1, y, 3, 3);
      ctx.fillStyle = "#2a1a10";
      ctx.fillRect(cx + side * 13, y + 1, 1, 1);
    }
  }

  ctx.fillStyle = "#6a5840";
  for (let i = 0; i < 5; i++) ctx.fillRect(cx - 2 + (i % 2), cy - 16 + i * 4, 2, 3);
  ctx.fillStyle = "#2a2218";
  ctx.fillRect(cx - 1, cy + 4, 2, 2);

  ctx.fillStyle = `rgba(20,8,6,${0.55 + pulse * 0.3})`;
  ctx.fillRect(cx - 8, cy - 16, 1, drip);
  ctx.fillRect(cx + 6, cy - 15, 1, drip - 1);
  ctx.fillRect(cx + 1, cy + 16, 1, 3);
  ctx.fillStyle = "#3a1810";
  ctx.fillRect(cx - 8, cy - 16 + drip, 1, 1);
  ctx.fillRect(cx + 6, cy - 15 + drip - 1, 1, 1);
}
