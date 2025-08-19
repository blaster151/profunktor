/**
 * Anamorphisms (Unfolds) — minimal, adapter-free implementation
 */
import { Maybe, Either } from './fp-hkt';

export type Build<T, Seed> =
  | { tag: 'Done'; node: T }
  | { tag: 'More'; sub: Record<string, Seed>; rebuild: (children: Record<string, T>) => T };

export function Done<T, Seed = never>(node: T): Build<T, Seed> {
  return { tag: 'Done', node };
}

export function More<T, Seed>(
  sub: Record<string, Seed>,
  rebuild: (children: Record<string, T>) => T
): Build<T, Seed> {
  return { tag: 'More', sub, rebuild };
}

export function anaRecursive<T, Seed>(
  coalg: (seed: Seed) => Build<T, Seed>
): (seed: Seed) => T {
  const go = (seed: Seed): T => {
    const step = coalg(seed);
    if (step.tag === 'Done') return step.node;
    const children = Object.fromEntries(
      Object.entries(step.sub).map(([k, s]) => [k, go(s)])
    ) as Record<string, T>;
    return step.rebuild(children);
  };
  return go;
}

export type Result<A, E> = { tag: 'Ok'; value: A } | { tag: 'Err'; error: E };

export function anaMaybe<A, Seed>(
  coalg: (seed: Seed) => Maybe<A>
): (seed: Seed) => Maybe<A> {
  return (seed: Seed) => coalg(seed);
}

export function anaEither<L, R, Seed>(
  coalg: (seed: Seed) => Either<L, R>
): (seed: Seed) => Either<L, R> {
  return (seed: Seed) => coalg(seed);
}

export function anaResult<A, E, Seed>(
  coalg: (seed: Seed) => Result<A, E>
): (seed: Seed) => Result<A, E> {
  return (seed: Seed) => coalg(seed);
} 