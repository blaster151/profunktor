/**
 * Demo: Combining Catamorphisms with Readonly Deconstruction Helpers
 * 
 * This demo shows how to use the newly reintroduced fp-catamorphisms.ts
 * together with our readonly-safe deconstruction helpers for powerful
 * data structure folding and transformation.
 */

import {
  fold, cataExpr, foldGeneric, deriveFold, createFoldBuilder,
  type Fold, type FoldExpr, type DerivableFold
} from './fp-catamorphisms';

import {
  unconsArray, unconsList, unconsMap, unconsSet,
  onArray, onList, onMap, onSet,
  listToReadonlyArray, mapToEntries, setToReadonlyArray
} from './src/fp-readonly';

import {
  GADT, MaybeGADT, EitherGADT, Expr,
  pmatch
} from './fp-gadt-enhanced';

import { PersistentList, PersistentMap, PersistentSet } from './fp-persistent';

// ============================================================================
// Demo 1: Folding over expressions with deconstruction helpers
// ============================================================================

function demoExpressionFolds() {
  console.log('\n=== Expression Folding Demo ===');
  
  // Create some expressions
  const expr1 = Expr.Const(42);
  const expr2 = Expr.Var('x');
  const expr3 = Expr.Add(Expr.Const(10), Expr.Var('y'));
  
  // Define fold algebra for expression evaluation
  const evalAlgebra: FoldExpr<number, number> = {
    Const: (value) => value,
    Var: (name) => name === 'x' ? 5 : name === 'y' ? 3 : 0,
    Add: (left, right) => left + right,
    If: (cond, then_, else_) => cond ? then_ : else_,
    Let: (name, value, body) => body // simplified - ignore bindings for demo
  };
  
  // Fold expressions to get values
  const result1 = cataExpr(expr1, evalAlgebra);
  const result2 = cataExpr(expr2, evalAlgebra);
  const result3 = cataExpr(expr3, evalAlgebra);
  
  console.log('Const 42:', result1); // 42
  console.log('Var x:', result2); // 5
  console.log('Add(10, y):', result3); // 13
}

// ============================================================================
// Demo 2: Combining with readonly collections
// ============================================================================

function demoCollectionFolds() {
  console.log('\n=== Collection Folding Demo ===');
  
  // Create collections with expressions
  const exprArray = [
    Expr.Const(1),
    Expr.Add(Expr.Const(2), Expr.Const(3)),
    Expr.Var('x')
  ] as const;
  
  const exprList = PersistentList.fromArray(exprArray);
  const exprMap = PersistentMap.fromEntries([
    ['first', Expr.Const(10)],
    ['second', Expr.Add(Expr.Const(5), Expr.Const(15))]
  ]);
  
  // Define evaluation algebra
  const evalAlgebra: FoldExpr<number, number> = {
    Const: (value) => value,
    Var: (name) => name === 'x' ? 100 : 0,
    Add: (left, right) => left + right,
    If: (cond, then_, else_) => cond ? then_ : else_,
    Let: (name, value, body) => body
  };
  
  // Fold over array using deconstruction helpers
  const arraySum = onArray(exprArray, {
    empty: () => 0,
    nonEmpty: (head, tail) => {
      const headValue = cataExpr(head, evalAlgebra);
      const tailSum = tail.reduce((sum, expr) => sum + cataExpr(expr, evalAlgebra), 0);
      return headValue + tailSum;
    }
  });
  
  // Fold over list using deconstruction helpers  
  const listSum = onList(exprList, {
    empty: () => 0,
    cons: (head, tail) => {
      const headValue = cataExpr(head, evalAlgebra);
      const tailArray = listToReadonlyArray(tail);
      const tailSum = tailArray.reduce((sum, expr) => sum + cataExpr(expr, evalAlgebra), 0);
      return headValue + tailSum;
    }
  });
  
  // Fold over map using deconstruction helpers
  const mapSum = onMap(exprMap, {
    empty: () => 0,
    nonEmpty: (key, expr, rest) => {
      const currentValue = cataExpr(expr, evalAlgebra);
      const restEntries = mapToEntries(rest);
      const restSum = restEntries.reduce((sum, [_, restExpr]) => 
        sum + cataExpr(restExpr, evalAlgebra), 0);
      return currentValue + restSum;
    }
  });
  
  console.log('Array sum:', arraySum); // 1 + 5 + 100 = 106
  console.log('List sum:', listSum);   // Same as array
  console.log('Map sum:', mapSum);     // 10 + 20 = 30
}

// ============================================================================
// Demo 3: Generic GADT folding with Maybe
// ============================================================================

function demoMaybeFolds() {
  console.log('\n=== Maybe GADT Folding Demo ===');
  
  const just42 = MaybeGADT.Just(42);
  const nothing = MaybeGADT.Nothing<number>();
  
  // Define Maybe fold algebra
  const stringifyAlgebra: Fold<typeof just42, string> = {
    Just: (value) => `Value: ${value}`,
    Nothing: () => 'No value'
  };
  
  // Apply folds
  const result1 = fold(just42, stringifyAlgebra);
  const result2 = fold(nothing, stringifyAlgebra);
  
  console.log('Just(42) fold:', result1); // "Value: 42"
  console.log('Nothing fold:', result2);  // "No value"
  
  // Use with collections
  const maybeArray = [just42, nothing, MaybeGADT.Just(100)] as const;
  
  const processedValues = onArray(maybeArray, {
    empty: () => [],
    nonEmpty: (head, tail) => {
      const headResult = fold(head, stringifyAlgebra);
      const tailResults = tail.map(m => fold(m, stringifyAlgebra));
      return [headResult, ...tailResults];
    }
  });
  
  console.log('Processed Maybe array:', processedValues);
  // ["Value: 42", "No value", "Value: 100"]
}

// ============================================================================
// Demo 4: Derivable folds with builder pattern
// ============================================================================

function demoDerivableFolds() {
  console.log('\n=== Derivable Folds Demo ===');
  
  // Create fold builder for Maybe
  const maybeFolder = createFoldBuilder<MaybeGADT<number>, number>({
    Just: ({ value }) => value * 2,
    Nothing: () => 0
  });
  
  // Use with collections
  const maybes = [
    MaybeGADT.Just(5),
    MaybeGADT.Nothing<number>(),
    MaybeGADT.Just(10)
  ];
  
  const results = maybes.map(maybeFolder).filter(r => r !== undefined);
  console.log('Doubled values:', results); // [10, 0, 20]
  
  // Combine with deconstruction
  const list = PersistentList.fromArray(maybes);
  const foldedSum = onList(list, {
    empty: () => 0,
    cons: (head, tail) => {
      const headValue = maybeFolder(head) ?? 0;
      const tailArray = listToReadonlyArray(tail);
      const tailSum = tailArray.reduce((sum, m) => sum + (maybeFolder(m) ?? 0), 0);
      return headValue + tailSum;
    }
  });
  
  console.log('List folded sum:', foldedSum); // 30
}

// ============================================================================
// Run all demos
// ============================================================================

export function runCatamorphismDemo() {
  console.log('🔄 Catamorphisms + Readonly Deconstruction Demo');
  
  demoExpressionFolds();
  demoCollectionFolds();
  demoMaybeFolds();
  demoDerivableFolds();
  
  console.log('\n✅ All catamorphism demos completed!');
}

// Auto-run if this file is executed directly
if (typeof window === 'undefined') {
  runCatamorphismDemo();
}
