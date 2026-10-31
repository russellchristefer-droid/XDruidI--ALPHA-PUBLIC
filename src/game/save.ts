import { SAVE_KEY, defaultFlowers, ensureAuto, ensureBirds, ensureFishing, ensureHealth, ensureLife, ensureMagic, ensureReaper, ensureHand, ensureXiang64, ensureMaid, ensureStable, ensureGoatPen, ensureCourtHerd, ensureSow, ensureSkills, ensureWeather, ensureWing, lockBeds, placeCourtSpawn, placeHerd, ensureFarmRack, type GameState } from "./content.ts";
import { trackSave, trackLoad } from "./telemetry.ts";
import { logError } from "./errorLog.ts";

export const BAK1 = `${SAVE_KEY}.bak1`;
export const BAK2 = `${SAVE_KEY}.bak2`;
export const QUARANTINE = `${SAVE_KEY}-quarantine`;
export const LANDMARK = `${SAVE_KEY}.farmland`;

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
  } catch (e) {
    logError(e, "decodeState.parse");
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

/** Moves a bad save aside. Never overwrites earlier evidence: the first copy keeps the
 * legacy key, later ones get `<quarantine>-<key>`, then `-2`, `-3`, ... Returns the key used. */
function quarantine(store: SaveStore, key: string, raw: string): string {
  let at = QUARANTINE;
  if (store.get(at) != null) {
    at = `${QUARANTINE}-${key}`;
    for (let n = 2; store.get(at) != null && n < 100; n++) at = `${QUARANTINE}-${key}-${n}`;
  }
  store.set(at, raw);
  store.del(key);
  return at;
}

export function writeSave(store: SaveStore, s: GameState) {
  try {
    const rack = ensureFarmRack(s);
    const cur = store.get(SAVE_KEY);
    const bak1 = store.get(BAK1);
    if (bak1 != null) store.set(BAK2, bak1);
    if (cur != null) store.set(BAK1, cur);
    const raw = encodeState(s);
    store.set(SAVE_KEY, raw);
    if ((rack.seeds[rack.at] ?? 0) === 0 && !store.get(LANDMARK)) store.set(LANDMARK, raw);
    trackSave(true);
  } catch (e) {
    logError(e, "writeSave");
    trackSave(false, e instanceof Error ? e.message : "write failed");
    throw e;
  }
}

export type RecoveryOption = { key: string; label: string; raw: string; reason?: string };

export function listRecoveryOptions(store: SaveStore): RecoveryOption[] {
  const options: RecoveryOption[] = [];
  for (const [key, label] of [[SAVE_KEY, "Current"], [BAK1, "Backup 1"], [BAK2, "Backup 2"], [LANDMARK, "Landmark farmland"]] as const) {
    const raw = store.get(key);
    if (!raw) continue;
    const decoded = decodeState(raw);
    if (decoded.ok) {
      options.push({ key, label, raw });
    } else {
      options.push({ key, label, raw, reason: decoded.reason });
    }
  }
  return options;
}

const SLOT_LABEL: Record<string, string> = {
  [SAVE_KEY]: "Current",
  [BAK1]: "Backup 1",
  [BAK2]: "Backup 2",
  [LANDMARK]: "Landmark farmland",
};

export type LoadResult = {
  /** loaded: main save fine. recovered: main bad, a backup was used. all-corrupt: saves
   * existed but none could be read. empty: no save yet. */
  status: "loaded" | "recovered" | "all-corrupt" | "empty";
  state: GameState | null;
  /** Slot the state came from. */
  from?: string;
  /** Slots that were bad and moved to quarantine, in the order tried. */
  quarantined: string[];
  /** Plain message for the player, or null when there is nothing to say. */
  message: string | null;
};

/** Loads the newest readable save and reports what happened, so the game can tell the
 * player instead of silently starting over (DRUIDI-SAVE-005). */
export function loadSave(store: SaveStore): LoadResult {
  const quarantined: string[] = [];
  for (const key of [SAVE_KEY, BAK1, BAK2, LANDMARK]) {
    const raw = store.get(key);
    if (!raw) continue;
    const decoded = decodeState(raw);
    if (decoded.ok) {
      const state = finishLoad(store, key, raw, decoded.state);
      if (key === SAVE_KEY) return { status: "loaded", state, from: key, quarantined, message: null };
      return {
        status: "recovered",
        state,
        from: key,
        quarantined,
        message: `Your last save could not be read. Restored from ${SLOT_LABEL[key]}; the bad copy was kept aside.`,
      };
    }
    quarantine(store, key, raw);
    quarantined.push(key);
    trackLoad(false, decoded.reason);
    logError(new Error(decoded.reason), `readSave:${key}`);
  }
  trackLoad(false, "no valid save");
  if (quarantined.length === 0) return { status: "empty", state: null, quarantined, message: null };
  return {
    status: "all-corrupt",
    state: null,
    quarantined,
    message: `Your save and its backups could not be read (${quarantined.map((k) => SLOT_LABEL[k]).join(", ")}). A new homestead was started; the old copies were kept aside, not deleted.`,
  };
}

function finishLoad(store: SaveStore, key: string, raw: string, state: GameState): GameState {
  if (key !== SAVE_KEY) store.set(SAVE_KEY, raw);
  lockBeds(state);
  placeCourtSpawn(state);
  placeHerd(state);
  ensureBirds(state);
  ensureReaper(state);
  ensureHand(state);
  ensureXiang64(state);
  ensureMaid(state);
  ensureStable(state);
  ensureGoatPen(state);
  ensureCourtHerd(state);
  ensureSow(state);
  ensureWeather(state);
  ensureLife(state);
  ensureFishing(state);
  ensureMagic(state);
  ensureSkills(state);
  ensureHealth(state);
  ensureAuto(state);
  ensureWing(state);
  trackLoad(true);
  return state;
}

export function readSaveFrom(store: SaveStore): GameState | null {
  return loadSave(store).state;
}
