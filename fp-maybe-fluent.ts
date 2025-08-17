/**
 * Fluent Usage-Bound Maybe Implementation
 * 
 * This module extends the Maybe type with fluent API wrappers that propagate
 * and enforce multiplicity bounds from the registry.
 */

import { 
  FluentOps, 
  FluentOpsImpl, 
  UsageBound, 
  ContainerOf,
  InnerType,
  minUsageBounds,
  filterUsageBound,
  scanUsageBound,
  takeUsageBound,
  getUsageBoundForType
} from './fluent-usage-wrapper';

import { Multiplicity } from './src/stream/multiplicity/types';

// ============================================================================
// Augment Type Families for Maybe Support
// ============================================================================

// Augment the ContainerOf type family to support Maybe
declare module './fluent-usage-wrapper' {
  interface ContainerOfAugmentation<C, B> {
    maybeMappingForContainerOf: C extends Maybe<any> ? Maybe<B> : never;
  }
}

// Augment the InnerType type family to support Maybe  
declare module './fluent-usage-wrapper' {
  interface InnerTypeAugmentation<C> {
    maybeMappingForInnerType: C extends Maybe<infer A> ? A : never;
  }
}

// Override ContainerOf to include Maybe support
export type MaybeContainerOf<C, B> = 
  C extends Maybe<any> ? Maybe<B> :
  ContainerOf<C, B>;

// Override InnerType to include Maybe support
export type MaybeInnerType<C> =
  C extends Maybe<infer A> ? A :
  InnerType<C>;

// ============================================================================
// Maybe Type Definition
// ============================================================================

/**
 * Maybe type with usage bounds
 */
export type Maybe<A> = Just<A> | Nothing<A>;

/**
 * Just constructor with usage bounds
 */
export interface Just<A> {
  readonly tag: 'Just';
  readonly value: A;
  readonly __usageBound: UsageBound<A>;
}

/**
 * Nothing constructor with usage bounds
 */
export interface Nothing<A> {
  readonly tag: 'Nothing';
  readonly __usageBound: UsageBound<A>;
}

// ============================================================================
// Maybe Constructors
// ============================================================================

/**
 * Create a Just value with usage bound from registry
 */
export function just<A>(value: A): Maybe<A> {
  const usageBound = getUsageBoundForType<A>('Maybe');
  return {
    tag: 'Just',
    value,
    __usageBound: usageBound
  };
}

/**
 * Create a Nothing value with usage bound from registry
 */
export function nothing<A>(): Maybe<A> {
  const usageBound = getUsageBoundForType<A>('Maybe');
  return {
    tag: 'Nothing',
    __usageBound: usageBound
  };
}

/**
 * Create a Maybe from a value or null/undefined
 */
export function fromNullable<A>(value: A | null | undefined): Maybe<A> {
  return value != null ? just(value as A) : nothing<A>();
}

// ============================================================================
// Fluent Maybe Implementation (Option B: Natural Inner Type Usage)
// ============================================================================

/**
 * Fluent Maybe interface that works naturally with inner types
 * Functions take the inner type A, not Maybe<A>
 * This enables the desired ergonomics: .map(x => x * 2) where x is the inner type
 */
export interface FluentMaybeOps<A> {
  // Core fluent operations that work on inner type A
  map<B>(f: (a: A) => B): FluentMaybeOps<B>;
  filter(predicate: (a: A) => boolean): FluentMaybeOps<A>;
  scan<B>(initial: B, f: (acc: B, a: A) => B): FluentMaybeOps<B>;
  chain<B>(f: (a: A) => FluentMaybeOps<B>): FluentMaybeOps<B>;
  flatMap<B>(f: (a: A) => FluentMaybeOps<B>): FluentMaybeOps<B>;
  take(n: number): FluentMaybeOps<A>;
  
  // Maybe-specific operations
  getMaybe(): Maybe<A>;
  getOrElse(defaultValue: A): A;
  unsafeGet(): A;
  match<B>(patterns: { Just: (value: A) => B; Nothing: () => B }): B;
  
  // Usage tracking
  getUsageBound(): UsageBound<Maybe<A>>;
  validateUsage(input: Maybe<A>): Multiplicity;
}

/**
 * Fluent Maybe wrapper extending FluentOpsImpl with Option B approach
 * A = inner type, Maybe<A> = container type
 */
/**
 * Fluent Maybe implementation with Option B approach
 * Methods work naturally with inner type A
 */
export class FluentMaybe<A> implements FluentMaybeOps<A> {
  private readonly maybe: Maybe<A>;
  private readonly usageBound: UsageBound<Maybe<A>>;

  constructor(maybe: Maybe<A>) {
    this.maybe = maybe;
    this.usageBound = maybe.__usageBound as UsageBound<Maybe<A>>;
  }

  /**
   * Map with usage propagation - f works on inner type A
   */
  map<B>(f: (a: A) => B): FluentMaybeOps<B> {
    const mappedMaybe = this.maybe.tag === 'Just' 
      ? just(f(this.maybe.value))
      : nothing<B>();
    
    return new FluentMaybe<B>(mappedMaybe);
  }

  /**
   * Filter with usage propagation - predicate works on inner type A
   */
  filter(predicate: (a: A) => boolean): FluentMaybeOps<A> {
    if (this.maybe.tag === 'Nothing') {
      return new FluentMaybe<A>(this.maybe);
    }
    
    const passes = predicate(this.maybe.value);
    const result = passes ? this.maybe : nothing<A>();
    return new FluentMaybe<A>(result);
  }

  /**
   * Scan with usage propagation - f works on inner type A
   */
  scan<B>(initial: B, f: (acc: B, a: A) => B): FluentMaybeOps<B> {
    const result = this.maybe.tag === 'Just'
      ? just(f(initial, this.maybe.value))
      : nothing<B>();
    
    return new FluentMaybe<B>(result);
  }

  /**
   * Chain/flatMap with usage propagation - f works on inner type A
   */
  chain<B>(f: (a: A) => FluentMaybeOps<B>): FluentMaybeOps<B> {
    if (this.maybe.tag === 'Nothing') {
      return new FluentMaybe<B>(nothing<B>());
    }
    
    return f(this.maybe.value);
  }

  /**
   * Alias for chain
   */
  flatMap<B>(f: (a: A) => FluentMaybeOps<B>): FluentMaybeOps<B> {
    return this.chain(f);
  }

  /**
   * Take with usage propagation
   */
  take(n: number): FluentMaybeOps<A> {
    if (n <= 0) {
      return new FluentMaybe<A>(nothing<A>());
    }
    
    return new FluentMaybe<A>(this.maybe);
  }

  // ============================================================================
  // Maybe-specific methods
  // ============================================================================

  /**
   * Get the underlying Maybe value
   */
  getMaybe(): Maybe<A> {
    return this.maybe;
  }

  /**
   * Get the value or default - works with inner type A
   */
  getOrElse(defaultValue: A): A {
    return this.maybe.tag === 'Just' ? this.maybe.value : defaultValue;
  }

  /**
   * Unsafe get - returns inner type A
   */
  unsafeGet(): A {
    if (this.maybe.tag === 'Nothing') {
      throw new Error('Cannot get value from Nothing');
    }
    return this.maybe.value;
  }

  /**
   * Pattern match - Just handler works with inner type A
   */
  match<B>(patterns: { Just: (value: A) => B; Nothing: () => B }): B {
    return this.maybe.tag === 'Just' 
      ? patterns.Just(this.maybe.value)
      : patterns.Nothing();
  }

  // ============================================================================
  // Usage tracking
  // ============================================================================

  getUsageBound(): UsageBound<Maybe<A>> {
    return this.usageBound;
  }

  validateUsage(input: Maybe<A>): Multiplicity {
    return this.usageBound.usage(input);
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a fluent Maybe from a value
 */
export function fluentMaybe<A>(value: A | null | undefined): FluentMaybe<A> {
  return new FluentMaybe(fromNullable(value));
}

/**
 * Create a fluent Maybe from a Just value
 */
export function fluentJust<A>(value: A): FluentMaybe<A> {
  return new FluentMaybe(just(value));
}

/**
 * Create a fluent Maybe from a Nothing value
 */
export function fluentNothing<A>(): FluentMaybe<A> {
  return new FluentMaybe(nothing<A>());
}

// ============================================================================
// Option B Example: Natural Inner Type Usage
// ============================================================================

/**
 * Example demonstrating Option B approach - fluent methods work with inner types
 */
export function exampleOptionB() {
  // Create a fluent Maybe with number
  const maybe = fluentJust(42);
  
  // Chain operations - functions work directly with the inner types (number, string, etc.)
  const result = maybe
    .map(x => x * 2)           // x is number (42 -> 84)
    .filter(x => x > 50)       // x is number (84 > 50 = true)
    .map(x => x.toString())    // x is number (84 -> "84") 
    .map(x => x.length)        // x is string ("84" -> 2)
    .chain(x => fluentJust(x + 10)); // x is number (2 -> 12)
  
  // Extract result using natural inner type methods
  const value = result.getOrElse(0);  // returns number: 12
  console.log('Option B Result:', value);
  
  // Pattern matching with inner types
  const message = result.match({
    Just: x => `Value is ${x}`,     // x is number
    Nothing: () => 'No value'
  });
  console.log('Message:', message);
  
  // Usage validation
  const usage = result.validateUsage(result.getMaybe());
  console.log('Usage:', usage);
  
  return result;
} 