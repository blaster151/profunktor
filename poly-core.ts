// poly-core.ts
// Families X : I -> Set as { [i in I]: readonly any[] }
export type Family<I extends string> = Record<I, ReadonlyArray<unknown>>

// A polynomial P = (s: E->I, p: E->B, t: B->I) of finite type
export interface Polynomial<I extends string> {
  I: readonly I[]
  B: ReadonlyArray<{ id: number; cod: I }>
  E: ReadonlyArray<{ id: number; src: I; over: number /*b.id*/ }>
  // helpers for fast lookups
  fibreE: (b: number) => ReadonlyArray<{ id: number; src: I; over: number }>
  codB: (b: number) => I
  srcE: (e: number) => I
}

// Evaluate P on a family X : Set/I -> Set/I
//  P(X)_i  =  Σ_{b∈B_i}  Π_{e∈E_b}  X_{s(e)}
export function evalPoly<I extends string>(P: Polynomial<I>, X: Family<I>): Family<I> {
  const out: Partial<Family<I>> = {}
  for (const i of P.I) {
    const Bi = P.B.filter(b => P.codB(b.id) === i)
    const pieces: unknown[] = []
    for (const b of Bi) {
      const Eb = P.fibreE(b.id)
      // dependent product over the fibre
      const choices = Eb.map(e => X[P.srcE(e.id)])
      // Π -> plain cartesian product (finite)
      const prod: unknown[][] = choices.reduce<unknown[][]>(
        (acc, xs) => acc.flatMap(t => xs.map(x => [...t, x])), [[]]
      )
      for (const tuple of prod) pieces.push({ b: b.id, args: tuple })
    }
    ;(out as any)[i] = pieces
  }
  return out as Family<I>
}

// Composition PQ: polynomial whose extension is evalPoly(P)∘evalPoly(Q).
// We expose a *constructor* that computes the extension-level composite;
// a genuine P∘Q data triple can be added later.
export function composeExt<I extends string>(
  P: Polynomial<I>, Q: Polynomial<I>
): (X: Family<I>) => Family<I> {
  return (X) => evalPoly(P, evalPoly(Q, X))
}

// Cartesian natural transformation between P and P' (same I)
// Encoded by a commuting square of diagrams with the middle square a pullback.
export interface CartesianNat<I extends string> {
  // maps on B and E levels (componentwise), with shape-preserving guarantees
  mapB: (b: { id: number; cod: I }) => { id: number; cod: I }
  mapE: (e: { id: number; src: I; over: number }) => { id: number; src: I; over: number }
  // witness that the E-square is a pullback (oracle-boolean for now)
  isPullback: boolean
}

export function isCartesianNat(_from: Polynomial<any>, _to: Polynomial<any>, nat: CartesianNat<any>): boolean {
  return nat.isPullback
}
