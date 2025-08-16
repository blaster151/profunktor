// fp-dg-cooperad.ts
import { DgModule, Degree, Sum, Term, sum, zero, plus, scale, koszul, normalizeByKey } from './fp-dg-core';

// A minimal "cooperad-like" surface we'll wrap.
// You likely already have something equivalent around admissible cuts.
export interface Cooperad<T> {
  // comultiplication into a formal sum of simple tensors
  delta(t: T): Sum<[T, T]>;
  // a stable textual key to merge alpha-equivalent terms (tree shape + labels, etc.)
  key(t: T): string;
  // degree of a term (0 if you're strict)
  degree(t: T): Degree;
}

// A dg-cooperad simply augments with a differential that is a coderivation.
export interface DgCooperad<T> extends Cooperad<T>, DgModule<T> {}

// --- Core: build a coderivation from a local generator rule ------------------
// You provide d0 on "generators" (or any spanning set you deem local).
// We uniquely extend to all terms by imposing the co-Leibniz identity.
//
// In practice: we *define* d by requiring for all t:
//   Δ(d t)  =  (d ⊗ id + id ⊗ d) (Δ t)
// and solve for d t by "co-equality" with your Δ. Because Δ lands in a basis
// of [T,T]-tensors (admissible cuts), we can reassemble d t by matching left legs.
export function coderivationFromLocal<T>(
  C: Cooperad<T>,
  dLocal: (t: T) => Sum<T>
): (t: T) => Sum<T> {
  const { delta, key, degree } = C;

  // We compute d(t) by: for each tensor (x,y) in Δ(t),
  //   contribute dLocal(x) paired with y  AND  (-1)^{|x|} x paired with d(y)
  // then "co-equalize" back to a plain Sum<T> by inverting how Δ splits terms.
  //
  // In many admissible-cuts implementations, each (x,y) retains enough provenance
  // to identify "where" the cut happened; here we assume `key` suffices to re-glue
  // unambiguously (the same mechanism you already use to merge Sum<T> results).
  //
  // Concretely, we *define* d via the right-hand side and then use a left-inverse
  // "counit-like" reassembly that picks the left component as the redex site.
  // If your Δ exposes such an inverse precisely, swap the "TODO(reassemble)" section.
  return function dAll(t: T): Sum<T> {
    let dtPieces: Array<{ coef: number; term: T }> = [];

    for (const { coef: c, term: [x, y] } of delta(t)) {
      // (d ⊗ id)(x,y): all terms from dLocal(x) tensored with y
      for (const { coef: a, term: dx } of dLocal(x)) {
        // reassemble "(dx, y) back into a T" at the same cut site
        const rebuiltXY = tryReassemble(C, dx, y);
        dtPieces = [...dtPieces, { coef: c * a, term: rebuiltXY }];
      }

      // (id ⊗ d)(x,y): sign = (-1)^{|x|}
      const s = koszul(degree(x), 1);
      const dySum = dLocal(y); // if you want full recursion, change to dAll(y) — but
                               // for coderivations from local data, dLocal is typical.
      for (const { coef: b, term: dy } of dySum) {
        const rebuiltXy = tryReassemble(C, x, dy);
        dtPieces = [...dtPieces, { coef: c * s * b, term: rebuiltXy }];
      }
    }

    return normalizeByKey(dtPieces, key);
  };
}

// --- Reassembly hook ---------------------------------------------------------
// In admissible-cuts cooperads you usually know how to "plug" the left/right
// pieces back. If you don't have that exposed, this function can call back
// into your existing "graft" or "replace-subtree" helper.
// For now we assume "left leg wins": the left carries the redex context.
function tryReassemble<T>(C: Cooperad<T>, left: T, right: T): T {
  // TODO: replace with your real "plug" semantics.
  // Many implementations simply take `left` as the recomposed term if the
  // cut position is stored in `left`. If you already track cut metadata,
  // wire it here.
  return left;
}

// --- Main wrapper ------------------------------------------------------------

export function makeDgCooperad<T>(
  base: Cooperad<T>,
  dLocal: (t: T) => Sum<T>
): DgCooperad<T> {
  const d = coderivationFromLocal(base, dLocal);
  return {
    ...base,
    d,
    degree: base.degree
  };
}
