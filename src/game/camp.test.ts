import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { FARMER_HOME, MEADOW, SPOTS, createGame, footBlocked, placeFarmer } from "./content.ts";
import { interact, step } from "./logic.ts";

function canWalk(from: { x: number; y: number }, to: { x: number; y: number }): boolean {
  const key = (p: { x: number; y: number }) => `${p.x},${p.y}`;
  const seen = new Set<string>([key(from)]);
  const q = [from];
  while (q.length) {
    const p = q.shift()!;
    if (Math.abs(p.x - to.x) <= 4 && Math.abs(p.y - to.y) <= 4) return true;
    for (const d of [
      { x: 4, y: 0 },
      { x: -4, y: 0 },
      { x: 0, y: 4 },
      { x: 0, y: -4 },
    ]) {
      const n = { x: p.x + d.x, y: p.y + d.y };
      if (seen.has(key(n)) || footBlocked(n.x, n.y)) continue;
      seen.add(key(n));
      q.push(n);
    }
  }
  return false;
}

test("the original painting is back on the house square", () => {
  const yard = readFileSync("public/game/yard.png");
  assert.equal(yard.readUInt32BE(16), 347);
  assert.equal(yard.readUInt32BE(20), 960);
  const shed = SPOTS.find((s) => s.id === "shed");
  assert.ok(shed);
  assert.equal(shed.x, 236);
  assert.equal(footBlocked(260, 110), true);
});

test("a farmer in the void is put back on the farm", () => {
  const s = createGame();
  assert.equal(s.x, FARMER_HOME.x);
  assert.equal(s.y, FARMER_HOME.y);
  assert.equal(footBlocked(s.x, s.y), false);
  s.x = 180;
  s.y = 640;
  s.life.ty = 640;
  placeFarmer(s);
  assert.equal(s.x, FARMER_HOME.x);
  assert.equal(s.y, FARMER_HOME.y);
  assert.ok(s.y < MEADOW.y);
});

test("the meadow is void and the farm is the rock", () => {
  assert.equal(MEADOW.y, 528);
  assert.equal(footBlocked(172, 160), false);
  assert.equal(footBlocked(180, 180), false);
  assert.equal(footBlocked(80, 180), true);
  assert.equal(footBlocked(180, 300), false);
  assert.equal(footBlocked(40, 300), false);
  assert.equal(footBlocked(180, 700), true);
  assert.equal(footBlocked(10, 300), true);
  assert.equal(footBlocked(80, 112), false);
  assert.equal(footBlocked(188, 136), false);
  assert.equal(footBlocked(304, 112), false);
  assert.equal(canWalk({ x: 172, y: 160 }, { x: 180, y: 900 }), false);
  assert.equal(canWalk({ x: 172, y: 148 }, { x: 64, y: 108 }), true);
  assert.equal(canWalk({ x: 172, y: 180 }, { x: 80, y: 300 }), true);
});

test("sidewalk ends cross onto a matching land", () => {
  const idle = { mx: 0, my: 0, run: false, frozen: false };
  const finish = (s: ReturnType<typeof createGame>) => {
    for (let i = 0; i < 17; i++) step(s, 0.05, idle);
  };
  const s = createGame();
  s.x = 64;
  s.y = 212;
  const west = interact(s, 40, 212);
  assert.match(west.msg ?? "", /Naraka/);
  assert.equal(s.wing, 0);
  finish(s);
  assert.equal(s.wing, -1);
  assert.equal(s.x, 284);
  assert.equal(footBlocked(s.x, s.y), false);
  const home = interact(s, 308, 212);
  assert.match(home.msg ?? "", /home land/);
  finish(s);
  assert.equal(s.wing, 0);
  s.x = 292;
  s.y = 212;
  const east = interact(s, 308, 212);
  assert.match(east.msg ?? "", /Svarga/);
  finish(s);
  assert.equal(s.wing, 1);
  assert.equal(s.x, 64);
  assert.equal(footBlocked(40, 202), true);
  assert.equal(footBlocked(308, 202), true);
  assert.equal(footBlocked(64, 212), false);
  assert.equal(footBlocked(284, 212), false);
  s.wing = 0;
  s.x = 48;
  s.y = 240;
  const fromCourt = interact(s, 40, 202);
  assert.match(fromCourt.msg ?? "", /Naraka/);
  finish(s);
  assert.equal(s.wing, -1);
});
