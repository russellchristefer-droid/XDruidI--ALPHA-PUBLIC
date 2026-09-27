export function drawWestGate(ctx: CanvasRenderingContext2D, cx: number, cy: number, clock: number): void {
  const teakShadow = "#241812";
  const teak = "#3c2b22";
  const teakSmoke = "#514034";
  const horn = "#16110e";
  const hornMid = "#2a211a";
  const hornEdge = "#3a2e24";
  const brass = "#7a6240";
  const brassDim = "#5a4630";
  const mouthRim = "#120e10";
  const mouth = "#080706";
  const voidCore = "#050404";
  const drip = "#4a1016";
  const dripDark = "#2c0a0e";

  const r = (x: number, y: number, w: number, h: number, color: string): void => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };

  // Smoked-teak posts. Outer span is 48px, full height 64px around the mouth.
  r(cx - 24, cy - 16, 8, 48, teakShadow);
  r(cx - 22, cy - 14, 5, 44, teak);
  r(cx - 21, cy - 12, 2, 40, teakSmoke);
  r(cx + 16, cy - 16, 8, 48, teakShadow);
  r(cx + 17, cy - 14, 5, 44, teak);
  r(cx + 19, cy - 12, 2, 40, teakSmoke);

  r(cx - 24, cy + 28, 48, 4, teakShadow);
  r(cx - 22, cy + 28, 44, 2, teak);

  // Buffalo-horn lintel: stepped tips rising, then a bar across the posts.
  r(cx - 22, cy - 32, 3, 2, horn);
  r(cx - 24, cy - 30, 6, 2, horn);
  r(cx - 24, cy - 28, 9, 2, hornMid);
  r(cx - 22, cy - 26, 10, 2, horn);
  r(cx - 18, cy - 24, 8, 2, hornEdge);

  r(cx + 19, cy - 32, 3, 2, horn);
  r(cx + 18, cy - 30, 6, 2, horn);
  r(cx + 15, cy - 28, 9, 2, hornMid);
  r(cx + 12, cy - 26, 10, 2, horn);
  r(cx + 10, cy - 24, 8, 2, hornEdge);

  r(cx - 20, cy - 22, 40, 6, horn);
  r(cx - 18, cy - 21, 36, 2, hornMid);
  r(cx - 16, cy - 17, 32, 2, hornEdge);

  // Tarnished brass seal, dull dots only — not gold.
  const sy = cy - 19;
  const dots: ReadonlyArray<readonly [number, number, string]> = [
    [0, -2, brass],
    [-2, -1, brassDim],
    [2, -1, brassDim],
    [-3, 1, brass],
    [3, 1, brass],
    [-1, 2, brassDim],
    [1, 2, brassDim],
    [0, 0, brass],
  ];
  for (const [dx, dy, color] of dots) {
    r(cx + dx, sy + dy, 1, 1, color);
  }

  // Horns rise clear of the lintel so the silhouette is not the east arch.
  const hornSteps: Array<[number, number]> = [
    [-18, -24], [-22, -28], [-26, -30], [-28, -26],
    [16, -24], [20, -28], [24, -30], [26, -26],
  ];
  for (const [dx, dy] of hornSteps) r(cx + dx, cy + dy, 4, 3, horn);
  r(cx - 26, cy - 31, 3, 2, hornEdge);
  r(cx + 24, cy - 31, 3, 2, hornEdge);

  // Tall dark arch with a brass rim, drips inside.
  for (let y = -17; y <= 16; y++) {
    const ny = y / 17;
    const half = Math.floor(Math.sqrt(Math.max(0, 1 - ny * ny)) * 12);
    r(cx - half, cy + y, half * 2 + 1, 1, hornEdge);
  }
  for (let y = -16; y <= 15; y++) {
    const ny = y / 16;
    const half = Math.floor(Math.sqrt(Math.max(0, 1 - ny * ny)) * 10);
    r(cx - half, cy + y, half * 2 + 1, 1, mouth);
    if (half > 4) r(cx - (half - 3), cy + y, (half - 3) * 2 + 1, 1, voidCore);
  }
  r(cx - 1, cy - 4, 2, 7, brass);

  const horns: Array<[number, number]> = [
    [cx - 4, cy - 20],
    [cx + 3, cy - 20],
  ];
  for (const [hx, hy] of horns) r(hx, hy, 2, 2, "#0a0808");
  r(cx - 1, cy - 17, 3, 2, hornMid);

  r(cx - 20, cy - 4, 2, 2, brass);
  r(cx - 20, cy + 6, 2, 2, brassDim);
  r(cx + 18, cy - 2, 2, 2, brass);
  r(cx + 18, cy + 8, 2, 2, brassDim);

  for (let i = 0; i < 4; i++) {
    const fall = (clock * 6 + i * 9) % 16;
    r(cx - 5 + i * 3, Math.round(cy - 6 + fall), 2, 2, i % 2 ? drip : dripDark);
  }
  r(cx - 22, cy + 30, 44, 3, teakShadow);

  // Ledger ticks and a dull chain. The west gate files, it does not shine.
  for (let i = 0; i < 7; i++) {
    r(cx - 22, cy - 10 + i * 5, 2, 1, i % 2 ? brassDim : teakSmoke);
    r(cx + 20, cy - 8 + i * 5, 2, 1, brassDim);
  }
  for (let i = 0; i < 5; i++) {
    r(cx - 16 + i * 3, cy - 20, 1, 2, i % 2 ? horn : brassDim);
    r(cx + 2 + i * 3, cy - 20, 1, 2, hornMid);
  }
  const ink = (clock * 5) % 18;
  r(cx - 1, Math.round(cy - 4 + ink), 1, 4, drip);
  r(cx + 2, Math.round(cy - 1 + ((ink + 7) % 18)), 1, 3, dripDark);
  r(cx - 7, cy + 14, 2, 1, "#2a1214");
  r(cx + 6, cy + 16, 2, 1, "#241014");
  // Horn tips catch a single coal, never a day-lamp.
  const coal = 0.35 + 0.25 * Math.sin(clock * 1.4);
  ctx.fillStyle = `rgba(90, 32, 18, ${coal})`;
  ctx.fillRect(cx - 28, cy - 31, 2, 1);
  ctx.fillRect(cx + 26, cy - 31, 2, 1);
}
