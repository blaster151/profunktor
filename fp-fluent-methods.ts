/**
 * Fluent Methods for ADTs
 * 
 * This module provides optional, chainable FP-style method syntax directly to ADT instances
 * (e.g., Maybe, Either, Result, ObservableLite) so developers don't have to use .pipe() or standalone helpers.
 * 
 * Features:
 * - Opt-in fluent method syntax for ADTs
 * - Centralized typeclass registry lookup
 * - HKT and purity compatibility preservation
 * - Immutable operations (each call returns new instance)
 * - Type-safe method chaining
 * - Integration with existing typeclass system
 */

import {
  Kind1, Kind2, Kind3,
  Apply, Type, TypeArgs, KindArity, KindResult,
  ArrayK, EitherK, TupleK, FunctionK, PromiseK, SetK, MapK, ListK,
  ReaderK, WriterK, StateK,
  Either, List, Reader, Writer, State
} from './fp-hkt';

import {
  Functor, Applicative, Monad, Bifunctor, Profunctor, Traversable, Foldable,
  deriveFunctor, deriveApplicative, deriveMonad,
  lift2, composeK, sequence, traverse
} from './fp-typeclasses-hkt';

import {
  EffectTag, EffectOf, Pure, IO, Async,
  createPurityInfo, attachPurityMarker, extractPurityMarker, hasPurityMarker
} from './fp-purity';

import {
  // Maybe imports
  MaybeUnified, Maybe, MaybeK, Just, Nothing, matchMaybe,
  MaybeFunctor, MaybeApplicative, MaybeMonad
} from './fp-maybe-unified';

import {
  // Either imports - separate from Result
  EitherUnified, Left, Right, matchEither
} from './fp-either-unified';

import {
  // Result imports from canonical result module
  ResultUnified, Ok, Err, matchResult
} from './fp-result-unified';

import {
  // ObservableLite imports
  ObservableLite, ObservableLiteK,
  ObservableLiteFunctor, ObservableLiteApplicative, ObservableLiteMonad
} from './fp-observable-lite';

import {
  // ADT Registry imports
  ADTRegistry, getADT, getADTTypeclassInstances
} from './fp-adt-registry';

// ============================================================================
// Part 1: Type Definitions
// ============================================================================

/**
 * Typeclass instance types for fluent methods
 */
export interface TypeclassInstances {
  readonly Functor?: Functor<any>;
  readonly Applicative?: Applicative<any>;
  readonly Monad?: Monad<any>;
  readonly Bifunctor?: Bifunctor<any>;
  readonly Profunctor?: Profunctor<any>;
  readonly Traversable?: Traversable<any>;
  readonly Foldable?: Foldable<any>;
}

/**
 * Fluent method options for ADT decoration
 */
export interface FluentMethodOptions {
  readonly enableMap?: boolean;
  readonly enableChain?: boolean;
  readonly enableFilter?: boolean;
  readonly enableBimap?: boolean;
  readonly enableAp?: boolean;
  readonly enableOf?: boolean;
  readonly preservePurity?: boolean;
  readonly enableTypeInference?: boolean;
}

/**
 * Fluent method decorator result
 */
export interface FluentMethodDecorator<T> {
  readonly constructor: T;
  readonly instances: TypeclassInstances;
  readonly options: FluentMethodOptions;
  readonly isDecorated: boolean;
}

//
// Part 2: Typeclass Registry Lookup
// ============================================================================

/**
 * Helper functions to get typeclass instances from registry
 */
function getTypeclassInstance(typeclassName: keyof TypeclassInstances, adtName: string): any {
  try {
    const adtEntry = getADT(adtName as any);
    const instances = adtEntry?.typeclassInstances || getADTTypeclassInstances(adtName as any);
    return instances?.[typeclassName];
  } catch {
    return undefined;
  }
}

function getFunctorInstance(adtName: string): Functor<any> | undefined {
  return getTypeclassInstance('Functor', adtName);
}

function getApplicativeInstance(adtName: string): Applicative<any> | undefined {
  return getTypeclassInstance('Applicative', adtName);
}

function getMonadInstance(adtName: string): Monad<any> | undefined {
  return getTypeclassInstance('Monad', adtName);
}

function getBifunctorInstance(adtName: string): Bifunctor<any> | undefined {
  return getTypeclassInstance('Bifunctor', adtName);
}

function getTraversableInstance(adtName: string): Traversable<any> | undefined {
  return getTypeclassInstance('Traversable', adtName);
}

function getFoldableInstance(adtName: string): Foldable<any> | undefined {
  return getTypeclassInstance('Foldable', adtName);
}

/**
 * Global typeclass instance registry for fluent methods
 */
const FLUENT_METHOD_REGISTRY = new Map<string, TypeclassInstances>();

/**
 * Register typeclass instances for an ADT
 * @param adtName - Name of the ADT
 * @param instances - Typeclass instances to register
 */
export function registerFluentMethodInstances(
  adtName: string,
  instances: TypeclassInstances
): void {
  FLUENT_METHOD_REGISTRY.set(adtName, instances);
}

/**
 * Get typeclass instances for an ADT
 * @param adtName - Name of the ADT
 * @returns Typeclass instances or undefined if not found
 */
export function getFluentMethodInstances(adtName: string): TypeclassInstances | undefined {
  return FLUENT_METHOD_REGISTRY.get(adtName);
}

/**
 * Get typeclass instances from ADT registry
 * @param adtName - Name of the ADT in the registry
 * @returns Typeclass instances or undefined if not found
 */
export function getADTTypeclassInstancesForFluent(adtName: string): TypeclassInstances | undefined {
  try {
    const adt = getADT(adtName as any);
    return adt?.typeclassInstances;
  } catch {
    return undefined;
  }
}

// ============================================================================
// Part 3: Fluent Method Decorator
// ============================================================================

/**
 * Add fluent methods to an ADT constructor
 * @param Ctor - ADT constructor to decorate
 * @param adtName - Name of the ADT for registry lookup
 * @param options - Fluent method options
 * @returns Decorated constructor with fluent methods
 */
export function withFluentMethods<T extends new (...args: any[]) => any>(
  Ctor: T,
  adtName: string,
  options: FluentMethodOptions = {}
): T & { __fluentMethods: true } {
  const {
    enableMap = true,
    enableChain = true,
    enableFilter = true,
    enableBimap = true,
    enableAp = true,
    enableOf = true,
    preservePurity = true,
    enableTypeInference = true
  } = options;

  // Get typeclass instances from registry
  const instances = getFluentMethodInstances(adtName) || 
                   getADTTypeclassInstancesForFluent(adtName);

  if (!instances) {
    console.warn(`No typeclass instances found for ADT: ${adtName}`);
    return Ctor as T & { __fluentMethods: true };
  }

  // Add .map method if Functor instance exists
  if (enableMap && instances.Functor) {
    Ctor.prototype.map = function<A, B>(this: any, fn: (a: A) => B): any {
      return instances.Functor!.map(this, fn);
    };
  }

  // Add .chain method if Monad instance exists
  if (enableChain && instances.Monad) {
    Ctor.prototype.chain = function<A, B>(this: any, fn: (a: A) => any): any {
      return instances.Monad!.chain(this, fn);
    };
  }

  // Add .filter method (implemented via chain)
  if (enableFilter && instances.Monad) {
    Ctor.prototype.filter = function<A>(this: any, predicate: (a: A) => boolean): any {
      return instances.Monad!.chain(this, (value: A) => 
        predicate(value) ? this.constructor.of(value) : this.constructor.of(null)
      );
    };
  }

  // Add .bimap method if Bifunctor instance exists
  if (enableBimap && instances.Bifunctor) {
    Ctor.prototype.bimap = function<A, B, C, D>(
      this: any,
      f: (a: A) => C,
      g: (b: B) => D
    ): any {
      return instances.Bifunctor!.bimap(this, f, g);
    };
  }

  // Add .ap method if Applicative instance exists
  if (enableAp && instances.Applicative) {
    Ctor.prototype.ap = function<A, B>(this: any, fab: any): any {
      return instances.Applicative!.ap(fab, this);
    };
  }

  // Add .of method if Applicative instance exists
  if (enableOf && instances.Applicative) {
    Ctor.prototype.of = function<A>(this: any, value: A): any {
      return instances.Applicative!.of(value);
    };
  }

  // Mark as decorated
  (Ctor as any).__fluentMethods = true;

  return Ctor as T & { __fluentMethods: true };
}

/**
 * Check if a constructor has fluent methods
 * @param Ctor - Constructor to check
 * @returns True if the constructor has fluent methods
 */
export function hasFluentMethods(Ctor: any): boolean {
  return Ctor.__fluentMethods === true;
}

/**
 * Remove fluent methods from an ADT constructor
 * @param Ctor - ADT constructor to undecorate
 * @returns Constructor without fluent methods
 */
export function withoutFluentMethods<T extends new (...args: any[]) => any>(Ctor: T): T {
  if (hasFluentMethods(Ctor)) {
    delete Ctor.prototype.map;
    delete Ctor.prototype.chain;
    delete Ctor.prototype.filter;
    delete Ctor.prototype.bimap;
    delete Ctor.prototype.ap;
    delete Ctor.prototype.of;
    delete (Ctor as any).__fluentMethods;
  }
  return Ctor;
}

// ============================================================================
// Part 4: ADT-Specific Fluent Method Decorators
// ============================================================================

/**
 * Add fluent methods to Maybe ADT
 * @param options - Fluent method options
 * @returns Maybe constructor with fluent methods
 */
export function withMaybeFluentMethods(options: FluentMethodOptions = {}): typeof MaybeUnified.constructors {
  // Register Maybe typeclass instances using registry lookups or fallbacks
  registerFluentMethodInstances('Maybe', {
    Functor: getFunctorInstance('Maybe') || MaybeFunctor,
    Applicative: getApplicativeInstance('Maybe') || MaybeApplicative,
    Monad: getMonadInstance('Maybe') || MaybeMonad,
    Traversable: getTraversableInstance('Maybe'),
    Foldable: getFoldableInstance('Maybe')
  });

  // Return constructors as-is since they're functions not classes
  return {
    Just: Just as any,
    Nothing: Nothing as any
  };
}

/**
 * Add fluent methods to Either ADT
 * @param options - Fluent method options
 * @returns Either constructor with fluent methods
 */
export function withEitherFluentMethods(options: FluentMethodOptions = {}): typeof EitherUnified.constructors {
  // Register Either typeclass instances using registry lookups
  registerFluentMethodInstances('Either', {
    Functor: getFunctorInstance('Either'),
    Applicative: getApplicativeInstance('Either'),
    Monad: getMonadInstance('Either'),
    Bifunctor: getBifunctorInstance('Either'),
    Traversable: getTraversableInstance('Either'),
    Foldable: getFoldableInstance('Either')
  });

  // Return constructors as-is since they're functions not classes  
  return {
    Left: Left as any,
    Right: Right as any
  };
}

/**
 * Add fluent methods to Result ADT
 * @param options - Fluent method options
 * @returns Result constructor with fluent methods
 */
export function withResultFluentMethods(options: FluentMethodOptions = {}): typeof ResultUnified.constructors {
  // Register Result typeclass instances using registry lookups
  registerFluentMethodInstances('Result', {
    Functor: getFunctorInstance('Result'),
    Applicative: getApplicativeInstance('Result'),
    Monad: getMonadInstance('Result'),
    Bifunctor: getBifunctorInstance('Result'),
    Traversable: getTraversableInstance('Result'),
    Foldable: getFoldableInstance('Result')
  });

  // Return constructors as-is since they're functions not classes
  return {
    Ok: Ok as any,
    Err: Err as any
  };
}

/**
 * Add fluent methods to ObservableLite ADT
 * @param options - Fluent method options
 * @returns ObservableLite constructor with fluent methods
 */
export function withObservableLiteFluentMethods(options: FluentMethodOptions = {}): typeof ObservableLite {
  // Register ObservableLite typeclass instances
  registerFluentMethodInstances('ObservableLite', {
    Functor: ObservableLiteFunctor,
    Applicative: ObservableLiteApplicative,
    Monad: ObservableLiteMonad
  });

  // Decorate constructor
  return withFluentMethods(ObservableLite, 'ObservableLite', options);
}

// ============================================================================
// Part 5: Global Fluent Methods Configuration
// ============================================================================

/**
 * Global fluent methods configuration
 */
export interface GlobalFluentMethodsConfig {
  enabled: boolean;
  defaultOptions: FluentMethodOptions;
  readonly adtRegistry: Map<string, TypeclassInstances>;
  readonly decoratedADTs: Set<string>;
}

/**
 * Global fluent methods state
 */
let GLOBAL_FLUENT_CONFIG: GlobalFluentMethodsConfig = {
  enabled: false,
  defaultOptions: {
    enableMap: true,
    enableChain: true,
    enableFilter: true,
    enableBimap: true,
    enableAp: true,
    enableOf: true,
    preservePurity: true,
    enableTypeInference: true
  },
  adtRegistry: new Map(),
  decoratedADTs: new Set()
};

export { GLOBAL_FLUENT_CONFIG };

/**
 * Enable global fluent methods for all ADTs
 * @param options - Global fluent method options
 */
export function enableGlobalFluentMethods(options: FluentMethodOptions = {}): void {
  GLOBAL_FLUENT_CONFIG = {
    ...GLOBAL_FLUENT_CONFIG,
    enabled: true,
    defaultOptions: { ...GLOBAL_FLUENT_CONFIG.defaultOptions, ...options }
  };

  // Register all ADT typeclass instances
  const adtNames = Object.keys(ADTRegistry);
  
  for (const adtName of adtNames) {
    try {
      const adt = getADT(adtName as any);
      if (adt?.typeclassInstances) {
        GLOBAL_FLUENT_CONFIG.adtRegistry.set(adtName, adt.typeclassInstances);
        registerFluentMethodInstances(adtName, adt.typeclassInstances);
      }
    } catch (error) {
      console.warn(`Failed to register fluent methods for ADT: ${adtName}`, error);
    }
  }

  // Register ObservableLite instances
  registerFluentMethodInstances('ObservableLite', {
    Functor: ObservableLiteFunctor,
    Applicative: ObservableLiteApplicative,
    Monad: ObservableLiteMonad
  });

  console.log('Global fluent methods enabled for all ADTs');
}

/**
 * Disable global fluent methods
 */
export function disableGlobalFluentMethods(): void {
  GLOBAL_FLUENT_CONFIG = { ...GLOBAL_FLUENT_CONFIG, enabled: false };
  
  GLOBAL_FLUENT_CONFIG.adtRegistry.clear();
  GLOBAL_FLUENT_CONFIG.decoratedADTs.clear();
  FLUENT_METHOD_REGISTRY.clear();
  console.log('Global fluent methods disabled');
}

/**
 * Set global default options for fluent methods
 * @param options - Default options to set
 */
export function setGlobalDefaultOptions(options: Record<string, unknown>): void {
  GLOBAL_FLUENT_CONFIG = { ...GLOBAL_FLUENT_CONFIG, defaultOptions: { ...options } };
}

/**
 * Check if global fluent methods are enabled
 * @returns True if global fluent methods are enabled
 */
export function isGlobalFluentMethodsEnabled(): boolean {
  return GLOBAL_FLUENT_CONFIG.enabled;
}

/**
 * Get global fluent methods configuration
 * @returns Global fluent methods configuration
 */
export function getGlobalFluentMethodsConfig(): GlobalFluentMethodsConfig {
  return { ...GLOBAL_FLUENT_CONFIG };
}

// ============================================================================
// Part 6: Utility Functions
// ============================================================================

/**
 * Create a fluent method decorator for a custom ADT
 * @param adtName - Name of the ADT
 * @param instances - Typeclass instances
 * @param options - Fluent method options
 * @returns Fluent method decorator function
 */
export function createFluentMethodDecorator(
  adtName: string,
  instances: TypeclassInstances,
  options: FluentMethodOptions = {}
) {
  return function<T extends new (...args: any[]) => any>(Ctor: T): T & { __fluentMethods: true } {
    registerFluentMethodInstances(adtName, instances);
    return withFluentMethods(Ctor, adtName, options);
  };
}

/**
 * Check if an instance has fluent methods
 * @param instance - Instance to check
 * @returns True if the instance has fluent methods
 */
export function hasInstanceFluentMethods(instance: any): boolean {
  return instance && typeof instance.map === 'function';
}

/**
 * Get available fluent methods for an instance
 * @param instance - Instance to check
 * @returns Array of available fluent method names
 */
export function getAvailableFluentMethods(instance: any): string[] {
  if (!instance) return [];
  
  const methods: string[] = [];
  if (typeof instance.map === 'function') methods.push('map');
  if (typeof instance.chain === 'function') methods.push('chain');
  if (typeof instance.filter === 'function') methods.push('filter');
  if (typeof instance.bimap === 'function') methods.push('bimap');
  if (typeof instance.ap === 'function') methods.push('ap');
  if (typeof instance.of === 'function') methods.push('of');
  
  return methods;
}

/**
 * Validate fluent method chaining
 * @param chain - Array of method calls to validate
 * @returns True if the chain is valid
 */
export function validateFluentMethodChain(chain: Array<{ method: string; args: any[] }>): boolean {
  // Basic validation - could be extended with more sophisticated rules
  for (const call of chain) {
    if (!call.method || !Array.isArray(call.args)) {
      return false;
    }
  }
  return true;
}

// ============================================================================
// Part 7: Type-Safe Fluent Method Types
// ============================================================================

/**
 * Type for fluent method chain result
 */
export type FluentMethodResult<F, Method extends string, Args extends any[]> = 
  Method extends 'map' ? F extends { map: (fn: infer MapFn) => infer Result } ? Result : never :
  Method extends 'chain' ? F extends { chain: (fn: infer ChainFn) => infer Result } ? Result : never :
  Method extends 'filter' ? F extends { filter: (pred: infer PredFn) => infer Result } ? Result : never :
  Method extends 'bimap' ? F extends { bimap: (f: infer Fn1, g: infer Fn2) => infer Result } ? Result : never :
  Method extends 'ap' ? F extends { ap: (fab: infer Fab) => infer Result } ? Result : never :
  never;

/**
 * Type for fluent method chain
 */
export type FluentMethodChain<F, Chain extends Array<{ method: string; args: any[] }>> = 
  Chain extends [infer First, ...infer Rest]
    ? First extends { method: infer Method; args: infer Args }
      ? Rest extends Array<{ method: string; args: any[] }>
        ? FluentMethodChain<FluentMethodResult<F, Method & string, Args & any[]>, Rest>
        : FluentMethodResult<F, Method & string, Args & any[]>
      : F
    : F;

// ============================================================================
// Part 8: Export All
// ============================================================================

// Functions are already exported individually above
// No need for barrel export block 

// ============================================================================
// Internal/Compat Section: Sugar Functions from src version
// ============================================================================

/**
 * Fluent wrapper interface providing chainable operations
 * Ported from src version for wrapper-based fluent API.
 */
export interface Fluent<T> {
  /**
   * Transform the wrapped value with a function
   */
  map<B>(f: (a: T) => B): Fluent<B>;
  
  /**
   * Chain fluent operations (monadic bind)
   */
  chain<B>(f: (a: T) => Fluent<B>): Fluent<B>;
  
  /**
   * Apply a wrapped function to this wrapped value
   */
  ap<B>(fab: Fluent<(a: T) => B>): Fluent<B>;
  
  /**
   * Bimap operation (only available when T is Either<L, R>)
   */
  bimap<L, R, L2, R2>(
    this: Fluent<Either<L, R>>,
    f: (l: L) => L2,
    g: (r: R) => R2
  ): Fluent<Either<L2, R2>>;
  
  /**
   * Fold the wrapped value to a result
   */
  fold<R>(onValue: (t: T) => R): R;
  
  /**
   * Extract the wrapped value
   */
  value(): T;
}

/**
 * Internal fluent wrapper implementation
 * Ported from src version.
 */
class FluentImpl<T> implements Fluent<T> {
  constructor(private val: T) {}

  map<B>(f: (a: T) => B): Fluent<B> {
    // Handle Maybe
    if (this.val && typeof this.val === 'object' && 'tag' in this.val) {
      if ((this.val as any).tag === 'Nothing') {
        return new FluentImpl({ tag: 'Nothing' } as unknown as B);
      }
      if ((this.val as any).tag === 'Just') {
        const mapped = f((this.val as any).value);
        return new FluentImpl({ tag: 'Just', value: mapped } as unknown as B);
      }
    }
    
    // Handle Either
    if (this.val && typeof this.val === 'object' && 'tag' in this.val) {
      if ((this.val as any).tag === 'Left') {
        return new FluentImpl(this.val as unknown as B);
      }
      if ((this.val as any).tag === 'Right') {
        const mapped = f((this.val as any).value);
        return new FluentImpl({ tag: 'Right', value: mapped } as unknown as B);
      }
    }
    
    // Handle Result
    if (this.val && typeof this.val === 'object' && 'tag' in this.val) {
      if ((this.val as any).tag === 'Err') {
        return new FluentImpl(this.val as unknown as B);
      }
      if ((this.val as any).tag === 'Ok') {
        const mapped = f((this.val as any).value);
        return new FluentImpl({ tag: 'Ok', value: mapped } as unknown as B);
      }
    }
    
    // Fallback: apply f directly
    return new FluentImpl(f(this.val));
  }

  chain<B>(f: (a: T) => Fluent<B>): Fluent<B> {
    // Handle Maybe
    if (this.val && typeof this.val === 'object' && 'tag' in this.val) {
      if ((this.val as any).tag === 'Nothing') {
        return new FluentImpl({ tag: 'Nothing' } as unknown as B);
      }
      if ((this.val as any).tag === 'Just') {
        return f((this.val as any).value);
      }
    }
    
    // Handle Either
    if (this.val && typeof this.val === 'object' && 'tag' in this.val) {
      if ((this.val as any).tag === 'Left') {
        return new FluentImpl(this.val as unknown as B);
      }
      if ((this.val as any).tag === 'Right') {
        return f((this.val as any).value);
      }
    }
    
    // Handle Result  
    if (this.val && typeof this.val === 'object' && 'tag' in this.val) {
      if ((this.val as any).tag === 'Err') {
        return new FluentImpl(this.val as unknown as B);
      }
      if ((this.val as any).tag === 'Ok') {
        return f((this.val as any).value);
      }
    }
    
    // Fallback: apply f directly
    return f(this.val);
  }

  ap<B>(fab: Fluent<(a: T) => B>): Fluent<B> {
    const fabValue = fab.value();
    
    // Handle Maybe
    if (this.val && typeof this.val === 'object' && 'tag' in this.val) {
      if ((this.val as any).tag === 'Nothing') {
        return new FluentImpl({ tag: 'Nothing' } as unknown as B);
      }
      if ((this.val as any).tag === 'Just') {
        if (fabValue && typeof fabValue === 'object' && 'tag' in fabValue) {
          if ((fabValue as any).tag === 'Nothing') {
            return new FluentImpl({ tag: 'Nothing' } as unknown as B);
          }
          if ((fabValue as any).tag === 'Just') {
            const result = (fabValue as any).value((this.val as any).value);
            return new FluentImpl({ tag: 'Just', value: result } as unknown as B);
          }
        }
      }
    }
    
    // Fallback: extract function and apply
    if (typeof fabValue === 'function') {
      return this.map(fabValue);
    }
    
    return new FluentImpl(fabValue as unknown as B);
  }

  bimap<L, R, L2, R2>(
    this: FluentImpl<Either<L, R>>,
    f: (l: L) => L2,
    g: (r: R) => R2
  ): Fluent<Either<L2, R2>> {
    if (this.val && typeof this.val === 'object' && 'tag' in this.val) {
      if ((this.val as any).tag === 'Left') {
        const mapped = f((this.val as any).value);
        return new FluentImpl({ tag: 'Left', value: mapped } as unknown as Either<L2, R2>);
      }
      if ((this.val as any).tag === 'Right') {
        const mapped = g((this.val as any).value);
        return new FluentImpl({ tag: 'Right', value: mapped } as unknown as Either<L2, R2>);
      }
    }
    
    return new FluentImpl(this.val as unknown as Either<L2, R2>);
  }

  fold<R>(onValue: (t: T) => R): R {
    return onValue(this.val);
  }

  value(): T {
    return this.val;
  }
}

/**
 * Create a fluent wrapper for any value
 * 
 * @param value - The value to wrap with fluent methods
 * @returns A fluent wrapper providing chainable operations
 * Ported from src version.
 */
export function fluent<T>(value: T): Fluent<T> {
  return new FluentImpl(value);
}

/**
 * Check if a value is a fluent wrapper
 * 
 * @param x - The value to check
 * @returns true if the value has a value() method (duck typing)
 * Ported from src version.
 */
export function isFluent(x: unknown): x is { value(): unknown } {
  return (
    typeof x === 'object' &&
    x !== null &&
    'value' in x &&
    typeof (x as any).value === 'function'
  );
}

/**
 * Flag to track if fluent methods have been setup on prototypes
 * Ported from src version.
 */
let fluentMethodsSetup = false;

/**
 * Setup fluent methods on effect monad prototypes
 * 
 * This function augments IO, Task, and State prototypes with fluent methods.
 * Ported from src version.
 */
export function setupFluentMethods(): void {
  if (fluentMethodsSetup) {
    return; // Already setup, avoid duplicate augmentation
  }

  // Try to get IO, Task, State from global scope or imports
  // This is defensive - if the types aren't loaded, we skip augmentation
  const globalScope = (typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : {}) as any;
  
  // Augment IO if available
  const IO = globalScope.IO;
  if (IO && IO.prototype) {
    if (!(IO.prototype as any).map) {
      (IO.prototype as any).map = function <A, B>(this: any, f: (a: A) => B): any {
        return this.constructor.of(f(this.run()));
      };
    }
    
    if (!(IO.prototype as any).chain) {
      (IO.prototype as any).chain = function <A, B>(this: any, f: (a: A) => any): any {
        return f(this.run());
      };
    }
    
    if (!(IO.prototype as any).ap) {
      (IO.prototype as any).ap = function <A, B>(this: any, fab: any): any {
        return this.constructor.of(fab.run()(this.run()));
      };
    }
  }

  // Augment Task if available
  const Task = globalScope.Task;
  if (Task && Task.prototype) {
    if (!(Task.prototype as any).map) {
      (Task.prototype as any).map = function <A, B>(this: any, f: (a: A) => B): any {
        return this.constructor.fromThunk(async () => f(await this.run()));
      };
    }
    
    if (!(Task.prototype as any).chain) {
      (Task.prototype as any).chain = function <A, B>(this: any, f: (a: A) => any): any {
        return this.constructor.fromThunk(async () => {
          const a = await this.run();
          return f(a).run();
        });
      };
    }
    
    if (!(Task.prototype as any).ap) {
      (Task.prototype as any).ap = function <A, B>(this: any, fab: any): any {
        return this.constructor.fromThunk(async () => {
          const fab_val = await fab.run();
          const this_val = await this.run();
          return fab_val(this_val);
        });
      };
    }
  }

  // Augment State if available
  const State = globalScope.State;
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
  }

  fluentMethodsSetup = true;
}

/**
 * Fluent State wrapper interface
 * Ported from src version.
 */
export interface FluentState<S, A> {
  map<B>(f: (a: A) => B): FluentState<S, B>;
  chain<B>(f: (a: A) => FluentState<S, B>): FluentState<S, B>;
  ap<B>(fab: FluentState<S, (a: A) => B>): FluentState<S, B>;
  unwrap(): any; // Returns the underlying State instance
  run(s: S): [A, S];
  eval(s: S): A;
  exec(s: S): S;
}

/**
 * Fluent State wrapper factory (alternative to prototype augmentation)
 * 
 * Since State<S, A> has two type parameters, direct prototype augmentation
 * is complex. This wrapper provides fluent methods for State computations.
 * Ported from src version.
 */
export function fluentState<S, A>(state: any): FluentState<S, A> {
  return {
    map: function<B>(f: (a: A) => B): FluentState<S, B> {
      return fluentState(state.map(f));
    },
    chain: function<B>(f: (a: A) => FluentState<S, B>): FluentState<S, B> {
      return fluentState(state.chain((a: A) => {
        const result = f(a);
        return result.unwrap ? result.unwrap() : result;
      }));
    },
    ap: function<B>(fab: FluentState<S, (a: A) => B>): FluentState<S, B> {
      return fluentState(state.ap(fab.unwrap ? fab.unwrap() : fab));
    },
    unwrap: function() {
      return state;
    },
    run: function(s: S): [A, S] {
      return state.run(s);
    },
    eval: function(s: S): A {
      return state.eval(s);
    },
    exec: function(s: S): S {
      return state.exec(s);
    }
  };
} 