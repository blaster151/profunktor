// src/logic/edits.ts
// Minimal "edit" tracker for Semi-Naïve Fast Parallel Chase (Alg. 3).
// We don't construct full pullback/pushout edits; we only track an "image"
// instance so we can ask whether a trigger's env is e-old or e-new.

import type { Instance } from "./regular-cartesian";

export interface Edit {
  image: Instance; // the part of J that's considered "already done"
}

/** Empty edit: image = ∅. */
export function emptyEdit(): Edit {
  return { image: { sorts: {}, relations: {} } };
}

/** An edit for a parallel step I ⇒ J where unchanged data includes all of I. */
export function editFromParallelStep(I: Instance, _J: Instance): Edit {
  return { image: I };
}

/** Compose edits e1 ; e2. For our "image"-only representation, e2's image dominates. */
export function composeEdits(_e1: Edit, e2: Edit): Edit {
  return e2;
}
