// Effects handlers: migrate a ?-coalgebra to an @-coalgebra.  :contentReference[oaicite:3]{index=3}
import type { Polynomial, Coalgebra } from "./polynomial";

/**
 * A handler translating positions u∈?(1) to positions v∈@(1),
 * together with a "pullback on directions" v-dir ↦ u-dir used to feed the original continuation.
 */
export interface Handler {
  from: Polynomial;
  to: Polynomial;
  translate: (u: string) => { v: string; pull: (d_to: string) => string };
}

/** Migrate a ?-coalgebra along a handler into an @-coalgebra on the *same* state set. */
export function migrateCoalgebra<S>(C: Coalgebra<S>, H: Handler): Coalgebra<S> {
  if (C.poly !== H.from) throw new Error("handler.from must match coalgebra polynomial");
  const to = H.to;
  return {
    poly: to,
    step: (s: S) => {
      const { pos: u, cont: kQ } = C.step(s);
      const { v, pull } = H.translate(u);
      return {
        pos: v,
        cont: (d_to: string) => kQ(pull(d_to))
      };
    }
  };
}
