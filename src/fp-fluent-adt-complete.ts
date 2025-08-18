/**
 * ADT-aware fluent helpers for composition over tagged-union ADTs.
 * Pure functions with no external dependencies or prototype patching.
 */

// Maybe types
type Nothing = { tag: 'Nothing' };
type Just<A> = { tag: 'Just'; value: A };
type Maybe<A> = Nothing | Just<A>;

// Either types
type Left<L> = { tag: 'Left'; value: L };
type Right<R> = { tag: 'Right'; value: R };
type Either<L, R> = Left<L> | Right<R>;

// Prism-like interface
interface PrismLike<S, A> {
  get: (s: S) => Maybe<A>;
}

/**
 * Maps over a Maybe value, applying function only if Just.
 * 
 * @example
 * ```ts
 * const just42 = { tag: 'Just', value: 42 } as const;
 * const nothing = { tag: 'Nothing' } as const;
 * 
 * mapMaybe(just42, x => x * 2); // { tag: 'Just', value: 84 }
 * mapMaybe(nothing, x => x * 2); // { tag: 'Nothing' }
 * ```
 */
export function mapMaybe<A, B>(
  m: Maybe<A>,
  f: (a: A) => B
): typeof m extends Just<A> ? Just<B> : Nothing {
  switch (m.tag) {
    case 'Just':
      return { tag: 'Just', value: f(m.value) } as any;
    case 'Nothing':
      return { tag: 'Nothing' } as any;
    default:
      // Exhaustive check
      const _exhaustive: never = m;
      throw new Error(`Unhandled case: ${_exhaustive}`);
  }
}

/**
 * Maps over an Either value with separate functions for Left and Right.
 * 
 * @example
 * ```ts
 * const left = { tag: 'Left', value: 'error' } as const;
 * const right = { tag: 'Right', value: 42 } as const;
 * 
 * mapEither(left, s => s.toUpperCase(), n => n * 2); // { tag: 'Left', value: 'ERROR' }
 * mapEither(right, s => s.toUpperCase(), n => n * 2); // { tag: 'Right', value: 84 }
 * ```
 */
export function mapEither<L, R, L2, R2>(
  e: Either<L, R>,
  fL: (l: L) => L2,
  fR: (r: R) => R2
): Either<L2, R2> {
  switch (e.tag) {
    case 'Left':
      return { tag: 'Left', value: fL(e.value) };
    case 'Right':
      return { tag: 'Right', value: fR(e.value) };
    default:
      // Exhaustive check
      const _exhaustive: never = e;
      throw new Error(`Unhandled case: ${_exhaustive}`);
  }
}

/**
 * Chains Maybe values, flattening nested Maybes.
 * 
 * @example
 * ```ts
 * const just42 = { tag: 'Just', value: 42 } as const;
 * const nothing = { tag: 'Nothing' } as const;
 * 
 * chainMaybe(just42, x => x > 40 ? { tag: 'Just', value: x * 2 } : { tag: 'Nothing' });
 * // { tag: 'Just', value: 84 }
 * 
 * chainMaybe(nothing, x => ({ tag: 'Just', value: x * 2 }));
 * // { tag: 'Nothing' }
 * ```
 */
export function chainMaybe<A, B>(
  m: Maybe<A>,
  f: (a: A) => Maybe<B>
): Maybe<B> {
  switch (m.tag) {
    case 'Just':
      return f(m.value);
    case 'Nothing':
      return { tag: 'Nothing' };
    default:
      // Exhaustive check
      const _exhaustive: never = m;
      throw new Error(`Unhandled case: ${_exhaustive}`);
  }
}

/**
 * Chains Either values, applying function only to Right values.
 * 
 * @example
 * ```ts
 * const right42 = { tag: 'Right', value: 42 } as const;
 * const leftErr = { tag: 'Left', value: 'error' } as const;
 * 
 * chainEither(right42, x => x > 40 ? { tag: 'Right', value: x * 2 } : { tag: 'Left', value: 'too small' });
 * // { tag: 'Right', value: 84 }
 * 
 * chainEither(leftErr, x => ({ tag: 'Right', value: x * 2 }));
 * // { tag: 'Left', value: 'error' }
 * ```
 */
export function chainEither<L, R, L2, R2>(
  e: Either<L, R>,
  f: (r: R) => Either<L2, R2>
): Either<L | L2, R2> {
  switch (e.tag) {
    case 'Left':
      return { tag: 'Left', value: e.value };
    case 'Right':
      return f(e.value);
    default:
      // Exhaustive check
      const _exhaustive: never = e;
      throw new Error(`Unhandled case: ${_exhaustive}`);
  }
}

/**
 * Pattern matches on Maybe, providing handlers for both cases.
 * 
 * @example
 * ```ts
 * const just42 = { tag: 'Just', value: 42 } as const;
 * const nothing = { tag: 'Nothing' } as const;
 * 
 * matchMaybe(just42, () => 'empty', x => `value: ${x}`); // 'value: 42'
 * matchMaybe(nothing, () => 'empty', x => `value: ${x}`); // 'empty'
 * ```
 */
export function matchMaybe<A, B>(
  m: Maybe<A>,
  onNothing: () => B,
  onJust: (a: A) => B
): B {
  switch (m.tag) {
    case 'Just':
      return onJust(m.value);
    case 'Nothing':
      return onNothing();
    default:
      // Exhaustive check
      const _exhaustive: never = m;
      throw new Error(`Unhandled case: ${_exhaustive}`);
  }
}

/**
 * Pattern matches on Either, providing handlers for both cases.
 * 
 * @example
 * ```ts
 * const left = { tag: 'Left', value: 'error' } as const;
 * const right = { tag: 'Right', value: 42 } as const;
 * 
 * matchEither(left, err => `Error: ${err}`, val => `Success: ${val}`); // 'Error: error'
 * matchEither(right, err => `Error: ${err}`, val => `Success: ${val}`); // 'Success: 42'
 * ```
 */
export function matchEither<L, R, B>(
  e: Either<L, R>,
  onLeft: (l: L) => B,
  onRight: (r: R) => B
): B {
  switch (e.tag) {
    case 'Left':
      return onLeft(e.value);
    case 'Right':
      return onRight(e.value);
    default:
      // Exhaustive check
      const _exhaustive: never = e;
      throw new Error(`Unhandled case: ${_exhaustive}`);
  }
}

/**
 * Composes two prism-like optics, short-circuiting on first Nothing.
 * 
 * @example
 * ```ts
 * const p1: PrismLike<string, number> = {
 *   get: (s: string) => {
 *     const n = parseInt(s, 10);
 *     return isNaN(n) ? { tag: 'Nothing' } : { tag: 'Just', value: n };
 *   }
 * };
 * 
 * const p2: PrismLike<number, string> = {
 *   get: (n: number) => n > 0 ? { tag: 'Just', value: n.toString() } : { tag: 'Nothing' }
 * };
 * 
 * const composed = composePrismLike(p1, p2);
 * composed.get('42'); // { tag: 'Just', value: '42' }
 * composed.get('abc'); // { tag: 'Nothing' }
 * composed.get('-5'); // { tag: 'Nothing' }
 * ```
 */
export function composePrismLike<S, A, B>(
  p1: PrismLike<S, A>,
  p2: PrismLike<A, B>
): PrismLike<S, B> {
  return {
    get: (s: S): Maybe<B> => {
      const result1 = p1.get(s);
      switch (result1.tag) {
        case 'Just':
          return p2.get(result1.value);
        case 'Nothing':
          return { tag: 'Nothing' };
        default:
          // Exhaustive check
          const _exhaustive: never = result1;
          throw new Error(`Unhandled case: ${_exhaustive}`);
      }
    }
  };
}
