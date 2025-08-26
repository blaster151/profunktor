// src/homotopy/model/monos-as-cofibrations.ts
export interface StrongGenerator { /* opaque handle for a strong generator */ }
export interface MonoOps<X> {
  isMono(f: X): boolean;
  regularQuotientsOf(G: StrongGenerator): readonly unknown[]; // Q in the proof
  subobjectsOf(Q: unknown): readonly X[];                      // all subobjects → members of I
  transfiniteClosureIsMono: boolean;                           // (iii)
  effectiveUnions: boolean;                                    // (ii)
}

export function generateIFromMonos<X>(
  presentable: { hasAllLimits: boolean; hasAllColimits: boolean; hasFilteredColimits: boolean; hasSmallGenerators: boolean; },
  G: readonly StrongGenerator[],
  ops: MonoOps<X>
): readonly X[] {
  if (!(presentable.hasAllLimits && presentable.hasAllColimits && presentable.hasFilteredColimits && presentable.hasSmallGenerators))
    throw new Error("Need locally presentable.");
  if (!(ops.effectiveUnions && ops.transfiniteClosureIsMono))
    throw new Error("Need effective unions + transfinite closure of monos.");
  const I: X[] = [];
  for (const g of G) {
    for (const Q of ops.regularQuotientsOf(g))
      for (const m of ops.subobjectsOf(Q)) if (ops.isMono(m)) I.push(m);
  }
  return I;
}
