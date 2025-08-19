// Minimal FP Registry (side-effect free, no eager imports)

export interface FPRegistry {
  readonly store: Map<string, any>;
  readonly derivable: Map<string, any>;
  register: (key: string, value: any) => void;
  get: <T = unknown>(key: string) => T | undefined;
  has: (key: string) => boolean;
}

function createRegistry(): FPRegistry {
  const store = new Map<string, any>();
  const derivable = new Map<string, any>();
  return {
    store,
    derivable,
    register: (key, value) => { store.set(key, value); },
    get: (key) => store.get(key),
    has: (key) => store.has(key),
  };
}

export function ensureFPRegistry(): FPRegistry {
  const g = globalThis as any;
  if (!g.__FP_REGISTRY) {
    g.__FP_REGISTRY = createRegistry();
  }
  return g.__FP_REGISTRY as FPRegistry;
}

// Export quick helpers for convenience
export function register(name: string, value: any): void {
  ensureFPRegistry().register(name, value);
}
export function get<T = unknown>(name: string): T | undefined {
  return ensureFPRegistry().get<T>(name);
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
  public store = new Map<string, any>();
  public derivable = new Map<string, any>();
  register = (key: string, value: any) => { this.store.set(key, value); };
  get = <T = unknown>(key: string) => this.store.get(key) as T | undefined;
  has = (key: string) => this.store.has(key);
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
    (globalThis as any).__FP_REGISTRY = registry;
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
export function getDerivableInstances(name: string): any { 
  return getFPRegistry().derivable.get(name); 
}

/**
 * Get a typeclass instance from the registry
 */
export function getTypeclassInstance(name: string, tc: string): any {
  const instances = getDerivableInstances(name);
  if (!instances) return undefined;
  
  // Switch on typeclass name and return from derivable map
  switch (tc) {
    case 'Functor': return instances.Functor;
    case 'Applicative': return instances.Applicative;
    case 'Monad': return instances.Monad;
    case 'Traversable': return instances.Traversable;
    case 'Bifunctor': return instances.Bifunctor;
    case 'Alternative': return instances.Alternative;
    case 'MonadError': return instances.MonadError;
    default: return instances[tc];
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
export function getUsageBound(_name: string): any { return undefined; }

/**
 * Register usage for a type in the global registry
 */
export function registerUsageBound(_name: string, _usage: any): void { /* no-op */ }

// ============================================================================
// Part 5: Auto-Initialization
// ============================================================================

// Auto-initialize the registry when this module is loaded
export const globalFPRegistry = initializeFPRegistry();

// Export the registry for direct access
export default globalFPRegistry; 