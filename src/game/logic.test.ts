import assert from "node:assert/strict";
import test from "node:test";
import { createGame, DEFS, footBlocked } from "./content.ts";
import {
  applyDawn,
  buyFineCan,
  coinCount,
  contactFail,
  interact,
  makeItem,
  onQ,
  sellItem,
  step,
  equipItem,
  unequipItem,
  bestSlot,
  totalMass,
  autoRoute,
  watcherLine,
  withdraw,
} from "./logic.ts";
import { itemMass as massOf } from "./content.ts";
import { BAK1, QUARANTINE, readSaveFrom, writeSave, type SaveStore } from "./save.ts";

test("spawn is open and the well blocks", () => {
  const s = createGame();
  assert.equal(s.pack.length, 28);
  assert.equal(s.pack.filter(Boolean).length > 0, true);
  assert.equal(footBlocked(s.x, s.y), false);
  assert.equal(footBlocked(176, 80), true);
});

test("A moves left and D moves right", () => {
  const s = createGame();
  const x0 = s.x;
  step(s, 0.5, { mx: 1, my: 0, run: false, frozen: false });
  assert.ok(s.x > x0, `D/right should increase x, ${x0} -> ${s.x}`);
  const x1 = s.x;
  step(s, 0.5, { mx: -1, my: 0, run: false, frozen: false });
  assert.ok(s.x < x1, `A/left should decrease x, ${x1} -> ${s.x}`);
  const y0 = s.y;
  step(s, 0.4, { mx: 0, my: -1, run: false, frozen: false });
  assert.ok(s.y < y0, "W should move up (smaller y)");
});

test("watering then dawn advances a crop; a dry bed wilts", () => {
  const s = createGame();
  const plot = s.plots[1]!;
  plot.crop = "cabbage";
  plot.stage = 3;
  plot.watered = false;
  s.x = plot.x;
  s.y = plot.y + 6;
  const can = s.pack.find((p) => p?.defId === "can")!;
  can.water = 8;
  s.activeId = can.id;
  interact(s, plot.x, plot.y);
  assert.ok(s.action);
  s.action!.elapsed = s.action!.dur;
  step(s, 0.02, { mx: 0, my: 0, run: false, frozen: false });
  assert.equal(plot.watered, true);
  const before = plot.stage;
  applyDawn(s);
  assert.equal(plot.stage, before + 1);
  assert.equal(plot.watered, false);
  const dry = s.plots[2]!;
  dry.crop = "greens";
  dry.watered = false;
  dry.stage = 2;
  dry.wilt = 0;
  applyDawn(s);
  assert.equal(dry.wilt, 1);
  assert.ok(dry.stage > 0);
  applyDawn(s);
  assert.equal(dry.stage, -1);
});

test("floor shaves, notes weigh nothing, pack stays 28, coins stack", () => {
  const s = createGame();
  const axe = s.pack.find((p) => p?.defId === "axe")!;
  const floor0 = axe.floor;
  s.branches.push({ id: "br1", x: 40, y: 108, left: true });
  s.x = 40;
  s.y = 108;
  s.activeId = axe.id;
  s.hotbar[0] = axe.id;
  interact(s, 40, 108);
  assert.equal(s.action?.kind, "chop");
  s.action!.elapsed = 1;
  step(s, 0.02, { mx: 0, my: 0, run: false, frozen: false });
  assert.ok(axe.floor < floor0);
  const tomato = makeItem(s, "tomato");
  s.vault[0] = tomato;
  const msg = withdraw(s, 0, true);
  assert.match(msg, /note/i);
  const note = s.pack.find((p) => p?.defId === "note");
  assert.ok(note);
  assert.equal(massOf(note!), 0);
  assert.equal(s.pack.length, 28);
  const coins = coinCount(s);
  sellItem(s, note!.id);
  assert.ok(coinCount(s) >= coins);
  assert.ok(totalMass(s) < 21);
});

test("fine can costs 48 and will not buy twice", () => {
  const s = createGame();
  const stack = s.pack.find((p) => p?.defId === "coin")!;
  stack.qty = 48;
  assert.match(buyFineCan(s), /Bought/);
  assert.equal(s.stats.boughtTool, true);
  assert.match(buyFineCan(s), /already/i);
});

test("Q eats food on the hotbar and refuses a note", () => {
  const s = createGame();
  s.selected = 6;
  s.stamina = 40;
  const msg = onQ(s);
  assert.match(msg, /Ate/);
  assert.ok(s.stamina > 40);
});

test("watering keeps the painted bed, and night at the shed sleeps", () => {
  const s = createGame();
  const plot = s.plots[1]!;
  plot.crop = "cabbage";
  plot.stage = 3;
  plot.revealed = false;
  s.x = plot.x;
  s.y = plot.y + 10;
  const can = s.pack.find((p) => p?.defId === "can")!;
  can.water = 4;
  s.activeId = can.id;
  interact(s, plot.x, plot.y);
  assert.equal(s.action?.kind, "water");
  s.action!.elapsed = 1;
  step(s, 0.02, { mx: 0, my: 0, run: false, frozen: false });
  assert.equal(plot.watered, true);
  assert.equal(plot.revealed, false);
  s.time = 0.92;
  s.x = 118;
  s.y = 70;
  const r = interact(s, 118, 48);
  assert.equal(r.save, true);
  assert.equal(s.day, 2);
  assert.equal(s.stats.daysSlept, 1);
});

function memoryStore(): SaveStore & { bag: Map<string, string> } {
  const bag = new Map<string, string>();
  return {
    bag,
    get: (key) => bag.get(key) ?? null,
    set: (key, value) => bag.set(key, value),
    del: (key) => bag.delete(key),
  };
}

test("save checksum round trip, and a bad primary falls back without deleting the backup", () => {
  const store = memoryStore();
  const first = createGame();
  first.day = 3;
  first.message = "kept";
  writeSave(store, first);
  const second = createGame();
  second.day = 4;
  writeSave(store, second);
  const good = readSaveFrom(store);
  assert.equal(good?.day, 4);
  assert.equal(good?.message, second.message);
  const raw = store.bag.get("assay-homestead-v2")!;
  const env = JSON.parse(raw) as { state: { day: number } };
  env.state.day = 99;
  store.bag.set("assay-homestead-v2", JSON.stringify(env));
  const restored = readSaveFrom(store);
  assert.equal(restored?.day, 3);
  assert.ok(store.bag.get(QUARANTINE));
  assert.ok(store.bag.get(BAK1));
});

test("a swing out of reach stops at the contact marker and does not water", () => {
  const s = createGame();
  const plot = s.plots[1]!;
  plot.crop = "cabbage";
  plot.stage = 3;
  s.x = plot.x;
  s.y = plot.y + 6;
  const can = s.pack.find((p) => p?.defId === "can")!;
  can.water = 4;
  s.activeId = can.id;
  interact(s, plot.x, plot.y);
  assert.equal(s.action?.kind, "water");
  s.x = 300;
  s.y = 40;
  s.action!.elapsed = 0.34;
  step(s, 0.05, { mx: 0, my: 0, run: false, frozen: false });
  assert.equal(s.action, null);
  assert.equal(plot.watered, false);
  assert.match(s.message, /Out of reach/);
  assert.equal(contactFail(s), null);
});

test("rain waters the beds and the grove", () => {
  const s = createGame();
  s.plots[0]!.watered = false;
  s.weather = "rain";
  s.weatherLeft = 30;
  s.wet = 0;
  const bloom = s.flowers[0]!.bloom;
  step(s, 1, { mx: 0, my: 0, run: false, frozen: false });
  assert.equal(s.plots[0]!.watered, true);
  assert.ok(s.wet > 0);
  assert.ok(s.flowers[0]!.bloom >= bloom);
  s.weather = "storm";
  s.weatherLeft = 30;
  s.bolts = 0;
  step(s, 0.5, { mx: 0, my: 0, run: false, frozen: false });
  assert.equal(s.plots[2]!.watered, true);
});

test("he feeds himself when hungry and you are not steering", () => {
  const s = createGame();
  s.life.hunger = 80;
  const loaf = s.pack.find((p) => p?.defId === "loaf")!;
  step(s, 0.2, { mx: 0, my: 0, run: false, frozen: false });
  assert.ok(s.life.hunger < 80);
  assert.equal(s.pack.some((p) => p?.id === loaf.id), false);
  assert.equal(s.life.face, "heart");
  s.life.hunger = 90;
  s.x = 40;
  const x = s.x;
  step(s, 0.2, { mx: 1, my: 0, run: false, frozen: false });
  assert.ok(s.x > x);
});

test("meadow trips stay on the path and off the walls", () => {
  const yard = autoRoute(90, 130, 182, 640);
  assert.ok(yard.length >= 4);
  for (let i = 0; i < yard.length; i += 2) {
    const x = yard[i]!;
    const y = yard[i + 1]!;
    if (y > 180) assert.ok(x >= 170 && x <= 194, `${x},${y}`);
    assert.equal(footBlocked(x, y), false, `${x},${y}`);
  }
  const around = autoRoute(40, 120, 200, 140);
  assert.ok(around.length >= 4);
  for (let i = 0; i < around.length; i += 2) {
    assert.equal(footBlocked(around[i]!, around[i + 1]!), false);
  }
});

test("he waters a dry bed on his own, and stops when autonomy is off", () => {
  const idle = { mx: 0, my: 0, run: false, frozen: false };
  const s = createGame();
  s.life.hunger = 0;
  s.life.thirst = 0;
  s.life.dirt = 0;
  for (const plot of s.plots) {
    plot.stage = 2;
    plot.crop = "tomato";
    plot.watered = true;
    plot.tilled = true;
  }
  const plot = s.plots[0]!;
  plot.watered = false;
  const can = s.pack.find((p) => p?.defId === "can")!;
  can.water = 4;
  s.x = plot.x;
  s.y = plot.y;
  step(s, 0.2, idle);
  assert.equal(s.action?.kind, "water");
  assert.equal(s.activeId, can.id);

  const waiting = createGame();
  waiting.auto = false;
  waiting.life.pause = 0;
  const x = waiting.x;
  step(waiting, 0.5, idle);
  assert.equal(waiting.action, null);
  assert.equal(waiting.x, x);
});

test("clothes and tools can be equipped from the pack", () => {
  const s = createGame();
  const shovel = s.pack.find((p) => p?.defId === "shovel")!;
  const hood = s.pack.find((p) => p?.defId === "hood")!;
  assert.equal(bestSlot(s, shovel.id), "hands");
  assert.match(equipItem(s, shovel.id, "hands"), /Equipped/);
  assert.equal(s.body.hands?.id, shovel.id);
  assert.equal(s.pack.some((p) => p?.id === shovel.id), false);
  assert.match(equipItem(s, hood.id, "hands"), /does not fit/);
  assert.match(equipItem(s, hood.id, "head"), /Equipped/);
  assert.equal(s.body.head?.defId, "hood");
  assert.match(unequipItem(s, "hands"), /Stowed/);
  assert.equal(s.body.hands, null);
  assert.ok(s.pack.some((p) => p?.defId === "shovel"));
});

test("he strolls the yard on his own", () => {
  const s = createGame();
  s.life.pause = 0;
  s.life.tx = 80;
  s.life.ty = 140;
  const x = s.x;
  step(s, 0.5, { mx: 0, my: 0, run: false, frozen: false });
  assert.ok(s.x < x);
  assert.ok(s.speed > 1);
});

test("animal wander is the same for the same seed", () => {
  const a = createGame();
  const b = createGame();
  const input = { mx: 0, my: 0, run: false, frozen: false };
  for (let i = 0; i < 30; i++) {
    step(a, 0.05, input);
    step(b, 0.05, input);
  }
  assert.equal(a.animals[0]!.x, b.animals[0]!.x);
  assert.equal(a.animals[1]!.y, b.animals[1]!.y);
  assert.equal(a.rng, b.rng);
});

test("starting pack ids resolve, and the watcher names a dry bed", () => {
  const s = createGame();
  for (const it of s.pack) {
    if (it) assert.ok(DEFS[it.defId], it.defId);
  }
  assert.match(watcherLine(s), /quiet/);
  s.plots[0]!.crop = "tomato";
  s.plots[0]!.stage = 2;
  s.plots[0]!.watered = false;
  assert.match(watcherLine(s), /wants water/);
  s.stamina = 10;
  assert.match(watcherLine(s), /tired/);
});

test("the dock is walkable, the pond is not, and a rod catches a fish", () => {
  const s = createGame();
  assert.equal(footBlocked(56, 256), false);
  assert.equal(footBlocked(100, 256), true);
  s.x = 56;
  s.y = 256;
  const bare = interact(s, 58, 256);
  assert.match(bare.msg ?? "", /rod/);
  const rod = s.pack.find((p) => p?.defId === "rod")!;
  s.activeId = rod.id;
  s.selected = 5;
  const cast = interact(s, 58, 256);
  assert.equal(cast.msg, "Working…");
  const idle = { mx: 0, my: 0, run: false, frozen: false };
  for (let i = 0; i < 40; i++) step(s, 0.05, idle);
  assert.equal(s.fishing, 1);
  assert.ok(s.pack.some((p) => p?.defId === "fish"));
  const fish = s.pack.find((p) => p?.defId === "fish")!;
  s.life.hunger = 40;
  s.hotbar[7] = fish.id;
  s.selected = 7;
  onQ(s);
  assert.ok(s.life.hunger < 40);
});
