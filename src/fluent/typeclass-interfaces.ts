import type { Kind1 } from '../../fp-hkt';
import type { Functor, Applicative, Monad } from '../../fp-typeclasses';

// These are unary typeclass interfaces for Kind1
export type Functor1<F extends Kind1> = Functor<F>;
export type Apply1<F extends Kind1> = Applicative<F>; // Apply is a subset of Applicative
export type Applicative1<F extends Kind1> = Applicative<F>;
export type Monad1<F extends Kind1> = Monad<F>;
