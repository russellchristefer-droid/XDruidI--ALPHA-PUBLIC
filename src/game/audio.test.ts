import assert from "node:assert/strict";
import test from "node:test";
import { heavyWind } from "./audio.ts";

test("heavy wind stays in range and is not always on", () => {
  let quiet = 0;
  let loud = 0;
  for (let day = 1; day <= 6; day++) {
    for (let i = 0; i <= 20; i++) {
      const n = heavyWind(i / 20, day);
      assert.ok(n >= 0 && n <= 1);
      if (n === 0) quiet += 1;
      if (n > 0.8) loud += 1;
    }
  }
  assert.ok(quiet > 10);
  assert.ok(loud > 0);
});
