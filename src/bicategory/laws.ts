/**
 * Bicategory coherence laws (witness-level tests)
 *
 * Provides pentagon and triangle coherence checks for a bicategory constructed
 * via `makeProfunctorBicategory`. Tests are extensional: they evaluate 1-cells
 * on sample inputs using a provided evaluator.
 */

import { Kind2, Apply } from '../../fp-hkt';
import { makeProfunctorBicategory } from './profunctor-bicategory';

export interface LawEvidence {
  readonly name: string;
  readonly samples: number;
  readonly failures: number;
  readonly firstFailure?: string;
}

export type Eq<A> = (x: A, y: A) => boolean;
export type Gen<A> = () => A;

function evidence(name: string, samples: number, fails: Array<string>): LawEvidence {
  return { name, samples, failures: fails.length, firstFailure: fails[0] };
}

export function mkEqP<P extends Kind2, A, B>(
  evalP: <X, Y>(p: Apply<P, [X, Y]>) => (x: X) => Y,
  eqB: Eq<B>,
  samples: A[]
): (p1: Apply<P, [A, B]>, p2: Apply<P, [A, B]>) => boolean {
  return (p1, p2) => {
    for (let i = 0; i < samples.length; i++) {
      const a = samples[i];
      const b1 = evalP(p1)(a);
      const b2 = evalP(p2)(a);
      if (!eqB(b1, b2)) return false;
    }
    return true;
  };
}

// Whiskering helpers using horiz with identity 2-cells
function whiskerLeft<P extends Kind2, A, B, C>(
  B: ReturnType<typeof makeProfunctorBicategory<P>>,
  beta: (p: Apply<P, [B, C]>) => Apply<P, [B, C]>,
  f: Apply<P, [A, B]>
) {
  return B.horiz(beta, B.id2(f));
}

function whiskerRight<P extends Kind2, A, B, C>(
  B: ReturnType<typeof makeProfunctorBicategory<P>>,
  f: Apply<P, [B, C]>,
  alpha: (p: Apply<P, [A, B]>) => Apply<P, [A, B]>
) {
  return B.horiz(B.id2(f), alpha);
}

export function runPentagonLaw<P extends Kind2, A, B, C, D, E>(
  B: ReturnType<typeof makeProfunctorBicategory<P>>,
  cfg: {
    evalP: <X, Y>(p: Apply<P, [X, Y]>) => (x: X) => Y;
    eqE: Eq<E>;
    samplesA: A[];
    f: Apply<P, [A, B]>;
    g: Apply<P, [B, C]>;
    h: Apply<P, [C, D]>;
    k: Apply<P, [D, E]>;
  }
): LawEvidence {
  const { evalP, eqE, samplesA, f, g, h, k } = cfg;
  const fails: string[] = [];

  const eqPE = mkEqP<P, A, E>(evalP, eqE, samplesA);

  // Base left-associated composite: (((k ∘ h) ∘ g) ∘ f)
  const kh = B.compose1(k, h);
  const kh_g = B.compose1(kh, g);
  const leftAssoc = B.compose1(kh_g, f);

  // Derived associators
  const a_k_h_gf = B.associator(k, h, B.compose1(g, f));
  const a_kh_g_f = B.associator(B.compose1(k, h), g, f);
  const a_k_hg_f = B.associator(k, B.compose1(h, g), f);
  const a_k_h_g = B.associator(k, h, g);
  const a_h_g_f = B.associator(h, g, f);

  // Path 1: a_{k,h,g∘f} ∘ a_{k∘h,g,f}
  const path1 = B.vert(a_k_h_gf, a_kh_g_f);

  // Path 2: (id ⋄ a_{h,g,f}) ∘ a_{k,h∘g,f} ∘ (a_{k,h,g} ⋄ id)
  const stepL = whiskerLeft(B, a_k_h_g, f); // a_{k,h,g} ⋄ id_f
  const stepM = a_k_hg_f;
  const stepR = whiskerRight(B, k, a_h_g_f); // id_k ⋄ a_{h,g,f}
  const path2 = B.vert(B.vert(stepR, stepM), stepL);

  // Apply both 2-cells to left-associated composite and compare
  const p1 = path1(leftAssoc);
  const p2 = path2(leftAssoc);

  if (!eqPE(p1, p2)) {
    fails.push('Pentagon coherence failed');
  }

  return evidence('Bicategory.pentagon', samplesA.length, fails);
}

export function runTriangleLaw<P extends Kind2, A, B, C>(
  B: ReturnType<typeof makeProfunctorBicategory<P>>,
  cfg: {
    evalP: <X, Y>(p: Apply<P, [X, Y]>) => (x: X) => Y;
    eqC: Eq<C>;
    samplesA: A[];
    f: Apply<P, [A, B]>;
    g: Apply<P, [B, C]>;
  }
): LawEvidence {
  const { evalP, eqC, samplesA, f, g } = cfg;
  const fails: string[] = [];

  const eqPC = mkEqP<P, A, C>(evalP, eqC, samplesA);

  // Base composite: g ∘ f
  const gf = B.compose1(g, f);

  // Triangle: (ρ_g ⋄ id_f) ∘ α_{g,id,f} ∘ (id_g ⋄ λ_f) = id
  const id_mid = B.id1<any>();
  const alpha = B.associator(g, id_mid, f);
  const left = whiskerRight(B, g, B.leftUnitor(f)); // id_g ⋄ λ_f
  const right = whiskerLeft(B, B.rightUnitor(g), f); // ρ_g ⋄ id_f
  const lhs = B.vert(right, B.vert(alpha, left));
  const rhs = B.id2(gf);

  const l = lhs(gf);
  const r = rhs(gf);
  if (!eqPC(l, r)) {
    fails.push('Triangle coherence failed');
  }

  return evidence('Bicategory.triangle', samplesA.length, fails);
}

export function runBicategoryCoherenceLaws<P extends Kind2, A, B, C, D, E>(
  B: ReturnType<typeof makeProfunctorBicategory<P>>,
  cfg: {
    evalP: <X, Y>(p: Apply<P, [X, Y]>) => (x: X) => Y;
    eqC: Eq<C>;
    eqE: Eq<E>;
    samplesA: A[];
    f: Apply<P, [A, B]>;
    g: Apply<P, [B, C]>;
    h: Apply<P, [C, D]>;
    k: Apply<P, [D, E]>;
  }
) {
  return [
    runPentagonLaw<P, A, B, C, D, E>(B, cfg),
    runTriangleLaw<P, A, B, C>(B, cfg),
  ];
}


