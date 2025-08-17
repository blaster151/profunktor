// ARCHIVED: older usage-bound optics mini-project (not integrated)
/**
 * Fluent Usage-Bound Wrapper System
 * 
 * This module provides a shared wrapper type for fluent-enabled objects that
 * propagates and enforces multiplicity bounds from the registry across all
 * fluent method chains.
 */

// Import canonical types and helpers from the multiplicity system
import {
  Usage,
  Multiplicity,
  UsageBound as CanonicalUsageBound,
  multiplyUsageBounds,
  infinite as infiniteBound
} from './src/stream/multiplicity/types';

import { 
  getUsageBound, 
  registerUsage 
} from './usageRegistry';

import type { EitherGADT, Result } from './fp-gadt-enhanced';

import globalConfig from './globalConfig.json';

// import { getUsageBound as getGlobalUsageBound } from './fp-registry-init';
const getGlobalUsageBound = (_: string): CanonicalUsageBound<unknown> | undefined => undefined;

// ============================================================================
// Container Type Family for Generic Fluent Operations
// ============================================================================

/**
 * Type family that maps container types to their inner type transformations
 * This allows us to transform container types generically
 */
export type ContainerOf<C, B> =
  C extends EitherGADT<infer L, infer _> ? EitherGADT<L, B> :
  C extends Result<infer _, infer E>     ? Result<B, E>     :
  C extends Array<infer _>               ? Array<B>         :
  C extends Promise<infer _>             ? Promise<B>       :
  // For other container types, implementers should augment this type family
  // Default: if not a known container, just return B
  B;

/**
 * Extract inner type from container
 */
export type InnerType<C> =
  C extends EitherGADT<any, infer R> ? R :
  C extends Result<infer A, any>     ? A :
  C extends Array<infer A>           ? A :
  C extends Promise<infer A>         ? A :
  C; // Default: if not a known container, just return the container type as inner type

// ============================================================================
// Core Fluent Wrapper Types  
// ============================================================================

/**
 * Usage-bound interface that all fluent-enabled objects must implement
 */
export type UsageBound<T> = CanonicalUsageBound<T>;

/**
 * Shared wrapper type for fluent-enabled objects
 * Now parameterized by both inner type A and container type C
 */
export interface FluentOps<C, UB extends UsageBound<C>> {
  readonly __usageBound: UB;
  
  // Core fluent methods that operate on inner types but propagate container bounds
  map<B>(f: (a: InnerType<C>) => B): FluentOps<ContainerOf<C, B>, UsageBound<ContainerOf<C, B>>>;
  filter(predicate: (a: InnerType<C>) => boolean): FluentOps<C, UsageBound<C>>;
  scan<B>(initial: B, f: (acc: B, a: InnerType<C>) => B): FluentOps<ContainerOf<C, B>, UsageBound<ContainerOf<C, B>>>;
  chain<B>(f: (a: InnerType<C>) => FluentOps<ContainerOf<C, B>, UsageBound<ContainerOf<C, B>>>): FluentOps<ContainerOf<C, B>, UsageBound<ContainerOf<C, B>>>;
  flatMap<B>(f: (a: InnerType<C>) => FluentOps<ContainerOf<C, B>, UsageBound<ContainerOf<C, B>>>): FluentOps<ContainerOf<C, B>, UsageBound<ContainerOf<C, B>>>;
  take(n: number): FluentOps<C, UsageBound<C>>;
  
  // Utility methods
  getUsageBound(): UsageBound<C>;
  validateUsage(input: C): Multiplicity;
  getValue(): C;
}

// ============================================================================
// Fluent Wrapper Implementation
// ============================================================================

/**
 * Base implementation of FluentOps that handles usage bound propagation
 * A = InnerType<C> constraint enforced at instantiation
 */
export abstract class FluentOpsImpl<A, C, UB extends UsageBound<C>> 
  implements FluentOps<C, UB> {
  constructor(
    protected readonly value: C,
    public readonly __usageBound: UB
  ) {}

  /**
   * Get the current usage bound
   */
  getUsageBound(): UsageBound<C> {
    return this.__usageBound;
  }

  /**
   * Validate usage for a given input
   */
  validateUsage(input: C): Multiplicity {
    const usage = this.__usageBound.usage(input);
    
    // Runtime validation in dev mode
    // Check config for runtime validation setting
    if (globalConfig.runtimeValidation) {
      if (this.__usageBound.maxUsage !== undefined && 
          usage !== "∞" && 
          this.__usageBound.maxUsage !== "∞" && 
          usage > this.__usageBound.maxUsage) {
        throw new Error(`Usage ${usage} exceeds maximum bound ${this.__usageBound.maxUsage}`);
      }
    }
    
    return usage;
  }

  /**
   * Get the wrapped value
   */
  getValue(): C {
    return this.value;
  }

  // ============================================================================
  // Core Fluent Methods with Usage Propagation (Abstract)
  // These use InnerType<C> to match the interface but will be overridden
  // by concrete implementations that know A = InnerType<C>
  // ============================================================================

  /**
   * Map with usage propagation
   * Usage bound remains the same (1:1 transformation)
   */
  abstract map<B>(f: (a: InnerType<C>) => B): FluentOps<ContainerOf<C, B>, UsageBound<ContainerOf<C, B>>>;

  /**
   * Filter with usage propagation
   * Usage bound remains the same or decreases (never increases)
   */
  abstract filter(predicate: (a: InnerType<C>) => boolean): FluentOps<C, UsageBound<C>>;

  /**
   * Scan with usage propagation
   * Usage bound = input bound × 1 (once per element)
   */
  abstract scan<B>(initial: B, f: (acc: B, a: InnerType<C>) => B): FluentOps<ContainerOf<C, B>, UsageBound<ContainerOf<C, B>>>;

  /**
   * Chain with usage propagation
   * Usage bound multiplies by inner stream's bound
   */
  abstract chain<B>(f: (a: InnerType<C>) => FluentOps<ContainerOf<C, B>, UsageBound<ContainerOf<C, B>>>): FluentOps<ContainerOf<C, B>, UsageBound<ContainerOf<C, B>>>;

  /**
   * FlatMap with usage propagation (alias for chain)
   */
  flatMap<B>(f: (a: InnerType<C>) => FluentOps<ContainerOf<C, B>, UsageBound<ContainerOf<C, B>>>): FluentOps<ContainerOf<C, B>, UsageBound<ContainerOf<C, B>>> {
    return this.chain(f);
  }

  /**
   * Take with usage propagation
   * Usage bound = min(currentBound, n)
   */
  abstract take(n: number): FluentOps<C, UsageBound<C>>;
}

// ============================================================================
// Usage Bound Propagation Helpers
// ============================================================================

/**
 * Multiply usage bounds for sequential composition
 */
// Note: multiplyUsageBounds is imported from canonical types

/**
 * Take minimum of usage bounds
 */
export function minUsageBounds<A>(
  bound1: UsageBound<A>,
  bound2: UsageBound<A>
): UsageBound<A> {
  return {
    usage: (input: A): Multiplicity => {
      const usage1 = bound1.usage(input);
      const usage2 = bound2.usage(input);
      
      if (usage1 === "∞") return usage2;
      if (usage2 === "∞") return usage1;
      return Math.min(usage1, usage2);
    },
    maxUsage: bound1.maxUsage === "∞" ? bound2.maxUsage :
              bound2.maxUsage === "∞" ? bound1.maxUsage :
              bound1.maxUsage !== undefined && bound2.maxUsage !== undefined ?
              Math.min(bound1.maxUsage, bound2.maxUsage) : undefined
  };
}

/**
 * Create usage bound for filter operation
 * Usage bound remains the same or decreases
 */
export function filterUsageBound<A>(
  original: UsageBound<A>,
  predicate: (a: A) => boolean
): UsageBound<A> {
  return {
    usage: (input: A): Multiplicity => {
      const originalUsage = original.usage(input);
      // Filter can only decrease usage, never increase
      return originalUsage;
    },
    maxUsage: original.maxUsage
  };
}

/**
 * Create usage bound for scan operation
 * Usage bound = input bound × 1 (once per element)
 */
export function scanUsageBound<A, B>(
  original: UsageBound<A>
): UsageBound<B> {
  return {
    usage: (input: B): Multiplicity => {
      // For scan operations, we use a constant multiplicity based on the original bound's maxUsage
      // since scan transforms the type but preserves cardinality
      return original.maxUsage || 1;
    },
    maxUsage: original.maxUsage
  };
}

/**
 * Create usage bound for take operation
 * Usage bound = min(currentBound, n)
 */
export function takeUsageBound<A>(
  original: UsageBound<A>,
  n: number
): UsageBound<A> {
  return {
    usage: (input: A): Multiplicity => {
      const originalUsage = original.usage(input);
      if (originalUsage === "∞") return n;
      return Math.min(originalUsage, n);
    },
    maxUsage: original.maxUsage === "∞" ? n :
              original.maxUsage !== undefined ? Math.min(original.maxUsage, n) : n
  };
}

// ============================================================================
// Registry Integration
// ============================================================================

/**
 * Get usage bound for a type from registry
 */
export function getUsageBoundForType<T>(typeKey: string): UsageBound<T> {
  // Try usage registry first
  const usageRegistry = getUsageBound(typeKey);
  if (usageRegistry) {
    return {
      usage: usageRegistry.usage as Usage<T>,
      maxUsage: usageRegistry.maxUsage
    };
  }
  
  // Try global registry
  const globalRegistry = getGlobalUsageBound(typeKey);
  if (globalRegistry) {
    return {
      usage: globalRegistry.usage as Usage<T>,
      maxUsage: globalRegistry.maxUsage
    };
  }
  
  // Default to infinite usage
  return infiniteBound<T>();
}

/**
 * Create fluent wrapper with usage bound from registry
 */
export function createFluentWrapper<T>(
  value: T,
  typeKey: string,
  customUsage?: Usage<T>
): FluentOps<T, UsageBound<T>> {
  const usageBound = customUsage ? 
    { usage: customUsage, maxUsage: undefined } :
    getUsageBoundForType<T>(typeKey);
  
  return new GenericFluentWrapper(value, usageBound);
}

// ============================================================================
// Generic Fluent Wrapper Implementation
// ============================================================================

/**
 * Generic implementation of FluentOps for any value type
 */
class GenericFluentWrapper<T> extends FluentOpsImpl<T, T, UsageBound<T>> {
  constructor(value: T, usageBound: UsageBound<T>) {
    super(value, usageBound);
  }

  map<B>(f: (a: InnerType<T>) => B): FluentOps<ContainerOf<T, B>, UsageBound<ContainerOf<T, B>>> {
    const mappedValue = f(this.value as InnerType<T>);
    const mappedUsageBound: UsageBound<ContainerOf<T, B>> = {
      usage: (input: ContainerOf<T, B>): Multiplicity => this.__usageBound.usage(input as T),
      maxUsage: this.__usageBound.maxUsage
    };
    
    return new GenericFluentWrapper(mappedValue as ContainerOf<T, B>, mappedUsageBound) as FluentOps<ContainerOf<T, B>, UsageBound<ContainerOf<T, B>>>;
  }

  filter(predicate: (a: InnerType<T>) => boolean): FluentOps<T, UsageBound<T>> {
    if (!predicate(this.value as InnerType<T>)) {
      // If filtered out, return empty wrapper
      const emptyUsageBound: UsageBound<T> = {
        usage: () => 0,
        maxUsage: 0
      };
      return new GenericFluentWrapper(this.value, emptyUsageBound) as FluentOps<T, UsageBound<T>>;
    }
    
    const filteredUsageBound = filterUsageBound<T>(this.__usageBound, predicate as (a: T) => boolean);
    return new GenericFluentWrapper(this.value, filteredUsageBound) as FluentOps<T, UsageBound<T>>;
  }

  scan<B>(initial: B, f: (acc: B, a: InnerType<T>) => B): FluentOps<ContainerOf<T, B>, UsageBound<ContainerOf<T, B>>> {
    const scannedValue = f(initial, this.value as InnerType<T>);
    const scannedUsageBound = scanUsageBound<T, ContainerOf<T, B>>(this.__usageBound);
    
    return new GenericFluentWrapper(scannedValue as ContainerOf<T, B>, scannedUsageBound) as FluentOps<ContainerOf<T, B>, UsageBound<ContainerOf<T, B>>>;
  }

  chain<B>(f: (a: InnerType<T>) => FluentOps<ContainerOf<T, B>, UsageBound<ContainerOf<T, B>>>): FluentOps<ContainerOf<T, B>, UsageBound<ContainerOf<T, B>>> {
    const innerWrapper = f(this.value as InnerType<T>);
    const chainedUsageBound = multiplyUsageBounds<ContainerOf<T, B>>(
      this.__usageBound as UsageBound<ContainerOf<T, B>>,
      innerWrapper.getUsageBound()
    );
    
    // Access the value through the wrapper's getValue method
    const innerValue = innerWrapper.getValue() as ContainerOf<T, B>;
    return new GenericFluentWrapper(
      innerValue,
      chainedUsageBound
    ) as FluentOps<ContainerOf<T, B>, UsageBound<ContainerOf<T, B>>>;
  }

  take(n: number): FluentOps<T, UsageBound<T>> {
    const takeUsageBoundResult = takeUsageBound(this.__usageBound, n);
    return new GenericFluentWrapper(this.value, takeUsageBoundResult) as FluentOps<T, UsageBound<T>>;
  }

  // Expose the wrapped value
  getValue(): T {
    return this.value;
  }
}

// ============================================================================
// Type-Level Enforcement
// ============================================================================

/**
 * Type-level check if usage exceeds a bound
 */
export type ExceedingBound<Actual extends Multiplicity, Max extends Multiplicity> = 
  Max extends "∞" ? false :
  Actual extends "∞" ? true :
  Actual extends number ? 
    Max extends number ? 
      Actual extends Max ? false : true :
    never :
  never;

/**
 * Assert that usage is within bounds at compile time
 */
export type AssertWithinBound<Actual extends Multiplicity, Max extends Multiplicity> = 
  ExceedingBound<Actual, Max> extends true ? 
    never : // Compile error
    Actual;

/**
 * Compile-time error type
 */
export type CompileError = never;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a fluent wrapper with custom usage bound
 */
export function fluent<T>(
  value: T,
  usage: Usage<T>,
  maxUsage?: Multiplicity
): FluentOps<T, UsageBound<T>> {
  const usageBound: UsageBound<T> = { usage, maxUsage };
  return new GenericFluentWrapper(value, usageBound) as FluentOps<T, UsageBound<T>>;
}

/**
 * Create a fluent wrapper with infinite usage
 */
export function fluentInfinite<T>(value: T): FluentOps<T, UsageBound<T>> {
  return fluent(value, () => "∞", "∞");
}

/**
 * Create a fluent wrapper with usage = 1
 */
export function fluentOnce<T>(value: T): FluentOps<T, UsageBound<T>> {
  return fluent(value, () => 1, 1);
} 