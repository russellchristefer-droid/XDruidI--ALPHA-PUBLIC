import type { GameState } from "./content";

export type CatKind = "short" | "long" | "trill" | "lick" | "groan";

export type CatCry = {
  kind: CatKind;
  x: number;
  y: number;
  px: number;
  py: number;
  gain: number;
};

const queue: CatCry[] = [];

export function takeCatCries(): CatCry[] {
  return queue.splice(0, queue.length);
}

function push(s: GameState, kind: CatKind, gain: number): void {
  const cat = s.cat;
  queue.push({ kind, x: cat.x, y: cat.y, px: s.x, py: s.y, gain });
}

export function mewNow(s: GameState, kind: CatKind): void {
  s.cat.mew = 5;
  push(s, kind, kind === "long" ? 0.72 : 0.58);
}

export function tickCatVoice(s: GameState, dt: number): void {
  const cat = s.cat;
  cat.mew = Math.max(0, (cat.mew ?? 2.5) - dt);
  if (cat.mew > 0) return;
  const near = Math.hypot(s.x - cat.x, s.y - cat.y);
  if (cat.mode === "sit" && cat.intent === "drink") {
    push(s, "lick", 0.42);
    cat.mew = 2.4;
    return;
  }
  if (cat.mode === "run") {
    if (Math.random() < 0.4) push(s, Math.random() < 0.7 ? "short" : "trill", 0.48);
    cat.mew = 3.2;
    return;
  }
  if (near < 40 && (cat.mode === "sit" || cat.mode === "stand")) {
    push(s, Math.random() < 0.55 ? "short" : "trill", 0.64);
    cat.mew = 6 + Math.random() * 5;
    return;
  }
  if (cat.mode === "sit" || cat.mode === "stand") {
    const roll = Math.random();
    if (roll < 0.4) push(s, "lick", 0.3);
    else if (roll < 0.65) push(s, "trill", 0.38);
    else if (roll < 0.8) push(s, "groan", 0.26);
    else push(s, "short", 0.4);
    cat.mew = 9 + Math.random() * 8;
    return;
  }
  if (Math.random() < 0.3) push(s, "short", 0.34);
  cat.mew = 8 + Math.random() * 6;
}
