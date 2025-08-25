/**
 * Sequential Colimit Planner
 * 
 * Provides a planner that produces the exact pushout plan in Thm. 7.11 style.
 * This module is self-contained and can be used independently.
 * 
 * Note: This can be called from tests or from the DOT coordinator later.
 */

/**
 * A diagram with indexed objects and morphisms.
 */
export interface Diagram<I, Obj, Mor> {
  /** finite index set or shape descriptor */
  readonly index: I;
  objectOf(i: I): Obj;
  morphism(src: I, dst: I): Mor | null;
}

/**
 * A single pushout step in the sequential colimit.
 */
export interface PushoutStep<Obj, Mor> {
  /** "front face" object Q_k restricted to q^(k) */
  readonly Qk: Obj;
  /** leg L_k to glue along */
  readonly Lk: Obj;
  /** canonical map P_{k-1} → Q_k */
  readonly glue: Mor;
}

/**
 * Complete sequential colimit plan.
 */
export interface SequentialColimitPlan<Obj, Mor> {
  readonly steps: ReadonlyArray<PushoutStep<Obj, Mor>>;
}

/**
 * Create the plan ⟨(Q_k, L_k, P_{k-1}→Q_k)⟩_{k=0..maxK}.
 * 
 * This implements the sequential colimit construction from Theorem 7.11:
 * - Q_k is the restriction to degree k
 * - L_k is the new leg at degree k
 * - glue is the canonical inclusion P_{k-1} → Q_k
 */
export function planSequentialColimit<I, Obj, Mor>(
  restrictToQk: (k: number) => Diagram<I, Obj, Mor> | null,
  buildLk: (k: number) => Obj,
  canonical: (k: number) => Mor,
  maxK: number
): SequentialColimitPlan<Obj, Mor> {
  const steps: PushoutStep<Obj, Mor>[] = [];
  for (let k = 0; k <= maxK; k++) {
    const qk = restrictToQk(k);
    if (!qk) continue;
    steps.push({ 
      Qk: qk.objectOf(qk.index), 
      Lk: buildLk(k), 
      glue: canonical(k) 
    });
  }
  return { steps };
}
