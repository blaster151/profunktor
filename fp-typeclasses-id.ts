import type { IdK } from './fp-hkt';

// Minimal Comonad interface for IdK
export interface Comonad<W extends IdK> {
  map: <A, B>(wa: A, f: (a: A) => B) => B;
  extract: <A>(wa: A) => A;
  extend: <A, B>(wa: A, f: (w: A) => B) => B;
  duplicate: <A>(wa: A) => A;
}

export const Id: Comonad<IdK> = {
  map: <A, B>(wa: A, f: (a: A) => B): B => f(wa),
  extract: <A>(wa: A): A => wa,
  extend: <A, B>(wa: A, f: (w: A) => B): B => f(wa),
  duplicate: <A>(wa: A): A => wa
};
