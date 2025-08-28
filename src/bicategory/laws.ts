/**
 * Bicategory coherence laws (witness-level tests)
 *
 * Provides pentagon and triangle coherence checks for a bicategory constructed
 * via `makeProfunctorBicategory`. Tests are extensional: they evaluate 1-cells
 * on sample inputs using a provided evaluator.
 */

import { Kind2, Apply } from 'fp-hkt';
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
  return { 
    name, 
    samples, 
    failures: fails.length, 
    ...(fails.length > 0 ? { firstFailure: fails[0] } : {})
  };
}

export function mkEqP<P extends Kind2, A, B>(
  evalP: <X, Y>(p: Apply<P, [X, Y]>) => (x: X) => Y,
  eqB: Eq<B>,
  samples: A[]
): (p1: Apply<P, [A, B]>, p2: Apply<P, [A, B]>) => boolean {
  return (p1, p2) => {
    for (let i = 0; i < samples.length; i++) {
      const a = samples[i];
      if (a === undefined) continue;
      const b1 = evalP(p1)(a);
      const b2 = evalP(p2)(a);
      if (!eqB(b1, b2)) return false;
    }
    return true;
  };
}

// Whiskering helpers using horiz with identity 2-cells - all return NatP<P, A, E> for consistent endpoints
function whiskerLeft<P extends Kind2, A, B, E>(
  B: ReturnType<typeof makeProfunctorBicategory<P>>,
  beta: (p: Apply<P, [B, E]>) => Apply<P, [B, E]>,
  f: Apply<P, [A, B]>
): (p: Apply<P, [A, E]>) => Apply<P, [A, E]> {
  return B.horiz(beta, B.id2(f));
}

function whiskerRight<P extends Kind2, A, B, E>(
  B: ReturnType<typeof makeProfunctorBicategory<P>>,
  f: Apply<P, [B, E]>,
  alpha: (p: Apply<P, [A, B]>) => Apply<P, [A, B]>
): (p: Apply<P, [A, E]>) => Apply<P, [A, E]> {
  return B.horiz(B.id2(f), alpha);
}

// BEGIN PATCH: whisker middle leg
function whiskerMiddle<P extends Kind2, A, B, C, D>(
  B: ReturnType<typeof makeProfunctorBicategory<P>>,
  k: Apply<P, [C, D]>,
  alpha: (p: Apply<P, [A, C]>) => Apply<P, [A, C]>
): (p: Apply<P, [A, D]>) => Apply<P, [A, D]> {
  return B.horiz(B.id2(k), alpha);
}
// END PATCH

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

  // Build the base composite: ((k ∘ h) ∘ g) ∘ f
  const hg = B.compose1(h, g);
  const khg = B.compose1(k, hg);
  const fghk = B.compose1(khg, f);

  // Pentagon law: two ways to reassociate a 4-fold composition
  // Following monoidal pattern: Path 1: (α_{A,B,C} ⊗ id_D) ; α_{A,B⊗C,D} ; (id_A ⊗ α_{B,C,D})
  //                            Path 2: α_{A,B,C⊗D} ; α_{A⊗B,C,D}
  
  // Get associators - all have endpoints A→E for the 4-fold composition f∘g∘h∘k
  const gh = B.compose1(h, g);
  const fg = B.compose1(g, f);
  const hk = B.compose1(k, h);
  
  const assoc_ABC = B.associator(f, g, h);           // α_{A,B,C}: NatP<P, A, D>
  const assoc_A_BC_D = B.associator(f, gh, k);      // α_{A,B⊗C,D}: NatP<P, A, E>  
  const assoc_BCD = B.associator(g, h, k);          // α_{B,C,D}: NatP<P, B, E>
  const assoc_AB_C_D = B.associator(fg, h, k);      // α_{A⊗B,C,D}: NatP<P, A, E>
  const assoc_A_B_CD = B.associator(f, g, hk);      // α_{A,B,C⊗D}: NatP<P, A, E>

  // Path 1: (α_{A,B,C} ⊗ id_D) ; α_{A,B⊗C,D} ; (id_A ⊗ α_{B,C,D})
  // Step 1: α_{A,B,C} ⊗ id_D - whisk α_{A,B,C} with id_D to get NatP<P, A, E>
  const step1_1 = whiskerRight(B, k, assoc_ABC);    // NatP<P, A, E>
  
  // Step 2: compose with α_{A,B⊗C,D} - both have endpoints A→E
  const step1_2 = B.vert(assoc_A_BC_D, step1_1);   // NatP<P, A, E>
  
  // Step 3: id_A ⊗ α_{B,C,D} - whisk id_A with α_{B,C,D} to get NatP<P, A, E>
  const step1_3 = whiskerLeft(B, assoc_BCD, f);     // NatP<P, A, E>
  
  // Final path 1 composition - both have endpoints A→E
  const path1 = B.vert(step1_3, step1_2);           // NatP<P, A, E>

  // Path 2: α_{A,B,C⊗D} ; α_{A⊗B,C,D} - both have endpoints A→E
  const path2 = B.vert(assoc_AB_C_D, assoc_A_B_CD);  // NatP<P, A, E>

  // Apply both paths to the base composite and compare
  const p1 = path1(fghk);
  const p2 = path2(fghk);

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

  // Triangle law: (id_f ⊗ λ_g) ; α_{f,1,g} = ρ_f ⊗ id_g
  // Where λ is left unitor, ρ is right unitor, α is associator
  
  // Get unitors and associator
  const leftUnitor_g = B.leftUnitor(g);    // λ_g: 1⊗g → g  
  const rightUnitor_f = B.rightUnitor(f);  // ρ_f: f⊗1 → f
  const associator_f_1_g = B.associator(f, B.id1(), g); // α_{f,1,g}: f⊗(1⊗g) → (f⊗1)⊗g

  // Path 1: (id_f ⊗ λ_g) ; α_{f,1,g}
  const step1 = whiskerLeft(B, leftUnitor_g, f);     // id_f ⊗ λ_g
  const path1 = B.vert(associator_f_1_g, step1);     // ; α_{f,1,g}

  // Path 2: ρ_f ⊗ id_g  
  const path2 = whiskerRight(B, g, rightUnitor_f);   // ρ_f ⊗ id_g

  // Apply both paths to the base composite and compare
  const l = path1(gf);
  const r = path2(gf);
  
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


