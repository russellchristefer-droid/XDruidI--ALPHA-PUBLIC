import { SAVE_KEY, defaultFlowers, ensureAuto, ensureFishing, ensureLife, ensureWeather, lockBeds, placeHerd, type GameState } from "./content.ts";

export const BAK1 = `${SAVE_KEY}.bak1`;
export const BAK2 = `${SAVE_KEY}.bak2`;
export const QUARANTINE = `${SAVE_KEY}-quarantine`;

export type SaveStore = {
  get(key: string): string | null;
  set(key: string, value: string): void;
  del(key: string): void;
};

type Envelope = { version: 1; sum: string; state: GameState };

export function checksum(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function encodeState(s: GameState): string {
  const copy = structuredClone(s);
  delete copy.uiEvent;
  const body = JSON.stringify(copy);
  const envelope: Envelope = { version: 1, sum: checksum(body), state: copy };
  return JSON.stringify(envelope);
}

export function decodeState(raw: string): { ok: true; state: GameState } | { ok: false; reason: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "unreadable" };
  }
  if (!parsed || typeof parsed !== "object") return { ok: false, reason: "not an object" };
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.sum === "string" && obj.state && typeof obj.state === "object") {
    const body = JSON.stringify(obj.state);
    if (checksum(body) !== obj.sum) return { ok: false, reason: "checksum" };
    return accept(obj.state as GameState);
  }
  return accept(parsed as GameState);
}

function accept(state: GameState): { ok: true; state: GameState } | { ok: false; reason: string } {
  if (!state || state.version !== 1 || !Array.isArray(state.pack) || state.pack.length !== 28) {
    return { ok: false, reason: "shape" };
  }
  if (typeof state.rng !== "number") state.rng = 1;
  if (!state.flowers || !state.flowers.length) state.flowers = defaultFlowers();
  return { ok: true, state };
}

function quarantine(store: SaveStore, key: string, raw: string) {
  if (!store.get(QUARANTINE)) store.set(QUARANTINE, raw);
  else store.set(`${QUARANTINE}-${key}`, raw);
  store.del(key);
}

export function writeSave(store: SaveStore, s: GameState) {
  const cur = store.get(SAVE_KEY);
  const bak1 = store.get(BAK1);
  if (bak1 != null) store.set(BAK2, bak1);
  if (cur != null) store.set(BAK1, cur);
  store.set(SAVE_KEY, encodeState(s));
}

export function readSaveFrom(store: SaveStore): GameState | null {
  for (const key of [SAVE_KEY, BAK1, BAK2]) {
    const raw = store.get(key);
    if (!raw) continue;
    const decoded = decodeState(raw);
    if (decoded.ok) {
      if (key !== SAVE_KEY) store.set(SAVE_KEY, raw);
      lockBeds(decoded.state);
      placeHerd(decoded.state);
      ensureWeather(decoded.state);
      ensureLife(decoded.state);
      ensureFishing(decoded.state);
      ensureAuto(decoded.state);
      return decoded.state;
    }
    quarantine(store, key, raw);
  }
  return null;
}
