/** Five sung pitches from the bird pack, low to high. */
export type Pitch = "vl" | "l" | "m" | "h" | "vh";

export type Note = { p: Pitch; at: number; rate?: number; gain?: number; long?: boolean };

export type Sung = {
  notes: Note[];
  x: number;
  y: number;
  px: number;
  py: number;
  gain: number;
};

export type Voice = "robin" | "blackbird" | "wren" | "thrush" | "dove";

const VOICES: Voice[] = ["robin", "blackbird", "wren", "thrush", "dove"];

/**
 * Real songbirds do not loop one noise.
 * A robin spills a short high phrase, then waits.
 * A blackbird flutes slowly downward.
 * A wren rattles a very high trill.
 * A thrush repeats one motif, then changes it.
 * A dove coos on the low notes, five beats.
 * The fifth shape, the rise through all five pitches and the return, is the old tone.
 */
const ROBIN: Note[][] = [
  [
    { p: "h", at: 0 },
    { p: "vh", at: 0.26 },
    { p: "h", at: 0.5 },
    { p: "m", at: 0.78 },
    { p: "h", at: 1.04 },
  ],
  [
    { p: "vh", at: 0, rate: 1.04 },
    { p: "h", at: 0.22 },
    { p: "m", at: 0.48 },
    { p: "h", at: 0.74 },
    { p: "vh", at: 0.98 },
    { p: "h", at: 1.22 },
  ],
];

const BLACKBIRD: Note[][] = [
  [
    { p: "m", at: 0, rate: 0.96 },
    { p: "h", at: 0.46 },
    { p: "m", at: 0.92, rate: 0.94 },
    { p: "l", at: 1.38 },
    { p: "m", at: 1.86, rate: 0.92 },
  ],
  [
    { p: "h", at: 0, rate: 0.97 },
    { p: "m", at: 0.42 },
    { p: "l", at: 0.9 },
    { p: "m", at: 1.38, rate: 0.94 },
  ],
];

const WREN: Note[][] = [
  [
    { p: "vh", at: 0, rate: 1.08, gain: 0.7 },
    { p: "vh", at: 0.11, rate: 1.1, gain: 0.66 },
    { p: "vh", at: 0.22, rate: 1.06, gain: 0.7 },
    { p: "vh", at: 0.33, rate: 1.12, gain: 0.64 },
    { p: "vh", at: 0.44, rate: 1.08, gain: 0.68 },
    { p: "h", at: 0.66 },
    { p: "m", at: 0.92 },
  ],
];

const THRUSH: Note[][] = [
  [
    { p: "m", at: 0 },
    { p: "h", at: 0.24 },
    { p: "m", at: 0.58 },
    { p: "h", at: 0.82 },
    { p: "m", at: 1.16 },
    { p: "h", at: 1.4 },
    { p: "l", at: 1.86 },
    { p: "m", at: 2.16 },
    { p: "h", at: 2.46 },
  ],
];

const DOVE: Note[][] = [
  [
    { p: "l", at: 0, rate: 0.9, gain: 0.85 },
    { p: "vl", at: 0.4, rate: 0.88, gain: 0.8 },
    { p: "l", at: 0.74, rate: 0.9, gain: 0.85 },
    { p: "l", at: 1.16, rate: 0.92, gain: 0.8 },
    { p: "vl", at: 1.62, rate: 0.86, gain: 0.75 },
  ],
];

/** Rising through every recorded call, then the middle note returns. That return is the mend. */
export const HEAL_TONE: Note[] = [
  { p: "vl", at: 0, long: true, rate: 0.97, gain: 0.55 },
  { p: "l", at: 0.55, long: true, rate: 1, gain: 0.58 },
  { p: "m", at: 1.1, long: true, rate: 1, gain: 0.62 },
  { p: "h", at: 1.65, long: true, rate: 1.03, gain: 0.52 },
  { p: "vh", at: 2.2, long: true, rate: 1.05, gain: 0.4 },
  { p: "m", at: 2.85, long: true, rate: 0.93, gain: 0.68 },
];

const ALARM: Note[] = [
  { p: "h", at: 0, rate: 1.12, gain: 0.75 },
  { p: "vh", at: 0.09, rate: 1.14, gain: 0.7 },
  { p: "h", at: 0.18, rate: 1.1, gain: 0.75 },
  { p: "vh", at: 0.27, rate: 1.16, gain: 0.68 },
  { p: "h", at: 0.36, rate: 1.12, gain: 0.7 },
];

const SONGS: Record<Voice, Note[][]> = {
  robin: ROBIN,
  blackbird: BLACKBIRD,
  wren: WREN,
  thrush: THRUSH,
  dove: DOVE,
};

const CONTACT: Record<Voice, Pitch> = {
  robin: "h",
  blackbird: "m",
  wren: "vh",
  thrush: "m",
  dove: "l",
};

export function voiceOf(id: string): Voice {
  const n = Number(id.replace(/\D/g, "")) || 1;
  return VOICES[(n - 1) % VOICES.length]!;
}

export function songOf(voice: Voice, roll: number): Note[] {
  const book = SONGS[voice];
  return book[Math.floor(roll * book.length) % book.length]!;
}

/** The secret phrase climbs every band, then comes home. Nothing else does. */
export function isHealTone(notes: Note[]): boolean {
  if (notes.length !== HEAL_TONE.length) return false;
  return notes.every((n, i) => n.p === HEAL_TONE[i]!.p && n.long === true);
}

const queue: Sung[] = [];
let glowUntil = 0;
let healAt = 12;
let healDue = 0;

type Slot = { next: number; busy: number; mode: string };

const slots = new Map<string, Slot>();

export function resetBirdsong() {
  queue.length = 0;
  slots.clear();
  glowUntil = 0;
  healAt = 12;
  healDue = 0;
}

export function takeSongs(): Sung[] {
  return queue.splice(0, queue.length);
}

export function birdGlow(clock: number): number {
  if (clock >= glowUntil) return 0;
  return Math.max(0, (glowUntil - clock) / 1.4);
}

const MANA_MAX = 100;

export type Heard = {
  clock: number;
  time: number;
  weather?: string;
  health: number;
  mana: number;
  x: number;
  y: number;
  cat?: { x: number; y: number } | null;
  reaper?: { x: number; y: number } | null;
  birds?: Array<{ id: string; x: number; y: number; mode: string; seed: number }>;
};

function hour(time: number): number {
  return 6 + time * 16;
}

function endAt(notes: Note[]): number {
  let end = 0;
  for (const n of notes) end = Math.max(end, n.at + (n.long ? 0.7 : 0.4));
  return end;
}

function push(s: Heard, notes: Note[], x: number, y: number, gain: number) {
  queue.push({ notes, x, y, px: s.x, py: s.y, gain });
}

function threatened(s: Heard, x: number, y: number): boolean {
  if (Math.hypot(s.x - x, s.y - y) < 22) return true;
  if (s.cat && Math.hypot(s.cat.x - x, s.cat.y - y) < 28) return true;
  if (s.reaper && Math.hypot(s.reaper.x - x, s.reaper.y - y) < 22) return true;
  return false;
}

function canSing(voice: Voice, time: number, weather: string): boolean {
  if (weather === "storm") return false;
  if (hour(time) >= 20) return voice === "dove";
  return true;
}

/**
 * Heard birds sing from where they are.
 * A full song needs a perch. A walk gets a contact note. A scare gets the alarm.
 * Returns a heal only when the old tone has finished resolving.
 */
export function tickBirdsong(s: Heard, dt: number, silent: boolean): { health: number; mana: number } | null {
  if (!s.birds || dt <= 0) return null;
  let healed: { health: number; mana: number } | null = null;
  if (healDue > 0 && s.clock >= healDue) {
    healDue = 0;
    glowUntil = s.clock + 1.4;
    healed = { health: 6, mana: 8 };
  }
  const weather = s.weather ?? "clear";
  const wet = weather === "rain" ? 1.7 : 1;
  const dawn = hour(s.time) < 9 ? 0.62 : hour(s.time) >= 17 && hour(s.time) < 20 ? 0.8 : 1;
  let full = 0;
  for (const slot of slots.values()) if (slot.busy > s.clock) full += 1;

  for (const b of s.birds) {
    const voice = voiceOf(b.id);
    let slot = slots.get(b.id);
    if (!slot) {
      const stagger = 2.4 + ((b.seed % 17) / 17) * 3.5;
      slot = { next: s.clock + stagger, busy: 0, mode: b.mode };
      slots.set(b.id, slot);
    }
    if (slot.next < s.clock - 0.5) slot.next = s.clock + 0.4 + (b.seed % 5) * 0.35;

    const woke = canSing(voice, s.time, weather);
    const changed = slot.mode !== b.mode;
    slot.mode = b.mode;

    if (changed && b.mode === "takeoff" && woke) {
      const scare = threatened(s, b.x, b.y);
      const notes: Note[] = scare ? ALARM : [{ p: CONTACT[voice], at: 0, gain: 0.55 }];
      push(s, notes, b.x, b.y, scare ? 0.9 : 0.45);
      slot.busy = s.clock + endAt(notes);
      slot.next = s.clock + (scare ? 2.2 : 1.4);
      continue;
    }
    if (changed && b.mode === "land" && woke && weather !== "storm") {
      const notes: Note[] = [{ p: voice === "dove" ? "vl" : "l", at: 0, gain: 0.5, rate: 0.94 }];
      push(s, notes, b.x, b.y, 0.4);
      slot.busy = s.clock + 0.5;
      continue;
    }
    if (!woke || s.clock < slot.next || s.clock < slot.busy) continue;
    if (weather === "storm") continue;

    if (b.mode === "walk") {
      const notes: Note[] = [{ p: CONTACT[voice], at: 0, gain: 0.45 }];
      push(s, notes, b.x, b.y, weather === "rain" ? 0.35 : 0.55);
      slot.next = s.clock + (2.8 + (b.seed % 7) * 0.35) * wet;
      continue;
    }
    if (b.mode !== "stand") continue;
    if (full >= 2) continue;

    const near = Math.hypot(s.x - b.x, s.y - b.y) < 92;
    const hurt = s.health < 97 || s.mana < MANA_MAX - 10;
    const secret = voice === "blackbird" && !silent && near && s.clock >= healAt && b.seed % 4 === 1;
    const notes = secret ? HEAL_TONE : songOf(voice, (b.seed % 100) / 100);
    const gain = (weather === "rain" ? 0.55 : 0.9) * (voice === "wren" ? 0.75 : 1);
    push(s, notes, b.x, b.y, gain);
    slot.busy = s.clock + endAt(notes);
    const wait = voice === "dove" ? 11 : voice === "wren" ? 9 : voice === "blackbird" ? 8 : 7;
    slot.next = s.clock + wait * dawn * wet + (b.seed % 5) * 0.4;
    if (secret) {
      healAt = s.clock + 58;
      if (hurt) healDue = s.clock + 3.2;
    }
    full += 1;
    b.seed = (Math.imul(b.seed >>> 0, 1664525) + 1013904223) >>> 0;
  }
  return healed;
}
