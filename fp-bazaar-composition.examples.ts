/**
 * Bazaar Composition & Fusion Examples
 *
 * This file demonstrates the advanced Bazaar composition system with practical examples:
 * - Basic composition patterns
 * - Fusion optimization
 * - Monoid operations
 * - Advanced composition patterns
 * - Law verification
 */

import { 
  composeBazaar, 
  composeBazaarSequence,
  fuseBazaar,
  fuseBazaarBatch,
  parallelFuseBazaar,
  bazaarMonoid,
  foldBazaar,
  composeBazaarWithFunction,
  composeBazaarConditional,
  composeBazaarWithErrorHandling,
  testBazaarCompositionLaws,
  testBazaarMonoidLaws,
  identityBazaar,
  constantBazaar
} from './fp-bazaar-composition';
import { Applicative } from './fp-typeclasses-hkt';
import { Bazaar } from './fp-optics-iso-helpers';

// ============================================================================
// Part 1: Basic Bazaar Examples
// ============================================================================

/**
 * Example 1: Basic Array Bazaar
 * Demonstrates a simple Bazaar for array operations.
 */
export function basicArrayBazaarExample() {
  console.log('\n=== Basic Array Bazaar Example ===');
  
  // Create a Bazaar for array elements
  const arrayBazaar: Bazaar<number, number, number[], number[]> = 
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => {
        let acc = F.of([] as number[]);
        for (const n of arr) {
          acc = F.ap(
            F.map(acc, (ns: number[]) => (m: number) => [...ns, m]),
            k(n)
          );
        }
        return acc;
      };
  
  // Identity applicative for pure operations
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  // Test the Bazaar
  const input = [1, 2, 3, 4, 5];
  const result = arrayBazaar(IdApplicative, (n: number) => n * 2)(input);
  
  console.log('Input:', input);
  console.log('Result (doubled):', result);
  console.log('Expected:', [2, 4, 6, 8, 10]);
  
  return { arrayBazaar, input, result };
}

// ============================================================================
// Part 2: Bazaar Composition Examples
// ============================================================================

/**
 * Example 2: Basic Bazaar Composition
 * Shows how to compose two Bazaar operations.
 */
export function basicCompositionExample() {
  console.log('\n=== Basic Bazaar Composition Example ===');
  
  // Bazaar for doubling numbers
  const doubleBazaar: Bazaar<number, number, number[], number[]> = 
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => {
        let acc = F.of([] as number[]);
        for (const n of arr) {
          acc = F.ap(
            F.map(acc, (ns: number[]) => (m: number) => [...ns, m]),
            k(n * 2)
          );
        }
        return acc;
      };
  
  // Bazaar for adding 1
  const addOneBazaar: Bazaar<number, number, number[], number[]> = 
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => {
        let acc = F.of([] as number[]);
        for (const n of arr) {
          acc = F.ap(
            F.map(acc, (ns: number[]) => (m: number) => [...ns, m]),
            k(n + 1)
          );
        }
        return acc;
      };
  
  // Compose: double then add 1
  const composed = composeBazaar(addOneBazaar, doubleBazaar);
  
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  const input = [1, 2, 3];
  const result = composed(IdApplicative, (n: number) => n)(input);
  
  console.log('Input:', input);
  console.log('Composed result (double then add 1):', result);
  console.log('Expected:', [3, 5, 7]); // (1*2)+1, (2*2)+1, (3*2)+1
  
  return { doubleBazaar, addOneBazaar, composed, input, result };
}

/**
 * Example 3: Multiple Bazaar Composition
 * Demonstrates composing multiple Bazaar operations in sequence.
 */
export function multipleCompositionExample() {
  console.log('\n=== Multiple Bazaar Composition Example ===');
  
  // Multiple transformations
  const transformations = [
    // Double each element
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => {
        let acc = F.of([] as number[]);
        for (const n of arr) {
          acc = F.ap(
            F.map(acc, (ns: number[]) => (m: number) => [...ns, m]),
            k(n * 2)
          );
        }
        return acc;
      },
    
    // Add 1 to each element
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => {
        let acc = F.of([] as number[]);
        for (const n of arr) {
          acc = F.ap(
            F.map(acc, (ns: number[]) => (m: number) => [...ns, m]),
            k(n + 1)
          );
        }
        return acc;
      },
    
    // Square each element
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => {
        let acc = F.of([] as number[]);
        for (const n of arr) {
          acc = F.ap(
            F.map(acc, (ns: number[]) => (m: number) => [...ns, m]),
            k(n * n)
          );
        }
        return acc;
      }
  ];
  
  // Compose all transformations
  const composed = composeBazaarSequence(transformations);
  
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  const input = [1, 2, 3];
  const result = composed(IdApplicative, (n: number) => n)(input);
  
  console.log('Input:', input);
  console.log('Multiple composed result:', result);
  console.log('Expected:', [9, 25, 49]); // ((1*2)+1)², ((2*2)+1)², ((3*2)+1)²
  
  return { transformations, composed, input, result };
}

// ============================================================================
// Part 3: Bazaar Fusion Examples
// ============================================================================

/**
 * Example 4: Bazaar Fusion Optimization
 * Demonstrates how fusion can optimize Bazaar operations.
 */
export function fusionOptimizationExample() {
  console.log('\n=== Bazaar Fusion Optimization Example ===');
  
  // Create a Bazaar for array operations
  const arrayBazaar: Bazaar<number, number, number[], number[]> = 
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => {
        let acc = F.of([] as number[]);
        for (const n of arr) {
          acc = F.ap(
            F.map(acc, (ns: number[]) => (m: number) => [...ns, m]),
            k(n)
          );
        }
        return acc;
      };
  
  // Fuse the Bazaar with identity applicative
  const fused = fuseBazaar(arrayBazaar, {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  });
  
  const input = [1, 2, 3, 4, 5];
  const result = fused(input)((n: number) => n * 2);
  
  console.log('Input:', input);
  console.log('Fused result:', result);
  console.log('Expected:', [2, 4, 6, 8, 10]);
  
  return { arrayBazaar, fused, input, result };
}

/**
 * Example 5: Batch Fusion
 * Shows how to fuse multiple Bazaars for batch processing.
 */
export function batchFusionExample() {
  console.log('\n=== Batch Fusion Example ===');
  
  // Multiple Bazaars for different operations
  const bazaars = [
    // Double
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => {
        let acc = F.of([] as number[]);
        for (const n of arr) {
          acc = F.ap(
            F.map(acc, (ns: number[]) => (m: number) => [...ns, m]),
            k(n * 2)
          );
        }
        return acc;
      },
    
    // Add 1
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => {
        let acc = F.of([] as number[]);
        for (const n of arr) {
          acc = F.ap(
            F.map(acc, (ns: number[]) => (m: number) => [...ns, m]),
            k(n + 1)
          );
        }
        return acc;
      },
    
    // Square
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => {
        let acc = F.of([] as number[]);
        for (const n of arr) {
          acc = F.ap(
            F.map(acc, (ns: number[]) => (m: number) => [...ns, m]),
            k(n * n)
          );
        }
        return acc;
      }
  ];
  
  // Fuse all Bazaars
  const fused = fuseBazaarBatch(bazaars, {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  });
  
  const input = [1, 2, 3];
  const results = fused.map(f => f(input)((n: number) => n));
  
  console.log('Input:', input);
  console.log('Batch fused results:');
  console.log('  Double:', results[0]);
  console.log('  Add 1:', results[1]);
  console.log('  Square:', results[2]);
  
  return { bazaars, fused, input, results };
}

// ============================================================================
// Part 4: Bazaar Monoid Examples
// ============================================================================

/**
 * Example 6: Bazaar Monoid Operations
 * Demonstrates the monoid structure of Bazaar composition.
 */
export function monoidExample() {
  console.log('\n=== Bazaar Monoid Example ===');
  
  const monoid = bazaarMonoid<number[], number[]>();
  
  // Create some Bazaars
  const bazaars = [
    // Double
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => {
        let acc = F.of([] as number[]);
        for (const n of arr) {
          acc = F.ap(
            F.map(acc, (ns: number[]) => (m: number) => [...ns, m]),
            k(n * 2)
          );
        }
        return acc;
      },
    
    // Add 1
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => {
        let acc = F.of([] as number[]);
        for (const n of arr) {
          acc = F.ap(
            F.map(acc, (ns: number[]) => (m: number) => [...ns, m]),
            k(n + 1)
          );
        }
        return acc;
      }
  ];
  
  // Fold all Bazaars using the monoid
  const combined = foldBazaar(bazaars, monoid);
  
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  const input = [1, 2, 3];
  const result = combined(IdApplicative, (n: number) => n)(input);
  
  console.log('Input:', input);
  console.log('Monoid combined result:', result);
  console.log('Expected:', [3, 5, 7]); // double then add 1
  
  return { monoid, bazaars, combined, input, result };
}

// ============================================================================
// Part 5: Advanced Composition Patterns
// ============================================================================

/**
 * Example 7: Conditional Bazaar Composition
 * Shows how to compose Bazaars with conditional logic.
 */
export function conditionalCompositionExample() {
  console.log('\n=== Conditional Bazaar Composition Example ===');
  
  // Bazaar for even numbers (double them)
  const evenBazaar: Bazaar<number, number, number[], number[]> = 
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => {
        let acc = F.of([] as number[]);
        for (const n of arr) {
          acc = F.ap(
            F.map(acc, (ns: number[]) => (m: number) => [...ns, m]),
            k(n * 2)
          );
        }
        return acc;
      };
  
  // Bazaar for odd numbers (add 1)
  const oddBazaar: Bazaar<number, number, number[], number[]> = 
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => {
        let acc = F.of([] as number[]);
        for (const n of arr) {
          acc = F.ap(
            F.map(acc, (ns: number[]) => (m: number) => [...ns, m]),
            k(n + 1)
          );
        }
        return acc;
      };
  
  // Conditional composition based on array length
  const conditional = composeBazaarConditional(
    (arr: number[]) => arr.length % 2 === 0, // even length
    evenBazaar,
    oddBazaar
  );
  
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  const evenInput = [1, 2, 3, 4]; // even length
  const oddInput = [1, 2, 3];     // odd length
  
  const evenResult = conditional(IdApplicative, (n: number) => n)(evenInput);
  const oddResult = conditional(IdApplicative, (n: number) => n)(oddInput);
  
  console.log('Even length input:', evenInput);
  console.log('Even length result (doubled):', evenResult);
  console.log('Odd length input:', oddInput);
  console.log('Odd length result (add 1):', oddResult);
  
  return { evenBazaar, oddBazaar, conditional, evenInput, oddInput, evenResult, oddResult };
}

/**
 * Example 8: Function Composition with Bazaar
 * Demonstrates composing Bazaar with function transformations.
 */
export function functionCompositionExample() {
  console.log('\n=== Function Composition with Bazaar Example ===');
  
  // Base Bazaar for array operations
  const arrayBazaar: Bazaar<number, number, number[], number[]> = 
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => {
        let acc = F.of([] as number[]);
        for (const n of arr) {
          acc = F.ap(
            F.map(acc, (ns: number[]) => (m: number) => [...ns, m]),
            k(n)
          );
        }
        return acc;
      };
  
  // Compose with function transformations
  const composed = composeBazaarWithFunction(
    arrayBazaar,
    (n: number) => n.toString(), // transform to string
    (s: string) => parseInt(s)   // transform back to number
  );
  
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  const input = [1, 2, 3];
  const result = composed(IdApplicative, (s: string) => s + "!")(input);
  
  console.log('Input:', input);
  console.log('Function composed result:', result);
  console.log('Expected:', ["1!", "2!", "3!"]);
  
  return { arrayBazaar, composed, input, result };
}

// ============================================================================
// Part 6: Law Verification Examples
// ============================================================================

/**
 * Example 9: Bazaar Composition Law Verification
 * Demonstrates testing the mathematical laws of Bazaar composition.
 */
export function lawVerificationExample() {
  console.log('\n=== Bazaar Composition Law Verification ===');
  
  // Create test Bazaars
  const baz1: Bazaar<number, number, number[], number[]> = 
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => {
        let acc = F.of([] as number[]);
        for (const n of arr) {
          acc = F.ap(
            F.map(acc, (ns: number[]) => (m: number) => [...ns, m]),
            k(n * 2)
          );
        }
        return acc;
      };
  
  const baz2: Bazaar<number, number, number[], number[]> = 
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => {
        let acc = F.of([] as number[]);
        for (const n of arr) {
          acc = F.ap(
            F.map(acc, (ns: number[]) => (m: number) => [...ns, m]),
            k(n + 1)
          );
        }
        return acc;
      };
  
  const baz3: Bazaar<number, number, number[], number[]> = 
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => {
        let acc = F.of([] as number[]);
        for (const n of arr) {
          acc = F.ap(
            F.map(acc, (ns: number[]) => (m: number) => [...ns, m]),
            k(n * n)
          );
        }
        return acc;
      };
  
  const testData = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
  
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  // Test composition laws
  const laws = testBazaarCompositionLaws(baz1, baz2, baz3, testData, IdApplicative);
  
  console.log('Composition Laws:');
  console.log('  Associativity:', laws.associativity);
  console.log('  Identity:', laws.identity);
  console.log('  Fusion:', laws.fusion);
  
  // Test monoid laws
  const monoidLaws = testBazaarMonoidLaws([baz1, baz2, baz3], testData, IdApplicative);
  
  console.log('Monoid Laws:');
  console.log('  Associativity:', monoidLaws.associativity);
  console.log('  Identity:', monoidLaws.identity);
  
  return { baz1, baz2, baz3, laws, monoidLaws };
}

// ============================================================================
// Part 7: Utility Examples
// ============================================================================

/**
 * Example 10: Identity and Constant Bazaars
 * Demonstrates utility Bazaar constructors.
 */
export function utilityBazaarExample() {
  console.log('\n=== Utility Bazaar Example ===');
  
  // Identity Bazaar
  const id = identityBazaar<number[]>();
  
  // Constant Bazaar
  const constant = constantBazaar<number, string, number[], string[]>("hello");
  
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  const input = [1, 2, 3];
  const idResult = id(IdApplicative, (n: number) => n * 2)(input);
  const constantResult = constant(IdApplicative, (s: string) => s.toUpperCase())(input);
  
  console.log('Input:', input);
  console.log('Identity Bazaar result:', idResult);
  console.log('Constant Bazaar result:', constantResult);
  
  return { id, constant, input, idResult, constantResult };
}

// ============================================================================
// Part 8: Run All Examples
// ============================================================================

/**
 * Run all Bazaar composition examples.
 */
export function runAllBazaarCompositionExamples() {
  console.log('🚀 Running Bazaar Composition & Fusion Examples\n');
  
  basicArrayBazaarExample();
  basicCompositionExample();
  multipleCompositionExample();
  fusionOptimizationExample();
  batchFusionExample();
  monoidExample();
  conditionalCompositionExample();
  functionCompositionExample();
  lawVerificationExample();
  utilityBazaarExample();
  
  console.log('\n✅ All Bazaar Composition Examples Completed!');
}

// Export all examples
export {
  basicArrayBazaarExample,
  basicCompositionExample,
  multipleCompositionExample,
  fusionOptimizationExample,
  batchFusionExample,
  monoidExample,
  conditionalCompositionExample,
  functionCompositionExample,
  lawVerificationExample,
  utilityBazaarExample,
  runAllBazaarCompositionExamples
};
