/**
 * Tests for Readonly-aware GADT Pattern Matching
 */

import { 
  pmatchReadonly, 
  pmatchReadonlyPartial, 
  createReadonlyGADTMatcher, 
  createReadonlyPmatchBuilder 
} from '../fp-readonly-patterns';
import { GADT } from '../fp-gadt-enhanced';

// Sample GADT
type NumberExpr =
  | GADT<'Const', { value: number }>
  | GADT<'Add', { left: NumberExpr; right: NumberExpr }>
  | GADT<'Neg', { value: NumberExpr }>;

const Const = (value: number): NumberExpr => ({ tag: 'Const', payload: { value } });
const Add = (left: NumberExpr, right: NumberExpr): NumberExpr => ({ tag: 'Add', payload: { left, right } });
const Neg = (value: NumberExpr): NumberExpr => ({ tag: 'Neg', payload: { value } });

describe('pmatchReadonly', () => {
  const one = Const(1);
  const expr = Add(Const(2), Neg(Const(3)));

  test('exhaustive evaluates', () => {
    const evalR = (e: NumberExpr): number =>
      pmatchReadonly(e, {
        Const: (p) => p.value,
        Add: (p) => evalR(p.left) + evalR(p.right),
        Neg: (p) => -evalR(p.value)
      });

    expect(evalR(one)).toBe(1);
    expect(evalR(expr)).toBe(-1);
  });

  test('partial returns undefined', () => {
    const out1 = pmatchReadonlyPartial(one, {
      Const: (p) => p.value
      // Add and Neg omitted
    });
    const out2 = pmatchReadonlyPartial(expr, {
      Const: (p) => p.value
    });
    expect(out1).toBe(1);
    expect(out2).toBeUndefined();
  });

  test('curryable matcher', () => {
    const render = createReadonlyGADTMatcher<NumberExpr, string>({
      Const: (p) => `#${p.value}`,
      Add: (p) => `(${render(p.left)}+${render(p.right)})`,
      Neg: (p) => `(-${render(p.value)})`
    });
    expect(render(Const(5))).toBe('#5');
    expect(render(Add(Const(1), Const(2)))).toBe('(#1+#2)');
  });

  test('builder-style readonly pmatch', () => {
    const e = Add(Const(10), Neg(Const(4)));

    const r = createReadonlyPmatchBuilder<NumberExpr, number>(e)
      .with('Const', (p) => p.value)
      .with('Add', (p) => {
        const left = pmatchReadonly(p.left, {
          Const: x => x.value,
          Add: x => 999,  // not used here
          Neg: x => -pmatchReadonly(x.value, {
            Const: y => y.value,
            Add: _ => -1,
            Neg: _ => 0
          })
        });
        const right = pmatchReadonly(p.right, {
          Const: x => x.value,
          Add: _ => 0,
          Neg: x => -pmatchReadonly(x.value, {
            Const: y => y.value,
            Add: _ => -1,
            Neg: _ => 0
          })
        });
        return left + right;
      })
      .with('Neg', (p) => -pmatchReadonly(p.value, {
        Const: x => x.value,
        Add: _ => 0,
        Neg: _ => 0
      }))
      .exhaustive();

    expect(r).toBe(6);
  });

  test('builder partial matching', () => {
    const e = Const(42);
    
    const builder = createReadonlyPmatchBuilder<NumberExpr, string>(e)
      .with('Const', (p) => `constant: ${p.value}`);
    
    // Should work for Const
    expect(builder.partial()).toBe('constant: 42');
    
    // Should return undefined for Add (not registered)
    const addExpr = Add(Const(1), Const(2));
    const addBuilder = createReadonlyPmatchBuilder<NumberExpr, string>(addExpr)
      .with('Const', (p) => `constant: ${p.value}`);
    
    expect(addBuilder.partial()).toBeUndefined();
  });

  test('exhaustiveness checking', () => {
    const e = Add(Const(1), Const(2));
    
    // Should throw when not all cases are handled
    const incompleteBuilder = createReadonlyPmatchBuilder<NumberExpr, number>(e)
      .with('Const', (p) => p.value);
    
    expect(() => incompleteBuilder.exhaustive()).toThrow();
  });
});

describe('Readonly type safety', () => {
  test('immutable payloads compile-time check', () => {
    const expr = Const(42);
    
    // This should compile - payload is treated as readonly
    const result = pmatchReadonly(expr, {
      Const: (p) => {
        // p.value should be accessible but readonly
        const value: number = p.value;
        return value * 2;
      },
      Add: (p) => {
        // p.left and p.right should be readonly
        const left: NumberExpr = p.left;
        const right: NumberExpr = p.right;
        return 0;
      },
      Neg: (p) => {
        // p.value should be readonly
        const value: NumberExpr = p.value;
        return 0;
      }
    });
    
    expect(result).toBe(84);
  });
});

describe('Edge cases', () => {
  test('nested expressions', () => {
    // ((1 + 2) + -(3))
    const complex = Add(
      Add(Const(1), Const(2)),
      Neg(Const(3))
    );
    
    const eval = createReadonlyGADTMatcher<NumberExpr, number>({
      Const: (p) => p.value,
      Add: (p) => eval(p.left) + eval(p.right),
      Neg: (p) => -eval(p.value)
    });
    
    expect(eval(complex)).toBe(0); // (1 + 2) + (-3) = 3 - 3 = 0
  });
  
  test('string rendering', () => {
    const expr = Add(Const(5), Neg(Add(Const(2), Const(3))));
    
    const render = (e: NumberExpr): string =>
      pmatchReadonly(e, {
        Const: (p) => p.value.toString(),
        Add: (p) => `(${render(p.left)} + ${render(p.right)})`,
        Neg: (p) => `-(${render(p.value)})`
      });
    
    expect(render(expr)).toBe('(5 + -((2 + 3)))');
  });
});
