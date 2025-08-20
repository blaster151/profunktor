# Homotopy System Overview

## Introduction

The homotopy system is a comprehensive extension of the functional programming library that adds differential graded (DG) algebra capabilities and deformation theory while preserving complete backward compatibility. This system enables advanced homotopy-theoretic computations while maintaining the ergonomic design of the existing codebase.

## Key Principles

### 1. Zero Breaking Changes
- **Existing code unchanged**: All current cooperad functionality continues to work without modification
- **Backward compatibility**: Complete preservation of existing APIs and behavior
- **Gradual adoption**: Homotopy features are optional and can be added incrementally

### 2. Optional Homotopy Power
- **Single function call**: Add DG structure with `makeDgCooperad(base, dLocal)`
- **Layered architecture**: DG features are built on top of existing infrastructure
- **Type safety**: Full TypeScript support with proper interfaces

### 3. Mathematical Correctness
- **Koszul signs**: Proper handling of graded algebra sign conventions
- **Co-Leibniz law**: Coderivations satisfy `Δ(d t) = (d ⊗ id + id ⊗ d)(Δ t)`
- **Deformation theory**: Complete implementation of van der Laan's control object

## Core Components

### 1. DG Core (`fp-dg-core.ts`)
Provides the foundational building blocks for differential graded algebra:

```typescript
// Degrees and Koszul signs
export type Degree = number;
export const parity = (n: Degree) => ((n % 2) + 2) % 2;
export const koszul = (m: Degree, n: Degree) => (parity(m) * parity(n)) % 2 === 0 ? +1 : -1;

// Formal sums with coefficient arithmetic
export interface Term<T> { coef: number; term: T; }
export type Sum<T> = readonly Term<T>[];

// DG module interface
export interface DgModule<T> {
  degree(t: T): Degree;
  d(t: T): Sum<T>; // linear differential
}
```

### 2. DG Cooperad (`fp-dg-cooperad.ts`)
Wraps existing cooperads with differential structure:

```typescript
export interface Cooperad<T> {
  delta(t: T): Sum<[T, T]>;
  key(t: T): string;
  degree(t: T): Degree;
}

export interface DgCooperad<T> extends Cooperad<T>, DgModule<T> {}

// Main wrapper function
export function makeDgCooperad<T>(
  base: Cooperad<T>,
  dLocal: (t: T) => Sum<T>
): DgCooperad<T>
```

### 3. Deformation Complex (`fp-deformation-dgla.ts`)
Implements the convolution dg-Lie algebra for deformation theory:

```typescript
// Convolution product on Hom(C,P)
export function convProduct<C, P>(
  C: DgCooperadLike<C>,
  P: DgAlgebraLike<P>,
  f: Hom<C, P>,
  g: Hom<C, P>
): Hom<C, P>

// Differential on homomorphisms
export function dHom<C, P>(
  C: DgCooperadLike<C>,
  P: DgAlgebraLike<P>,
  f: Hom<C, P>
): Hom<C, P>

// Maurer-Cartan equation checker
export function isMaurerCartan<C, P>(
  C: DgCooperadLike<C>,
  P: DgAlgebraLike<P>,
  alpha: Hom<C, P>
): boolean
```

### 4. Mod-Boundary Law Checking (`fp-homotopy-ergonomics.ts`)
Provides homotopy-aware law validation:

```typescript
export interface ModBoundaryContext<A> {
  dgModule: DgModule<A>;
  isExact?: (term: A) => boolean;
}

export function assertLawModBoundary<A>(
  lhs: A,
  rhs: A,
  context: ModBoundaryContext<A>,
  tolerance: 'strict' | 'mod-boundary' = 'mod-boundary'
): LawAssertionResult<A>
```

## Usage Patterns

### 1. Keep Existing Code Unchanged
```typescript
// Your existing cooperad continues to work
const existingCooperad = {
  delta: (t: Tree<string>) => admissibleCuts(t),
  // ... existing methods
};
```

### 2. Add Homotopy Power When Needed
```typescript
// Define local differential rules
const dLocal = (t: Tree<string>) => {
  if (t.kids.length === 0) {
    return [{ coef: 1, term: { ...t, label: `d(${t.label})` } }];
  }
  return [];
};

// Wrap with single function call
const dgCooperad = makeDgCooperad(existingCooperad, dLocal);
```

### 3. Use Deformation Complex
```typescript
const complex = deformationComplex(dgCooperad, algebra);
const mcResult = complex.isMaurerCartan(alpha, testTerms);
```

### 4. Employ Mod-Boundary Law Checking
```typescript
const lawRunner = homotopyLawRunner();
const result = lawRunner.assertModBoundary(lhs, rhs, dgContext);
```

## Mathematical Foundation

### Convolution Product
The convolution product on `Hom(C,P)` is defined as:
```
(f ⋆ g)(c) = Σ f(c1) ⋆ g(c2)
```
where the sum is over all admissible cuts of `c` and proper Koszul signs are applied.

### Differential on Homomorphisms
The differential on `Hom(C,P)` is:
```
d(f) = dP ∘ f - (-1)^{|f|} f ∘ dC
```

### Lie Bracket
The Lie bracket is:
```
[f,g] = f ⋆ g - (-1)^{|f||g|} g ⋆ f
```

### Maurer-Cartan Equation
A homomorphism `α` satisfies the Maurer-Cartan equation if:
```
d(α) + 1/2 [α, α] = 0
```

### Co-Leibniz Law
A coderivation `d` satisfies the co-Leibniz law:
```
Δ(d t) = (d ⊗ id + id ⊗ d)(Δ t)
```

## Benefits

1. **Zero Breaking Changes**: Existing code continues to work unchanged
2. **Optional Power**: Add homotopy features only when needed
3. **Mathematical Soundness**: All operations respect proper mathematical conventions
4. **Type Safety**: Full TypeScript support with proper interfaces
5. **Extensibility**: Easy to add new algebra and homomorphism types
6. **Performance**: Minimal overhead when not using homotopy features
7. **Integration**: Seamless integration with existing cooperad infrastructure

## Advanced Features

- **Deformation Theory**: Complete implementation of van der Laan's control object
- **Homotopy Law Checking**: Support for "equality up to boundary" assertions
- **Chain Map Validation**: Verification of homotopy-theoretic properties
- **Koszul Sign Handling**: Proper sign conventions for graded operations
- **Formal Sum Support**: Linear combinations with coefficient arithmetic

## File Structure

```
fp-dg-core.ts                    # Minimal DG foundation
fp-dg-cooperad.ts               # DG cooperad wrapper
fp-deformation-dgla.ts          # Basic deformation complex
fp-deformation-dgla-enhanced.ts # Enhanced version with additive structure
fp-deformation-integration.ts   # Integration layer
fp-deformation.examples.ts      # Comprehensive examples
fp-homotopy-ergonomics.ts       # Ergonomic design demonstration
fp-homotopy-ergonomics.examples.ts # Complete workflow examples
```

## Conclusion

The homotopy system provides a powerful extension to the functional programming library that enables advanced homotopy-theoretic computations while maintaining complete backward compatibility. The system is designed to be invisible when not needed and powerful when required, following the principle of gradual adoption and mathematical correctness.
