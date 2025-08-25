// t-variants-shell.ts
import type { PolyMonad } from "./poly-2cat"

// (X,K,L) lives in C×C×C  — we keep it as a tuple shell for now.
export type Triple<E> = [E, E, E]

// (T+1)(X,Y) = (T X, Y);  (T+2)(X,K,L) = (T X, K, L)
export function tPlusTwo<I extends string, E>(M: PolyMonad<I>) {
  return {
    onObj: ([X,K,L]: Triple<E>): Triple<E> => [ (M as any).T ? (X as any) : X, K, L ],
    onMor: ([fx,fk,fl]: Triple<(z:E)=>E>): Triple<(z:E)=>E> => [fx, fk, fl],
    eta:   ([X,K,L]: Triple<E>) => [X,K,L],
    mu:    ([X,K,L]: Triple<E>) => [X,K,L],
  }
}

// "Forgets" f (K→L) or g (K→U_T(X)) at the extension level — shell morphisms
export function Tf_shell<I extends string, E>(M: PolyMonad<I>) {
  const T2 = tPlusTwo<I,E>(M)
  return {
    monad: T2,
    toT:   (triple: Triple<E>): E => triple[0],         // forget K,L
  }
}
export const Tg_shell = Tf_shell
export const Tfg_shell = Tf_shell
