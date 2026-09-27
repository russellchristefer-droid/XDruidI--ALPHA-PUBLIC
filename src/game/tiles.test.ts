import assert from "node:assert/strict";
import test from "node:test";
import { editorOrder, snapRect } from "./tiles.ts";

test("a drag snaps to the 8px grid", () => {
  const box = snapRect({ x: 10, y: 12 }, { x: 27, y: 20 });
  assert.equal(box.x, 8);
  assert.equal(box.y, 8);
  assert.equal(box.w, 24);
  assert.equal(box.h, 16);
});

test("an order names the square and the note", () => {
  const text = editorOrder({ x: 248, y: 88, w: 56, h: 48 }, "make the house stone");
  assert.match(text, /x 248–304/);
  assert.match(text, /y 88–136/);
  assert.match(text, /make the house stone/);
  assert.match(text, /Scale it to the farmer/);
});
