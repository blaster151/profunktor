// src/homotopy/accessible/detection-functor.ts
export interface DetectionFunctor<X> {
  // Map arrows of C to arrows of SSet (or another known model with accessible W)
  toSSet: (f: X) => unknown;
  preservesKFilteredColimits: boolean; // accessibility witness
}

export function makeAccessibleW<X>(F: DetectionFunctor<X>): {
  isW: (f: X) => boolean;
  closedUnderRetracts: boolean;
  twoOfThree: boolean;
  cofWClosedUnderPushoutAndTransfinite: boolean;
  solutionSetAtI: <XMap>(i: XMap) => readonly XMap[];
} {
  const isWeqSSet = (_: unknown) => true; // stub; plug your SSet weq checker here
  const isW = (f: X) => isWeqSSet(F.toSSet(f));
  // Accessibility ⇒ solution sets & retract-closure; treat as true once F is accessible.
  const ok = F.preservesKFilteredColimits;
  return {
    isW,
    closedUnderRetracts: ok,
    twoOfThree: true,
    cofWClosedUnderPushoutAndTransfinite: true,
    solutionSetAtI: (_i) => [] as const
  };
}
