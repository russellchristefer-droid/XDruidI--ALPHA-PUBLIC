/** Dream and vision layer — DREAM-001.
 * Deterministic per seed (uses GameState.rng).
 * Triggers: night sleep (tub), ritual completion, high fatigue/exhaustion.
 * Content sourced only from vision pillars (occult depth, portal cycles, ritual focus) and ritual/realm defs in mods/.
 * Leaves waking traces: remembered symbol, temporary spiritual balance, creature bond echo.
 */

export type DreamTrigger = "sleep_night" | "ritual_complete" | "exhaustion";

export type DreamSequence = {
  id: string;
  trigger: DreamTrigger;
  impressions: string[]; // symbolic, non-UI, personal
  audioHint?: string;
  visualHint?: string;
  trace: {
    spiritualDelta?: number;
    rememberedSymbol: string;
    creatureEcho?: { kind: string; bondDelta: number };
    message: string;
  };
};

export const DREAM_DEFS: DreamSequence[] = [
  {
    id: "loka_cycle",
    trigger: "sleep_night",
    impressions: [
      "The yard lifts and the portals open in a circle; you step through and return before the gate closes.",
      "A bee path crosses the courtyard seal and vanishes into the sanctum light.",
      "The staff in your hands grows roots that touch the soil of another loka, then retract."
    ],
    visualHint: "soft portal glow, bee trail, staff root",
    trace: {
      spiritualDelta: 4,
      rememberedSymbol: "circular portal return",
      message: "You wake with the memory of departure and return still warm in the hands."
    }
  },
  {
    id: "sanctum_offering",
    trigger: "ritual_complete",
    impressions: [
      "Milk pours across a shrine and the bees gather; the flowers open without sun.",
      "Incense smoke forms the outline of the courtyard, then the smoke becomes the path back.",
      "A chant rises from the mantra hall and settles into the ground under the beds."
    ],
    audioHint: "distant mantra chant",
    visualHint: "pouring milk, rising smoke, bee cluster",
    trace: {
      spiritualDelta: 6,
      rememberedSymbol: "offering smoke path",
      creatureEcho: { kind: "bee", bondDelta: 2 },
      message: "The scent of resin lingers. The bees seem closer when you open your eyes."
    }
  },
  {
    id: "exhaust_staff",
    trigger: "exhaustion",
    impressions: [
      "The ritual staff grows heavy; its sockets empty and fill with night soil.",
      "The cat watches from the fence while the yard stretches longer than the day.",
      "You reach for the tub and the water becomes the well of another realm."
    ],
    visualHint: "heavy staff, watching cat, elongated yard",
    trace: {
      spiritualDelta: 2,
      rememberedSymbol: "heavy focus",
      creatureEcho: { kind: "cat", bondDelta: 1 },
      message: "Fatigue still sits in the shoulders, but the staff feels known."
    }
  }
];

/** Select dream deterministically from seed and trigger. */
export function selectDream(rng: number, trigger: DreamTrigger): DreamSequence | null {
  const candidates = DREAM_DEFS.filter(d => d.trigger === trigger);
  if (candidates.length === 0) return null;
  const idx = Math.floor(rng * candidates.length) % candidates.length;
  return candidates[idx]!;
}
