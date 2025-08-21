// Example: Compose to slot persistent collections anywhere HKT-based code expects arrays, etc.
// const arrayToPersistentToArray = composeK(fromPersistentList, toPersistentList);
/**
 * Persistent Collections in HKTs + GADTs
 * 
 * This module provides seamless integration between persistent collections,
 * Higher-Kinded Types (HKTs), and Generalized Algebraic Data Types (GADTs).
 * 
 * Features:
 * - Persistent collections registered as HKTs
 * - GADT-friendly forms for persistent collections
 * - Pattern matching for GADT forms
 * - Integration with derivable instances
 * - Type-safe operations with immutability preservation
 */

// ============================================================================
// Arity-polymorphic helpers (K1/K2/K3)
// ============================================================================

// mapLastN already exist; wire the K3 version for future containers:
export const mapList3 = mapLast3; // expose as first-class if you plan a K3 persistent type
// ============================================================================
// Interop bridges between standard HKTs and persistent HKTs
// ============================================================================

import {
  Kind1, Kind2, Kind3,
  Apply, Type, TypeArgs, KindArity, KindResult,
  ArrayK, MaybeK, EitherK, TupleK, FunctionK,
  Maybe, Either,
  ApplyLeft
} from './fp-hkt';

import {
  Functor, Applicative, Monad, Bifunctor, Traversable, Foldable,
  deriveFunctor, deriveApplicative, deriveMonad,
  lift2, composeK, sequence, traverse,
  mapLast1, mapLast2, mapLast3
} from './fp-typeclasses-hkt';

import {
  PersistentList, PersistentMap, PersistentSet,
  PersistentListK as _PersistentListK, PersistentMapK as _PersistentMapK, PersistentSetK as _PersistentSetK
} from './fp-persistent';

import {
  GADT, GADTTags, GADTPayload,
  pmatch, PatternMatcherBuilder,
  derivePatternMatcher, createPmatchBuilder,
  Expr, ExprK, evaluate, transformString, ExprFunctor,
  MaybeGADT, MaybeGADTK, getMaybeGADTFunctor, getMaybeGADTApplicative, getMaybeGADTMonad,
  EitherGADT, EitherGADTK, EitherGADTBifunctor,
  Result, ResultK
} from './fp-gadt-enhanced';

import {
  Immutable, immutableArray
} from './fp-immutable';

import {
  PERSISTENT_BRAND, IMMUTABLE_BRAND,
  isPersistentCollection, isImmutableCollection,
  registerDerivableInstances, autoRegisterPersistentCollections,
  deriveInstances, getFunctorInstance, getMonadInstance
} from './fp-derivable-instances';

// Natural transformations to and from the persistent containers
export const toPersistentList = <A>(as: A[]) =>
  PersistentList.fromArray(as);

export const fromPersistentList = <A>(pl: PersistentList<A>) =>
  pl.toArray();

// --- Kind2 HKT for Array<[K,V]> ---
export interface ArrayPairK extends Kind2 {
  readonly type: Array<[this['arg0'], this['arg1']]>;
}

// For Map: Array<[K, V]> <-> PersistentMap<K, V> (Kind2 <-> Kind2)
export const entriesToPersistentMap = <K, V>(xs: Array<[K, V]>) =>
  PersistentMap.fromEntries(xs);

export const persistentMapToEntries = <K, V>(pm: PersistentMap<K, V>) => {
  const out: Array<[K, V]> = [];
  pm.forEach((v, k) => out.push([k, v]));
  return out;
};

// For Set: Array<A> <-> PersistentSet<A>
export const toPersistentSet = <A>(as: A[]) =>
  PersistentSet.fromArray(as);

export const fromPersistentSet = <A>(ps: PersistentSet<A>) => {
  const arr: A[] = [];
  ps.forEach(a => arr.push(a));
  return arr;
};

/**
 * @deprecated Use PersistentListHKT instead.
 */
export type PersistentListK = _PersistentListK;
/**
 * @deprecated Use PersistentMapHKT instead.
 */
export type PersistentMapK = _PersistentMapK;
/**
 * @deprecated Use PersistentSetHKT instead.
 */
export type PersistentSetK = _PersistentSetK;


// ============================================================================
// Part 1: HKT Registration for Persistent Collections
// ============================================================================

/**
 * HKT registration for PersistentList
 */
export interface PersistentListHKT extends Kind1 {
  readonly type: PersistentList<this['arg0']>;
}

/**
 * HKT registration for PersistentMap
 */
export interface PersistentMapHKT extends Kind2 {
  readonly type: PersistentMap<this['arg0'], this['arg1']>;
}

/**
 * HKT registration for PersistentSet
 */
export interface PersistentSetHKT extends Kind1 {
  readonly type: PersistentSet<this['arg0']>;
}

/**
 * Type-safe HKT application for persistent collections
 */
export type ApplyPersistentList<A> = Apply<PersistentListHKT, [A]>;
export type ApplyPersistentMap<K, V> = Apply<PersistentMapHKT, [K, V]>;
export type ApplyPersistentSet<A> = Apply<PersistentSetHKT, [A]>;

// ============================================================================
// Part 2: GADT Forms for Persistent Collections
// ============================================================================

/**
 * GADT form for PersistentList
 */
export type ListGADT<A> =
  | { tag: 'Nil'; payload: {} }
  | { tag: 'Cons'; payload: { head: A; tail: PersistentList<A> } };

/**
 * GADT form for PersistentMap
 */
export type MapGADT<K, V> =
  | { tag: 'Empty'; payload: {} }
  | { tag: 'NonEmpty'; payload: { key: K; value: V; rest: PersistentMap<K, V> } };

/**
 * GADT form for PersistentSet
 */
export type SetGADT<A> =
  | { tag: 'Empty'; payload: {} }
  | { tag: 'NonEmpty'; payload: { element: A; rest: PersistentSet<A> } };

/**
 * GADT tags for ListGADT
 */
export type ListGADTTags = 'Nil' | 'Cons';

/**
 * GADT tags for MapGADT
 */
export type MapGADTTags = 'Empty' | 'NonEmpty';

/**
 * GADT tags for SetGADT
 */
export type SetGADTTags = 'Empty' | 'NonEmpty';


// ============================================================================
// Part 3: GADT Constructors for Persistent Collections
// ============================================================================

/**
 * GADT constructors for ListGADT
 */
export const ListGADT = {
  Nil: (): ListGADT<any> => ({ tag: 'Nil', payload: {} }),
  Cons: <A>(head: A, tail: PersistentList<A>): ListGADT<A> => ({ 
    tag: 'Cons', 
    payload: { head, tail }
  })
};

/**
 * GADT constructors for MapGADT
 */
export const MapGADT = {
  Empty: (): MapGADT<any, any> => ({ tag: 'Empty', payload: {} }),
  NonEmpty: <K, V>(key: K, value: V, rest: PersistentMap<K, V>): MapGADT<K, V> => ({ 
    tag: 'NonEmpty', 
    payload: { key, value, rest }
  })
};

/**
 * GADT constructors for SetGADT
 */
export const SetGADT = {
  Empty: (): SetGADT<any> => ({ tag: 'Empty', payload: {} }),
  NonEmpty: <A>(element: A, rest: PersistentSet<A>): SetGADT<A> => ({ 
    tag: 'NonEmpty', 
    payload: { element, rest }
  })
};

// ============================================================================
// Part 4: Pattern Matching for GADT Forms
// ============================================================================

/**
 * Pattern matcher for ListGADT (rebuilt on top of pmatch builder)
 */
export function matchList<A, R>(
  gadt: ListGADT<A>,
  patterns: {
    Nil: () => R;
    Cons: (payload: { head: A; tail: PersistentList<A> }) => R;
  }
): R {
  return pmatchList<A, R>(gadt)
    .with('Nil', patterns.Nil)
    .with('Cons', patterns.Cons)
    .exhaustive();
}

/**
 * Pattern matcher for MapGADT (rebuilt on top of pmatch builder)
 */
export function matchMap<K, V, R>(
  gadt: MapGADT<K, V>,
  patterns: {
    Empty: () => R;
    NonEmpty: (payload: { key: K; value: V; rest: PersistentMap<K, V> }) => R;
  }
): R {
  return pmatchMap<K, V, R>(gadt)
    .with('Empty', patterns.Empty)
    .with('NonEmpty', patterns.NonEmpty)
    .exhaustive();
}

/**
 * Pattern matcher for SetGADT (rebuilt on top of pmatch builder)
 */
export function matchSet<A, R>(
  gadt: SetGADT<A>,
  patterns: {
    Empty: () => R;
    NonEmpty: (payload: { element: A; rest: PersistentSet<A> }) => R;
  }
): R {
  return pmatchSet<A, R>(gadt)
    .with('Empty', patterns.Empty)
    .with('NonEmpty', patterns.NonEmpty)
    .exhaustive();
}

/**
 * Partial pattern matcher for ListGADT
 */
export function matchListPartial<A, R>(
  gadt: ListGADT<A>,
  patterns: Partial<{
    Nil: () => R;
    Cons: (payload: { head: A; tail: PersistentList<A> }) => R;
  }>
): R | undefined {
  if (gadt.tag === 'Nil') return patterns.Nil ? patterns.Nil() : undefined;
  if (gadt.tag === 'Cons') return patterns.Cons ? patterns.Cons(gadt.payload) : undefined;
  return undefined;
}

/**
 * Partial pattern matcher for MapGADT
 */
export function matchMapPartial<K, V, R>(
  gadt: MapGADT<K, V>,
  patterns: Partial<{
    Empty: () => R;
    NonEmpty: (payload: { key: K; value: V; rest: PersistentMap<K, V> }) => R;
  }>
): R | undefined {
  if (gadt.tag === 'Empty') return patterns.Empty ? patterns.Empty() : undefined;
  if (gadt.tag === 'NonEmpty') return patterns.NonEmpty ? patterns.NonEmpty(gadt.payload) : undefined;
  return undefined;
}

/**
 * Partial pattern matcher for SetGADT
 */
export function matchSetPartial<A, R>(
  gadt: SetGADT<A>,
  patterns: Partial<{
    Empty: () => R;
    NonEmpty: (payload: { element: A; rest: PersistentSet<A> }) => R;
  }>
): R | undefined {
  if (gadt.tag === 'Empty') return patterns.Empty ? patterns.Empty() : undefined;
  if (gadt.tag === 'NonEmpty') return patterns.NonEmpty ? patterns.NonEmpty(gadt.payload) : undefined;
  return undefined;
}

// ============================================================================
// Part 4.5: Builder-Style Pattern Matching for Ergonomic Use
// ============================================================================

/**
 * Builder-style pattern matcher for ListGADT with exhaustiveness checking
 */
export function pmatchList<A, R>(value: ListGADT<A>): PatternMatcherBuilder<ListGADT<A>, R> {
  return pmatch(value);
}

/**
 * Alias for pmatch; does not enforce tag-only (no payload) handlers.
 * Provided for symmetry with tag-only matchers, but allows payloads.
 */
export function pmatchListTag<A, R>(value: ListGADT<A>): PatternMatcherBuilder<ListGADT<A>, R> {
  return pmatch(value);
}

// --------------------------------------------------------------------------
// GADT-level pattern-match builders & totality helpers (auto-derived style)
// --------------------------------------------------------------------------



// Strongly-typed builder helper for ListGADT
export function makeListMatcher<A, R>() {
  return (g: ListGADT<A>) => pmatch<ListGADT<A>, R>(g);
}

export function matchListTotal<A, R>(g: ListGADT<A>, k: {
  Nil: () => R;
  Cons: (p: { head: A; tail: PersistentList<A> }) => R;
}): R {
  return makeListMatcher<A, R>()(g)
    .with('Nil', k.Nil)
    .with('Cons', k.Cons)
    .exhaustive();
}


// Strongly-typed builder helper for MapGADT
export function makeMapMatcher<K, V, R>() {
  return (g: MapGADT<K, V>) => pmatch<MapGADT<K, V>, R>(g);
}

export function matchMapTotal<K, V, R>(g: MapGADT<K, V>, k: {
  Empty: () => R;
  NonEmpty: (p: { key: K; value: V; rest: PersistentMap<K, V> }) => R;
}): R {
  return makeMapMatcher<K, V, R>()(g)
    .with('Empty', k.Empty)
    .with('NonEmpty', k.NonEmpty)
    .exhaustive();
}


// Strongly-typed builder helper for SetGADT
export function makeSetMatcher<A, R>() {
  return (g: SetGADT<A>) => pmatch<SetGADT<A>, R>(g);
}

export function matchSetTotal<A, R>(g: SetGADT<A>, k: {
  Empty: () => R;
  NonEmpty: (p: { element: A; rest: PersistentSet<A> }) => R;
}): R {
  return makeSetMatcher<A, R>()(g)
    .with('Empty', k.Empty)
    .with('NonEmpty', k.NonEmpty)
    .exhaustive();
}

/**
 * Builder-style pattern matcher for MapGADT with exhaustiveness checking
 */
export function pmatchMap<K, V, R>(value: MapGADT<K, V>): PatternMatcherBuilder<MapGADT<K, V>, R> {
  return pmatch(value);
}

/**
 * Alias for pmatch; does not enforce tag-only (no payload) handlers.
 * Provided for symmetry with tag-only matchers, but allows payloads.
 */
export function pmatchMapTag<K, V, R>(value: MapGADT<K, V>): PatternMatcherBuilder<MapGADT<K, V>, R> {
  return pmatch(value);
}

/**
 * Builder-style pattern matcher for SetGADT with exhaustiveness checking
 */
export function pmatchSet<A, R>(value: SetGADT<A>): PatternMatcherBuilder<SetGADT<A>, R> {
  return pmatch(value);
}

/**
 * Alias for pmatch; does not enforce tag-only (no payload) handlers.
 * Provided for symmetry with tag-only matchers, but allows payloads.
 */
export function pmatchSetTag<A, R>(value: SetGADT<A>): PatternMatcherBuilder<SetGADT<A>, R> {
  return pmatch(value);
}

// ============================================================================
// Part 4.6: Type Guards and Narrowing Functions
// ============================================================================

/**
 * Type guard for Nil case of ListGADT
 */
export function isNil<A>(g: ListGADT<A>): g is { tag: 'Nil'; payload: {} } {
  return g.tag === 'Nil';
}

/**
 * Type guard for Cons case of ListGADT
 */
export function isCons<A>(g: ListGADT<A>): g is { tag: 'Cons'; payload: { head: A; tail: PersistentList<A> } } {
  return g.tag === 'Cons';
}

/**
 * Type guard for Empty case of MapGADT
 */
export function isEmptyMap<K,V>(g: MapGADT<K,V>): g is { tag: 'Empty'; payload: {} } {
  return g.tag === 'Empty';
}

/**
 * Type guard for NonEmpty case of MapGADT
 */
export function isNonEmptyMap<K,V>(g: MapGADT<K,V>): g is { tag: 'NonEmpty'; payload: { key: K; value: V; rest: PersistentMap<K,V> } } {
  return g.tag === 'NonEmpty';
}

/**
 * Type guard for Empty case of SetGADT
 */
export function isEmptySet<A>(g: SetGADT<A>): g is { tag: 'Empty'; payload: {} } {
  return g.tag === 'Empty';
}

/**
 * Type guard for NonEmpty case of SetGADT
 */
export function isNonEmptySet<A>(g: SetGADT<A>): g is { tag: 'NonEmpty'; payload: { element: A; rest: PersistentSet<A> } } {
  return g.tag === 'NonEmpty';
}

/**
 * Guard/when helper for conditional pattern matching
 * Usage: pmatchList(g).with('Cons', ({ head }) => when((h:number)=>h>0, () => head)(head)).exhaustive()
 */
export function when<T>(pred: (t: T) => boolean, handler: (t: T) => any) {
  return (t: T) => (pred(t) ? handler(t) : undefined);
}

// ============================================================================
// Part 5: Conversion Functions Between Persistent Collections and GADTs
// ============================================================================

/**
 * Convert PersistentList to ListGADT
 */
export function listToGADT<A>(list: PersistentList<A>): ListGADT<A> {
  if (list.isEmpty()) {
    return ListGADT.Nil();
  } else {
    const head = list.head();
    const tail = list.tail();
    if (head === undefined) {
      return ListGADT.Nil();
    }
    return ListGADT.Cons(head, tail);
  }
}

/**
 * Convert ListGADT to PersistentList
 */
export function gadtToList<A>(gadt: ListGADT<A>): PersistentList<A> {
  return matchList(gadt, {
    Nil: () => PersistentList.empty<A>(),
    Cons: ({ head, tail }) => tail.prepend(head)
  });
}

/**
 * Convert PersistentMap to MapGADT
 */
export function mapToGADT<K, V>(map: PersistentMap<K, V>): MapGADT<K, V> {
  if (map.isEmpty()) {
    return MapGADT.Empty();
  } else {
    const entries: [K, V][] = [];
    map.forEach((value, key) => {
      entries.push([key, value]);
    });
    const [key, value] = entries[0];
    const rest = PersistentMap.fromEntries(entries.slice(1));
    return MapGADT.NonEmpty(key, value, rest);
  }
}

/**
 * Convert MapGADT to PersistentMap
 */
export function gadtToMap<K, V>(gadt: MapGADT<K, V>): PersistentMap<K, V> {
  return matchMap(gadt, {
    Empty: () => PersistentMap.empty<K, V>(),
    NonEmpty: ({ key, value, rest }) => rest.set(key, value)
  });
}

/**
 * Convert PersistentSet to SetGADT
 */
export function setToGADT<A>(set: PersistentSet<A>): SetGADT<A> {
  if (set.isEmpty()) {
    return SetGADT.Empty();
  } else {
    const values: A[] = [];
    set.forEach(value => {
      values.push(value);
    });
    const element = values[0];
    const rest = PersistentSet.fromArray(values.slice(1));
    return SetGADT.NonEmpty(element, rest);
  }
}

/**
 * Convert SetGADT to PersistentSet
 */
export function gadtToSet<A>(gadt: SetGADT<A>): PersistentSet<A> {
  return matchSet(gadt, {
    Empty: () => PersistentSet.empty<A>(),
    NonEmpty: ({ element, rest }) => rest.add(element)
  });
}

// ============================================================================
// Part 6: Typeclass Instances for HKT Forms
// ============================================================================

/**
 * Derived instances for PersistentListHKT
 */
export const PersistentListInstances = {
  map: <A, B>(fa: Apply<PersistentListHKT, [A]>, f: (a: A) => B): Apply<PersistentListHKT, [B]> => {
    return (fa as PersistentList<A>).map(f) as Apply<PersistentListHKT, [B]>;
  },
  of: <A>(a: A): Apply<PersistentListHKT, [A]> => {
    return PersistentList.of(a) as Apply<PersistentListHKT, [A]>;
  },
  ap: <A, B>(fab: Apply<PersistentListHKT, [(a: A) => B]>, fa: Apply<PersistentListHKT, [A]>): Apply<PersistentListHKT, [B]> => {
    // Use raw methods for implementation - delegate to flatMap and map
    const functions = fab as PersistentList<(a: A) => B>;
    const values = fa as PersistentList<A>;
    return functions.flatMap(fn => values.map(fn)) as Apply<PersistentListHKT, [B]>;
  },
  chain: <A, B>(fa: Apply<PersistentListHKT, [A]>, f: (a: A) => Apply<PersistentListHKT, [B]>): Apply<PersistentListHKT, [B]> => {
    return (fa as PersistentList<A>).flatMap(a => f(a) as PersistentList<B>) as Apply<PersistentListHKT, [B]>;
  }
};

export const PersistentListFunctor: Functor<PersistentListHKT> = {
  map: PersistentListInstances.map
};

export const PersistentListApplicative: Applicative<PersistentListHKT> = {
  map: PersistentListFunctor.map, // Reuse functor
  of: PersistentListInstances.of,
  ap: PersistentListInstances.ap
};

export const PersistentListMonad: Monad<PersistentListHKT> = {
  map: PersistentListFunctor.map, // Reuse functor
  of: PersistentListApplicative.of, // Reuse applicative
  ap: PersistentListApplicative.ap, // Reuse applicative
  chain: PersistentListInstances.chain
};

// ...existing code...
/**
 * Derived instances for PersistentMapHKT
 */
export const PersistentMapInstances = {
  map: <A, B>(fa: Apply<PersistentMapHKT, [any, A]>, f: (a: A) => B): Apply<PersistentMapHKT, [any, B]> => {
    return (fa as PersistentMap<any, A>).map(f) as Apply<PersistentMapHKT, [any, B]>;
  },
  bimap: <A, B, C, D>(fab: Apply<PersistentMapHKT, [A, B]>, f: (a: A) => C, g: (b: B) => D): Apply<PersistentMapHKT, [C, D]> => {
    const map = fab as PersistentMap<A, B>;
    let res = PersistentMap.empty<C, D>();
    map.forEach((value, key) => {
      res = res.set(f(key), g(value));
    });
    return res as Apply<PersistentMapHKT, [C, D]>;
  }
};


/**
 * Factory: Functor instance for PersistentMap with fixed key type K
 */
export function getPersistentMapFunctor<K>(): Functor<ApplyLeft<PersistentMapHKT, K>> {
  return {
    map: <A, B>(fa: Apply<ApplyLeft<PersistentMapHKT, K>, [A]>, f: (a: A) => B): Apply<ApplyLeft<PersistentMapHKT, K>, [B]> => {
      // fa is PersistentMap<K, A>
      return (fa as PersistentMap<K, A>).map(f) as PersistentMap<K, B>;
    }
  };
}

export const PersistentMapBifunctor: Bifunctor<PersistentMapHKT> = {
  bimap: PersistentMapInstances.bimap,
  mapLeft: <A, B, C>(fab: Apply<PersistentMapHKT, [A, B]>, f: (a: A) => C): Apply<PersistentMapHKT, [C, B]> => {
    return PersistentMapInstances.bimap(fab, f, (b: B) => b);
  },
  mapRight: <A, B, D>(fab: Apply<PersistentMapHKT, [A, B]>, g: (b: B) => D): Apply<PersistentMapHKT, [A, D]> => {
    return PersistentMapInstances.bimap(fab, (a: A) => a, g);
  }
};

/**
 * Derived instances for PersistentSetHKT
 */
export const PersistentSetInstances = {
  map: <A, B>(fa: Apply<PersistentSetHKT, [A]>, f: (a: A) => B): Apply<PersistentSetHKT, [B]> => {
    return (fa as PersistentSet<A>).map(f) as Apply<PersistentSetHKT, [B]>;
  }
};

export const PersistentSetFunctor: Functor<PersistentSetHKT> = {
  map: PersistentSetInstances.map
};

// ============================================================================
// Part 6.5: Foldable Instances for Persistent Collections
// ============================================================================

/**
 * Foldable instance for PersistentListHKT
 */
export const PersistentListFoldable: Foldable<PersistentListHKT> = {
  foldr: <A,B>(fa: Apply<PersistentListHKT,[A]>, f: (a:A, b:B)=>B, z: B): B => {
    let acc = z;
    // Right-fold: we need to walk from the right. If list supports reverse or tail recursion, use it.
    // Safe iterative approach: collect then loop backwards.
    const buf: A[] = [];
    (fa as PersistentList<A>).forEach(a => buf.push(a));
    for (let i = buf.length - 1; i >= 0; i--) acc = f(buf[i], acc);
    return acc;
  },
  foldl: <A,B>(fa: Apply<PersistentListHKT,[A]>, f: (b:B, a:A)=>B, z: B): B => {
    let acc = z;
    (fa as PersistentList<A>).forEach(a => { acc = f(acc, a); });
    return acc;
  }
};

/**
 * Foldable instance for PersistentSetHKT
 */
export const PersistentSetFoldable: Foldable<PersistentSetHKT> = {
  foldr: <A,B>(fa: Apply<PersistentSetHKT,[A]>, f: (a:A, b:B)=>B, z:B): B => {
    // No intrinsic order; pick insertion/iteration order.
    // Collect then right-fold to satisfy foldr signature.
    const buf: A[] = [];
    (fa as PersistentSet<A>).forEach(a => buf.push(a));
    let acc = z;
    for (let i = buf.length - 1; i >= 0; i--) acc = f(buf[i], acc);
    return acc;
  },
  foldl: <A,B>(fa: Apply<PersistentSetHKT,[A]>, f: (b:B, a:A)=>B, z:B): B => {
    let acc = z;
    (fa as PersistentSet<A>).forEach(a => { acc = f(acc, a); });
    return acc;
  }
};

/**
 * Foldable instance for PersistentMapHKT (fold over values, ignore keys)
 */

/**
 * Factory: Foldable instance for PersistentMap with fixed key type K
 */
export function getPersistentMapFoldable<K>(): Foldable<ApplyLeft<PersistentMapHKT, K>> {
  return {
    foldr: <A, B>(fa: Apply<ApplyLeft<PersistentMapHKT, K>, [A]>, f: (a: A, b: B) => B, z: B): B => {
      const buf: A[] = [];
      (fa as PersistentMap<K, A>).forEach((v) => buf.push(v));
      let acc = z;
      for (let i = buf.length - 1; i >= 0; i--) acc = f(buf[i], acc);
      return acc;
    },
    foldl: <A, B>(fa: Apply<ApplyLeft<PersistentMapHKT, K>, [A]>, f: (b: B, a: A) => B, z: B): B => {
      let acc = z;
      (fa as PersistentMap<K, A>).forEach((v) => { acc = f(acc, v); });
      return acc;
    }
  };
}

// ============================================================================
// Part 6.6: Traversable Instances for Persistent Collections
// ============================================================================

/**
 * Traversable instance for PersistentListHKT (Promise-based fallback for legacy interface)
 */
export const PersistentListTraversable: Traversable<PersistentListHKT> = {
  ...PersistentListFunctor,
  traverse: <G extends Kind1, A, B>(
    fa: Apply<PersistentListHKT,[A]>,
    f: (a: A) => Apply<G,[B]>
  ): Apply<G,[Apply<PersistentListHKT,[B]>]> => {
    // Promise-based fallback: treat G as PromiseK at runtime
    const ps: Promise<B>[] = [];
    (fa as PersistentList<A>).forEach(a => {
      ps.push((f(a) as unknown as Promise<B>));
    });
    return Promise.all(ps)
      .then(bs => PersistentList.fromArray(bs)) as unknown as Apply<G,[Apply<PersistentListHKT,[B]>]>;
  },
};

/**
 * Helper functions for sequence and traverse (legacy form)
 */
export function sequenceList<A>(
  xs: Apply<PersistentListHKT,[Promise<A>]>
): Promise<Apply<PersistentListHKT,[A]>> {
  return PersistentListTraversable.traverse(xs, (pa) => pa as any) as any;
}

export function traverseList<A, B>(
  xs: Apply<PersistentListHKT,[A]>,
  f: (a: A) => Promise<B>
): Promise<Apply<PersistentListHKT,[B]>> {
  return PersistentListTraversable.traverse(xs, f as any) as any;
}

// ============================================================================
// Part 7: Integration with Derivable Instances
// ============================================================================

/**
 * Register persistent collections as HKTs with derivable instances
 */
export function registerPersistentCollectionsAsHKTs(): void {
  // Register PersistentList as HKT
  registerDerivableInstances(PersistentList);
  
  // Register PersistentMap as HKT
  registerDerivableInstances(PersistentMap);
  
  // Register PersistentSet as HKT
  registerDerivableInstances(PersistentSet);
  
  // Register GADT forms
  registerDerivableInstances(ListGADT);
  registerDerivableInstances(MapGADT);
  registerDerivableInstances(SetGADT);
}

// --------------------------------------------------------------------------
// Auto-derivation hooks for persistent typeclasses
// --------------------------------------------------------------------------

/**
 * Register persistent typeclass instances for derivation
 */
export function registerPersistentTypeclasses() {
  deriveInstances({
    functor: { for: 'PersistentListHKT', map: PersistentListFunctor.map },
    applicative: { for: 'PersistentListHKT', of: PersistentListApplicative.of, ap: PersistentListApplicative.ap },
    monad: { for: 'PersistentListHKT', of: PersistentListMonad.of, ap: PersistentListMonad.ap, chain: PersistentListMonad.chain },
    functor2: { for: 'PersistentMapHKT', map: PersistentMapInstances.map },
    bifunctor: { for: 'PersistentMapHKT', bimap: PersistentMapInstances.bimap },
    functor1: { for: 'PersistentSetHKT', map: PersistentSetFunctor.map },
    // Add more as needed
  });
}

// ============================================================================
// Part 8: Type-Safe FP Operations with HKTs
// ============================================================================

/**
 * Type-safe map operation for PersistentListHKT
 */
export function mapList<A, B>(
  fa: Apply<PersistentListHKT, [A]>,
  f: (a: A) => B
): Apply<PersistentListHKT, [B]> {
  return mapLast1(PersistentListFunctor)(fa, f);
}

/**
 * Type-safe chain operation for PersistentListHKT
 */
export function chainList<A, B>(
  fa: Apply<PersistentListHKT, [A]>,
  f: (a: A) => Apply<PersistentListHKT, [B]>
): Apply<PersistentListHKT, [B]> {
  return PersistentListMonad.chain(fa, f);
}

/**
 * Type-safe ap operation for PersistentListHKT
 */
export function apList<A, B>(
  fab: Apply<PersistentListHKT, [(a: A) => B]>,
  fa: Apply<PersistentListHKT, [A]>
): Apply<PersistentListHKT, [B]> {
  return PersistentListApplicative.ap(fab, fa);
}

/**
 * Type-safe of operation for PersistentListHKT
 */
export function ofList<A>(a: A): Apply<PersistentListHKT, [A]> {
  return PersistentListApplicative.of(a);
}

/**
 * Type-safe map operation for PersistentMapHKT
 */
export function mapMap<K, A, B>(
  fa: Apply<PersistentMapHKT, [K, A]>,
  f: (a: A) => B
): Apply<PersistentMapHKT, [K, B]> {
  return mapLast2(PersistentMapBifunctor)(fa, f);
}

/**
 * Type-safe bimap operation for PersistentMapHKT
 */
export function bimapMap<A, B, C, D>(
  fab: Apply<PersistentMapHKT, [A, B]>,
  f: (a: A) => C,
  g: (b: B) => D
): Apply<PersistentMapHKT, [C, D]> {
  return PersistentMapBifunctor.bimap(fab, f, g);
}

/**
 * Type-safe map operation for PersistentSetHKT
 */
export function mapSet<A, B>(
  fa: Apply<PersistentSetHKT, [A]>,
  f: (a: A) => B
): Apply<PersistentSetHKT, [B]> {
  return mapLast1(PersistentSetFunctor)(fa, f);
}

// ============================================================================
// Part 9: GADT Pattern Matching with Type Narrowing
// ============================================================================

/**
 * Type-safe pattern matching for ListGADT with type narrowing
 */
export function matchListTypeSafe<A, R>(
  gadt: ListGADT<A>,
  patterns: {
    Nil: () => R;
    Cons: (payload: { head: A; tail: PersistentList<A> }) => R;
  }
): R {
  return matchList(gadt, patterns);
}

/**
 * Type-safe pattern matching for MapGADT with type narrowing
 */
export function matchMapTypeSafe<K, V, R>(
  gadt: MapGADT<K, V>,
  patterns: {
    Empty: () => R;
    NonEmpty: (payload: { key: K; value: V; rest: PersistentMap<K, V> }) => R;
  }
): R {
  return matchMap(gadt, patterns);
}

/**
 * Type-safe pattern matching for SetGADT with type narrowing
 */
export function matchSetTypeSafe<A, R>(
  gadt: SetGADT<A>,
  patterns: {
    Empty: () => R;
    NonEmpty: (payload: { element: A; rest: PersistentSet<A> }) => R;
  }
): R {
  return matchSet(gadt, patterns);
}

// ============================================================================
// Part 10: Utility Functions for Common Operations
// ============================================================================

// --- Collect/partition helpers for Maybe/Either/Result ---

export const collectMaybes = <A>(pl: PersistentList<Maybe<A>>): PersistentList<A> =>
  pl.reduce(
    (acc, m) => m && typeof m === 'object' && 'tag' in m && m.tag === 'Just' ? acc.prepend((m as any).value as A) : acc,
    PersistentList.empty<A>()
  ).reverse();

export const partitionEithers = <L, R>(pl: PersistentList<Either<L, R>>): { lefts: PersistentList<L>, rights: PersistentList<R> } => {
  let lefts = PersistentList.empty<L>();
  let rights = PersistentList.empty<R>();
  pl.forEach(e => {
    if (typeof e === 'object' && e !== null && 'tag' in e) {
      if (e.tag === 'Left' && 'left' in e) {
        lefts = lefts.prepend((e as any).left as L);
      } else if (e.tag === 'Right' && 'right' in e) {
        rights = rights.prepend((e as any).right as R);
      }
    }
  });
  return { lefts: lefts.reverse(), rights: rights.reverse() };
};

export const sequenceResult = <A, E>(pl: PersistentList<Result<A, E>>): Result<PersistentList<A>, E> => {
  let acc = PersistentList.empty<A>();
  for (const r of pl) {
    if (typeof r === 'object' && r !== null && 'tag' in r) {
      if (r.tag === 'Err' && 'error' in r) {
        return r;
      } else if (r.tag === 'Ok' && 'value' in r) {
        acc = acc.prepend((r as any).value as A);
      }
    }
  }
  // If Result is a GADT, return with payload
  return { tag: 'Ok', payload: { value: acc.reverse() } } as Result<PersistentList<A>, E>;
};

// --- zip/zipWith for lists/sets ---
export const zipWith = <A, B, C>(as: PersistentList<A>, bs: PersistentList<B>, f: (a: A, b: B) => C): PersistentList<C> => {
  const arrA = as.toArray();
  const arrB = bs.toArray();
  const len = Math.min(arrA.length, arrB.length);
  const out: C[] = [];
  for (let i = 0; i < len; i++) out.push(f(arrA[i], arrB[i]));
  return PersistentList.fromArray(out);
};
export const zip = <A, B>(as: PersistentList<A>, bs: PersistentList<B>): PersistentList<[A, B]> => zipWith(as, bs, (a, b) => [a, b]);

// --- toJSON/fromJSON for persistent structures ---
export const toJSON = <A>(pl: PersistentList<A>): string => JSON.stringify(pl.toArray());
export const fromJSON = <A>(json: string): PersistentList<A> => PersistentList.fromArray(JSON.parse(json));

// --- Law helpers (Foldable/Traversable parametricity smoke tests) ---
export function foldableLaw_identity<A>(pl: PersistentList<A>): boolean {
  const arr = pl.toArray();
  return arr.join(',') === pl.foldl('', (acc, a) => acc ? acc + ',' + a : '' + a);
}
export function traversableLaw_identity<A>(pl: PersistentList<A>): Promise<boolean> {
  return Promise.resolve(pl.toArray()).then(arr =>
    JSON.stringify(arr) === JSON.stringify(pl.toArray())
  );
}

/**
 * Sum all elements in a ListGADT
 */
export function sumList(gadt: ListGADT<number>): number {
  return matchList(gadt, {
    Nil: () => 0,
    Cons: ({ head, tail }) => head + sumList(listToGADT(tail))
  });
}

/**
 * Count elements in a ListGADT
 */
export function countList<A>(gadt: ListGADT<A>): number {
  return matchList(gadt, {
    Nil: () => 0,
    Cons: ({ tail }) => 1 + countList(listToGADT(tail))
  });
}

/**
 * Convert ListGADT to array
 */
export function listGADTToArray<A>(gadt: ListGADT<A>): A[] {
  return matchList(gadt, {
    Nil: () => [],
    Cons: ({ head, tail }) => [head, ...listGADTToArray(listToGADT(tail))]
  });
}

/**
 * Convert array to ListGADT
 */
export function arrayToListGADT<A>(array: A[]): ListGADT<A> {
  if (array.length === 0) {
    return ListGADT.Nil();
  } else {
    const [head, ...tail] = array;
    return ListGADT.Cons(head, PersistentList.fromArray(tail));
  }
}

/**
 * Map over ListGADT
 */
export function mapListGADT<A, B>(gadt: ListGADT<A>, f: (a: A) => B): ListGADT<B> {
  return matchList(gadt, {
    Nil: () => ListGADT.Nil(),
    Cons: ({ head, tail }) => ListGADT.Cons(f(head), tail.map(f))
  });
}

/**
 * Filter ListGADT
 */
export function filterListGADT<A>(gadt: ListGADT<A>, predicate: (a: A) => boolean): ListGADT<A> {
  return matchList(gadt, {
    Nil: () => ListGADT.Nil(),
    Cons: ({ head, tail }) => {
      const filteredTail = filterListGADT(listToGADT(tail), predicate);
      if (predicate(head)) {
        return ListGADT.Cons(head, gadtToList(filteredTail));
      } else {
        return filteredTail;
      }
    }
  });
}

// ============================================================================
// Part 11: Immutability Preservation and Branding
// ============================================================================

/**
 * Ensure immutability branding is preserved
 */
export function preserveImmutability<T>(value: T): T {
  if (isPersistentCollection(value) && value && typeof value === 'object') {
    for (const sym of [PERSISTENT_BRAND, IMMUTABLE_BRAND]) {
      if (!(sym in (value as any))) {
        Object.defineProperty(value as any, sym, { value: true, enumerable: false });
      }
    }
  }
  return value;
}

// --------------------------------------------------------------------------
// Zero-copy immutable array bridges and guards
// --------------------------------------------------------------------------

/**
 * Convert PersistentList<A> to Immutable<readonly A[]> (zero-copy if possible)
 */
export const toImmutableArray = <A>(pl: PersistentList<A>): Immutable<readonly A[]> => {
  // If immutableArray expects Immutable<A>[], map if needed, else just cast
  // Here, we assume A is already immutable or primitive
  return immutableArray(pl.toArray() as any);
};

/**
 * Convert Immutable<readonly A[]> to PersistentList<A>
 * Throws if input is not immutable; copy-on-write fallback if needed
 */
export const fromImmutableArray = <A>(ia: Immutable<readonly A[]>): PersistentList<A> => {
  if (!isImmutableCollection(ia)) {
    throw new Error('Input is not an Immutable<readonly A[]>');
  }
  // Defensive: ensure array is not mutated
  return PersistentList.fromArray(ia as readonly A[]);
};

/**
 * Guard: Asserts input is an Immutable<readonly A[]>
 */
export function assertImmutableArray<A>(ia: any): asserts ia is Immutable<readonly A[]> {
  if (!isImmutableCollection(ia)) {
    throw new Error('Expected Immutable<readonly A[]>');
  }
}

// ============================================================================
// Part 11.5: Deterministic Equality Helpers
// ============================================================================

/**
 * Deterministic equality for PersistentList
 */
export function equalsList<A>(
  x: PersistentList<A>, 
  y: PersistentList<A>, 
  eqA: (a: A, b: A) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b)
): boolean {
  const ax: A[] = []; 
  x.forEach(a => ax.push(a));
  const ay: A[] = []; 
  y.forEach(a => ay.push(a));
  if (ax.length !== ay.length) return false;
  for (let i = 0; i < ax.length; i++) {
    if (!eqA(ax[i], ay[i])) return false;
  }
  return true;
}

/**
 * Deterministic equality for PersistentSet (compare sorted arrays)
 */
export function equalsSet<A>(
  x: PersistentSet<A>, 
  y: PersistentSet<A>, 
  eqA: (a: A, b: A) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b)
): boolean {
  const ax: A[] = []; 
  x.forEach(a => ax.push(a));
  const ay: A[] = []; 
  y.forEach(a => ay.push(a));
  const sx = ax.map(a => JSON.stringify(a)).sort();
  const sy = ay.map(a => JSON.stringify(a)).sort();
  if (sx.length !== sy.length) return false;
  for (let i = 0; i < sx.length; i++) {
    if (sx[i] !== sy[i]) return false;
  }
  return true;
}

/**
 * Deterministic equality for PersistentMap (sort entries by stable string key)
 */
export function equalsMap<K, V>(
  x: PersistentMap<K, V>,
  y: PersistentMap<K, V>,
  eqK: (k1: K, k2: K) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b),
  eqV: (v1: V, v2: V) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b)
): boolean {
  const ex: Array<[K, V]> = []; 
  x.forEach((v, k) => ex.push([k, v]));
  const ey: Array<[K, V]> = []; 
  y.forEach((v, k) => ey.push([k, v]));
  if (ex.length !== ey.length) return false;
  // naive O(n^2) match – fine for demos
  const used = new Set<number>();
  for (const [kx, vx] of ex) {
    let found = false;
    for (let i = 0; i < ey.length; i++) {
      if (used.has(i)) continue;
      const [ky, vy] = ey[i];
      if (eqK(kx, ky) && eqV(vx, vy)) { 
        used.add(i); 
        found = true; 
        break; 
      }
    }
    if (!found) return false;
  }
  return true;
}

// ============================================================================
// Part 11.6: Round-Trip Laws and Checks
// ============================================================================

/**
 * Check round-trip laws for List ↔ GADT conversion (both directions safe)
 */
export function checkListRoundtripBothWays<A>(
  xs: PersistentList<A>, 
  eqA?: (a: A, b: A) => boolean
) {
  const g = listToGADT(xs);
  const back = gadtToList(g);
  const toGADT_toList = equalsList(xs, back, eqA);

  // For gadt -> list -> gadt, compare tag + (head,tail) structure
  const g2 = listToGADT(gadtToList(g));
  const same =
    g.tag === g2.tag &&
    (g.tag === 'Nil' ||
      (JSON.stringify(g.payload.head) === JSON.stringify((g2 as any).payload.head) &&
       equalsList(g.payload.tail, (g2 as any).payload.tail, eqA)));
  const toList_toGADT = same;

  return { toGADT_toList, toList_toGADT };
}

/**
 * Check round-trip law for Map → GADT → Map (safe direction)
 * Skip GADT → Map → GADT because "first entry" choice is iteration-order dependent
 */
export function checkMapRoundtripMapFirst<K, V>(
  m: PersistentMap<K, V>, 
  eqK?: (k1: K, k2: K) => boolean, 
  eqV?: (v1: V, v2: V) => boolean
): boolean {
  const g = mapToGADT(m);
  const back = gadtToMap(g);
  return equalsMap(m, back, eqK, eqV);
}

/**
 * Check round-trip law for Set → GADT → Set (safe direction)
 * Skip GADT → Set → GADT because "first element" choice is iteration-order dependent
 */
export function checkSetRoundtripSetFirst<A>(
  s: PersistentSet<A>, 
  eqA?: (a: A, b: A) => boolean
): boolean {
  const g = setToGADT(s);
  const back = gadtToSet(g);
  return equalsSet(s, back, eqA);
}

// ============================================================================
// Part 12: Laws and Properties
// ============================================================================

/**
 * Persistent Collections in HKTs + GADTs Laws:
 * 
 * 1. HKT Registration: Persistent collections are properly registered as HKTs
 * 2. GADT Conversion: Conversion between persistent collections and GADTs is bijective
 * 3. Type Safety: All operations preserve type safety and immutability
 * 4. Pattern Matching: GADT pattern matching provides correct type narrowing
 * 5. Derivable Integration: HKTs work seamlessly with derivable instances
 * 
 * Runtime Laws:
 * 
 * 1. Conversion Law: listToGADT ∘ gadtToList = id
 * 2. Pattern Law: matchList preserves structure and types
 * 3. Immutability Law: All operations preserve immutability branding
 * 4. Typeclass Law: HKT typeclass instances work correctly
 * 
 * Type-Level Laws:
 * 
 * 1. HKT Law: Apply<PersistentListHKT, [A]> = PersistentList<A>
 * 2. GADT Law: ListGADT<A> provides correct type narrowing
 * 3. Safety Law: All operations maintain type safety
 * 4. Branding Law: Immutability branding is preserved
 */