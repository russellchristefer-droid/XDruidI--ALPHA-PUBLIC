/** Extra realm ornaments. Pixel fillRect only — not a full background. */

export function flourishSvarga(ctx: CanvasRenderingContext2D, clock: number): void {
  const tick = Math.floor(clock);

  // Wish-tree boughs under a gem crown centered near (189, 262).
  ctx.fillStyle = "#4e321c";
  ctx.fillRect(166, 270, 24, 2);
  ctx.fillRect(192, 268, 26, 2);
  ctx.fillRect(174, 258, 16, 2);
  ctx.fillRect(196, 254, 18, 2);

  const gold = ["#fff1b8", "#f0d56a", "#e2b340", "#c9962c"];
  const rose = ["#ffe0e8", "#f0a8ba", "#e07a92", "#c45470"];

  // Thicker gold/rose canopy: 3px blossoms on the same crown.
  for (let gy = 238; gy <= 286; gy += 3) {
    for (let gx = 156; gx <= 222; gx += 3) {
      const dx = gx - 189;
      const dy = gy - 262;
      if (dx * dx * 3 + dy * dy * 6 > 3000) continue;
      if (dy > 16 && dx * dx < 18) continue;
      const n = gx * 13 + gy * 7 + (tick >> 4);
      const glint = n % 11 === 0;
      const pal = n % 9 === 0 ? rose : gold;
      ctx.fillStyle = pal[(Math.abs(n) + (glint ? 2 : 0)) % 4];
      ctx.fillRect(gx, gy, 2, 2);
    }
  }

  // Hanging wish-gems just under the crown.
  const drops: Array<[number, number, string]> = [
    [164, 280, "#e07a92"],
    [172, 288, "#f0d56a"],
    [180, 284, "#c45470"],
    [189, 290, "#fff1b8"],
    [198, 286, "#f0a8ba"],
    [208, 292, "#e2b340"],
    [216, 282, "#c9962c"],
  ];
  for (let i = 0; i < drops.length; i++) {
    const d = drops[i];
    ctx.fillStyle = ((i + (tick >> 5)) % 6 === 0) ? "#fff6ee" : d[2];
    ctx.fillRect(d[0], d[1], 2, 2);
  }

  ctx.fillStyle = "#5a3820";
  ctx.fillRect(187, 278, 5, 24);
  ctx.fillStyle = "#3f2816";
  ctx.fillRect(191, 278, 1, 24);
  ctx.fillStyle = "#5a3820";
  ctx.fillRect(181, 298, 8, 2);
  ctx.fillRect(191, 298, 8, 2);

  // Pearl path: pale 2px stones every 8px, west-gate landing toward the court.
  ctx.fillStyle = "#f7f1e4";
  ctx.fillRect(32, 206, 150, 6);
  ctx.fillStyle = "#c9a24a";
  ctx.fillRect(32, 211, 150, 1);
  for (let x = 36; x <= 176; x += 12) {
    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(x, 207, 2, 2);
  }

  // Eight pollen pixels drifting off the wish-tree.
  for (let i = 0; i < 8; i++) {
    const t = clock * 0.4 + i * 1.25;
    const x = Math.floor(158 + (i % 4) * 14 + Math.sin(t) * 8);
    const y = Math.floor(236 + Math.floor(i / 4) * 18 + ((clock * 5 + i * 11) % 22));
    ctx.fillStyle = i % 2 === 0 ? "#fff6d4" : "#f6e4b0";
    ctx.fillRect(x, y, 1, 1);
  }

  // A second, higher drift so the grove reads as air, not a sticker.
  for (let i = 0; i < 10; i++) {
    const t = clock * 0.25 + i;
    const x = Math.floor(40 + ((i * 31 + Math.sin(t) * 10) % 260));
    const y = Math.floor(96 + ((clock * 6 + i * 23) % 120));
    ctx.fillStyle = i % 3 === 0 ? "#fffaf0" : "#f0d48a";
    ctx.fillRect(x, y, 1, 1);
  }
}

export function flourishNaraka(ctx: CanvasRenderingContext2D, clock: number): void {
  // Viscous dark-crimson river core, x=220..242, skipping the bridge at y=196..226.
  ctx.fillStyle = "#2a100e";
  ctx.fillRect(220, 48, 23, 148);
  ctx.fillRect(220, 227, 23, 274);
  ctx.fillStyle = "#140c0a";
  ctx.fillRect(208, 48, 8, 148);
  ctx.fillRect(246, 48, 8, 148);
  ctx.fillRect(208, 227, 8, 274);
  ctx.fillRect(246, 227, 8, 274);

  const drift = Math.floor(clock) % 48;
  ctx.fillStyle = "#243028";
  for (let i = 0; i < 10; i++) {
    const y = 50 + ((i * 29 + drift * 3) % 140);
    ctx.fillRect(222 + (i % 4) * 4, y, 2, 2);
  }
  for (let i = 0; i < 14; i++) {
    const y = 230 + ((i * 31 + drift * 3) % 266);
    ctx.fillRect(222 + (i % 5) * 3, y, 2, 2);
  }

  // Five wooden planks across the skipped gap.
  const plankY = [198, 204, 210, 216, 222];
  for (let i = 0; i < plankY.length; i++) {
    const y = plankY[i];
    ctx.fillStyle = "#5a3d24";
    ctx.fillRect(212, y, 40, 3);
    ctx.fillStyle = i % 2 === 0 ? "#8b6840" : "#6e4e30";
    ctx.fillRect(212, y, 40, 1);
    ctx.fillStyle = "#3a2816";
    ctx.fillRect(212, y + 2, 40, 1);
    ctx.fillStyle = "#2c1c10";
    ctx.fillRect(220 + i * 4, y + 1, 2, 1);
    ctx.fillRect(240 - i * 2, y + 1, 2, 1);
  }

  // Ten dark ash pixels rising slowly through the left half. Not a map fill.
  for (let i = 0; i < 10; i++) {
    const climb = Math.floor(clock * (0.35 + (i % 4) * 0.06));
    const y = 320 - ((climb + i * 19) % 181);
    const x = 8 + ((i * 16) % 156);
    ctx.fillStyle = i % 2 === 0 ? "#1a1410" : "#241c16";
    ctx.fillRect(x, y, 1, 1);
  }

  // Coal along the furnace side and a slow grease-sheen on the river, not a red wash.
  const glow = 0.25 + 0.2 * Math.sin(clock * 2.4);
  ctx.fillStyle = `rgba(120, 48, 22, ${glow})`;
  ctx.fillRect(48, 86, 8, 3);
  ctx.fillRect(62, 92, 5, 2);
  const sheen = Math.floor(clock * 8) % 40;
  ctx.fillStyle = "#3a1814";
  ctx.fillRect(224, 60 + sheen, 8, 1);
  ctx.fillRect(228, 240 + ((sheen * 3) % 80), 6, 1);
}
