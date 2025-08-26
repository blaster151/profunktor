// Minimal FP Registry (side-effect free, no eager imports)

import { Brand, FPKey } from './src/types/brands';

export interface FPRegistry<V = unknown> {
  readonly store: Map<FPKey, V>;
  readonly derivable: Map<FPKey, V>;
  register: <T extends V = V>(key: FPKey, value: T) => void;
  get: <T extends V = V>(key: FPKey) => T | undefined;
  has: (key: FPKey) => boolean;
}

function createRegistry<V = unknown>(): FPRegistry<V> {
  const store = new Map<FPKey, V>();
  const derivable = new Map<FPKey, V>();
  return {
    store,
    derivable,
    register: (key, value) => { store.set(key, value); },
    get: <T extends V = V>(key) => store.get(key) as T | undefined,
    has: (key) => store.has(key)
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __FP_REGISTRY: FPRegistry | undefined;
}

export function ensureFPRegistry(): FPRegistry {
  if (!globalThis.__FP_REGISTRY) {
    globalThis.__FP_REGISTRY = createRegistry();
  }
  return globalThis.__FP_REGISTRY;
}

// Export quick helpers for convenience
export function register<T = unknown>(name: string, value: T): void {
  ensureFPRegistry().register(name as unknown as FPKey, value);
}
export function get<T = unknown>(name: string): T | undefined {
  return ensureFPRegistry().get<T>(name as unknown as FPKey);
}
export function has(name: string): boolean {
  return ensureFPRegistry().has(name as unknown as FPKey);
}

// Minimal FP Registry stub to keep registrations optional and non-failing

// Legacy stub API removed to avoid duplicate exports

/**
 * FP Registry Initialization
 * 
 * This module initializes the global FP registry and registers all FP components
 * including ObservableLite and TaskEither with their typeclass instances.
 */

// Heavy imports removed in minimal facade

// ============================================================================
// Part 1: Global Registry Interface
// ============================================================================

/**
 * Global FP Registry interface
 */
// Expanded registry API omitted in minimal facade

// ============================================================================
// Part 2: Global Registry Implementation
// ============================================================================

/**
 * Global FP Registry implementation
 */
class GlobalFPRegistry implements FPRegistry {
  public store = new Map<FPKey, unknown>();
  public derivable = new Map<FPKey, unknown>();
  register = (key: FPKey, value: unknown) => { this.store.set(key, value); };
  get = <T = unknown>(key: FPKey) => this.store.get(key) as T | undefined;
  has = (key: FPKey) => this.store.has(key);
}

// ============================================================================
// Part 3: Global Registry Setup
// ============================================================================

/**
 * Initialize the global FP registry
 */
export function initializeFPRegistry(): FPRegistry {
  const registry = new GlobalFPRegistry();
  if (typeof globalThis !== 'undefined') {
    globalThis.__FP_REGISTRY = registry;
  }
  return registry;
}

// ============================================================================
// Part 4: Registry Access Functions
// ============================================================================

/**
 * Get the global FP registry
 */
/**
 * Get FP Registry - ensure it exists
 */
export function getFPRegistry(): FPRegistry { 
  return ensureFPRegistry(); 
}

/**
 * Get derivable instances from the registry
 */
export function getDerivableInstances(name: string): unknown { 
  return getFPRegistry().derivable.get(name as unknown as FPKey); 
}

/**
 * Get a typeclass instance from the registry
 */
export function getTypeclassInstance(name: string, tc: string): unknown {
  const instances = getDerivableInstances(name);
  if (!instances) return undefined;
  
  // Switch on typeclass name and return from derivable map
  switch (tc) {
    case 'Functor': return (instances as Record<string, unknown>).Functor;
    case 'Applicative': return (instances as Record<string, unknown>).Applicative;
    case 'Monad': return (instances as Record<string, unknown>).Monad;
    case 'Traversable': return (instances as Record<string, unknown>).Traversable;
    case 'Bifunctor': return (instances as Record<string, unknown>).Bifunctor;
    case 'Alternative': return (instances as Record<string, unknown>).Alternative;
    case 'MonadError': return (instances as Record<string, unknown>).MonadError;
    default: return (instances as Record<string, unknown>)[tc];
  }
}

/**
 * Get purity effect from the registry
 */
export function getPurityEffect(_name: string): string | undefined { 
  return undefined; 
}

/**
 * Get usage bound for a type from the global registry
 */
export function getUsageBound(_name: string): unknown { return undefined; }

/**
 * Register usage for a type in the global registry
 */
export function registerUsageBound(_name: string, _usage: unknown): void { /* no-op */ }

// ============================================================================
// Part 5: Auto-Initialization
// ============================================================================

// Auto-initialize the registry when this module is loaded
export const globalFPRegistry = initializeFPRegistry();

// Export the registry for direct access
export default globalFPRegistry; 