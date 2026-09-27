import { drawEastGate } from "./eastGate";
import { drawWestGate } from "./westGate";

function gateXs(wing: number): number[] {
  const gates: number[] = [];
  if (wing !== -1) gates.push(40);
  if (wing !== 1) gates.push(308);
  return gates;
}

/** West cx=40 Yama mouth. East cx=308 Indra toraṇa. Collision stays in logic. */
export function drawLokaGates(
  ctx: CanvasRenderingContext2D,
  wing: number,
  clock: number,
): void {
  for (const cx of gateXs(wing)) {
    const cy = 202;
    if (cx >= 200) drawEastGate(ctx, cx, cy, clock);
    else drawWestGate(ctx, cx, cy, clock);
  }
}
