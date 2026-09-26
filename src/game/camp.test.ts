import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { MEADOW, SPOTS, footBlocked } from "./content.ts";

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

test("the south path walks onto the meadow", () => {
  assert.equal(MEADOW.x, 0);
  assert.equal(MEADOW.y, 192);
  assert.equal(MEADOW.w, 347);
  assert.equal(MEADOW.h, 768);
  assert.equal(footBlocked(172, 160), false);
  assert.equal(footBlocked(180, 300), false);
  assert.equal(footBlocked(40, 300), false);
  assert.equal(footBlocked(300, 300), false);
  assert.equal(footBlocked(2, 300), true);
  assert.equal(footBlocked(180, 200), false);
  assert.equal(footBlocked(58, 206), true);
  assert.ok(canWalk({ x: 172, y: 160 }, { x: 180, y: 900 }));
  assert.ok(canWalk({ x: 172, y: 160 }, { x: 80, y: 320 }));
});
