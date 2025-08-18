/**
 * Fluent Core - Shared utilities for fluent method installation
 * 
 * This module provides safe utilities for installing fluent methods on prototypes
 * without side effects at import time. All fluent modules should use these utilities
 * to ensure consistent, safe, and idempotent prototype modification.
 */

/**
 * Safe installation flag to prevent duplicate installations
 * Uses Symbol.for to ensure global uniqueness across module boundaries
 */
export const SAFE_INSTALL_FLAG = Symbol.for('fp.fluent.installed.v1');

/**
 * Get the global object in a runtime-agnostic way
 * @returns The global object (globalThis, window, global, or self)
 */
export function getGlobal(): any {
  // Use globalThis if available (modern environments)
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }
  
  // Fallback for older environments
  if (typeof window !== 'undefined') {
    return window;
  }
  
  // Node.js global - check via string to avoid TypeScript errors
  try {
    const globalVar = Function('return (function() { return this; })() || (1, eval)("this")')();
    if (globalVar && typeof globalVar === 'object') {
      return globalVar;
    }
  } catch {
    // Ignore errors in strict mode or restricted environments
  }
  
  if (typeof self !== 'undefined') {
    return self;
  }
  
  // Last resort - create a minimal global-like object
  return {};
}

/**
 * Check if a fluent installation flag is already set
 * @param flag - The symbol flag to check
 * @returns true if the flag is set and truthy
 */
export function alreadyInstalled(flag: symbol): boolean {
  try {
    const global = getGlobal();
    return global[flag] === true;
  } catch {
    // If we can't access global, assume not installed
    return false;
  }
}

/**
 * Mark a fluent installation flag as installed
 * Idempotent - safe to call multiple times
 * @param flag - The symbol flag to set
 */
export function markInstalled(flag: symbol): void {
  try {
    const global = getGlobal();
    global[flag] = true;
  } catch {
    // Silently fail if we can't access global
    // This ensures the function doesn't throw in restricted environments
  }
}

/**
 * Safely define a property on an object prototype
 * Only defines if the property doesn't already exist
 * @param proto - The prototype object to modify
 * @param key - The property key to define
 * @param value - The value to assign to the property
 */
export function safeDefine<T extends object, K extends PropertyKey>(
  proto: T, 
  key: K, 
  value: any
): void {
  // Silently no-op if proto is falsy or not an object
  if (!proto || typeof proto !== 'object') {
    return;
  }
  
  // Only define if the property doesn't already exist
  if (!hasOwn(proto, key)) {
    try {
      Object.defineProperty(proto, key, {
        value,
        writable: false,
        configurable: false,
        enumerable: false
      });
    } catch {
      // Silently fail if defineProperty throws
      // This can happen with frozen objects or in restricted environments
    }
  }
}

/**
 * Safe wrapper for Object.prototype.hasOwnProperty.call
 * @param obj - The object to check
 * @param key - The property key to check for
 * @returns true if the object has the property as an own property
 */
export function hasOwn(obj: any, key: PropertyKey): boolean {
  try {
    return Object.prototype.hasOwnProperty.call(obj, key);
  } catch {
    // Return false if hasOwnProperty call fails
    return false;
  }
}

/**
 * No-op installer function for optional returns
 * Can be used as a safe default when installation is not needed
 */
export function noopInstaller(): void {
  // Intentionally empty
}
