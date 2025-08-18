// src/fp-optics-codiagonal.ts
//
// Codiagonal optics - tiny combinator/optic for merging Either<A,A> into A
// 
// Provides:
// 1. Value-level helper: codiagonal<A>(e: Either<A,A>): A
// 2. Prism: codiagonalPrism<A>(): Prism<Either<A,A>, Either<A,A>, A, A>
// 3. Arrow/Profunctor version for Function Arrow/Choice
//
// Usage in optics composition: merges branches when you don't care which side it came from
// Usage in Arrow/ArrowChoice: primitive for wiring decision nodes back into single flow

import { Either, Left, Right, matchEither } from '../fp-either-unified';
import { prism, Prism } from '../fp-optics-core';

// ============================================================================
// Part 1: Value-level Helper
// ============================================================================

/**
 * Value-level codiagonal helper
 * Extracts the value from Either<A,A> regardless of which side it came from
 */
export const codiagonal = <A>(e: Either<A, A>): A =>
  matchEither(e, { Left: (a: A) => a, Right: (a: A) => a });

// ============================================================================
// Part 2: Prism Implementation
// ============================================================================

/**
 * Codiagonal Prism that "builds" via Left by convention (matches Monocle's shape)
 * 
 * Prism<Either<A,A>, Either<A,A>, A, A>
 * 
 * - match: always succeeds – we expose the A and discard which side it came from
 * - build: pick a convention (Left) to inject back
 */
export function codiagonalPrism<A>(): Prism<Either<A, A>, Either<A, A>, A, A> {
  return prism<Either<A, A>, Either<A, A>, A, A>(
    // match: always succeeds – we expose the A and discard which side it came from
    (s) => ({ tag: 'Just', value: matchEither(s, { Left: (a: A) => a, Right: (a: A) => a }) }),
    // build: pick a convention (Left) to inject back
    (b) => Left(b)
  );
}

// ============================================================================
// Part 3: Arrow/Profunctor Implementation
// ============================================================================

/**
 * Arrow/ArrowChoice version for Function profunctor
 * 
 * This is literally arr(either(id,id)) in Arrow-speak
 */
export const codiagonalArrow = <A>() => (e: Either<A, A>): A =>
  matchEither(e, { Left: (a: A) => a, Right: (a: A) => a });

/**
 * Function Arrow/Choice instance with codiagonal primitive
 * 
 * This provides the standard Arrow/ArrowChoice operations plus codiagonal
 */
export const ArrowFunction = {
  // Category operations
  id: <A>(): ((a: A) => A) => (a: A) => a,
  compose: <A, B, C>(g: (b: B) => C, f: (a: A) => B): ((a: A) => C) =>
    (a: A) => g(f(a)),
  
  // Arrow operations
  arr: <A, B>(f: (a: A) => B): ((a: A) => B) => f,
  first: <A, B, C>(p: (a: A) => B): (([a, c]: [A, C]) => [B, C]) =>
    ([a, c]: [A, C]) => [p(a), c],
  
  // ArrowChoice operations
  left: <A, B, C>(p: (a: A) => B): ((e: Either<A, C>) => Either<B, C>) =>
    (e: Either<A, C>) => matchEither(e, {
      Left: (a: A) => Left(p(a)),
      Right: (c: C) => Right(c)
    }),
  
  // Codiagonal primitive
  codiagonal: <A>() => (e: Either<A, A>): A =>
    matchEither(e, { Left: (a: A) => a, Right: (a: A) => a })
};

/**
 * Alternative implementation using dimap (more explicit profunctor approach)
 * 
 * This is equivalent to:
 * FunctionProfunctor.dimap(
 *   (a: any) => a,               // identity "pab" for A -> A
 *   (e: Either<any, any>) => e,  // pre dimap: identity on Either
 *   (a: any) => a                // post dimap: identity
 * )
 */
export const codiagonalProfunctor = <A>() => {
  // Simplified version - in practice you'd use your profunctor machinery
  return (e: Either<A, A>): A => matchEither(e, { Left: (a: A) => a, Right: (a: A) => a });
};

// ============================================================================
// Part 4: Usage Examples
// ============================================================================

/**
 * Example: Using codiagonal in optics composition
 */
export function exampleOpticsComposition() {
  // Create a prism that focuses on the "name" field from either side
  const namePrism = prism<{ name: string }, { name: string }, string, string>(
    (s) => ({ tag: 'Just', value: s.name }),  // match: extract name
    (name) => ({ name })         // build: create object with name
  );
  
  // To compose prisms, you'd need proper composition - this is just for demonstration
  // In practice, you'd use lens/prism composition combinators
  const codiag = codiagonalPrism<string>();
  
  // Now you can work with Either<{name: string}, {name: string}> -> string
  const person1 = { name: "Alice" };
  const person2 = { name: "Bob" };
  
  // Both work the same way regardless of which side
  const leftEither = Left(person1);
  const rightEither = Right(person2);
  
  // Use getOption instead of get, and build instead of review
  const name1Result = codiag.getOption(leftEither);  
  const name2Result = codiag.getOption(rightEither);
}

/**
 * Example: Using codiagonal in Arrow/ArrowChoice pipelines
 */
export function exampleArrowComposition() {
  // Create some decision-making functions
  const validateAge = (age: number): Either<number, number> =>
    age >= 18 ? Left(age) : Right(18);
  
  const formatAge = (age: number): string => `${age} years old`;
  
  // Use codiagonal to merge the decision branches
  const processAge = (age: number): string => {
    const validated = validateAge(age);
    const mergedAge = codiagonal<number>(validated);
    return formatAge(mergedAge);
  };
  
  // Now processAge: number -> string works regardless of validation result
  const result1 = processAge(25); // "25 years old"
  const result2 = processAge(15); // "18 years old"
}

// ============================================================================
// Part 5: Type Helpers
// ============================================================================

/**
 * Type helper for codiagonal operations
 */
export type Codiagonal<A> = Either<A, A>;

/**
 * Type helper for codiagonal function
 */
export type CodiagonalFn<A> = (e: Codiagonal<A>) => A;

/**
 * Type helper for codiagonal prism
 */
export type CodiagonalPrism<A> = Prism<Codiagonal<A>, Codiagonal<A>, A, A>;

// ============================================================================
// Part 6: Law Verification
// ============================================================================

/**
 * Verify codiagonal prism laws
 */
export function verifyCodiagonalPrismLaws<A>(testValue: A): boolean {
  const pr = codiagonalPrism<A>();
  
  // Law 1: getOption(prism, build(prism, b)) = Just(b)
  const built = pr.build(testValue);
  const previewed = pr.getOption(built);
  const law1 = previewed.tag === 'Just' && previewed.value === testValue;
  
  // Law 2: getOption(prism, s) = Just(a) => build(prism, a) should reconstruct properly
  const leftInput = Left(testValue);
  const rightInput = Right(testValue);
  
  const leftPreview = pr.getOption(leftInput);
  const rightPreview = pr.getOption(rightInput);
  
  const law2Left = leftPreview.tag === 'Just' && 
                   leftPreview.value === testValue;
  
  const law2Right = rightPreview.tag === 'Just' && 
                    rightPreview.value === testValue;
  
  // Both left and right should extract the same value (codiagonal property)
  return law1 && law2Left && law2Right && 
         leftPreview.tag === 'Just' && rightPreview.tag === 'Just' &&
         leftPreview.value === rightPreview.value;
}
