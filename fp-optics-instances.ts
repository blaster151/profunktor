/**
 * Minimal optics instances (lite)
 *
 * Provides lightweight derivation helpers and ADT optics without heavy typeclass/HKT wiring.
 */

import { Lens, Prism, Optional, lens, prism, optional } from './fp-optics';

// Lightweight Maybe helpers
type Maybe<A> = { tag: 'Just'; value: A } | { tag: 'Nothing' };
const Just = <A>(value: A): Maybe<A> => ({ tag: 'Just', value });
const Nothing = <A>(): Maybe<A> => ({ tag: 'Nothing' });

// Derivation helpers
export function deriveLens<K extends string>(key: K) {
  return <S extends Record<K, any>, T extends Record<K, any>, A, B>(): Lens<S, T, A, B> =>
    lens(
      (s: S) => s[key] as A,
      (b: B, s: S) => ({ ...s, [key]: b }) as unknown as T
    );
}

export function derivePrism<Tag extends string>(tag: Tag) {
  return <S extends { tag: Tag }, T extends { tag: Tag }, A, B>(): Prism<S, T, A, B> =>
    prism(
      (s: S) => ((s as any)?.tag === tag ? Just((s as any).value as A) : Nothing<A>()),
      (b: B) => ({ tag, value: b } as unknown as T)
    );
}

export function deriveOptional<K extends string>(key: K) {
  return <S extends Record<K, any>, T extends Record<K, any>, A, B>(): Optional<S, T, A, B> =>
    optional(
      (s: S) => {
        const v = s[key];
        return v != null ? Just(v as A) : Nothing<A>();
      },
      (b: B, s: S) => ({ ...s, [key]: b }) as unknown as T
    );
}

// ADT optics templates (prisms by tag, optionals by field)
export const MaybeOptics = {
  value: deriveLens('value'),
  Just: derivePrism('Just'),
  Nothing: derivePrism('Nothing')
};

export const EitherOptics = {
  left: deriveLens('value'),
  right: deriveLens('value'),
  Left: derivePrism('Left'),
  Right: derivePrism('Right')
};

export const ResultOptics = {
  success: deriveLens('value'),
  error: deriveLens('error'),
  Ok: derivePrism('Ok'),
  Err: derivePrism('Err')
};

// Simple optic-focused matcher (supports lens/prism/optional get/getOption)
export function matchWithOptic<S, A, R>(
  optic: { get?: (s: S) => A; getOption?: (s: S) => Maybe<A> },
  cases: { Just?: (a: A) => R; Nothing?: () => R; _?: (a: A) => R; otherwise?: (a: A) => R }
) {
  return (s: S): R => {
    if (typeof optic.getOption === 'function') {
      const m = optic.getOption(s);
      if (m.tag === 'Just' && cases.Just) return cases.Just(m.value);
      if (m.tag === 'Nothing' && cases.Nothing) return cases.Nothing();
    }
    const a = typeof optic.get === 'function' ? (optic.get as any)(s) as A : (undefined as unknown as A);
    if (cases._) return cases._(a);
    if (cases.otherwise) return cases.otherwise(a);
    throw new Error('No matching case found');
  };
}

export function opticMatch<S, A, R>(
  optic: { get?: (s: S) => A; getOption?: (s: S) => Maybe<A> }
) {
  return (cases: { Just?: (a: A) => R; Nothing?: () => R; _?: (a: A) => R; otherwise?: (a: A) => R }) =>
    matchWithOptic(optic, cases);
}