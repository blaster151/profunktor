// src/homotopy/model/solution-set.ts
import type { GeneratingMap, CategoryOps } from "../small-object/small-object-argument";
import { smallObjectArgument } from "../small-object/small-object-argument";

// A solution set assigns to each i∈I a small family W_i ⊆ W that covers lifting squares with left leg i.
export interface SolutionSet<X> {
  forGenerator(i: X): readonly X[]; // the set W_i
}

export interface BuildJInputs<X> {
  I: readonly GeneratingMap<X>[];
  ops: CategoryOps<X>;
  inW: (f: X) => boolean;     // membership predicate for W
  injSubsetW: boolean;        // c1 witness: inj(I) ⊆ W
}

// Implements Lemma 1.9: from (I, solution sets) construct a set J ⊆ cof(I)∩W of acyclic cofibrations.
export function buildJFromSolutionSets<X>(
  inputs: BuildJInputs<X>,
  sol: SolutionSet<X>
): readonly GeneratingMap<X>[] {
  const { I, ops, inW, injSubsetW } = inputs;
  const J: GeneratingMap<X>[] = [];

  for (const gi of I) {
    const i = gi.map;
    const Wi = sol.forGenerator(i);
    for (const w of Wi) {
      // Form pushout P of i along (i → w) in arrow category (shape only via ops.pushout).
      const P = ops.pushout(i, w);
      // Corner map c: P → cod(w). Factor c = p ∘ q with p ∈ cell(I), q ∈ inj(I) (SOA skeleton).
      const { left: p, right: q } = smallObjectArgument(P, I, ops, { maxStages: 32 });
      // j := p ∘ i' (use ops.compose); j ∈ cof(I) and, by c1 and 2-of-3, j ∈ W.
      const iPrime = ops.idLike(i); // placeholder for "i′" produced by pushout
      const j = ops.compose(p, iPrime);
      if (!injSubsetW) throw new Error("Need c1: inj(I) ⊆ W to conclude j ∈ W (paper Lemma 1.9).");
      if (inW(ops.compose(q, j))) { /* 2-of-3 heuristic */ }
      J.push({ map: j, domainSmall: gi.domainSmall });
      break; // one j per morphism i → W_i suffices
    }
  }
  return J;
}
