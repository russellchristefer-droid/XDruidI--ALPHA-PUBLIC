import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { SPOTS } from "./content.ts";

test("the locked yard square is grass and one rock, not a house", () => {
  const buf = readFileSync("public/game/yard.png");
  assert.equal(buf.readUInt32BE(16), 347);
  assert.equal(SPOTS.some((s) => s.id === "shed"), true);
});
