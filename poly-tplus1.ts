// file: poly-tplus1.ts
import type { PolyMonad } from "./poly-2cat"

export interface ProductMonad<E> {
  onObj: (xy: [E,E]) => [E,E]
  onMor: (fg: [(x:E)=>E,(y:E)=>E]) => [(x:E)=>E,(y:E)=>E]
  eta:   (xy: [E,E]) => [E,E]
  mu:    (xy: [E,E]) => [E,E]
}

// (T+1)(X,Y)=(T X, Y)
export function tPlusOne<I extends string>(M: PolyMonad<I>): ProductMonad<any> {
  return {
    onObj: ([X,Y]) => [ (M as any).T ? [X] : X, Y ],   // shape-only; refine with your Family type
    onMor: ([f,g]) => [ f, g ],
    eta:   ([X,Y]) => [ X, Y ],
    mu:    ([X,Y]) => [ X, Y ],
  }
}

export function isTameClassifier(
  components: Array<{ hasTerminal: boolean }>
): boolean {
  return components.every(c => c.hasTerminal)
}
