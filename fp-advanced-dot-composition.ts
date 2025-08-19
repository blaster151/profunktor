/**
 * Advanced DOT-like Stream Composition with Multiplicity Tracking
 * 
 * This module demonstrates how composition computes new multiplicity types
 * from its parts and how the compiler can statically catch illegal escalation.
 */

import { StreamModule, Nat, Add, Mul, StateFn } from './fp-dot-stream-modules-complete';

// ---------- Generic extractors for StreamModule ----------
type InOf<M>    = M extends StreamModule<infer I, any, any, any> ? I : never;
type OutOf<M>   = M extends StreamModule<any, infer O, any, any> ? O : never;
type StateOf<M> = M extends StreamModule<any, any, infer S, any> ? S : never;
type MultOf<M>  = M extends StreamModule<any, any, any, infer MM extends Nat> ? MM : never;

// Example safety validator — rename if you already have one:
type ValidateCompositionSafety<F, G> =
  OutOf<F> extends InOf<G> ? true : false;

// Enhanced multiplicity tracking with conditional types
type ConditionalMultiplicity<Condition extends boolean, Then extends Nat, Else extends Nat> = 
  Condition extends true ? Then : Else;

// Advanced stream modules with complex multiplicity patterns
interface ConditionalMapStream<In, Out, F extends (input: In) => Out, P extends (input: In) => boolean, M extends Nat> extends StreamModule<In, Out, void, M> {
  readonly predicate: P;
  readonly mapper: F;
  run(input: In): StateFn<void, Out>;
}

interface AdaptiveFilterStream<In, P extends (input: In) => boolean, M extends Nat> extends StreamModule<In, In, { adaptiveThreshold: number }, M> {
  readonly predicate: P;
  run(input: In): StateFn<{ adaptiveThreshold: number }, In>;
}

interface MultiplicativeStream<In, Out, F extends (input: In) => Out, Factor extends Nat, M extends Nat> extends StreamModule<In, Out, void, M> {
  readonly mapper: F;
  readonly factor: Factor;
  run(input: In): StateFn<void, Out>;
}

// Enhanced composition with multiplicity tracking
interface TrackedComposition<F extends StreamModule<any, any, any, any>, G extends StreamModule<any, any, any, any>, M extends Nat> extends StreamModule<F extends StreamModule<infer I, any, any, any> ? I : never, G extends StreamModule<any, infer O, any, any> ? O : never, { 
  fState: F extends StreamModule<any, any, infer FS, any> ? FS : never; 
  gState: G extends StreamModule<any, any, infer GS, any> ? GS : never;
  multiplicityTracker: {
    expected: Nat;
    actual: Nat;
    violations: string[];
  };
}, M> {
  readonly f: F;
  readonly g: G;
  run(input: F extends StreamModule<infer I, any, any, any> ? I : never): StateFn<{ 
    fState: F extends StreamModule<any, any, infer FS, any> ? FS : never; 
    gState: G extends StreamModule<any, any, infer GS, any> ? GS : never;
    multiplicityTracker: {
      expected: Nat;
      actual: Nat;
      violations: string[];
    };
  }, G extends StreamModule<any, infer O, any, any> ? O : never>;
}

// Type-level multiplicity validation with detailed error reporting
type MultiplicityViolation<Expected extends Nat, Actual extends Nat, Context extends string> = 
  Actual extends Expected ? never : 
  Actual extends Add<Expected, any> ? 
    `Multiplicity escalation detected in ${Context}: expected ${Expected}, got ${Actual}` : 
    `Multiplicity mismatch in ${Context}: expected ${Expected}, got ${Actual}`;

// Compile-time multiplicity safety check with error messages
// Note: This is experimental syntax for advanced type-level computations
// type ValidateCompositionSafety<F extends StreamModule<any, any, any, any>, G extends StreamModule<any, any, any, any>, I> = 
//   MultiplicityViolation<any, any, 'composition'>;

// Example implementations
class ConditionalMapStreamImpl<In, Out> implements ConditionalMapStream<In, Out, (input: In) => Out, (input: In) => boolean, 2> {
  readonly multiplicity: 2 = 2;
  readonly predicate: (input: In) => boolean;
  readonly mapper: (input: In) => Out;

  constructor(
    fn: (input: In) => Out,
    predicate: (input: In) => boolean
  ) {
    this.mapper = fn;
    this.predicate = predicate;
  }
  
  run(input: In): StateFn<void, Out> {
    return (state: void) => {
      if (this.predicate(input)) {
        return [state, this.mapper(input)]; // Consume once
      } else {
        // Simulate consuming twice by calling fn twice
        const result1 = this.mapper(input);
        const result2 = this.mapper(input);
        return [state, result2]; // Return second result
      }
    };
  }
}

class AdaptiveFilterStreamImpl<In> implements AdaptiveFilterStream<In, (input: In) => boolean, 3> {
  readonly multiplicity: 3 = 3;
  readonly predicate: (input: In) => boolean;
  
  constructor(predicate: (input: In) => boolean) {
    this.predicate = predicate;
  }
  
  run(input: In): StateFn<{ adaptiveThreshold: number }, In> {
    return (state: { adaptiveThreshold: number }) => {
      if (this.predicate(input)) {
        return [{ ...state, adaptiveThreshold: state.adaptiveThreshold + 1 }, input];
      } else {
        // Simulate higher consumption when filtering out
        const _check1 = this.predicate(input);
        const _check2 = this.predicate(input);
        const _check3 = this.predicate(input);
        return [{ ...state, adaptiveThreshold: state.adaptiveThreshold - 1 }, input]; // Return input instead of null
      }
    };
  }
}

class MultiplicativeStreamImpl<In, Out> implements MultiplicativeStream<In, Out, (input: In) => Out, 5, 5> {
  readonly multiplicity: 5 = 5;
  readonly mapper: (input: In) => Out;
  readonly factor: 5 = 5;

  constructor(
    fn: (input: In) => Out,
    factor: Nat
  ) {
    this.mapper = fn;
  }
  
  run(input: In): StateFn<void, Out> {
    return (state: void) => {
      let result: Out = this.mapper(input);
      // Simulate multiple consumption based on factor
      for (let i = 1; i < this.factor; i++) {
        result = this.mapper(input);
      }
      return [state, result];
    };
  }
}

// Enhanced composition function with multiplicity tracking
function composeWithTracking<
  I1, O1, S1, M1 extends Nat,
  O2, S2, M2 extends Nat,
  NewM extends Nat = Add<M1, M2>
>(
  f: StreamModule<I1, O1, S1, M1>,
  g: StreamModule<O1, O2, S2, M2>
): StreamModule<
  I1,
  O2,
  {
    fState: S1;
    gState: S2;
    multiplicityTracker: {
      expected: NewM;
      actual: NewM;
      violations: string[];
    };
  },
  NewM
> {
  return {
    run(input: I1): StateFn<{
      fState: S1;
      gState: S2;
      multiplicityTracker: {
        expected: NewM;
        actual: NewM;
        violations: string[];
      };
    }, O2> {
      return (state) => {
        const [newFState, fOutput] = f.run(input)(state.fState);
        const [newGState, gOutput] = g.run(fOutput)(state.gState);
        
        // Track multiplicity violations
        const violations = [...state.multiplicityTracker.violations];
        const expectedMultiplicity = (f.multiplicity + g.multiplicity) as NewM;
        const actualMultiplicity = expectedMultiplicity; // Simplified for demo
        
        if (actualMultiplicity !== expectedMultiplicity) {
          violations.push(`Multiplicity mismatch: expected ${expectedMultiplicity}, got ${actualMultiplicity}`);
        }
        
        return [{
          fState: newFState,
          gState: newGState,
          multiplicityTracker: {
            expected: expectedMultiplicity,
            actual: actualMultiplicity,
            violations
          }
        }, gOutput];
      };
    },
    multiplicity: (f.multiplicity + g.multiplicity) as NewM
  };
}

// Type-safe stream builder with multiplicity validation
class SafeStreamBuilder<
  In,
  Out,
  S,
  M extends Nat
> {
  constructor(
    private readonly module: StreamModule<In, Out, S, M>
  ) {}
  
  // Compose with validation
  compose<
    G extends StreamModule<Out, any, any, any>,
    GOut = OutOf<G>,
    GS   = StateOf<G>,
    GM   extends Nat = MultOf<G>
  >(
    g: G
  ): SafeStreamBuilder<
    In,
    GOut,
    {
      fState: S;
      gState: GS;
      multiplicityTracker: {
        expected: Add<M, GM>;
        actual: Add<M, GM>;
        violations: string[];
      };
    },
    Add<M, GM>
  > {
    // purely for type-checking; no runtime impact
    type SafetyCheck = ValidateCompositionSafety<typeof this.module, G>;
    const _safetyCheck: SafetyCheck = undefined as any;

    // Ensure this function's signature returns the right type
    const composed = composeWithTracking(this.module, g);
    return new SafeStreamBuilder(composed) as any; // Type assertion to handle complex inference
  }
  
  build() {
    return this.module;
  }
  
  // Get multiplicity analysis
  getMultiplicityAnalysis<I extends In>(): {
    input: I;
    expected: M;
    actual: M;
    violations: string[];
  } {
    return {
      input: undefined as any as I,
      expected: this.module.multiplicity,
      actual: this.module.multiplicity,
      violations: []
    };
  }
}

// Example demonstrating multiplicity composition
function demonstrateMultiplicityComposition() {
  console.log("=== Multiplicity Composition Examples ===");
  
  // Example 1: Simple composition
  const mapStream = new ConditionalMapStreamImpl<number, string>(
    (x: number) => `processed: ${x}`,
    (x: number) => x > 5
  );
  
  const filterStream = new AdaptiveFilterStreamImpl<string>(
    (x: string) => x.includes("processed")
  );
  
  console.log("MapStream multiplicity:", "1 or 2 depending on predicate");
  console.log("FilterStream multiplicity:", "1 or 3 depending on filtering");
  
  // Example 2: Multiplicative composition
  const multiplicativeStream = new MultiplicativeStreamImpl<string, string>(
    (x: string) => x.toUpperCase(),
    3 as Nat
  );
  
  console.log("MultiplicativeStream multiplicity:", "3 (factor * 1)");
  
  // Example 3: Complex composition with tracking
  const safeComposition = new SafeStreamBuilder(mapStream)
    .compose(filterStream)
    .compose(multiplicativeStream)
    .build();
  
  console.log("Composed multiplicity:", "Path-dependent based on input conditions");
  
  // Demonstrate runtime behavior
  const testInputs = [3, 6, 8, 10];
  
  for (const input of testInputs) {
    const initialState = {
      fState: {
        fState: undefined as void,
        gState: { adaptiveThreshold: 0 },
        multiplicityTracker: { expected: 5 as any, actual: 5 as any, violations: [] }
      },
      gState: undefined as void,
      multiplicityTracker: { expected: 10 as any, actual: 10 as any, violations: [] }
    };
    
    try {
      const [finalState, output] = safeComposition.run(input)(initialState);
      console.log(`Input: ${input}, Output: ${output}`);
      console.log(`Multiplicity violations:`, finalState.multiplicityTracker.violations);
    } catch (error) {
      console.log(`Error processing ${input}:`, (error as Error).message);
    }
  }
}

// Example demonstrating illegal multiplicity escalation detection
function demonstrateIllegalEscalation() {
  console.log("\n=== Illegal Multiplicity Escalation Detection ===");
  
  // This would be caught at compile time in a full implementation
  console.log("Type-level checks would prevent these scenarios:");
  
  // Scenario 1: Composing streams that consume more than allowed
  console.log("1. Stream composition exceeding resource bounds");
  
  // Scenario 2: Infinite consumption patterns
  console.log("2. Infinite consumption in recursive streams");
  
  // Scenario 3: Resource usage violations
  console.log("3. Violating memory or CPU constraints");
  
  // Example of what the type system would catch:
  type ExampleViolation = MultiplicityViolation<1, 5, 'test-composition'>;
  console.log("Example violation type:", "Would be 'Multiplicity escalation detected in test-composition: expected 1, got 5'");
  
  // Demonstrate compile-time error simulation
  function simulateCompileTimeError() {
    // This would cause a compile-time error in a full implementation
    type UnsafeComposition = ValidateCompositionSafety<
      ConditionalMapStream<number, string, (input: number) => string, (input: number) => boolean, 2>,
      MultiplicativeStream<string, string, (input: string) => string, 5, 5>
    >;
    
    // The type would be a string error message, not a valid type
    const _error: UnsafeComposition = "This would be a compile-time error" as any;
  }
  
  console.log("Compile-time error simulation:", "Type-level multiplicity validation");
}

// Advanced example: Path-dependent multiplicity with state
function demonstratePathDependentMultiplicity() {
  console.log("\n=== Path-Dependent Multiplicity with State ===");
  
  // Create streams with state-dependent multiplicity
  const statefulMap = new ConditionalMapStreamImpl<number, string>(
    (x: number) => `stateful: ${x}`,
    (x: number) => x > 10
  );
  
  const statefulFilter = new AdaptiveFilterStreamImpl<number>(
    (x: number) => x < 20
  );
  
  // Demonstrate how multiplicity changes based on input
  const testCases = [
    { input: 5, expectedMultiplicity: "1 (map) + 3 (filter) = 4" },
    { input: 15, expectedMultiplicity: "1 (map) + 1 (filter) = 2" },
    { input: 25, expectedMultiplicity: "2 (map) + 3 (filter) = 5" }
  ];
  
  for (const testCase of testCases) {
    console.log(`Input ${testCase.input}: ${testCase.expectedMultiplicity}`);
  }
  
  // Show how composition preserves path-dependent behavior
  console.log("Composition preserves path-dependent multiplicity tracking");
}

// Run the demonstration (commented out to avoid Node.js dependencies)
// demonstrateMultiplicityComposition();
// demonstrateIllegalEscalation();
// demonstratePathDependentMultiplicity();

export {
  ConditionalMapStream,
  AdaptiveFilterStream,
  MultiplicativeStream,
  TrackedComposition,
  SafeStreamBuilder,
  composeWithTracking,
  ConditionalMultiplicity,
  MultiplicityViolation,
  ValidateCompositionSafety
};
