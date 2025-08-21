/**
 * Comonad Instances Implementation
 * 
 * This module provides comprehensive comonad instances for common functional programming types:
 * - Reader Comonad: Environment/configuration management
 * - Writer Comonad: Logging/accumulation  
 * - Store Comonad: Stateful computations with focus
 * - Stream Comonad: Infinite data streams
 * - Cofree Comonad: Annotated tree structures
 * - NonEmptyList Comonad: Safe list operations
 */

import {
  Kind1, Kind2, Kind3,
  Apply, Type, TypeArgs, KindArity, KindResult,
  ArrayK, MaybeK, EitherK, TupleK, FunctionK
} from './fp-hkt';

import {
  Functor, Applicative, Monad,
  deriveFunctor, deriveApplicative, deriveMonad
} from './fp-typeclasses-hkt';

import {
  EffectTag, EffectOf, Pure, IO, Async, State,
  createPurityInfo, attachPurityMarker, extractPurityMarker, hasPurityMarker
} from './fp-purity';

// Define Comonad interface since it's not exported from fp-typeclasses-hkt
export interface Comonad<F extends Kind1> extends Functor<F> {
  extract<A>(fa: Apply<F, [A]>): A;
  extend<A, B>(fa: Apply<F, [A]>, f: (wa: Apply<F, [A]>) => B): Apply<F, [B]>;
}

// ============================================================================
// Part 1: Reader Comonad - Environment/Configuration Management
// ============================================================================

/**
 * Reader Comonad: (E -> A) where E is the environment
 * Perfect for configuration management, dependency injection
 */
export type Reader<E, A> = (e: E) => A;

/**
 * Reader Comonad Instance
 * Note: Reader extract requires an environment, so we provide it explicitly
 */
export const ReaderComonad = {
  map: <E, A, B>(reader: Reader<E, A>, f: (a: A) => B): Reader<E, B> =>
    (e) => f(reader(e)),
  
  extract: <E, A>(reader: Reader<E, A>, env: E): A => reader(env),
  
  extend: <E, A, B>(reader: Reader<E, A>, f: (wa: Reader<E, A>) => B): Reader<E, B> =>
    (e) => f((e2) => reader(e2)),
  
  duplicate: <E, A>(reader: Reader<E, A>): Reader<E, Reader<E, A>> =>
    (e) => (e2) => reader(e2)
};

/**
 * Reader utilities
 */
export const reader = {
  of: <E, A>(a: A): Reader<E, A> => () => a,
  ask: <E>(): Reader<E, E> => (e) => e,
  local: <E, A>(f: (e: E) => E, reader: Reader<E, A>): Reader<E, A> => (e) => reader(f(e))
};

// ============================================================================
// Part 2: Writer Comonad - Logging/Accumulation
// ============================================================================

/**
 * Writer Comonad: [A, W] where W is the log/monoid
 * Great for logging, metrics collection, accumulation
 */
export type Writer<W, A> = [A, W];

/**
 * Writer Comonad Instance
 */
export const WriterComonad = {
  map: <W, A, B>(writer: Writer<W, A>, f: (a: A) => B): Writer<W, B> =>
    [f(writer[0]), writer[1]],
  
  extract: <W, A>(writer: Writer<W, A>): A => writer[0],
  
  extend: <W, A, B>(writer: Writer<W, A>, f: (wa: Writer<W, A>) => B): Writer<W, B> =>
    [f(writer), writer[1]],
  
  duplicate: <W, A>(writer: Writer<W, A>): Writer<W, Writer<W, A>> =>
    [writer, writer[1]]
};

/**
 * Writer utilities
 */
export const writer = {
  of: <W, A>(a: A, w: W): Writer<W, A> => [a, w],
  tell: <W>(w: W): Writer<W, void> => [undefined, w],
  listen: <W, A>(writer: Writer<W, A>): Writer<W, [A, W]> => [[writer[0], writer[1]], writer[1]]
};

// ============================================================================
// Part 3: Store Comonad - Stateful Computations with Focus
// ============================================================================

/**
 * Store Comonad: (S -> A, S) where S is the state and we have a focus
 * Excellent for stateful computations, UI state management
 */
export type Store<S, A> = { peek: (s: S) => A; focus: S };

/**
 * Store Comonad Instance
 */
export const StoreComonad = {
  map: <S, A, B>(store: Store<S, A>, f: (a: A) => B): Store<S, B> => ({
    peek: (s) => f(store.peek(s)),
    focus: store.focus
  }),
  
  extract: <S, A>(store: Store<S, A>): A => store.peek(store.focus),
  
  extend: <S, A, B>(store: Store<S, A>, f: (wa: Store<S, A>) => B): Store<S, B> => ({
    peek: (s) => f({ peek: store.peek, focus: s }),
    focus: store.focus
  }),
  
  duplicate: <S, A>(store: Store<S, A>): Store<S, Store<S, A>> => ({
    peek: (s) => ({ peek: store.peek, focus: s }),
    focus: store.focus
  })
};

/**
 * Store utilities
 */
export const store = {
  of: <S, A>(a: A, s: S): Store<S, A> => ({ peek: () => a, focus: s }),
  peek: <S, A>(store: Store<S, A>, s: S): A => store.peek(s),
  seek: <S, A>(store: Store<S, A>, s: S): Store<S, A> => ({ peek: store.peek, focus: s }),
  pos: <S, A>(store: Store<S, A>): S => store.focus
};

// ============================================================================
// Part 4: Stream Comonad - Infinite Data Streams
// ============================================================================

/**
 * Stream Comonad: { head: A; tail: Stream<A> }
 * Perfect for reactive programming, infinite data streams
 */
export type Stream<A> = { head: A; tail: Stream<A> | (() => Stream<A>) };

/**
 * Stream Comonad Instance
 */
export const StreamComonad = {
  map: <A, B>(stream: Stream<A>, f: (a: A) => B): Stream<B> => ({
    head: f(stream.head),
    tail: typeof stream.tail === 'function' ? 
      () => StreamComonad.map(stream.tail(), f) : 
      StreamComonad.map(stream.tail, f)
  }),
  
  extract: <A>(stream: Stream<A>): A => stream.head,
  
  extend: <A, B>(stream: Stream<A>, f: (wa: Stream<A>) => B): Stream<B> => ({
    head: f(stream),
    tail: typeof stream.tail === 'function' ? 
      () => StreamComonad.extend(stream.tail(), f) : 
      StreamComonad.extend(stream.tail, f)
  }),
  
  duplicate: <A>(stream: Stream<A>): Stream<Stream<A>> => ({
    head: stream,
    tail: typeof stream.tail === 'function' ? 
      () => StreamComonad.duplicate(stream.tail()) : 
      StreamComonad.duplicate(stream.tail)
  })
};

/**
 * Stream utilities
 */
export const stream = {
  of: <A>(a: A): Stream<A> => {
    let tail: Stream<A> | null = null;
    return {
      head: a,
      get tail() {
        if (!tail) {
          tail = stream.of(a);
        }
        return tail;
      }
    };
  },
  iterate: <A>(f: (a: A) => A, a: A): Stream<A> => {
    let tail: Stream<A> | null = null;
    return {
      head: a,
      get tail() {
        if (!tail) {
          tail = stream.iterate(f, f(a));
        }
        return tail;
      }
    };
  },
  take: <A>(n: number, s: Stream<A>): A[] => {
    if (n <= 0) return [];
    return [s.head, ...stream.take(n - 1, s.tail)];
  }
};

// ============================================================================
// Part 5: Cofree Comonad - Annotated Tree Structures
// ============================================================================

/**
 * Cofree Comonad: { head: A; tail: F<Cofree<F, A>> }
 * Great for ASTs, syntax trees, annotated structures
 */
export type Cofree<F, A> = { head: A; tail: F<Cofree<F, A>> };

/**
 * Cofree Comonad Instance
 * Requires a Functor instance for F
 */
export const CofreeComonad = {
  map: <F, A, B>(cofree: Cofree<F, A>, f: (a: A) => B, F: Functor<F>): Cofree<F, B> => ({
    head: f(cofree.head),
    tail: F.map(cofree.tail, (cf) => CofreeComonad.map(cf, f, F))
  }),
  
  extract: <F, A>(cofree: Cofree<F, A>): A => cofree.head,
  
  extend: <F, A, B>(cofree: Cofree<F, A>, f: (wa: Cofree<F, A>) => B, F: Functor<F>): Cofree<F, B> => ({
    head: f(cofree),
    tail: F.map(cofree.tail, (cf) => CofreeComonad.extend(cf, f, F))
  }),
  
  duplicate: <F, A>(cofree: Cofree<F, A>, F: Functor<F>): Cofree<F, Cofree<F, A>> => ({
    head: cofree,
    tail: F.map(cofree.tail, (cf) => CofreeComonad.duplicate(cf, F))
  })
};

// ============================================================================
// Part 6: NonEmptyList Comonad - Safe List Operations
// ============================================================================

/**
 * NonEmptyList Comonad: { head: A; tail: A[] }
 * Useful for safe list operations, guaranteed non-empty collections
 */
export type NonEmptyList<A> = { head: A; tail: A[] };

/**
 * NonEmptyList Comonad Instance
 */
export const NonEmptyListComonad = {
  map: <A, B>(nel: NonEmptyList<A>, f: (a: A) => B): NonEmptyList<B> => ({
    head: f(nel.head),
    tail: nel.tail.map(f)
  }),
  
  extract: <A>(nel: NonEmptyList<A>): A => nel.head,
  
  extend: <A, B>(nel: NonEmptyList<A>, f: (wa: NonEmptyList<A>) => B): NonEmptyList<B> => {
    const newHead = f(nel);
    const newTail = nel.tail.map((_, i) => {
      const subList = { head: nel.tail[i], tail: nel.tail.slice(i + 1) };
      return f(subList);
    });
    return { head: newHead, tail: newTail };
  },
  
  duplicate: <A>(nel: NonEmptyList<A>): NonEmptyList<NonEmptyList<A>> => {
    const newHead = nel;
    const newTail = nel.tail.map((_, i) => ({
      head: nel.tail[i],
      tail: nel.tail.slice(i + 1)
    }));
    return { head: newHead, tail: newTail };
  }
};

/**
 * NonEmptyList utilities
 */
export const nonEmptyList = {
  of: <A>(a: A): NonEmptyList<A> => ({ head: a, tail: [] }),
  fromArray: <A>(arr: A[]): NonEmptyList<A> | null => {
    if (arr.length === 0) return null;
    return { head: arr[0], tail: arr.slice(1) };
  },
  toArray: <A>(nel: NonEmptyList<A>): A[] => [nel.head, ...nel.tail],
  append: <A>(nel: NonEmptyList<A>, a: A): NonEmptyList<A> => ({
    head: nel.head,
    tail: [...nel.tail, a]
  })
};

// ============================================================================
// Part 7: Comonad Laws Verification
// ============================================================================

/**
 * Verify comonad laws for any comonad instance
 */
export const verifyComonadLaws = <W, A>(
  comonad: {
    map: (wa: W, f: (a: A) => any) => any;
    extract: (wa: W) => A;
    extend: (wa: W, f: (wa: W) => any) => any;
    duplicate: (wa: W) => any;
  },
  wa: W,
  f: (a: A) => any,
  g: (wa: W) => any
): boolean => {
  // Left Identity: extract ∘ duplicate = id
  const leftIdentity = comonad.extract(comonad.duplicate(wa));
  const leftIdentityHolds = leftIdentity === comonad.extract(wa);
  
  // Right Identity: extract ∘ map(duplicate) = id
  const rightIdentity = comonad.extract(comonad.map(comonad.duplicate(wa), comonad.extract));
  const rightIdentityHolds = rightIdentity === comonad.extract(wa);
  
  // Associativity: extend f ∘ extend g = extend (f ∘ extend g)
  const associativity1 = comonad.extend(comonad.extend(wa, g), f);
  const associativity2 = comonad.extend(wa, (w) => f(comonad.extend(w, g)));
  const associativityHolds = associativity1 === associativity2;
  
  return leftIdentityHolds && rightIdentityHolds && associativityHolds;
};
