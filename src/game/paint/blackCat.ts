/** Black cat atlas. One row per clip, 64px cells, feet on the bottom edge. */

export const CAT_CELL = 64;

export type CatLook = "n" | "e" | "s" | "w";
export type CatClipKind = "walk" | "run" | "idle" | "sleep" | "jump";

export type CatClip = { id: string; row: number; frames: number; look: CatLook; kind: CatClipKind };

export const CAT_CLIPS: CatClip[] = [
  { id: "walkS", row: 0, frames: 6, look: "s", kind: "walk" },
  { id: "walkN", row: 1, frames: 6, look: "n", kind: "walk" },
  { id: "walkE", row: 3, frames: 6, look: "e", kind: "walk" },
  { id: "walkW", row: 2, frames: 6, look: "w", kind: "walk" },
  { id: "settle", row: 4, frames: 13, look: "s", kind: "idle" },
  { id: "runS", row: 5, frames: 4, look: "s", kind: "run" },
  { id: "runN", row: 6, frames: 4, look: "n", kind: "run" },
  { id: "runE", row: 7, frames: 5, look: "e", kind: "run" },
  { id: "runW", row: 8, frames: 5, look: "w", kind: "run" },
  { id: "lickSit", row: 9, frames: 8, look: "s", kind: "idle" },
  { id: "lickLie", row: 10, frames: 8, look: "s", kind: "idle" },
  { id: "meowSit", row: 11, frames: 3, look: "s", kind: "idle" },
  { id: "meowLie", row: 12, frames: 3, look: "s", kind: "idle" },
  { id: "meowStand", row: 13, frames: 3, look: "s", kind: "idle" },
  { id: "scratchW", row: 14, frames: 8, look: "w", kind: "idle" },
  { id: "scratchE", row: 15, frames: 8, look: "e", kind: "idle" },
  { id: "wagSitS", row: 16, frames: 5, look: "s", kind: "idle" },
  { id: "wagSitN", row: 17, frames: 5, look: "n", kind: "idle" },
  { id: "wagSitW", row: 18, frames: 5, look: "w", kind: "idle" },
  { id: "wagSitE", row: 19, frames: 5, look: "e", kind: "idle" },
  { id: "wagStandS", row: 20, frames: 5, look: "s", kind: "idle" },
  { id: "wagStandN", row: 21, frames: 5, look: "n", kind: "idle" },
  { id: "wagStandW", row: 22, frames: 5, look: "w", kind: "idle" },
  { id: "wagStandE", row: 23, frames: 5, look: "e", kind: "idle" },
  { id: "wagLieW", row: 24, frames: 3, look: "w", kind: "idle" },
  { id: "wagLieE", row: 25, frames: 3, look: "e", kind: "idle" },
  { id: "swipeStandS_R", row: 26, frames: 11, look: "s", kind: "idle" },
  { id: "swipeStandS_L", row: 27, frames: 11, look: "s", kind: "idle" },
  { id: "swipeStandN", row: 28, frames: 5, look: "n", kind: "idle" },
  { id: "swipeStandW_L", row: 29, frames: 11, look: "w", kind: "idle" },
  { id: "swipeStandW_R", row: 30, frames: 11, look: "w", kind: "idle" },
  { id: "swipeStandE_L", row: 31, frames: 11, look: "e", kind: "idle" },
  { id: "swipeStandE_R", row: 32, frames: 11, look: "e", kind: "idle" },
  { id: "swipeSitS_R", row: 33, frames: 11, look: "s", kind: "idle" },
  { id: "swipeSitS_L", row: 34, frames: 11, look: "s", kind: "idle" },
  { id: "swipeSitN", row: 35, frames: 5, look: "n", kind: "idle" },
  { id: "swipeSitW_L", row: 36, frames: 11, look: "w", kind: "idle" },
  { id: "swipeSitW_R", row: 37, frames: 11, look: "w", kind: "idle" },
  { id: "swipeSitE_L", row: 38, frames: 11, look: "e", kind: "idle" },
  { id: "swipeSitE_R", row: 39, frames: 11, look: "e", kind: "idle" },
  { id: "yawn", row: 40, frames: 7, look: "s", kind: "idle" },
  { id: "sleep1W", row: 41, frames: 2, look: "w", kind: "sleep" },
  { id: "sleep1E", row: 42, frames: 2, look: "e", kind: "sleep" },
  { id: "sleep1Wn", row: 43, frames: 2, look: "w", kind: "sleep" },
  { id: "sleep1En", row: 44, frames: 2, look: "e", kind: "sleep" },
  { id: "sleep2W", row: 45, frames: 2, look: "w", kind: "sleep" },
  { id: "sleep2E", row: 46, frames: 2, look: "e", kind: "sleep" },
  { id: "sleep3W", row: 47, frames: 2, look: "w", kind: "sleep" },
  { id: "sleep3E", row: 48, frames: 2, look: "e", kind: "sleep" },
  { id: "sleep4W", row: 49, frames: 2, look: "w", kind: "sleep" },
  { id: "sleep4E", row: 50, frames: 2, look: "e", kind: "sleep" },
  { id: "sleep5W", row: 51, frames: 2, look: "w", kind: "sleep" },
  { id: "sleep5E", row: 52, frames: 2, look: "e", kind: "sleep" },
  { id: "eatS", row: 53, frames: 10, look: "s", kind: "idle" },
  { id: "eatN", row: 54, frames: 8, look: "n", kind: "idle" },
  { id: "eatW", row: 55, frames: 10, look: "w", kind: "idle" },
  { id: "eatE", row: 56, frames: 10, look: "e", kind: "idle" },
  { id: "hissW", row: 57, frames: 2, look: "w", kind: "idle" },
  { id: "hissE", row: 58, frames: 2, look: "e", kind: "idle" },
  { id: "jumpN", row: 59, frames: 3, look: "n", kind: "jump" },
  { id: "jumpW", row: 60, frames: 5, look: "w", kind: "jump" },
  { id: "jumpE", row: 61, frames: 5, look: "e", kind: "jump" },
  { id: "hind", row: 62, frames: 4, look: "s", kind: "idle" },
];

const BY_ID = new Map(CAT_CLIPS.map((c) => [c.id, c]));

export function catClip(id: string | undefined): CatClip {
  return BY_ID.get(id || "") ?? CAT_CLIPS[16]!;
}

export function catMoveId(look: CatLook, run: boolean): string {
  const set = run ? { n: "runN", e: "runE", s: "runS", w: "runW" } : { n: "walkN", e: "walkE", s: "walkS", w: "walkW" };
  return set[look];
}

export function catIdleIds(look: CatLook): string[] {
  return CAT_CLIPS.filter((c) => c.kind === "idle" && c.look === look && c.id !== "settle").map((c) => c.id);
}

export function catSleepId(look: CatLook): string {
  const side = look === "e" ? "E" : "W";
  const pool = [`sleep1${side}`, `sleep2${side}`, `sleep3${side}`, `sleep4${side}`, `sleep5${side}`];
  return pool[Math.floor(Math.random() * pool.length)] ?? "sleep1W";
}
