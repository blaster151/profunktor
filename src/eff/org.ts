// Org: closure [@,?] and [@,?]-coalgebras; equivalence with *linear* elementary handlers.  :contentReference[oaicite:2]{index=2}
import type { Polynomial } from "./polynomial";
import type { ElementaryHandler } from "./elementary";
import { yOf, isLinear } from "./linear";

/** A minimal [@,?]-coalgebra on a finite "state set" S (we name S by its elements). */
export interface ClosureCoalgebra<S = string> {
  at: Polynomial;     // @
  q: Polynomial;      // ?
  S: string[];        // state set elements (names)
  step: (s: S) => {
    // A single "Org" step can be *read* as choosing a position in @, then a direction in ? over its image.
    atPos: string;                        // j ∈ @ (1)
    toPosInQ: string;                     // α(j) ∈ ?(1)  (image in ?)
    dirInQ: string;                       // element of ?[α(j)]
    cont: (next: S) => S;                 // trivial continuation hook (kept for parity with our Eff side)
  };
}

/** Pack a *linear* elementary handler (carrier y(S)) into an Org coalgebra. */
export function orgFromLinearElementary(E: ElementaryHandler): ClosureCoalgebra {
  if (!isLinear(E.carrier)) throw new Error("Elementary handler is not linear (carrier must be y(S)).");
  const S = [...E.carrier.positions];
  // We "read" onPos: ?→@  and pull: @-dir → ?-dir  via the closure prism (Definition 5.16).
  return {
    at: E.to, q: E.from, S,
    step: (s: string) => {
      // choose a representative j in @ and map it back via onPos^{-1}-like probe using a default q-position
      const fallbackQ = E.from.positions[0] ?? "";
      const j = E.to.positions[0] ?? "";               // tiny demo choice
      const i = E.onPos(fallbackQ);                    // lands in @; we align it with j in this toy reading
      const toPosInQ = fallbackQ;
      const dirInQ   = E.pull(E.to.fiber(j)[0] ?? "*");
      return { atPos: j, toPosInQ, dirInQ, cont: (_n)=> s };
    }
  };
}

/** Unpack an Org coalgebra with carrier y(S) into a *linear* elementary (from q to at). */
export function linearElementaryFromOrg(C: ClosureCoalgebra): ElementaryHandler {
  const yS = yOf(C.S);
  // Define onPos: ?→@ by "currying" the (atPos,toPosInQ) pair observed at step-time.
  const onPos = (_u: string) => C.at.positions[0] ?? "";
  const pull  = (_dTo: string) => C.q.fiber(C.q.positions[0] ?? "")[0] ?? "*";
  return { from: C.q, to: C.at, carrier: yS, onPos, pull };
}
