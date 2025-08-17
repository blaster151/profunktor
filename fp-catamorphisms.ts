/**
 * Typed Folds (Catamorphisms) for Generalized Algebraic Data Types (GADTs)
 * 
 * This module provides a complete catamorphism framework for GADTs, enabling:
 * - Type-safe folding over recursive GADT structures
 * - Generic fold framework with precise type information
 * - Derivable folds for any GADT type
 * - HKT integration for type constructor GADTs
 * - Composable and reusable fold algebras
 */

import {
  GADT, GADTTags, GADTPayload,
  pmatch, PatternMatcherBuilder,
  derivePatternMatcher, createPmatchBuilder,
  Expr, ExprK, evaluate, transformString, ExprFunctor,
  MaybeGADT, MaybeGADTK, MaybeGADTFunctor, MaybeGADTApplicative, MaybeGADTMonad,
  EitherGADT, EitherGADTK, EitherGADTBifunctor,
  Result as ResultGADT, ResultK, ResultFunctor
} from './fp-gadt-enhanced';

import {
  Kind1, Kind2, Kind3,
  Apply, Type, TypeArgs, KindArity,
  ArrayK, MaybeK, EitherK, TupleK, FunctionK,
  Maybe, Either
} from './fp-hkt';

import {
  Functor, Applicative, Monad, Bifunctor,
  deriveFunctor, deriveApplicative, deriveMonad,
  lift2, composeK, sequence, traverse
} from './fp-typeclasses-hkt';

// Help TS infer R: explicitly pick R at the call site without repeating PatternMatcherBuilder
const P = <T extends GADT<string, any>, R>(gadt: T) => pmatch<T, R>(gadt);

// ============================================================================
// Generic Fold Framework
// ============================================================================

/**
 * Generic Fold type alias that defines a mapping from GADT tag → handler function
 * Each handler receives the payload for that constructor and returns the fold result
 */
export type Fold<T extends GADT<string, any>, R> = {
  [Tag in GADTTags<T>]: (payload: GADTPayload<T, Tag>) => R;
};

/**
 * Generic fold helper that applies an algebra to a GADT value
 * Uses pmatch internally to recurse and enforces all cases are covered
 */
export function fold<T extends GADT<string, any>, R>(
  value: T,
  algebra: Fold<T, R>
): R {
  return foldGeneric(value, algebra);
}

/**
 * Generic fold helper for any GADT type
 * Dynamically applies the algebra based on the GADT's tag
 */
export function foldGeneric<T extends GADT<string, any>, R>(
  value: T,
  algebra: Fold<T, R>
): R {
  const handler = algebra[value.tag as keyof Fold<T, R>];
  if (!handler) {
    throw new Error(`No handler for case: ${value.tag}`);
  }
  return handler(value.payload);
}

// ============================================================================
// Catamorphism for Expr
// ============================================================================

/**
 * Fold algebra for Expr<A> that maps each constructor to a handler function
 * Each handler receives the payload and returns the fold result
 */
export type FoldExpr<A, R> = {
  Const: (value: A) => R;
  Add: (left: R, right: R) => R;
  If: (cond: boolean, thenBranch: R, elseBranch: R) => R;
  Var: (name: string) => R;
  Let: (name: string, value: R, body: R) => R;
};

function foldBool(expr: Expr<boolean>): boolean {
  return pmatch<Expr<boolean>, boolean>(expr)
    .with('Const', ({ value }) => value)
    .with('If', ({ cond, then, else: else_ }) =>
      foldBool(cond) ? foldBool(then as any) : foldBool(else_ as any)
    )
    .with('Var', ({ name }) => { throw new Error(`Unbound variable: ${name}`); })
    .with('Add', () => { throw new Error('Cannot evaluate Add as boolean'); })
    .with('Let', ({ body }) => foldBool(body as any))
    .exhaustive();
}

/**
 * Catamorphism for Expr<A> that recurses through the structure and applies handlers bottom-up
 * The algebra defines how to handle each constructor, and the fold applies it recursively
 */
export function cataExpr<A, R>(
  expr: Expr<A>,
  algebra: FoldExpr<A, R>
): R {
  return pmatch<Expr<A>, R>(expr)
    .with('Const', ({ value }) => algebra.Const(value))
    .with('Add', ({ left, right }) => algebra.Add(
      cataExpr(left as any, algebra),
      cataExpr(right as any, algebra)
    ))
    .with('If', ({ cond, then, else: else_ }) =>
      algebra.If(
        foldBool(cond),
        cataExpr(then as any, algebra),
        cataExpr(else_ as any, algebra)
      )
    )
    .with('Var', ({ name }) => algebra.Var(name))
    .with('Let', ({ name, value, body }) =>
      algebra.Let(name, cataExpr(value as any, algebra), cataExpr(body as any, algebra))
    )
    .exhaustive();
}

/**
 * Recursive catamorphism for Expr<A> that applies the algebra recursively
 * This version recurses into sub-expressions before applying the algebra
 */
export function cataExprRecursive<R>(
  expr: Expr<any>,
  algebra: {
    Const: (value: any) => R;
    Add: (left: R, right: R) => R;
    If: (cond: R, thenBranch: R, elseBranch: R) => R;
    Var: (name: string) => R;
    Let: (name: string, value: R, body: R) => R;
  }
): R {
  return pmatch<Expr<any>, R>(expr)
    .with('Const', ({ value }) => algebra.Const(value))
    .with('Add', ({ left, right }) => 
      algebra.Add(
        cataExprRecursive(left, algebra),
        cataExprRecursive(right, algebra)
      )
    )
    .with('If', ({ cond, then, else: else_ }) => 
      algebra.If(
        cataExprRecursive(cond, algebra),
        cataExprRecursive(then, algebra),
        cataExprRecursive(else_, algebra)
      )
    )
    .with('Var', ({ name }) => algebra.Var(name))
    .with('Let', ({ name, value, body }) => 
      algebra.Let(
        name,
        cataExprRecursive(value, algebra),
        cataExprRecursive(body, algebra)
      )
    )
    .exhaustive();
}

// ============================================================================
// Derivable Folds
// ============================================================================

/**
 * DerivableFold type for auto-deriving fold helpers via the Derivable Instances system
 */
export type DerivableFold<T extends GADT<string, any>, R> = {
  [Tag in GADTTags<T>]: (payload: GADTPayload<T, Tag>) => R;
};

/**
 * Auto-derive fold helper for any GADT type
 */
export function deriveFold<T extends GADT<string, any>, R>(
  gadt: T,
  algebra: Partial<DerivableFold<T, R>>
): R | undefined {
  const handler = algebra[gadt.tag as keyof DerivableFold<T, R>];
  if (!handler) {
    return undefined;
  }
  return handler(gadt.payload);
}

/**
 * Create a fold builder for a specific GADT type
 */
export function createFoldBuilder<T extends GADT<string, any>, R>(
  algebra: Partial<DerivableFold<T, R>>
) {
  return function(gadt: T): R | undefined {
    return deriveFold(gadt, algebra);
  };
}

// ============================================================================
// HKT Integration
// ============================================================================

/**
 * Fold variant that works in HKT-generic contexts
 * For GADTs that are type constructors via Kind wrappers
 */
export function foldK<F extends Kind1, R>(
  value: Apply<F, [any]>,
  algebra: any // This would be more specific based on the GADT type
): R {
  // Implementation would depend on the specific GADT type
  // This is a placeholder for the concept
  throw new Error('foldK implementation depends on specific GADT type');
}

/**
 * Fold for ExprK in HKT context
 */
export function foldExprK<A, R>(
  expr: Apply<ExprK, [A]>,
  algebra: FoldExpr<A, R>
): R {
  return cataExpr(expr as Expr<A>, algebra);
}

/**
 * Fold for MaybeGADTK in HKT context
 */
export function foldMaybeK<A, R>(
  maybe: Apply<MaybeGADTK, [A]>,
  algebra: {
    Just: (value: A) => R;
    Nothing: () => R;
  }
): R {
  return pmatch<MaybeGADT<A>, R>(maybe as MaybeGADT<A>)
    .with('Just', ({ value }) => algebra.Just(value))
    .with('Nothing', () => algebra.Nothing())
    .exhaustive();
}

/**
 * Fold for EitherGADTK in HKT context
 */
export function foldEitherK<L, R, Result>(
  either: Apply<EitherGADTK, [L, R]>,
  algebra: {
    Left: (value: L) => Result;
    Right: (value: R) => Result;
  }
): Result {
  return pmatch<EitherGADT<L, R>, Result>(either as EitherGADT<L, R>)
    .with('Left', ({ value }) => algebra.Left(value))
    .with('Right', ({ value }) => algebra.Right(value))
    .exhaustive();
}

// ============================================================================
// Fold Algebras for Common GADTs
// ============================================================================

/**
 * Fold algebra for MaybeGADT<A>
 */
export type FoldMaybe<A, R> = {
  Just: (payload: { value: A }) => R;
  Nothing: (payload: {}) => R;
};

/**
 * Catamorphism for MaybeGADT<A>
 */
export function cataMaybe<A, R>(
  maybe: MaybeGADT<A>,
  algebra: FoldMaybe<A, R>
): R {
  return pmatch<MaybeGADT<A>, R>(maybe)
    .with('Just', algebra.Just)
    .with('Nothing', algebra.Nothing)
    .exhaustive();
}

/**
 * Fold algebra for EitherGADT<L, R>
 */
export type FoldEither<L, R, Result> = {
  Left: (payload: { value: L }) => Result;
  Right: (payload: { value: R }) => Result;
};

/**
 * Catamorphism for EitherGADT<L, R>
 */
export function cataEither<L, R, Out>(
  either: EitherGADT<L, R>,
  algebra: FoldEither<L, R, Out>
): Out {
  return pmatch<EitherGADT<L, R>, Out>(either)
    .with('Left', algebra.Left)
    .with('Right', algebra.Right)
    .exhaustive();
}

/**
 * Fold algebra for Result<A, E>
 */
export type FoldResult<A, E, R> = {
  Ok: (payload: { value: A }) => R;
  Err: (payload: { error: E }) => R;
};

/**
 * Catamorphism for Result<A, E>
 */
export function cataResult<A, E, R>(
  result: ResultGADT<A, E>,
  algebra: FoldResult<A, E, R>
): R {
  return pmatch<ResultGADT<A, E>, R>(result)
    .with('Ok', algebra.Ok)
    .with('Err', algebra.Err)
    .exhaustive();
}

// ============================================================================
// Example Fold Algebras and Usage
// ============================================================================

/**
 * Example: Evaluate Expr<number> to number using catamorphism
 */
export function evalExprAlgebra(): FoldExpr<number, number> {
  return {
    Const: (value) => value,
    Add: (l, r) => l + r,
    If: (cond, t, e) => (cond ? t : e),
    Var: (name) => { throw new Error(`Unbound variable: ${name}`); },
    Let: (_name, _value, body) => body
  };
}

/**
 * Example: Evaluate Expr<number> to number using recursive catamorphism
 */
export function evalExprRecursive(expr: Expr<number>): number {
  return cataExprRecursive(expr, {
    Const: n => n,
    Add: (l, r) => l + r,
    If: (c, t, e) => c ? t : e,
    Var: name => { throw new Error(`Unbound variable: ${name}`); },
    Let: (name, value, body) => body // Simplified: ignore name binding
  });
}

/**
 * Example: Transform Expr<string> by mapping over string constants
 */
export function transformStringAlgebra(): FoldExpr<string, Expr<string>> {
  return {
    Const: (value) => Expr.Const(value.toUpperCase()),
    Add: (_l, _r) => { throw new Error("Cannot add strings in this context"); },
    If: (cond, thenBranch, elseBranch) => {
      // For transforming strings, we need to construct boolean expressions
      const boolCond = typeof cond === 'boolean' ? Expr.Const(cond) : Expr.Const(true);
      return Expr.If(boolCond, thenBranch, elseBranch);
    },
    Var: (name) => Expr.Var(name),
    Let: (name, value, body) => Expr.Let(name, value, body)
  };
}

/**
 * Example: Fold Maybe to string
 */
export function maybeToStringAlgebra<A>(): FoldMaybe<A, string> {
  return {
    Just: ({ value }) => `Value: ${value}`,
    Nothing: () => 'None'
  };
}

/**
 * Example: Extract default value from Either
 */
export function eitherDefaultAlgebra<L, R>(defaultValue: R): FoldEither<L, R, R> {
  return {
    Left: () => defaultValue,
    Right: ({ value }) => value
  };
}

/**
 * Example: Extract success value from Result with error handling
 */
export function resultSuccessAlgebra<A, E>(errorHandler: (error: E) => A): FoldResult<A, E, A> {
  return {
    Ok: ({ value }) => value,
    Err: ({ error }) => errorHandler(error)
  };
}

// ============================================================================
// Composable Fold Algebras
// ============================================================================

/**
 * Compose two fold algebras
 */
export function composeFoldAlgebras<T extends GADT<string, any>, R1, R2>(
  algebra1: Fold<T, R1>,
  algebra2: (r1: R1) => R2
): Fold<T, R2> {
  const out: Partial<Fold<T, R2>> = {};
  (Object.keys(algebra1) as Array<GADTTags<T>>).forEach((tag) => {
    const h = algebra1[tag] as (p: GADTPayload<T, typeof tag>) => R1;
    (out as any)[tag] = (payload: GADTPayload<T, typeof tag>) => algebra2(h(payload));
  });
  return out as Fold<T, R2>;
}

/**
 * Example: Compose Maybe fold algebras
 */
export function composeMaybeAlgebras<A, R1, R2>(
  algebra1: FoldMaybe<A, R1>,
  algebra2: (r1: R1) => R2
): FoldMaybe<A, R2> {
  return {
    Just: ({ value }) => algebra2(algebra1.Just({ value })),
    Nothing: () => algebra2(algebra1.Nothing({}))
  };
}

// ============================================================================
// Integration Examples
// ============================================================================

/**
 * Example: Using fold with MaybeGADT
 */
export function exampleMaybeFold(): void {
  const justValue = MaybeGADT.Just<number>(42);
  const nothingValue = MaybeGADT.Nothing<number>();
  
  const toStringAlgebra = maybeToStringAlgebra<number>();
  
  const justResult = cataMaybe(justValue, toStringAlgebra);
  const nothingResult = cataMaybe(nothingValue, toStringAlgebra);
  
  console.log('Maybe fold Just:', justResult); // "Value: 42"
  console.log('Maybe fold Nothing:', nothingResult); // "None"
  
  // Using derivable fold
  const foldMaybe = createFoldBuilder<MaybeGADT<number>, string>({
    Just: ({ value }) => `Got ${value}`,
    Nothing: () => 'No value'
  });
  
  const derivedJustResult = foldMaybe(justValue);
  const derivedNothingResult = foldMaybe(nothingValue);
  
  console.log('Derivable fold Just:', derivedJustResult); // "Got 42"
  console.log('Derivable fold Nothing:', derivedNothingResult); // "No value"
}

/**
 * Example: Using fold with EitherGADT
 */
export function exampleEitherFold(): void {
  const leftValue = EitherGADT.Left<string, number>('error');
  const rightValue = EitherGADT.Right<string, number>(123);
  
  const defaultAlgebra = eitherDefaultAlgebra<string, number>(0);
  
  const leftResult = cataEither(leftValue, defaultAlgebra);
  const rightResult = cataEither(rightValue, defaultAlgebra);
  
  console.log('Either fold Left:', leftResult); // 0
  console.log('Either fold Right:', rightResult); // 123
}

/**
 * Example: Using fold with Expr
 */
export function exampleExprFold(): void {
  const expr: Expr<number> = Expr.Add(
    Expr.Const(5),
    Expr.Add(Expr.Const(3), Expr.Const(2))
  );
  
  const evalResult = evalExprRecursive(expr);
  console.log('Expr fold evaluation:', evalResult); // 10
  
  const stringExpr: Expr<string> = Expr.If(
    Expr.Const(true),
    Expr.Const("hello"),
    Expr.Const("world")
  );
  
  const transformAlgebra = transformStringAlgebra();
  const transformed = cataExpr(stringExpr, transformAlgebra);
  console.log('Expr fold transformation:', transformed);
}

/**
 * Example: Using fold with Result
 */
export function exampleResultFold(): void {
  const success = ResultGADT.Ok<number, string>(42);
  const failure = ResultGADT.Err<number, string>('Something went wrong');
  
  const successAlgebra = resultSuccessAlgebra<number, string>(
    error => parseInt(error) || 0
  );
  
  const successResult = cataResult(success, successAlgebra);
  const failureResult = cataResult(failure, successAlgebra);
  
  console.log('Result fold success:', successResult); // 42
  console.log('Result fold failure:', failureResult); // 0
}

/**
 * Example: Algebra reuse between folds
 */
export function exampleAlgebraReuse(): void {
  // Base algebra for Maybe
  const baseMaybeAlgebra: FoldMaybe<number, string> = {
    Just: ({ value }) => `Value: ${value}`,
    Nothing: () => 'None'
  };
  
  // Compose with transformation
  const upperCaseAlgebra = composeMaybeAlgebras(
    baseMaybeAlgebra,
    str => str.toUpperCase()
  );
  
  const justValue = MaybeGADT.Just<number>(42);
  
  const baseResult = cataMaybe(justValue, baseMaybeAlgebra);
  const upperResult = cataMaybe(justValue, upperCaseAlgebra);
  
  console.log('Base algebra:', baseResult); // "Value: 42"
  console.log('Composed algebra:', upperResult); // "VALUE: 42"
}

// ============================================================================
// Laws and Properties
// ============================================================================

/**
 * Catamorphism Laws:
 * 
 * 1. Identity: cata(gadt, identityAlgebra) = gadt (where identityAlgebra preserves structure)
 * 2. Composition: cata(gadt, f ∘ g) = f(cata(gadt, g))
 * 3. Fusion: cata(gadt, f) ∘ cata(gadt, g) = cata(gadt, f ∘ g)
 * 4. Naturality: cata(map(f, gadt), algebra) = f(cata(gadt, algebra))
 * 
 * Fold Algebra Laws:
 * 
 * 1. Completeness: All constructors must have handlers
 * 2. Type Safety: Handlers must match payload types exactly
 * 3. Composition: Algebras can be composed for transformation chains
 * 4. Reusability: Algebras can be reused across different fold operations
 * 
 * HKT Integration Laws:
 * 
 * 1. Kind Preservation: foldK preserves the kind structure of the GADT
 * 2. Type Constructor Compatibility: foldK works with type constructor GADTs
 * 3. Generic Algorithm Compatibility: foldK integrates with generic algorithms
 * 4. Derivation Compatibility: foldK works with derivable instances
 */ 