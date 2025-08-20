# Homotopy System API Documentation

## Table of Contents

1. [DG Core API](#dg-core-api)
2. [DG Cooperad API](#dg-cooperad-api)
3. [Deformation Complex API](#deformation-complex-api)
4. [Mod-Boundary Law Checking API](#mod-boundary-law-checking-api)
5. [Integration API](#integration-api)

## DG Core API

### Types and Interfaces

#### `Degree`
```typescript
export type Degree = number;
```
Represents the degree of a graded object in the differential graded algebra.

#### `Term<T>`
```typescript
export interface Term<T> {
  coef: number;
  term: T;
}
```
Represents a term in a formal sum with a coefficient and the underlying term.

#### `Sum<T>`
```typescript
export type Sum<T> = readonly Term<T>[];
```
Represents a formal sum of terms with coefficients.

#### `DgModule<T>`
```typescript
export interface DgModule<T> {
  degree(t: T): Degree;
  d(t: T): Sum<T>; // linear differential
}
```
Interface for differential graded modules.

### Functions

#### `parity(n: Degree): number`
```typescript
export const parity = (n: Degree) => ((n % 2) + 2) % 2;
```
Computes the parity of a degree (0 for even, 1 for odd).

#### `koszul(m: Degree, n: Degree): number`
```typescript
export const koszul = (m: Degree, n: Degree) => (parity(m) * parity(n)) % 2 === 0 ? +1 : -1;
```
Computes the Koszul sign for permuting graded objects of degrees `m` and `n`.

#### `signPow(s: 1 | -1, k: Degree): 1 | -1`
```typescript
export const signPow = (s: 1 | -1, k: Degree) => (k % 2 === 0 ? +1 : s);
```
Computes `s^k` where `s` is ±1 and `k` is a degree.

#### `sum(...xs: Term<T>[]): Sum<T>`
```typescript
export const sum = <T>(...xs: Term<T>[]): Sum<T> => xs;
```
Creates a formal sum from individual terms.

#### `zero<T>(): Sum<T>`
```typescript
export const zero = <T>(): Sum<T> => [];
```
Creates the zero sum (empty array).

#### `scale<T>(k: number, s: Sum<T>): Sum<T>`
```typescript
export const scale = <T>(k: number, s: Sum<T>): Sum<T> =>
  k === 0 ? [] : s.map(({ coef, term }) => ({ coef: k * coef, term }));
```
Scales a formal sum by a coefficient.

#### `plus<T>(a: Sum<T>, b: Sum<T>): Sum<T>`
```typescript
export const plus = <T>(a: Sum<T>, b: Sum<T>): Sum<T> => a.concat(b);
```
Adds two formal sums by concatenation.

#### `normalizeByKey<T>(s: Sum<T>, key: (t: T) => string): Sum<T>`
```typescript
export function normalizeByKey<T>(s: Sum<T>, key: (t: T) => string): Sum<T>
```
Normalizes a formal sum by merging terms with the same key and removing zero coefficients.

#### `strictAsDG<T>(degree?: (t: T) => Degree): DgModule<T>`
```typescript
export function strictAsDG<T>(degree: (t: T) => Degree = () => 0): DgModule<T>
```
Creates a DG module with zero differential from a degree function.

#### `signByDeg<T>(deg: Degree, s: Sum<T>): Sum<T>`
```typescript
export function signByDeg<T>(deg: Degree, s: Sum<T>): Sum<T>
```
Computes `(-1)^{deg} * s` for a given degree and sum.

## DG Cooperad API

### Types and Interfaces

#### `Cooperad<T>`
```typescript
export interface Cooperad<T> {
  delta(t: T): Sum<[T, T]>;
  key(t: T): string;
  degree(t: T): Degree;
}
```
Interface for cooperad-like structures with comultiplication, key function, and degree.

#### `DgCooperad<T>`
```typescript
export interface DgCooperad<T> extends Cooperad<T>, DgModule<T> {}
```
Interface for differential graded cooperads.

### Functions

#### `coderivationFromLocal<T>(C: Cooperad<T>, dLocal: (t: T) => Sum<T>): (t: T) => Sum<T>`
```typescript
export function coderivationFromLocal<T>(
  C: Cooperad<T>,
  dLocal: (t: T) => Sum<T>
): (t: T) => Sum<T>
```
Builds a coderivation from a local generator rule, satisfying the co-Leibniz law.

#### `makeDgCooperad<T>(base: Cooperad<T>, dLocal: (t: T) => Sum<T>): DgCooperad<T>`
```typescript
export function makeDgCooperad<T>(
  base: Cooperad<T>,
  dLocal: (t: T) => Sum<T>
): DgCooperad<T>
```
Main wrapper function that creates a DG cooperad from a base cooperad and local differential.

## Deformation Complex API

### Types and Interfaces

#### `DgCooperadLike<C>`
```typescript
export interface DgCooperadLike<C> {
  delta(c: C): Sum<[C, C]>;
  degree(c: C): Degree;
  dC(c: C): Sum<C>; // differential on C
}
```
Interface for cooperad-like structures in the deformation complex.

#### `DgAlgebraLike<P>`
```typescript
export interface DgAlgebraLike<P> {
  // Multiplicative structure
  mul(x: P, y: P): P; // graded-associative product
  unit(): P;
  
  // Additive structure (k-linear)
  add(x: P, y: P): P;
  sub(x: P, y: P): P;
  scale(k: number, x: P): P;
  zero(): P;
  
  // Grading and differential
  degree(p: P): Degree;
  dP(p: P): Sum<P>;   // differential on P
  
  // Equality (for Maurer-Cartan checking)
  equals(x: P, y: P): boolean;
}
```
Interface for algebra-like structures in the deformation complex.

#### `Hom<C, P>`
```typescript
export interface Hom<C, P> {
  run(c: C): P;
  degree: Degree; // |f|
}
```
Interface for homomorphisms from cooperad to algebra.

### Functions

#### `convProduct<C, P>(C: DgCooperadLike<C>, P: DgAlgebraLike<P>, f: Hom<C, P>, g: Hom<C, P>): Hom<C, P>`
```typescript
export function convProduct<C, P>(
  C: DgCooperadLike<C>,
  P: DgAlgebraLike<P>,
  f: Hom<C, P>,
  g: Hom<C, P>
): Hom<C, P>
```
Computes the convolution product of two homomorphisms.

#### `dHom<C, P>(C: DgCooperadLike<C>, P: DgAlgebraLike<P>, f: Hom<C, P>): Hom<C, P>`
```typescript
export function dHom<C, P>(
  C: DgCooperadLike<C>,
  P: DgAlgebraLike<P>,
  f: Hom<C, P>
): Hom<C, P>
```
Computes the differential of a homomorphism.

#### `bracket<C, P>(C: DgCooperadLike<C>, P: DgAlgebraLike<P>, f: Hom<C, P>, g: Hom<C, P>): Hom<C, P>`
```typescript
export function bracket<C, P>(
  C: DgCooperadLike<C>,
  P: DgAlgebraLike<P>,
  f: Hom<C, P>,
  g: Hom<C, P>
): Hom<C, P>
```
Computes the Lie bracket of two homomorphisms.

#### `isMaurerCartan<C, P>(C: DgCooperadLike<C>, P: DgAlgebraLike<P>, alpha: Hom<C, P>, testTerms?: C[]): { isMC: boolean; details: string[] }`
```typescript
export function isMaurerCartan<C, P>(
  C: DgCooperadLike<C>,
  P: DgAlgebraLike<P>,
  alpha: Hom<C, P>,
  testTerms: C[] = []
): { isMC: boolean; details: string[] }
```
Checks if a homomorphism satisfies the Maurer-Cartan equation.

#### `deformationComplex<C, P>(C: DgCooperadLike<C>, P: DgAlgebraLike<P>)`
```typescript
export function deformationComplex<C, P>(
  C: DgCooperadLike<C>,
  P: DgAlgebraLike<P>
)
```
Creates a complete deformation complex with all operations.

### Utility Functions

#### `constantHom<C, P>(P: DgAlgebraLike<P>, value: P, degree?: Degree): Hom<C, P>`
```typescript
export function constantHom<C, P>(
  P: DgAlgebraLike<P>,
  value: P,
  degree: Degree = 0
): Hom<C, P>
```
Creates a constant homomorphism.

#### `zeroHom<C, P>(P: DgAlgebraLike<P>): Hom<C, P>`
```typescript
export function zeroHom<C, P>(P: DgAlgebraLike<P>): Hom<C, P>
```
Creates the zero homomorphism.

#### `addHom<C, P>(P: DgAlgebraLike<P>, f: Hom<C, P>, g: Hom<C, P>): Hom<C, P>`
```typescript
export function addHom<C, P>(
  P: DgAlgebraLike<P>,
  f: Hom<C, P>,
  g: Hom<C, P>
): Hom<C, P>
```
Adds two homomorphisms.

#### `scaleHom<C, P>(P: DgAlgebraLike<P>, k: number, f: Hom<C, P>): Hom<C, P>`
```typescript
export function scaleHom<C, P>(
  P: DgAlgebraLike<P>,
  k: number,
  f: Hom<C, P>
): Hom<C, P>
```
Scales a homomorphism by a coefficient.

## Mod-Boundary Law Checking API

### Types and Interfaces

#### `ModBoundaryContext<A>`
```typescript
export interface ModBoundaryContext<A> {
  dgModule: DgModule<A>;
  isExact?: (term: A) => boolean;
}
```
Context for mod-boundary law checking with DG module and optional exactness checker.

#### `LawAssertionResult<A>`
```typescript
export interface LawAssertionResult<A> {
  passed: boolean;
  strict: boolean; // true if exact equality, false if mod-boundary
  boundary?: Sum<A>; // the boundary term if mod-boundary
  details: string;
}
```
Result of a law assertion with details about whether it passed and how.

### Functions

#### `assertLawModBoundary<A>(lhs: A, rhs: A, context: ModBoundaryContext<A>, tolerance?: 'strict' | 'mod-boundary'): LawAssertionResult<A>`
```typescript
export function assertLawModBoundary<A>(
  lhs: A,
  rhs: A,
  context: ModBoundaryContext<A>,
  tolerance: 'strict' | 'mod-boundary' = 'mod-boundary'
): LawAssertionResult<A>
```
Asserts that two terms are equal, either strictly or modulo boundary.

#### `homotopyLawRunner<A>()`
```typescript
export function homotopyLawRunner<A>()
```
Creates a homotopy-aware law runner with multiple assertion methods.

### Law Runner Methods

#### `assertStrict(lhs: A, rhs: A, context: ModBoundaryContext<A>): LawAssertionResult<A>`
Asserts strict equality between two terms.

#### `assertModBoundary(lhs: A, rhs: A, context: ModBoundaryContext<A>): LawAssertionResult<A>`
Asserts equality modulo boundary.

#### `assert(lhs: A, rhs: A, context: ModBoundaryContext<A>): LawAssertionResult<A>`
Asserts with automatic tolerance selection (defaults to mod-boundary).

#### `assertBatch(laws: Array<{ name: string; lhs: A; rhs: A }>, context: ModBoundaryContext<A>): Array<{ name: string; result: LawAssertionResult<A> }>`
Asserts multiple laws in batch.

## Integration API

### Adapter Functions

#### `treeCooperadToDgLike<A>(): DgCooperadLike<Tree<A>>`
```typescript
export function treeCooperadToDgLike<A>(): DgCooperadLike<Tree<A>>
```
Creates an adapter for existing tree cooperads to the DG cooperad interface.

#### `gradedTreeCooperadToDgLike<A>(): DgCooperadLike<GradedTree<A>>`
```typescript
export function gradedTreeCooperadToDgLike<A>(): DgCooperadLike<GradedTree<A>>
```
Creates an adapter for graded tree cooperads to the DG cooperad interface.

### Algebra Implementations

#### `polynomialAlgebra(): DgAlgebraLike<string>`
```typescript
export function polynomialAlgebra(): DgAlgebraLike<string>
```
Creates a simple polynomial algebra over strings.

#### `endomorphismAlgebra<V>(): DgAlgebraLike<(v: V) => V>`
```typescript
export function endomorphismAlgebra<V>(): DgAlgebraLike<(v: V) => V>
```
Creates an endomorphism algebra for linear maps.

### Homomorphism Examples

#### `labelHomomorphism<A>(): Hom<Tree<A>, string>`
```typescript
export function labelHomomorphism<A>(): Hom<Tree<A>, string>
```
Creates a homomorphism that maps trees to their labels.

#### `arityHomomorphism<A>(): Hom<Tree<A>, string>`
```typescript
export function arityHomomorphism<A>(): Hom<Tree<A>, string>
```
Creates a homomorphism that maps trees to their arity.

#### `polynomialHomomorphism<A>(): Hom<Tree<A>, string>`
```typescript
export function polynomialHomomorphism<A>(): Hom<Tree<A>, string>
```
Creates a homomorphism that maps trees to polynomial expressions.

### Factory Functions

#### `createTreeDeformationComplex<A>()`
```typescript
export function createTreeDeformationComplex<A>()
```
Creates a deformation complex for tree cooperads.

#### `createGradedTreeDeformationComplex<A>()`
```typescript
export function createGradedTreeDeformationComplex<A>()
```
Creates a deformation complex for graded tree cooperads.

### Validation Functions

#### `testMaurerCartan<A>(testTrees?: Tree<A>[]): { results: Array<{ name: string; isMC: boolean; details: string[] }> }`
```typescript
export function testMaurerCartan<A>(
  testTrees: Tree<A>[] = []
): { results: Array<{ name: string; isMC: boolean; details: string[] }> }
```
Tests Maurer-Cartan equations on example homomorphisms.

#### `testChainMaps<A>(testTrees?: Tree<A>[]): { results: Array<{ name: string; isChainMap: boolean; details: string[] }> }`
```typescript
export function testChainMaps<A>(
  testTrees: Tree<A>[] = []
): { results: Array<{ name: string; isChainMap: boolean; details: string[] }> }
```
Tests chain map properties on example homomorphisms.

## Usage Examples

### Basic Usage
```typescript
import { makeDgCooperad } from './fp-dg-cooperad.js';
import { deformationComplex } from './fp-deformation-dgla-enhanced.js';

// Start with existing cooperad
const existingCooperad = { /* your existing implementation */ };

// Add homotopy power
const dLocal = (t: Tree<string>) => {
  if (t.kids.length === 0) {
    return [{ coef: 1, term: { ...t, label: `d(${t.label})` } }];
  }
  return [];
};

const dgCooperad = makeDgCooperad(existingCooperad, dLocal);

// Create deformation complex
const algebra = polynomialAlgebra();
const complex = deformationComplex(dgCooperad, algebra);

// Use for advanced features
const alpha = { degree: 1, run: (c: any) => c.label };
const mcResult = complex.isMaurerCartan(alpha, testTerms);
```

### Law Checking
```typescript
import { homotopyLawRunner } from './fp-homotopy-ergonomics.js';

const lawRunner = homotopyLawRunner<string>();
const context = {
  dgModule: {
    degree: (x: string) => x.length,
    d: (x: string) => [{ coef: 1, term: `d(${x})` }]
  },
  isExact: (term: string) => term.startsWith('d(')
};

const result = lawRunner.assertModBoundary('term', 'term + d(boundary)', context);
console.log(result.passed); // true
```

### Integration with Existing Code
```typescript
import { createTreeDeformationComplex } from './fp-deformation-integration.js';

// Create deformation complex for your existing tree cooperad
const complex = createTreeDeformationComplex<string>();

// Your existing code continues to work unchanged
const existingTree = t('f', [leaf('x')]);
const cuts = admissibleCuts(existingTree); // Still works!

// New homotopy features are available when needed
const homomorphism = labelHomomorphism<string>();
const convolution = complex.compose(homomorphism, arityHomomorphism<string>());
```
