import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "./content.ts";
import { BAK1, BAK2, LANDMARK, QUARANTINE, loadSave, readSaveFrom, writeSave, type SaveStore } from "./save.ts";

const MAIN = "assay-homestead-v2";

function memoryStore(): SaveStore & { bag: Map<string, string> } {
  const bag = new Map<string, string>();
  return { bag, get: (k) => bag.get(k) ?? null, set: (k, v) => void bag.set(k, v), del: (k) => void bag.delete(k) };
}

function threeSaves() {
  const store = memoryStore();
  for (const day of [2, 3, 4]) {
    const s = createGame();
    s.day = day;
    writeSave(store, s);
  }
  return store;
}

function corrupt(store: ReturnType<typeof memoryStore>, key: string, how: "edit" | "garbage" = "edit") {
  const raw = store.bag.get(key)!;
  if (how === "garbage") return store.bag.set(key, "{ not json");
  const env = JSON.parse(raw) as { state: { day: number } };
  env.state.day += 100; // checksum no longer matches
  store.bag.set(key, JSON.stringify(env));
}

test("a clean load says so", () => {
  const r = loadSave(threeSaves());
  assert.equal(r.status, "loaded");
  assert.equal(r.state?.day, 4);
  assert.deepEqual(r.quarantined, []);
  assert.equal(r.message, null);
});

test("a bad main save falls back to a backup and tells the player", () => {
  const store = threeSaves();
  corrupt(store, MAIN);
  const r = loadSave(store);
  assert.equal(r.status, "recovered");
  assert.equal(r.state?.day, 3);
  assert.equal(r.from, BAK1);
  assert.deepEqual(r.quarantined, [MAIN]);
  assert.match(r.message ?? "", /Backup 1/);
});

// CHR-27 / DRUIDI-SAVE-005
test("when main and both backups are bad, every one is quarantined and the player is told", () => {
  const store = threeSaves();
  // Same edit on both backups, so they are byte-identical (the QA seed from the report).
  corrupt(store, MAIN, "garbage");
  corrupt(store, BAK1);
  store.bag.set(BAK2, store.bag.get(BAK1)!);
  store.bag.delete(LANDMARK);
  const r = loadSave(store);
  assert.equal(r.status, "all-corrupt");
  assert.equal(r.state, null);
  assert.deepEqual(r.quarantined, [MAIN, BAK1, BAK2]);
  assert.match(r.message ?? "", /could not be read/i);
  // Nothing is thrown away: each bad copy is kept under its own quarantine key.
  assert.equal(store.bag.get(QUARANTINE), "{ not json"); // first bad copy keeps the legacy key
  assert.ok(store.bag.get(`${QUARANTINE}-${BAK1}`));
  assert.ok(store.bag.get(`${QUARANTINE}-${BAK2}`));
  assert.equal(store.bag.get(MAIN), undefined);
  assert.equal(store.bag.get(BAK1), undefined);
  assert.equal(store.bag.get(BAK2), undefined);
});

test("a later bad load does not overwrite evidence quarantined earlier", () => {
  const store = threeSaves();
  store.bag.set(QUARANTINE, "oldest evidence");
  store.bag.set(`${QUARANTINE}-${MAIN}`, "older evidence");
  corrupt(store, MAIN);
  loadSave(store);
  assert.equal(store.bag.get(QUARANTINE), "oldest evidence");
  assert.equal(store.bag.get(`${QUARANTINE}-${MAIN}`), "older evidence");
  const extra = [...store.bag.keys()].filter((k) => k.startsWith(`${QUARANTINE}-${MAIN}-`));
  assert.equal(extra.length, 1);
});

test("no save at all is a fresh start, not an error", () => {
  const r = loadSave(memoryStore());
  assert.equal(r.status, "empty");
  assert.equal(r.message, null);
});

test("readSaveFrom still returns just the state", () => {
  assert.equal(readSaveFrom(threeSaves())?.day, 4);
});
