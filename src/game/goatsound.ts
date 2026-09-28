import { hourOf, type GameState } from "./content";

export type BleatKind = "single" | "bleat" | "stutter" | "baby";

export type Bleat = {
  kind: BleatKind;
  x: number;
  y: number;
  px: number;
  py: number;
  gain: number;
};

const queue: Bleat[] = [];
let next = 9;

export function takeBleats(): Bleat[] {
  return queue.splice(0, queue.length);
}

function pick(loose: boolean): BleatKind {
  const r = Math.random();
  if (loose && r < 0.28) return "stutter";
  if (loose && r < 0.48) return "baby";
  if (r < 0.46) return "single";
  if (r < 0.74) return "bleat";
  if (r < 0.9) return "stutter";
  return "baby";
}

/** A bleat now and then. Looser and quicker when he is out of the pen. */
export function tickGoat(s: GameState): void {
  if ((s.weather ?? "clear") === "storm") return;
  if (hourOf(s.time) >= 20) return;
  if (s.clock < next || !s.animals) return;
  const goat = s.animals.find((a) => a.kind === "goat");
  if (!goat) return;
  const loose = (s.goatPen ?? 1) === 2;
  const near = Math.hypot(s.x - goat.x, s.y - goat.y) < 80;
  queue.push({
    kind: pick(loose),
    x: goat.x,
    y: goat.y,
    px: s.x,
    py: s.y,
    gain: loose || near ? 0.38 : 0.28,
  });
  next = s.clock + (loose ? 16 : near ? 32 : 52) + Math.random() * (loose ? 18 : 36);
}
