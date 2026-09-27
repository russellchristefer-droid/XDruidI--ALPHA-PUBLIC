import assert from "node:assert/strict";
import test from "node:test";
import { snapSprite } from "./dev-sprites.ts";

test("a sprite snaps onto the 8px grid", () => {
  assert.deepEqual(snapSprite(13, 21), { x: 8, y: 16 });
  assert.deepEqual(snapSprite(-4, 10000), { x: 0, y: 952 });
});
