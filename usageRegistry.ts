/**
 * Usage Registry for Global Typeclass System
 * 
 * This module provides a centralized registry for usage bounds across all
 * registered types in the typeclass system, enabling global usage tracking
 * and compile-time safety.
 */

import { FPKey } from './src/types/brands';

import { 
  Usage, 
  Multiplicity, 
  UsageBound
} from './src/stream/multiplicity/types';

import type { Eq, Ord, Show } from './fp-derivation-helpers';

// ============================================================================
// Core Registry Types
// ============================================================================

/**
 * Registry entry that extends the existing typeclass registry with usage information
 */
export interface RegistryEntry<K> {
  typeKey: K;
  instances: TypeclassInstances<K>;
  usage?: Usage<unknown>; // Optional: multiplicity tracking
}

/**
 * Typeclass instances interface (placeholder - will be imported from existing system)
 */
export interface TypeclassInstances<K> {
  functor?: unknown;
  applicative?: unknown;
  monad?: unknown;
  bifunctor?: unknown;
  eq?: Eq<unknown>;
  ord?: Ord<unknown>;
  show?: Show<unknown>;
  [key: string]: unknown;
}

/**
 * Usage registry interface
 */
export interface UsageRegistry {
  /**
   * Register usage for a type
   */
  register<K, T>(typeKey: K, usage: Usage<T>): void;
  
  /**
   * Get usage for a type
   */
  getUsage<K, T>(typeKey: K): Usage<T> | undefined;
  
  /**
   * Check if a type has usage registered
   */
  hasUsage<K>(typeKey: K): boolean;
  
  /**
   * Get all registered usages
   */
  getAllUsages(): Map<FPKey, unknown>;
  
  /**
   * Clear all usages
   */
  clear(): void;
}

// ============================================================================
// Global Usage Registry Implementation
// ============================================================================

/**
 * Global usage registry implementation
 */
class GlobalUsageRegistry implements UsageRegistry {
  private usages = new Map<FPKey, unknown>();

  register<K, T>(typeKey: K, usage: Usage<T>): void {
    this.usages.set(typeKey as unknown as FPKey, usage);
  }

  getUsage<K, T>(typeKey: K): Usage<T> | undefined {
    return this.usages.get(typeKey as unknown as FPKey) as Usage<T> | undefined;
  }

  hasUsage<K>(typeKey: K): boolean {
    return this.usages.has(typeKey as unknown as FPKey);
  }

  getAllUsages(): Map<FPKey, unknown> {
    return new Map(this.usages);
  }

  clear(): void {
    this.usages.clear();
  }
}

/**
 * Global registry instance
 */
export const usageRegistry = new GlobalUsageRegistry();

/**
 * Get usage bound for a type from the registry
 */
export function getUsageBound<T>(typeKey: string): UsageBound<T> | undefined {
  const usage = usageRegistry.getUsage(typeKey);
  return usage ? { usage } : undefined;
}

/**
 * Register usage for a type in the global registry
 */
export function registerUsage<T>(typeKey: string, usage: Usage<T>): void {
  usageRegistry.register(typeKey, usage);
}

/**
 * Set usage for a type with branded key
 */
export function setUsage<T = unknown>(typeName: string, usage: T): void {
  usageRegistry.register(typeName, usage as Usage<T>);
}

/**
 * Get usage for a type with branded key
 */
export function getUsage<T = unknown>(typeName: string): T | undefined {
  return usageRegistry.getUsage(typeName) as T | undefined;
}

//   getAllUsages(): Map<any, Usage<any>> {
//     return new Map(this.usages);
//   }

//   clear(): void {
//     this.usages.clear();
//   }
// }

// // ============================================================================
// // Global Registry Instance
// // ============================================================================

// /**
//  * Global usage registry instance
//  */
// let globalUsageRegistry: UsageRegistry | undefined;

// /**
//  * Get the global usage registry, creating it if it doesn't exist
//  */
// export function getUsageRegistry(): UsageRegistry {
//   if (!globalUsageRegistry) {
//     globalUsageRegistry = new GlobalUsageRegistry();
//   }
//   return globalUsageRegistry;
// }

// // ============================================================================
// // Built-in Usage Definitions
// // ============================================================================

// /**
//  * Usage bounds for core optic types
//  */
// export const OPTIC_USAGES = {
//   // Lens: focuses exactly one field
//   Lens: onceUsage<any>(),
  
//   // Prism: 0 or 1 depending on match success
//   Prism: <A>() => (input: A): Multiplicity => {
//     // This is a simplified version - in practice, we'd need to check the actual match
//     return 1; // Default to 1, but could be 0 if match fails
//   },
  
//   // Optional: 0 or 1 depending on presence
//   Optional: <A>() => (input: A): Multiplicity => {
//     // This is a simplified version - in practice, we'd need to check the actual presence
//     return 1; // Default to 1, but could be 0 if not present
//   },
  
//   // Traversal: 0..N where N is the number of focused elements
//   Traversal: <A>() => (input: A): Multiplicity => {
//     // This is a simplified version - in practice, we'd need to count the elements
//     if (Array.isArray(input)) {
//       return input.length;
//     }
//     return 1; // Default to 1 for non-array inputs
//   },
  
//   // Iso: always transforms exactly once
//   Iso: onceUsage<any>(),
  
//   // ObservableLite: infinite unless restricted
//   ObservableLite: infiniteUsage<any>(),
  
//   // StatefulStream: usage from stream definition
//   StatefulStream: <A>() => (input: A): Multiplicity => {
//     // This will be determined by the specific stream implementation
//     return "∞"; // Default to infinite
//   }
// } as const;

// // ============================================================================
// // Registration Functions
// // ============================================================================

// /**
//  * Register usage for a built-in type
//  */
// export function registerBuiltinUsage<K>(typeKey: K, usage: Usage<any>): void {
//   const registry = getUsageRegistry();
//   registry.registerUsage(typeKey, usage);
// }

// /**
//  * Register all built-in usages
//  */
// export function registerAllBuiltinUsages(): void {
//   const registry = getUsageRegistry();
  
//   // Register optic usages
//   registry.registerUsage('Lens', OPTIC_USAGES.Lens);
//   registry.registerUsage('Prism', OPTIC_USAGES.Prism());
//   registry.registerUsage('Optional', OPTIC_USAGES.Optional());
//   registry.registerUsage('Traversal', OPTIC_USAGES.Traversal());
//   registry.registerUsage('Iso', OPTIC_USAGES.Iso);
//   registry.registerUsage('ObservableLite', OPTIC_USAGES.ObservableLite);
//   registry.registerUsage('StatefulStream', OPTIC_USAGES.StatefulStream());
  
//   console.log('✅ Registered all built-in usage bounds');
// }

// // ============================================================================
// // Global Access API
// // ============================================================================

// /**
//  * Get usage bound for a type
//  */
// export function getUsageBound<K>(typeKey: K): Usage<any> | undefined {
//   const registry = getUsageRegistry();
//   return registry.getUsage(typeKey);
// }

// /**
//  * Check if a type has a usage bound
//  */
// export function hasUsageBound<K>(typeKey: K): boolean {
//   const registry = getUsageRegistry();
//   return registry.hasUsage(typeKey);
// }

// /**
//  * Register usage for a type
//  */
// export function registerUsage<K>(typeKey: K, usage: Usage<any>): void {
//   const registry = getUsageRegistry();
//   registry.registerUsage(typeKey, usage);
// }

// // ============================================================================
// // Auto-initialization
// // ============================================================================

// // Auto-register built-in usages when this module is imported
// registerAllBuiltinUsages(); 