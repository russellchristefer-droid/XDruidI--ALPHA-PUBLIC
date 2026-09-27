/** Letterbox void around the floating homestead. Never stamp stars onto farm tiles. */

function mote(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Screen-space nebula for AssayGame before the world transform. */
export function drawVoidBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  clock: number,
): void {
  ctx.fillStyle = "#07060e";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(28,18,48,0.35)";
  ctx.fillRect(0, Math.floor(h * 0.18), w, Math.floor(h * 0.12));
  ctx.fillStyle = "rgba(48,24,36,0.18)";
  ctx.fillRect(0, Math.floor(h * 0.62), w, Math.floor(h * 0.08));
  ctx.fillStyle = "rgba(16,28,52,0.16)";
  ctx.fillRect(0, Math.floor(h * 0.4), w, 6);

  for (let i = 0; i < 72; i++) {
    const x = Math.floor(mote(i + 1) * w);
    const y = Math.floor(mote(i + 19) * h);
    const twinkle = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(clock * 1.6 + i));
    const warm = i % 9 === 0;
    ctx.fillStyle = warm
      ? `rgba(255,214,160,${0.2 + twinkle * 0.55})`
      : `rgba(210,220,255,${0.2 + twinkle * 0.6})`;
    ctx.fillRect(x, y, i % 13 === 0 ? 2 : 1, 1);
  }
}
