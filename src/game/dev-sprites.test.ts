import assert from "node:assert/strict";
import test from "node:test";
import { ASSET_GROUPS, assetIds } from "./assets.ts";
import { fitScale, placeBounds, snapSprite } from "./dev-sprites.ts";

test("a sprite snaps onto the 8px grid", () => {
  assert.deepEqual(snapSprite(13, 21), { x: 8, y: 16 });
  assert.deepEqual(snapSprite(-4, 10000), { x: 0, y: 952 });
});

test("turning a sprite swaps its footprint", () => {
  assert.deepEqual(placeBounds({ id: "pot", x: 16, y: 24, rot: 90 }, { w: 32, h: 16 }), { x: 16, y: 24, w: 16, h: 32 });
  assert.deepEqual(placeBounds({ id: "pot", x: 16, y: 24 }, { w: 32, h: 16 }), { x: 16, y: 24, w: 32, h: 16 });
  assert.deepEqual(placeBounds({ id: "pot", x: 0, y: 0, scale: 2 }, { w: 16, h: 16 }), { x: 0, y: 0, w: 32, h: 32 });
});

test("big sheets start smaller and every asset is listed once", () => {
  assert.equal(fitScale(32, 32), 1);
  assert.equal(fitScale(96, 32), 0.5);
  assert.equal(fitScale(347, 960), 0.25);
  const listed = ASSET_GROUPS.flatMap((g) => g.keys);
  assert.deepEqual([...listed].sort(), [...assetIds()].sort());
  assert.equal(new Set(listed).size, listed.length);
});
