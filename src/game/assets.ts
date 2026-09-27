/** Bump this when the pictures change so phones and computers drop the old files. */
export const ART = "20260928k";

function art(path: string): string {
  return `${path}?v=${ART}`;
}

const URLS: Record<string, string> = {
  yard: art("/game/yard.png"),
  meadow: art("/game/the-meadow.png"),
  idle: art("/game/char/idle.png"),
  goddess: art("/game/char/goddess.png"),
  goddessFront: art("/game/char/goddess-front.png"),
  goddessBack: art("/game/char/goddess-back.png"),
  goddessFront3: art("/game/char/goddess-front-3.png"),
  goddessBack3: art("/game/char/goddess-back-3.png"),
  walk: art("/game/char/walk.png"),
  water: art("/game/char/water.png"),
  shovel: art("/game/char/shovel.png"),
  scythe: art("/game/char/scythe.png"),
  axe: art("/game/char/axe.png"),
  hammer: art("/game/char/hammer.png"),
  handsidle: art("/game/char/handsidle.png"),
  handswalk: art("/game/char/handswalk.png"),
  cowIdle: art("/game/animals/dairyCow_idle.png"),
  cowWalk: art("/game/animals/dairyCow_walk.png"),
  roosterIdle: art("/game/animals/rooster_idle.png"),
  roosterWalk: art("/game/animals/rooster_walk.png"),
  goatIdle: art("/game/animals/billyGoat_idle.png"),
  goatWalk: art("/game/animals/billyGoat_walk.png"),
  cat: art("/game/animals/bigcat_sit.png"),
  catWalk: art("/game/animals/bigcat_walk.png"),
  catSit: art("/game/animals/bigcat_sit.png"),
  catStand: art("/game/animals/bigcat_sit.png"),
  catRun: art("/game/animals/bigcat_run.png"),
  bee: art("/game/animals/bee.png"),
  butterfly: art("/game/animals/butterfly.png"),
  res: art("/game/icons/resources.png"),
  tomato: art("/game/crops/tomato.png"),
  cabbage: art("/game/crops/cabbage.png"),
  greens: art("/game/crops/greens.png"),
  flowers: art("/game/crops/flowers.png"),
  "tree-nw": art("/game/covers/tree-nw.png"),
  "tree-n": art("/game/covers/tree-n.png"),
  "tree-ne": art("/game/covers/tree-ne.png"),
  "tree-e": art("/game/covers/tree-e.png"),
  "tree-sw": art("/game/covers/tree-sw.png"),
  "tree-s": art("/game/covers/tree-s.png"),
  "tree-se": art("/game/covers/tree-se.png"),
  "bush-w": art("/game/covers/bush-w.png"),
  "bush-e": art("/game/covers/bush-e.png"),
  house: art("/game/covers/house.png"),
  occlude: art("/game/covers/occlude.png"),
  path: art("/game/covers/path.png"),
  rocks: art("/game/props/seam-rocks.png"),
  meadowDress: art("/game/props/meadow-dress.png"),
  treeOak: art("/game/props/trees/oak.png"),
  treeApple: art("/game/props/trees/apple.png"),
  treeBirch: art("/game/props/trees/birch.png"),
  treePine: art("/game/props/trees/pine.png"),
  treeStump: art("/game/props/trees/stump.png"),
  treeSapling: art("/game/props/trees/sapling.png"),
  emoji: art("/game/ui/emoji.png"),
  fxHearts: art("/game/fx/hearts.png"),
  fxHeartsPink: art("/game/fx/hearts-pink.png"),
  fxStars: art("/game/fx/stars.png"),
  fxBuff: art("/game/fx/buff.png"),
  fxDebuff: art("/game/fx/debuff.png"),
  fxTired: art("/game/fx/lines-yellow.png"),
  fxBlood: art("/game/fx/blood.png"),
  fxMagic: art("/game/fx/curved-blue.png"),
  landGrass: art("/game/land/grass.png"),
  landSoil: art("/game/land/soil.png"),
  landTilled: art("/game/land/tilled.png"),
  landWater: art("/game/land/water.png"),
};

export type Sheets = Record<string, HTMLImageElement>;

export function loadSheets(): Promise<Sheets> {
  const entries = Object.entries(URLS).map(async ([key, url]) => {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return [key, img] as const;
  });
  return Promise.all(entries).then((list) => Object.fromEntries(list));
}
