// fp-optics-fib-vertcart.ts
// Minimal, operational surface for cloven fibrations and their vertical–cartesian (VC) factorization.
// Matches pp. 4–6: cloven fibrations (fixed cartesian lifts), VC factorization system, pullback law,
// and dualization via VC spans. We keep it tiny and *inside optics* to avoid duplicating your Groth files.

export type Obj = unknown;
export type Arr = unknown;

// A cloven fibration exposes reindexing and chosen cartesian lifts.
export interface ClovenFibration<BObj = Obj, BArr = Arr, EObj = Obj, EArr = Arr> {
  // Base category ops (opaque to us).
  base: {
    id: (x: BObj) => BArr;
    comp: (g: BArr, f: BArr) => BArr;
  };

  // Reindexing along base arrows on objects & vertical morphisms.
  reindexObj: (f: BArr, D: EObj) => EObj;
  reindexMor: (f: BArr, h: EArr) => EArr;

  // Chosen cartesian lift of f at D′ in the fiber over cod(f).
  cartesianLift: (f: BArr, Dprime: EObj) => { lift: EArr; dom: EObj; cod: EObj };

  // Vertical–cartesian factorization data for an E–arrow:
  // factor(e) = v; c with v vertical (projects to iso) and c cartesian.
  factorVC: (e: EArr) => { v: EArr; c: EArr };

  // Pull back vertical against cartesian (Prop. 2.7) to compose VC spans.
  // Given v: X→X′ vertical and c: Y→Y′ cartesian with a cospan X′ ←?→ Y,
  // return the pullback square with induced vertical/cartesian legs.
  pullbackVertAgainstCart: (v: EArr, c: EArr) => {
    pbObj: EObj;
    v1: EArr; // vertical
    c1: EArr; // cartesian
  };

  // Predicates for sanity checks (purely advisory).
  isVertical?: (e: EArr) => boolean;
  isCartesian?: (e: EArr) => boolean;
}

// VC-span morphisms used by the dual (fiberwise opposite).
export interface VCMor<EArr = Arr> {
  v: EArr; // vertical
  c: EArr; // cartesian
}

// Compose VC morphisms via the pullback law (Prop. 2.7): (v2; c2) ∘ (v1; c1)
export function composeVC<F extends ClovenFibration<any, any, any, any>>(
  FIB: F, m2: VCMor<Parameters<F["factorVC"]>[0]>, m1: VCMor<Parameters<F["factorVC"]>[0]>
): VCMor<Parameters<F["factorVC"]>[0]> {
  // pull back v2 against c1, then paste:
  const { v1: vPB, c1: cPB } = FIB.pullbackVertAgainstCart(m2.v, m1.c);
  // new vertical = vPB ∘ m1.v   (still vertical)
  // new cartesian = m2.c ∘ cPB  (still cartesian)
  const vNew = (FIB as any).composeE?.(vPB, m1.v) ?? ({} as any);
  const cNew = (FIB as any).composeE?.(m2.c, cPB) ?? ({} as any);
  return { v: vNew, c: cNew };
}

// Dual (fiberwise opposite) of a cloven fibration: same objects, arrows are VC spans (up to iso).
export function dualOf<F extends ClovenFibration>(FIB: F) {
  return {
    base: FIB.base,
    // In the dual, "cartesian" means: class of VC spans with cartesian right leg.
    vc: { compose: (m2: VCMor, m1: VCMor) => composeVC(FIB, m2, m1) }
  };
}
