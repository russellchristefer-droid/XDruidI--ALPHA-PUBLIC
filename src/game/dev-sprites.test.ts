import assert from "node:assert/strict";
import test from "node:test";
import { placeBounds, snapSprite } from "./dev-sprites.ts";

test("a sprite snaps onto the 8px grid", () => {
  assert.deepEqual(snapSprite(13, 21), { x: 8, y: 16 });
  assert.deepEqual(snapSprite(-4, 10000), { x: 0, y: 952 });
});

test("turning a sprite swaps its footprint", () => {
  assert.deepEqual(placeBounds({ id: "pot", x: 16, y: 24, rot: 90 }, { w: 32, h: 16 }), { x: 16, y: 24, w: 16, h: 32 });
  assert.deepEqual(placeBounds({ id: "pot", x: 16, y: 24 }, { w: 32, h: 16 }), { x: 16, y: 24, w: 32, h: 16 });
});
