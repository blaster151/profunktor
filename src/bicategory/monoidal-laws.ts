/**
 * Monoidal coherence laws for bicategories (witness-level)
 *
 * Tests the monoidal pentagon and triangle using provided tensor associator
 * and unit witnesses, plus `tensor1` from a monoidal bicategory instance.
 * Extensional comparisons use an evaluator `evalP` and sample inputs.
 */

import { Kind2, Apply } from '../../fp-hkt';

export interface LawEvidence {
  readonly name: string;
  readonly samples: number;
  readonly failures: number;
  readonly firstFailure?: string;
}

export type Eq<A> = (x: A, y: A) => boolean;

function evidence(name: string, samples: number, fails: Array<string>): LawEvidence {
  return { name, samples, failures: fails.length, firstFailure: fails[0] };
}

export function runMonoidalPentagon<P extends Kind2, A, B, C, D>(
  M: {
    compose1: <X, Y, Z>(g: Apply<P, [Y, Z]>, f: Apply<P, [X, Y]>) => Apply<P, [X, Z]>;
    tensor1: <X1, Y1, X2, Y2>(
      f: Apply<P, [X1, Y1]>,
      g: Apply<P, [X2, Y2]>
    ) => Apply<P, [[X1, X2], [Y1, Y2]]>;
    id1: <X>() => Apply<P, [X, X]>;
  },
  cfg: {
    evalP: <X, Y>(p: Apply<P, [X, Y]>) => (x: X) => Y;
    eq: Eq<[[[A, B], C], D]> | Eq<[A, [B, [C, D]]]> | Eq<any>;
    samples: [[[A, B], C], D][];
    assoc: {
      abc: Apply<P, [[[A, B], C], [A, [B, C]]]>;
      bcd: Apply<P, [[[B, C], D], [B, [C, D]]]>;
      a_bc_d: Apply<P, [[A, [B, C]], [A, [B, [C, D]]]]>;
      ab_cd: Apply<P, [[ [A, B], [C, D] ], [A, [B, [C, D]]]]>;
    };
  }
): LawEvidence {
  const { evalP, eq, samples, assoc } = cfg as any;
  const fails: string[] = [];

  // Paths from ((((A⊗B)⊗C)⊗D)) to A⊗(B⊗(C⊗D))
  // Path 1: (assoc_{A,B,C} ⊗ id_D) ; assoc_{A, B⊗C, D} ; (id_A ⊗ assoc_{B,C,D})
  const assoc_abc_idD = M.tensor1(assoc.abc as any, M.id1<D>() as any);
  const step1 = M.compose1(assoc_abc_idD as any, M.id1<[[[A, B], C], D]>() as any);
  const step2 = M.compose1(assoc.a_bc_d as any, step1 as any);
  const path1 = M.compose1(M.tensor1(M.id1<A>() as any, assoc.bcd as any) as any, step2 as any);

  // Path 2: assoc_{A,B,C⊗D} ; assoc_{A⊗B,C,D}
  const path2 = M.compose1(assoc.ab_cd as any, assoc.abc as any);

  const p1 = evalP(path1 as any);
  const p2 = evalP(path2 as any);

  for (let i = 0; i < samples.length; i++) {
    const x = samples[i];
    const y1 = p1(x);
    const y2 = p2(x);
    if (!(eq as any)(y1, y2)) {
      fails.push(`Pentagon failed on sample ${i}`);
      break;
    }
  }

  return evidence('Monoidal.pentagon', samples.length, fails);
}

export function runMonoidalTriangle<P extends Kind2, A, B>(
  M: {
    compose1: <X, Y, Z>(g: Apply<P, [Y, Z]>, f: Apply<P, [X, Y]>) => Apply<P, [X, Z]>;
    tensor1: <X1, Y1, X2, Y2>(
      f: Apply<P, [X1, Y1]>,
      g: Apply<P, [X2, Y2]>
    ) => Apply<P, [[X1, X2], [Y1, Y2]]>;
    id1: <X>() => Apply<P, [X, X]>;
  },
  cfg: {
    evalP: <X, Y>(p: Apply<P, [X, Y]>) => (x: X) => Y;
    eq: Eq<[A, B]> | Eq<any>;
    samples: [A, B][];
    unit: {
      l: Apply<P, [[[unknown, A]], [A]]> | Apply<P, [[unknown, A], A]>;
      r: Apply<P, [[[A, unknown]], [A]]> | Apply<P, [[A, unknown], A]>;
    };
    assoc_ab_I: Apply<P, [[[A, B], unknown], [A, [B, unknown]]]>;
  }
): LawEvidence {
  const { evalP, eq, samples, unit, assoc_ab_I } = cfg as any;
  const fails: string[] = [];

  // Triangle: (id_A ⊗ l_B) ; assoc_{A, I, B} = r_A ⊗ id_B
  const left = M.compose1(
    assoc_ab_I as any,
    M.tensor1(M.id1<A>() as any, unit.l as any) as any
  );
  const right = M.tensor1(unit.r as any, M.id1<B>() as any);

  const l = evalP(left as any);
  const r = evalP(right as any);

  for (let i = 0; i < samples.length; i++) {
    const x = samples[i];
    const y1 = l(x);
    const y2 = r(x);
    if (!(eq as any)(y1, y2)) {
      fails.push(`Triangle failed on sample ${i}`);
      break;
    }
  }

  return evidence('Monoidal.triangle', samples.length, fails);
}

// ================================================================================
// CoherenceKit convenience API
// ================================================================================

export type CoherenceKitSum = {
  assoc: {
    abc: any;
    bcd: any;
    a_bc_d: any;
    ab_cd: any;
  };
  unit: {
    l: any;
    r: any;
  };
};

// Keep existing runMonoidalPentagon signature...
// Keep existing runMonoidalTriangle signature...

// Add optional "kit" convenience wrappers:
export function runPentagonWithKit<P extends Kind2, A, B, C, D>(
  M: {
    compose1: <X, Y, Z>(g: Apply<P, [Y, Z]>, f: Apply<P, [X, Y]>) => Apply<P, [X, Z]>;
    tensor1: <X1, Y1, X2, Y2>(
      f: Apply<P, [X1, Y1]>,
      g: Apply<P, [X2, Y2]>
    ) => Apply<P, [[X1, X2], [Y1, Y2]]>;
    id1: <X>() => Apply<P, [X, X]>;
  },
  env: {
    evalP: <X,Y>(p: any) => any;
    eq: (x: any, y: any) => boolean;
    samples: any[];
    kit: CoherenceKitSum;
  }
) {
  return runMonoidalPentagon(M, {
    evalP: env.evalP,
    eq: env.eq,
    samples: env.samples,
    assoc: env.kit.assoc,
  });
}

export function runTriangleWithKit<P extends Kind2, A, B>(
  M: {
    compose1: <X, Y, Z>(g: Apply<P, [Y, Z]>, f: Apply<P, [X, Y]>) => Apply<P, [X, Z]>;
    tensor1: <X1, Y1, X2, Y2>(
      f: Apply<P, [X1, Y1]>,
      g: Apply<P, [X2, Y2]>
    ) => Apply<P, [[X1, X2], [Y1, Y2]]>;
    id1: <X>() => Apply<P, [X, X]>;
  },
  env: {
    evalP: <X,Y>(p: any) => any;
    eq: (x: any, y: any) => boolean;
    samplesLeft: any[];
    samplesRight: any[];
    kit: CoherenceKitSum;
  }
) {
  return runMonoidalTriangle(M, {
    evalP: env.evalP,
    eq: env.eq,
    samples: env.samplesLeft, // Using samplesLeft for the triangle test
    unit: env.kit.unit,
    assoc_ab_I: env.kit.assoc.abc, // Use ABC associator as the AB_I associator
  });
}


