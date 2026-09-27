/** East Svarga portal: gold toraṇa, moonstone step, lotus, bells, jewel studs. Collision ellipse stays in content/logic. */

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

export function drawEastGate(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  clock: number,
): void {
  const pulse = 0.45 + 0.4 * Math.sin(clock * 2.1);
  fillOval(ctx, cx + 1, cy + 24, 14, 4, "rgba(40,28,8,0.55)");

  ctx.fillStyle = "#c8d8e4";
  ctx.fillRect(cx - 12, cy + 18, 24, 5);
  ctx.fillStyle = "#eef6fb";
  ctx.fillRect(cx - 10, cy + 18, 20, 1);
  ctx.fillStyle = "#9ab0c0";
  ctx.fillRect(cx - 12, cy + 22, 24, 1);

  ctx.fillStyle = `rgba(232,184,200,${0.55 + pulse * 0.35})`;
  ctx.fillRect(cx - 8, cy + 17, 3, 2);
  ctx.fillRect(cx + 5, cy + 17, 3, 2);
  ctx.fillRect(cx - 1, cy + 16, 3, 2);
  ctx.fillStyle = "#fff6e0";
  ctx.fillRect(cx - 7, cy + 17, 1, 1);
  ctx.fillRect(cx + 6, cy + 17, 1, 1);

  ctx.fillStyle = "#6a4a24";
  ctx.fillRect(cx - 18, cy - 22, 36, 6);
  ctx.fillStyle = "#c4a060";
  ctx.fillRect(cx - 17, cy - 21, 34, 4);
  ctx.fillStyle = "#f0d78a";
  ctx.fillRect(cx - 10, cy - 23, 20, 3);
  ctx.fillStyle = "#fff6c8";
  ctx.fillRect(cx - 4, cy - 24, 8, 2);

  ctx.fillStyle = "#e6c86a";
  ctx.fillRect(cx - 2, cy - 28, 4, 4);
  ctx.fillRect(cx - 1, cy - 30, 2, 2);
  ctx.fillStyle = "#fff6c8";
  ctx.fillRect(cx, cy - 31, 1, 2);

  for (const s of [-1, 1] as const) {
    const sway = Math.round(Math.sin(clock * 3 + s) * 1);
    ctx.fillStyle = "#c4a060";
    ctx.fillRect(cx + s * 10, cy - 16, 1, 6);
    ctx.fillStyle = "#f0d78a";
    ctx.fillRect(cx + s * 10 + sway, cy - 10, 3, 3);
    ctx.fillStyle = "#fff6c8";
    ctx.fillRect(cx + s * 10 + sway + 1, cy - 9, 1, 1);
  }

  fillOval(ctx, cx, cy, 12, 18, "#1a1408");
  fillOval(ctx, cx, cy + 1, 9, 14, "#3a2a10");
  fillOval(ctx, cx, cy + 2, 7, 11, `rgba(230,200,80,${0.35 + pulse * 0.4})`);
  fillOval(ctx, cx + 1, cy + 3, 3, 6, `rgba(255,246,200,${0.25 + pulse * 0.45})`);

  ctx.fillStyle = "#5a3c18";
  ctx.fillRect(cx - 15, cy - 16, 4, 34);
  ctx.fillRect(cx + 11, cy - 16, 4, 34);
  ctx.fillStyle = "#e6c86a";
  ctx.fillRect(cx - 14, cy - 14, 1, 28);
  ctx.fillRect(cx + 13, cy - 14, 1, 28);

  for (const s of [-1, 1] as const) {
    for (let i = 0; i < 3; i++) {
      const y = cy - 10 + i * 10;
      const g = 0.4 + 0.45 * Math.sin(clock * 2.4 + i + s);
      ctx.fillStyle =
        i === 1
          ? `rgba(90,138,216,${0.5 + g * 0.5})`
          : `rgba(196,90,106,${0.45 + g * 0.45})`;
      ctx.fillRect(cx + s * 13 - 1, y, 3, 3);
      ctx.fillStyle = "#fff6c8";
      ctx.fillRect(cx + s * 13, y + 1, 1, 1);
    }
  }

  ctx.fillStyle = "#fff6c8";
  for (let i = 0; i < 7; i++) {
    if ((Math.floor(clock * 4) + i) % 2 === 0) ctx.fillRect(cx - 10 + i * 3, cy - 20, 1, 2);
  }
}
