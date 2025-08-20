
import type { Kind1, Apply } from '../../fp-hkt';
import type { Functor1, Apply1, Applicative1, Monad1 } from './typeclass-interfaces';

type AnyDict = Record<string, unknown>;

export interface Fluent<T, F extends Kind1, Dicts extends AnyDict = {}> {
  readonly value: () => Apply<F, [T]>;
  // extension points injected via withX
  // (structurally augmented; see below)
}

function makeFluent<T, F extends Kind1>(fa: Apply<F, [T]>): Fluent<T, F> {
  return { value: () => fa } as any;
}

export function fluent<T, F extends Kind1>(fa: Apply<F, [T]>) {
  return makeFluent<T, F>(fa);
}

// ------- Mixins (each returns a *new* Fluent with extra methods) -------

export interface WithFunctor<T, F extends Kind1> extends Fluent<T, F> {
  map: <B>(f: (a: T) => B) => Fluent<B, F>;
}

export function withFunctor<T, F extends Kind1>(dict: Functor1<F>) {
  return (fl: Fluent<T, F>): WithFunctor<T, F> => {
    const base = fl.value();
    const api: WithFunctor<T, F> = {
      ...fl,
      map: <B>(f: (a: T) => B) =>
        fluent<B, F>(dict.map(base as any, f) as any) as any,
    };
    return api;
  };
}

export interface WithApply<T, F extends Kind1> extends WithFunctor<T, F> {
  ap: <B>(ff: Fluent<(a: T) => B, F>) => Fluent<B, F>;
}

export function withApply<T, F extends Kind1>(dict: Apply1<F>) {
  return (fl: Fluent<T, F>): WithApply<T, F> => {
    const api = withFunctor<T, F>(dict)(fl) as WithApply<T, F>;
    api.ap = <B>(ff: Fluent<(a: T) => B, F>) =>
      fluent<B, F>(dict.ap((ff.value() as any), (api.value() as any)) as any);
    return api;
  };
}

export interface WithApplicative<T, F extends Kind1> extends WithApply<T, F> {
  of: <A>(a: A) => Fluent<A, F>;
}

export function withApplicative<T, F extends Kind1>(dict: Applicative1<F>) {
  return (fl: Fluent<T, F>): WithApplicative<T, F> => {
    const api = withApply<T, F>(dict)(fl) as WithApplicative<T, F>;
    api.of = <A>(a: A) => fluent<A, F>(dict.of(a));
    return api;
  };
}

export interface WithMonad<T, F extends Kind1> extends WithApplicative<T, F> {
  chain: <B>(f: (a: T) => Apply<F, [B]>) => Fluent<B, F>;
}

export function withMonad<T, F extends Kind1>(dict: Monad1<F>) {
  return (fl: Fluent<T, F>): WithMonad<T, F> => {
    const api = withApplicative<T, F>(dict)(fl) as WithMonad<T, F>;
    api.chain = <B>(f: (a: T) => Apply<F, [B]>) =>
      fluent<B, F>(dict.chain(api.value() as any, f) as any);
    return api;
  };
}
