// fp-quillen-equivalences.ts
// Quillen equivalences between the nine model structures on Set.

import { ALL_MODEL_STRUCTURES } from "./fp-model-sets";

export interface QuillenEq {
  left: string;
  right: string;
  type: "direct" | "zigzag";
  reason: string;
}

export const ALL_EQUIVALENCES: QuillenEq[] = [
  {
    left: "Discrete",
    right: "Chaotic",
    type: "zigzag",
    reason: "Share weak equivalences up to zigzag equivalence.",
  },
  {
    left: "Mono-Epi",
    right: "Epi-Mono",
    type: "direct",
    reason: "Dual structures with same weak equivalences.",
  },
  {
    left: "SplitMono-SplitEpi",
    right: "SplitEpi-SplitMono",
    type: "direct",
    reason: "Dual split structures.",
  },
  // Add more as needed based on classification
];

export function isQuillenEquivalent(n1: string, n2: string): { equiv: boolean; via: string | null } {
  for (const eq of ALL_EQUIVALENCES) {
    if ((eq.left === n1 && eq.right === n2) || (eq.left === n2 && eq.right === n1)) {
      return { equiv: true, via: eq.type };
    }
  }
  return { equiv: false, via: null };
}
