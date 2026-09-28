import { hourOf, type GameState } from "./content";

export type Crow = {
  x: number;
  y: number;
  px: number;
  py: number;
  gain: number;
  kind: "crow" | "cluck";
};

const queue: Crow[] = [];
let inMorning = false;
let left = 0;
let next = 0;
let cluckAt = 8;

export function takeCrows(): Crow[] {
  return queue.splice(0, queue.length);
}

/** Three crows after dawn. A quieter cluck now and then, the rest of the day. */
export function tickRooster(s: GameState): void {
  const hour = hourOf(s.time);
  const storm = (s.weather ?? "clear") === "storm";
  const morning = hour >= 6 && hour < 9 && !storm;
  let justCrowed = false;
  if (!morning) {
    inMorning = false;
  } else {
    if (!inMorning) {
      inMorning = true;
      left = 3;
      next = s.clock + 2.4;
    }
    if (left > 0 && s.clock >= next && s.animals) {
      const bird = s.animals.find((a) => a.kind === "rooster");
      if (bird) {
        queue.push({ x: bird.x, y: bird.y, px: s.x, py: s.y, gain: 0.42, kind: "crow" });
        left -= 1;
        next = s.clock + 34 + Math.random() * 28;
        justCrowed = true;
      }
    }
  }
  if (storm || justCrowed || s.clock < cluckAt || !s.animals) return;
  const bird = s.animals.find((a) => a.kind === "rooster");
  if (!bird) return;
  queue.push({ x: bird.x, y: bird.y, px: s.x, py: s.y, gain: 0.26, kind: "cluck" });
  cluckAt = s.clock + 42 + Math.random() * 36;
}
