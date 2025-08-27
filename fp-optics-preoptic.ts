// fp-optics-preoptic.ts
// Preoptics (no quotient): residual M from a strict monoidal action. Good for fibrational manipulation.

export interface StrictAction<M,A> {
  // left action • : M × A → A  (we only need an evaluator for code-level demos)
  act: (m: M, a: A) => A;
  unit: M;                          // I
  tensor: (m: M, n: M) => M;        // ⊗
}

export interface Preoptic<M,A,B,S,T> {
  residual: M;
  view:  (a: A) => S;               // f : A → M • S   (we inline residual when calling)
  up:    (m: M, t: T) => B;         // f♯: M ◦ T → B
}

// A tiny bridge: pick a residual policy to turn a Preoptic into a height-1 dialens.
import type { Dialens } from './fp-optics-dialens';
export function toDialens<M,A,B,S,T>(
  P: Preoptic<M,A,B,S,T>, actS: StrictAction<M,S>
): Dialens<A,B,{snap?:S},{patch?:T}> {
  return {
    get: (a) => P.up(actS.unit, (undefined as unknown as T)), // optional: no-op update path
    put: (a, dB) => {
      // record a patch on T and apply via residual M kept inside P
      const nextB = dB?.patch !== undefined ? P.up(P.residual, dB.patch) : P.up(P.residual, (undefined as any));
      return { x1: a as any, dx: { snap: P.view(a) } as any, }; // keep it conservative
    }
  };
}
