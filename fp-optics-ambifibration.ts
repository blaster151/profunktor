// fp-optics-ambifibration.ts
// Ambient adapter for the (vert_Q, vert_P, cart_P) ternary factorization on a tower Q → E → C.
// Pairs with your ClovenFibration & VC utilities.

export interface TernaryFactorization<EArr> {
  isVertP: (e: EArr) => boolean;
  isVertQ: (e: EArr) => boolean;
  isCartP: (e: EArr) => boolean;
}

export interface Ambifibration<EArr> {
  // opcartesian lifts on (would-be) "L" class and cartesian lifts on "R" class.
  opcartLiftOnL: (e: EArr) => EArr;
  cartLiftOnR:   (e: EArr) => EArr;
}

// Minimal checker that "the dual swaps vert_P and vert_Q but keeps cart_P" (pp. 9–10)
export function dualTernary<F extends TernaryFactorization<E>, E>(tf: F): TernaryFactorization<E> {
  return { isVertP: tf.isVertQ, isVertQ: tf.isVertP, isCartP: tf.isCartP };
}
