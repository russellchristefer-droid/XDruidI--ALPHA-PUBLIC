import { drawLokaGates } from "./lokaGates";
import { drawSvarga } from "./svarga";
import { drawNaraka } from "./naraka";
import { flourishSvarga, flourishNaraka } from "./realmFlourish";
import { drawIslandCliff, drawMarginSky } from "./marginSky";

/** Home yard (wing 0): gates only. Svarga folio only on wing +1. Naraka folio only on wing -1. */
export function applyLokaPaint(
  ctx: CanvasRenderingContext2D,
  wing: number,
  clock: number,
): void {
  if (wing === 1) {
    drawSvarga(ctx, clock);
    flourishSvarga(ctx, clock);
  } else if (wing === -1) {
    drawNaraka(ctx, clock);
    flourishNaraka(ctx, clock);
  }
  drawLokaGates(ctx, wing, clock);
}

export function applyIslandVoid(
  ctx: CanvasRenderingContext2D,
  clock: number,
  viewX: number,
  viewY: number,
  viewW: number,
  viewH: number,
): void {
  drawIslandCliff(ctx);
  drawMarginSky(ctx, clock, viewX, viewY, viewW, viewH);
}
