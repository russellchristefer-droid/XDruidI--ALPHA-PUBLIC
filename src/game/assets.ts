/** Bump this when the pictures change so phones and computers drop the old files. */
export const ART = "20260929h";

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
  campfire: art("/game/fx/campfire.png"),
  landGrass: art("/game/land/grass.png"),
  farmExtend: art("/game/land/farm-extension.png"),
  landSoil: art("/game/land/soil.png"),
  landTilled: art("/game/land/tilled.png"),
  landWater: art("/game/land/water.png"),
  svarga: art("/game/land/svarga.png"),
  naraka: art("/game/land/naraka.png"),
  seraphimIdle: art("/game/angels/Seraphim_Idle.png"),
  seraphimWalk: art("/game/angels/Seraphim_Walk.png"),
  seraphimFly: art("/game/angels/Seraphim_Fly.png"),
  seraphimAttack: art("/game/angels/Seraphim_Attack.png"),
  archangelFly: art("/game/angels/Archangel_Fly.png"),
  archangelAttack: art("/game/angels/Archangel_Attack.png"),
  cherubFly: art("/game/angels/Cherub_Fly.png"),
  cherubShoot: art("/game/angels/Cherub_Shoot.png"),
  cherubArrow: art("/game/angels/Cherub_Arrow.png"),
  demonMage: art("/game/demons/demon-mage.png"),
};

export const ASSET_GROUPS: { id: string; label: string; keys: string[] }[] = [
  { id: "world", label: "World", keys: ["yard", "meadow", "path", "occlude", "house", "rocks", "meadowDress"] },
  { id: "land", label: "Land", keys: ["landGrass", "landSoil", "landTilled", "landWater", "farmExtend", "svarga", "naraka"] },
  { id: "angels", label: "Angels", keys: ["seraphimIdle", "seraphimWalk", "seraphimFly", "seraphimAttack", "archangelFly", "archangelAttack", "cherubFly", "cherubShoot", "cherubArrow"] },
  { id: "demons", label: "Demons", keys: ["demonMage"] },
  { id: "druid", label: "Druid", keys: ["idle", "walk", "water", "shovel", "scythe", "axe", "hammer", "handsidle", "handswalk", "goddess", "goddessFront", "goddessBack", "goddessFront3", "goddessBack3"] },
  { id: "animals", label: "Animals", keys: ["cowIdle", "cowWalk", "goatIdle", "goatWalk", "roosterIdle", "roosterWalk", "cat", "catSit", "catStand", "catWalk", "catRun", "bee", "butterfly"] },
  { id: "plants", label: "Plants", keys: ["tomato", "cabbage", "greens", "flowers", "treeOak", "treeApple", "treeBirch", "treePine", "treeStump", "treeSapling"] },
  { id: "covers", label: "Covers", keys: ["tree-nw", "tree-n", "tree-ne", "tree-e", "tree-sw", "tree-s", "tree-se", "bush-w", "bush-e"] },
  { id: "fx", label: "Effects", keys: ["emoji", "fxHearts", "fxHeartsPink", "fxStars", "fxBuff", "fxDebuff", "fxTired", "fxBlood", "fxMagic", "res", "campfire"] },
];

export function assetIds(): string[] {
  return Object.keys(URLS);
}

export function assetFile(id: string): string | null {
  const url = URLS[id];
  if (!url) return null;
  return url.split("?")[0] ?? null;
}

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
