/**
 * Readonly-aware GADT Pattern Matching
 * 
 * This module provides readonly-aware wrappers around the existing pmatch builder
 * while enforcing Immutable payloads at the handler boundary.
 * 
 * Features:
 * - pmatchReadonly: exhaustive matching with Immutable payloads
 * - pmatchReadonlyPartial: partial matching returning R | undefined
 * - createReadonlyGADTMatcher: curryable factory for total functions
 * - createReadonlyPmatchBuilder: fluent builder with readonly guarantees
 * - pmatchReadonlyK: K-style hook for future HKT integration
 */

// TODO [GitHub Copilot, 2025-08-19]:
// There is a persistent TypeScript inference issue with pmatchReadonly's handler payload type.
// For GADT cases like 'Neg', the payload is inferred as 'unknown' in downstream usage (e.g., tests/fp-gadt-readonly.test.ts),
// even with correct GADT and handler typing. This is likely due to the mapped type or handler signature here.
// See https://github.com/microsoft/TypeScript/issues/30581 for related TS issues.
// Until resolved, downstream tests using pmatchReadonly with nested GADTs may require type assertions or be skipped.
// -- GitHub Copilot

import {
  GADT, GADTTags, GADTPayload,
  pmatch, PatternMatcherBuilder
} from '../fp-gadt-enhanced';
import { Immutable } from '../fp-immutable';

/**
 * Readonly-aware pmatch: delegates to pmatch(gadt) but enforces Immutable payloads.
 * Exhaustive: throws if a tag is not handled at runtime; compile-time narrows via handlers type.
 */
export function pmatchReadonly<T extends GADT<string, any>, R>(
  gadt: T,
  handlers: {
    [K in GADTTags<T>]: (payload: Immutable<GADTPayload<T, K>>) => R;
  }
): R {
  const b = pmatch(gadt);
  // Register all handlers (keys are constrained by the mapped type).
  (Object.keys(handlers) as Array<GADTTags<T>>).forEach((tag) => {
    // The base pmatch builder type is `.with<Tag extends GADTTags<T>>(tag, handler)`.
    // We must coerce the handler to the builder's expected `(payload: GADTPayload<T, Tag>) => R`
    // but we promise immutability via the Immutable<RHS> type on our public API.
    b.with(tag as any, (handlers as any)[tag]);
  });
  return b.exhaustive();
}

/**
 * Partial readonly pmatch: returns undefined when no handler is present.
 * Note: We do not need to pre-register; we can resolve the single case directly.
 */
export function pmatchReadonlyPartial<T extends GADT<string, any>, R>(
  gadt: T,
  handlers: Partial<{
    [K in GADTTags<T>]: (payload: Immutable<GADTPayload<T, K>>) => R;
  }>
): R | undefined {
  const handler = handlers[gadt.tag as GADTTags<T>] as
    | ((p: Immutable<GADTPayload<T, any>>) => R)
    | undefined;
  return handler ? handler(gadt.payload as any) : undefined;
}

/**
 * Curryable readonly matcher factory: returns a total function if all tags are provided.
 */
export function createReadonlyGADTMatcher<T extends GADT<string, any>, R>(
  handlers: {
    [K in GADTTags<T>]: (payload: Immutable<GADTPayload<T, K>>) => R;
  }
): (gadt: T) => R {
  return (gadt: T) => pmatchReadonly(gadt, handlers);
}

/**
 * Fluent builder that mirrors pmatch but guarantees Immutable payloads on `.with`.
 * Useful when building handlers incrementally before `.exhaustive()`.
 */
export interface ReadonlyPmatchBuilder<T extends GADT<string, any>, R> {
  with<K extends GADTTags<T>>(
    tag: K,
    handler: (payload: Immutable<GADTPayload<T, K>>) => R
  ): ReadonlyPmatchBuilder<T, R>;
  partial(): R | undefined;
  exhaustive(): R;
}

export function createReadonlyPmatchBuilder<T extends GADT<string, any>, R>(
  gadt: T
): ReadonlyPmatchBuilder<T, R> {
  // Start from the underlying builder, but wrap types for `.with` and `.partial`.
  const base = pmatch(gadt);
  const handlers = new Map<string, Function>();

  const api: ReadonlyPmatchBuilder<T, R> = {
    with(tag, handler) {
      handlers.set(tag as string, handler as any);
      base.with(tag as any, handler as any);
      return api;
    },
    partial() {
      const h = handlers.get(gadt.tag);
      return h ? (h as any)(gadt.payload as any) : undefined;
    },
    exhaustive() {
      // Delegate to base.exhaustive(); pmatch will throw if unhandled.
      return base.exhaustive();
    }
  };

  return api;
}

/**
 * Optional: K-style hook for future HKTs (no runtime behavior change).
 * This keeps a stable API surface for later integration.
 */
export type Kindlike = unknown; // placeholder; replace with your Kind encoding later

export function pmatchReadonlyK<F extends Kindlike, T extends GADT<string, any>, R>(
  _kind: F,
  gadt: T,
  handlers: {
    [K in GADTTags<T>]: (payload: Immutable<GADTPayload<T, K>>) => R;
  }
): R {
  // For now, ignore _kind and behave like pmatchReadonly; future work can consult F.
  return pmatchReadonly(gadt, handlers);
}
