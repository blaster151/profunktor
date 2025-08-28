/**
 * Automatic Typeclass Derivation System
 * 
 * Provides helpers to automatically derive Functor, Applicative, Monad, Bifunctor,
 * Eq, Ord, and Show instances for ADTs without manual boilerplate.
 */

import type { 
  Functor, 
  Applicative, 
  Monad, 
  Bifunctor
} from './fp-typeclasses';
import type { Kind1, Kind2, Apply, Type } from './fp-hkt';

// ============================================================================
// Core Derivation Types
// ============================================================================

/**
 * Configuration for instance derivation
 */
export interface DerivationConfig {
  functor?: boolean;
  applicative?: boolean;
  monad?: boolean;
  bifunctor?: boolean;
  eq?: boolean;
  ord?: boolean;
  show?: boolean;
  usage?: any; // Optional: usage bound for the type
  customMap?: <A, B>(fa: any, f: (a: A) => B) => any;
  customChain?: <A, B>(fa: any, f: (a: A) => any) => any;
  customBimap?: <A, B, C, D>(fab: any, f: (a: A) => C, g: (b: B) => D) => any;
  customEq?: (a: any, b: any) => boolean;
  customOrd?: (a: any, b: any) => number;
  customShow?: (a: any) => string;
}

/**
 * Result of instance derivation
 */
export interface DerivedInstances {
  functor?: Functor<any>;
  applicative?: Applicative<any>;
  monad?: Monad<any>;
  bifunctor?: Bifunctor<any>;
  eq?: Eq<any>;
  ord?: Ord<any>;
  show?: Show<any>;
  usage?: any; // Optional: usage bound for the type
}

// ============================================================================
// Typeclass Interfaces
// ============================================================================

/**
 * Eq typeclass for equality
 */
export interface Eq<A> {
  equals(a: A, b: A): boolean;
}

/**
 * Ord typeclass for ordering
 */
export interface Ord<A> extends Eq<A> {
  compare(a: A, b: A): number; // -1, 0, 1
}

/**
 * Show typeclass for string representation
 */
export interface Show<A> {
  show(a: A): string;
}

// ============================================================================
// ADT Analysis Helpers
// ============================================================================

/**
 * Analyze ADT structure for derivation
 */
export interface ADTAnalysis {
  isSumType: boolean;
  isProductType: boolean;
  constructors: string[];
  fields: Record<string, any[]>;
  hasMatch: boolean;
  hasTag: boolean;
}

/**
 * Analyze an ADT for derivation
 */
export function analyzeADT(adt: any): ADTAnalysis {
  const analysis: ADTAnalysis = {
    isSumType: false,
    isProductType: false,
    constructors: [],
    fields: {},
    hasMatch: typeof adt.match === 'function',
    hasTag: 'tag' in adt
  };

  // Check if it's a sum type (tagged union)
  if (analysis.hasTag && analysis.hasMatch) {
    analysis.isSumType = true;
    
    // Try to extract constructors from match
    try {
      const matchResult = adt.match({});
      // This is a simplified analysis - in practice we'd need more sophisticated detection
    } catch (e) {
      // Expected for incomplete match
    }
  }

  // Check if it's a product type (record/object)
  if (!analysis.isSumType && typeof adt === 'object' && adt !== null) {
    analysis.isProductType = true;
    analysis.fields = Object.keys(adt).reduce((acc, key) => {
      acc[key] = [adt[key]];
      return acc;
    }, {} as Record<string, any[]>);
  }

  return analysis;
}

// ============================================================================
// Functor Derivation
// ============================================================================

/**
 * Derive Functor instance for an ADT
 */
export function deriveFunctor<F extends Kind1>(
  config: DerivationConfig = {}
): Functor<F> {
  return {
    map: <A, B>(fa: Apply<F, [A]>, f: (a: A) => B): Apply<F, [B]> => {
      if (config.customMap) {
        return config.customMap(fa, f);
      }

      // Default implementation for tagged unions
      if (typeof fa === 'object' && fa !== null && 'tag' in (fa as any)) {
        return (fa as any).match({
          Just: ({ value }: { value: unknown }) => ({ tag: 'Just', value: f(value as any) }),
          Nothing: () => ({ tag: 'Nothing' }),
          Left: ({ value }: { value: unknown }) => ({ tag: 'Left', value }),
          Right: ({ value }: { value: unknown }) => ({ tag: 'Right', value: f(value as any) }),
          Ok: ({ value }: { value: unknown }) => ({ tag: 'Ok', value: f(value as any) }),
          Err: ({ error }: { error: unknown }) => ({ tag: 'Err', error }),
          _: (tag: string, payload: unknown) => ({ tag, ...(payload as Record<string, unknown>) })
        });
      }

      // Default implementation for arrays
      if (Array.isArray(fa)) {
        return fa.map(f) as Apply<F, [B]>;
      }

      throw new Error('Cannot derive Functor for unknown type');
    }
  };
}

// ============================================================================
// Applicative Derivation
// ============================================================================

/**
 * Derive Applicative instance for an ADT
 */
export function deriveApplicative<F extends Kind1>(
  config: DerivationConfig = {}
): Applicative<F> {
  const functor = deriveFunctor<F>(config);

  return {
    ...functor,
    of: <A>(a: A): Apply<F, [A]> => {
      // Default implementation for Maybe
      return { tag: 'Just', value: a } as Apply<F, [A]>;
    },
    ap: <A, B>(fab: Apply<F, [(a: A) => B]>, fa: Apply<F, [A]>): Apply<F, [B]> => {
      // Default implementation for Maybe
      return (fab as any).match({
        Just: ({ value: f }: { value: unknown }) => functor.map(fa, f as any),
        Nothing: () => ({ tag: 'Nothing' }),
        _: () => functor.map(fa, (a: A) => (fab as any).value(a))
      });
    }
  };
}

// ============================================================================
// Monad Derivation
// ============================================================================

/**
 * Derive Monad instance for an ADT
 */
export function deriveMonad<F extends Kind1>(
  config: DerivationConfig = {}
): Monad<F> {
  const applicative = deriveApplicative<F>(config);

  return {
    ...applicative,
    chain: <A, B>(fa: Apply<F, [A]>, f: (a: A) => Apply<F, [B]>): Apply<F, [B]> => {
      if (config.customChain) {
        return config.customChain(fa, f);
      }

      // Default implementation for Maybe
      return (fa as any).match({
        Just: ({ value }: { value: unknown }) => f(value as any),
        Nothing: () => ({ tag: 'Nothing' }),
        Left: ({ value }: { value: unknown }) => ({ tag: 'Left', value }),
        Right: ({ value }: { value: unknown }) => f(value as any),
        Ok: ({ value }: { value: unknown }) => f(value as any),
        Err: ({ error }: { error: unknown }) => ({ tag: 'Err', error }),
        _: (tag: string, payload: unknown) => ({ tag, ...(payload as Record<string, unknown>) })
      });
    }
  };
}

// ============================================================================
// Bifunctor Derivation
// ============================================================================

/**
 * Derive Bifunctor instance for an ADT
 */
export function deriveBifunctor<F extends Kind2>(
  config: DerivationConfig = {}
): Bifunctor<F> {
  return {
    bimap: <A, B, C, D>(
      fab: Apply<F, [A, B]>, 
      f: (a: A) => C, 
      g: (b: B) => D
    ): Apply<F, [C, D]> => {
      if (config.customBimap) {
        return config.customBimap(fab, f, g);
      }

      // Default implementation for Either/Result
      return (fab as any).match({
        Left: ({ value }: { value: unknown }) => ({ tag: 'Left', value: f(value as any) }),
        Right: ({ value }: { value: unknown }) => ({ tag: 'Right', value: g(value as any) }),
        Ok: ({ value }: { value: unknown }) => ({ tag: 'Ok', value: g(value as any) }),
        Err: ({ error }: { error: unknown }) => ({ tag: 'Err', error: f(error as any) }),
        _: (tag: string, payload: unknown) => ({ tag, ...(payload as Record<string, unknown>) })
      });
    },
    mapLeft: <A, B, C>(fab: Apply<F, [A, B]>, f: (a: A) => C): Apply<F, [C, B]> => {
      return (deriveBifunctor<F>(config).bimap as any)(fab, f, (b: B) => b);
    },
    mapRight: <A, B, D>(fab: Apply<F, [A, B]>, g: (b: B) => D): Apply<F, [A, D]> => {
      return (deriveBifunctor<F>(config).bimap as any)(fab, (a: A) => a, g);
    }
  };
}

// ============================================================================
// Eq Derivation
// ============================================================================

/**
 * Derive Eq instance for an ADT
 */
export function deriveEq<A>(config: DerivationConfig = {}): Eq<A> {
  return {
    equals: (a: A, b: A): boolean => {
      if (config.customEq) {
        return config.customEq(a, b);
      }

      // Default deep equality for tagged unions
      if (typeof a === 'object' && a !== null && 'tag' in (a as any) &&
          typeof b === 'object' && b !== null && 'tag' in (b as any)) {
        
        if ((a as any).tag !== (b as any).tag) return false;

        return (a as any).match({
          Just: ({ value: aValue }: { value: unknown }) => (b as any).match({
            Just: ({ value: bValue }: { value: unknown }) => {
              // Safe comparison with type narrowing
              if (typeof aValue === "number" && typeof bValue === "number") {
                return aValue === bValue;
              }
              if (typeof aValue === "string" && typeof bValue === "string") {
                return aValue === bValue;
              }
              if (typeof aValue === "boolean" && typeof bValue === "boolean") {
                return aValue === bValue;
              }
              // For objects, use JSON comparison as fallback
              return JSON.stringify(aValue) === JSON.stringify(bValue);
            },
            Nothing: () => false
          }),
          Nothing: () => (b as any).match({
            Just: () => false,
            Nothing: () => true
          }),
          Left: ({ value: aValue }: { value: unknown }) => (b as any).match({
            Left: ({ value: bValue }: { value: unknown }) => {
              // Safe comparison with type narrowing
              if (typeof aValue === "number" && typeof bValue === "number") {
                return aValue === bValue;
              }
              if (typeof aValue === "string" && typeof bValue === "string") {
                return aValue === bValue;
              }
              if (typeof aValue === "boolean" && typeof bValue === "boolean") {
                return aValue === bValue;
              }
              // For objects, use JSON comparison as fallback
              return JSON.stringify(aValue) === JSON.stringify(bValue);
            },
            Right: () => false
          }),
          Right: ({ value: aValue }: { value: unknown }) => (b as any).match({
            Left: () => false,
            Right: ({ value: bValue }: { value: unknown }) => {
              // Safe comparison with type narrowing
              if (typeof aValue === "number" && typeof bValue === "number") {
                return aValue === bValue;
              }
              if (typeof aValue === "string" && typeof bValue === "string") {
                return aValue === bValue;
              }
              if (typeof aValue === "boolean" && typeof bValue === "boolean") {
                return aValue === bValue;
              }
              // For objects, use JSON comparison as fallback
              return JSON.stringify(aValue) === JSON.stringify(bValue);
            }
          }),
          Ok: ({ value: aValue }: { value: unknown }) => (b as any).match({
            Ok: ({ value: bValue }: { value: unknown }) => {
              // Safe comparison with type narrowing
              if (typeof aValue === "number" && typeof bValue === "number") {
                return aValue === bValue;
              }
              if (typeof aValue === "string" && typeof bValue === "string") {
                return aValue === bValue;
              }
              if (typeof aValue === "boolean" && typeof bValue === "boolean") {
                return aValue === bValue;
              }
              // For objects, use JSON comparison as fallback
              return JSON.stringify(aValue) === JSON.stringify(bValue);
            },
            Err: () => false
          }),
          Err: ({ error: aError }: { error: unknown }) => (b as any).match({
            Ok: () => false,
            Err: ({ error: bError }: { error: unknown }) => {
              // Safe comparison with type assertion
              return (aError as any) === (bError as any);
            }
          }),
          _: (tag: string, payload: unknown) => {
            // Deep equality for other fields
            return JSON.stringify(payload) === JSON.stringify((b as any)[tag]);
          }
        });
      }

      // Default equality
      return a === b;
    }
  };
}

// ============================================================================
// Ord Derivation
// ============================================================================

/**
 * Derive Ord instance for an ADT
 */
export function deriveOrd<A>(config: DerivationConfig = {}): Ord<A> {
  const eq = deriveEq<A>(config);

  return {
    ...eq,
    compare: (a: A, b: A): number => {
      if (config.customOrd) {
        return config.customOrd(a, b);
      }

      // Default lexicographic ordering for tagged unions
      if (typeof a === 'object' && a !== null && 'tag' in (a as any) &&
          typeof b === 'object' && b !== null && 'tag' in (b as any)) {
        
        // First compare tags
        const tagComparison = (a as any).tag.localeCompare((b as any).tag);
        if (tagComparison !== 0) return tagComparison;

        // Then compare values
        return (a as any).match({
                      Just: ({ value: aValue }: { value: unknown }) => (b as any).match({
            Just: ({ value: bValue }: { value: unknown }) => {
              // Safe comparison with type narrowing
              if (typeof aValue === "number" && typeof bValue === "number") {
                if (aValue < bValue) return -1;
                if (aValue > bValue) return 1;
                return 0;
              }
              if (typeof aValue === "string" && typeof bValue === "string") {
                if (aValue < bValue) return -1;
                if (aValue > bValue) return 1;
                return 0;
              }
              // For other types, use JSON comparison
              const aStr = JSON.stringify(aValue);
              const bStr = JSON.stringify(bValue);
              if (aStr < bStr) return -1;
              if (aStr > bStr) return 1;
              return 0;
            },
            Nothing: () => 1 // Just > Nothing
          }),
          Nothing: () => (b as any).match({
            Just: () => -1, // Nothing < Just
            Nothing: () => 0
          }),
          Left: ({ value: aValue }: { value: unknown }) => (b as any).match({
            Left: ({ value: bValue }: { value: unknown }) => {
              // Safe comparison with type narrowing
              if (typeof aValue === "number" && typeof bValue === "number") {
                if (aValue < bValue) return -1;
                if (aValue > bValue) return 1;
                return 0;
              }
              if (typeof aValue === "string" && typeof bValue === "string") {
                if (aValue < bValue) return -1;
                if (aValue > bValue) return 1;
                return 0;
              }
              // For other types, use JSON comparison
              const aStr = JSON.stringify(aValue);
              const bStr = JSON.stringify(bValue);
              if (aStr < bStr) return -1;
              if (aStr > bStr) return 1;
              return 0;
            },
            Right: () => -1 // Left < Right
          }),
                      Right: ({ value: aValue }: { value: unknown }) => (b as any).match({
            Left: () => 1, // Right > Left
            Right: ({ value: bValue }: { value: unknown }) => {
              // Safe comparison with type narrowing
              if (typeof aValue === "number" && typeof bValue === "number") {
                if (aValue < bValue) return -1;
                if (aValue > bValue) return 1;
                return 0;
              }
              if (typeof aValue === "string" && typeof bValue === "string") {
                if (aValue < bValue) return -1;
                if (aValue > bValue) return 1;
                return 0;
              }
              // For other types, use JSON comparison
              const aStr = JSON.stringify(aValue);
              const bStr = JSON.stringify(bValue);
              if (aStr < bStr) return -1;
              if (aStr > bStr) return 1;
              return 0;
            }
          }),
          _: () => 0 // Default case
        });
      }

      // Default comparison
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    }
  };
}

// ============================================================================
// Show Derivation
// ============================================================================

/**
 * Derive Show instance for an ADT
 */
export function deriveShow<A>(config: DerivationConfig = {}): Show<A> {
  return {
    show: (a: A): string => {
      if (config.customShow) {
        return config.customShow(a);
      }

      // Default string representation for tagged unions
      if (typeof a === 'object' && a !== null && 'tag' in (a as any)) {
        return (a as any).match({
          Just: ({ value }: { value: unknown }) => `Just(${JSON.stringify(value)})`,
          Nothing: () => 'Nothing',
          Left: ({ value }: { value: unknown }) => `Left(${JSON.stringify(value)})`,
          Right: ({ value }: { value: unknown }) => `Right(${JSON.stringify(value)})`,
          Ok: ({ value }: { value: unknown }) => `Ok(${JSON.stringify(value)})`,
          Err: ({ error }: { error: unknown }) => `Err(${JSON.stringify(error)})`,
          _: (tag: string, payload: any) => `${tag}(${JSON.stringify(payload)})`
        });
      }

      // Default string representation
      return JSON.stringify(a);
    }
  };
}

// ============================================================================
// Main Derivation Function (DEPRECATED)
// ============================================================================

/**
 * Derive all requested instances for an ADT
 * @deprecated Use individual derivation functions (deriveEqInstance, deriveFunctorInstance, etc.) instead.
 * This function will be removed in a future version.
 */
export function deriveInstances<F extends Kind1>(
  config: DerivationConfig
): DerivedInstances {
  console.warn('⚠️ deriveInstances is deprecated. Use individual derivation functions instead.');
  
  const instances: DerivedInstances = {};

  if (config.functor) {
    instances.functor = deriveFunctor<F>(config);
  }

  if (config.applicative) {
    instances.applicative = deriveApplicative<F>(config);
  }

  if (config.monad) {
    instances.monad = deriveMonad<F>(config);
  }

  if (config.bifunctor) {
    // For bifunctor derivation, allow passing a binary kind independently
    instances.bifunctor = deriveBifunctor<any>(config) as any;
  }

  if (config.eq) {
    instances.eq = deriveEq(config);
  }

  if (config.ord) {
    instances.ord = deriveOrd(config);
  }

  if (config.show) {
    instances.show = deriveShow(config);
  }

  // Include usage if provided
  if (config.usage) {
    instances.usage = config.usage;
  }

  return instances;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Derive Functor instance
 */
export function deriveFunctorInstance<F extends Kind1>(config?: DerivationConfig): Functor<F> {
  return deriveFunctor<F>(config);
}

/**
 * Derive Applicative instance
 */
export function deriveApplicativeInstance<F extends Kind1>(config?: DerivationConfig): Applicative<F> {
  return deriveApplicative<F>(config);
}

/**
 * Derive Monad instance
 */
export function deriveMonadInstance<F extends Kind1>(config?: DerivationConfig): Monad<F> {
  return deriveMonad<F>(config);
}

/**
 * Derive Bifunctor instance
 */
export function deriveBifunctorInstance<F extends Kind2>(config?: DerivationConfig): Bifunctor<F> {
  return deriveBifunctor<F>(config);
}

/**
 * Derive Eq instance
 */
export function deriveEqInstance<A>(config?: DerivationConfig): Eq<A> {
  return deriveEq<A>(config);
}

/**
 * Derive Ord instance
 */
export function deriveOrdInstance<A>(config?: DerivationConfig): Ord<A> {
  return deriveOrd<A>(config);
}

/**
 * Derive Show instance
 */
export function deriveShowInstance<A>(config?: DerivationConfig): Show<A> {
  return deriveShow<A>(config);
} 