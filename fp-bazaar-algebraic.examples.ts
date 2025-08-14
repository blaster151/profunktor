/**
 * Bazaar Algebraic Structures Examples
 * 
 * This file demonstrates the advanced algebraic structures for Bazaar optics:
 * - Profunctor operations (dimap, lmap, rmap)
 * - Strong Profunctor operations (first, second)
 * - Choice Profunctor operations (left, right)
 * - Closed Profunctor operations (closed)
 * - Traversing Profunctor operations (traverse)
 * - Category and Arrow operations
 * - Law verification and testing
 */

import { 
  bazaarProfunctor,
  bazaarStrong,
  bazaarChoice,
  bazaarClosed,
  bazaarTraversing,
  bazaarCategory,
  bazaarArrow,
  testBazaarProfunctorLaws,
  testBazaarStrongLaws,
  simpleBazaar,
  profunctorExample,
  strongExample
} from './fp-bazaar-algebraic';
import { Applicative } from './fp-typeclasses-hkt';
import { Bazaar } from './fp-optics-iso-helpers';

// ============================================================================
// Part 1: Profunctor Examples
// ============================================================================

/**
 * Example 1: Basic Profunctor Operations
 * Demonstrates dimap, lmap, and rmap operations.
 */
export function basicProfunctorExample() {
  console.log('\n=== Basic Profunctor Operations ===');
  
  // Create a simple Bazaar for array operations
  const baz = simpleBazaar<number, string, number[], string[]>(
    (n: number) => n.toString(),
    (arr: number[]) => arr[0] || 0,
    (s: string, arr: number[]) => [s, ...arr.slice(1).map(n => n.toString())]
  );
  
  const profunctor = bazaarProfunctor<number, string, number[], string[]>();
  
  // lmap: transform input (contravariant)
  const doubledInput = profunctor.lmap((n: number) => n * 2, baz);
  
  // rmap: transform output (covariant)
  const uppercasedOutput = profunctor.rmap((s: string) => s.toUpperCase(), baz);
  
  // dimap: transform both input and output
  const transformedBoth = profunctor.dimap(
    (n: number) => n * 2,  // input transformation
    (s: string) => s.toUpperCase(),  // output transformation
    baz
  );
  
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  const input = [1, 2, 3];
  
  console.log('Original input:', input);
  console.log('Original result:', baz(IdApplicative, (n: number) => n.toString())(input));
  console.log('Doubled input result:', doubledInput(IdApplicative, (n: number) => n.toString())(input));
  console.log('Uppercased output result:', uppercasedOutput(IdApplicative, (n: number) => n.toString())(input));
  console.log('Transformed both result:', transformedBoth(IdApplicative, (n: number) => n.toString())(input));
  
  return { baz, doubledInput, uppercasedOutput, transformedBoth };
}

/**
 * Example 2: Profunctor Composition
 * Shows how profunctor operations compose.
 */
export function profunctorCompositionExample() {
  console.log('\n=== Profunctor Composition ===');
  
  const baz = simpleBazaar<number, string, number[], string[]>(
    (n: number) => n.toString(),
    (arr: number[]) => arr[0] || 0,
    (s: string, arr: number[]) => [s, ...arr.slice(1).map(n => n.toString())]
  );
  
  const profunctor = bazaarProfunctor<number, string, number[], string[]>();
  
  // Compose multiple profunctor operations
  const f1 = (n: number) => n * 2;
  const f2 = (n: number) => n + 1;
  const g1 = (s: string) => s.toUpperCase();
  const g2 = (s: string) => s + "!";
  
  // Compose input transformations: f1 . f2
  const composedInput = profunctor.lmap(f1, profunctor.lmap(f2, baz));
  
  // Compose output transformations: g1 . g2
  const composedOutput = profunctor.rmap(g1, profunctor.rmap(g2, baz));
  
  // Compose both: dimap (f1 . f2) (g1 . g2)
  const composedBoth = profunctor.dimap(
    (n: number) => f1(f2(n)),
    (s: string) => g1(g2(s)),
    baz
  );
  
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  const input = [1, 2, 3];
  
  console.log('Input:', input);
  console.log('Composed input (f1 . f2):', composedInput(IdApplicative, (n: number) => n.toString())(input));
  console.log('Composed output (g1 . g2):', composedOutput(IdApplicative, (n: number) => n.toString())(input));
  console.log('Composed both:', composedBoth(IdApplicative, (n: number) => n.toString())(input));
  
  return { baz, composedInput, composedOutput, composedBoth };
}

// ============================================================================
// Part 2: Strong Profunctor Examples
// ============================================================================

/**
 * Example 3: Strong Profunctor Operations
 * Demonstrates first and second operations for product types.
 */
export function strongProfunctorExample() {
  console.log('\n=== Strong Profunctor Operations ===');
  
  const baz = simpleBazaar<number, string, number[], string[]>(
    (n: number) => n.toString(),
    (arr: number[]) => arr[0] || 0,
    (s: string, arr: number[]) => [s, ...arr.slice(1).map(n => n.toString())]
  );
  
  const strong = bazaarStrong<number, string, number[], string[]>();
  
  // first: apply to first component of pair
  const firstBaz = strong.first(baz);
  
  // second: apply to second component of pair
  const secondBaz = strong.second(baz);
  
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  const input1: [number[], string] = [[1, 2, 3], "hello"];
  const input2: [string, number[]] = ["world", [4, 5, 6]];
  
  console.log('Input pair 1:', input1);
  console.log('First applied:', firstBaz(IdApplicative, (n: number) => n.toString())(input1));
  
  console.log('Input pair 2:', input2);
  console.log('Second applied:', secondBaz(IdApplicative, (n: number) => n.toString())(input2));
  
  return { baz, firstBaz, secondBaz };
}

/**
 * Example 4: Strong Profunctor Composition
 * Shows how strong profunctor operations compose.
 */
export function strongCompositionExample() {
  console.log('\n=== Strong Profunctor Composition ===');
  
  const baz = simpleBazaar<number, string, number[], string[]>(
    (n: number) => n.toString(),
    (arr: number[]) => arr[0] || 0,
    (s: string, arr: number[]) => [s, ...arr.slice(1).map(n => n.toString())]
  );
  
  const strong = bazaarStrong<number, string, number[], string[]>();
  
  // Compose strong operations
  const firstThenSecond = strong.second(strong.first(baz));
  const secondThenFirst = strong.first(strong.second(baz));
  
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  const input: [[number[], string], number[]] = [[[1, 2, 3], "hello"], [4, 5, 6]];
  
  console.log('Complex input:', input);
  console.log('First then second:', firstThenSecond(IdApplicative, (n: number) => n.toString())(input));
  console.log('Second then first:', secondThenFirst(IdApplicative, (n: number) => n.toString())(input));
  
  return { baz, firstThenSecond, secondThenFirst };
}

// ============================================================================
// Part 3: Choice Profunctor Examples
// ============================================================================

/**
 * Example 5: Choice Profunctor Operations
 * Demonstrates left and right operations for sum types.
 */
export function choiceProfunctorExample() {
  console.log('\n=== Choice Profunctor Operations ===');
  
  const baz = simpleBazaar<number, string, number[], string[]>(
    (n: number) => n.toString(),
    (arr: number[]) => arr[0] || 0,
    (s: string, arr: number[]) => [s, ...arr.slice(1).map(n => n.toString())]
  );
  
  const choice = bazaarChoice<number, string, number[], string[]>();
  
  // left: apply to Left case of Either
  const leftBaz = choice.left(baz);
  
  // right: apply to Right case of Either
  const rightBaz = choice.right(baz);
  
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  const leftInput = { left: [1, 2, 3] };
  const rightInput = { right: "hello" };
  
  console.log('Left input:', leftInput);
  console.log('Left applied:', leftBaz(IdApplicative, (n: number) => n.toString())(leftInput));
  
  console.log('Right input:', rightInput);
  console.log('Right applied:', rightBaz(IdApplicative, (n: number) => n.toString())(rightInput));
  
  return { baz, leftBaz, rightBaz };
}

// ============================================================================
// Part 4: Closed Profunctor Examples
// ============================================================================

/**
 * Example 6: Closed Profunctor Operations
 * Demonstrates closed operations for function types.
 */
export function closedProfunctorExample() {
  console.log('\n=== Closed Profunctor Operations ===');
  
  const baz = simpleBazaar<number, string, number[], string[]>(
    (n: number) => n.toString(),
    (arr: number[]) => arr[0] || 0,
    (s: string, arr: number[]) => [s, ...arr.slice(1).map(n => n.toString())]
  );
  
  const closed = bazaarClosed<number, string, number[], string[]>();
  
  // closed: apply to function type
  const closedBaz = closed.closed(baz);
  
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  const functionInput = (x: string) => [parseInt(x) || 0, 2, 3];
  const context = "5";
  
  console.log('Function input:', functionInput);
  console.log('Context:', context);
  console.log('Closed applied:', closedBaz(IdApplicative, (n: number) => n.toString())(functionInput)(context));
  
  return { baz, closedBaz };
}

// ============================================================================
// Part 5: Category and Arrow Examples
// ============================================================================

/**
 * Example 7: Category Operations
 * Demonstrates identity and composition for Bazaar as Category.
 */
export function categoryExample() {
  console.log('\n=== Category Operations ===');
  
  const category = bazaarCategory<number[], string[]>();
  
  // Identity
  const id = category.id<number>();
  
  // Composition
  const baz1 = simpleBazaar<number, string, number[], string[]>(
    (n: number) => n.toString(),
    (arr: number[]) => arr[0] || 0,
    (s: string, arr: number[]) => [s, ...arr.slice(1).map(n => n.toString())]
  );
  
  const baz2 = simpleBazaar<string, number, string[], number[]>(
    (s: string) => parseInt(s) || 0,
    (arr: string[]) => arr[0] || "0",
    (n: number, arr: string[]) => [n.toString(), ...arr.slice(1).map(s => parseInt(s) || 0)]
  );
  
  const composed = category.compose(baz2, baz1);
  
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  const input = [1, 2, 3];
  
  console.log('Input:', input);
  console.log('Identity result:', id(IdApplicative, (n: number) => n)(input));
  console.log('Composed result:', composed(IdApplicative, (n: number) => n)(input));
  
  return { category, id, baz1, baz2, composed };
}

/**
 * Example 8: Arrow Operations
 * Demonstrates arr and first operations for Bazaar as Arrow.
 */
export function arrowExample() {
  console.log('\n=== Arrow Operations ===');
  
  const arrow = bazaarArrow<number[], string[]>();
  
  // arr: lift function to arrow
  const arrBaz = arrow.arr<number, string>((n: number) => n.toString());
  
  // first: apply to first component of pair
  const firstArr = arrow.first(arrBaz);
  
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  const input = [1, 2, 3];
  const pairInput: [number[], string] = [input, "hello"];
  
  console.log('Input:', input);
  console.log('Arr result:', arrBaz(IdApplicative, (n: number) => n.toString())(input));
  
  console.log('Pair input:', pairInput);
  console.log('First result:', firstArr(IdApplicative, (n: number) => n.toString())(pairInput));
  
  return { arrow, arrBaz, firstArr };
}

// ============================================================================
// Part 6: Law Verification Examples
// ============================================================================

/**
 * Example 9: Profunctor Law Verification
 * Tests that Bazaar satisfies profunctor laws.
 */
export function profunctorLawVerification() {
  console.log('\n=== Profunctor Law Verification ===');
  
  const baz = simpleBazaar<number, string, number[], string[]>(
    (n: number) => n.toString(),
    (arr: number[]) => arr[0] || 0,
    (s: string, arr: number[]) => [s, ...arr.slice(1).map(n => n.toString())]
  );
  
  const testData = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
  
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  const laws = testBazaarProfunctorLaws(baz, testData, IdApplicative);
  
  console.log('Profunctor Laws:');
  console.log('  dimapIdentity:', laws.dimapIdentity);
  console.log('  dimapComposition:', laws.dimapComposition);
  console.log('  lmapIdentity:', laws.lmapIdentity);
  console.log('  rmapIdentity:', laws.rmapIdentity);
  
  const allPassed = Object.values(laws).every(law => law);
  console.log('All laws passed:', allPassed);
  
  return { baz, laws, allPassed };
}

/**
 * Example 10: Strong Profunctor Law Verification
 * Tests that Bazaar satisfies strong profunctor laws.
 */
export function strongLawVerification() {
  console.log('\n=== Strong Profunctor Law Verification ===');
  
  const baz = simpleBazaar<number, string, number[], string[]>(
    (n: number) => n.toString(),
    (arr: number[]) => arr[0] || 0,
    (s: string, arr: number[]) => [s, ...arr.slice(1).map(n => n.toString())]
  );
  
  const testData = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
  
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  const laws = testBazaarStrongLaws(baz, testData, IdApplicative);
  
  console.log('Strong Profunctor Laws:');
  console.log('  firstIdentity:', laws.firstIdentity);
  console.log('  secondIdentity:', laws.secondIdentity);
  console.log('  firstComposition:', laws.firstComposition);
  console.log('  secondComposition:', laws.secondComposition);
  
  const allPassed = Object.values(laws).every(law => law);
  console.log('All laws passed:', allPassed);
  
  return { baz, laws, allPassed };
}

// ============================================================================
// Part 7: Advanced Algebraic Patterns
// ============================================================================

/**
 * Example 11: Complex Algebraic Composition
 * Demonstrates complex composition of multiple algebraic structures.
 */
export function complexAlgebraicComposition() {
  console.log('\n=== Complex Algebraic Composition ===');
  
  const baz = simpleBazaar<number, string, number[], string[]>(
    (n: number) => n.toString(),
    (arr: number[]) => arr[0] || 0,
    (s: string, arr: number[]) => [s, ...arr.slice(1).map(n => n.toString())]
  );
  
  const profunctor = bazaarProfunctor<number, string, number[], string[]>();
  const strong = bazaarStrong<number, string, number[], string[]>();
  const choice = bazaarChoice<number, string, number[], string[]>();
  
  // Complex composition: strong . choice . profunctor
  const complex = strong.first(
    choice.left(
      profunctor.dimap(
        (n: number) => n * 2,
        (s: string) => s.toUpperCase(),
        baz
      )
    )
  );
  
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  const input: [{ left: number[] }, string] = [{ left: [1, 2, 3] }, "hello"];
  
  console.log('Complex input:', input);
  console.log('Complex result:', complex(IdApplicative, (n: number) => n.toString())(input));
  
  return { baz, complex };
}

// ============================================================================
// Part 8: Run All Examples
// ============================================================================

/**
 * Run all Bazaar algebraic structure examples.
 */
export function runAllBazaarAlgebraicExamples() {
  console.log('🚀 Running Bazaar Algebraic Structures Examples\n');
  
  basicProfunctorExample();
  profunctorCompositionExample();
  strongProfunctorExample();
  strongCompositionExample();
  choiceProfunctorExample();
  closedProfunctorExample();
  categoryExample();
  arrowExample();
  profunctorLawVerification();
  strongLawVerification();
  complexAlgebraicComposition();
  
  console.log('\n✅ All Bazaar Algebraic Structure Examples Completed!');
}

// Export all examples
export {
  basicProfunctorExample,
  profunctorCompositionExample,
  strongProfunctorExample,
  strongCompositionExample,
  choiceProfunctorExample,
  closedProfunctorExample,
  categoryExample,
  arrowExample,
  profunctorLawVerification,
  strongLawVerification,
  complexAlgebraicComposition,
  runAllBazaarAlgebraicExamples
};
