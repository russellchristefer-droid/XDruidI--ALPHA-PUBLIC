// Privacy-respecting opt-in telemetry for XDruid I.
// No personal data. Opt-in only. Degrades gracefully if endpoint unreachable.
// Events stored locally for dashboard; optional POST to TELEMETRY_ENDPOINT.

const OPT_IN_KEY = "xdruid-telemetry-optin";
const EVENTS_KEY = "xdruid-telemetry-events";
const TELEMETRY_ENDPOINT = "https://xdruidi.grok.me/api/telemetry"; // graceful fail if missing

export type TelemetryEvent =
  | { name: "session_start"; t: number }
  | { name: "session_end"; t: number; durationSec: number }
  | { name: "action"; t: number; kind: string; detail?: string }
  | { name: "failure"; t: number; kind: "death" | "health_low" | "stamina_empty" | "other"; detail?: string }
  | { name: "portal_visit"; t: number; realm: number; name: string }
  | { name: "skill_progress"; t: number; skill: string; level: number; xpDelta?: number }
  | { name: "save_attempt"; t: number; success: boolean; reason?: string }
  | { name: "load_attempt"; t: number; success: boolean; reason?: string }
  | { name: "perf_frame"; t: number; frameMs: number }
  | { name: "perf_memory"; t: number; usedMB?: number }
  | { name: "perf_load"; t: number; loadMs: number };

let optedIn = false;
let sessionStart = 0;
let eventBuffer: TelemetryEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function now(): number {
  return Date.now();
}

function loadOptIn(): boolean {
  try {
    return localStorage.getItem(OPT_IN_KEY) === "1";
  } catch {
    return false;
  }
}

function saveOptIn(v: boolean) {
  try {
    localStorage.setItem(OPT_IN_KEY, v ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function isTelemetryOptedIn(): boolean {
  return optedIn;
}

export function setTelemetryOptIn(v: boolean) {
  optedIn = v;
  saveOptIn(v);
  if (v) track("session_start");
  else {
    eventBuffer = [];
    try { localStorage.removeItem(EVENTS_KEY); } catch { /* ignore */ }
  }
}

function persistEvents() {
  try {
    const existing = JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]") as TelemetryEvent[];
    const merged = [...existing, ...eventBuffer].slice(-500); // keep last 500
    localStorage.setItem(EVENTS_KEY, JSON.stringify(merged));
    eventBuffer = [];
  } catch {
    /* quota or private mode */
  }
}

async function flushRemote() {
  if (!optedIn || eventBuffer.length === 0) return;
  const batch = [...eventBuffer];
  try {
    const res = await fetch(TELEMETRY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    });
    if (res.ok) eventBuffer = [];
  } catch {
    /* unreachable: keep local only */
  }
  persistEvents();
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushRemote();
  }, 15000);
}

export function track(event: Omit<TelemetryEvent, "t"> & { t?: number }) {
  if (!optedIn) return;
  const full = { ...event, t: event.t ?? now() } as TelemetryEvent;
  eventBuffer.push(full);
  scheduleFlush();
  if (eventBuffer.length > 40) void flushRemote();
}

export function startSession() {
  if (!optedIn) return;
  sessionStart = now();
  track({ name: "session_start" });
}

export function endSession() {
  if (!optedIn || !sessionStart) return;
  const durationSec = Math.round((now() - sessionStart) / 1000);
  track({ name: "session_end", durationSec });
  sessionStart = 0;
  void flushRemote();
}

export function trackAction(kind: string, detail?: string) {
  track({ name: "action", kind, detail });
}

export function trackFailure(kind: "death" | "health_low" | "stamina_empty" | "other", detail?: string) {
  track({ name: "failure", kind, detail });
}

export function trackPortal(realm: number, name: string) {
  track({ name: "portal_visit", realm, name });
}

export function trackSkill(skill: string, level: number, xpDelta?: number) {
  track({ name: "skill_progress", skill, level, xpDelta });
}

export function trackSave(success: boolean, reason?: string) {
  track({ name: "save_attempt", success, reason });
}

export function trackLoad(success: boolean, reason?: string) {
  track({ name: "load_attempt", success, reason });
}

export function trackFrame(frameMs: number) {
  if (frameMs > 50) track({ name: "perf_frame", frameMs }); // only outliers
}

export function trackMemory() {
  const mem = (performance as any).memory;
  if (mem) track({ name: "perf_memory", usedMB: Math.round(mem.usedJSHeapSize / 1048576) });
}

export function trackLoadTime(loadMs: number) {
  track({ name: "perf_load", loadMs });
}

export function getStoredEvents(): TelemetryEvent[] {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearStoredEvents() {
  try { localStorage.removeItem(EVENTS_KEY); } catch { /* ignore */ }
  eventBuffer = [];
}

// Init on module load
optedIn = loadOptIn();
if (optedIn) startSession();

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", endSession);
  window.addEventListener("pagehide", endSession);
}
