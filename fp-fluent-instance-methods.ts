/**
 * Fluent Instance Methods for Core ADTs
 * 
 * This module implements fluent instance methods (.map, .chain, .filter, etc.) for all core ADTs
 * to support a consistent .map(...).chain(...).filter(...) style API in addition to existing data-last functions.
 * 
 * Requirements:
 * 1. Methods per type's applicable typeclasses
 * 2. Delegate to existing data-last functions
 * 3. Maintain type safety and preserve HKTs
 * 4. Match ObservableLite fluent style
 * 5. Ensure method chaining type-infers correctly
 */

// Fixed imports using canonical modules
import type { MaybeK } from './fp-maybe-unified-enhanced';
import * as E from './fp-either-unified';
import * as R from './fp-result-unified';

import {
  // Import fluent method implementations from complete file to avoid duplication
  addMaybeFluentMethods,
  addEitherFluentMethods, 
  addResultFluentMethods
} from './fp-fluent-adt-complete';

import {
  // ObservableLite (already has fluent methods)
  ObservableLite
} from './fp-observable-lite';

import {
  // Persistent collections
  PersistentList, PersistentMap, PersistentSet
} from './fp-persistent';

import {
  // StatefulStream is now a class; we will not augment its prototype here
  StatefulStream
} from './fp-stream-state';

// ============================================================================
// Part 1: Maybe Fluent Methods
// ============================================================================

/**
 * Add fluent methods to Maybe instances
 * Note: Implementation moved to fp-fluent-adt-complete.ts to avoid duplication
 */

// ============================================================================
// Part 2: Either Fluent Methods
// ============================================================================

/**
 * Add fluent methods to Either instances
 * Note: Implementation moved to fp-fluent-adt-complete.ts to avoid duplication
 */

// ============================================================================
// Part 3: Result Fluent Methods
// ============================================================================

/**
 * Add fluent methods to Result instances
 * Note: Implementation moved to fp-fluent-adt-complete.ts to avoid duplication
 */

// ============================================================================
// Part 4: Persistent Collections Fluent Methods
// ============================================================================

// Local utility functions for persistent collections
function listMap<A, B>(xs: PersistentList<A>, f: (a: A) => B): PersistentList<B> {
  const arr = (xs as any).toArray ? (xs as any).toArray() as A[] : Array.from((xs as any).values?.() ?? []);
  const out = (arr as A[]).map(f);
  return (PersistentList as any).fromArray ? (PersistentList as any).fromArray(out) : (out as any);
}

function listChain<A, B>(xs: PersistentList<A>, f: (a: A) => PersistentList<B>): PersistentList<B> {
  const arr = (xs as any).toArray ? (xs as any).toArray() as A[] : Array.from((xs as any).values?.() ?? []);
  const pieces = (arr as A[]).map(f);
  const joined: B[] = [];
  for (const p of pieces as any[]) {
    const segment = (p as any).toArray ? (p as any).toArray() as B[] : Array.from((p as any).values?.() ?? []);
    joined.push(...(segment as B[]));
  }
  return (PersistentList as any).fromArray ? (PersistentList as any).fromArray(joined) : (joined as any);
}

function listFilter<A>(xs: PersistentList<A>, pred: (a: A) => boolean): PersistentList<A> {
  const arr = (xs as any).toArray ? (xs as any).toArray() as A[] : Array.from((xs as any).values?.() ?? []);
  const out = (arr as A[]).filter(pred);
  return (PersistentList as any).fromArray ? (PersistentList as any).fromArray(out) : (out as any);
}

function mapMap<K, V, V2>(m: PersistentMap<K, V>, f: (v: V) => V2): PersistentMap<K, V2> {
  const entries = Array.from((m as any).entries?.() ?? (m as any)) as [K, V][];
  const out = entries.map(([k, v]) => [k, f(v)]);
  return (PersistentMap as any).fromEntries ? (PersistentMap as any).fromEntries(out) : (out as any);
}

function mapFilter<K, V>(m: PersistentMap<K, V>, pred: (v: V, k: K) => boolean): PersistentMap<K, V> {
  const entries = Array.from((m as any).entries?.() ?? (m as any)) as [K, V][];
  const out = entries.filter(([k, v]) => pred(v, k));
  return (PersistentMap as any).fromEntries ? (PersistentMap as any).fromEntries(out) : (out as any);
}

const MapOf = <K, V>(k: K, v: V): PersistentMap<K, V> =>
  (PersistentMap as any).fromEntries ? (PersistentMap as any).fromEntries([[k, v]]) : ([[k, v]] as any);

const SetOf = <A>(a: A): PersistentSet<A> =>
  (PersistentSet as any).fromArray ? (PersistentSet as any).fromArray([a]) : ([a] as any);

/**
 * Add fluent methods to PersistentList instances
 */
export function addPersistentListFluentMethods(): void {
  if (!PersistentList || typeof PersistentList !== 'function') {
    console.warn('PersistentList constructor not available for fluent augmentation');
    return;
  }

  // Functor methods - adjust signature to match existing map
  (PersistentList.prototype as any).map = function<A, B>(this: PersistentList<A>, f: (a: A, index?: number) => B): PersistentList<B> {
    return listMap(this, f);
  };

  // Applicative methods
  (PersistentList.prototype as any).ap = function<A, B>(this: PersistentList<(a: A) => B>, other: PersistentList<A>): PersistentList<B> {
    return listChain(this, f => listMap(other, a => f(a)));
  };

  // Monad methods
  (PersistentList.prototype as any).chain = function<A, B>(this: PersistentList<A>, f: (a: A) => PersistentList<B>): PersistentList<B> {
    return listChain(this, f);
  };

  // Alias for chain - adjust signature to match existing flatMap
  (PersistentList.prototype as any).flatMap = function<A, B>(this: PersistentList<A>, f: (a: A, index?: number) => PersistentList<B>): PersistentList<B> {
    return listChain(this, f);
  };

  // Filterable methods - adjust signature to match existing filter
  (PersistentList.prototype as any).filter = function<A>(this: PersistentList<A>, predicate: (a: A, index?: number) => boolean): PersistentList<A> {
    return listFilter(this, predicate);
  };

  // Traversable methods
  (PersistentList.prototype as any).traverse = function<A, B>(
    this: PersistentList<A>,
    applicative: any,
    f: (a: A) => any
  ): any {
    return listMap(this, f);
  };

  // Static methods
  (PersistentList as any).of = <A>(a: A): PersistentList<A> => SetOf(a) as any;

  console.log('✅ PersistentList augmented with fluent methods');
}

/**
 * Add fluent methods to PersistentMap instances
 */
export function addPersistentMapFluentMethods(): void {
  if (!PersistentMap || typeof PersistentMap !== 'function') {
    console.warn('PersistentMap constructor not available for fluent augmentation');
    return;
  }

  // Functor methods - adjust signature to match existing map (value, key)
  (PersistentMap.prototype as any).map = function<K, V, V2>(this: PersistentMap<K, V>, f: (v: V, k?: K) => V2): PersistentMap<K, V2> {
    return mapMap(this, f);
  };

  // Bifunctor methods
  (PersistentMap.prototype as any).bimap = function<K, V, K2, V2>(
    this: PersistentMap<K, V>,
    f: (k: K) => K2,
    g: (v: V) => V2
  ): PersistentMap<K2, V2> {
    const entries = Array.from((this as any).entries?.() ?? (this as any)) as [K, V][];
    const out = entries.map(([k, v]) => [f(k), g(v)]);
    return (PersistentMap as any).fromEntries ? (PersistentMap as any).fromEntries(out) : (out as any);
  };

  (PersistentMap.prototype as any).mapKeys = function<K, V, K2>(this: PersistentMap<K, V>, f: (k: K) => K2): PersistentMap<K2, V> {
    const entries = Array.from((this as any).entries?.() ?? (this as any)) as [K, V][];
    const out = entries.map(([k, v]) => [f(k), v]);
    return (PersistentMap as any).fromEntries ? (PersistentMap as any).fromEntries(out) : (out as any);
  };

  (PersistentMap.prototype as any).mapValues = function<K, V, V2>(this: PersistentMap<K, V>, g: (v: V) => V2): PersistentMap<K, V2> {
    return mapMap(this, g);
  };

  // Filterable methods - adjust signature to match existing filter (value, key)
  (PersistentMap.prototype as any).filter = function<K, V>(this: PersistentMap<K, V>, predicate: (v: V, k?: K) => boolean): PersistentMap<K, V> {
    return mapFilter(this, predicate);
  };

  // Static methods  
  (PersistentMap as any).of = <K, V>(k: K, v: V): PersistentMap<K, V> => MapOf(k, v);

  console.log('✅ PersistentMap augmented with fluent methods');
}

/**
 * Add fluent methods to PersistentSet instances
 */
export function addPersistentSetFluentMethods(): void {
  if (!PersistentSet || typeof PersistentSet !== 'function') {
    console.warn('PersistentSet constructor not available for fluent augmentation');
    return;
  }

  // Functor methods
  (PersistentSet.prototype as any).map = function<A, B>(this: PersistentSet<A>, f: (a: A) => B): PersistentSet<B> {
    const arr = (this as any).toArray ? (this as any).toArray() as A[] : Array.from((this as any).values?.() ?? []);
    const out = (arr as A[]).map(f);
    return (PersistentSet as any).fromArray ? (PersistentSet as any).fromArray(out) : (out as any);
  };

  // Filterable methods
  (PersistentSet.prototype as any).filter = function<A>(this: PersistentSet<A>, predicate: (a: A) => boolean): PersistentSet<A> {
    const arr = (this as any).toArray ? (this as any).toArray() as A[] : Array.from((this as any).values?.() ?? []);
    const out = (arr as A[]).filter(predicate);
    return (PersistentSet as any).fromArray ? (PersistentSet as any).fromArray(out) : (out as any);
  };

  // Static methods
  (PersistentSet as any).of = <A>(a: A): PersistentSet<A> => SetOf(a);

  console.log('✅ PersistentSet augmented with fluent methods');
}

// ============================================================================
// Part 5: StatefulStream Fluent Methods
// ============================================================================

/**
 * Add fluent methods to StatefulStream instances
 */
export function addStatefulStreamFluentMethods(): void {
  // No-op: StatefulStream now exposes fluent methods via its class definition.
  console.log('ℹ️ StatefulStream fluent methods are provided by the class; no augmentation performed');
}

// ============================================================================
// Part 6: ObservableLite Fluent Methods (Already Implemented)
// ============================================================================

/**
 * ObservableLite already has comprehensive fluent methods implemented
 * This function serves as a verification that they exist
 */
export function verifyObservableLiteFluentMethods(): void {
  if (!ObservableLite || typeof ObservableLite !== 'function') {
    console.warn('ObservableLite constructor not available');
    return;
  }

  const proto = ObservableLite.prototype;
  
  // Verify existing methods
  const hasMap = typeof proto.map === 'function';
  const hasChain = typeof proto.chain === 'function';
  const hasFlatMap = typeof proto.flatMap === 'function';
  const hasFilter = typeof proto.filter === 'function';
  const hasAp = typeof (proto as any).ap === 'function';

  if (hasMap && hasChain && hasFlatMap && hasFilter && hasAp) {
    console.log('✅ ObservableLite already has fluent methods');
  } else {
    console.warn('⚠️  ObservableLite missing some fluent methods');
  }
}

// ============================================================================
// Part 7: Unified Fluent Methods Registration
// ============================================================================

/**
 * Add fluent methods to all core ADTs
 */
export function addAllFluentMethods(): void {
  console.log('🔧 Adding fluent methods to all core ADTs...\n');

  // Add fluent methods to each ADT
  addMaybeFluentMethods();
  addEitherFluentMethods();
  addResultFluentMethods();
  addPersistentListFluentMethods();
  addPersistentMapFluentMethods();
  addPersistentSetFluentMethods();
  addStatefulStreamFluentMethods();
  verifyObservableLiteFluentMethods();

  console.log('\n✅ All fluent methods added successfully!');
}

/**
 * Remove fluent methods from all core ADTs (for cleanup)
 */
export function removeAllFluentMethods(): void {
  console.log('🧹 Removing fluent methods from all core ADTs...\n');

  const adts = [PersistentList, PersistentMap, PersistentSet, StatefulStream];

  for (const adt of adts) {
    if (adt && adt.prototype) {
      delete (adt.prototype as any).map;
      delete (adt.prototype as any).chain;
      delete (adt.prototype as any).flatMap;
      delete (adt.prototype as any).filter;
      delete (adt.prototype as any).ap;
      delete (adt.prototype as any).bimap;
      delete (adt.prototype as any).mapLeft;
      delete (adt.prototype as any).mapRight;
      delete (adt.prototype as any).dimap;
      delete (adt.prototype as any).lmap;
      delete (adt.prototype as any).rmap;
      delete (adt.prototype as any).traverse;
    }
  }

  console.log('✅ All fluent methods removed successfully!');
}

// Part 8: (Type-only) structural fluent shapes for docs and minimal checking
export interface FluentFunctor<A> {
  map<B>(f: (a: A) => B): any;
}

export interface FluentApplicative<A> extends FluentFunctor<A> {
  ap<B>(fab: any): any;
  of<B>(b: B): any;
}

export interface FluentMonad<A> extends FluentApplicative<A> {
  chain<B>(f: (a: A) => any): any;
}

export interface FluentBifunctor<A, B> {
  bimap<A2, B2>(f: (a: A) => A2, g: (b: B) => B2): any;
  mapLeft<A2>(f: (a: A) => A2): any;
  mapRight<B2>(g: (b: B) => B2): any;
}

// ============================================================================
// Part 9: Export Summary
// ============================================================================

// All functions are exported individually above 

// ============================================================================
// Internal/Compat Section: Effect Monad Helpers from src version
// ============================================================================

/**
 * Installation flag to prevent duplicate patching
 */
let fluentInstanceMethodsInstalled = false;

/**
 * Install fluent instance methods on effect monad prototypes
 * 
 * This function safely augments IO, Task, and State prototypes with fluent methods
 * using guards to prevent double-definition conflicts.
 * Ported from src version for effect monad support.
 */
export function installFluentInstanceMethods(): void {
  if (fluentInstanceMethodsInstalled) {
    return; // Already installed, avoid duplicate augmentation
  }

  // Try to get IO, Task, State from global scope
  // This is defensive - if the types aren't loaded, we skip augmentation
  const globalScope = (typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : {}) as any;
  
  // Get constructors from global scope or try common import paths
  const IO = globalScope.IO;
  const Task = globalScope.Task;
  const State = globalScope.State;

  // Install IO methods
  if (IO && IO.prototype) {
    if (!(IO.prototype as any).map) {
      (IO.prototype as any).map = function <A, B>(this: any, f: (a: A) => B): any {
        return this.chain((a: A) => this.constructor.of(f(a)));
      };
    }

    if (!(IO.prototype as any).chain) {
      (IO.prototype as any).chain = function <A, B>(this: any, f: (a: A) => any): any {
        return this.chain(f);
      };
    }

    if (!(IO.prototype as any).ap) {
      (IO.prototype as any).ap = function <A, B>(this: any, fab: any): any {
        return this.ap(fab);
      };
    }

    if (!(IO.prototype as any).flatMap) {
      (IO.prototype as any).flatMap = function <A, B>(this: any, f: (a: A) => any): any {
        return this.chain(f);
      };
    }
  }

  // Install Task methods
  if (Task && Task.prototype) {
    if (!(Task.prototype as any).map) {
      (Task.prototype as any).map = function <A, B>(this: any, f: (a: A) => B): any {
        return this.chain((a: A) => this.constructor.of(f(a)));
      };
    }

    if (!(Task.prototype as any).chain) {
      (Task.prototype as any).chain = function <A, B>(this: any, f: (a: A) => any): any {
        return this.chain(f);
      };
    }

    if (!(Task.prototype as any).ap) {
      (Task.prototype as any).ap = function <A, B>(this: any, fab: any): any {
        return this.ap(fab);
      };
    }

    if (!(Task.prototype as any).flatMap) {
      (Task.prototype as any).flatMap = function <A, B>(this: any, f: (a: A) => any): any {
        return this.chain(f);
      };
    }
  }

  // Install State methods
  if (State && State.prototype) {
    if (!(State.prototype as any).map) {
      (State.prototype as any).map = function <S, A, B>(this: any, f: (a: A) => B): any {
        return this.map(f);
      };
    }

    if (!(State.prototype as any).chain) {
      (State.prototype as any).chain = function <S, A, B>(this: any, f: (a: A) => any): any {
        return this.chain(f);
      };
    }

    if (!(State.prototype as any).ap) {
      (State.prototype as any).ap = function <S, A, B>(this: any, fab: any): any {
        return this.ap(fab);
      };
    }

    if (!(State.prototype as any).flatMap) {
      (State.prototype as any).flatMap = function <S, A, B>(this: any, f: (a: A) => any): any {
        return this.chain(f);
      };
    }
  }

  fluentInstanceMethodsInstalled = true;
}

/**
 * Check if a value has fluent methods (map, chain, ap)
 * Ported from src version.
 */
export function hasFluentMethods(value: unknown): value is { map: Function; chain: Function; ap: Function } {
  if (!value || typeof value !== 'object') {
    return false;
  }
  
  const obj = value as any;
  return (
    typeof obj.map === 'function' &&
    typeof obj.chain === 'function' &&
    typeof obj.ap === 'function'
  );
}

/**
 * Check if fluent instance methods have been installed
 * Ported from src version.
 */
export function areFluentInstanceMethodsInstalled(): boolean {
  return fluentInstanceMethodsInstalled;
}