/**
 * Colimit Runner
 * 
 * A tiny runner that can execute sequential colimit plans.
 * This module is self-contained and can be called from tests or from the DOT coordinator later.
 * 
 * Note: This can be called from tests or from the DOT coordinator later.
 */

import { CategoryOps, pushout } from './fp-pushout';
import { SequentialColimitPlan } from './fp-colimit-sequentializer';
import { assertDefined } from './src/util/assert';

/**
 * Execute a sequential colimit plan, returning the chain P0, P1, ..., Pn.
 * 
 * This implements the execution of the plan produced by planSequentialColimit.
 * Each step computes the pushout of the previous result with the new leg.
 */
export function executeSequentialColimit<Obj, Mor>(
  ops: CategoryOps<Obj, Mor>,
  plan: SequentialColimitPlan<Obj, Mor>,
  seedP0: Obj,
  seedIn: { 
    toB: (Qk: Obj) => Mor; 
    toC: (Lk: Obj) => Mor; 
    fromA: (Pk_1: Obj) => {A: Obj; f: Mor; g: Mor} 
  }
): ReadonlyArray<Obj> {
  const acc: Obj[] = [seedP0];
  for (const step of plan.steps) {
    const obj = assertDefined(acc[acc.length-1], "colimit: obj");
    const { A, f, g } = seedIn.fromA(obj);
    const { P } = pushout(ops, A, step.Qk, step.Lk, step.glue, g);
    acc.push(P);
  }
  return acc;
}
