// src/optics/fibration.ts
// Paper hook: a "tower" is a base category B with fibrations stacked above it.
// We only model what we need to compose optics now. (Capucci et al., 2024)
export interface Fibration<BObj, BMor, FibObj, FibMor> {
  base: {
    id: (b: BObj) => BMor;
    comp: (g: BMor, f: BMor) => BMor;
  };
  // Reindex along a base arrow: pull a fibered object/morphism back.
  reindexObj: (f: BMor, x: FibObj) => FibObj;
  reindexMor: (f: BMor, h: FibMor) => FibMor;
}

// Opposite-twist (used in the paper's iterative "twist each component via op").
export function opFibration<BObj, BMor, FibObj, FibMor>(
  p: Fibration<BObj, BMor, FibObj, FibMor>
): Fibration<BObj, BMor, FibObj, FibMor> {
  return {
    base: p.base,
    reindexObj: (f, x) => p.reindexObj(f, x),
    reindexMor: (f, h) => p.reindexMor(f, h),
  };
}

// A generic "dialens" (optic) in a fibration: get along one leg, put back along the twisted leg.
export interface Dialens<X, Y, ΔX, ΔY> {
  get: (x: X) => Y;
  put: (x: X, deltaY: ΔY) => { x1: X; deltaX: ΔX };
}

export function composeDialens<X, Y, Z, ΔX, ΔY, ΔZ>(
  o1: Dialens<X, Y, ΔX, ΔY>,
  o2: Dialens<Y, Z, ΔY, ΔZ>
): Dialens<X, Z, ΔX, ΔZ> {
  return {
    get: (x) => o2.get(o1.get(x)),
    put: (x, dZ) => {
      const mid = o2.put(o1.get(x), dZ);
      const back = o1.put(x, mid.deltaY);
      return { x1: back.x1, deltaX: back.deltaX };
    }
  };
}
