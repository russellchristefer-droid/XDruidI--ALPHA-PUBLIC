/** Bump this when the pictures change so phones and computers drop the old files. */
export const ART = "20260928spell1";

function art(path: string): string {
  return `${path}?v=${ART}`;
}

const URLS: Record<string, string> = {
  yard: art("/game/yard.png"),
  heavenIsle: art("/game/land/heaven-isle.png"),
  hellIsle: art("/game/land/hell-isle.png"),
  vimana: art("/game/land/vimana.png"),
  space: art("/game/land/space.png"),
  meadow: art("/game/the-meadow.png"),
  idle: art("/game/char/idle.png"),
  rod: "/game/char/rod.png?v=20260927rod7",
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
  handsUpIdle: art("/game/char/handsup-idle.png"),
  handsUpWalk: art("/game/char/handsup-walk.png"),
  plainIdle: art("/game/char/plain/idle.png"),
  plainWalk: art("/game/char/plain/walk.png"),
  plainWater: art("/game/char/plain/water.png"),
  plainShovel: art("/game/char/plain/shovel.png"),
  plainScythe: art("/game/char/plain/scythe.png"),
  plainAxe: art("/game/char/plain/axe.png"),
  plainHammer: art("/game/char/plain/hammer.png"),
  plainHandsidle: art("/game/char/plain/handsidle.png"),
  plainHandswalk: art("/game/char/plain/handswalk.png"),
  courtIdle: art("/game/char/court/idle.png"),
  courtWalk: art("/game/char/court/walk.png"),
  courtWater: art("/game/char/court/water.png"),
  courtShovel: art("/game/char/court/shovel.png"),
  courtScythe: art("/game/char/court/scythe.png"),
  courtAxe: art("/game/char/court/axe.png"),
  courtHammer: art("/game/char/court/hammer.png"),
  courtHandsidle: art("/game/char/court/handsidle.png"),
  courtHandswalk: art("/game/char/court/handswalk.png"),
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
  blackCat: art("/game/animals/blackcat.png"),
  birdWalk: art("/game/animals/bird-walk.png"),
  birdTakeoff: art("/game/animals/bird-takeoff.png"),
  birdFly: art("/game/animals/bird-fly.png"),
  bee: art("/game/animals/bee.png"),
  butterfly: art("/game/animals/butterfly.png"),
  res: art("/game/icons/resources.png"),
  fish: art("/game/icons/fish.png"),
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
  fireball: art("/game/fx/spells/fireball.png"),
  nova: art("/game/fx/spells/nova.png"),
  holy: art("/game/fx/spells/holy.png"),
  ice: art("/game/fx/spells/ice.png"),
  iceball: art("/game/fx/spells/iceball.png"),
  bolt: art("/game/fx/spells/bolt.png"),
  spark: art("/game/fx/spells/spark.png"),
  poison: art("/game/fx/spells/poison.png"),
  drip: art("/game/fx/spells/drip.png"),
  landGrass: art("/game/land/grass.png"),
  farmExtend: art("/game/land/farm-extension.png"),
  landSoil: art("/game/land/soil.png"),
  landTilled: art("/game/land/tilled.png"),
  landWater: art("/game/land/water.png"),
  svarga: art("/game/land/svarga.png"),
  naraka: art("/game/land/naraka.png"),
  grove: art("/game/land/grove.png"),
  portalSvarga: art("/game/portal/svarga.png"),
  portalNaraka: art("/game/portal/naraka.png"),
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
  reaperIdle: art("/game/char/reaper/idle.png"),
  reaperWalk: art("/game/char/reaper/walk.png"),
  reaperHandsIdle: art("/game/char/reaper/handsidle.png"),
  reaperHandsWalk: art("/game/char/reaper/handswalk.png"),
  reaperWater: art("/game/char/reaper/water.png"),
  reaperShovel: art("/game/char/reaper/shovel.png"),
  reaperScythe: art("/game/char/reaper/scythe.png"),
  reaperAxe: art("/game/char/reaper/axe.png"),
  reaperHammer: art("/game/char/reaper/hammer.png"),
  reaperPickaxe: art("/game/char/reaper/pickaxe.png"),
  handIdle: art("/game/char/hand/idle.png"),
  handWalk: art("/game/char/hand/walk.png"),
  handHandsIdle: art("/game/char/hand/handsidle.png"),
  handHandsWalk: art("/game/char/hand/handswalk.png"),
  handWater: art("/game/char/hand/water.png"),
  handShovel: art("/game/char/hand/shovel.png"),
  handScythe: art("/game/char/hand/scythe.png"),
  handAxe: art("/game/char/hand/axe.png"),
  handHammer: art("/game/char/hand/hammer.png"),
  handPickaxe: art("/game/char/hand/pickaxe.png"),
  xiang64Idle: art("/game/char/xiangsu/idle64.png"),
  maidS: art("/game/char/maid/south.png"),
  maidN: art("/game/char/maid/north.png"),
  maidW: art("/game/char/maid/west.png"),
};

export const ASSET_GROUPS: { id: string; label: string; keys: string[] }[] = [
  { id: "world", label: "World", keys: ["yard", "meadow", "path", "occlude", "house", "rocks", "meadowDress"] },
  { id: "land", label: "Land", keys: ["landGrass", "landSoil", "landTilled", "landWater", "farmExtend", "svarga", "naraka", "grove", "portalSvarga", "portalNaraka", "heavenIsle", "hellIsle", "vimana", "space"] },
  { id: "angels", label: "Angels", keys: ["seraphimIdle", "seraphimWalk", "seraphimFly", "seraphimAttack", "archangelFly", "archangelAttack", "cherubFly", "cherubShoot", "cherubArrow"] },
  { id: "demons", label: "Demons", keys: ["demonMage"] },
  {
    id: "reaper",
    label: "Reaper",
    keys: [
      "reaperIdle",
      "reaperWalk",
      "reaperHandsIdle",
      "reaperHandsWalk",
      "reaperWater",
      "reaperShovel",
      "reaperScythe",
      "reaperAxe",
      "reaperHammer",
      "reaperPickaxe",
    ],
  },
  { id: "hand", label: "Field hand", keys: ["handIdle", "handWalk", "handHandsIdle", "handHandsWalk", "handWater", "handShovel", "handScythe", "handAxe", "handHammer", "handPickaxe"] },
  { id: "xiang", label: "Xiang Su", keys: ["xiang64Idle"] },
  { id: "maid", label: "Milkmaid", keys: ["maidS", "maidN", "maidW"] },
  { id: "druid", label: "Druid", keys: ["idle", "rod", "walk", "water", "shovel", "scythe", "axe", "hammer", "handsidle", "handswalk", "handsUpIdle", "handsUpWalk", "goddess", "goddessFront", "goddessBack", "goddessFront3", "goddessBack3"] },
  { id: "animals", label: "Animals", keys: ["cowIdle", "cowWalk", "goatIdle", "goatWalk", "roosterIdle", "roosterWalk", "cat", "catSit", "catStand", "catWalk", "catRun", "blackCat", "birdWalk", "birdTakeoff", "birdFly", "bee", "butterfly"] },
  { id: "plants", label: "Plants", keys: ["tomato", "cabbage", "greens", "flowers", "treeOak", "treeApple", "treeBirch", "treePine", "treeStump", "treeSapling"] },
  { id: "covers", label: "Covers", keys: ["tree-nw", "tree-n", "tree-ne", "tree-e", "tree-sw", "tree-s", "tree-se", "bush-w", "bush-e"] },
  { id: "fx", label: "Effects", keys: ["emoji", "fxHearts", "fxHeartsPink", "fxStars", "fxBuff", "fxDebuff", "fxTired", "fxBlood", "fxMagic", "res", "campfire"] },
  { id: "magic", label: "Magic", keys: ["fireball", "nova", "holy", "ice", "iceball", "bolt", "spark", "poison", "drip"] },
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

const FIRST = [
  "yard",
  "house",
  "path",
  "occlude",
  "rocks",
  "idle",
  "rod",
  "walk",
  "plainIdle",
  "plainWalk",
  "portalSvarga",
  "portalNaraka",
  "vimana",
  "space",
  "heavenIsle",
  "hellIsle",
  "grove",
];

/** The other farmer. Loaded with the yard, not after every other picture. */
const SOON = [
  "handIdle",
  "handWalk",
  "handHandsIdle",
  "handHandsWalk",
  "handWater",
  "handScythe",
  "handShovel",
  "xiang64Idle",
  "maidS",
  "maidN",
  "maidW",
  "fireball",
  "nova",
  "holy",
  "ice",
  "iceball",
  "bolt",
  "spark",
  "poison",
  "drip",
  "handsUpIdle",
  "handsUpWalk",
];

function loadOne(key: string, sheets: Sheets, ms: number): Promise<void> {
  const url = URLS[key];
  if (!url || typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const timer = window.setTimeout(finish, ms);
    img.onload = () => {
      window.clearTimeout(timer);
      if (img.naturalWidth > 0) sheets[key] = img;
      finish();
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      finish();
    };
    img.src = url;
  });
}

async function loadQueue(keys: string[], sheets: Sheets, limit: number, ms: number): Promise<void> {
  let next = 0;
  const workers = Math.max(1, Math.min(limit, keys.length));
  await Promise.all(
    Array.from({ length: workers }, async () => {
      for (;;) {
        const i = next;
        next += 1;
        const key = keys[i];
        if (!key) return;
        await loadOne(key, sheets, ms);
      }
    }),
  );
}

export function loadSheets(): Promise<Sheets> {
  const sheets: Sheets = {};
  const first = FIRST.filter((key) => URLS[key]);
  const soon = SOON.filter((key) => URLS[key]);
  const rest = Object.keys(URLS).filter((key) => !first.includes(key) && !soon.includes(key));
  const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  const firstLimit = coarse ? 2 : 4;
  return loadQueue(first, sheets, firstLimit, coarse ? 8000 : 6000).then(() => {
    void loadQueue(soon, sheets, coarse ? 2 : 3, 8000);
    const later = () => {
      void loadQueue(rest, sheets, coarse ? 1 : 2, 12000);
    };
    const idle = window.requestIdleCallback;
    if (typeof idle === "function") idle(() => later(), { timeout: 1200 });
    else window.setTimeout(later, 600);
    return sheets;
  });
}
