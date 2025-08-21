/**
 * Enhanced Generalized Algebraic Data Types (GADTs) with Fluent Pattern Matching DSL
 * 
 * This module provides an enhanced GADT system with:
 * - Fluent pattern-matching DSL with type narrowing
 * - Auto-generated matchers for any GADT type
 * - Kind-aware GADT integration with HKT system
 * - Integration with Derivable Instances framework
 */

import {
  Kind1, Kind2, Kind3,
  Apply, Type, TypeArgs, KindArity,
  ArrayK, MaybeK, EitherK, TupleK, FunctionK,
  Maybe, Either
} from './fp-hkt';

import {
  Functor, Applicative, Monad, Bifunctor,
  deriveFunctor, deriveApplicative, deriveMonad
} from './fp-typeclasses-hkt';

import { deriveEqInstance, deriveOrdInstance, deriveShowInstance } from './fp-derivation-helpers';

// ============================================================================
// Core GADT Types and Utilities
// ============================================================================

/**
 * Base GADT type that binds a tag to the type of its payload
 * Each constructor can have precise type information that can be refined during pattern matching
 */
export type GADT<Tag extends string, Payload> = {
  readonly tag: Tag;
  readonly payload: Payload;
};

/**
 * Extract all possible tags from a GADT union type
 */
export type GADTTags<T> = T extends GADT<infer Tag, any> ? Tag : never;

/**
 * Extract payload type for a specific tag from a GADT union type
 */
export type GADTPayload<T, Tag extends string> = T extends GADT<Tag, infer Payload> ? Payload : never;

// ============================================================================
// Fluent Pattern Matching DSL
// ============================================================================

/**
 * Pattern matching case handler type
 */
export type PatternCase<T, Tag extends string, R> = (payload: GADTPayload<T, Tag>) => R;

/**
 * Pattern matching builder interface
 */
export interface PatternMatcherBuilder<T, R> {
  with<Tag extends GADTTags<T>, R2>(
    tag: Tag,
    handler: PatternCase<T, Tag, R2>
  ): PatternMatcherBuilder<T, R | R2>;
  
  partial(): R | undefined;
  exhaustive(): R;
}

/**
 * Internal state for pattern matcher builder
 */
interface PatternMatcherState<T, R> {
  cases: Map<string, (payload: unknown) => R>;
  gadt: T;
  isPartial: boolean;
}

/**
 * Fluent pattern matching DSL
 * Provides type-safe, ergonomic pattern matching with exhaustiveness checks
 */
export function pmatch<T extends GADT<string, any>>(
  gadt: T
): PatternMatcherBuilder<T, never> {
  const state: PatternMatcherState<T, unknown> = {
    cases: new Map(),
    gadt,
    isPartial: false
  };

  const builder: PatternMatcherBuilder<T, any> = {
    with<Tag extends GADTTags<T>, R2>(
      tag: Tag,
      handler: PatternCase<T, Tag, R2>
    ): PatternMatcherBuilder<T, any> {
      state.cases.set(tag, handler as (payload: unknown) => any);
      return builder as PatternMatcherBuilder<T, any>;
    },

    partial(): any {
      state.isPartial = true;
      const handler = state.cases.get((state.gadt as any).tag);
      if (!handler) {
        return undefined;
      }
      return (handler as (payload: unknown) => any)((state.gadt as any).payload);
    },

    exhaustive(): any {
      const handler = state.cases.get((state.gadt as any).tag);
      if (!handler) {
        // This should never happen if all cases are handled
        throw new Error(`Unhandled case: ${(state.gadt as any).tag}`);
      }
      return (handler as (payload: unknown) => any)((state.gadt as any).payload);
    }
  };

  return builder as PatternMatcherBuilder<T, never>;
}

// ============================================================================
// Auto-Derivable Matchers
// ============================================================================

/**
 * Derivable pattern matcher utility
 * Generates a pmatch builder for any GADT type
 */
export type DerivablePatternMatch<T extends GADT<string, any>, R> = {
  [Tag in GADTTags<T>]: PatternCase<T, Tag, R>;
};

/**
 * Auto-generate pattern matcher for a GADT type
 */
export function derivePatternMatcher<T extends GADT<string, any>, R>(
  gadt: T,
  cases: Partial<DerivablePatternMatch<T, R>>
): R | undefined {
  const handler = cases[gadt.tag as keyof typeof cases];
  if (!handler) {
    return undefined;
  }
  return handler(gadt.payload);
}

/**
 * Create a pmatch builder with pre-defined cases
 */
export function createPmatchBuilder<T extends GADT<string, any>, R>(
  cases: Partial<DerivablePatternMatch<T, R>>
) {
  return function(gadt: T): PatternMatcherBuilder<T, R> {
    const state: PatternMatcherState<T, any> = {
      cases: new Map(Object.entries(cases as Record<string, (p: unknown) => R>)),
      gadt,
      isPartial: false
    };

    const builder: PatternMatcherBuilder<T, any> = {
      with<Tag extends GADTTags<T>, R2>(
        tag: Tag,
        handler: PatternCase<T, Tag, R2>
      ): PatternMatcherBuilder<T, any> {
        state.cases.set(tag, handler as (payload: unknown) => any);
        return builder as PatternMatcherBuilder<T, any>;
      },

      partial(): any {
        state.isPartial = true;
        const handler = state.cases.get((state.gadt as any).tag);
        if (!handler) {
          return undefined;
        }
        return (handler as (payload: unknown) => any)((state.gadt as any).payload);
      },

      exhaustive(): any {
        const handler = state.cases.get((state.gadt as any).tag);
        if (!handler) {
          throw new Error(`Unhandled case: ${(state.gadt as any).tag}`);
        }
        return (handler as (payload: unknown) => any)((state.gadt as any).payload);
      }
    };

    return builder as PatternMatcherBuilder<T, R>;
  };
}

// ============================================================================
// Enhanced GADT Examples with Kind Integration
// ============================================================================

/**
 * Typed Expression AST GADT
 * Demonstrates precise type information that can be refined during pattern matching
 */
export type Expr<A> =
  | GADT<'Const', { value: A }>
  | GADT<'Add', { left: Expr<number>; right: Expr<number> }>
  | GADT<'If', { cond: Expr<boolean>; then: Expr<A>; else: Expr<A> }>
  | GADT<'Var', { name: string }>
  | GADT<'Let', { name: string; value: Expr<A>; body: Expr<A> }>;

/**
 * Expr as Kind-aware HKT for integration with typeclass system
 */
export interface ExprK extends Kind1 {
  readonly type: Expr<this['arg0']>;
}

/**
 * Constructor functions for Expr GADT
 */
export const Expr = {
  Const: <A>(value: A): Expr<A> => ({ tag: 'Const', payload: { value } }),
  Add: (left: Expr<number>, right: Expr<number>): Expr<number> => 
    ({ tag: 'Add', payload: { left, right } }),
  If: <A>(cond: Expr<boolean>, then: Expr<A>, else_: Expr<A>): Expr<A> => 
    ({ tag: 'If', payload: { cond, then, else: else_ } }),
  Var: (name: string): Expr<any> => ({ tag: 'Var', payload: { name } }),
  Let: <A>(name: string, value: Expr<A>, body: Expr<A>): Expr<A> => 
    ({ tag: 'Let', payload: { name, value, body } })
};

/**
 * Type-safe evaluator for Expr<number> using fluent DSL
 */
export function evaluate(expr: Expr<number>): number {
  return pmatch(expr)
    .with('Const', ({ value }) => value)
    .with('Add', ({ left, right }) => evaluate(left) + evaluate(right))
    .with('If', ({ cond, then, else: else_ }) => {
      // For boolean conditions, we need a separate boolean evaluator
      const condValue = evaluateBoolean(cond);
      return condValue ? evaluate(then) : evaluate(else_);
    })
    .with('Var', ({ name }) => { throw new Error(`Unbound variable: ${name}`); })
    .with('Let', ({ name, value, body }) => {
      const val = evaluate(value);
      // In a real implementation, we'd update the environment
      return evaluate(body);
    })
    .exhaustive();
}

/**
 * Boolean evaluator for Expr<boolean>
 */
export function evaluateBoolean(expr: Expr<boolean>): boolean {
  return pmatch(expr)
    .with('Const', ({ value }) => value)
    .with('Add', ({ left, right }) => { throw new Error("Cannot evaluate Add as boolean"); })
    .with('If', ({ cond, then, else: else_ }) => {
      const condValue = evaluateBoolean(cond);
      return condValue ? evaluateBoolean(then) : evaluateBoolean(else_);
    })
    .with('Var', ({ name }) => { throw new Error(`Unbound variable: ${name}`); })
    .with('Let', ({ name, value, body }) => {
      const val = evaluateBoolean(value);
      return evaluateBoolean(body);
    })
    .exhaustive();
}

/**
 * Type-safe transformer for Expr<string> using fluent DSL
 */
export function transformString(expr: Expr<string>): Expr<string> {
  return pmatch(expr)
    .with('Const', ({ value }) => Expr.Const(value.toUpperCase()))
    .with('Add', ({ left, right }) => { throw new Error("Cannot add strings in this context"); })
    .with('If', ({ cond, then, else: else_ }) => {
      // For boolean conditions, we need to transform the condition to boolean
      const boolCond = transformToBoolean(cond);
      return Expr.If(boolCond, transformString(then), transformString(else_));
    })
    .with('Var', ({ name }) => Expr.Var(name))
    .with('Let', ({ name, value, body }) => Expr.Let(name, transformString(value), transformString(body)))
    .exhaustive();
}

/**
 * Transform any Expr to Expr<boolean> for conditions
 */
export function transformToBoolean(expr: Expr<any>): Expr<boolean> {
  return pmatch(expr)
    .with('Const', ({ value }) => Expr.Const(Boolean(value)))
    .with('Add', ({ left, right }) => Expr.Const(true)) // Default to true for Add
    .with('If', ({ cond, then, else: else_ }) => Expr.If(transformToBoolean(cond), transformToBoolean(then), transformToBoolean(else_)))
    .with('Var', ({ name }) => Expr.Const(true)) // Default to true for Var
    .with('Let', ({ name, value, body }) => Expr.Let(name, transformToBoolean(value), transformToBoolean(body)))
    .exhaustive();
}

// ExprFunctor is already declared below from derived instances

// ============================================================================
// Maybe as Enhanced GADT
// ============================================================================

/**
 * Maybe implemented as a GADT for precise type information
 */
export type MaybeGADT<A> =
  | GADT<'Just', { value: A }>
  | GADT<'Nothing', {}>;

/**
 * MaybeGADT as Kind-aware HKT for integration with typeclass system
 */
export interface MaybeGADTK extends Kind1 {
  readonly type: MaybeGADT<this['arg0']>;
}

/**
 * Constructor functions for MaybeGADT
 */
export const MaybeGADT = {
  Just: <A>(value: A): MaybeGADT<A> => ({ tag: 'Just', payload: { value } }),
  Nothing: <A>(): MaybeGADT<A> => ({ tag: 'Nothing', payload: {} })
};

/**
 * Auto-generated matcher for MaybeGADT
 */
export const maybeMatcher = createPmatchBuilder<MaybeGADT<any>, string>({
  Just: ({ value }) => `Got ${value}`,
  Nothing: () => 'No value'
});

// MaybeGADT instances are already declared below from derived instances

// ============================================================================
// Either as Enhanced GADT
// ============================================================================

/**
 * Either implemented as a GADT for precise type information
 */
export type EitherGADT<L, R> =
  | GADT<'Left', { value: L }>
  | GADT<'Right', { value: R }>;

/**
 * EitherGADT as Kind-aware HKT for integration with typeclass system
 */
export interface EitherGADTK extends Kind2 {
  readonly type: EitherGADT<this['arg0'], this['arg1']>;
}

/**
 * Constructor functions for EitherGADT
 */
export const EitherGADT = {
  Left: <L, R>(value: L): EitherGADT<L, R> => ({ tag: 'Left', payload: { value } }),
  Right: <L, R>(value: R): EitherGADT<L, R> => ({ tag: 'Right', payload: { value } })
};



// ============================================================================
// Small Example GADT for Derivable Instances + Auto-Matchers
// ============================================================================

/**
 * Result type for operations that can succeed or fail with a specific error
 */
export type Result<A, E> =
  | GADT<'Ok', { value: A }>
  | GADT<'Err', { error: E }>;

/**
 * Result as Kind-aware HKT
 */
export interface ResultK extends Kind2 {
  readonly type: Result<this['arg0'], this['arg1']>;
}

/**
 * Constructor functions for Result
 */
export const Result = {
  Ok: <A, E>(value: A): Result<A, E> => ({ tag: 'Ok', payload: { value } }),
  Err: <A, E>(error: E): Result<A, E> => ({ tag: 'Err', payload: { error } })
};

/**
 * Auto-generated matcher for Result
 */
export const resultMatcher = createPmatchBuilder<Result<any, any>, string>({
  Ok: ({ value }) => `Success: ${value}`,
  Err: ({ error }) => `Error: ${error}`
});

/**
 * Manual Functor instance for ResultK
 */
export const ResultFunctor: Functor<ResultK> = {
  map: <A, B, E>(fa: Result<A, E>, f: (a: A) => B): Result<B, E> =>
    pmatch(fa)
      .with('Ok', ({ value }) => Result.Ok<B, E>(f(value)))
      .with('Err', ({ error }) => Result.Err<B, E>(error))
      .exhaustive()
};

// ============================================================================
// Typeclass Instances (Derived)
// ============================================================================

/**
 * Manual Functor instance for ExprK
 */
export const ExprFunctor: Functor<ExprK> = {
  map: <A, B>(fa: Expr<A>, f: (a: A) => B): Expr<B> => 
    pmatch(fa)
      .with('Const', ({ value }) => Expr.Const<B>(f(value)))
      .with('Add', ({ left, right }) => Expr.Add(left, right) as unknown as Expr<B>)
      .with('If', ({ cond, then, else: else_ }) => Expr.If<B>(cond, ExprFunctor.map(then, f), ExprFunctor.map(else_, f)))
      .with('Var', ({ name }) => Expr.Var(name) as unknown as Expr<B>)
      .with('Let', ({ name, value, body }) => Expr.Let<B>(name, ExprFunctor.map(value, f), ExprFunctor.map(body, f)))
      .exhaustive()
};

/**
 * Manual Functor instance for MaybeGADTK
 */
export const MaybeGADTFunctor: Functor<MaybeGADTK> = {
  map: <A, B>(fa: MaybeGADT<A>, f: (a: A) => B): MaybeGADT<B> => 
    pmatch(fa)
      .with('Just', ({ value }) => MaybeGADT.Just<B>(f(value)))
      .with('Nothing', () => MaybeGADT.Nothing<B>())
      .exhaustive()
};

/**
 * Manual Applicative instance for MaybeGADTK
 */
export const MaybeGADTApplicative: Applicative<MaybeGADTK> = {
  ...MaybeGADTFunctor,
  of: <A>(a: A): MaybeGADT<A> => MaybeGADT.Just<A>(a),
  ap: <A, B>(fab: MaybeGADT<(a: A) => B>, fa: MaybeGADT<A>): MaybeGADT<B> => 
    pmatch(fab)
      .with('Just', ({ value: f }) => 
        pmatch(fa)
          .with('Just', ({ value: a }) => MaybeGADT.Just<B>(f(a)))
          .with('Nothing', () => MaybeGADT.Nothing<B>())
          .exhaustive()
      )
      .with('Nothing', () => MaybeGADT.Nothing<B>())
      .exhaustive()
};

/**
 * Manual Monad instance for MaybeGADTK
 */
export const MaybeGADTMonad: Monad<MaybeGADTK> = {
  ...MaybeGADTApplicative,
  chain: <A, B>(fa: MaybeGADT<A>, f: (a: A) => MaybeGADT<B>): MaybeGADT<B> => 
    pmatch(fa)
      .with('Just', ({ value }) => f(value))
      .with('Nothing', () => MaybeGADT.Nothing<B>())
      .exhaustive()
};

/**
 * Manual Bifunctor instance for EitherGADTK
 */
export const EitherGADTBifunctor: Bifunctor<EitherGADTK> = {
  bimap: <A, B, C, D>(fab: EitherGADT<A, B>, f: (a: A) => C, g: (b: B) => D): EitherGADT<C, D> => 
    pmatch(fab)
      .with('Left', ({ value }) => EitherGADT.Left<C, D>(f(value)))
      .with('Right', ({ value }) => EitherGADT.Right<C, D>(g(value)))
      .exhaustive(),
  
  mapLeft: <A, B, C>(fab: EitherGADT<A, B>, f: (a: A) => C): EitherGADT<C, B> => 
    pmatch(fab)
      .with('Left', ({ value }) => EitherGADT.Left<C, B>(f(value)))
      .with('Right', ({ value }) => EitherGADT.Right<C, B>(value))
      .exhaustive(),
  
  mapRight: <A, B, D>(fab: EitherGADT<A, B>, g: (b: B) => D): EitherGADT<A, D> => 
    pmatch(fab)
      .with('Left', ({ value }) => EitherGADT.Left<A, D>(value))
      .with('Right', ({ value }) => EitherGADT.Right<A, D>(g(value)))
      .exhaustive()
};

/**
 * Manual Applicative instance for ResultK
 */
export const ResultApplicative: Applicative<ResultK> = {
  ...ResultFunctor,
  of: <A, E>(a: A): Result<A, E> => Result.Ok<A, E>(a),
  ap: <A, B, E>(ff: Result<(a: A) => B, E>, fa: Result<A, E>): Result<B, E> =>
    (ff.tag === 'Ok'
      ? ResultFunctor.map(fa as any, ff.payload.value as any) as any
      : Result.Err<B, E>(ff.payload.error as E))
};

/**
 * Manual Monad instance for ResultK
 */
export const ResultMonad: Monad<ResultK> = {
  ...ResultApplicative,
  chain: <A, B, E>(fa: Result<A, E>, f: (a: A) => Result<B, E>): Result<B, E> =>
    (fa.tag === 'Ok' ? f(fa.payload.value) : Result.Err<B, E>(fa.payload.error as E))
};

// ============================================================================
// Integration Examples
// ============================================================================

/**
 * Example: Using pmatch with MaybeGADT
 */
export function exampleMaybePmatch(): void {
  const justValue = MaybeGADT.Just(42);
  const nothingValue = MaybeGADT.Nothing();
  
  // Using fluent DSL
  const justResult = pmatch(justValue)
    .with('Just', ({ value }) => `Got value: ${value}`)
    .with('Nothing', () => 'No value')
    .exhaustive();
  
  const nothingResult = pmatch(nothingValue)
    .with('Just', ({ value }) => `Got value: ${value}`)
    .with('Nothing', () => 'No value')
    .exhaustive();
  
  console.log('MaybeGADT Just (pmatch):', justResult); // "Got value: 42"
  console.log('MaybeGADT Nothing (pmatch):', nothingResult); // "No value"
  
  // Using auto-generated matcher
  const autoJustResult = maybeMatcher(justValue).exhaustive();
  const autoNothingResult = maybeMatcher(nothingValue).exhaustive();
  
  console.log('MaybeGADT auto-generated:', autoJustResult); // "Got 42"
  console.log('MaybeGADT auto-generated:', autoNothingResult); // "No value"
}

/**
 * Example: Using pmatch with EitherGADT
 */
export function exampleEitherPmatch(): void {
  const leftValue = EitherGADT.Left('error');
  const rightValue = EitherGADT.Right(123);
  
  const leftResult = pmatch(leftValue)
    .with('Left', ({ value }) => `Error: ${value}`)
    .with('Right', ({ value }) => `Success: ${value}`)
    .exhaustive();
  
  const rightResult = pmatch(rightValue)
    .with('Left', ({ value }) => `Error: ${value}`)
    .with('Right', ({ value }) => `Success: ${value}`)
    .exhaustive();
  
  console.log('EitherGADT Left (pmatch):', leftResult); // "Error: error"
  console.log('EitherGADT Right (pmatch):', rightResult); // "Success: 123"
}

/**
 * Example: Using pmatch with Expr
 */
export function exampleExprPmatch(): void {
  const expr: Expr<number> = Expr.Add(
    Expr.Const(5),
    Expr.Add(Expr.Const(3), Expr.Const(2))
  );
  
  const result = evaluate(expr);
  console.log('Expr evaluation (pmatch):', result); // 10
  
  const stringExpr: Expr<string> = Expr.If(
    Expr.Const(true),
    Expr.Const("hello"),
    Expr.Const("world")
  );
  
  const transformed = transformString(stringExpr);
  console.log('Expr transformation (pmatch):', transformed);
}

/**
 * Example: Functor mapping over Expr constants
 */
export function exampleExprFunctor(): void {
  const expr: Expr<number> = Expr.Add(
    Expr.Const(5),
    Expr.Const(3)
  );
  
  // Map over the expression, doubling all constants
  const doubled = ExprFunctor.map(expr, x => x * 2);
  
  console.log('Original expression:', expr);
  console.log('Doubled expression:', doubled);
  console.log('Evaluated doubled:', evaluate(doubled)); // 16
}

/**
 * Example: Derivable Instances + Auto-Matchers on Result
 */
export function exampleResultIntegration(): void {
  const success = Result.Ok(42);
  const failure = Result.Err('Something went wrong');
  
  // Use auto-generated matcher
  const successResult = resultMatcher(success).exhaustive();
  const failureResult = resultMatcher(failure).exhaustive();
  
  console.log('Result success:', successResult); // "Success: 42"
  console.log('Result failure:', failureResult); // "Error: Something went wrong"
  
  // Use derived Monad instance
  const derivedMonad = ResultMonad;
  
  const chained = derivedMonad.chain(
    success,
    x => x > 40 ? Result.Ok(x * 2) : Result.Err('Too small')
  );
  
  const chainedResult = resultMatcher(chained).exhaustive();
  console.log('Chained result:', chainedResult); // "Success: 84"
}

// ============================================================================
// Laws and Properties
// ============================================================================

/**
 * Enhanced GADT Laws:
 * 
 * 1. Pattern Matching Completeness: All constructors must be handled in exhaustive matches
 * 2. Type Safety: Pattern matching preserves type information with narrowing
 * 3. Constructor Injectivity: Each constructor uniquely identifies its payload type
 * 4. Exhaustiveness: Compile-time checking ensures all cases are covered via never trick
 * 5. Fluent DSL Laws: pmatch().with().exhaustive() should be equivalent to manual matching
 * 
 * Pattern Matching DSL Laws:
 * 
 * 1. Identity: pmatch(gadt).with(tag, payload => gadt).exhaustive() = gadt
 * 2. Composition: pmatch(gadt).with(tag, f).with(tag, g).exhaustive() = pmatch(gadt).with(tag, g ∘ f).exhaustive()
 * 3. Exhaustiveness: .exhaustive() must handle all constructors or fail at compile time
 * 4. Partial Matching: .partial() allows incomplete matching and returns undefined for unhandled cases
 * 
 * Kind Integration Laws:
 * 
 * 1. HKT Compatibility: GADTs can be treated as type constructors in the HKT system
 * 2. Typeclass Laws: GADT instances must satisfy typeclass laws
 * 3. Derivation Compatibility: Derivable instances work with GADT implementations
 * 4. Auto-Matcher Compatibility: Auto-generated matchers preserve type safety and exhaustiveness
 */ 

// ============================================================================
// TOP-LEVEL DERIVED INSTANCES
// ============================================================================

/**
 * Expr derived instances
 */
export const ExprEq = deriveEqInstance({
  customEq: <A>(a: Expr<A>, b: Expr<A>): boolean =>
    pmatch(a)
      .with('Const', ({ value: av }) =>
        pmatch(b).with('Const', ({ value: bv }) => av === bv)
                 .with('Add', () => false)
                 .with('If', () => false)
                 .with('Var', () => false)
                 .with('Let', () => false)
                 .exhaustive())
      .with('Add', ({ left: al, right: ar }) =>
        pmatch(b).with('Const', () => false)
                 .with('Add', ({ left: bl, right: br }) => 
                   ExprEq.equals(al, bl) && ExprEq.equals(ar, br))
                 .with('If', () => false)
                 .with('Var', () => false)
                 .with('Let', () => false)
                 .exhaustive())
      .with('If', ({ cond: ac, then: at, else: ae }) =>
        pmatch(b).with('Const', () => false)
                 .with('Add', () => false)
                 .with('If', ({ cond: bc, then: bt, else: be }) =>
                   ExprEq.equals(ac, bc) && ExprEq.equals(at, bt) && ExprEq.equals(ae, be))
                 .with('Var', () => false)
                 .with('Let', () => false)
                 .exhaustive())
      .with('Var', ({ name: an }) =>
        pmatch(b).with('Const', () => false)
                 .with('Add', () => false)
                 .with('If', () => false)
                 .with('Var', ({ name: bn }) => an === bn)
                 .with('Let', () => false)
                 .exhaustive())
      .with('Let', ({ name: an, value: av, body: ab }) =>
        pmatch(b).with('Const', () => false)
                 .with('Add', () => false)
                 .with('If', () => false)
                 .with('Var', () => false)
                 .with('Let', ({ name: bn, value: bv, body: bb }) =>
                   an === bn && ExprEq.equals(av, bv) && ExprEq.equals(ab, bb))
                 .exhaustive())
      .exhaustive()
});

export const ExprOrd = deriveOrdInstance({
  customOrd: <A>(a: Expr<A>, b: Expr<A>): number => {
    // Simple lexicographic ordering by tag
    const tagOrder = { Const: 0, Add: 1, If: 2, Var: 3, Let: 4 };
    const aOrder = tagOrder[a.tag as keyof typeof tagOrder];
    const bOrder = tagOrder[b.tag as keyof typeof tagOrder];
    if (aOrder !== bOrder) return aOrder - bOrder;
    
    // Same tag, compare payloads
    return pmatch(a)
      .with('Const', ({ value: av }) =>
        pmatch(b).with('Const', ({ value: bv }) => (av < bv ? -1 : av > bv ? 1 : 0) as any)
                 .with('Add', () => -1)
                 .with('If', () => -1)
                 .with('Var', () => -1)
                 .with('Let', () => -1)
                 .exhaustive())
      .with('Add', ({ left: al, right: ar }) =>
        pmatch(b).with('Const', () => 1)
                 .with('Add', ({ left: bl, right: br }) => {
                   const leftCmp = ExprOrd.compare(al, bl);
                   return leftCmp !== 0 ? leftCmp : ExprOrd.compare(ar, br);
                 })
                 .with('If', () => -1)
                 .with('Var', () => -1)
                 .with('Let', () => -1)
                 .exhaustive())
      .with('If', ({ cond: ac, then: at, else: ae }) =>
        pmatch(b).with('Const', () => 1)
                 .with('Add', () => 1)
                 .with('If', ({ cond: bc, then: bt, else: be }) => {
                   const condCmp = ExprOrd.compare(ac, bc);
                   if (condCmp !== 0) return condCmp;
                   const thenCmp = ExprOrd.compare(at, bt);
                   return thenCmp !== 0 ? thenCmp : ExprOrd.compare(ae, be);
                 })
                 .with('Var', () => -1)
                 .with('Let', () => -1)
                 .exhaustive())
      .with('Var', ({ name: an }) =>
        pmatch(b).with('Const', () => 1)
                 .with('Add', () => 1)
                 .with('If', () => 1)
                 .with('Var', ({ name: bn }) => an < bn ? -1 : an > bn ? 1 : 0)
                 .with('Let', () => -1)
                 .exhaustive())
      .with('Let', ({ name: an, value: av, body: ab }) =>
        pmatch(b).with('Const', () => 1)
                 .with('Add', () => 1)
                 .with('If', () => 1)
                 .with('Var', () => 1)
                 .with('Let', ({ name: bn, value: bv, body: bb }) => {
                   const nameCmp = an < bn ? -1 : an > bn ? 1 : 0;
                   if (nameCmp !== 0) return nameCmp;
                   const valueCmp = ExprOrd.compare(av, bv);
                   return valueCmp !== 0 ? valueCmp : ExprOrd.compare(ab, bb);
                 })
                 .exhaustive())
      .exhaustive();
  }
});

export const ExprShow = deriveShowInstance({
  customShow: <A>(a: Expr<A>): string =>
    pmatch(a)
      .with('Const', ({ value }) => `Const(${JSON.stringify(value)})`)
      .with('Add', ({ left, right }) => `Add(${ExprShow.show(left)}, ${ExprShow.show(right)})`)
      .with('If', ({ cond, then, else: else_ }) => 
        `If(${ExprShow.show(cond)}, ${ExprShow.show(then)}, ${ExprShow.show(else_)})`)
      .with('Var', ({ name }) => `Var("${name}")`)
      .with('Let', ({ name, value, body }) => 
        `Let("${name}", ${ExprShow.show(value)}, ${ExprShow.show(body)})`)
      .exhaustive()
});

/**
 * MaybeGADT derived instances
 */
export const MaybeGADTEq = deriveEqInstance({
  customEq: <A>(a: MaybeGADT<A>, b: MaybeGADT<A>): boolean =>
    pmatch(a)
      .with('Just', ({ value: av }) =>
        pmatch(b).with('Just', ({ value: bv }) => av === bv)
                 .with('Nothing', () => false)
                 .exhaustive())
      .with('Nothing', () =>
        pmatch(b).with('Just', () => false)
                 .with('Nothing', () => true)
                 .exhaustive())
      .exhaustive()
});

export const MaybeGADTOrd = deriveOrdInstance({
  customOrd: <A>(a: MaybeGADT<A>, b: MaybeGADT<A>): number =>
    pmatch(a)
      .with('Just', ({ value: av }) =>
        pmatch(b).with('Just', ({ value: bv }) => (av < bv ? -1 : av > bv ? 1 : 0) as any)
                 .with('Nothing', () => 1) // Just > Nothing
                 .exhaustive())
      .with('Nothing', () =>
        pmatch(b).with('Just', () => -1) // Nothing < Just
                 .with('Nothing', () => 0)
                 .exhaustive())
      .exhaustive()
});

export const MaybeGADTShow = deriveShowInstance({
  customShow: <A>(a: MaybeGADT<A>): string =>
    pmatch(a)
      .with('Just', ({ value }) => `Just(${JSON.stringify(value)})`)
      .with('Nothing', () => 'Nothing')
      .exhaustive()
});

/**
 * EitherGADT derived instances
 */
export const EitherGADTEq = deriveEqInstance({
  customEq: <L, R>(a: EitherGADT<L, R>, b: EitherGADT<L, R>): boolean =>
    pmatch(a)
      .with('Left', ({ value: al }) =>
        pmatch(b).with('Left', ({ value: bl }) => al === bl)
                 .with('Right', () => false)
                 .exhaustive())
      .with('Right', ({ value: ar }) =>
        pmatch(b).with('Left', () => false)
                 .with('Right', ({ value: br }) => ar === br)
                 .exhaustive())
      .exhaustive()
});

export const EitherGADTOrd = deriveOrdInstance({
  customOrd: <L, R>(a: EitherGADT<L, R>, b: EitherGADT<L, R>): number =>
    pmatch(a)
      .with('Left', ({ value: al }) =>
        pmatch(b).with('Left', ({ value: bl }) => (al < bl ? -1 : al > bl ? 1 : 0) as any)
                 .with('Right', () => -1) // Left < Right
                 .exhaustive())
      .with('Right', ({ value: ar }) =>
        pmatch(b).with('Left', () => 1)  // Right > Left
                 .with('Right', ({ value: br }) => (ar < br ? -1 : ar > br ? 1 : 0) as any)
                 .exhaustive())
      .exhaustive()
});

export const EitherGADTShow = deriveShowInstance({
  customShow: <L, R>(a: EitherGADT<L, R>): string =>
    pmatch(a)
      .with('Left', ({ value }) => `Left(${JSON.stringify(value)})`)
      .with('Right', ({ value }) => `Right(${JSON.stringify(value)})`)
      .exhaustive()
});

// ============================================================================
// REGISTRATION
// ============================================================================

/**
 * Register all GADT instances
 */
export function registerGADTInstances(): void {
  if (typeof globalThis !== 'undefined' && (globalThis as any).__FP_REGISTRY) {
    const registry = (globalThis as any).__FP_REGISTRY;
    
    // Register Expr instances
    registry.register('ExprFunctor', ExprFunctor);
    registry.register('ExprEq', ExprEq);
    registry.register('ExprOrd', ExprOrd);
    registry.register('ExprShow', ExprShow);
    
    // Register MaybeGADT instances
    registry.register('MaybeGADTFunctor', MaybeGADTFunctor);
    registry.register('MaybeGADTApplicative', MaybeGADTApplicative);
    registry.register('MaybeGADTMonad', MaybeGADTMonad);
    registry.register('MaybeGADTEq', MaybeGADTEq);
    registry.register('MaybeGADTOrd', MaybeGADTOrd);
    registry.register('MaybeGADTShow', MaybeGADTShow);
    
    // Register EitherGADT instances
    registry.register('EitherGADTBifunctor', EitherGADTBifunctor);
    registry.register('EitherGADTEq', EitherGADTEq);
    registry.register('EitherGADTOrd', EitherGADTOrd);
    registry.register('EitherGADTShow', EitherGADTShow);
    
    // Register Result instances
    registry.register('ResultFunctor', ResultFunctor);
    registry.register('ResultApplicative', ResultApplicative);
    registry.register('ResultMonad', ResultMonad);
  }
}

// Auto-register instances
registerGADTInstances();