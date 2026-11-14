import assert from "node:assert/strict";
import test from "node:test";
import { logError, getErrorLog, clearErrorLog, type ErrorRecord } from "./errorLog.ts";
import { listRecoveryOptions, type SaveStore } from "./save.ts";
import { createGame } from "./content.ts";

// Minimal mock for localStorage in tests
const store: Record<string, string> = {};
global.localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  key: () => null,
  length: 0,
} as Storage;

test("safe snapshot does not throw on partial or null state", () => {
  clearErrorLog();
  const rec = logError(new Error("test"), "unit", null);
  assert.equal(rec.stateSnapshot, undefined);
  const partial = { version: 1, x: 10 } as any;
  const rec2 = logError(new Error("partial"), "unit", partial);
  assert.equal(rec2.stateSnapshot?.x, 10);
  assert.ok(rec2.stateSnapshot?.packCount === undefined);
});

test("recovery list includes invalid entries with reason", () => {
  const mem: SaveStore = {
    get: (k) => k === "assay-homestead-v2" ? "not json" : null,
    set: () => {},
    del: () => {},
  };
  const opts = listRecoveryOptions(mem);
  assert.equal(opts.length, 1);
  assert.equal(opts[0].reason, "unreadable");
});

test("every logged error files a defect record", () => {
  clearErrorLog();
  logError("boom", "context");
  const log = getErrorLog();
  assert.equal(log.length, 1);
  assert.equal(log[0].context, "context");
  assert.match(log[0].message, /boom/);
});
