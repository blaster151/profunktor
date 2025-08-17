// fp-hkt-either-result-kinds.ts
import type { Kind1 } from './fp-hkt';
import type { EitherGADT, Result } from './fp-gadt-enhanced';

// Right-covariant views as Kind1 (covariant-last)
export interface EitherRightK<L> extends Kind1 {
  readonly type: EitherGADT<L, this['arg0']>;
}

export interface ResultOkK<E> extends Kind1 {
  readonly type: Result<this['arg0'], E>;
}
