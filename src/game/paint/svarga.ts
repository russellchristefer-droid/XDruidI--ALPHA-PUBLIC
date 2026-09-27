/** Svarga as leased gold-ground folio — Amarāvatī terrace, Nandana grant-trees, still bimba. */

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

export function drawSvarga(
  ctx: CanvasRenderingContext2D,
  clock: number,
  w = 347,
  h = 528,
): void {
  const pulse = 0.4 + 0.25 * Math.sin(clock * 0.9);

  ctx.fillStyle = "#3a2a10";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#6a4a18";
  ctx.fillRect(0, 0, w, 72);
  ctx.fillStyle = "rgba(255,214,120,0.16)";
  ctx.fillRect(0, 0, w, 48);
  ctx.fillStyle = "rgba(255,246,200,0.12)";
  ctx.fillRect(120, 4, 110, 18);
  ctx.fillStyle = "#fff6c8";
  ctx.fillRect(168, 6, 10, 6);
  ctx.fillStyle = "#e6c86a";
  ctx.fillRect(170, 4, 6, 3);

  ctx.fillStyle = "#c4a060";
  ctx.fillRect(40, 28, 80, 36);
  ctx.fillStyle = "#e6c86a";
  ctx.fillRect(44, 32, 72, 28);
  ctx.fillStyle = "#fff1b0";
  ctx.fillRect(48, 32, 64, 3);
  ctx.fillStyle = "#8a6a20";
  ctx.fillRect(74, 22, 12, 12);
  ctx.fillStyle = "#fff6c8";
  ctx.fillRect(78, 18, 4, 6);
  ctx.fillStyle = "#d8c070";
  ctx.fillRect(52, 48, 8, 16);
  ctx.fillRect(100, 48, 8, 16);

  ctx.fillStyle = "#b89048";
  ctx.fillRect(220, 24, 90, 40);
  ctx.fillStyle = "#e6c86a";
  ctx.fillRect(224, 28, 82, 32);
  ctx.fillStyle = "#fff1b0";
  ctx.fillRect(248, 20, 16, 10);
  ctx.fillStyle = "#fff6c8";
  ctx.fillRect(254, 16, 4, 6);
  ctx.fillStyle = `rgba(120,180,220,${0.25 + pulse * 0.25})`;
  ctx.fillRect(232, 36, 10, 8);
  ctx.fillRect(268, 36, 10, 8);

  const trees: Array<[number, number]> = [
    [28, 96],
    [70, 88],
    [118, 100],
    [210, 92],
    [258, 104],
    [300, 90],
  ];
  for (const [tx, ty] of trees) {
    ctx.fillStyle = "rgba(40,28,8,0.3)";
    ctx.fillRect(tx + 8, ty + 22, 16, 5);
    ctx.fillStyle = "#6a4a18";
    ctx.fillRect(tx + 10, ty + 16, 4, 14);
    fillOval(ctx, tx + 12, ty + 8, 14, 12, "#8a6a24");
    fillOval(ctx, tx + 12, ty + 6, 10, 9, "#c4a060");
    fillOval(ctx, tx + 11, ty + 5, 6, 6, "#e6c86a");
    ctx.fillStyle = "#fff6c8";
    ctx.fillRect(tx + 11, ty + 4, 2, 2);
  }

  for (let x = 8; x < w - 8; x += 8) {
    ctx.fillStyle = ((x / 8) | 0) % 2 === 0 ? "#f7f1e4" : "#efe4cc";
    ctx.fillRect(x, 176, 8, 8);
    ctx.fillStyle = "rgba(200,220,230,0.28)";
    ctx.fillRect(x + 1, 177, 5, 1);
  }

  ctx.fillStyle = "#d8c898";
  ctx.fillRect(0, 200, w, h - 200);
  ctx.fillStyle = "rgba(255,214,120,0.08)";
  ctx.fillRect(0, 200, w, 40);

  for (let i = 0; i < 24; i++) {
    const x = (i * 47 + Math.floor(clock * 3)) % w;
    const y = 50 + ((i * 19) % 120) + ((Math.floor(clock * 6 + i) % 3) === 0 ? -1 : 0);
    ctx.fillStyle = i % 3 === 0 ? "rgba(255,246,200,0.7)" : "rgba(232,184,200,0.5)";
    ctx.fillRect(x, y, 1, 1);
  }

  ctx.fillStyle = `rgba(255,246,200,${0.08 + pulse * 0.06})`;
  ctx.fillRect(150, 0, 48, 14);
}
