/**
 * Fluent Instance Methods - Single place for prototype patching on effect monads
 * 
 * Provides explicit prototype installation that's guarded and idempotent.
 * This module has no side effects on import - installation must be explicitly
 * requested via installFluentInstanceMethods().
 */

// Type-only imports to avoid runtime dependencies
import type { IO, Task, State } from '../fp-effect-monads-complete';

// ============================================================================
// Installation State
// ============================================================================

/**
 * Installation flag to prevent duplicate patching
 */
let fluentInstanceMethodsInstalled = false;

// ============================================================================
// Main Installation Function
// ============================================================================

/**
 * Install fluent instance methods on effect monad prototypes
 * 
 * This function safely augments IO, Task, and State prototypes with fluent methods
 * using guards to prevent double-definition conflicts.
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
        return this.constructor.fromThunk(() => f(this.run()).run());
      };
    }
    
    if (!(IO.prototype as any).ap) {
      (IO.prototype as any).ap = function <A, B>(this: any, fab: any): any {
        return this.constructor.fromThunk(() => fab.run()(this.run()));
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
        return this.constructor.fromPromise(this.run().then((a: A) => f(a).run()));
      };
    }
    
    if (!(Task.prototype as any).ap) {
      (Task.prototype as any).ap = function <A, B>(this: any, fab: any): any {
        return this.constructor.fromPromise(
          Promise.all([fab.run(), this.run()]).then(([f, a]) => f(a))
        );
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
        return this.constructor.fromFn((s: S) => {
          const [a, s2] = this.run(s);
          return [f(a), s2];
        });
      };
    }
    
    if (!(State.prototype as any).chain) {
      (State.prototype as any).chain = function <S, A, B>(this: any, f: (a: A) => any): any {
        return this.constructor.fromFn((s: S) => {
          const [a, s2] = this.run(s);
          return f(a).run(s2);
        });
      };
    }
    
    if (!(State.prototype as any).ap) {
      (State.prototype as any).ap = function <S, A, B>(this: any, fab: any): any {
        return this.constructor.fromFn((s: S) => {
          const [f, s2] = fab.run(s);
          const [a, s3] = this.run(s2);
          return [f(a), s3];
        });
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

// ============================================================================
// Optional Auto-Installation (Dev Convenience)
// ============================================================================

// Optional: auto-install for dev builds
if ((globalThis as any).__FP_FLUENT_AUTO__ && !(globalThis as any).__FP_FLUENT_INSTALLED__) {
  installFluentInstanceMethods();
  (globalThis as any).__FP_FLUENT_INSTALLED__ = true;
}

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Type guard to check if a value has fluent methods installed
 */
export function hasFluentMethods(value: unknown): value is { map: Function; chain: Function; ap: Function } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'map' in value &&
    'chain' in value &&
    'ap' in value &&
    typeof (value as any).map === 'function' &&
    typeof (value as any).chain === 'function' &&
    typeof (value as any).ap === 'function'
  );
}

/**
 * Check if fluent instance methods have been installed
 */
export function areFluentInstanceMethodsInstalled(): boolean {
  return fluentInstanceMethodsInstalled;
}

// ============================================================================
// Legacy Compatibility
// ============================================================================

/**
 * Legacy alias for backward compatibility
 * @deprecated Use installFluentInstanceMethods() instead
 */
export const installFluent = installFluentInstanceMethods;
