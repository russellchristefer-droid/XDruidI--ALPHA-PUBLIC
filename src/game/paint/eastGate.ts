export function drawEastGate(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  clock: number,
): void {
  const gold = "#d4a017";
  const goldMid = "#a67c12";
  const goldDeep = "#6e4e0c";
  const goldPale = "#f4e4a8";
  const goldBright = "#ffe08a";
  const post = "#4a3010";
  const postShade = "#2a1c10";
  const ivory = "#f3ead0";
  const ruby = "#9a3040";
  const lapis = "#3d5278";
  const rose = "#c25060";
  const roseLight = "#e7a8b0";
  const rosePale = "#f6d0d4";
  const mouth = "#100c09";
  const voidInk = "#050403";

  // Stepped gold toraṇa, widest at the lintel, narrowing toward the kalaśa.
  const steps: Array<[number, number, number, number]> = [
    [-23, -21, 46, 4],
    [-16, -25, 32, 4],
    [-10, -29, 20, 4],
    [-5, -32, 10, 3],
  ];
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const x = s[0];
    const y = s[1];
    const w = s[2];
    const h = s[3];
    ctx.fillStyle = i % 2 === 0 ? gold : goldMid;
    ctx.fillRect(cx + x, cy + y, w, h);
    ctx.fillStyle = goldBright;
    ctx.fillRect(cx + x + 1, cy + y, w - 2, 1);
    ctx.fillStyle = goldDeep;
    ctx.fillRect(cx + x, cy + y + h - 1, w, 1);
  }

  // Kalaśa finial on the top step.
  ctx.fillStyle = goldDeep;
  ctx.fillRect(cx - 4, cy - 34, 8, 2);
  ctx.fillStyle = gold;
  ctx.fillRect(cx - 5, cy - 38, 10, 4);
  ctx.fillStyle = goldBright;
  ctx.fillRect(cx - 4, cy - 37, 3, 2);
  ctx.fillStyle = goldMid;
  ctx.fillRect(cx - 2, cy - 40, 4, 2);
  ctx.fillStyle = goldPale;
  ctx.fillRect(cx - 1, cy - 42, 2, 2);
  ctx.fillStyle = ruby;
  ctx.fillRect(cx - 1, cy - 36, 2, 2);

  // Two posts, tucked under the lintel, with ivory / ruby / lapis inlay.
  ctx.fillStyle = post;
  ctx.fillRect(cx - 20, cy - 18, 8, 40);
  ctx.fillRect(cx + 12, cy - 18, 8, 40);
  ctx.fillStyle = postShade;
  ctx.fillRect(cx - 13, cy - 18, 1, 40);
  ctx.fillRect(cx + 12, cy - 18, 1, 40);
  ctx.fillStyle = goldDeep;
  ctx.fillRect(cx - 20, cy - 18, 8, 1);
  ctx.fillRect(cx + 12, cy - 18, 8, 1);

  for (let row = 0; row < 8; row++) {
    const y = cy - 14 + row * 4;
    const band = row % 3;
    ctx.fillStyle = band === 0 ? ivory : band === 1 ? ruby : lapis;
    ctx.fillRect(cx - 18, y, 2, 2);
    ctx.fillRect(cx - 15, y, 2, 2);
    ctx.fillRect(cx + 14, y, 2, 2);
    ctx.fillRect(cx + 17, y, 2, 2);
    ctx.fillStyle = goldPale;
    ctx.fillRect(cx - 16, y + 1, 1, 1);
    ctx.fillRect(cx + 16, y + 1, 1, 1);
  }

  // Plinth under the posts.
  ctx.fillStyle = goldDeep;
  ctx.fillRect(cx - 22, cy + 22, 44, 3);
  ctx.fillStyle = gold;
  ctx.fillRect(cx - 20, cy + 23, 40, 1);

  // Gold rim, then the tall dark arch.
  for (let y = -17; y <= 17; y++) {
    const ny = y / 17;
    const half = Math.floor(Math.sqrt(Math.max(0, 1 - ny * ny)) * 13);
    ctx.fillStyle = gold;
    ctx.fillRect(cx - half, cy + y, half * 2 + 1, 1);
  }
  for (let y = -16; y <= 16; y++) {
    const ny = y / 16;
    const half = Math.floor(Math.sqrt(Math.max(0, 1 - ny * ny)) * 11);
    ctx.fillStyle = mouth;
    ctx.fillRect(cx - half, cy + y, half * 2 + 1, 1);
    if (half > 4) {
      ctx.fillStyle = voidInk;
      ctx.fillRect(cx - (half - 3), cy + y, (half - 3) * 2 + 1, 1);
    }
  }
  ctx.fillStyle = goldBright;
  ctx.fillRect(cx - 2, cy - 22, 2, 2);
  ctx.fillRect(cx + 4, cy - 22, 2, 2);
  ctx.fillRect(cx + 1, cy - 24, 2, 2);
  ctx.fillStyle = goldDeep;
  ctx.fillRect(cx - 12, cy + 16, 25, 1);

  // Rose garland draped under the lintel and down the inner posts.
  const garland: Array<[number, number, string]> = [
    [-18, -17, rose],
    [-15, -16, roseLight],
    [-12, -15, rose],
    [-8, -14, rosePale],
    [-5, -14, roseLight],
    [-2, -13, rose],
    [1, -13, roseLight],
    [4, -14, rose],
    [7, -14, rosePale],
    [10, -15, roseLight],
    [13, -16, rose],
    [16, -17, roseLight],
    [-17, -15, rosePale],
    [-17, -13, rose],
    [-16, -11, roseLight],
    [15, -15, rose],
    [15, -13, rosePale],
    [14, -11, roseLight],
    [-1, -12, rosePale],
    [0, -10, rose],
    [-6, -12, rose],
    [5, -12, roseLight],
  ];
  for (let i = 0; i < garland.length; i++) {
    const g = garland[i];
    ctx.fillStyle = g[2];
    ctx.fillRect(cx + g[0], cy + g[1], 2, 2);
  }
  ctx.fillStyle = goldPale;
  ctx.fillRect(cx - 9, cy - 15, 1, 1);
  ctx.fillRect(cx + 8, cy - 15, 1, 1);
  ctx.fillRect(cx - 1, cy - 14, 1, 1);

  // Two rings in the mouth, plus lamps and rising petals.
  const spin = clock * 1.6;
  for (let i = 0; i < 12; i++) {
    const a = spin + (i * Math.PI * 2) / 12;
    ctx.fillStyle = i % 2 === 0 ? goldPale : goldBright;
    ctx.fillRect(Math.round(cx + Math.cos(a) * 6), Math.round(cy + Math.sin(a) * 8), 1, 1);
  }
  for (let i = 0; i < 8; i++) {
    const a = -spin * 0.6 + (i * Math.PI * 2) / 8;
    ctx.fillStyle = gold;
    ctx.fillRect(Math.round(cx + Math.cos(a) * 3), Math.round(cy + Math.sin(a) * 4), 1, 1);
  }
  const lamp = 0.45 + 0.55 * Math.sin(clock * 3);
  ctx.fillStyle = `rgba(255, 244, 210, ${lamp})`;
  ctx.fillRect(cx - 8, cy - 8, 2, 2);
  ctx.fillRect(cx + 6, cy - 8, 2, 2);
  for (let i = 0; i < 4; i++) {
    const p = (clock * 0.35 + i * 0.25) % 1;
    ctx.fillStyle = i % 2 ? roseLight : goldPale;
    ctx.fillRect(cx - 6 + i * 4, Math.round(cy + 10 - p * 18), 1, 1);
  }
  ctx.fillStyle = goldDeep;
  ctx.fillRect(cx - 22, cy + 25, 44, 3);

  // Moonstone threshold and lotus at the feet of the toraṇa.
  ctx.fillStyle = "#efe6d2";
  ctx.fillRect(cx - 18, cy + 21, 36, 3);
  ctx.fillStyle = goldPale;
  ctx.fillRect(cx - 16, cy + 21, 32, 1);
  const petals: Array<[number, number]> = [
    [-14, 23], [-8, 24], [-2, 25], [4, 24], [10, 23],
  ];
  for (const [dx, dy] of petals) {
    ctx.fillStyle = roseLight;
    ctx.fillRect(cx + dx, cy + dy, 3, 2);
    ctx.fillStyle = goldBright;
    ctx.fillRect(cx + dx + 1, cy + dy, 1, 1);
  }

  // Bells under the lintel, swinging on the clock.
  const sway = Math.round(Math.sin(clock * 2.2));
  ctx.fillStyle = goldMid;
  ctx.fillRect(cx - 12, cy - 16, 1, 4);
  ctx.fillRect(cx + 11, cy - 16, 1, 4);
  ctx.fillStyle = gold;
  ctx.fillRect(cx - 13 + sway, cy - 12, 3, 3);
  ctx.fillRect(cx + 10 - sway, cy - 12, 3, 3);
  ctx.fillStyle = goldBright;
  ctx.fillRect(cx - 12 + sway, cy - 11, 1, 1);
  ctx.fillRect(cx + 11 - sway, cy - 11, 1, 1);

  // Jewel studs on the outer posts.
  for (let i = 0; i < 5; i++) {
    const y = cy - 8 + i * 6;
    ctx.fillStyle = i % 2 === 0 ? lapis : ruby;
    ctx.fillRect(cx - 22, y, 2, 2);
    ctx.fillRect(cx + 20, y, 2, 2);
  }
}
