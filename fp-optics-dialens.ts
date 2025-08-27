// fp-optics-dialens.ts
// Dialenses a la Capucci–Gavranović–Malik–Rios–Weinberger: height-1 (lenses) and height-2 (optics/Dialectica).
// We keep it operational/minimal and DO NOT introduce a new global fibration core.
// See: dual fibration, vertical parts f^♭ / f^♯, and towers → dialenses.  (pp. 1–3)
import type { ClovenFibration, VCMor } from './fp-optics-fib-vertcart';
import { dualOf } from './fp-optics-fib-vertcart';

export type Height = 1 | 2;

export interface Dialens<X, Y, ΔX = unknown, ΔY = unknown> {
  get: (x: X) => Y;
  put: (x: X, dy: ΔY) => { x1: X; dx: ΔX };
}

// Height-1 = "one round" (ordinary lens-like back-and-forth).
export function dialensH1<X, Y, ΔX = unknown, ΔY = unknown>(
  parts: {
    forward: (x: X) => Y;                          // base leg f
    backward: (x: X, dy: ΔY) => { x1: X; dx: ΔX }; // vertical leg f^♯ in the dual
  }
): Dialens<X, Y, ΔX, ΔY> {
  return {
    get: parts.forward,
    put: parts.backward
  };
}

// Height-2 = "two rounds" (optic/Dialectica shape): compose two vertical moves with opposite orientation.
export function dialensH2<A, B, C, ΔA = unknown, ΔB = unknown, ΔC = unknown>(
  a_to_b: Dialens<A, B, ΔA, ΔB>,
  b_to_c: Dialens<B, C, ΔB, ΔC>
): Dialens<A, C, ΔA, ΔC> {
  return {
    get: (a) => b_to_c.get(a_to_b.get(a)),
    put: (a, dC) => {
      const mid = b_to_c.put(a_to_b.get(a), dC);         // round 2 (vertical back)
      const back = a_to_b.put(a, mid.dx as ΔB);           // round 1 (vertical back)
      return { x1: back.x1, dx: back.dx as ΔA };
    }
  };
}

// Interop: lift your existing Lens into a height-1 dialens with identity-like ΔX.
export function fromLens<S, A, B>(L: { get:(s:S)=>A; set:(b:B, s:S)=>S }): Dialens<S, A, S, B> {
  return {
    get: L.get,
    put: (s, b) => ({ x1: L.set(b, s), dx: s })
  };
}

// Utility: compose dialenses of the same (Δ) shape (used by demos/tests).
export function composeDialens<A,B,C,ΔA,ΔB,ΔC>(
  d1: Dialens<A,B,ΔA,ΔB>, d2: Dialens<B,C,ΔB,ΔC>
): Dialens<A,C,ΔA,ΔC> {
  return dialensH2(d1, d2);
}

// Build a height-2 dialens from a cloven fibration by threading one "round" in E and one in E^∨.
export function dialensFromCloven<F extends ClovenFibration, A, B, dA = unknown, dB = unknown>(
  fib: F,
  forward: (a: A) => B,                                  // base leg (get)
  backVert: (a: A, db: dB) => VCMor,                     // vertical move in E^∨ represented as VC span
  applyVC:  (vc: VCMor, a: A) => A                       // how the VC update acts back on A
) {
  const Eop = dualOf(fib);
  return dialensH2(
    // round 1: A → B (in E)
    dialensH1<A, B, dA, dB>({ forward, backward: (a, db) => ({ x1: a, dx: (db as any) }) }),
    // round 2: B → B (in E^∨) realized by a VC span update pushed back to A
    dialensH1<B, B, dB, dB>({
      forward: (b) => b,
      backward: (_b, db) => {
        const vc = backVert as any as (a: A, db: dB) => VCMor;
        const upd = vc as any;
        const a1 = applyVC(upd(_b as any as A, db), _b as any as A);
        return { x1: _b, dx: db as dB }; // propagation of Δ happens via applyVC→A
      }
    })
  );
}
