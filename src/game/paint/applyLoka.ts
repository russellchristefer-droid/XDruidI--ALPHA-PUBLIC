import { drawLokaGates } from "./lokaGates";
import { drawSvarga } from "./svarga";
import { drawNaraka } from "./naraka";
import { flourishSvarga, flourishNaraka } from "./realmFlourish";
import { drawIslandCliff, drawMarginSky } from "./marginSky";

export type LokaPlates = {
  svarga?: HTMLImageElement;
  naraka?: HTMLImageElement;
};

function blitPlate(ctx: CanvasRenderingContext2D, img: HTMLImageElement): void {
  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, 347, 528);
}

/** Home yard (wing 0): gates only. Folio plates + liturgy only on wing ±1. */
export function applyLokaPaint(
  ctx: CanvasRenderingContext2D,
  wing: number,
  clock: number,
  plates?: LokaPlates,
): void {
  if (wing === 1) {
    if (plates?.svarga) blitPlate(ctx, plates.svarga);
    else drawSvarga(ctx, clock);
    flourishSvarga(ctx, clock);
  } else if (wing === -1) {
    if (plates?.naraka) blitPlate(ctx, plates.naraka);
    else drawNaraka(ctx, clock);
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
