export type DressId = "bush-l" | "bush-m" | "bush-s" | "oak" | "apple" | "birch" | "pine" | "rocks" | "fl-w" | "fl-p" | "fl-u" | "fl-y" | "weed" | "berry" | "berry0" | "stump" | "sapling" | "ditch"
export const DRESS: Record<DressId, [number, number, number, number]> = {
  "bush-l": [0, 0, 40, 30],
  "bush-m": [41, 0, 30, 22],
  "bush-s": [72, 0, 18, 16],
  "oak": [91, 0, 52, 50],
  "apple": [144, 0, 52, 50],
  "pine": [197, 0, 28, 48],
  "birch": [197, 0, 28, 48],
  "rocks": [226, 0, 22, 16],
  "fl-w": [249, 0, 14, 12],
  "fl-p": [264, 0, 14, 12],
  "fl-u": [279, 0, 14, 12],
  "fl-y": [294, 0, 14, 12],
  "weed": [309, 0, 9, 11],
  "berry": [319, 0, 34, 26],
  "berry0": [354, 0, 34, 26],
  "stump": [389, 0, 20, 16],
  "sapling": [410, 0, 16, 20],
  "ditch": [427, 0, 44, 28],
};
export type MeadowProp = { id: DressId; x: number; y: number };
export const MEADOW_PROPS: MeadowProp[] = [
  { id: "bush-l", x: 46, y: 246 },
  { id: "bush-m", x: 104, y: 272 },
  { id: "bush-s", x: 72, y: 308 },
  { id: "fl-w", x: 136, y: 250 },
  { id: "fl-p", x: 28, y: 292 },
  { id: "weed", x: 128, y: 304 },
  { id: "rocks", x: 112, y: 336 },

  { id: "bush-l", x: 302, y: 250 },
  { id: "bush-m", x: 244, y: 278 },
  { id: "bush-s", x: 276, y: 314 },
  { id: "fl-y", x: 214, y: 248 },
  { id: "fl-u", x: 328, y: 300 },
  { id: "weed", x: 220, y: 308 },
  { id: "rocks", x: 252, y: 342 },

  { id: "bush-m", x: 38, y: 368 },
  { id: "bush-l", x: 98, y: 400 },
  { id: "bush-s", x: 60, y: 432 },
  { id: "fl-p", x: 140, y: 378 },
  { id: "fl-w", x: 24, y: 418 },
  { id: "weed", x: 132, y: 428 },
  { id: "rocks", x: 44, y: 462 },

  { id: "apple", x: 300, y: 500 },
  { id: "bush-m", x: 236, y: 440 },
  { id: "bush-s", x: 324, y: 388 },
  { id: "fl-y", x: 216, y: 456 },
  { id: "weed", x: 248, y: 478 },
  { id: "rocks", x: 318, y: 470 },

  { id: "bush-l", x: 54, y: 508 },
  { id: "bush-m", x: 118, y: 540 },
  { id: "bush-s", x: 82, y: 572 },
  { id: "fl-u", x: 26, y: 548 },
  { id: "fl-p", x: 144, y: 522 },
  { id: "weed", x: 136, y: 568 },
  { id: "rocks", x: 108, y: 604 },

  { id: "bush-l", x: 298, y: 520 },
  { id: "bush-m", x: 240, y: 556 },
  { id: "bush-s", x: 326, y: 572 },
  { id: "fl-w", x: 214, y: 536 },
  { id: "fl-y", x: 312, y: 616 },
  { id: "weed", x: 228, y: 590 },
  { id: "rocks", x: 262, y: 612 },

  { id: "oak", x: 72, y: 540 },
  { id: "bush-m", x: 124, y: 700 },
  { id: "bush-s", x: 34, y: 720 },
  { id: "fl-p", x: 142, y: 656 },
  { id: "fl-w", x: 22, y: 690 },
  { id: "weed", x: 100, y: 740 },
  { id: "rocks", x: 46, y: 758 },

  { id: "bush-l", x: 304, y: 680 },
  { id: "bush-m", x: 242, y: 722 },
  { id: "birch", x: 300, y: 830 },
  { id: "pine", x: 78, y: 880 },
  { id: "fl-u", x: 216, y: 688 },
  { id: "fl-w", x: 324, y: 748 },
  { id: "weed", x: 230, y: 760 },
  { id: "rocks", x: 320, y: 812 },

  { id: "bush-l", x: 50, y: 812 },
  { id: "bush-m", x: 114, y: 848 },
  { id: "berry", x: 78, y: 908 },
  { id: "stump", x: 36, y: 948 },
  { id: "sapling", x: 120, y: 936 },
  { id: "fl-y", x: 136, y: 812 },
  { id: "weed", x: 24, y: 840 },
  { id: "ditch", x: 96, y: 948 },

  { id: "bush-l", x: 296, y: 868 },
  { id: "bush-m", x: 236, y: 908 },
  { id: "berry0", x: 324, y: 888 },
  { id: "fl-p", x: 214, y: 860 },
  { id: "fl-y", x: 308, y: 944 },
  { id: "weed", x: 250, y: 848 },
  { id: "rocks", x: 260, y: 952 },
];

const SOLID: Partial<Record<DressId, [number, number]>> = {
  "bush-l": [16, 8],
  "bush-m": [12, 7],
  "bush-s": [8, 6],
  oak: [20, 16],
  apple: [20, 16],
  birch: [16, 16],
  pine: [18, 14],
  rocks: [14, 8],
  berry: [14, 8],
  berry0: [14, 8],
  stump: [36, 14],
  sapling: [10, 8],
  ditch: [28, 14],
};

export function meadowSolid(p: MeadowProp): { x: number; y: number; w: number; h: number } | null {
  const box = SOLID[p.id];
  if (!box) return null;
  const [w, h] = box;
  return { x: p.x - w / 2, y: p.y - h, w, h };
}

