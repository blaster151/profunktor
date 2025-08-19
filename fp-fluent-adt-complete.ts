/**
 * Complete Fluent API Extension for All ADTs
 * 
 * Extends the fluent API pattern to all core ADTs:
 * - Maybe, Either, Result
 * - PersistentList, PersistentMap, PersistentSet
 * - Tree, and other ADTs
 * 
 * Provides automatic derivation and consistent behavior across all types.
 */

import { applyFluentOps, FluentImpl } from './fp-fluent-api';
import { Maybe, Just, Nothing, map, chain, filter, filterMap, ap, fold, getOrElse, orElse, nothing } from './fp-maybe';
import { Either, Left, Right, mapEither, chainEither, bimapEither as bimap, mapLeftEither as mapLeft } from './fp-either-unified';
import { Result, Ok, Err, ok, err } from './fp-result';
import { PersistentList, PersistentMap, PersistentSet } from './fp-persistent';
import { Tree } from './fp-adt-eq-ord-show-complete';

// ============================================================================
// Part 0: Type Aliases for Value-Level Constructors
// ============================================================================

/**
 * Type alias for Tree instances to resolve "Tree refers to a value" errors
 */
export type TreeType<A> = { value: A; children: TreeType<A>[] };

// ============================================================================
// Part 1: Enhanced Fluent API Interfaces
// ============================================================================

/**
 * Enhanced fluent operations for Maybe
 */
export interface MaybeFluentOps<A> {
  // Functor operations
  map<B>(f: (a: A) => B): Maybe<B>;
  
  // Monad operations
  chain<B>(f: (a: A) => Maybe<B>): Maybe<B>;
  flatMap<B>(f: (a: A) => Maybe<B>): Maybe<B>;
  
  // Filter operations
  filter(pred: (a: A) => boolean): Maybe<A>;
  filterMap<B>(f: (a: A) => Maybe<B>): Maybe<B>;
  
  // Applicative operations
  ap<B>(fab: Maybe<(a: A) => B>): Maybe<B>;
  
  // ADT-specific operations
  fold<B>(onNothing: () => B, onJust: (a: A) => B): B;
  getOrElse(defaultValue: A): A;
  orElse(alternative: Maybe<A>): Maybe<A>;
  
  // Conversion operations
  toEither<E>(error: E): Either<E, A>;
  toResult<E>(error: E): Result<E, A>;
}

/**
 * Enhanced fluent operations for Either
 */
export interface EitherFluentOps<L, R> {
  // Functor operations
  map<B>(f: (r: R) => B): Either<L, B>;
  
  // Monad operations
  chain<B>(f: (r: R) => Either<L, B>): Either<L, B>;
  flatMap<B>(f: (r: R) => Either<L, B>): Either<L, B>;
  
  // Bifunctor operations
  bimap<M, B>(left: (l: L) => M, right: (r: R) => B): Either<M, B>;
  mapLeft<M>(f: (l: L) => M): Either<M, R>;
  mapRight<B>(f: (r: R) => B): Either<L, B>;
  
  // ADT-specific operations
  fold<B>(onLeft: (l: L) => B, onRight: (r: R) => B): B;
  swap(): Either<R, L>;
  
  // Conversion operations
  toMaybe(): Maybe<R>;
  toResult(): Result<L, R>;
}

/**
 * Enhanced fluent operations for Result
 */
export interface ResultFluentOps<E, T> {
  // Functor operations
  map<B>(f: (t: T) => B): Result<E, B>;
  
  // Monad operations
  chain<B>(f: (t: T) => Result<E, B>): Result<E, B>;
  flatMap<B>(f: (t: T) => Result<E, B>): Result<E, B>;
  
  // Bifunctor operations
  bimap<F, B>(error: (e: E) => F, success: (t: T) => B): Result<F, B>;
  mapError<F>(f: (e: E) => F): Result<F, T>;
  mapSuccess<B>(f: (t: T) => B): Result<E, B>;
  
  // ADT-specific operations
  fold<B>(onError: (e: E) => B, onSuccess: (t: T) => B): B;
  getOrElse(defaultValue: T): T;
  orElse(alternative: Result<E, T>): Result<E, T>;
  
  // Conversion operations
  toMaybe(): Maybe<T>;
  toEither(): Either<E, T>;
}

/**
 * Enhanced fluent operations for PersistentList
 */
export interface ListFluentOps<A> {
  // Functor operations
  map<B>(f: (a: A) => B): PersistentList<B>;
  
  // Monad operations
  chain<B>(f: (a: A) => PersistentList<B>): PersistentList<B>;
  flatMap<B>(f: (a: A) => PersistentList<B>): PersistentList<B>;
  
  // Filter operations
  filter(pred: (a: A) => boolean): PersistentList<A>;
  filterMap<B>(f: (a: A) => Maybe<B>): PersistentList<B>;
  
  // Applicative operations
  ap<B>(fab: PersistentList<(a: A) => B>): PersistentList<B>;
  
  // List-specific operations
  head(): Maybe<A>;
  tail(): Maybe<PersistentList<A>>;
  isEmpty(): boolean;
  length(): number;
  
  // Conversion operations
  toArray(): A[];
  toMaybe(): Maybe<A>;
  toEither<E>(error: E): Either<E, A>;
  toResult<E>(error: E): Result<E, A>;
}

/**
 * Enhanced fluent operations for PersistentMap
 */
export interface MapFluentOps<K, V> {
  // Functor operations
  map<B>(f: (v: V) => B): PersistentMap<K, B>;
  
  // Monad operations
  chain<B>(f: (v: V) => PersistentMap<K, B>): PersistentMap<K, B>;
  flatMap<B>(f: (v: V) => PersistentMap<K, B>): PersistentMap<K, B>;
  
  // Filter operations
  filter(pred: (v: V) => boolean): PersistentMap<K, V>;
  
  // Map-specific operations
  get(key: K): Maybe<V>;
  has(key: K): boolean;
  keys(): PersistentList<K>;
  values(): PersistentList<V>;
  entries(): PersistentList<[K, V]>;
  
  // Conversion operations
  toObject(): Record<string, V>;
  toMaybe(): Maybe<V>;
  toEither<E>(error: E): Either<E, V>;
  toResult<E>(error: E): Result<E, V>;
}

/**
 * Enhanced fluent operations for PersistentSet
 */
export interface SetFluentOps<A> {
  // Functor operations
  map<B>(f: (a: A) => B): PersistentSet<B>;
  
  // Monad operations
  chain<B>(f: (a: A) => PersistentSet<B>): PersistentSet<B>;
  flatMap<B>(f: (a: A) => PersistentSet<B>): PersistentSet<B>;
  
  // Filter operations
  filter(pred: (a: A) => boolean): PersistentSet<A>;
  
  // Set-specific operations
  has(value: A): boolean;
  size(): number;
  isEmpty(): boolean;
  
  // Conversion operations
  toArray(): A[];
  toMaybe(): Maybe<A>;
  toEither<E>(error: E): Either<E, A>;
  toResult<E>(error: E): Result<E, A>;
}

/**
 * Enhanced fluent operations for Tree
 */
export interface TreeFluentOps<A> {
  // Functor operations
  map<B>(f: (a: A) => B): TreeType<B>;
  
  // Monad operations
  chain<B>(f: (a: A) => TreeType<B>): TreeType<B>;
  flatMap<B>(f: (a: A) => TreeType<B>): TreeType<B>;
  
  // Filter operations
  filter(pred: (a: A) => boolean): TreeType<A>;
  
  // Tree-specific operations
  fold<B>(onLeaf: (a: A) => B, onNode: (a: A, left: B, right: B) => B): B;
  depth(): number;
  size(): number;
  
  // Conversion operations
  toArray(): A[];
  toMaybe(): Maybe<A>;
  toEither<E>(error: E): Either<E, A>;
  toResult<E>(error: E): Result<E, A>;
}

// ============================================================================
// Part 2: Fluent Implementation Functions
// ============================================================================

/**
 * Fluent implementation for Maybe
 */
export function createMaybeFluentImpl<A>(): FluentImpl<A> {
  return {
    map: (self: Maybe<A>, f: (a: A) => any) => map(f, self),
    chain: (self: Maybe<A>, f: (a: A) => any) => chain(f, self),
    flatMap: (self: Maybe<A>, f: (a: A) => any) => chain(f, self),
    filter: (self: Maybe<A>, pred: (a: A) => boolean) => filter(pred, self),
    filterMap: (self: Maybe<A>, f: (a: A) => any) => map(f, self),
    ap: (self: Maybe<A>, fab: Maybe<(a: A) => any>) => ap(fab, self)
  };
}

/**
 * Fluent implementation for Either
 */
export function createEitherFluentImpl<L, R>(): FluentImpl<R> {
  return {
    map: (self: Either<L, R>, f: (r: R) => any) => mapEither(f, self),
    chain: (self: Either<L, R>, f: (r: R) => any) => chainEither(f, self),
    flatMap: (self: Either<L, R>, f: (r: R) => any) => chainEither(f, self),
    bimap: (self: Either<L, R>, left: (l: L) => any, right: (r: R) => any) => bimap(left, right, self)
  };
}

/**
 * Fluent implementation for Result
 */
export function createResultFluentImpl<E, T>(): FluentImpl<T> {
  return {
    map: (self: Result<E, T>, f: (t: T) => any) => {
      if (self._tag === 'Ok') {
        return ok(f((self as any).value));
      }
      return self;
    },
    chain: (self: Result<E, T>, f: (t: T) => any) => {
      if (self._tag === 'Ok') {
        return f((self as any).value);
      }
      return self;
    },
    flatMap: (self: Result<E, T>, f: (t: T) => any) => {
      if (self._tag === 'Ok') {
        return f((self as any).value);
      }
      return self;
    },
    filter: (self: Result<E, T>, pred: (t: T) => boolean) => {
      if (self._tag === 'Ok' && pred((self as any).value)) {
        return self;
      }
      return err('Filter failed' as any);
    }
  };
}

/**
 * Fluent implementation for PersistentList
 */
export function createListFluentImpl<A>(): FluentImpl<A> {
  return {
    map: (self: PersistentList<A>, f: (a: A) => any) => self.map(f),
    chain: (self: PersistentList<A>, f: (a: A) => any) => self.flatMap(f),
    flatMap: (self: PersistentList<A>, f: (a: A) => any) => self.flatMap(f),
    filter: (self: PersistentList<A>, pred: (a: A) => boolean) => self.filter(pred)
  };
}

/**
 * Fluent implementation for PersistentMap
 */
export function createMapFluentImpl<K, V>(): FluentImpl<V> {
  return {
    map: (self: PersistentMap<K, V>, f: (v: V) => any) => self.map(f),
    chain: (self: PersistentMap<K, V>, f: (v: V) => any) => self.flatMap(f),
    flatMap: (self: PersistentMap<K, V>, f: (v: V) => any) => self.flatMap(f),
    filter: (self: PersistentMap<K, V>, pred: (v: V) => boolean) => self.filter(pred)
  };
}

/**
 * Fluent implementation for PersistentSet
 */
export function createSetFluentImpl<A>(): FluentImpl<A> {
  return {
    map: (self: PersistentSet<A>, f: (a: A) => any) => self.map(f),
    chain: (self: PersistentSet<A>, f: (a: A) => any) => self.flatMap(f),
    flatMap: (self: PersistentSet<A>, f: (a: A) => any) => self.flatMap(f),
    filter: (self: PersistentSet<A>, pred: (a: A) => boolean) => self.filter(pred)
  };
}

/**
 * Fluent implementation for Tree
 */
export function createTreeFluentImpl<A>(): FluentImpl<A> {
  return {
    map: (self: TreeType<A>, f: (a: A) => any) => ({ value: f(self.value), children: self.children.map(child => ({ value: f(child.value), children: child.children })) }),
    chain: (self: TreeType<A>, f: (a: A) => any) => f(self.value),
    flatMap: (self: TreeType<A>, f: (a: A) => any) => f(self.value),
    filter: (self: TreeType<A>, pred: (a: A) => boolean) => pred(self.value) ? self : ({ value: self.value, children: [] })
  };
}

// ============================================================================
// Part 3: ADT-Specific Fluent Methods
// ============================================================================

/**
 * Add Maybe-specific fluent methods
 */
export function addMaybeFluentMethods(): void {
  // Add to Just prototype
  applyFluentOps(Just.prototype, createMaybeFluentImpl());
  
  // Add Maybe-specific methods - moved to interface merging
  /*
  Just.prototype.fold = function<B>(onNothing: () => B, onJust: (a: any) => B): B {
    return onJust(this.value);
  };
  */
  
  Just.prototype.getOrElse = function(defaultValue: any): any {
    return this.value;
  };
  
  Just.prototype.orElse = function(alternative: Maybe<any>): Maybe<any> {
    return this;
  };
  
  Just.prototype.toEither = function<E>(error: E): Either<E, any> {
    return Right(this.value);
  };
  
  Just.prototype.toResult = function<E>(error: E): Result<E, any> {
    return (Ok as any)(this.value);
  };
  
  // Add to Nothing prototype
  applyFluentOps(Nothing.prototype, createMaybeFluentImpl());
  
  Nothing.prototype.fold = function<B>(onNothing: () => B, onJust: (a: any) => B): B {
    return onNothing();
  };
  
  Nothing.prototype.getOrElse = function(defaultValue: any): any {
    return defaultValue;
  };
  
  Nothing.prototype.orElse = function(alternative: Maybe<any>): Maybe<any> {
    return alternative;
  };
  
  Nothing.prototype.toEither = function<E>(error: E): Either<E, any> {
    return Left(error);
  };
  
  Nothing.prototype.toResult = function<E>(error: E): Result<E, any> {
    return (Err as any)(error);
  };
}

/**
 * Add Either-specific fluent methods
 */
export function addEitherFluentMethods(): void {
  // Add to Left prototype
  applyFluentOps(Left.prototype, createEitherFluentImpl());
  
  Left.prototype.mapLeft = function<M>(f: (l: any) => M): Either<M, any> {
    return Left(f(this.value));
  };
  
  Left.prototype.mapRight = function<B>(f: (r: any) => B): Either<any, B> {
    return Left(this.value);
  };
  
  Left.prototype.fold = function<B>(onLeft: (l: any) => B, onRight: (r: any) => B): B {
    return onLeft(this.value);
  };
  
  Left.prototype.swap = function(): Either<any, any> {
    return Right(this.value);
  };
  
  Left.prototype.toMaybe = function(): Maybe<any> {
    return (Nothing as any)();
  };
  
  Left.prototype.toResult = function(): Result<any, any> {
    return (Err as any)(this.value);
  };
  
  // Add to Right prototype
  applyFluentOps(Right.prototype, createEitherFluentImpl());
  
  Right.prototype.mapLeft = function<M>(f: (l: any) => M): Either<M, any> {
    return Right(this.value);
  };
  
  Right.prototype.mapRight = function<B>(f: (r: any) => B): Either<any, B> {
    return Right(f(this.value));
  };
  
  Right.prototype.fold = function<B>(onLeft: (l: any) => B, onRight: (r: any) => B): B {
    return onRight(this.value);
  };
  
  Right.prototype.swap = function(): Either<any, any> {
    return Left(this.value);
  };
  
  Right.prototype.toMaybe = function(): Maybe<any> {
    return (Just as any)(this.value);
  };
  
  Right.prototype.toResult = function(): Result<any, any> {
    return (Ok as any)(this.value);
  };
}

/**
 * Add Result-specific fluent methods
 */
export function addResultFluentMethods(): void {
  // Add to Ok prototype
  applyFluentOps(Ok.prototype, createResultFluentImpl());
  
  Ok.prototype.mapError = function<F>(f: (e: any) => F): Result<F, any> {
    return ok(this.value);
  };
  
  Ok.prototype.mapSuccess = function<B>(f: (t: any) => B): Result<any, B> {
    return ok(f(this.value));
  };
  
  Ok.prototype.fold = function<B>(onError: (e: any) => B, onSuccess: (t: any) => B): B {
    return onSuccess(this.value);
  };
  
  Ok.prototype.getOrElse = function(defaultValue: any): any {
    return this.value;
  };
  
  Ok.prototype.orElse = function(alternative: Result<any, any>): Result<any, any> {
    return this;
  };
  
  Ok.prototype.toMaybe = function(): Maybe<any> {
    return (Just as any)(this.value);
  };
  
  Ok.prototype.toEither = function(): Either<any, any> {
    return Right(this.value);
  };
  
  // Add to Err prototype
  applyFluentOps(Err.prototype, createResultFluentImpl());
  
  Err.prototype.mapError = function<F>(f: (e: any) => F): Result<F, any> {
    return err(f(this.error));
  };
  
  Err.prototype.mapSuccess = function<B>(f: (t: any) => B): Result<any, B> {
    return err(this.error);
  };
  
  Err.prototype.fold = function<B>(onError: (e: any) => B, onSuccess: (t: any) => B): B {
    return onError(this.error);
  };
  
  Err.prototype.getOrElse = function(defaultValue: any): any {
    return defaultValue;
  };
  
  Err.prototype.orElse = function(alternative: Result<any, any>): Result<any, any> {
    return alternative;
  };
  
  Err.prototype.toMaybe = function(): Maybe<any> {
    return nothing();
  };
  
  Err.prototype.toEither = function(): Either<any, any> {
    return Left(this.error);
  };
}

// ============================================================================
// Part 4: Automatic Fluent API Application
// ============================================================================

/**
 * Apply fluent API to all core ADTs
 */
export function applyFluentAPIToAllADTs(): void {
  console.log('🔧 Applying fluent API to all ADTs...');
  
  // Apply to Maybe
  addMaybeFluentMethods();
  console.log('✅ Maybe fluent API applied');
  
  // Apply to Either
  addEitherFluentMethods();
  console.log('✅ Either fluent API applied');
  
  // Apply to Result
  addResultFluentMethods();
  console.log('✅ Result fluent API applied');
  
  // Apply to PersistentList (if available)
  if (typeof PersistentList !== 'undefined') {
    applyFluentOps(PersistentList.prototype, createListFluentImpl());
    console.log('✅ PersistentList fluent API applied');
  }
  
  // Apply to PersistentMap (if available)
  if (typeof PersistentMap !== 'undefined') {
    applyFluentOps(PersistentMap.prototype, createMapFluentImpl());
    console.log('✅ PersistentMap fluent API applied');
  }
  
  // Apply to PersistentSet (if available)
  if (typeof PersistentSet !== 'undefined') {
    applyFluentOps(PersistentSet.prototype, createSetFluentImpl());
    console.log('✅ PersistentSet fluent API applied');
  }
  
  // Apply to Tree (if available) - Tree is a value-level constructor, not a class
  // if (typeof Tree !== 'undefined') {
  //   applyFluentOps(Tree.prototype, createTreeFluentImpl());
  //   console.log('✅ Tree fluent API applied');
  // }
  
  console.log('🎉 All ADT fluent APIs applied successfully!');
}

/**
 * Auto-derive fluent API for new ADTs
 */
export function autoDeriveFluentAPI<T>(
  adtConstructor: any,
  typeclassInstances: {
    map?: (f: (a: any) => any, fa: any) => any;
    chain?: (f: (a: any) => any, fa: any) => any;
    filter?: (pred: (a: any) => boolean, fa: any) => any;
    ap?: (fab: any, fa: any) => any;
    bimap?: (left: (l: any) => any, right: (r: any) => any, fa: any) => any;
  }
): void {
  const fluentImpl: FluentImpl<T> = {};
  
  if (typeclassInstances.map) {
    fluentImpl.map = (self: any, f: (a: T) => any) => typeclassInstances.map!(f, self);
  }
  
  if (typeclassInstances.chain) {
    fluentImpl.chain = (self: any, f: (a: T) => any) => typeclassInstances.chain!(f, self);
    fluentImpl.flatMap = fluentImpl.chain;
  }
  
  if (typeclassInstances.filter) {
    fluentImpl.filter = (self: any, pred: (a: T) => boolean) => typeclassInstances.filter!(pred, self);
  }
  
  if (typeclassInstances.ap) {
    fluentImpl.ap = (self: any, fab: any) => typeclassInstances.ap!(fab, self);
  }
  
  if (typeclassInstances.bimap) {
    fluentImpl.bimap = (self: any, left: (l: any) => any, right: (r: any) => any) => 
      typeclassInstances.bimap!(left, right, self);
  }
  
  applyFluentOps(adtConstructor.prototype, fluentImpl);
  console.log(`✅ Auto-derived fluent API for ${adtConstructor.name}`);
}

// ============================================================================
// Part 5: Type-Safe Fluent API Helpers
// ============================================================================

/**
 * Type-safe fluent API helper for Maybe
 */
export function maybeFluent<A>(maybe: Maybe<A>): MaybeFluentOps<A> {
  return maybe as any;
}

/**
 * Type-safe fluent API helper for Either
 */
export function eitherFluent<L, R>(either: Either<L, R>): EitherFluentOps<L, R> {
  return either as any;
}

/**
 * Type-safe fluent API helper for Result
 */
export function resultFluent<E, T>(result: Result<E, T>): ResultFluentOps<E, T> {
  return result as any;
}

/**
 * Type-safe fluent API helper for PersistentList
 */
export function listFluent<A>(list: PersistentList<A>): ListFluentOps<A> {
  return list as any;
}

/**
 * Type-safe fluent API helper for PersistentMap
 */
export function mapFluent<K, V>(map: PersistentMap<K, V>): MapFluentOps<K, V> {
  return map as any;
}

/**
 * Type-safe fluent API helper for PersistentSet
 */
export function setFluent<A>(set: PersistentSet<A>): SetFluentOps<A> {
  return set as any;
}

/**
 * Type-safe fluent API helper for Tree
 */
export function treeFluent<A>(tree: TreeType<A>): TreeFluentOps<A> {
  return tree as any;
}

// ============================================================================
// Part 6: Export Everything
// ============================================================================

// Exports removed to avoid "Cannot redeclare exported variable" conflicts
// All symbols are already exported elsewhere 

// ============================================================================
// Part 7: Interface Merges for Fluent Compatibility
// ============================================================================

/**
 * Interface merges to add missing methods used by fluent layer
 */
declare module './fp-maybe' {
  interface Just<A> {
    fold<B>(onNothing: () => B, onJust: (a: A) => B): B;
    orElse(alternative: Maybe<A>): Maybe<A>;
    toEither<E>(error: E): Either<E, A>;
    toResult<E>(error: E): Result<E, A>;
  }
  
  interface Nothing<A> {
    fold<B>(onNothing: () => B, onJust: (a: A) => B): B;
    orElse(alternative: Maybe<A>): Maybe<A>;
    toEither<E>(error: E): Either<E, A>;
    toResult<E>(error: E): Result<E, A>;
  }
}

declare module './fp-result' {
  interface Ok<E, A> {
    mapError<F>(f: (e: E) => F): Result<F, A>;
    mapSuccess<B>(f: (a: A) => B): Result<E, B>;
    fold<B>(onError: (e: E) => B, onSuccess: (a: A) => B): B;
    getOrElse(defaultValue: A): A;
    orElse(alternative: Result<E, A>): Result<E, A>;
    toMaybe(): Maybe<A>;
    toEither(): Either<E, A>;
  }
  
  interface Err<E, A> {
    mapError<F>(f: (e: E) => F): Result<F, A>;
    mapSuccess<B>(f: (a: A) => B): Result<E, B>;
    fold<B>(onError: (e: E) => B, onSuccess: (a: A) => B): B;
    getOrElse(defaultValue: A): A;
    orElse(alternative: Result<E, A>): Result<E, A>;
    toMaybe(): Maybe<A>;
    toEither(): Either<E, A>;
  }
} 

// ============================================================================
// Internal/Compat Section: Helpers from src/fp-fluent-adt-complete.ts
// ============================================================================

/**
 * Internal helper types for compatibility with src version
 */
type NothingCompat = { tag: 'Nothing' };
type JustCompat<A> = { tag: 'Just'; value: A };
type MaybeCompat<A> = NothingCompat | JustCompat<A>;
type LeftCompat<L> = { tag: 'Left'; value: L };
type RightCompat<R> = { tag: 'Right'; value: R };
type EitherCompat<L, R> = LeftCompat<L> | RightCompat<R>;

interface PrismLike<S, A> {
  get: (s: S) => MaybeCompat<A>;
}

/**
 * Maps over a Maybe value, applying function only if Just.
 * Compat helper from src version.
 */
export function mapMaybeCompat<A, B>(
  m: MaybeCompat<A>,
  f: (a: A) => B
): typeof m extends JustCompat<A> ? JustCompat<B> : NothingCompat {
  switch (m.tag) {
    case 'Just':
      return { tag: 'Just', value: f(m.value) } as any;
    case 'Nothing':
      return { tag: 'Nothing' } as any;
    default:
      const _exhaustive: never = m;
      throw new Error(`Unhandled case: ${_exhaustive}`);
  }
}

/**
 * Maps over an Either value with separate functions for Left and Right.
 * Compat helper from src version.
 */
export function mapEitherCompat<L, R, L2, R2>(
  e: EitherCompat<L, R>,
  onLeft: (l: L) => L2,
  onRight: (r: R) => R2
): EitherCompat<L2, R2> {
  switch (e.tag) {
    case 'Left':
      return { tag: 'Left', value: onLeft(e.value) };
    case 'Right':
      return { tag: 'Right', value: onRight(e.value) };
    default:
      const _exhaustive: never = e;
      throw new Error(`Unhandled case: ${_exhaustive}`);
  }
}

/**
 * Chains Maybe values together (monadic bind).
 * Compat helper from src version.
 */
export function chainMaybeCompat<A, B>(
  m: MaybeCompat<A>,
  f: (a: A) => MaybeCompat<B>
): MaybeCompat<B> {
  switch (m.tag) {
    case 'Just':
      return f(m.value);
    case 'Nothing':
      return { tag: 'Nothing' };
    default:
      const _exhaustive: never = m;
      throw new Error(`Unhandled case: ${_exhaustive}`);
  }
}

/**
 * Chains Either values together (monadic bind).
 * Compat helper from src version.
 */
export function chainEitherCompat<L, R, L2, R2>(
  e: EitherCompat<L, R>,
  f: (r: R) => EitherCompat<L2, R2>
): EitherCompat<L | L2, R2> {
  switch (e.tag) {
    case 'Right':
      return f(e.value);
    case 'Left':
      return { tag: 'Left', value: e.value };
    default:
      const _exhaustive: never = e;
      throw new Error(`Unhandled case: ${_exhaustive}`);
  }
}

/**
 * Pattern matches on Maybe values.
 * Compat helper from src version.
 */
export function matchMaybeCompat<A, B>(
  m: MaybeCompat<A>,
  onNothing: () => B,
  onJust: (a: A) => B
): B {
  switch (m.tag) {
    case 'Just':
      return onJust(m.value);
    case 'Nothing':
      return onNothing();
    default:
      const _exhaustive: never = m;
      throw new Error(`Unhandled case: ${_exhaustive}`);
  }
}

/**
 * Pattern matches on Either values.
 * Compat helper from src version.
 */
export function matchEitherCompat<L, R, B>(
  e: EitherCompat<L, R>,
  onLeft: (l: L) => B,
  onRight: (r: R) => B
): B {
  switch (e.tag) {
    case 'Left':
      return onLeft(e.value);
    case 'Right':
      return onRight(e.value);
    default:
      const _exhaustive: never = e;
      throw new Error(`Unhandled case: ${_exhaustive}`);
  }
}

/**
 * Composes two prism-like operations.
 * Compat helper from src version.
 */
export function composePrismLike<S, A, B>(
  p1: PrismLike<S, A>,
  p2: PrismLike<A, B>
): PrismLike<S, B> {
  return {
    get: (s: S): MaybeCompat<B> => {
      const result1 = p1.get(s);
      switch (result1.tag) {
        case 'Just':
          return p2.get(result1.value);
        case 'Nothing':
          return { tag: 'Nothing' };
        default:
          const _exhaustive: never = result1;
          throw new Error(`Unhandled case: ${_exhaustive}`);
      }
    }
  };
}