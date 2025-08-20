# Bicategory and Monoidal Bicategory for Profunctors (Sum Tensor)

This document describes the new first-class bicategory scaffolding and a monoidal enhancement for profunctors using a sum-based tensor, along with witness-level coherence law checks.

## Overview

- Bicategory core (witness-only): `bicategory/core.ts`
- Profunctor bicategory builder: `bicategory/profunctor-bicategory.ts`
- Monoidal enhancement: `withMonoidal(...)` in `bicategory/profunctor-bicategory.ts`
- Profunctor with sum tensor (Choice): `bicategory/instances/profunctor-choice.ts`
- Function instance and product tensor: `bicategory/instances/function.ts`
- Coherence laws (bicategory): `bicategory/laws.ts`
- Coherence laws (monoidal): `bicategory/monoidal-laws.ts`

The design follows the project’s HKT encoding and keeps runtime light by representing coherence as witnesses (2-cells) rather than computing full coends or rewriting terms.

## Bicategory core

- 1-cells: `Apply<Hom, [A, B]>`
- 2-cells: `Apply<Cell, [f, g]>` where `f` and `g` are parallel 1-cells
- Interfaces: `Bicategory<Hom, Cell>` and `MonoidalBicategory<Hom, Cell>`

Key operations:
- `id1`, `compose1`: identities and composition for 1-cells
- `id2`, `vert`, `horiz`: identities and composition for 2-cells (vertical and horizontal)
- `associator`, `leftUnitor`, `rightUnitor`: coherence witnesses (as 2-cells)
- Monoidal: `tensor1` (and derived `tensor2`)

See `bicategory/core.ts`.

## Profunctor bicategory

For a given `P extends Kind2` with `id` and `compose`, build a bicategory:

```ts
import { makeProfunctorBicategory } from '../bicategory/profunctor-bicategory';

const B = makeProfunctorBicategory<P>({ id, compose });
```

2-cells are modeled as endomaps on `P` (natural-transformation-like) with defaults:
- `id2(f) = p => p`
- `vert(beta, alpha) = p => beta(alpha(p))`
- `horiz(beta, alpha) = p => beta(alpha(p))`

See `bicategory/profunctor-bicategory.ts`.

## Sum tensor for profunctors (Choice)

We provide a monoidal bicategory instance when your profunctor supports `Choice`:

- Required:
  - `left<A,B,C>(pab: P<A,B>): P<Either<A,C>, Either<B,C>>`
  - `right<A,B,C>(pab: P<A,B>): P<Either<C,A>, Either<C,B>>`

- Tensor on 1-cells (sum):

```ts
// tensor1(f, g) = right(g) ∘ left(f)
// Type: P<A1,B1> × P<A2,B2> -> P<Either<A1, A2>, Either<B1, B2>>
```

Use the ready-made builder:

```ts
import { fromProfunctorChoiceWithSumTensor } from '../bicategory/instances/profunctor-choice';

const MB = fromProfunctorChoiceWithSumTensor<P>({ id, compose, choice: { left, right } });
```

See `bicategory/instances/profunctor-choice.ts`.

## Function example (as a trivial Choice profunctor)

We show the construction with `FunctionK` where `left`/`right` lift over a TypeScript `Either` tagged-union representation:

```ts
import { FunctionK } from '../../fp-hkt';
import { fromProfunctorChoiceWithSumTensor, Either } from '../instances/profunctor-choice';

type P = FunctionK; // A -> B
const id = <A>() => (a: A) => a;
const compose = <A,B,C>(g: (b:B)=>C, f: (a:A)=>B) => (a:A) => g(f(a));

const choice = {
  left:  <A,B,C>(p: (a:A)=>B) => (e: Either<A,C>) => ('left' in e ? { left: p(e.left) } : e),
  right: <A,B,C>(p: (a:A)=>B) => (e: Either<C,A>) => ('right' in e ? { right: p(e.right) } : e),
};

export const SumMonoidalFunctionKBicat = fromProfunctorChoiceWithSumTensor<P>({ id, compose, choice });
```

See `bicategory/examples/profunctor-sum-monoidal.ts` for a runnable sketch.

## Coherence laws (witness-level)

- Bicategory coherence: pentagon, triangle
  - `runBicategoryCoherenceLaws(B, { evalP, eqC, eqE, samplesA, f, g, h, k })`
  - Assembles associators/unitors via `B` and compares path-equal morphisms extensionally
  - See `bicategory/laws.ts`

- Monoidal coherence: monoidal pentagon, monoidal triangle
  - `runMonoidalPentagon(M, { evalP, eq, samples, assoc })`
  - `runMonoidalTriangle(M, { evalP, eq, samples, unit, assoc_ab_I })`
  - You provide reindexing morphisms (associators/units) as 1-cells for your `P`
  - See `bicategory/monoidal-laws.ts`

Notes:
- All checks are witness-only and extensional: you supply generators and an evaluator for your `P`.
- For realistic profunctors, associator/unit witnesses are often derived from the underlying sum/product isomorphisms.

## Best practices

- Keep 2-cells law-centric: use them to state and test coherence, not to compute data.
- Start with simple instances (functions) to validate your witnesses and test harnesses.
- When plugging a complex `P`, ensure `left`/`right` satisfy Choice laws; tensor coherence will piggyback on those.

## File map

- Bicategory core: `bicategory/core.ts`
- Profunctor bicategory + monoidal: `bicategory/profunctor-bicategory.ts`
- Instances:
  - Functions: `bicategory/instances/function.ts`
  - Profunctor (Choice, sum tensor): `bicategory/instances/profunctor-choice.ts`
  - Generic profunctor hook: `bicategory/instances/profunctor.ts`
- Laws:
  - Bicategory: `bicategory/laws.ts`
  - Monoidal: `bicategory/monoidal-laws.ts`
- Example:
  - `bicategory/examples/profunctor-sum-monoidal.ts`
