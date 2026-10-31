/** Structured error log for XDruid I.
 * Captures stack, safe game-state snapshot, reproduction context.
 * Every logged error automatically files a defect via telemetry.
 * No personal data.
 */
import { track } from "./telemetry.ts";
import type { GameState } from "./content.ts";

/** Small, safe subset of GameState kept with each error (counts instead of big arrays). */
export type StateSnapshot = Partial<Pick<GameState, "version" | "x" | "y" | "wing" | "rng">> & {
  packCount?: number;
  note?: string;
};

export type ErrorRecord = {
  t: number;
  message: string;
  stack?: string;
  stateSnapshot?: StateSnapshot;
  context: string;
  userAgent?: string;
  url?: string;
};

const LOG_KEY = "xdruid-error-log";
const MAX = 50;

function safeSnapshot(s: GameState | null | undefined): StateSnapshot | undefined {
  if (!s) return undefined;
  try {
    return {
      version: s.version,
      x: s.x,
      y: s.y,
      wing: s.wing,
      packCount: s.pack?.length,
      rng: s.rng,
      // omit large/transient fields
    };
  } catch {
    return { note: "snapshot failed" };
  }
}

export function logError(err: unknown, context: string, state?: GameState | null): ErrorRecord {
  const rec: ErrorRecord = {
    t: Date.now(),
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    stateSnapshot: safeSnapshot(state),
    context,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    url: typeof location !== "undefined" ? location.href : undefined,
  };
  try {
    const existing = JSON.parse(localStorage.getItem(LOG_KEY) || "[]") as ErrorRecord[];
    const next = [...existing, rec].slice(-MAX);
    localStorage.setItem(LOG_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  // File defect automatically
  track({
    name: "failure",
    kind: "other",
    detail: `defect:${rec.context}:${rec.message.slice(0, 120)}`,
  });
  console.error("[XDruid defect]", rec);
  return rec;
}

export function getErrorLog(): ErrorRecord[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearErrorLog() {
  try {
    localStorage.removeItem(LOG_KEY);
  } catch {
    /* storage unavailable */
  }
}

// Global handlers — no unhandled rejection reaches the player
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    logError(e.error || e.message, "window.error");
  });
  window.addEventListener("unhandledrejection", (e) => {
    logError(e.reason, "unhandledrejection");
    e.preventDefault();
  });
}
