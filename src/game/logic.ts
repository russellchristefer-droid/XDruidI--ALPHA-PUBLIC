import {
  DEFS,
  MASS_CAP,
  MASS_RUN,
  SPOTS,
  WORLD_W,
  createGame,
  defaultFlowers,
  defOf,
  ensureLife,
  ensureWeather,
  footBlocked,
  isNight,
  itemMass,
  type Animal,
  type CropId,
  type GameState,
  type EquipSlot,
  type Item,
  type Life,
  type PanelId,
  type Plot,
} from "./content.ts";

export type Input = { mx: number; my: number; run: boolean; frozen: boolean };
export type InteractResult = { msg?: string; panel?: PanelId; save?: boolean; summary?: boolean };

export type Target = {
  id: string;
  name: string;
  kind: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

const REACH = 36;
const CONTACT_AT = 0.62;

function unitRand(s: GameState): number {
  let x = s.rng >>> 0;
  if (!x) x = 1;
  x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
  s.rng = x;
  return x / 4294967296;
}

function aimPoint(s: GameState, kind: string, target: string): { x: number; y: number } | null {
  if (kind === "sharpen") return { x: s.x, y: s.y };
  const plot = s.plots.find((p) => p.id === target);
  if (plot) return { x: plot.x, y: plot.y };
  const spot = SPOTS.find((sp) => sp.id === target);
  if (spot) return { x: spot.x + spot.w / 2, y: spot.y + spot.h / 2 };
  const branch = s.branches.find((b) => b.id === target);
  if (branch) return branch.left ? { x: branch.x, y: branch.y } : null;
  const animal = s.animals.find((a) => a.id === target);
  if (animal) return { x: animal.x, y: animal.y };
  return { x: s.x, y: s.y };
}

export function contactFail(s: GameState): string | null {
  const act = s.action;
  if (!act) return null;
  const pt = aimPoint(s, act.kind, act.target);
  if (!pt) return "The target is gone. The swing stops.";
  if (Math.hypot(s.x - pt.x, s.y - pt.y) > REACH + 6) return "Out of reach. The swing misses.";
  const toolKinds: Record<string, string> = {
    water: "water",
    harvest: "scythe",
    clear: "scythe",
    till: "shovel",
    chop: "axe",
    repair: "hammer",
  };
  const need = toolKinds[act.kind];
  if (need || act.kind === "sharpen") {
    const tool = active(s);
    if (!tool || defOf(tool).kind !== "tool") return "The tool left your hand.";
    if (tool.floor <= 0) return "The tool is spent. The swing stops.";
    if (need && defOf(tool).tool !== need) return `Requires ${need}. The swing stops.`;
  }
  return null;
}

export function watcherLine(s: GameState): string {
  if (s.downed) return "Downed. Crawl to the tub.";
  if (s.action) {
    const verb: Record<string, string> = {
      water: "Pouring",
      fill: "Filling the can",
      harvest: "Harvesting",
      clear: "Clearing",
      till: "Tilling",
      plant: "Planting",
      chop: "Chopping",
      cook: "Cooking",
      sharpen: "Sharpening",
      repair: "Repairing",
      feed: "Feeding",
      collect: "Collecting",
    };
    const name = verb[s.action.kind] ?? "Working";
    return s.action.hit ? `${name}. Contact landed.` : `${name}. Waiting on the swing.`;
  }
  if (s.stamina < 18) return "Too tired to swing.";
  if (totalMass(s) >= MASS_RUN) return "Burden limit. You cannot run.";
  const dry = s.plots.find((p) => p.kind === "bed" && p.stage > 0 && p.stage < 5 && !p.watered);
  if (dry) return `${dry.name} wants water.`;
  return "The yard is quiet.";
}

export function allItems(s: GameState): Item[] {
  const out: Item[] = [];
  const push = (it: Item | null | undefined) => {
    if (!it) return;
    out.push(it);
    if (it.contents) for (const c of it.contents) push(c);
  };
  for (const it of s.pack) push(it);
  for (const it of Object.values(s.body)) push(it);
  for (const g of s.ground) push(g.item);
  return out;
}

export function findItem(s: GameState, id: string | null | undefined): Item | null {
  if (!id) return null;
  return allItems(s).find((it) => it.id === id) ?? null;
}

export function totalMass(s: GameState): number {
  let m = 0;
  for (const it of s.pack) if (it) m += itemMass(it);
  for (const it of Object.values(s.body)) if (it) m += itemMass(it);
  return m;
}

export function coinCount(s: GameState): number {
  let n = s.purse;
  const walk = (it: Item | null | undefined) => {
    if (!it) return;
    if (it.defId === "coin") n += it.qty;
    if (it.contents) for (const c of it.contents) walk(c);
  };
  for (const it of s.pack) walk(it);
  walk(s.body.belt);
  walk(s.body.container);
  return n;
}

function uid(s: GameState): string {
  s.nextId += 1;
  return "i" + s.nextId;
}

export function makeItem(s: GameState, defId: string, qty = 1): Item {
  const d = DEFS[defId];
  const it: Item = {
    id: uid(s),
    defId,
    qty,
    quality: d.quality,
    floor: d.floor,
    floorMax: d.floor,
  };
  if (d.waterMax) it.water = 0;
  if (d.kind === "container") it.contents = Array.from({ length: 8 }, () => null);
  return it;
}

function unlink(s: GameState, id: string) {
  if (s.activeId === id) s.activeId = null;
  s.hotbar = s.hotbar.map((h) => (h === id ? null : h));
  if (s.body.hands?.id === id) s.body.hands = null;
}

function takeFromContainer(list: (Item | null)[], id: string): Item | null {
  for (let i = 0; i < list.length; i++) {
    const it = list[i];
    if (!it) continue;
    if (it.id === id) {
      list[i] = null;
      return it;
    }
    if (it.contents) {
      const inner = takeFromContainer(it.contents, id);
      if (inner) return inner;
    }
  }
  return null;
}

export function takeItem(s: GameState, id: string): Item | null {
  const fromPack = takeFromContainer(s.pack, id);
  if (fromPack) return fromPack;
  for (const key of Object.keys(s.body) as (keyof GameState["body"])[]) {
    const it = s.body[key];
    if (it?.id === id) {
      s.body[key] = null;
      return it;
    }
    if (it?.contents) {
      const inner = takeFromContainer(it.contents, id);
      if (inner) return inner;
    }
  }
  return null;
}

export function removeItem(s: GameState, id: string): Item | null {
  const it = takeItem(s, id);
  if (it) unlink(s, id);
  return it;
}

function tryStack(into: (Item | null)[], it: Item): boolean {
  const d = defOf(it);
  if (!d.stack) return false;
  const hit = into.find(
    (p) => p && p.defId === it.defId && p.noteOf === it.noteOf && p.floor === it.floor,
  );
  if (!hit) return false;
  hit.qty += it.qty;
  return true;
}

export function giveItem(s: GameState, it: Item): boolean {
  if (totalMass(s) + itemMass(it) > MASS_CAP + 0.001) return false;
  if (tryStack(s.pack, it)) return true;
  const slot = s.pack.findIndex((p) => p === null);
  if (slot < 0) return false;
  s.pack[slot] = it;
  return true;
}

const SLOT_NAME: Record<EquipSlot, string> = {
  head: "head",
  torso: "torso",
  legs: "legs",
  feet: "feet",
  hands: "hands",
  amulet: "amulet",
  ring: "ring",
  belt: "belt",
  container: "pack",
  offhand: "off hand",
};

export function slotFits(slot: EquipSlot, d: ReturnType<typeof defOf>): boolean {
  if (d.equip) return d.equip === slot;
  if (slot === "hands" || slot === "offhand") return d.kind === "tool";
  if (slot === "container") return d.kind === "container";
  if (slot === "belt") return d.kind === "tool" || d.kind === "kit";
  return false;
}

export function bestSlot(s: GameState, id: string): EquipSlot | null {
  const it = findItem(s, id);
  if (!it) return null;
  const d = defOf(it);
  if (d.equip) return d.equip;
  if (d.kind === "container") return "container";
  if (d.kind === "tool") return s.body.hands && s.body.hands.id !== id ? "offhand" : "hands";
  return null;
}

export function equipItem(s: GameState, id: string, slot: EquipSlot): string {
  const found = findItem(s, id);
  if (!found) return "That item is gone.";
  const d = defOf(found);
  if (!slotFits(slot, d)) return `${d.name} does not fit the ${SLOT_NAME[slot]}.`;
  if (s.body[slot]?.id === id) return `${d.name} is already on the ${SLOT_NAME[slot]}.`;
  const worn = s.body[slot] ?? null;
  const packIndex = s.pack.findIndex((p) => p?.id === id);
  const taken = takeItem(s, id);
  if (!taken) return "Could not take it.";
  if (worn) {
    s.body[slot] = null;
    if (packIndex >= 0) s.pack[packIndex] = worn;
    else if (!giveItem(s, worn)) {
      s.body[slot] = worn;
      if (!giveItem(s, taken)) s.body[slot] = taken;
      return "No room in the pack to swap.";
    }
  }
  s.body[slot] = taken;
  if (slot === "hands" || slot === "offhand") s.activeId = taken.id;
  const idx = s.hotbar.findIndex((h) => h === taken.id);
  if (idx >= 0) s.selected = idx;
  return `Equipped ${d.name} on the ${SLOT_NAME[slot]}.`;
}

export function unequipItem(s: GameState, slot: EquipSlot): string {
  const it = s.body[slot];
  if (!it) return "Nothing is worn there.";
  s.body[slot] = null;
  if (!giveItem(s, it)) {
    s.body[slot] = it;
    return "The pack is full.";
  }
  if (s.activeId === it.id) s.activeId = null;
  return `Stowed ${defOf(it).name}.`;
}

export function addCoins(s: GameState, n: number): void {
  if (n === 0) return;
  let stack = s.pack.find((p) => p?.defId === "coin") ?? null;
  if (n > 0) {
    if (stack) stack.qty += n;
    else {
      const it = makeItem(s, "coin", n);
      if (!giveItem(s, it)) s.purse += n;
    }
    return;
  }
  let left = -n;
  if (stack) {
    const use = Math.min(stack.qty, left);
    stack.qty -= use;
    left -= use;
    if (stack.qty <= 0) removeItem(s, stack.id);
  }
  if (left > 0) s.purse = Math.max(0, s.purse - left);
}

function hasRoom(s: GameState, it: Item): boolean {
  if (totalMass(s) + itemMass(it) > MASS_CAP + 0.001) return false;
  if (tryStackWould(s, it)) return true;
  return s.pack.some((p) => p === null);
}

function active(s: GameState): Item | null {
  return findItem(s, s.activeId);
}

function toolKind(s: GameState): string | null {
  const it = active(s);
  if (!it) return null;
  return defOf(it).tool ?? null;
}

export function targets(s: GameState): Target[] {
  const list: Target[] = SPOTS.map((sp) => ({ ...sp }));
  for (const p of s.plots) {
    const w = p.w || 20;
    const h = p.h || 16;
    list.push({ id: p.id, name: plotName(p), kind: "plot", x: p.x - w / 2, y: p.y - h / 2, w, h });
  }
  for (const f of s.flowers ?? []) {
    list.push({
      id: f.id,
      name: f.name,
      kind: "flower",
      x: f.x - f.w / 2,
      y: f.y - f.h / 2,
      w: f.w,
      h: f.h,
    });
  }
  for (const b of s.branches) {
    if (!b.left) continue;
    list.push({ id: b.id, name: "Fallen branch", kind: "branch", x: b.x - 8, y: b.y - 8, w: 16, h: 14 });
  }
  for (const a of s.animals) {
    list.push({ id: a.id, name: a.name, kind: "animal", x: a.x - 10, y: a.y - 12, w: 20, h: 16 });
  }
  list.push({ id: "cat", name: "Cat", kind: "cat", x: s.cat.x - 8, y: s.cat.y - 8, w: 16, h: 12 });
  for (const g of s.ground) {
    list.push({
      id: g.id,
      name: defOf(g.item).name,
      kind: "ground",
      x: g.x - 6,
      y: g.y - 6,
      w: 12,
      h: 12,
    });
  }
  return list;
}

function plotName(p: Plot): string {
  if (!p.crop || p.stage === 0) return p.tilled ? "Tilled soil" : p.name;
  if (p.stage < 0) return `Spent ${p.crop}`;
  const stage = p.stage >= 5 ? "ready" : `stage ${p.stage}`;
  return `${p.crop} (${stage})`;
}

function contains(t: Target, px: number, py: number): boolean {
  return px >= t.x && px <= t.x + t.w && py >= t.y && py <= t.y + t.h;
}

export function pickTarget(s: GameState, px: number, py: number): Target | null {
  const hits = targets(s).filter((t) => contains(t, px, py));
  if (!hits.length) {
    let best: Target | null = null;
    let bestD = 10;
    for (const t of targets(s)) {
      const cx = Math.max(t.x, Math.min(px, t.x + t.w));
      const cy = Math.max(t.y, Math.min(py, t.y + t.h));
      const d = Math.hypot(px - cx, py - cy);
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    return best;
  }
  hits.sort((a, b) => a.w * a.h - b.w * b.h);
  return hits[0] ?? null;
}

function inReach(s: GameState, px: number, py: number): boolean {
  return Math.hypot(s.x - px, s.y - py) <= REACH;
}

function structure(s: GameState, id: string) {
  return s.structures.find((st) => st.id === id);
}

function shaveStruct(s: GameState, id: string, n: number) {
  const st = structure(s, id);
  if (st) st.floor = Math.max(0, +(st.floor - n).toFixed(2));
}

function wear(it: Item | null, n: number) {
  if (!it) return;
  it.floor = Math.max(0, +(it.floor - n).toFixed(2));
}

function spent(it: Item | null): boolean {
  return !!it && defOf(it).kind === "tool" && it.floor <= 0;
}

export function facingPoint(s: GameState): { x: number; y: number } {
  const d = 14;
  if (s.dir === "s") return { x: s.x, y: s.y + d };
  if (s.dir === "n") return { x: s.x, y: s.y - d };
  if (s.dir === "e") return { x: s.x + d, y: s.y };
  return { x: s.x - d, y: s.y };
}

function seedItem(s: GameState): Item | null {
  const sel = findItem(s, s.hotbar[s.selected]);
  if (sel && defOf(sel).kind === "seed") return sel;
  return s.pack.find((p) => p && defOf(p).kind === "seed") ?? null;
}

function produceItem(s: GameState): Item | null {
  return s.pack.find((p) => p && defOf(p).kind === "product" && !["milk", "egg"].includes(p.defId)) ?? null;
}

function verb(s: GameState, t: Target): string {
  if (t.kind === "ground") return `Pick up ${t.name}`;
  if (t.kind === "plot") {
    const p = s.plots.find((pl) => pl.id === t.id)!;
    const tk = toolKind(s);
    if (p.stage < 0) return "Clear spent bed";
    if (p.stage >= 5) return `Harvest ${p.crop}`;
    if (p.stage === 0 && !p.tilled) return "Till soil";
    if (p.stage === 0) return "Plant seed";
    if (tk === "water") return `Water ${p.crop}`;
    return `Tend ${p.crop}`;
  }
  if (t.kind === "well") return toolKind(s) === "water" ? "Draw well" : "Wash at well";
  if (t.kind === "pond") return "Draw pond";
  if (t.kind === "tub") {
    if (s.downed) return "Climb into the tub";
    return isNight(s.time) ? "Sleep until dawn" : "Wash in the tub";
  }
  if (t.kind === "fire") return "Cook at campfire";
  if (t.kind === "hearth") return "Sit by the fire";
  if (t.kind === "shed") return isNight(s.time) ? "Sleep in the house" : "Open the house";
  if (t.kind === "bench") return "Use workbench";
  if (t.kind === "grind") return "Sharpen tool";
  if (t.kind === "gate") return toolKind(s) === "hammer" ? "Repair gate" : "Check gate";
  if (t.kind === "branch") return "Chop branch";
  if (t.kind === "animal") {
    const a = s.animals.find((an) => an.id === t.id)!;
    if (a.ready && a.kind !== "goat") return a.kind === "cow" ? "Collect milk" : "Collect egg";
    if (a.kind === "goat") return "Scratch the goat";
    return `Feed ${a.name.toLowerCase()}`;
  }
  if (t.kind === "cat") return "Pet the cat";
  if (t.kind === "flower") {
    const f = s.flowers?.find((fl) => fl.id === t.id);
    return f && f.bloom >= 2 ? `Pick ${f.name.toLowerCase()}` : t.name;
  }
  return t.name;
}

export function promptAt(s: GameState, px: number, py: number): string {
  if (!inReach(s, px, py)) return "";
  const t = pickTarget(s, px, py);
  if (!t) return "";
  return `${verb(s, t)}  [E]`;
}

export function examineAt(s: GameState, px: number, py: number): string {
  const t = pickTarget(s, px, py);
  if (!t) return "Dirt, grass, and the fence line.";
  if (t.kind === "plot") {
    const p = s.plots.find((pl) => pl.id === t.id)!;
    if (!p.crop || p.stage === 0) {
      return p.tilled ? "Tilled soil. It will take a seed." : "Packed soil. The shovel opens it.";
    }
    if (p.stage < 0) return `The ${p.crop} died of thirst. Scythe it clear.`;
    const wet = p.watered ? "Watered." : "Dry.";
    const wilt = p.wilt > 0 ? " Wilting." : "";
    return `${p.crop}, ${p.stage >= 5 ? "ready to cut" : "stage " + p.stage}. ${wet}${wilt}`;
  }
  if (t.kind === "flower") {
    const f = s.flowers?.find((fl) => fl.id === t.id);
    if (!f) return "A flower bed.";
    if (f.bloom >= 2) return `${f.name}. Open and ready. Press E to pick.`;
    if (f.bloom === 1) return `${f.name}. A bud, not ready to cut.`;
    return `${f.name}. Cut back. It will bud on its own.`;
  }
  if (t.kind === "gate" || t.kind === "shed" || t.kind === "bench") {
    const id = t.kind === "gate" ? "gate" : t.kind === "shed" ? "shed" : "bench";
    const st = structure(s, id)!;
    return `${st.name}. Quality ${Math.round(st.quality)}. Floor ${st.floor.toFixed(1)} of ${st.floorMax}.`;
  }
  if (t.kind === "animal") {
    const a = s.animals.find((an) => an.id === t.id)!;
    return `${a.name}. ${a.fed ? "Fed today." : "Hungry."} ${a.ready ? "Something is ready." : ""}`.trim();
  }
  if (t.kind === "ground") {
    const g = s.ground.find((gr) => gr.id === t.id)!;
    const d = defOf(g.item);
    return `${d.name}. Floor ${g.item.floor}. Weight ${itemMass(g.item).toFixed(1)}. Left where it fell.`;
  }
  return `${t.name}. ${SPOTS.find((sp) => sp.id === t.id)?.kind === "well" ? "Water, a wash, a small second wind." : ""}`.trim();
}

function startAct(s: GameState, kind: string, target: string, dur = 0.6): InteractResult {
  if (s.action) {
    s.pending = s.pending ?? { px: s.x, py: s.y };
    return { msg: "Queued." };
  }
  const tool = active(s);
  if (spent(tool) && ["water", "till", "harvest", "chop", "repair", "sharpen"].includes(kind)) {
    return { msg: "The tool is spent. Repair it at the workbench." };
  }
  if (s.stamina < 4) return { msg: "Too tired to swing." };
  s.action = { kind, target, elapsed: 0, dur };
  return { msg: "Working…" };
}

export function interact(s: GameState, px: number, py: number): InteractResult {
  if (s.downed) {
    const tub = targets(s).find((t) => t.kind === "tub");
    if (tub && (contains(tub, px, py) || Math.hypot(s.x - tub.x, s.y - tub.y) < 28)) {
      s.downed = false;
      s.stamina = Math.max(s.stamina, 55);
      return { msg: "The tub takes the ache out. You can stand.", save: true };
    }
    return { msg: "Downed. Crawl to the bathtub." };
  }
  if (!inReach(s, px, py)) return { msg: "Too far." };
  const t = pickTarget(s, px, py);
  if (!t) return { msg: "Nothing to use here." };
  if (s.action) {
    s.pending = { px, py };
    return { msg: "Next action queued." };
  }

  if (t.kind === "ground") return pickup(s, t.id);
  if (t.kind === "plot") return usePlot(s, t.id);
  if (t.kind === "well") return useWell(s);
  if (t.kind === "pond") return usePond(s);
  if (t.kind === "tub") return useTub(s);
  if (t.kind === "fire") return useFire(s);
  if (t.kind === "hearth") {
    s.stamina = Math.min(100, s.stamina + 8);
    return { msg: "You sit by the fire. The warmth settles in.", save: true };
  }
  if (t.kind === "shed") {
    if (isNight(s.time)) return sleepNow(s);
    shaveStruct(s, "shed", 0.2);
    return { panel: "vault", save: true, msg: "The door opens. The ledger sits just inside." };
  }
  if (t.kind === "bench") {
    shaveStruct(s, "bench", 0.3);
    return { panel: "craft", msg: "Workbench. Quality and Floor live here." };
  }
  if (t.kind === "grind") return useGrind(s);
  if (t.kind === "gate") return useGate(s);
  if (t.kind === "branch") return useBranch(s, t.id);
  if (t.kind === "animal") return useAnimal(s, t.id);
  if (t.kind === "cat") return petCat(s);
  if (t.kind === "flower") return pickFlower(s, t.id);
  return { msg: "Nothing to use here." };
}

function usePlot(s: GameState, id: string): InteractResult {
  const p = s.plots.find((pl) => pl.id === id);
  if (!p) return { msg: "The bed is gone." };
  const tk = toolKind(s);
  if (p.stage < 0) {
    if (tk !== "scythe") return { msg: "Requires scythe." };
    return startAct(s, "clear", id);
  }
  if (p.stage >= 5) {
    if (tk !== "scythe") return { msg: "Requires scythe." };
    return startAct(s, "harvest", id);
  }
  if (p.stage === 0 && !p.tilled) {
    if (tk !== "shovel") return { msg: "Requires shovel." };
    return startAct(s, "till", id);
  }
  if (p.stage === 0) {
    if (!seedItem(s)) return { msg: "No seeds in the pack." };
    return startAct(s, "plant", id);
  }
  if (tk === "water") {
    const can = active(s);
    if (!can || (can.water ?? 0) <= 0) return { msg: "The can is empty." };
    return startAct(s, "water", id);
  }
  if (tk === "scythe") return { msg: "Not ready to harvest." };
  return { msg: p.watered ? "Already watered." : "Requires the watering can." };
}

function useWell(s: GameState): InteractResult {
  const it = active(s);
  if (it && defOf(it).tool === "water") {
    if ((it.water ?? 0) >= (defOf(it).waterMax ?? 0)) {
      s.stamina = Math.min(100, s.stamina + 6);
      return { msg: "The can is full. You drink a little.", save: true };
    }
    return { ...startAct(s, "fill", "well"), save: true };
  }
  s.stamina = Math.min(100, s.stamina + 8);
  return { msg: "You wash at the well. A little stamina returns.", save: true };
}

function usePond(s: GameState): InteractResult {
  const it = active(s);
  if (!it || defOf(it).tool !== "water") return { msg: "Requires the watering can." };
  if ((it.water ?? 0) >= (defOf(it).waterMax ?? 0)) return { msg: "The can is already full." };
  return startAct(s, "fill", "pond");
}

function useTub(s: GameState): InteractResult {
  if (isNight(s.time)) return sleepNow(s);
  s.stamina = Math.min(100, s.stamina + 12);
  return { msg: "A wash in the old tub. Stamina eases back.", save: true };
}

function sleepNow(s: GameState): InteractResult {
  applyDawn(s);
  s.day += 1;
  s.time = 0.05;
  s.stamina = Math.max(s.stamina, 78);
  s.downed = false;
  s.stats.daysSlept += 1;
  const summary = s.day > 14;
  s.summary = summary;
  const dead = s.plots.filter((p) => p.kind === "bed" && p.stage < 0).length;
  const note = dead ? ` ${dead} bed${dead === 1 ? "" : "s"} gave out.` : " The beds held.";
  return {
    msg: `Dawn of day ${s.day}.${note}`,
    save: true,
    summary,
    panel: summary ? "summary" : undefined,
  };
}

function useFire(s: GameState): InteractResult {
  if (!produceItem(s)) return { msg: "Need raw produce to cook." };
  return startAct(s, "cook", "fire");
}

function useGrind(s: GameState): InteractResult {
  const it = active(s);
  if (!it || defOf(it).kind !== "tool") return { msg: "Activate a tool to sharpen." };
  return startAct(s, "sharpen", it.id);
}

function useGate(s: GameState): InteractResult {
  const st = structure(s, "gate")!;
  if (toolKind(s) === "hammer") {
    if (!s.pack.some((p) => p?.defId === "kit")) return { msg: "Requires a repair kit. Two branches at the bench." };
    return startAct(s, "repair", "gate");
  }
  shaveStruct(s, "gate", 0.4);
  return {
    msg: `The gate is loose. Quality ${Math.round(st.quality)}. Floor ${st.floor.toFixed(1)}. Hammer and a kit will set it.`,
  };
}

function useBranch(s: GameState, id: string): InteractResult {
  if (toolKind(s) !== "axe") return { msg: "Requires axe. The standing trees are not for cutting." };
  return startAct(s, "chop", id);
}

function useAnimal(s: GameState, id: string): InteractResult {
  const a = s.animals.find((an) => an.id === id);
  if (!a) return { msg: "It wandered off." };
  if (a.ready && a.kind === "cow") return startAct(s, "collect", id);
  if (a.ready && a.kind === "rooster") return startAct(s, "collect", id);
  if (a.kind === "goat" && !produceItem(s)) {
    s.stamina = Math.min(100, s.stamina + 3);
    return { msg: "The goat leans in. No milk, just the company." };
  }
  if (!produceItem(s)) return { msg: "Need produce in the pack to feed." };
  if (a.fed) return { msg: `${a.name} is already fed today.` };
  return startAct(s, "feed", id);
}

function petCat(s: GameState): InteractResult {
  if (s.cat.petCd > 0) return { msg: "The cat is busy being a cat." };
  s.cat.petCd = 20;
  s.stamina = Math.min(100, s.stamina + 4);
  return { msg: "The cat allows it. A little of the day comes back." };
}

function pickFlower(s: GameState, id: string): InteractResult {
  const f = s.flowers?.find((fl) => fl.id === id);
  if (!f) return { msg: "The bed is empty." };
  if (f.bloom < 2) {
    return { msg: f.bloom === 1 ? "Still a bud." : "Cut back. Give it time." };
  }
  const item = makeItem(s, "flower");
  if (!hasRoom(s, item)) return { msg: "Pack is full." };
  giveItem(s, item);
  f.bloom = 0;
  f.grow = 14 + unitRand(s) * 6;
  return { msg: `Picked the ${f.name.toLowerCase()}. It will bloom again.`, save: true };
}

function stepFlowers(s: GameState, dt: number) {
  if (!s.flowers || !s.flowers.length) s.flowers = defaultFlowers();
  for (const f of s.flowers) {
    if (f.bloom >= 2) continue;
    f.grow -= dt;
    if (f.grow > 0) continue;
    f.bloom += 1;
    f.grow = f.bloom >= 2 ? 0 : 9 + unitRand(s) * 7;
  }
}

function pickup(s: GameState, id: string): InteractResult {
  const idx = s.ground.findIndex((g) => g.id === id);
  if (idx < 0) return { msg: "Nothing there." };
  const g = s.ground[idx]!;
  if (!hasRoom(s, g.item)) {
    if (s.pack.every((p) => p !== null)) return { msg: "Pack is full." };
    return { msg: "Too heavy to lift." };
  }
  s.ground.splice(idx, 1);
  giveItem(s, g.item);
  return { msg: `Picked up ${defOf(g.item).name}.` };
}

export function resolveAction(s: GameState): string {
  const act = s.action;
  if (!act) return s.message;
  const tool = active(s);
  const cost = (stam: number, floorLoss: number) => {
    s.stamina = Math.max(0, s.stamina - stam);
    wear(tool, floorLoss);
    if (s.stamina <= 0) down(s);
  };
  if (act.kind === "water") {
    const p = s.plots.find((pl) => pl.id === act.target);
    const can = tool;
    if (!p || !can || (can.water ?? 0) <= 0) return "The can is empty.";
    if (!p.crop || p.stage <= 0) return "Nothing there to water.";
    can.water = (can.water ?? 0) - 1;
    p.watered = true;
    cost(5, 0.35);
    return `Watered the ${p.crop}. Can ${can.water}/${defOf(can).waterMax}.`;
  }
  if (act.kind === "fill") {
    const can = tool;
    if (!can || defOf(can).tool !== "water") return "Requires the watering can.";
    can.water = defOf(can).waterMax ?? 8;
    cost(3, 0.15);
    return act.target === "pond" ? "Filled the can at the pond." : "Filled the can at the well.";
  }
  if (act.kind === "harvest") {
    const p = s.plots.find((pl) => pl.id === act.target);
    if (!p || !p.crop || p.stage < 5) return "Not ready to harvest.";
    const item = makeItem(s, p.crop);
    if (!hasRoom(s, item)) return "Pack is full.";
    giveItem(s, item);
    p.crop = null;
    p.stage = 0;
    p.watered = false;
    p.wilt = 0;
    p.revealed = true;
    s.stats.harvested += 1;
    cost(6, 0.4);
    return `Harvested ${defOf(item).name}. Floor ${item.floor}.`;
  }
  if (act.kind === "clear") {
    const p = s.plots.find((pl) => pl.id === act.target);
    if (!p) return "Nothing to clear.";
    p.crop = null;
    p.stage = 0;
    p.wilt = 0;
    p.watered = false;
    p.revealed = true;
    cost(4, 0.3);
    return "Cleared the spent bed.";
  }
  if (act.kind === "till") {
    const p = s.plots.find((pl) => pl.id === act.target);
    if (!p) return "No dirt there.";
    p.tilled = true;
    p.revealed = true;
    cost(7, 0.45);
    return "Tilled a patch. It will take a seed.";
  }
  if (act.kind === "plant") {
    const p = s.plots.find((pl) => pl.id === act.target);
    const seed = seedItem(s);
    if (!p || !seed) return "No seeds in the pack.";
    const crop = defOf(seed).crop as CropId;
    if (seed.qty > 1) seed.qty -= 1;
    else removeItem(s, seed.id);
    p.crop = crop;
    p.stage = 1;
    p.watered = true;
    p.wilt = 0;
    p.tilled = true;
    p.revealed = true;
    cost(4, 0);
    return `Planted ${crop}.`;
  }
  if (act.kind === "chop") {
    const b = s.branches.find((br) => br.id === act.target);
    if (!b || !b.left) return "The branch is already taken.";
    const item = makeItem(s, "branch");
    if (!hasRoom(s, item)) return "Pack is full.";
    b.left = false;
    giveItem(s, item);
    cost(8, 0.5);
    return "Chopped a branch. The trees around the fence stay up.";
  }
  if (act.kind === "cook") {
    const raw = produceItem(s);
    if (!raw) return "Need raw produce to cook.";
    if (raw.qty > 1) raw.qty -= 1;
    else removeItem(s, raw.id);
    const loaf = makeItem(s, "loaf");
    if (!giveItem(s, loaf)) {
      s.ground.push({ id: uid(s), item: loaf, x: s.x + 6, y: s.y });
    }
    s.stats.cooked += 1;
    s.stamina = Math.min(100, s.stamina + 8);
    cost(4, 0);
    return "Cooked a hearth loaf at the campfire.";
  }
  if (act.kind === "sharpen") {
    const it = findItem(s, act.target);
    if (!it) return "The tool is gone.";
    it.quality = Math.min(100, it.quality + 5);
    wear(it, 1.2);
    cost(10, 0);
    return `Sharpened. Quality ${Math.round(it.quality)}. Floor ${it.floor.toFixed(1)}.`;
  }
  if (act.kind === "repair") {
    const st = structure(s, act.target);
    const kit = s.pack.find((p) => p?.defId === "kit");
    if (!st || !kit) return "Requires a repair kit.";
    removeItem(s, kit.id);
    st.quality = Math.min(100, st.quality + 28);
    st.floor = st.floorMax;
    if (st.id === "gate") s.stats.gateRepaired = true;
    cost(8, 0.5);
    return `${st.name} repaired. Quality ${Math.round(st.quality)}. Floor restored.`;
  }
  if (act.kind === "feed") {
    const a = s.animals.find((an) => an.id === act.target);
    const raw = produceItem(s);
    if (!a || !raw) return "Nothing to feed.";
    if (raw.qty > 1) raw.qty -= 1;
    else removeItem(s, raw.id);
    a.fed = true;
    cost(3, 0);
    return `Fed the ${a.name.toLowerCase()}. Check back after dawn.`;
  }
  if (act.kind === "collect") {
    const a = s.animals.find((an) => an.id === act.target);
    if (!a || !a.ready) return "Nothing ready.";
    const def = a.kind === "cow" ? "milk" : "egg";
    const item = makeItem(s, def);
    if (!hasRoom(s, item)) return "Pack is full.";
    a.ready = false;
    giveItem(s, item);
    cost(3, 0);
    return `Collected ${defOf(item).name}.`;
  }
  return "Done.";
}

function down(s: GameState) {
  if (s.downed) return;
  s.downed = true;
  s.stamina = 14;
  const idx = s.pack.findIndex((it) => it?.defId === "backpack");
  let bag: Item | null = null;
  if (idx >= 0) bag = s.pack[idx] ?? null;
  else if (s.body.container?.defId === "backpack") bag = s.body.container;
  if (bag) {
    takeItem(s, bag.id);
    unlink(s, bag.id);
    s.ground.push({ id: uid(s), item: bag, x: s.x, y: s.y + 6 });
  }
  wear(active(s), 2);
  s.message = "Downed. The backpack drops. Crawl to the bathtub.";
}

export function applyDawn(s: GameState) {
  for (const p of s.plots) {
    if (!p.crop || p.stage === 0 || p.stage < 0) continue;
    if (p.watered) {
      if (p.stage < 5) {
        p.stage += 1;
        p.revealed = true;
      }
      p.wilt = 0;
    } else {
      p.wilt += 1;
      p.revealed = true;
      if (p.wilt >= 2) p.stage = -1;
    }
    p.watered = false;
  }
  for (const a of s.animals) {
    if (a.fed) {
      a.ready = a.kind !== "goat";
      a.fed = false;
    } else a.ready = false;
  }
}

export function onQ(s: GameState): string {
  const id = s.hotbar[s.selected];
  if (!id) {
    s.activeId = null;
    return "Empty hotbar slot.";
  }
  const it = findItem(s, id);
  if (!it) return "That item is gone.";
  const d = defOf(it);
  if (d.kind === "note") return "A note is paper. You cannot use it.";
  if (d.kind === "food" || d.kind === "product") return eat(s, it);
  if (s.activeId === id) {
    s.activeId = null;
    return `Active tool off. ${d.name} stays in the pack.`;
  }
  s.activeId = id;
  return `Active: ${d.name}.`;
}

function eat(s: GameState, it: Item): string {
  const d = defOf(it);
  s.stamina = Math.min(100, s.stamina + (d.stamina ?? 0));
  if (d.stack && it.qty > 1) it.qty -= 1;
  else removeItem(s, it.id);
  return `Ate ${d.name}. Stamina ${Math.round(s.stamina)}.`;
}

export function onF(s: GameState): string {
  if (s.body.hands) {
    const it = s.body.hands;
    s.body.hands = null;
    if (!giveItem(s, it)) {
      s.body.hands = it;
      return "Pack is full. Cannot stow the hand item.";
    }
    return `Stowed ${defOf(it).name}.`;
  }
  if (!s.activeId) return "No active tool to draw.";
  const it = takeItem(s, s.activeId);
  if (!it) return "The active tool is not on you.";
  s.body.hands = it;
  return `Drew ${defOf(it).name} into the hand. Active tool can still differ.`;
}

export function selectHotbar(s: GameState, index: number) {
  s.selected = (index + 8) % 8;
}

export function dropItem(s: GameState, id: string): string {
  const it = takeItem(s, id);
  if (!it) return "Nothing to drop.";
  unlink(s, id);
  s.ground.push({ id: uid(s), item: it, x: s.x + 4, y: s.y + 2 });
  return `Dropped ${defOf(it).name}. It stays where it fell.`;
}

export function deposit(s: GameState, id: string): string {
  if (s.body.hands?.id === id) return "Stow it into the pack before the chest takes it.";
  const it = takeFromContainer(s.pack, id);
  if (!it) return "Only the pack deposits. Nested goods must come out first.";
  const slot = s.vault.findIndex((v) => v === null);
  if (slot < 0) {
    giveItem(s, it);
    return "Vault is full.";
  }
  unlink(s, id);
  s.vault[slot] = it;
  return `Deposited ${defOf(it).name}.`;
}

export function withdraw(s: GameState, index: number, asNote: boolean): string {
  const it = s.vault[index];
  if (!it) return "Empty slot.";
  if (asNote && it.defId !== "coin") {
    const note = makeItem(s, "note", it.qty);
    note.noteOf = it.defId === "note" ? it.noteOf : it.defId;
    note.floor = it.floor;
    note.floorMax = it.floor;
    note.quality = it.quality;
    if (!hasRoom(s, note)) return "Pack is full.";
    s.vault[index] = null;
    giveItem(s, note);
    return `Withdrew a note of ${DEFS[note.noteOf ?? "note"]?.name ?? "goods"}. Paper, no weight, no use.`;
  }
  if (!hasRoom(s, it)) {
    if (s.pack.every((p) => p !== null) && !tryStackWould(s, it)) return "Pack is full.";
    return "Too heavy to lift.";
  }
  s.vault[index] = null;
  giveItem(s, it);
  return `Withdrew ${defOf(it).name}.`;
}

function tryStackWould(s: GameState, it: Item): boolean {
  const d = defOf(it);
  if (!d.stack) return false;
  return s.pack.some((p) => p && p.defId === it.defId && p.noteOf === it.noteOf && p.floor === it.floor);
}

export function sellItem(s: GameState, id: string): string {
  const it = findItem(s, id);
  if (!it) return "Nothing selected.";
  if (it.defId === "coin") return "The ledger will not buy coin.";
  if (it.contents?.some(Boolean)) return "Empty the backpack before selling it.";
  const value = Math.max(0, Math.floor(it.floor * (defOf(it).stack ? it.qty : 1)));
  removeItem(s, id);
  addCoins(s, value);
  s.stats.floorEarned += value;
  return `Sold for ${value} Floor.`;
}

export function buyFineCan(s: GameState): string {
  if (s.stats.boughtTool) return "You already keep a fine can.";
  if (coinCount(s) < 48) return "The fine can costs 48 Floor.";
  const it = makeItem(s, "fine_can");
  if (!hasRoom(s, it)) return "Pack is full.";
  addCoins(s, -48);
  giveItem(s, it);
  s.stats.boughtTool = true;
  const slot = s.hotbar.findIndex((h) => h === null);
  if (slot >= 0) s.hotbar[slot] = it.id;
  return "Bought the fine watering can. Floor paid, pack heavier by less than the old one.";
}

export function craftKit(s: GameState): string {
  const ids = s.pack.filter((p) => p?.defId === "branch").map((p) => p!.id);
  if (ids.length < 2) return "Need two branches in the pack.";
  const kit = makeItem(s, "kit");
  removeItem(s, ids[0]!);
  removeItem(s, ids[1]!);
  if (!giveItem(s, kit)) {
    s.ground.push({ id: uid(s), item: kit, x: s.x, y: s.y });
    return "Kit made, but the pack was full. It is on the ground.";
  }
  return "Made a repair kit.";
}

export function craftRepairTool(s: GameState): string {
  const tool = active(s);
  if (!tool || defOf(tool).kind !== "tool") return "Activate a tool to repair.";
  const kit = s.pack.find((p) => p?.defId === "kit");
  if (!kit) return "Need a repair kit in the pack.";
  removeItem(s, kit.id);
  tool.floor = tool.floorMax;
  tool.quality = Math.min(100, tool.quality + 4);
  return `${defOf(tool).name} restored to ${tool.floorMax} Floor.`;
}

export function craftSeeds(s: GameState): string {
  if (coinCount(s) < 4) return "A seed packet costs 4 Floor.";
  const seeds = makeItem(s, "seed_tomato", 2);
  if (!hasRoom(s, seeds)) return "Pack is full.";
  addCoins(s, -4);
  giveItem(s, seeds);
  return "Bought two tomato seeds.";
}

export function swapPack(s: GameState, from: number, to: number) {
  const a = s.pack[from];
  s.pack[from] = s.pack[to] ?? null;
  s.pack[to] = a ?? null;
}

export function moveToBackpack(s: GameState, fromPack: number, toInner: number): string {
  const bag = s.pack.find((p) => p?.defId === "backpack") ?? s.body.container;
  if (!bag?.contents) return "No backpack.";
  const it = s.pack[fromPack];
  if (!it || it.id === bag.id) return "Cannot nest the backpack in itself.";
  if (bag.contents[toInner]) return "That pocket is full.";
  s.pack[fromPack] = null;
  bag.contents[toInner] = it;
  return `Packed ${defOf(it).name}.`;
}

export function moveFromBackpack(s: GameState, inner: number): string {
  const bag = s.pack.find((p) => p?.defId === "backpack") ?? s.body.container;
  if (!bag?.contents) return "No backpack.";
  const it = bag.contents[inner];
  if (!it) return "Empty pocket.";
  bag.contents[inner] = null;
  if (!giveItem(s, it)) {
    bag.contents[inner] = it;
    return "Pack is full.";
  }
  return `Took ${defOf(it).name}.`;
}

function moveAxis(s: GameState, dx: number, dy: number) {
  const nx = s.x + dx;
  const ny = s.y + dy;
  if (!footBlocked(nx, ny)) {
    s.x = nx;
    s.y = ny;
    return;
  }
  if (!footBlocked(nx, s.y)) s.x = nx;
  else if (!footBlocked(s.x, ny)) s.y = ny;
}

export function step(s: GameState, dt: number, input: Input) {
  const stepDt = Math.min(0.05, Math.max(0, dt));
  s.clock += stepDt;
  if (s.cat.petCd > 0) s.cat.petCd = Math.max(0, s.cat.petCd - stepDt);
  stepFlowers(s, stepDt);
  if (input.frozen) {
    s.speed = 0;
    return;
  }
  if (s.action) {
    s.action.elapsed += stepDt;
    s.speed = 0;
    if (!s.action.hit && s.action.elapsed >= s.action.dur * CONTACT_AT) {
      s.action.hit = true;
      const fail = contactFail(s);
      if (fail) {
        s.action = null;
        s.pending = null;
        s.message = fail;
      }
    }
    if (s.action && s.action.elapsed >= s.action.dur) {
      const msg = resolveAction(s);
      s.action = null;
      s.message = msg;
      if (s.pending) {
        const p = s.pending;
        s.pending = null;
        const r = interact(s, p.px, p.py);
        if (r.msg) s.message = r.msg;
        s.uiEvent = r;
      }
    }
  } else {
    let mx = input.mx;
    let my = input.my;
    let mag = Math.hypot(mx, my);
    if (mag > 1) {
      mx /= mag;
      my /= mag;
      mag = 1;
    }
    const mass = totalMass(s);
    const crawl = s.downed || mass >= MASS_CAP - 0.05;
    const canRun = input.run && !crawl && mass < MASS_RUN && s.stamina > 8;
    const speed = crawl ? 22 : canRun ? 64 : 42;
    if (mag > 0.08) {
      if (Math.abs(mx) > Math.abs(my)) s.dir = mx > 0 ? "e" : "w";
      else s.dir = my > 0 ? "s" : "n";
      moveAxis(s, mx * speed * stepDt, my * speed * stepDt);
      s.x = Math.max(8, Math.min(WORLD_W - 8, s.x));
      s.speed = speed;
      if (canRun) s.stamina = Math.max(0, s.stamina - stepDt * (8 + mass * 0.35));
      else s.stamina = Math.min(100, s.stamina + stepDt * 3);
    } else {
      s.speed = 0;
      s.stamina = Math.min(100, s.stamina + stepDt * 8);
    }
    if (s.stamina <= 0) down(s);
  }
  s.time = Math.min(0.999, s.time + stepDt / 90);
  stepWeather(s, stepDt);
  tendSelf(s, stepDt, input);
  stepCritters(s, stepDt);
}

function tendSelf(s: GameState, dt: number, input: Input) {
  ensureLife(s);
  const life = s.life;
  life.hunger = Math.min(100, life.hunger + dt * 0.7);
  life.thirst = Math.min(100, life.thirst + dt * 0.85);
  life.dirt = Math.min(100, life.dirt + dt * 0.28);
  if (s.weather !== "clear") life.dirt = Math.max(0, life.dirt - dt * 0.35);
  life.mood = Math.max(
    0,
    Math.min(100, 100 - life.hunger * 0.35 - life.thirst * 0.35 - life.dirt * 0.2 - Math.max(0, 40 - s.stamina) * 0.45),
  );
  if (life.emote > 0) life.emote = Math.max(0, life.emote - dt);
  else {
    const next = faceFor(s);
    if (next !== "ok" && next !== life.face) life.emote = 1.8;
    life.face = next;
  }

  const steered = Math.hypot(input.mx, input.my) > 0.2;
  if (steered) {
    life.errand = null;
    life.route = [];
  }
  if (steered || s.action || input.frozen || s.downed) return;
  if (s.auto === false) {
    s.speed = 0;
    return;
  }

  if (life.hunger > 58) {
    const food = s.pack.find((p) => p && (defOf(p).kind === "food" || defOf(p).kind === "product") && (defOf(p).stamina ?? 0) > 0);
    if (food) {
      eat(s, food);
      life.hunger = Math.max(0, life.hunger - 46);
      life.face = "heart";
      life.emote = 2.4;
      life.errand = null;
      s.message = "He feeds himself.";
      return;
    }
    life.face = "need";
  }

  const night = isNight(s.time);
  const spot =
    life.thirst > 62
      ? { kind: "drink" as const, x: 150, y: 120 }
      : life.dirt > 68
        ? { kind: "wash" as const, x: 118, y: 78 }
        : s.stamina < 28 || (night && s.stamina < 42)
          ? { kind: "rest" as const, x: night ? 118 : 64, y: night ? 78 : 98 }
          : null;
  if (!spot) {
    life.errand = null;
    if (tendFarm(s, dt)) return;
    stroll(s, dt);
    return;
  }
  life.errand = spot.kind;
  if (life.emote <= 0) life.face = spot.kind === "rest" ? "tired" : "need";
  if (Math.hypot(spot.x - s.x, spot.y - s.y) < 12) {
    if (spot.kind === "drink") {
      life.thirst = Math.max(0, life.thirst - 50);
      s.stamina = Math.min(100, s.stamina + 6);
      s.message = "He drinks at the well.";
    } else if (spot.kind === "wash") {
      life.dirt = Math.max(0, life.dirt - 55);
      s.stamina = Math.min(100, s.stamina + 8);
      s.message = "He washes in the tub.";
    } else if (night) {
      s.message = sleepNow(s).msg ?? s.message;
    } else {
      s.stamina = Math.min(100, s.stamina + dt * 22);
      s.message = "He rests by the fire.";
      life.face = "tired";
      return;
    }
    life.face = "heart";
    life.emote = 2.2;
    life.errand = null;
    life.route = [];
    return;
  }
  const step = followGoal(s, dt, spot.x, spot.y, 32);
  if (step === "stuck") {
    life.route = [];
    life.pause = 0.6;
  }
}

function holdItem(s: GameState, id: string): boolean {
  const it = findItem(s, id);
  if (!it || it.floor <= 0) return false;
  s.activeId = id;
  const idx = s.hotbar.findIndex((h) => h === id);
  if (idx >= 0) s.selected = idx;
  return true;
}

function toolItem(s: GameState, tool: string): Item | null {
  const worn = [s.body.hands, s.body.offhand, s.body.belt].find((p) => p && defOf(p).tool === tool && p.floor > 0);
  if (worn) return worn;
  return s.pack.find((p) => p && defOf(p).tool === tool && p.floor > 0) ?? null;
}

type Chore = { id: string; x: number; y: number; hold: string | null; say: string };

function listChores(s: GameState): Chore[] {
  const out: Chore[] = [];
  const can = toolItem(s, "water");
  const dry = s.plots.find((p) => p.crop && p.stage > 0 && p.stage < 5 && !p.watered);
  if (dry && s.weather === "clear" && can) {
    if ((can.water ?? 0) <= 0) {
      const well = SPOTS.find((sp) => sp.id === "well")!;
      out.push({ id: "fill", x: well.x + well.w / 2, y: well.y + well.h / 2, hold: can.id, say: "He goes to fill the can." });
    } else {
      out.push({ id: `${dry.id}:water`, x: dry.x, y: dry.y, hold: can.id, say: `He waters the ${dry.name.toLowerCase()}.` });
    }
  }
  const ripe = s.plots.find((p) => p.stage >= 5 && p.crop);
  const scythe = toolItem(s, "scythe");
  if (ripe && scythe) out.push({ id: `${ripe.id}:cut`, x: ripe.x, y: ripe.y, hold: scythe.id, say: `He harvests the ${ripe.crop}.` });
  const dead = s.plots.find((p) => p.stage < 0);
  if (dead && scythe) out.push({ id: `${dead.id}:clear`, x: dead.x, y: dead.y, hold: scythe.id, say: "He clears the spent bed." });
  const packed = s.plots.find((p) => p.stage === 0 && !p.tilled);
  const shovel = toolItem(s, "shovel");
  if (packed && shovel) out.push({ id: `${packed.id}:till`, x: packed.x, y: packed.y, hold: shovel.id, say: `He tills the ${packed.name.toLowerCase()}.` });
  const open = s.plots.find((p) => p.stage === 0 && p.tilled);
  if (open && seedItem(s)) out.push({ id: `${open.id}:plant`, x: open.x, y: open.y, hold: null, say: `He plants the ${open.name.toLowerCase()}.` });
  const ready = s.animals.find((a) => a.ready && a.kind !== "goat");
  if (ready) out.push({ id: `${ready.id}:collect`, x: ready.x, y: ready.y, hold: null, say: `He collects from the ${ready.name.toLowerCase()}.` });
  const hungry = s.animals.find((a) => !a.fed);
  if (hungry && produceItem(s)) out.push({ id: `${hungry.id}:feed`, x: hungry.x, y: hungry.y, hold: null, say: `He feeds the ${hungry.name.toLowerCase()}.` });
  const bloom = s.flowers?.find((f) => f.bloom >= 2);
  if (bloom) out.push({ id: `${bloom.id}:pick`, x: bloom.x, y: bloom.y, hold: null, say: `He picks the ${bloom.name.toLowerCase()}.` });
  const branch = s.branches.find((b) => b.left);
  const axe = toolItem(s, "axe");
  if (branch && axe && s.pack.some((p) => p === null)) {
    out.push({ id: `${branch.id}:chop`, x: branch.x, y: branch.y, hold: axe.id, say: "He chops a branch." });
  }
  const gate = s.structures.find((st) => st.id === "gate");
  const hammer = toolItem(s, "hammer");
  const kit = s.pack.some((p) => p?.defId === "kit");
  if (gate && hammer && kit && gate.floor < 8) {
    const spot = SPOTS.find((sp) => sp.id === "gate")!;
    out.push({ id: "gate:repair", x: spot.x + spot.w / 2, y: spot.y + spot.h / 2, hold: hammer.id, say: "He repairs the gate." });
  }
  const dull = s.pack.find((p) => p && defOf(p).kind === "tool" && p.floor > 0 && p.floor < 3);
  if (dull) {
    const grind = SPOTS.find((sp) => sp.id === "grind")!;
    out.push({ id: `${dull.id}:sharpen`, x: grind.x + grind.w / 2, y: grind.y + grind.h / 2, hold: dull.id, say: `He sharpens the ${defOf(dull).name.toLowerCase()}.` });
  }
  return out;
}

function workSpot(x: number, y: number): { x: number; y: number } {
  if (!footBlocked(x, y)) return { x, y };
  for (const r of [8, 14, 22, 30]) {
    for (const [dx, dy] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ]) {
      const px = x + dx * r;
      const py = y + dy * r;
      if (!footBlocked(px, py) && Math.hypot(px - x, py - y) <= REACH - 2) return { x: px, y: py };
    }
  }
  return { x, y };
}

function tendFarm(s: GameState, dt: number): boolean {
  const life = s.life;
  const job = listChores(s).find((c) => c.id !== life.skip || s.clock >= life.skipUntil);
  if (!job) return false;
  if (job.hold && !holdItem(s, job.hold)) {
    life.skip = job.id;
    life.skipUntil = s.clock + 6;
    return false;
  }
  if (life.chore !== job.id) {
    life.chore = job.id;
    life.route = [];
  }
  if (inReach(s, job.x, job.y)) {
    const dx = job.x - s.x;
    const dy = job.y - s.y;
    if (Math.abs(dx) > Math.abs(dy)) s.dir = dx > 0 ? "e" : "w";
    else if (Math.abs(dy) > 1) s.dir = dy > 0 ? "s" : "n";
    const result = interact(s, job.x, job.y);
    if (s.action) s.message = job.say;
    else if (result.msg) s.message = result.msg;
    life.route = [];
    if (!s.action) {
      life.skip = job.id;
      life.skipUntil = s.clock + 5;
    }
    s.speed = 0;
    return true;
  }
  const stand = workSpot(job.x, job.y);
  const step = followGoal(s, dt, stand.x, stand.y, 32);
  if (step === "stuck") {
    life.skip = job.id;
    life.skipUntil = s.clock + 5;
    life.route = [];
    life.chore = "";
    return false;
  }
  return true;
}

function stroll(s: GameState, dt: number) {
  const life = s.life;
  if (life.pause > 0) {
    life.pause -= dt;
    s.speed = 0;
    return;
  }
  if (life.route.length < 2) {
    if (Math.hypot(life.tx - s.x, life.ty - s.y) < 8) pickRoam(s);
    life.route = autoRoute(s.x, s.y, life.tx, life.ty);
    if (life.route.length < 2) {
      pickRoam(s);
      life.pause = 0.5;
      return;
    }
  }
  const step = followGoal(s, dt, life.tx, life.ty, 30);
  if (step === "arrive") {
    life.pause = 1.4 + unitRand(s) * 2.4;
    if (life.mood > 70) {
      life.face = "happy";
      life.emote = 1.6;
    }
    life.route = [];
    pickRoam(s);
    s.speed = 0;
  } else if (step === "stuck") {
    life.route = [];
    life.pause = 0.5;
    pickRoam(s);
    s.speed = 0;
  }
}

const ROAM: [number, number][] = [
  [78, 136],
  [200, 138],
  [248, 128],
  [150, 132],
  [96, 118],
  [182, 240],
  [182, 420],
  [182, 640],
  [182, 860],
];

function pickRoam(s: GameState) {
  const life = s.life;
  for (let i = 0; i < 6; i++) {
    const spot = ROAM[Math.floor(unitRand(s) * ROAM.length)]!;
    if (!autoBlocked(spot[0], spot[1]) && Math.hypot(spot[0] - s.x, spot[1] - s.y) > 24) {
      life.tx = spot[0];
      life.ty = spot[1];
      life.route = [];
      return;
    }
  }
  life.tx = 182;
  life.ty = 220;
  life.route = [];
}

/** Meadow travel stays on the dirt path. The yard still walks around walls. */
function autoBlocked(x: number, y: number): boolean {
  if (y > 172 && (x < 174 || x > 190)) return true;
  return footBlocked(x, y);
}

const PATH_G = 8;

export function autoRoute(x0: number, y0: number, x1: number, y1: number): number[] {
  const cols = Math.ceil(347 / PATH_G);
  const rows = Math.ceil(960 / PATH_G);
  const key = (x: number, y: number) => y * cols + x;
  const clamp = (v: number, max: number) => Math.max(0, Math.min(max, v));
  const cellX = (x: number) => clamp(Math.round(x / PATH_G), cols - 1);
  const cellY = (y: number) => clamp(Math.round(y / PATH_G), rows - 1);
  const open = (x: number, y: number) => x >= 0 && y >= 0 && x < cols && y < rows && !autoBlocked(x * PATH_G, y * PATH_G);
  const sx = cellX(x0);
  const sy = cellY(y0);
  let gx = cellX(x1);
  let gy = cellY(y1);
  if (!open(gx, gy)) {
    let found = false;
    for (let r = 1; r <= 3 && !found; r++) {
      for (let dy = -r; dy <= r && !found; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (open(gx + dx, gy + dy)) {
            gx += dx;
            gy += dy;
            found = true;
            break;
          }
        }
      }
    }
    if (!found) return [];
  }
  const start = key(sx, sy);
  const goal = key(gx, gy);
  if (start === goal) return [x1, y1];
  const gscore = new Map<number, number>([[start, 0]]);
  const prev = new Map<number, number>();
  const openSet = new Set<number>([start]);
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  let guard = 0;
  while (openSet.size > 0 && guard++ < 3000) {
    let cur = -1;
    let best = Infinity;
    for (const k of openSet) {
      const cx = k % cols;
      const cy = (k / cols) | 0;
      const f = (gscore.get(k) ?? 1e9) + Math.abs(cx - gx) + Math.abs(cy - gy);
      if (f < best) {
        best = f;
        cur = k;
      }
    }
    if (cur < 0) break;
    if (cur === goal) break;
    openSet.delete(cur);
    const cx = cur % cols;
    const cy = (cur / cols) | 0;
    const base = gscore.get(cur) ?? 1e9;
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!open(nx, ny)) continue;
      if (dx !== 0 && dy !== 0 && (!open(cx + dx, cy) || !open(cx, cy + dy))) continue;
      const nk = key(nx, ny);
      const cost = base + (dx !== 0 && dy !== 0 ? 1.4 : 1);
      if (cost < (gscore.get(nk) ?? 1e9)) {
        gscore.set(nk, cost);
        prev.set(nk, cur);
        openSet.add(nk);
      }
    }
  }
  if (!prev.has(goal)) return [];
  const chain = [goal];
  let c = goal;
  while (prev.has(c)) {
    c = prev.get(c)!;
    chain.push(c);
  }
  chain.reverse();
  const pts: number[] = [];
  for (let i = 1; i < chain.length; i++) {
    pts.push((chain[i]! % cols) * PATH_G, ((chain[i]! / cols) | 0) * PATH_G);
  }
  pts.push(x1, y1);
  return thinRoute(pts);
}

function thinRoute(pts: number[]): number[] {
  if (pts.length <= 4) return pts;
  const out = [pts[0]!, pts[1]!];
  for (let i = 2; i < pts.length - 2; i += 2) {
    const x0 = out[out.length - 2]!;
    const y0 = out[out.length - 1]!;
    const x1 = pts[i]!;
    const y1 = pts[i + 1]!;
    const x2 = pts[i + 2]!;
    const y2 = pts[i + 3]!;
    if (Math.abs((x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0)) > 12) out.push(x1, y1);
  }
  out.push(pts[pts.length - 2]!, pts[pts.length - 1]!);
  return out;
}

function followGoal(s: GameState, dt: number, x: number, y: number, speed: number): "walk" | "arrive" | "stuck" {
  const life = s.life;
  if (life.tx !== x || life.ty !== y || life.route.length < 2) {
    life.tx = x;
    life.ty = y;
    life.route = Math.hypot(x - s.x, y - s.y) < 8 ? [] : autoRoute(s.x, s.y, x, y);
  }
  if (life.route.length < 2) return Math.hypot(x - s.x, y - s.y) < 10 ? "arrive" : "stuck";
  const wx = life.route[0]!;
  const wy = life.route[1]!;
  const dx = wx - s.x;
  const dy = wy - s.y;
  if (Math.hypot(dx, dy) < 5) {
    life.route = life.route.slice(2);
    return life.route.length < 2 ? "arrive" : "walk";
  }
  const mag = Math.hypot(dx, dy) || 1;
  const step = Math.min(mag, speed * dt);
  const nx = s.x + (dx / mag) * step;
  const ny = s.y + (dy / mag) * step;
  if (autoBlocked(nx, ny)) return "stuck";
  s.x = nx;
  s.y = ny;
  s.speed = speed;
  if (Math.abs(dx) > Math.abs(dy)) s.dir = dx > 0 ? "e" : "w";
  else s.dir = dy > 0 ? "s" : "n";
  return "walk";
}

function faceFor(s: GameState): Life["face"] {
  const life = s.life;
  if (s.downed || life.hunger > 82 || life.thirst > 82) return "ill";
  if (life.hunger > 55 || life.thirst > 55 || life.dirt > 70) return "need";
  if (s.stamina < 32) return "tired";
  if (life.mood > 72) return "happy";
  return "ok";
}

function stepWeather(s: GameState, dt: number) {
  ensureWeather(s);
  s.flash = Math.max(0, s.flash - dt);
  s.weatherLeft -= dt;
  if (s.weatherLeft <= 0) {
    const roll = unitRand(s);
    const hour = 6 + s.time * 16;
    const next = roll < 0.46 ? "clear" : roll < 0.78 || hour < 8 ? "rain" : "storm";
    if (next !== s.weather) {
      s.message =
        next === "storm"
          ? "Thunder. Rain soaks the grass, the beds, the meadow, and the trees."
          : next === "rain"
            ? "Rain. The soil, the plants, and the trees take the water."
            : "The rain passes. The ground stays wet.";
    }
    s.weather = next;
    s.weatherLeft = 16 + unitRand(s) * 22;
  }
  if (s.weather === "clear") {
    s.wet = Math.max(0, s.wet - dt * 0.012);
    return;
  }
  const pour = s.weather === "storm" ? 0.14 : 0.07;
  s.wet = Math.min(1, s.wet + dt * pour);
  for (const p of s.plots) {
    if (p.stage < 0) continue;
    if (p.tilled || p.crop) p.watered = true;
  }
  for (const f of s.flowers) {
    f.grow += dt * (s.weather === "storm" ? 0.22 : 0.1);
    if (f.grow >= 1) {
      f.grow = 0;
      f.bloom = Math.min(4, f.bloom + 1);
    }
  }
  if (s.weather === "storm" && s.flash <= 0 && unitRand(s) < dt * 0.45) {
    s.flash = 0.16;
    s.bolts += 1;
  }
}

function pasture(kind: Animal["kind"]): { x: number; y: number; w: number; h: number } {
  if (kind === "cow") return { x: 36, y: 230, w: 120, h: 340 };
  if (kind === "goat") return { x: 200, y: 240, w: 112, h: 360 };
  return { x: 96, y: 214, w: 60, h: 200 };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function openIn(s: GameState, box: { x: number; y: number; w: number; h: number }, fallback: { x: number; y: number }) {
  for (let i = 0; i < 6; i++) {
    const x = box.x + unitRand(s) * box.w;
    const y = box.y + unitRand(s) * box.h;
    if (!footBlocked(x, y)) return { x, y };
  }
  return fallback;
}

function roam(s: GameState, box: { x: number; y: number; w: number; h: number }, from: { x: number; y: number }, min: number, max: number) {
  const ang = unitRand(s) * Math.PI * 2;
  const dist = min + unitRand(s) * (max - min);
  const x = clamp(from.x + Math.cos(ang) * dist, box.x, box.x + box.w);
  const y = clamp(from.y + Math.sin(ang) * dist, box.y, box.y + box.h);
  if (!footBlocked(x, y)) return { x, y };
  return openIn(s, box, from);
}

function stepCat(s: GameState, dt: number) {
  const yards = [
    { x: 40, y: 104, w: 150, h: 44 },
    { x: 214, y: 146, w: 62, h: 4 },
    { x: 48, y: 210, w: 250, h: 200 },
  ];
  if (!s.cat.mode) s.cat.mode = "sit";
  if (s.cat.tx == null) {
    s.cat.tx = s.cat.x;
    s.cat.ty = s.cat.y;
  }
  if (s.cat.pause > 0) {
    s.cat.pause -= dt;
    return;
  }
  if (s.cat.mode === "sit") {
    if (unitRand(s) < 0.35) {
      s.cat.face *= -1;
      s.cat.pause = 0.6 + unitRand(s) * 1.1;
      return;
    }
    s.cat.mode = "stand";
    s.cat.pause = 0.25;
    return;
  }
  if (s.cat.mode === "stand") {
    const dash = unitRand(s) < 0.2;
    s.cat.mode = dash ? "run" : "walk";
    const yard = yards[Math.floor(unitRand(s) * yards.length)]!;
    const near = Math.hypot(s.x - s.cat.x, s.y - s.cat.y);
    let next = roam(s, yard, { x: s.cat.x, y: s.cat.y }, dash ? 18 : 10, dash ? 48 : 28);
    if (near < 36) {
      const away = near < 14;
      const gx = clamp(s.cat.x + Math.sign(s.cat.x - s.x || 1) * (away ? 20 : -14), yard.x, yard.x + yard.w);
      const gy = clamp(s.cat.y + Math.sign(s.cat.y - s.y || 1) * (away ? 12 : -8), yard.y, yard.y + yard.h);
      if (!footBlocked(gx, gy)) next = { x: gx, y: gy };
    }
    if (footBlocked(next.x, next.y)) {
      s.cat.mode = "sit";
      s.cat.pause = 0.8;
      return;
    }
    s.cat.tx = next.x;
    s.cat.ty = next.y;
    s.cat.face = next.x >= s.cat.x ? -1 : 1;
    return;
  }
  const dx = s.cat.tx - s.cat.x;
  const dy = s.cat.ty - s.cat.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.5) {
    s.cat.x = s.cat.tx;
    s.cat.y = s.cat.ty;
    s.cat.mode = "sit";
    s.cat.pause = 1.1 + unitRand(s) * 2.2;
    return;
  }
  const sp = s.cat.mode === "run" ? 40 : 16;
  const ox = s.cat.x;
  const oy = s.cat.y;
  s.cat.x += (dx / dist) * sp * dt;
  s.cat.y += (dy / dist) * sp * dt;
  if (footBlocked(s.cat.x, s.cat.y)) {
    s.cat.x = ox;
    s.cat.y = oy;
    s.cat.mode = "sit";
    s.cat.pause = 0.6;
    return;
  }
  if (Math.abs(dx) > 0.15) s.cat.face = dx > 0 ? -1 : 1;
}

function stepCritters(s: GameState, dt: number) {
  stepCat(s, dt);
  for (const a of s.animals) {
    const box = pasture(a.kind);
    const pdx = a.x - s.x;
    const pdy = a.y - s.y;
    const pd = Math.hypot(pdx, pdy);
    if (a.kind === "rooster" && pd < 22 && pd > 0.5) {
      a.pause = 0;
      a.tx = clamp(a.x + (pdx / pd) * 16, box.x, box.x + box.w);
      a.ty = clamp(a.y + (pdy / pd) * 10, box.y, box.y + box.h);
    }
    if (a.pause > 0) {
      a.pause -= dt;
      continue;
    }
    const dx = a.tx - a.x;
    const dy = a.ty - a.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1.2) {
      if (a.kind === "cow") a.pause = 2.2 + unitRand(s) * 2.4;
      else if (a.kind === "goat") a.pause = 0.45 + unitRand(s) * 0.9;
      else a.pause = 0.18 + unitRand(s) * 0.4;
      let next = roam(s, box, a, a.kind === "cow" ? 16 : a.kind === "goat" ? 22 : 3, a.kind === "cow" ? 46 : a.kind === "goat" ? 78 : 11);
      if (a.kind === "goat" && pd < 50 && pd > 16 && unitRand(s) < 0.4) {
        next = {
          x: clamp(s.x, box.x, box.x + box.w),
          y: clamp(s.y, box.y, box.y + box.h),
        };
      }
      for (const other of s.animals) {
        if (other.id === a.id) continue;
        if (Math.hypot(next.x - other.x, next.y - other.y) < 18) {
          next = roam(s, box, a, 20, 40);
        }
      }
      if (footBlocked(next.x, next.y)) next = openIn(s, box, { x: a.x, y: a.y });
      a.tx = next.x;
      a.ty = next.y;
      continue;
    }
    const sp = a.kind === "rooster" ? 22 : a.kind === "goat" ? 16 : 9;
    const ox = a.x;
    const oy = a.y;
    a.x += (dx / dist) * sp * dt;
    a.y += (dy / dist) * sp * dt;
    if (footBlocked(a.x, a.y)) {
      a.x = ox;
      a.y = oy;
      a.pause = 0.3;
      const next = openIn(s, box, { x: a.x, y: a.y });
      a.tx = next.x;
      a.ty = next.y;
    }
    if (Math.abs(dx) > Math.abs(dy)) a.dir = dx > 0 ? "e" : "w";
    else a.dir = dy > 0 ? "s" : "n";
  }
}

export function bedsAlive(s: GameState): number {
  return s.plots.filter((p) => p.kind === "bed" && p.stage >= 0).length;
}

export function newHomestead(): GameState {
  return createGame();
}

export function assignHotbar(s: GameState, slot: number, id: string | null) {
  s.hotbar[slot] = id;
  if (id) {
    const other = s.hotbar.findIndex((h, i) => h === id && i !== slot);
    if (other >= 0) s.hotbar[other] = null;
  }
}
