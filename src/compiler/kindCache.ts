/**
 * Stub implementation of kindCache for browser environment
 * Provides the minimal interface needed by fp-variance-derivation.ts
 */

export interface KindInfo {
  readonly arity: number;
  readonly variance: ReadonlyArray<string>;
}

export interface KindCache {
  get(modulePath: string, exportName: string): KindInfo | undefined;
}

export const defaultKindCache: KindCache = {
  get: () => undefined
};

export function hydrateKindInfoFromSideTable(
  cache: KindCache, 
  modulePath: string, 
  exportName: string
): KindInfo | undefined {
  return cache.get(modulePath, exportName);
}