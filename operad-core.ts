// operad-core.ts
export type Colour<I extends string> = I
export type Op<I extends string> = { out: I; arity: number; in: I[] } // arity=|in|

// An I-coloured symmetric operad (shape-level; equivariance deferred)
export interface ColouredOperad<I extends string> {
  colours: readonly I[]
  ops: ReadonlyArray<Op<I>>
  // Substitution: plug g_j into the j-th input of f. Total (returns a new op shape).
  subst: (f: Op<I>, gs: ReadonlyArray<Op<I>>) => Op<I>
  unit: (i: I) => Op<I> // identity op at colour i (arity 1, in=[i], out=i)
}

// From your earlier "nerve" shape: build a minimal operad interface
export function makeOperadFromPolynomialMonadShape<I extends string>(
  colours: readonly I[],
  // one primitive op per b∈B with arity |E_b| and output colour codB(b)
  primitive: ReadonlyArray<Op<I>>
): ColouredOperad<I> {
  return {
    colours,
    ops: primitive,
    subst: (f, gs) => ({
      out: f.out,
      // concatenated inputs with colours from each g in order
      in: f.in.flatMap((_, j) => gs[j]?.in ?? []),
      arity: f.in.reduce((n, _ , j) => n + (gs[j]?.arity ?? 0), 0),
    }),
    unit: (i) => ({ out: i, in: [i], arity: 1 })
  }
}
