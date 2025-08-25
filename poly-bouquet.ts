// poly-bouquet.ts
import type { Polynomial } from "./poly-core"

// I-coloured bouquet of arity k (Def. 6.6): J <-s- {1..k} -p-> {1} -t-> I
export function bouquet<I extends string>(Iset: readonly I[], k: number, cod: I): Polynomial<I> {
  const B = [{ id: 0, cod }]
  const E = Array.from({ length: k }, (_, i) => ({ id: i, src: Iset[i % Iset.length], over: 0 }))
  const fib = (b: number) => E.filter(e => e.over === b)
  const codB = (b: number) => B.find(x => x.id === b)!.cod
  const srcE = (e: number) => E.find(x => x.id === e)!.src
  return { I: Iset, B, E, fibreE: fib, codB, srcE }
}
