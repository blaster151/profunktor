// Build model data on S(Pre(D)) by D-objectwise W,fib; cofibs = cof(L_K(ID_δ))
// then push generators through sheafification to S(E).
import { leftKanViaChase, type FinitePresentation, type ChaseOptions } from "../../kan/chase-lkan";

export interface GenArrow<X> { map: X; domainSmall: boolean }

export interface DiagramOps<X> {
  leftKanExtendDiscrete: (g: GenArrow<X>) => GenArrow<X>; // LK(ID_δ)(g)
  leftKanExtendDiscreteFast?: (fp: FinitePresentation, opts?: ChaseOptions) => (g: GenArrow<X>) => GenArrow<X>;
}

export function generatorsOnPresheaves<X>(
  I_set: readonly GenArrow<X>[],
  ops: DiagramOps<X>
): readonly GenArrow<X>[] {
  // Usage note: when leftKanExtendDiscreteFast is provided, call it to produce a function (g) => LK(g) 
  // and use that inside generatorsOnPresheaves(...).
  return I_set.map(ops.leftKanExtendDiscrete);
}

export function sheafifyGenerators<X>(
  K_presheaf: readonly GenArrow<X>[],
  sheafify: (x: X) => X
): readonly GenArrow<X>[] {
  return K_presheaf.map(g => ({ map: sheafify(g.map), domainSmall: g.domainSmall }));
}
