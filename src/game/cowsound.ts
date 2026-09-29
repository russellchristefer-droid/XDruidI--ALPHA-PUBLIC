import { hourOf, type GameState } from "./content";

export type MooKind = "single" | "dry" | "long" | "sick";

export type Moo = {
  kind: MooKind;
  x: number;
  y: number;
  px: number;
  py: number;
  gain: number;
};

const queue: Moo[] = [];
let next = 6;

export function takeMoos(): Moo[] {
  return queue.splice(0, queue.length);
}

function pick(fed: boolean, ready: boolean): MooKind {
  const r = Math.random();
  if (!fed && ready && r < 0.35) return "sick";
  if (r < 0.55) return "single";
  if (r < 0.8) return "dry";
  if (r < 0.93) return "long";
  return "sick";
}

/** A moo now and then through the day, from where she stands. */
export function tickCow(s: GameState): void {
  if ((s.weather ?? "clear") === "storm") return;
  if (hourOf(s.time) >= 20) return;
  if (s.clock < next || !s.animals) return;
  if ((s.wing ?? 0) !== 2) return;
  const cow = s.animals.find((a) => a.kind === "cow");
  if (!cow) return;
  const near = Math.hypot(s.x - cow.x, s.y - cow.y) < 90;
  queue.push({
    kind: pick(cow.fed, cow.ready),
    x: cow.x,
    y: cow.y,
    px: s.x,
    py: s.y,
    gain: near ? 0.4 : 0.3,
  });
  next = s.clock + (near ? 28 : 46) + Math.random() * 34;
}
