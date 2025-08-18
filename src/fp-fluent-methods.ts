/**
 * Fluent Methods - Wrapper-based fluent API and prototype augmentations for ADTs
 * 
 * Provides immutable fluent wrappers that work with tagged union ADTs
 * and optional prototype augmentations for effect monads (IO, Task, State)
 * without side effects. All operations return new instances, preserving immutability.
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Common ADT shape detection
 */
type TaggedUnion = { tag: string; [key: string]: any };

/**
 * Maybe ADT shape
 */
type Maybe<A> = 
  | { tag: 'Nothing' }
  | { tag: 'Just'; value: A };

/**
 * Either ADT shape
 */
type Either<L, R> = 
  | { tag: 'Left'; value: L }
  | { tag: 'Right'; value: R };

/**
 * Result ADT shape (alternative Either naming)
 */
type Result<E, A> = 
  | { tag: 'Err'; error: E }
  | { tag: 'Ok'; value: A };

// ============================================================================
// Fluent Interface
// ============================================================================

/**
 * Fluent wrapper interface providing chainable operations
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

// ============================================================================
// ADT Detection Helpers
// ============================================================================

/**
 * Check if a value is a Maybe ADT
 */
function isMaybe_(value: unknown): value is Maybe<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'tag' in value &&
    (value.tag === 'Nothing' || (value.tag === 'Just' && 'value' in value))
  );
}

/**
 * Check if a value is an Either ADT
 */
function isEither_(value: unknown): value is Either<unknown, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'tag' in value &&
    'value' in value &&
    (value.tag === 'Left' || value.tag === 'Right')
  );
}

/**
 * Check if a value is a Result ADT
 */
function isResult_(value: unknown): value is Result<unknown, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'tag' in value &&
    ((value.tag === 'Err' && 'error' in value) || (value.tag === 'Ok' && 'value' in value))
  );
}

/**
 * Check if a value is any tagged union
 */
function isTaggedUnion_(value: unknown): value is TaggedUnion {
  return (
    typeof value === 'object' &&
    value !== null &&
    'tag' in value &&
    typeof (value as any).tag === 'string'
  );
}

// ============================================================================
// ADT-Specific Operations
// ============================================================================

/**
 * Map operation for Maybe ADT
 */
function mapMaybe_<A, B>(maybe: Maybe<A>, f: (a: A) => B): Maybe<B> {
  if (maybe.tag === 'Nothing') {
    return { tag: 'Nothing' };
  }
  return { tag: 'Just', value: f(maybe.value) };
}

/**
 * Map operation for Either ADT
 */
function mapEither_<L, R, B>(either: Either<L, R>, f: (r: R) => B): Either<L, B> {
  if (either.tag === 'Left') {
    return { tag: 'Left', value: either.value };
  }
  return { tag: 'Right', value: f(either.value) };
}

/**
 * Map operation for Result ADT
 */
function mapResult_<E, A, B>(result: Result<E, A>, f: (a: A) => B): Result<E, B> {
  if (result.tag === 'Err') {
    return { tag: 'Err', error: result.error };
  }
  return { tag: 'Ok', value: f(result.value) };
}

/**
 * Bimap operation for Either ADT
 */
function bimapEither_<L, R, L2, R2>(
  either: Either<L, R>,
  f: (l: L) => L2,
  g: (r: R) => R2
): Either<L2, R2> {
  if (either.tag === 'Left') {
    return { tag: 'Left', value: f(either.value) };
  }
  return { tag: 'Right', value: g(either.value) };
}

/**
 * Bimap operation for Result ADT
 */
function bimapResult_<E, A, E2, A2>(
  result: Result<E, A>,
  f: (e: E) => E2,
  g: (a: A) => A2
): Result<E2, A2> {
  if (result.tag === 'Err') {
    return { tag: 'Err', error: f(result.error) };
  }
  return { tag: 'Ok', value: g(result.value) };
}

// ============================================================================
// Fluent Implementation
// ============================================================================

/**
 * Internal fluent wrapper implementation
 */
class FluentImpl<T> implements Fluent<T> {
  constructor(private readonly _value: T) {}

  map<B>(f: (a: T) => B): Fluent<B> {
    // For Maybe ADT: extract inner value and apply function
    if (isMaybe_(this._value)) {
      const maybe = this._value as Maybe<any>;
      if (maybe.tag === 'Nothing') {
        return new FluentImpl({ tag: 'Nothing' } as unknown as B);
      } else {
        const mapped = f(maybe.value as T);
        return new FluentImpl({ tag: 'Just', value: mapped } as unknown as B);
      }
    }
    
    // For Either ADT: extract right value and apply function
    if (isEither_(this._value)) {
      const either = this._value as Either<any, any>;
      if (either.tag === 'Left') {
        return new FluentImpl({ tag: 'Left', value: either.value } as unknown as B);
      } else {
        const mapped = f(either.value as T);
        return new FluentImpl({ tag: 'Right', value: mapped } as unknown as B);
      }
    }
    
    // For Result ADT: extract ok value and apply function
    if (isResult_(this._value)) {
      const result = this._value as Result<any, any>;
      if (result.tag === 'Err') {
        return new FluentImpl({ tag: 'Err', error: result.error } as unknown as B);
      } else {
        const mapped = f(result.value as T);
        return new FluentImpl({ tag: 'Ok', value: mapped } as unknown as B);
      }
    }
    
    // Fallback to direct transformation
    return new FluentImpl(f(this._value));
  }

  chain<B>(f: (a: T) => Fluent<B>): Fluent<B> {
    // For ADTs, we need to handle the cases properly
    if (isMaybe_(this._value)) {
      const maybe = this._value as Maybe<any>;
      if (maybe.tag === 'Nothing') {
        return new FluentImpl({ tag: 'Nothing' } as any);
      }
      return f(maybe.value as any);
    }
    
    if (isEither_(this._value)) {
      const either = this._value as Either<any, any>;
      if (either.tag === 'Left') {
        return new FluentImpl({ tag: 'Left', value: either.value } as any);
      }
      return f(either.value as any);
    }
    
    if (isResult_(this._value)) {
      const result = this._value as Result<any, any>;
      if (result.tag === 'Err') {
        return new FluentImpl({ tag: 'Err', error: result.error } as any);
      }
      return f(result.value as any);
    }
    
    // Fallback for non-ADT values
    return f(this._value);
  }

  ap<B>(fab: Fluent<(a: T) => B>): Fluent<B> {
    const f = fab.value();
    
    // Handle ADT cases
    if (isMaybe_(this._value) && isMaybe_(f)) {
      const maybe = this._value as Maybe<any>;
      const maybeFn = f as Maybe<any>;
      
      if (maybe.tag === 'Nothing' || maybeFn.tag === 'Nothing') {
        return new FluentImpl({ tag: 'Nothing' } as any);
      }
      
      return new FluentImpl({ 
        tag: 'Just', 
        value: maybeFn.value(maybe.value) 
      } as any);
    }
    
    if (isEither_(this._value) && isEither_(f)) {
      const either = this._value as Either<any, any>;
      const eitherFn = f as Either<any, any>;
      
      if (either.tag === 'Left') {
        return new FluentImpl({ tag: 'Left', value: either.value } as any);
      }
      
      if (eitherFn.tag === 'Left') {
        return new FluentImpl({ tag: 'Left', value: eitherFn.value } as any);
      }
      
      return new FluentImpl({ 
        tag: 'Right', 
        value: eitherFn.value(either.value) 
      } as any);
    }
    
    // Fallback: assume f is a function
    if (typeof f === 'function') {
      return this.map(f);
    }
    
    throw new Error('ap: expected a function or compatible ADT');
  }

  bimap<L, R, L2, R2>(
    this: Fluent<Either<L, R>>,
    f: (l: L) => L2,
    g: (r: R) => R2
  ): Fluent<Either<L2, R2>> {
    const value = this.value() as Either<L, R>;
    
    if (isEither_(value)) {
      return new FluentImpl(bimapEither_(value, f, g));
    }
    
    if (isResult_(value)) {
      // For Result, we need to map it to Either format
      const resultMapped = bimapResult_(value as any, f as any, g as any);
      // Convert Result to Either format
      if (resultMapped.tag === 'Err') {
        return new FluentImpl({ tag: 'Left', value: resultMapped.error } as Either<L2, R2>);
      } else {
        return new FluentImpl({ tag: 'Right', value: resultMapped.value } as Either<L2, R2>);
      }
    }
    
    throw new Error('bimap: value is not an Either or Result');
  }

  fold<R>(onValue: (t: T) => R): R {
    return onValue(this._value);
  }

  value(): T {
    return this._value;
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Create a fluent wrapper around a value
 * @param value - The value to wrap
 * @returns A fluent wrapper providing chainable operations
 */
export function fluent<T>(value: T): Fluent<T> {
  return new FluentImpl(value);
}

/**
 * Check if a value is a fluent wrapper
 * @param x - The value to check
 * @returns true if the value has a value() method (duck typing)
 */
export function isFluent(x: unknown): x is { value(): unknown } {
  return (
    typeof x === 'object' &&
    x !== null &&
    'value' in x &&
    typeof (x as any).value === 'function'
  );
}

// ============================================================================
// Re-export Types for Convenience
// ============================================================================

export type { Maybe, Either, Result };

// ============================================================================
// Optional Prototype Augmentations (Guarded)
// ============================================================================

/**
 * Setup flag to ensure augmentations only happen once
 */
let fluentMethodsSetup = false;

/**
 * Setup fluent methods on effect monads (idempotent)
 * 
 * This function safely augments IO, Task, and State prototypes with fluent methods
 * using guards to prevent double-definition conflicts.
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
          const [f, a] = await Promise.all([fab.run(), this.run()]);
          return f(a);
        });
      };
    }
  }

  // For State, we provide a fluent wrapper instead of direct prototype augmentation
  // since State has an extra type parameter S that makes direct augmentation complex
  const State = globalScope.State;
  if (State && !globalScope.fluentState) {
    globalScope.fluentState = function <S, A>(state: any): any {
      return {
        map: <B>(f: (a: A) => B) => globalScope.fluentState(state.map(f)),
        chain: <B>(f: (a: A) => any) => globalScope.fluentState(state.chain(f)),
        ap: <B>(fab: any) => globalScope.fluentState(state.ap(fab.unwrap ? fab.unwrap() : fab)),
        unwrap: () => state,
        run: (s: S) => state.run(s),
        eval: (s: S) => state.eval(s),
        exec: (s: S) => state.exec(s)
      };
    };
  }

  fluentMethodsSetup = true;
}

/**
 * Fluent State wrapper interface
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
      const fabState = fab.unwrap ? fab.unwrap() : fab;
      return fluentState(state.ap(fabState));
    },
    unwrap: () => state,
    run: (s: S) => state.run(s),
    eval: (s: S) => state.eval(s),
    exec: (s: S) => state.exec(s)
  };
}

// Note: setupFluentMethods() is exported but not called automatically
// Users must explicitly call it to opt-in to prototype augmentation
