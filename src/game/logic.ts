import { soundState } from "./audio.ts";
import { tickBirdsong } from "./birdsong.ts";
import { mewNow, tickCatVoice } from "./catsound.ts";
import {
  DEFS,
  MASS_CAP,
  MASS_RUN,
  SPOTS,
  WORLD_W,
  createGame,
  defaultFlowers,
  defOf,
  isFishId,
  POND_FISH,
  ensureLife,
  ensureFishing,
  ensureMagic,
  ensureWeather,
  ensureBirds,
  ensureReaper,
  ensureHand,
  HAND_HOME,
  ensureSkills,
  ensureHealth,
  skillLevel,
  SKILL_NAME,
  footBlocked,
  FENCE,
  onFenceRail,
  isNight,
  itemMass,
  placeFarmer,
  setRealm,
  SPELLS,
  liturgyName,
  SPELL_COST,
  MANA_MAX,
  MAGIC_MAX,
  onMagicPlot,
  type Animal,
  type Bird,
  type Reaper,
  type ReaperPose,
  REAPER_FRAMES,
  type CropId,
  type GameState,
  type EquipSlot,
  type Item,
  type Life,
  type PanelId,
  type Plot,
  type SkillId,
} from "./content.ts";
import { assetUseAt } from "./dev-sprites.ts";

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
const TOOL_FPS = 8;
let jog = false;

function gait(speed: number): number {
  const walk = Math.max(64, speed);
  return jog ? walk * 1.7 : walk;
}

/** Farm Life tool strips: 80×112 frames, rows down / side / up. `hit` is the strike frame. */
export const TOOL_ANIM: Record<string, { sheet: string; frames: number; hit: number }> = {
  water: { sheet: "water", frames: 8, hit: 4 },
  fill: { sheet: "water", frames: 8, hit: 4 },
  till: { sheet: "shovel", frames: 7, hit: 2 },
  harvest: { sheet: "scythe", frames: 5, hit: 3 },
  clear: { sheet: "scythe", frames: 5, hit: 3 },
  chop: { sheet: "axe", frames: 6, hit: 4 },
  repair: { sheet: "hammer", frames: 6, hit: 4 },
  sharpen: { sheet: "hammer", frames: 6, hit: 4 },
};

type SideGate = { x: number; y: number; wing: -1 | 0 | 1; landX: number; dir: "e" | "w"; name: string };

const GATE_REACH = 46;

/** A click-step at a sidewalk end. The land beyond is the same courtyard. */
export function sideGate(s: GameState): SideGate | null {
  const wing = s.wing ?? 0;
  const by = (cx: number) => s.y > 170 && s.y < 260 && Math.hypot(s.x - cx, s.y - 202) <= GATE_REACH;
  if (s.x < 130 && by(40) && wing !== -1) {
    const dest: -1 | 0 = wing === 1 ? 0 : -1;
    return { x: 40, y: 202, wing: dest, landX: 266, dir: "w", name: dest === 0 ? "the home land" : "Naraka" };
  }
  if (s.x > 220 && by(308) && wing !== 1) {
    const dest: 0 | 1 = wing === -1 ? 0 : 1;
    return { x: 308, y: 202, wing: dest, landX: 86, dir: "e", name: dest === 0 ? "the home land" : "Svarga" };
  }
  return null;
}

function crossSide(s: GameState, px: number, py: number): InteractResult | null {
  if (s.cross || s.action) return null;
  const gate = sideGate(s);
  if (!gate) return null;
  if (Math.hypot(px - gate.x, py - gate.y) > 40) return null;
  if (Math.hypot(s.x - gate.x, s.y - gate.y) > GATE_REACH) return null;
  s.speed = 0;
  s.cross = { t: 0, wing: gate.wing, x: gate.landX, y: 212, dir: gate.dir, name: gate.name, moved: false };
  return { msg: `The gate opens toward ${gate.name}.` };
}

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
  if (act.kind === "fish" && !hasRod(s)) return "The rod left your hand.";
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
      fish: "Fishing",
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
  if (s.hand && (s.wing ?? 0) === 0) {
    list.push({ id: "hand", name: "Field hand", kind: "hand", x: s.hand.x - 8, y: s.hand.y - 6, w: 16, h: 10 });
  }
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
  if (t.kind === "pond") return hasRod(s) ? "Cast into the pond" : toolKind(s) === "water" ? "Draw pond" : "Farm pond";
  if (t.kind === "tub") {
    if (s.downed) return "Climb into the tub";
    return isNight(s.time) ? "Sleep until dawn" : "Wash in the tub";
  }
  if (t.kind === "fire") return "Cook at campfire";
  if (t.kind === "hearth") return "Sit by the fire";
  if (t.kind === "shed") return "Open the house stores";
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
  if (t.kind === "reaper") return "Greet the wizard";
  if (t.kind === "hand") return "Greet the field hand";
  if (t.kind === "flower") {
    const f = s.flowers?.find((fl) => fl.id === t.id);
    return f && f.bloom >= 2 ? `Pick ${f.name.toLowerCase()}` : t.name;
  }
  return t.name;
}

export function promptAt(s: GameState, px: number, py: number): string {
  const gate = sideGate(s);
  if (gate && Math.hypot(s.x - gate.x, s.y - gate.y) <= GATE_REACH && Math.hypot(px - gate.x, py - gate.y) <= 40) {
    return `Cross to ${gate.name}  [E]`;
  }
  if ((s.wing ?? 0) !== 0) return "";
  if (!inReach(s, px, py)) return "";
  const t = pickTarget(s, px, py);
  if (!t) return "";
  return `${verb(s, t)}  [E]`;
}

export function examineAt(s: GameState, px: number, py: number): string {
  const gate = sideGate(s);
  if (gate && Math.hypot(px - gate.x, py - gate.y) <= 40) return `The end of the sidewalk. Click to cross to ${gate.name}.`;
  if ((s.wing ?? 0) === 1) return "Leased gold. It will not keep.";
  if ((s.wing ?? 0) === -1) return "Filed dark. The sentence has a term.";
  const used = assetUseAt(px, py);
  const t = pickTarget(s, px, py);
  if (!t) return used ?? "Dirt, grass, and the fence line.";
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

function startAct(s: GameState, kind: string, target: string, fallback = 0.6): InteractResult {
  if (s.action) {
    s.pending = s.pending ?? { px: s.x, py: s.y };
    return { msg: "Queued." };
  }
  const tool = active(s);
  if (spent(tool) && ["water", "till", "harvest", "chop", "repair", "sharpen"].includes(kind)) {
    return { msg: "The tool is spent. Repair it at the workbench." };
  }
  if (s.stamina < 4) return { msg: "Too tired to swing." };
  const spec = TOOL_ANIM[kind];
  const dur = spec ? spec.frames / TOOL_FPS : fallback;
  const pt = aimPoint(s, kind, target);
  if (pt) {
    const dx = pt.x - s.x;
    const dy = pt.y - s.y;
    if (Math.hypot(dx, dy) > 3) {
      if (Math.abs(dx) > Math.abs(dy)) s.dir = dx >= 0 ? "e" : "w";
      else s.dir = dy >= 0 ? "s" : "n";
    }
  }
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
  const crossed = crossSide(s, px, py);
  if (crossed) return crossed;
  if ((s.wing ?? 0) !== 0) {
    return { msg: s.wing === 1 ? "Nothing here is a chore. The grove keeps itself." : "Nothing here is yours to use. It is evidence." };
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
    shaveStruct(s, "shed", 0.2);
    return { panel: "vault", save: true, msg: "The door opens. The stores sit just inside." };
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
  if (t.kind === "reaper") return greetReaper(s);
  if (t.kind === "hand") return greetHand(s);
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
  if (hasRod(s)) return startAct(s, "fish", "pond", 1.5);
  const it = active(s);
  if (!it || defOf(it).tool !== "water") return { msg: "Equip the fishing rod, or a watering can." };
  if ((it.water ?? 0) >= (defOf(it).waterMax ?? 0)) return { msg: "The can is already full." };
  return startAct(s, "fill", "pond");
}

function hasRod(s: GameState): boolean {
  const hand = s.body.hands;
  if (hand && defOf(hand).tool === "rod") return true;
  const it = active(s);
  return !!it && defOf(it).tool === "rod";
}

function useTub(s: GameState): InteractResult {
  if (isNight(s.time)) return sleepNow(s);
  s.stamina = Math.min(100, s.stamina + 12);
  ensureHealth(s);
  s.health = Math.min(100, s.health + 6);
  return { msg: `A wash in the old tub. Stamina eases back.${grant(s, "healing", 6)}`, save: true };
}

function sleepNow(s: GameState): InteractResult {
  applyDawn(s);
  s.day += 1;
  s.time = 0.05;
  s.stamina = Math.max(s.stamina, 78);
  s.downed = false;
  ensureHealth(s);
  s.health = Math.min(100, s.health + 28);
  s.stats.daysSlept += 1;
  const summary = s.day > 14;
  s.summary = summary;
  const dead = s.plots.filter((p) => p.kind === "bed" && p.stage < 0).length;
  const note = dead ? ` ${dead} bed${dead === 1 ? "" : "s"} gave out.` : " The beds held.";
  const learned = grant(s, "healing", 10) + grant(s, "survival", 8);
  return {
    msg: `Dawn of day ${s.day}.${note}${learned}`,
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
  mewNow(s, Math.random() < 0.5 ? "long" : "trill");
  return { msg: `The cat allows it. A little of the day comes back.${grant(s, "husbandry", 8)}` };
}

function greetReaper(s: GameState): InteractResult {
  ensureReaper(s);
  const r = s.reaper;
  const dx = s.x - r.x;
  const dy = s.y - r.y;
  if (Math.abs(dx) >= Math.abs(dy)) r.dir = dx >= 0 ? "e" : "w";
  else r.dir = dy >= 0 ? "s" : "n";
  r.pose = "handsidle";
  r.poseT = 0;
  r.pause = 1.5;
  r.greet = 1.8;
  r.route = [];
  return { msg: `The masked wizard lifts both hands. He is a friend of the courtyard.${grant(s, "ritual", 4)}` };
}

function greetHand(s: GameState): InteractResult {
  ensureHand(s);
  const h = s.hand;
  const dx = s.x - h.x;
  const dy = s.y - h.y;
  if (Math.abs(dx) >= Math.abs(dy)) h.dir = dx >= 0 ? "e" : "w";
  else h.dir = dy >= 0 ? "s" : "n";
  h.pose = "handsidle";
  h.poseT = 0;
  h.pause = 1.6;
  h.greet = 1.6;
  h.route = [];
  return { msg: `The field hand nods. He works the beds and leaves the seal to you.${grant(s, "farming", 4)}` };
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
  return { msg: `Picked the ${f.name.toLowerCase()}. It will bloom again.${grant(s, "herbalism", 12)}${grant(s, "foraging", 4)}`, save: true };
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
  const rose = grant(s, "foraging", 8);
  return { msg: `Picked up ${defOf(g.item).name}.${rose}` };
}

function grant(s: GameState, id: SkillId, amount: number): string {
  ensureSkills(s);
  const before = skillLevel(s.skills[id]);
  s.skills[id] += amount;
  const after = skillLevel(s.skills[id]);
  if (after > before) return ` ${SKILL_NAME[id]} reaches ${after}.`;
  return "";
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
    return `Watered the ${p.crop}. Can ${can.water}/${defOf(can).waterMax}.${grant(s, "farming", 8)}`;
  }
  if (act.kind === "fill") {
    const can = tool;
    if (!can || defOf(can).tool !== "water") return "Requires the watering can.";
    can.water = defOf(can).waterMax ?? 8;
    cost(3, 0.15);
    return act.target === "pond" ? "Filled the can at the pond." : "Filled the can at the well.";
  }
  if (act.kind === "fish") {
    if (!hasRod(s)) return "Requires the fishing rod.";
    const id = POND_FISH[Math.floor(unitRand(s) * POND_FISH.length)] ?? "fish";
    const fish = makeItem(s, id);
    if (!hasRoom(s, fish)) return "Pack is full.";
    giveItem(s, fish);
    ensureFishing(s);
    s.fishing += 1;
    s.catchFlash = 0.8;
    cost(6, 0.2);
    return `Caught a ${defOf(fish).name.toLowerCase()}. Fishing ${s.fishing}.${grant(s, "fishing", 14)}`;
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
    return `Harvested ${defOf(item).name}. Floor ${item.floor}.${grant(s, "farming", 16)}`;
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
    return `Cleared the spent bed.${grant(s, "farming", 6)}`;
  }
  if (act.kind === "till") {
    const p = s.plots.find((pl) => pl.id === act.target);
    if (!p) return "No dirt there.";
    p.tilled = true;
    p.revealed = true;
    cost(7, 0.45);
    return `Tilled a patch. It will take a seed.${grant(s, "farming", 8)}`;
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
    return `Planted ${crop}.${grant(s, "farming", 8)}`;
  }
  if (act.kind === "chop") {
    const b = s.branches.find((br) => br.id === act.target);
    if (!b || !b.left) return "The branch is already taken.";
    const item = makeItem(s, "branch");
    if (!hasRoom(s, item)) return "Pack is full.";
    b.left = false;
    giveItem(s, item);
    cost(8, 0.5);
    return `Chopped a branch. The trees around the fence stay up.${grant(s, "woodcraft", 14)}`;
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
    return `Cooked a hearth loaf at the campfire.${grant(s, "cooking", 16)}`;
  }
  if (act.kind === "sharpen") {
    const it = findItem(s, act.target);
    if (!it) return "The tool is gone.";
    it.quality = Math.min(100, it.quality + 5);
    wear(it, 1.2);
    cost(10, 0);
    return `Sharpened. Quality ${Math.round(it.quality)}. Floor ${it.floor.toFixed(1)}.${grant(s, "construction", 8)}`;
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
    return `${st.name} repaired. Quality ${Math.round(st.quality)}. Floor restored.${grant(s, "construction", 18)}`;
  }
  if (act.kind === "feed") {
    const a = s.animals.find((an) => an.id === act.target);
    const raw = produceItem(s);
    if (!a || !raw) return "Nothing to feed.";
    if (raw.qty > 1) raw.qty -= 1;
    else removeItem(s, raw.id);
    a.fed = true;
    cost(3, 0);
    return `Fed the ${a.name.toLowerCase()}. Check back after dawn.${grant(s, "husbandry", 12)}`;
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
    return `Collected ${defOf(item).name}.${grant(s, "husbandry", 10)}${grant(s, "tracking", 6)}`;
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
  ensureLife(s);
  ensureHealth(s);
  const empty = s.life.hunger > 55;
  s.stamina = Math.min(100, s.stamina + (d.stamina ?? 0));
  if (isFishId(it.defId)) {
    s.life.hunger = Math.max(0, s.life.hunger - 24);
    s.stamina = Math.max(0, s.stamina - 4);
  } else if ((d.stamina ?? 0) > 0) {
    s.life.hunger = Math.max(0, s.life.hunger - 16);
  }
  s.health = Math.min(100, s.health + 8);
  if (d.stack && it.qty > 1) it.qty -= 1;
  else removeItem(s, it.id);
  const learned = grant(s, "healing", 8) + (empty ? grant(s, "survival", 6) : "");
  return `Ate ${d.name}. Stamina ${Math.round(s.stamina)}.${learned}`;
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
  if (!fenceHop(s.x, s.y, nx, ny) && !footBlocked(nx, ny)) {
    s.x = nx;
    s.y = ny;
    return;
  }
  if (!fenceHop(s.x, s.y, nx, s.y) && !footBlocked(nx, s.y)) s.x = nx;
  else if (!fenceHop(s.x, s.y, s.x, ny) && !footBlocked(s.x, ny)) s.y = ny;
}

export function step(s: GameState, dt: number, input: Input) {
  const stepDt = Math.min(0.05, Math.max(0, dt));
  s.clock += stepDt;
  if (s.catchFlash) s.catchFlash = Math.max(0, s.catchFlash - stepDt);
  jog = input.run && !s.downed;
  ensureMagic(s);
  ensureSkills(s);
  ensureHealth(s);
  ensureReaper(s);
  ensureHand(s);
  if (input.frozen || s.cross) s.speed = 0;
  regenMana(s, stepDt);
  setRealm(s.wing ?? 0);
  placeFarmer(s);
  if (s.cat.petCd > 0) s.cat.petCd = Math.max(0, s.cat.petCd - stepDt);
  stepFlowers(s, stepDt);
  if (s.cross) {
    s.speed = 0;
    s.cross.t += stepDt;
    if (!s.cross.moved && s.cross.t >= 0.42) {
      s.wing = s.cross.wing;
      setRealm(s.wing);
      s.x = s.cross.x;
      s.y = s.cross.y;
      s.dir = s.cross.dir;
      s.cross.moved = true;
      s.life.route = [];
      s.life.errand = null;
    }
    if (s.cross.t >= 0.85) {
      const learned = grant(s, "exploration", 16) + grant(s, "tracking", 8);
      s.message = `You step through to ${s.cross.name}.${learned}`;
      s.cross = null;
      s.uiEvent = { save: true };
    }
    return;
  }
  if (input.frozen) {
    s.speed = 0;
    return;
  }
  const swinging = s.action !== null;
  if (s.action) {
    s.action.elapsed += stepDt;
    s.speed = 0;
    if (!s.action.hit && s.action.elapsed >= s.action.dur * (TOOL_ANIM[s.action.kind] ? (TOOL_ANIM[s.action.kind].hit + 0.45) / TOOL_ANIM[s.action.kind].frames : CONTACT_AT)) {
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
    const jogging = jog;
    const onCourt = s.y >= 232 && s.y < 528 && s.x >= 8 && s.x < 344;
    const wetDrag = onCourt && s.wet > 0.12 ? 1 - Math.min(0.22, s.wet * 0.22) : 1;
    const speed = (s.downed ? 22 : jogging ? 112 : crawl ? 36 : 64) * wetDrag;
    if (mag > 0.08) {
      if (Math.abs(mx) > Math.abs(my)) s.dir = mx > 0 ? "e" : "w";
      else s.dir = my > 0 ? "s" : "n";
      moveAxis(s, mx * speed * stepDt, my * speed * stepDt);
      s.x = Math.max(8, Math.min(WORLD_W - 8, s.x));
      s.speed = speed;
      if (jogging) s.stamina = Math.max(8, s.stamina - stepDt * 2);
      else s.stamina = Math.min(100, s.stamina + stepDt * 3);
    } else {
      s.speed = 0;
      s.stamina = Math.min(100, s.stamina + stepDt * 8);
    }
    if (s.stamina <= 0) down(s);
  }
  s.time = Math.min(0.999, s.time + stepDt / 720);
  stepWeather(s, stepDt);
  if (!swinging) tendSelf(s, stepDt, input);
  const wing = s.wing ?? 0;
  setRealm(0);
  stepCritters(s, stepDt);
  setRealm(wing);
  if (wing === 0) {
    const tone = tickBirdsong(s, stepDt, soundState().muted || soundState().volume < 0.02);
    if (tone) {
      s.health = Math.min(100, s.health + tone.health);
      s.mana = Math.min(MANA_MAX, s.mana + tone.mana);
      s.message = "A bird sang the old tone. The hurt loosens.";
    }
    tickCatVoice(s, stepDt);
  }
}

function tendSelf(s: GameState, dt: number, input: Input) {
  ensureLife(s);
  ensureFishing(s);
  const life = s.life;
  life.hunger = Math.min(100, life.hunger + dt * 0.7);
  life.thirst = Math.min(100, life.thirst + dt * 0.85);
  life.dirt = Math.min(100, life.dirt + dt * 0.28);
  if (s.weather !== "clear") life.dirt = Math.max(0, life.dirt - dt * 0.35);
  life.mood = Math.max(
    0,
    Math.min(100, 100 - life.hunger * 0.35 - life.thirst * 0.35 - life.dirt * 0.2 - Math.max(0, 40 - s.stamina) * 0.45),
  );
  ensureHealth(s);
  const strain = (life.hunger > 85 ? 1 : 0) + (life.thirst > 85 ? 1 : 0);
  if (s.downed) s.health = Math.max(8, s.health - dt * 0.4);
  else if (strain > 0) s.health = Math.max(0, s.health - dt * 2 * strain);
  else if (life.hunger < 45 && life.thirst < 45 && s.stamina > 25) s.health = Math.min(100, s.health + dt * 1.4);
  if (s.weather !== "clear" && life.hunger < 70) grant(s, "survival", dt * 0.35);
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
    s.cast = null;
    if (life.chore === "magic") life.chore = "";
  }
  if (steered || s.action || input.frozen || s.downed) return;
  if (s.auto === false) {
    s.speed = 0;
    s.cast = null;
    if (life.chore === "magic") life.chore = "";
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

  if ((s.wing ?? 0) === 1) {
    returnFromSvarga(s, dt);
    return;
  }
  if ((s.wing ?? 0) !== 0) {
    life.errand = null;
    life.route = [];
    s.speed = 0;
    practiceMagic(s, dt);
    return;
  }
  const night = isNight(s.time);
  if (life.thirst > 84) {
    life.errand = "drink";
    if (life.emote <= 0) life.face = "need";
    if (Math.hypot(150 - s.x, 120 - s.y) < 12) {
      life.thirst = Math.max(0, life.thirst - 50);
      s.stamina = Math.min(100, s.stamina + 6);
      s.message = "He drinks at the well.";
      life.face = "heart";
      life.emote = 2.2;
      life.errand = null;
      life.route = [];
      return;
    }
    if (followGoal(s, dt, 150, 120, 32) === "stuck") {
      life.route = [];
      life.pause = 0.6;
    }
    return;
  }
  if (night) {
    const bedX = 118;
    const bedY = 70;
    life.errand = "rest";
    if (life.emote <= 0) life.face = "tired";
    if (Math.hypot(bedX - s.x, bedY - s.y) < 16) {
      s.cast = null;
      const slept = sleepNow(s);
      s.message = `He lies down in the house. ${slept.msg ?? "Dawn comes."}`;
      life.face = "heart";
      life.emote = 2.2;
      life.errand = null;
      life.route = [];
      return;
    }
    s.message = "He heads in to sleep.";
    if (followGoal(s, dt, bedX, bedY, 36) === "stuck") {
      life.route = [];
      life.pause = 0.6;
    }
    return;
  }
  if (s.stamina < 16) {
    life.errand = "rest";
    if (life.emote <= 0) life.face = "tired";
    if (Math.hypot(64 - s.x, 116 - s.y) < 12) {
      s.stamina = Math.min(100, s.stamina + dt * 22);
      s.message = "He rests by the fire.";
      life.face = "tired";
      return;
    }
    if (followGoal(s, dt, 64, 116, 32) === "stuck") {
      life.route = [];
      life.pause = 0.6;
    }
    return;
  }
  if (life.dirt > 90) {
    life.errand = "wash";
    if (life.emote <= 0) life.face = "need";
    if (Math.hypot(128 - s.x, 104 - s.y) < 12) {
      life.dirt = Math.max(0, life.dirt - 55);
      s.stamina = Math.min(100, s.stamina + 8);
      s.message = "He washes at the pond.";
      life.face = "heart";
      life.emote = 2.2;
      life.errand = null;
      life.route = [];
      return;
    }
    if (followGoal(s, dt, 128, 104, 32) === "stuck") {
      life.route = [];
      life.pause = 0.6;
    }
    return;
  }
  if (practiceMagic(s, dt)) return;
  if (tendFarm(s, dt)) return;
  if (walkToSvarga(s, dt)) return;
  life.errand = null;
  stroll(s, dt);
}

const SVARGA_GATE = { x: 308, y: 202 };

function walkToSvarga(s: GameState, dt: number): boolean {
  const life = s.life;
  if ((s.wing ?? 0) !== 0) return false;
  if (s.cast || life.chore === "magic") return false;
  if (life.skip === "svarga" && s.clock < life.skipUntil) return false;
  if (life.chore !== "svarga") {
    life.chore = "svarga";
    life.errand = "svarga";
    life.route = [];
    s.message = "He walks toward Svarga.";
  }
  const atGate = s.x > 220 && s.y > 170 && s.y < 260 && Math.hypot(s.x - SVARGA_GATE.x, s.y - SVARGA_GATE.y) <= 42;
  if (atGate) {
    s.speed = 0;
    life.route = [];
    life.errand = null;
    life.chore = "";
    life.skip = "svarga";
    life.skipUntil = s.clock + 18;
    s.cross = { t: 0, wing: 1, x: 86, y: 212, dir: "e", name: "Svarga", moved: false };
    s.message = "He walks through the east gate into Svarga.";
    return true;
  }
  const step = followGoal(s, dt, 268, 208, 36);
  if (step === "stuck") life.route = [];
  return true;
}

const HOME_GATE = { x: 40, y: 202 };

function returnFromSvarga(s: GameState, dt: number): void {
  const life = s.life;
  if (life.skip === "svarga" && s.clock < life.skipUntil) {
    s.speed = 0;
    return;
  }
  if (life.chore !== "home") {
    life.chore = "home";
    life.route = [];
    s.message = "He turns back toward the home land.";
  }
  const atGate = s.x < 110 && s.y > 170 && s.y < 260 && Math.hypot(s.x - HOME_GATE.x, s.y - HOME_GATE.y) <= 52;
  if (atGate) {
    s.speed = 0;
    life.route = [];
    life.chore = "";
    life.errand = null;
    life.skip = "svarga";
    life.skipUntil = s.clock + 30;
    s.cross = { t: 0, wing: 0, x: 266, y: 212, dir: "w", name: "the home land", moved: false };
    s.message = "He walks back through the gate to the home land.";
    return;
  }
  const step = followGoal(s, dt, 78, 208, 36);
  if (step === "stuck") life.route = [];
}

function practiceMagic(s: GameState, dt: number): boolean {
  const life = s.life;
  if ((s.wing ?? 0) !== 0) {
    if (life.chore === "magic" || s.cast) {
      life.chore = "";
      life.route = [];
      s.cast = null;
    }
    return false;
  }
  if (life.chore === "svarga" || life.chore === "home") return false;
  if (s.cast || life.chore === "magic") {
    if (trainMagic(s, dt)) return true;
  }
  const onBreak = life.skip === "magic" && s.clock < life.skipUntil;
  if (s.clock > 0.2 && !onBreak && s.mana >= 6) {
    beginMagicLesson(s);
    return trainMagic(s, dt);
  }
  return false;
}

function beginMagicLesson(s: GameState): void {
  const life = s.life;
  if (life.chore === "magic") return;
  life.chore = "magic";
  life.skip = "";
  life.skipUntil = s.clock + 20;
  life.pause = 0;
  life.route = [];
  life.face = "happy";
  life.emote = 1.4;
  s.message = "He plays with a spell.";
}

function regenMana(s: GameState, dt: number) {
  ensureMagic(s);
  // Same recovery as stamina: still is the fast refill, walking is the slow one.
  // Casting does not stop it, so a full bar stays usable instead of stranding him.
  const rate = s.speed < 8 ? 8 : 3;
  s.mana = Math.min(MANA_MAX, s.mana + dt * rate);
}

function beginCast(s: GameState): void {
  ensureMagic(s);
  const spell = SPELLS[s.rune % SPELLS.length] ?? "fireball";
  const cost = SPELL_COST[spell];
  if (s.mana < cost) {
    s.speed = 0;
    s.life.pause = 0.4;
    s.message = `He gathers mana (${Math.round(s.mana)} / ${MANA_MAX}).`;
    return;
  }
  s.mana = Math.max(0, s.mana - cost);
  s.dir = (s.wing ?? 0) === 0 ? "s" : ((["s", "e", "n", "w"] as const)[s.rune % 4] ?? "s");
  s.rune = (s.rune + 1) % SPELLS.length;
  s.cast = { spell, t: 0 };
  s.speed = 0;
  const said = liturgyName(spell, s.wing ?? 0);
  s.message = `He casts ${said}. Mana ${Math.round(s.mana)}.`;
}

const SEAL = { x: 172, y: 380 };

function standOnSeal(s: GameState, dt: number): boolean {
  if ((s.wing ?? 0) !== 0) return false;
  if (footBlocked(SEAL.x, SEAL.y)) return true;
  const life = s.life;
  if (Math.hypot(s.x - SEAL.x, s.y - SEAL.y) <= 4) {
    s.x = SEAL.x;
    s.y = SEAL.y;
    s.speed = 0;
    life.route = [];
    if (!s.cast) s.dir = "s";
    return true;
  }
  s.cast = null;
  const step = followGoal(s, dt, SEAL.x, SEAL.y, 36);
  if (step === "arrive" || Math.hypot(s.x - SEAL.x, s.y - SEAL.y) <= 6) {
    s.x = SEAL.x;
    s.y = SEAL.y;
    s.speed = 0;
    life.route = [];
    if (!s.cast) s.dir = "s";
    return true;
  }
  if (step === "stuck") life.route = [];
  s.speed = 36;
  s.message = "He walks to the center of the seal.";
  return false;
}

function trainMagic(s: GameState, dt: number): boolean {
  ensureMagic(s);
  const life = s.life;
  if (life.chore === "magic" && !standOnSeal(s, dt)) return true;
  if (s.cast) {
    s.speed = 0;
    s.cast.t += dt;
    if (s.cast.t < 1) return true;
    const name = liturgyName(s.cast.spell, s.wing ?? 0);
    s.magic = MAGIC_MAX;
    const onPlot = onMagicPlot(s.x, s.y, s.wing ?? 0);
    const learned = onPlot ? grant(s, "magic", 10) : "";
    s.cast = null;
    life.face = "happy";
    life.emote = 1.3;
    life.pause = 0.12;
    s.message = onPlot
      ? `He practices ${name} on the courtyard, the magic plot. Magic ${s.magic}. Mana ${Math.round(s.mana)}.${learned}`
      : `The working fades. Magic is only trained on the courtyard.`;
    return true;
  }
  if (life.chore !== "magic") return false;
  if (s.clock > life.skipUntil) {
    life.chore = "";
    life.route = [];
    life.skip = "magic";
    life.skipUntil = s.clock + 18;
    return false;
  }
  if (life.pause > 0) {
    life.pause -= dt;
    s.speed = 0;
    if (life.pause <= 0) beginCast(s);
    return true;
  }
  beginCast(s);
  return true;
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
  const rod = toolItem(s, "rod");
  const fishHeld = s.pack.filter((p) => p && isFishId(p.defId)).length;
  if (rod && fishHeld < 3 && s.pack.some((p) => p === null)) {
    const pond = SPOTS.find((sp) => sp.id === "pond")!;
    out.push({ id: "fish", x: pond.x + pond.w / 2, y: pond.y + pond.h / 2, hold: rod.id, say: "He casts into the pond." });
  }
  const catchFish = s.pack.find((p) => p && isFishId(p.defId));
  if (catchFish && s.life.hunger > 36 && isFishId(produceItem(s)?.defId ?? "")) {
    const fire = SPOTS.find((sp) => sp.id === "fire")!;
    out.push({ id: "cook", x: fire.x + fire.w / 2, y: fire.y + fire.h / 2, hold: catchFish.id, say: "He cooks the catch." });
  }
  if ((s.cat.petCd ?? 0) <= 0) {
    out.push({ id: "cat:pet", x: s.cat.x, y: s.cat.y, hold: null, say: "He greets the cat." });
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
    life.pause = 1.2 + unitRand(s) * 2.2;
    const beast = s.animals.find((a) => Math.hypot(a.x - s.x, a.y - s.y) < 30);
    if (beast) s.message = `He watches the ${beast.name.toLowerCase()}.`;
    else if (Math.hypot(s.x - POND_BANK.x, s.y - POND_BANK.y) < 22) s.message = "He looks over the pond.";
    else if (s.y > 138 && s.y < 160) s.message = "He stands by the foliage.";
    else if (s.y > 210) s.message = "He walks the courtyard.";
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
  [128, 108],
  [96, 148],
  [200, 148],
  [248, 148],
  [176, 210],
  [90, 250],
  [170, 300],
  [240, 360],
  [150, 132],
];

function pickVisit(s: GameState): { x: number; y: number; say: string } {
  const roll = unitRand(s);
  if (roll < 0.34) return { x: POND_BANK.x, y: POND_BANK.y, say: "He walks the path to the pond." };
  if (roll < 0.67) {
    const spot = pickSpot(s, FOLIAGE);
    return { x: spot.x, y: spot.y, say: "He goes to look at the foliage." };
  }
  const beast = s.animals.find((a) => a.y > 200) ?? s.animals[0];
  if (beast && roll < 0.85) return { x: beast.x, y: Math.max(108, beast.y - 8), say: `He goes to check the ${beast.name.toLowerCase()}.` };
  const court = pickSpot(s, COURT_SPOTS);
  return { x: court.x, y: court.y, say: "He walks out into the courtyard." };
}

function pickRoam(s: GameState) {
  const life = s.life;
  if (unitRand(s) < 0.6) {
    const visit = pickVisit(s);
    life.tx = visit.x;
    life.ty = visit.y;
    life.route = [];
    s.message = visit.say;
    return;
  }
  for (let i = 0; i < 6; i++) {
    const spot = ROAM[Math.floor(unitRand(s) * ROAM.length)]!;
    if (!autoBlocked(spot[0], spot[1]) && Math.hypot(spot[0] - s.x, spot[1] - s.y) > 24) {
      life.tx = spot[0];
      life.ty = spot[1];
      life.route = [];
      return;
    }
  }
  life.tx = 172;
  life.ty = 220;
  life.route = [];
}

/** Meadow travel stays on the dirt path. The yard still walks around walls. */
function autoBlocked(x: number, y: number): boolean {
  if (y >= 520) return true;
  return footBlocked(x, y);
}

const PATH_G = 8;

export function autoRoute(x0: number, y0: number, x1: number, y1: number, axis = false): number[] {
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
  const dirs = axis
    ? [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]
    : [
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
  return thinRoute(pts, axis);
}

function thinRoute(pts: number[], axis = false): number[] {
  if (pts.length <= 4) return pts;
  const out = [pts[0]!, pts[1]!];
  for (let i = 2; i < pts.length - 2; i += 2) {
    const x0 = out[out.length - 2]!;
    const y0 = out[out.length - 1]!;
    const x1 = pts[i]!;
    const y1 = pts[i + 1]!;
    const x2 = pts[i + 2]!;
    const y2 = pts[i + 3]!;
    const colinear = (x0 === x1 && x1 === x2) || (y0 === y1 && y1 === y2);
    const bend = Math.abs((x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0)) > 12;
    const keep = axis ? !colinear || !segmentOpen(x0, y0, x2, y2) : bend || !segmentOpen(x0, y0, x2, y2);
    if (keep) out.push(x1, y1);
  }
  out.push(pts[pts.length - 2]!, pts[pts.length - 1]!);
  return out;
}

function segmentOpen(x0: number, y0: number, x1: number, y1: number): boolean {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(1, Math.ceil(dist / 2));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    if (autoBlocked(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false;
  }
  return true;
}

function slipCorner(body: { x: number; y: number }, dx: number, dy: number): boolean {
  const shove = 6;
  const dirs: Array<[number, number]> =
    Math.abs(dx) >= Math.abs(dy)
      ? [
          [0, 1],
          [0, -1],
        ]
      : [
          [-1, 0],
          [1, 0],
        ];
  for (const [sx, sy] of dirs) {
    const px = body.x + sx * shove;
    const py = body.y + sy * shove;
    if (!autoBlocked(px, py)) {
      body.x = px;
      body.y = py;
      return true;
    }
  }
  return false;
}

function followGoal(s: GameState, dt: number, x: number, y: number, speed: number): "walk" | "arrive" | "stuck" {
  const life = s.life;
  const openGoal = footBlocked(x, y) ? nearestOpen(x, y) : { x, y };
  const gx = openGoal?.x ?? x;
  const gy = openGoal?.y ?? y;
  if (life.tx !== gx || life.ty !== gy || life.route.length < 2) {
    life.tx = gx;
    life.ty = gy;
    life.route = Math.hypot(gx - s.x, gy - s.y) < 8 ? [] : autoRoute(s.x, s.y, gx, gy);
  }
  let guard = 0;
  while (life.route.length >= 2 && guard++ < 6) {
    const wx = life.route[0]!;
    const wy = life.route[1]!;
    if (autoBlocked(wx, wy)) {
      life.route = life.route.slice(2);
      continue;
    }
    if (Math.hypot(wx - s.x, wy - s.y) < 4) {
      s.x = wx;
      s.y = wy;
      life.route = life.route.slice(2);
      continue;
    }
    const dx = wx - s.x;
    const dy = wy - s.y;
    const mag = Math.hypot(dx, dy) || 1;
    const step = Math.min(mag, gait(speed) * dt);
    const nx = s.x + (dx / mag) * step;
    const ny = s.y + (dy / mag) * step;
    if (!autoBlocked(nx, ny)) {
      s.x = nx;
      s.y = ny;
    } else if (Math.abs(dx) >= Math.abs(dy) && !autoBlocked(nx, s.y)) s.x = nx;
    else if (Math.abs(dy) > Math.abs(dx) && !autoBlocked(s.x, ny)) s.y = ny;
    else if (!autoBlocked(nx, s.y) && Math.abs(nx - s.x) > 0.4) s.x = nx;
    else if (!autoBlocked(s.x, ny) && Math.abs(ny - s.y) > 0.4) s.y = ny;
    else if (slipCorner(s, dx, dy)) {
      life.route = [];
    } else {
      unstick(s);
      life.route = [];
      return "stuck";
    }
    s.speed = gait(speed);
    if (Math.abs(dx) > Math.abs(dy)) s.dir = dx > 0 ? "e" : "w";
    else s.dir = dy > 0 ? "s" : "n";
    return "walk";
  }
  const left = Math.hypot(gx - s.x, gy - s.y);
  if (left < 3) {
    if (!autoBlocked(gx, gy)) {
      s.x = gx;
      s.y = gy;
    }
    return "arrive";
  }
  if (left < 14) {
    const dx = gx - s.x;
    const dy = gy - s.y;
    const step = Math.min(left, speed * dt);
    const nx = s.x + (dx / left) * step;
    const ny = s.y + (dy / left) * step;
    if (!autoBlocked(nx, ny)) {
      s.x = nx;
      s.y = ny;
      s.speed = speed;
      return "walk";
    }
  }
  return "stuck";
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
    const next = roll < 0.52 ? "clear" : roll < 0.8 ? "rain" : "storm";
    if (next !== s.weather) {
      s.message =
        next === "storm"
          ? "Heavy rain. The yard takes a real soaking."
          : next === "rain"
            ? "Rain. The soil, the plants, and the trees take the water."
            : "The rain passes. The sun is back.";
    }
    s.weather = next;
    s.weatherLeft = next === "clear" ? 32 + unitRand(s) * 22 : next === "storm" ? 14 + unitRand(s) * 10 : 20 + unitRand(s) * 16;
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

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

const POND_BANK = { x: 128, y: 104 };
const FOLIAGE: { x: number; y: number }[] = [
  { x: 56, y: 132 },
  { x: 96, y: 130 },
  { x: 136, y: 132 },
  { x: 210, y: 130 },
  { x: 248, y: 132 },
  { x: 280, y: 130 },
];
const COURT_SPOTS: { x: number; y: number }[] = [
  { x: 90, y: 240 },
  { x: 160, y: 270 },
  { x: 250, y: 300 },
  { x: 120, y: 340 },
  { x: 210, y: 390 },
  { x: 150, y: 230 },
];
const REAPER_SPOTS: { x: number; y: number }[] = [
  { x: 72, y: 248 },
  { x: 120, y: 276 },
  { x: 200, y: 252 },
  { x: 268, y: 292 },
  { x: 88, y: 340 },
  { x: 168, y: 360 },
  { x: 248, y: 348 },
  { x: 112, y: 420 },
  { x: 188, y: 456 },
  { x: 276, y: 424 },
  { x: 148, y: 488 },
  { x: 220, y: 300 },
];
const REAPER_TOOLS: ReaperPose[] = ["water", "shovel", "scythe", "axe", "hammer", "pickaxe"];

function nearestOpen(x: number, y: number): { x: number; y: number } | null {
  if (!footBlocked(x, y)) return { x, y };
  for (let r = 4; r <= 48; r += 4) {
    for (const [dx, dy] of [
      [r, 0],
      [-r, 0],
      [0, r],
      [0, -r],
      [r, r],
      [-r, r],
      [r, -r],
      [-r, -r],
    ] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (!footBlocked(nx, ny)) return { x: nx, y: ny };
    }
  }
  return null;
}

function unstick(body: { x: number; y: number }) {
  if (onFenceRail(body.x, body.y) || (body.y >= FENCE.y0 && body.y <= FENCE.y1)) {
    const mouth = nearestOpen(FENCE.mouthX, body.y < (FENCE.y0 + FENCE.y1) / 2 ? FENCE.northY : FENCE.southY);
    if (mouth) {
      body.x = mouth.x;
      body.y = mouth.y;
      return;
    }
  }
  const spot = nearestOpen(body.x, body.y) ?? nearestOpen(body.x + 8, body.y) ?? nearestOpen(body.x, body.y + 8);
  if (!spot) return;
  if (spot.x === body.x && spot.y === body.y) {
    for (const [dx, dy] of [
      [8, 0],
      [-8, 0],
      [0, 8],
      [0, -8],
    ] as const) {
      if (!footBlocked(body.x + dx, body.y + dy)) {
        body.x += dx;
        body.y += dy;
        return;
      }
    }
    return;
  }
  body.x = spot.x;
  body.y = spot.y;
}

function gateRoute(from: { x: number; y: number }, goal: { x: number; y: number }, axis = false): number[] {
  const end = nearestOpen(offRail(goal).x, offRail(goal).y);
  if (!end) return [];
  if (footBlocked(from.x, from.y)) return [];
  const north = (y: number) => y < FENCE.y0;
  const south = (y: number) => y > FENCE.y1;
  const crossing = (north(from.y) && south(end.y)) || (south(from.y) && north(end.y));
  if (!crossing) return autoRoute(from.x, from.y, end.x, end.y, axis);
  const goingSouth = from.y < end.y;
  const a = goingSouth ? { x: FENCE.mouthX, y: FENCE.northY } : { x: FENCE.mouthX, y: FENCE.southY };
  const b = goingSouth ? { x: FENCE.mouthX, y: FENCE.southY } : { x: FENCE.mouthX, y: FENCE.northY };
  const legs = [
    autoRoute(from.x, from.y, a.x, a.y, axis),
    autoRoute(a.x, a.y, b.x, b.y, axis),
    autoRoute(b.x, b.y, end.x, end.y, axis),
  ];
  if (legs[1]!.length < 2) return autoRoute(from.x, from.y, end.x, end.y, axis);
  const pts: number[] = [];
  for (const leg of legs) {
    for (let i = 0; i < leg.length; i += 2) {
      const x = leg[i]!;
      const y = leg[i + 1]!;
      if (pts.length >= 2 && pts[pts.length - 2] === x && pts[pts.length - 1] === y) continue;
      pts.push(x, y);
    }
  }
  return thinRoute(pts, axis);
}

function pickSpot<T>(s: GameState, list: T[]): T {
  return list[Math.floor(unitRand(s) * list.length)]!;
}

function slideTo(body: { x: number; y: number }, tx: number, ty: number, speed: number, dt: number, axis = false): "walk" | "arrive" | "stuck" {
  const dx = tx - body.x;
  const dy = ty - body.y;
  const dist = Math.hypot(dx, dy);
  if (axis ? Math.abs(dx) < 1.5 && Math.abs(dy) < 1.5 : dist < 2) {
    if (!footBlocked(tx, ty)) {
      body.x = tx;
      body.y = ty;
    }
    return "arrive";
  }
  const step = Math.min(axis ? Math.max(Math.abs(dx), Math.abs(dy)) : dist, speed * dt, 4);
  if (axis) {
    const tryAxis = (alongX: boolean) => {
      const mag = alongX ? Math.abs(dx) : Math.abs(dy);
      if (mag < 0.01) return false;
      const nx = alongX ? body.x + Math.sign(dx) * Math.min(mag, step) : body.x;
      const ny = alongX ? body.y : body.y + Math.sign(dy) * Math.min(mag, step);
      if (fenceHop(body.x, body.y, nx, ny) || footBlocked(nx, ny)) return false;
      body.x = nx;
      body.y = ny;
      return true;
    };
    if (tryAxis(Math.abs(dx) >= Math.abs(dy)) || tryAxis(Math.abs(dx) < Math.abs(dy))) return "walk";
    return "stuck";
  }
  const nx = body.x + (dx / dist) * step;
  const ny = body.y + (dy / dist) * step;
  if (fenceHop(body.x, body.y, nx, ny) || footBlocked(nx, ny)) {
    if (!fenceHop(body.x, body.y, nx, body.y) && !footBlocked(nx, body.y)) body.x = nx;
    else if (!fenceHop(body.x, body.y, body.x, ny) && !footBlocked(body.x, ny)) body.y = ny;
    else return "stuck";
  } else {
    body.x = nx;
    body.y = ny;
  }
  return "walk";
}

function fenceHop(x: number, y: number, nx: number, ny: number): boolean {
  const north = (py: number) => py < FENCE.y0;
  const south = (py: number) => py > FENCE.y1;
  const mouth = (px: number) => px >= FENCE.x0 && px <= FENCE.x1;
  if ((north(y) && south(ny)) || (south(y) && north(ny))) return !(mouth(x) && mouth(nx));
  return false;
}

function offRail(p: { x: number; y: number }): { x: number; y: number } {
  if (!onFenceRail(p.x, p.y)) return p;
  return { x: FENCE.mouthX, y: p.y < (FENCE.y0 + FENCE.y1) / 2 ? FENCE.northY : FENCE.southY };
}

function faceDelta(body: { dir?: "n" | "e" | "s" | "w"; face?: number; look?: "n" | "e" | "s" | "w" }, dx: number, dy: number) {
  if (Math.hypot(dx, dy) < 0.04) return;
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (body.dir !== undefined) body.dir = dx > 0 ? "e" : "w";
    if (body.face !== undefined) body.face = dx > 0 ? 1 : -1;
    if (body.look !== undefined) body.look = dx > 0 ? "e" : "w";
  } else if (body.dir !== undefined || body.look !== undefined) {
    const dir = dy > 0 ? "s" : "n";
    if (body.dir !== undefined) body.dir = dir;
    if (body.look !== undefined) body.look = dir;
  }
}

function followRoute(body: { x: number; y: number; route?: number[]; dir?: "n" | "e" | "s" | "w"; face?: number; look?: "n" | "e" | "s" | "w" }, speed: number, dt: number, axis = false): "walk" | "arrive" | "stuck" {
  if (!body.route || body.route.length < 2) return "arrive";
  const x0 = body.x;
  const y0 = body.y;
  let guard = 0;
  while (body.route && body.route.length >= 2 && guard++ < 6) {
    const tx = body.route[0]!;
    const ty = body.route[1]!;
    if (Math.hypot(tx - body.x, ty - body.y) < 2) {
      if (!footBlocked(tx, ty)) {
        body.x = tx;
        body.y = ty;
      }
      body.route = body.route.slice(2);
      continue;
    }
    if (footBlocked(tx, ty)) return "stuck";
    const moved = slideTo(body, tx, ty, speed, dt, axis);
    faceDelta(body, body.x - x0, body.y - y0);
    if (moved === "stuck") return "stuck";
    if (moved === "arrive") body.route = body.route.slice(2);
    return body.route && body.route.length >= 2 ? "walk" : "arrive";
  }
  faceDelta(body, body.x - x0, body.y - y0);
  return body.route && body.route.length >= 2 ? "walk" : "arrive";
}

function herdGoal(s: GameState, a: Animal): { x: number; y: number; intent: Animal["intent"] } {
  const pd = Math.hypot(a.x - s.x, a.y - s.y);
  if (a.kind === "rooster" && pd < 24) {
    const awayX = clamp(a.x + Math.sign(a.x - s.x || 1) * 36, 48, 300);
    const awayY = a.y > 190 ? clamp(a.y + 28, 220, 420) : clamp(a.y - 10, 108, 150);
    return { intent: "flee", x: awayX, y: awayY };
  }
  if (a.kind === "goat" && pd < 70 && pd > 18 && s.y > 190 && unitRand(s) < 0.45) {
    return { intent: "court", x: clamp(s.x + (a.x > s.x ? 16 : -16), 48, 300), y: clamp(s.y, 214, 460) };
  }
  const roll = unitRand(s);
  if (roll < 0.22) return { intent: "drink", x: POND_BANK.x, y: POND_BANK.y };
  if (roll < 0.58) {
    const spot = pickSpot(s, FOLIAGE);
    return { intent: "graze", x: spot.x, y: spot.y };
  }
  if (roll < 0.88) {
    const spot = pickSpot(s, COURT_SPOTS);
    return { intent: "court", x: spot.x, y: spot.y };
  }
  const x = clamp(a.x + (unitRand(s) - 0.5) * (a.y > 190 ? 48 : 28), 48, 300);
  const y = clamp(a.y + (unitRand(s) - 0.5) * (a.y > 190 ? 36 : 16), a.y > 190 ? 214 : 108, a.y > 190 ? 460 : 150);
  if (footBlocked(x, y)) {
    const spot = pickSpot(s, COURT_SPOTS);
    return { intent: "court", x: spot.x, y: spot.y };
  }
  return { intent: "wander", x, y };
}

function stepCat(s: GameState, dt: number) {
  const cat = s.cat;
  if (!cat.mode) cat.mode = "sit";
  if (!cat.look) cat.look = "s";
  if (cat.pause > 0) {
    cat.pause -= dt;
    return;
  }
  if (footBlocked(cat.x, cat.y)) {
    unstick(cat);
    cat.route = [];
    cat.mode = "sit";
    cat.pause = 0.4;
    return;
  }
  if (cat.mode === "sit") {
    if (unitRand(s) < 0.4) {
      cat.face *= -1;
      cat.look = cat.face < 0 ? "w" : "e";
      cat.pause = 0.7 + unitRand(s) * 1.4;
      return;
    }
    cat.mode = "stand";
    cat.pause = 0.2;
    return;
  }
  if (cat.mode === "stand" || !cat.route || cat.route.length < 2) {
    const near = Math.hypot(s.x - cat.x, s.y - cat.y);
    const dash = unitRand(s) < 0.18 || near < 16;
    cat.mode = dash ? "run" : "walk";
    let goal = pickSpot(s, COURT_SPOTS);
    let intent: NonNullable<typeof cat.intent> = "court";
    const roll = unitRand(s);
    if (near < 20) {
      goal = { x: clamp(cat.x + Math.sign(cat.x - s.x || 1) * 24, 48, 300), y: clamp(cat.y + 20, 214, 420) };
      intent = "court";
    } else if (roll < 0.2) {
      goal = POND_BANK;
      intent = "drink";
    } else if (roll < 0.4) {
      goal = { x: clamp(90 + unitRand(s) * 140, 48, 300), y: 120 + unitRand(s) * 24 };
      intent = "yard";
    } else if (near < 80 && roll < 0.55) {
      goal = { x: clamp(s.x + (cat.x > s.x ? 14 : -14), 48, 300), y: clamp(s.y, 100, 460) };
      intent = "follow";
    }
    if (footBlocked(goal.x, goal.y)) goal = { x: 160, y: 270 };
    cat.intent = intent;
    cat.route = gateRoute(cat, goal);
    cat.face = goal.x >= cat.x ? 1 : -1;
    cat.look = Math.abs(goal.y - cat.y) > Math.abs(goal.x - cat.x) ? (goal.y >= cat.y ? "s" : "n") : goal.x >= cat.x ? "e" : "w";
    if (cat.route.length < 2) {
      cat.mode = "sit";
      cat.pause = 0.6;
    }
    return;
  }
  const speed = cat.mode === "run" ? 36 : 15;
  const step = followRoute(cat, speed, dt);
  if (step === "arrive") {
    cat.mode = "sit";
    cat.route = [];
    cat.pause = cat.intent === "drink" ? 1.6 : 1.2 + unitRand(s) * 2.4;
  } else if (step === "stuck") {
    unstick(cat);
    cat.mode = "sit";
    cat.route = [];
    cat.pause = 0.6;
  }
}

const BIRD_PADS: [number, number][] = [
  [72, 248],
  [128, 256],
  [184, 244],
  [236, 260],
  [292, 252],
  [64, 320],
  [156, 308],
  [220, 324],
  [276, 336],
  [96, 392],
  [168, 404],
  [240, 384],
  [304, 412],
  [120, 456],
  [200, 468],
  [268, 448],
];
const TAKEOFF_T = 0.5;
const LAND_T = 0.5;
const FLY_Z = 16;

function birdRoll(b: Bird): number {
  b.seed = (Math.imul(b.seed >>> 0, 1664525) + 1013904223) >>> 0;
  return b.seed / 4294967296;
}

function pickPad(s: GameState, b: Bird): [number, number] {
  let choice = BIRD_PADS[Math.floor(birdRoll(b) * BIRD_PADS.length)]!;
  for (let i = 0; i < 4; i++) {
    const pad = BIRD_PADS[Math.floor(birdRoll(b) * BIRD_PADS.length)]!;
    choice = pad;
    const crowded = s.birds.some((o) => o.id !== b.id && Math.hypot(o.tx - pad[0], o.ty - pad[1]) < 24);
    if (!crowded && !footBlocked(pad[0], pad[1])) return pad;
  }
  return choice;
}

function beginTakeoff(b: Bird) {
  if (b.mode === "takeoff" || b.mode === "fly") return;
  b.mode = "takeoff";
  b.t = 0;
  b.z = 0;
}

function beginFly(s: GameState, b: Bird) {
  b.mode = "fly";
  b.t = 0;
  b.z = FLY_Z;
  const pad = pickPad(s, b);
  b.tx = pad[0];
  b.ty = pad[1];
  b.face = b.tx >= b.x ? 1 : -1;
}

function beginLand(b: Bird) {
  b.mode = "land";
  b.t = 0;
}

function beginWalk(s: GameState, b: Bird) {
  b.mode = "walk";
  b.t = 0;
  b.z = 0;
  const pad = pickPad(s, b);
  b.tx = pad[0];
  b.ty = pad[1];
  b.face = b.tx >= b.x ? 1 : -1;
}

function beginStand(b: Bird) {
  b.mode = "stand";
  b.t = 0;
  b.z = 0;
  b.pause = 0.7 + birdRoll(b) * 1.6;
}

function stepBirds(s: GameState, dt: number) {
  ensureBirds(s);
  for (const b of s.birds) stepBird(s, b, dt);
}

function stepBird(s: GameState, b: Bird, dt: number) {
  b.t += dt;
  const home = (s.wing ?? 0) === 0;
  if (home && (b.mode === "walk" || b.mode === "stand") && s.cat) {
    const farmer = Math.hypot(s.x - b.x, s.y - b.y) < 18;
    const cat = Math.hypot(s.cat.x - b.x, s.cat.y - b.y) < 24;
    const wizard = !!s.reaper && Math.hypot(s.reaper.x - b.x, s.reaper.y - b.y) < 18;
    if (farmer || cat || wizard) beginTakeoff(b);
  }
  if (b.mode === "stand") {
    if (b.t >= b.pause) {
      if (birdRoll(b) < 0.4) beginTakeoff(b);
      else beginWalk(s, b);
    }
    return;
  }
  if (b.mode === "takeoff") {
    const p = Math.min(1, b.t / TAKEOFF_T);
    b.z = p < 0.4 ? 0 : ((p - 0.4) / 0.6) * FLY_Z;
    if (b.t >= TAKEOFF_T) beginFly(s, b);
    return;
  }
  if (b.mode === "land") {
    const p = Math.min(1, b.t / LAND_T);
    b.z = (1 - p) * FLY_Z;
    if (b.t >= LAND_T) {
      b.z = 0;
      if (birdRoll(b) < 0.45) beginStand(b);
      else beginWalk(s, b);
    }
    return;
  }
  const dx = b.tx - b.x;
  const dy = b.ty - b.y;
  const dist = Math.hypot(dx, dy) || 0.0001;
  if (dist < 3) {
    b.x = b.tx;
    b.y = b.ty;
    if (b.mode === "fly") beginLand(b);
    else if (birdRoll(b) < 0.34) beginTakeoff(b);
    else if (birdRoll(b) < 0.62) beginStand(b);
    else beginWalk(s, b);
    return;
  }
  const speed = b.mode === "fly" ? 54 : 18;
  const step = Math.min(dist, speed * dt);
  const nx = b.x + (dx / dist) * step;
  const ny = b.y + (dy / dist) * step;
  if (b.mode === "walk" && footBlocked(nx, ny)) {
    beginTakeoff(b);
    return;
  }
  const ox = b.x;
  const oy = b.y;
  b.x = Math.max(40, Math.min(312, nx));
  b.y = Math.max(236, Math.min(500, ny));
  const movedX = b.x - ox;
  const movedY = b.y - oy;
  if (Math.abs(movedX) > 0.05 && Math.abs(movedX) >= Math.abs(movedY)) b.face = movedX > 0 ? 1 : -1;
  if (b.mode === "fly") {
    b.z = FLY_Z + Math.sin(b.t * 7) * 3;
    if (b.t > 5.2) beginLand(b);
  }
}

function reaperFace(r: Reaper, x: number, y: number) {
  const dx = x - r.x;
  const dy = y - r.y;
  if (Math.abs(dx) >= Math.abs(dy)) r.dir = dx >= 0 ? "e" : "w";
  else r.dir = dy >= 0 ? "s" : "n";
}

function reaperPracticeDir(s: GameState, r: Reaper, pose: ReaperPose): Reaper["dir"] {
  const weapon = pose === "scythe" || pose === "axe" || pose === "hammer" || pose === "pickaxe";
  const dx = s.x - r.x;
  const dy = s.y - r.y;
  if (weapon && Math.hypot(dx, dy) < 80) {
    if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "w" : "e";
    return dy >= 0 ? "n" : "s";
  }
  const roll = unitRand(s);
  if (roll < 0.5) return "s";
  if (roll < 0.75) return "n";
  return roll < 0.9 ? "e" : "w";
}

function reaperSpot(s: GameState, r: Reaper): { x: number; y: number } {
  let spot = pickSpot(s, REAPER_SPOTS);
  for (let i = 0; i < 5; i++) {
    const next = pickSpot(s, REAPER_SPOTS);
    if (Math.hypot(next.x - r.x, next.y - r.y) > 40) return next;
    spot = next;
  }
  return spot;
}

function stepReaper(s: GameState, _dt: number) {
  ensureReaper(s);
}

const FARM_SPOTS: { x: number; y: number }[] = [
  { x: 56, y: 150 },
  { x: 118, y: 150 },
  { x: 164, y: 150 },
  { x: 90, y: 132 },
  { x: 200, y: 140 },
];

function stepHand(s: GameState, dt: number) {
  ensureHand(s);
  const h = s.hand;
  h.poseT += dt;
  if ((s.wing ?? 0) !== 0) return;
  if (h.greet > 0) {
    h.greet -= dt;
    h.pose = "handsidle";
    h.route = [];
    return;
  }
  if (h.pause > 0) {
    h.pause -= dt;
    if (h.pose === "walk") h.pose = "idle";
    return;
  }
  if (h.y > 168) {
    h.route = gateRoute(h, { x: HAND_HOME.x, y: HAND_HOME.y }, true);
    h.pose = "walk";
    return;
  }
  if (h.route.length >= 2) {
    h.pose = "walk";
    const moved = followRoute(h, 26, dt, true);
    if (moved !== "walk") {
      h.route = [];
      h.pose = "idle";
      h.pause = 0.2;
    }
    return;
  }
  if (h.pose !== "water" && h.pose !== "shovel") {
    const bed = s.plots.find((p) => Math.hypot(p.x - h.x, p.y - h.y) < 36);
    const thirsty = bed && bed.crop && bed.stage > 0 && bed.stage < 5 && !bed.watered;
    h.pose = thirsty || unitRand(s) < 0.72 ? "water" : "shovel";
    if (thirsty && bed) bed.watered = true;
    h.poseT = 0;
    h.dir = "n";
    h.pause = 1.6;
    return;
  }
  const dry = s.plots.find((p) => p.crop && p.stage > 0 && p.stage < 5 && !p.watered);
  const spot = dry ? { x: Math.max(36, Math.min(210, dry.x)), y: 150 } : pickSpot(s, FARM_SPOTS);
  h.route = gateRoute(h, spot, true);
  h.pose = "walk";
}

function stepCritters(s: GameState, dt: number) {
  stepCat(s, dt);
  stepBirds(s, dt);
  stepReaper(s, dt);
  stepHand(s, dt);
  for (const a of s.animals) {
    if (!a.route) a.route = [];
    if (a.pause > 0) {
      a.pause -= dt;
      if (a.intent === "graze") a.dir = "s";
      continue;
    }
    if (footBlocked(a.x, a.y)) {
      unstick(a);
      a.route = [];
      a.pause = 0.4;
      continue;
    }
    if (a.route.length < 2) {
      const goal = herdGoal(s, a);
      a.intent = goal.intent;
      a.route = gateRoute(a, goal, true);
      if (a.route.length < 2) {
        a.pause = 0.8;
        continue;
      }
    }
    const speed = a.kind === "rooster" ? 20 : a.kind === "goat" ? 15 : 8;
    const step = followRoute(a, speed, dt, true);
    if (step === "walk") continue;
    a.route = [];
    if (step === "stuck") {
      unstick(a);
      a.pause = 0.7;
      continue;
    }
    if (a.intent === "graze") a.pause = a.kind === "cow" ? 3.4 + unitRand(s) * 1.6 : a.kind === "goat" ? 1.5 + unitRand(s) : 0.55 + unitRand(s) * 0.4;
    else if (a.intent === "drink") a.pause = 2.2 + unitRand(s) * 0.8;
    else if (a.kind === "cow") a.pause = 1.6 + unitRand(s) * 1.4;
    else if (a.kind === "goat") a.pause = 0.4 + unitRand(s) * 0.7;
    else a.pause = 0.2 + unitRand(s) * 0.35;
    if (a.intent === "graze") a.dir = "s";
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
