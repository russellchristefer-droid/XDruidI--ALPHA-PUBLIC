/** Skill Grove ornaments. Pixel fillRect only, matching Svarga/Naraka density and material response.
 * Unique to Druidi: living training seals, use-based skill markers, warm farm-palette flora.
 * Sourced from vision (skill practice lands) and pack (trees, flowers, particles).
 */

export function flourishGrove(ctx: CanvasRenderingContext2D, clock: number): void {
  const tick = Math.floor(clock);

  // Central training seal: inlaid circle matching courtyard mosaic density.
  const cx = 174;
  const cy = 246;
  ctx.fillStyle = "#1c1814";
  for (let y = -40; y <= 40; y++) {
    for (let x = -40; x <= 40; x++) {
      if (x * x + y * y <= 1600) ctx.fillRect(cx + x, cy + y, 1, 1);
    }
  }
  ctx.fillStyle = "#e2b657";
  for (let a = 0; a < 64; a++) {
    const ang = (a / 64) * Math.PI * 2;
    const r = 38;
    ctx.fillRect(Math.round(cx + Math.cos(ang) * r), Math.round(cy + Math.sin(ang) * r), 1, 1);
  }
  // Skill runes as small gold crosses.
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2 + clock * 0.05;
    const rx = Math.round(cx + Math.cos(ang) * 22);
    const ry = Math.round(cy + Math.sin(ang) * 22);
    ctx.fillStyle = "#ffecaa";
    ctx.fillRect(rx, ry, 3, 1);
    ctx.fillRect(rx + 1, ry - 1, 1, 3);
  }
  ctx.fillStyle = "#fff4d2";
  ctx.fillRect(cx - 1, cy - 1, 3, 3);

  // Varied pack-style trees: oak left, apple right, pines as border (already in plate).
  // Overlay denser canopies with leaf particles.
  ctx.fillStyle = "#3a6a32";
  for (let i = 0; i < 12; i++) {
    const lx = 48 + (i % 4) * 8;
    const ly = 80 + Math.floor(i / 4) * 12;
    ctx.fillRect(lx, ly, 3, 3);
  }
  ctx.fillStyle = "#e87850";
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(280 + (i % 3) * 6, 90 + Math.floor(i / 3) * 8, 2, 2);
  }

  // Pearl-and-stone path from return portal toward seal, matching Svarga pearl path.
  ctx.fillStyle = "#f7f1e4";
  ctx.fillRect(160, 180, 28, 120);
  ctx.fillStyle = "#c9a24a";
  ctx.fillRect(160, 298, 28, 1);
  for (let y = 184; y <= 290; y += 10) {
    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(170, y, 2, 2);
  }

  // Ambient skill-pollen and falling leaves (code-driven from pack particle idea).
  for (let i = 0; i < 16; i++) {
    const t = clock * 0.3 + i * 0.7;
    const x = Math.floor(40 + ((i * 19 + Math.sin(t) * 12) % 270));
    const y = Math.floor(60 + ((clock * 4 + i * 17) % 420));
    ctx.fillStyle = i % 3 === 0 ? "#fff6d4" : i % 3 === 1 ? "#e8f0c0" : "#f0d48a";
    ctx.fillRect(x, y, 1, 1);
  }

  // Standing skill stones with marks.
  const stones = [
    [64, 160, "#d6c4a0"],
    [280, 160, "#c4ae86"],
    [64, 340, "#ead8b4"],
    [280, 340, "#d6c4a0"],
  ];
  for (const [sx, sy, col] of stones) {
    ctx.fillStyle = col as string;
    ctx.fillRect(sx, sy, 8, 16);
    ctx.fillStyle = "#785018";
    ctx.fillRect(sx + 2, sy + 4, 4, 1);
    ctx.fillRect(sx + 3, sy + 3, 1, 3);
  }

  // Soft lighting overlay for depth (warm god-ray from above).
  ctx.fillStyle = "rgba(255, 244, 210, 0.08)";
  for (let i = 0; i < 6; i++) {
    const x = 80 + i * 32;
    ctx.fillRect(x, 40, 4, 480);
  }
}
