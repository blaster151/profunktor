/**
 * Demo of Readonly-aware GADT Pattern Matching
 */

import { 
  pmatchReadonly, 
  pmatchReadonlyPartial, 
  createReadonlyGADTMatcher, 
  createReadonlyPmatchBuilder 
} from './fp-readonly-patterns';
import { GADT } from './fp-gadt-enhanced';

// Sample GADT
type NumberExpr =
  | GADT<'Const', { value: number }>
  | GADT<'Add', { left: NumberExpr; right: NumberExpr }>
  | GADT<'Neg', { value: NumberExpr }>;

const Const = (value: number): NumberExpr => ({ tag: 'Const', payload: { value } });
const Add = (left: NumberExpr, right: NumberExpr): NumberExpr => ({ tag: 'Add', payload: { left, right } });
const Neg = (value: NumberExpr): NumberExpr => ({ tag: 'Neg', payload: { value } });

console.log('=== Readonly GADT Pattern Matching Demo ===');

// Create some sample expressions
const one = Const(1);
const expr = Add(Const(2), Neg(Const(3))); // 2 + (-3) = -1

console.log('\n1. Exhaustive Pattern Matching:');

// Recursive evaluator using pmatchReadonly
const evalExpr = (e: NumberExpr): number =>
  pmatchReadonly(e, {
    Const: (p) => p.value,
    Add: (p) => evalExpr(p.left) + evalExpr(p.right),
    Neg: (p) => -evalExpr(p.value)
  });

console.log('evalExpr(one):', evalExpr(one)); // 1
console.log('evalExpr(expr):', evalExpr(expr)); // -1

console.log('\n2. Partial Pattern Matching:');

// Partial matching - only handle Const
const extractConst = (e: NumberExpr) =>
  pmatchReadonlyPartial(e, {
    Const: (p) => p.value
    // Add and Neg omitted
  });

console.log('extractConst(one):', extractConst(one)); // 1
console.log('extractConst(expr):', extractConst(expr)); // undefined

console.log('\n3. Curryable Matcher:');

// Create a string renderer using curryable matcher
const renderExpr = createReadonlyGADTMatcher<NumberExpr, string>({
  Const: (p) => `#${p.value}`,
  Add: (p) => `(${renderExpr(p.left)}+${renderExpr(p.right)})`,
  Neg: (p) => `(-${renderExpr(p.value)})`
});

console.log('renderExpr(Const(5)):', renderExpr(Const(5))); // #5
console.log('renderExpr(Add(Const(1), Const(2))):', renderExpr(Add(Const(1), Const(2)))); // (#1+#2)
console.log('renderExpr(expr):', renderExpr(expr)); // (#2+(-#3))

console.log('\n4. Builder-style Pattern Matching:');

// Use builder-style for step-by-step construction
const doubleExpr = createReadonlyPmatchBuilder<NumberExpr, number>(one)
  .with('Const', (p) => p.value * 2)
  .with('Add', (p) => (evalExpr(p.left) + evalExpr(p.right)) * 2)
  .with('Neg', (p) => -evalExpr(p.value) * 2)
  .exhaustive();

console.log('doubleExpr(one):', doubleExpr); // 2

console.log('\n5. Builder Partial Matching:');

// Demonstrate builder partial functionality
const partialBuilder = createReadonlyPmatchBuilder<NumberExpr, string>(expr)
  .with('Add', (p) => `addition of ${renderExpr(p.left)} and ${renderExpr(p.right)}`);

console.log('partialBuilder.partial():', partialBuilder.partial()); // should work for Add
console.log('partialBuilder on Const would be undefined');

// Test with Const
const constBuilder = createReadonlyPmatchBuilder<NumberExpr, string>(one)
  .with('Add', (p) => 'this is an addition');

console.log('constBuilder.partial():', constBuilder.partial()); // undefined

console.log('\n6. Complex Expression:');

// More complex expression: ((1 + 2) + -(3 + 4))
const complexExpr = Add(
  Add(Const(1), Const(2)),
  Neg(Add(Const(3), Const(4)))
);

console.log('Complex expression value:', evalExpr(complexExpr)); // (1+2) + -(3+4) = 3 + (-7) = -4
console.log('Complex expression rendered:', renderExpr(complexExpr));

console.log('\n7. Readonly Type Safety:');

// Demonstrate that payloads are treated as immutable
const typeTestExpr = Const(42);
const readonlyTest = pmatchReadonly(typeTestExpr, {
  Const: (p) => {
    // p.value is readonly - we can read but not modify
    const value: number = p.value;
    console.log('Read value from readonly payload:', value);
    return value;
  },
  Add: (p) => {
    // p.left and p.right are readonly NumberExpr
    console.log('Left and right are readonly');
    return 0;
  },
  Neg: (p) => {
    // p.value is readonly NumberExpr
    console.log('Nested value is readonly');
    return 0;
  }
});

console.log('Readonly test result:', readonlyTest);

console.log('\nDemo completed successfully!');
