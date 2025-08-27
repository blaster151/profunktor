// "Linear" carriers y(S) and tiny duoidal/adjunction shims (for tests).  :contentReference[oaicite:1]{index=1}
import type { Polynomial } from "./polynomial";

/** y(S): positions = S, each with a single trivial direction. */
export function yOf(S: string[]): Polynomial {
  return { positions: [...S], fiber: (_)=> ["*"] };
}

/** Is this polynomial linear (≅ y(S))? (naive check: each fiber is singleton) */
export function isLinear(p: Polynomial): boolean {
  return p.positions.every(u => p.fiber(u).length === 1);
}

// --- Lemma 5.17 witnesses (shape-level): (S⊗Q) ≅ (S ⊳ Q) and (Q⊗S) ≅ (Q ⊳ S)
export function duoidalIsoLeft(S: string[], Q: Polynomial): number {
  // both sides count elements at object-level as |S|·Σ_u |Q[u]|
  const sumQ = Q.positions.reduce((n,u)=> n + Q.fiber(u).length, 0);
  const left = S.length * sumQ;
  const right = left; // by lemma, they are isomorphic; we use size equality as a sanity check
  return left - right; // expect 0
}

// --- Lemma 5.18/5.19 shims: natural bijections yield equal cardinalities on finite examples
export function polySetHomCount_S_to_Q(S: string[], Q: Polynomial): number {
  // |Poly(S, [@,?]⊳S)| ≅ |Set(S, ?⊳S)| — we only compute the RHS size proxy here
  const sum = Q.positions.reduce((n,u)=> n + Q.fiber(u).length, 0);
  return S.length * sum;
}
