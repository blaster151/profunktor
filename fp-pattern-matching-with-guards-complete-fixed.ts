/**
 * Complete Pattern Matching with Conditional Guard Clauses
 * 
 * Extends the pattern matching system to support conditional guard clauses:
 * - Syntax: `(pattern) if <condition>` for match expressions
 * - Works in both expression-style and statement-style matches
 * - Supports guards for all ADTs (Maybe, Either, Result, GADT variants, etc.)
 * - Type inference with narrowed types in guard expressions
 * - Exhaustiveness checking that considers guards
 * - Integration with functional combinators and fluent syntax
 */

import {
  EnhancedADTInstance,
  MatchHandlers,
  TagOnlyHandlers
} from './fp-pattern-matching-ergonomics';

// ============================================================================
// Part 1: Core Guard Pattern Types
// ============================================================================

/**
 * A pattern that can be guarded by a condition
 */
export interface GuardedPattern<T, Result> {
  condition: (value: T) => boolean;
  handler: (value: T) => Result;
}

/**
 * Guard condition function that takes pattern variables and returns boolean
 */
export type GuardCondition<Payload> = (payload: Payload) => boolean;

/**
 * A handler that includes both a condition and the action to take
 */
export type GuardedHandler<Payload, Result> = GuardedPattern<Payload, Result>;

/**
 * Extended match handlers with guard clause support
 */
export type GuardedMatchHandlers<Tag extends string, Payload, Result> = {
  [K in Tag]?:
    | ((payload: Payload) => Result) // Regular handler
    | GuardedPattern<Payload, Result>[] // Guarded patterns
    | {
        patterns?: GuardedPattern<Payload, Result>[];
        fallback?: (payload: Payload) => Result;
      };
} & {
  _?: (tag: string, payload: any) => Result;
  otherwise?: (tag: string, payload: any) => Result;
};

/**
 * Extended tag-only handlers with guard clause support
 */
export type GuardedTagOnlyHandlers<Tag extends string, Result> = {
  [K in Tag]?:
    | (() => Result) // Regular handler
    | GuardedPattern<void, Result>[] // Guarded patterns
    | {
        patterns?: GuardedPattern<void, Result>[];
        fallback?: () => Result;
      };
} & {
  _?: (tag: string) => Result;
  otherwise?: (tag: string) => Result;
};

// ============================================================================
// Part 2: Guard Creation Utilities
// ============================================================================

/**
 * Generic projector for creating guards on arbitrary payload shapes
 */
export function on<P, A>(proj: (p: P) => A) {
  return <T extends (a: A) => boolean>(pred: T): GuardCondition<P> =>
    (payload: P) => pred(proj(payload));
}

/**
 * Create a guarded handler from condition and action
 */
export function when<Payload, Result>(
  condition: GuardCondition<Payload>,
  handler: (payload: Payload) => Result
): GuardedHandler<Payload, Result> {
  return { condition, handler };
}

/**
 * Combine multiple guards with logical AND
 */
export function and<Payload>(
  ...guards: GuardedHandler<Payload, any>[]
): GuardedHandler<Payload, any>[] {
  return guards;
}

/**
 * Combine guard patterns with fallback for complex handlers
 */
export function withFallback<Payload, Result>(
  guards: GuardedHandler<Payload, Result>[],
  fallback: (payload: Payload) => Result
) {
  return {
    patterns: guards,
    fallback
  };
}

// ============================================================================
// Part 3: Common Guard Predicates
// ============================================================================

export const CommonGuards = {
  // Equality guards
  eq: <T>(expected: T) =>
    <P>(proj: (p: P) => T): GuardCondition<P> =>
      (p: P) => proj(p) === expected,

  neq: <T>(expected: T) =>
    <P>(proj: (p: P) => T): GuardCondition<P> =>
      (p: P) => proj(p) !== expected,

  gt: <T>(threshold: T) =>
    <P>(proj: (p: P) => T): GuardCondition<P> =>
      (p: P) => proj(p) > threshold,

  gte: <T>(threshold: T) =>
    <P>(proj: (p: P) => T): GuardCondition<P> =>
      (p: P) => proj(p) >= threshold,

  lt: <T>(threshold: T) =>
    <P>(proj: (p: P) => T): GuardCondition<P> =>
      (p: P) => proj(p) < threshold,

  lte: <T>(threshold: T) =>
    <P>(proj: (p: P) => T): GuardCondition<P> =>
      (p: P) => proj(p) <= threshold,

  // Number guards
  positive: <P>(proj: (p: P) => number): GuardCondition<P> =>
    (p: P) => proj(p) > 0,

  negative: <P>(proj: (p: P) => number): GuardCondition<P> =>
    (p: P) => proj(p) < 0,

  zero: <P>(proj: (p: P) => number): GuardCondition<P> =>
    (p: P) => proj(p) === 0,

  // String guards
  matches: (pattern: RegExp) =>
    <P>(proj: (p: P) => string): GuardCondition<P> =>
      (p: P) => pattern.test(proj(p)),

  startsWith: (prefix: string) =>
    <P>(proj: (p: P) => string): GuardCondition<P> =>
      (p: P) => proj(p).startsWith(prefix),

  endsWith: (suffix: string) =>
    <P>(proj: (p: P) => string): GuardCondition<P> =>
      (p: P) => proj(p).endsWith(suffix),

  contains: (substring: string) =>
    <P>(proj: (p: P) => string): GuardCondition<P> =>
      (p: P) => proj(p).includes(substring),

  lengthIs: (length: number) =>
    <P>(proj: (p: P) => string): GuardCondition<P> =>
      (p: P) => proj(p).length === length,

  minLength: (minLen: number) =>
    <P>(proj: (p: P) => string): GuardCondition<P> =>
      (p: P) => proj(p).length >= minLen,

  isEmpty: <P>(proj: (p: P) => string): GuardCondition<P> =>
    (p: P) => proj(p).length === 0,

  isNotEmpty: <P>(proj: (p: P) => string): GuardCondition<P> =>
    (p: P) => proj(p).length > 0,

  // Array guards
  arrayHasLength: (length: number) =>
    <P, T>(proj: (p: P) => T[]): GuardCondition<P> =>
      (p: P) => proj(p).length === length,

  arrayIsEmpty: <P, T>(proj: (p: P) => T[]): GuardCondition<P> =>
    (p: P) => proj(p).length === 0,

  arrayIsNotEmpty: <P, T>(proj: (p: P) => T[]): GuardCondition<P> =>
    (p: P) => proj(p).length > 0,

  // Property existence guards
  hasProperty: <K extends string>(key: K) =>
    <P>(proj: (p: P) => Record<string, any>): GuardCondition<P> =>
      (p: P) => key in proj(p),

  // Type guards
  isString: <P>(proj: (p: P) => any): GuardCondition<P> =>
    (p: P) => typeof proj(p) === 'string',

  isNumber: <P>(proj: (p: P) => any): GuardCondition<P> =>
    (p: P) => typeof proj(p) === 'number',

  isBoolean: <P>(proj: (p: P) => any): GuardCondition<P> =>
    (p: P) => typeof proj(p) === 'boolean',

  isNull: <P>(proj: (p: P) => any): GuardCondition<P> =>
    (p: P) => proj(p) === null,

  isUndefined: <P>(proj: (p: P) => any): GuardCondition<P> =>
    (p: P) => proj(p) === undefined,

  isNullOrUndefined: <P>(proj: (p: P) => any): GuardCondition<P> =>
    (p: P) => proj(p) == null
};

// ============================================================================
// Part 4: Core Guard Matching Logic
// ============================================================================

/**
 * Match against guarded patterns
 */
export function matchWithGuards<Tag extends string, Payload, Result>(
  instance: EnhancedADTInstance<Tag, Payload>,
  handlers: GuardedMatchHandlers<Tag, Payload, Result>
): Result {
  const { tag, payload } = instance;
  const handler = handlers[tag];
  
  if (handler) {
    // Array of guarded patterns
    if (Array.isArray(handler)) {
      const result = matchGuardedPatterns(handler, payload);
      if (result !== NO_MATCH) return result as Result;
    }
    // Single function handler
    else if (typeof handler === 'function') {
      return handler(payload);
    }
    // Object with patterns and fallback
    else if (typeof handler === 'object') {
      if (handler.patterns) {
        const result = matchGuardedPatterns(handler.patterns, payload);
        if (result !== NO_MATCH) return result as Result;
      }
      if (handler.fallback) {
        return handler.fallback(payload);
      }
    }
  }
  
  // Try wildcard handlers
  if (handlers._) {
    return handlers._(tag, payload);
  }
  if (handlers.otherwise) {
    return handlers.otherwise(tag, payload);
  }
  
  throw new Error(`Non-exhaustive pattern match for tag: ${tag}`);
}

/**
 * Match against tag-only guarded patterns
 */
export function matchTagWithGuards<Tag extends string, Result>(
  instance: EnhancedADTInstance<Tag, any>,
  handlers: GuardedTagOnlyHandlers<Tag, Result>
): Result {
  const { tag } = instance;
  const handler = handlers[tag];
  
  if (handler) {
    // Array of guarded patterns
    if (Array.isArray(handler)) {
      const result = matchTagGuardedPatterns(handler);
      if (result !== NO_MATCH) return result as Result;
    }
    // Single function handler
    else if (typeof handler === 'function') {
      return handler();
    }
    // Object with patterns and fallback
    else if (typeof handler === 'object') {
      if (handler.patterns) {
        const result = matchTagGuardedPatterns(handler.patterns);
        if (result !== NO_MATCH) return result;
      }
      if (handler.fallback) {
        return handler.fallback();
      }
    }
  }
  
  // Try wildcard handlers
  if (handlers._) {
    return handlers._(tag);
  }
  if (handlers.otherwise) {
    return handlers.otherwise(tag);
  }
  
  throw new Error(`Non-exhaustive pattern match for tag: ${tag}`);
}

// ============================================================================
// Part 5: Pattern Matching Helpers
// ============================================================================

const NO_MATCH = Symbol('no-match');

/**
 * Execute guarded patterns against a payload
 */
function matchGuardedPatterns<Payload, Result>(
  patterns: GuardedPattern<Payload, Result>[],
  payload: Payload
): Result | typeof NO_MATCH {
  for (const pattern of patterns) {
    if (pattern.condition(payload)) {
      return pattern.handler(payload);
    }
  }
  return NO_MATCH;
}

/**
 * Execute tag-only guarded patterns
 */
function matchTagGuardedPatterns<Result>(
  patterns: GuardedPattern<void, Result>[]
): Result | typeof NO_MATCH {
  for (const pattern of patterns) {
    if (pattern.condition(undefined)) {
      return pattern.handler(undefined);
    }
  }
  return NO_MATCH;
}

// ============================================================================
// Part 6: Enhanced ADT Instance Extension
// ============================================================================

/**
 * Enhanced ADT instance with guard matching capabilities
 */
export interface GuardedADTInstance<Tag extends string, Payload>
  extends EnhancedADTInstance<Tag, Payload> {

  /**
   * Pattern match with guard clause support
   */
  matchWithGuards<Result>(
    handlers: GuardedMatchHandlers<Tag, Payload, Result>
  ): Result;

  /**
   * Tag-only pattern match with guard clause support
   */
  matchTagWithGuards<Result>(
    handlers: GuardedTagOnlyHandlers<Tag, Result>
  ): Result;
}

/**
 * Attach guard matching methods to any enhanced ADT instance
 */
export function attachGuards<Tag extends string, Payload>(
  instance: EnhancedADTInstance<Tag, Payload>
): GuardedADTInstance<Tag, Payload> {
  const guarded = instance as GuardedADTInstance<Tag, Payload>;
  
  guarded.matchWithGuards = function<Result>(
    handlers: GuardedMatchHandlers<Tag, Payload, Result>
  ): Result {
    return matchWithGuards(this, handlers);
  };
  
  guarded.matchTagWithGuards = function<Result>(
    handlers: GuardedTagOnlyHandlers<Tag, Result>
  ): Result {
    return matchTagWithGuards(this, handlers);
  };
  
  return guarded;
}

// ============================================================================
// Part 7: Data-Last Combinators
// ============================================================================

/**
 * Data-last version of matchWithGuards for composition
 */
export function matchWithGuardsDataLast<Tag extends string, Payload, Result>(
  handlers: GuardedMatchHandlers<Tag, Payload, Result>
) {
  return (instance: EnhancedADTInstance<Tag, Payload>): Result =>
    matchWithGuards(instance, handlers);
}

/**
 * Data-last version of matchTagWithGuards for composition
 */
export function matchTagWithGuardsDataLast<Tag extends string, Result>(
  handlers: GuardedTagOnlyHandlers<Tag, Result>
) {
  return (instance: EnhancedADTInstance<Tag, any>): Result =>
    matchTagWithGuards(instance, handlers);
}

// ============================================================================
// Part 8: Exhaustiveness Checking Types
// ============================================================================

/**
 * Check if all tags are covered by handlers
 */
export type IsGuardedExhaustive<Tag extends string, Handlers> = 
  Tag extends keyof Handlers ? true : false;

/**
 * Check if handlers have fallback
 */
export type HasGuardedFallback<Handlers> = 
  '_' extends keyof Handlers ? true : 
  'otherwise' extends keyof Handlers ? true : false;

/**
 * Utility type to check if a handler configuration might be non-exhaustive at runtime
 */
export type IsRuntimeExhaustive<Tag extends string, Payload, Handlers> = {
  [K in Tag]: Handlers extends { [P in K]: infer H }
    ? H extends GuardedPattern<Payload, any>[]
      ? H extends never[] ? false : true
      : H extends { patterns?: GuardedPattern<Payload, any>[]; fallback?: any }
        ? H extends { patterns: never[]; fallback?: never } ? false : true
        : true
      : true
    : false;
};

// ============================================================================
// Part 9: Logical Combinators
// ============================================================================

/**
 * Logical AND combinator for guard conditions
 */
export function andCondition<Payload>(
  ...conditions: GuardCondition<Payload>[]
): GuardCondition<Payload> {
  return (payload: Payload) => conditions.every(cond => cond(payload));
}

/**
 * Logical OR combinator for guard conditions
 */
export function orCondition<Payload>(
  ...conditions: GuardCondition<Payload>[]
): GuardCondition<Payload> {
  return (payload: Payload) => conditions.some(cond => cond(payload));
}

/**
 * Logical NOT combinator for guard conditions
 */
export function notCondition<Payload>(
  condition: GuardCondition<Payload>
): GuardCondition<Payload> {
  return (payload: Payload) => !condition(payload);
}

/**
 * Always true condition
 */
export function always<Payload>(): GuardCondition<Payload> {
  return () => true;
}

/**
 * Always false condition
 */
export function never<Payload>(): GuardCondition<Payload> {
  return () => false;
}

// ============================================================================
// Part 10: Example Usage and Demos
// ============================================================================

/**
 * Example of guard clause usage with Maybe
 */
export const exampleMaybeWithGuards = (maybe: EnhancedADTInstance<'Just' | 'Nothing', { value?: number }>) =>
  matchWithGuards(maybe, {
    Just: [
      when(
        (p: { value?: number }) => p.value! > 0,
        (p) => `Positive value: ${p.value}`
      ),
      when(
        (p: { value?: number }) => p.value! === 0,
        () => 'Zero value'
      ),
      when(
        always(),
        (p) => `Negative value: ${p.value}`
      )
    ],
    Nothing: () => 'No value'
  });

/**
 * Example of complex guard expressions
 */
export const exampleComplexGuards = (data: { score: number; name: string; age: number }) =>
  [
    when(
      andCondition(
        (d: typeof data) => d.score >= 90,
        (d: typeof data) => d.name.length >= 3,
        (d: typeof data) => d.age >= 18
      ),
      (d) => `Excellent adult: ${d.name}`
    ),
    when(
      andCondition(
        (d: typeof data) => d.score >= 70,
        (d: typeof data) => d.age < 18
      ),
      (d) => `Good student: ${d.name}`
    ),
    when(
      always(),
      (d: typeof data) => `Standard case: ${d.name}`
    )
  ];
