# Bicategory scaffold

This directory introduces first-class bicategory abstractions without touching existing files.

Contents:

- `core.ts`: witness-oriented interfaces for `Bicategory` and `MonoidalBicategory` that work with the project’s HKT encoding.
- `profunctor-bicategory.ts`: a minimal bicategory instance builder for profunctor-like 1-cells with natural-transformation-style 2-cells, plus an optional monoidal layer.

Usage sketch:

```ts
import { makeProfunctorBicategory, withMonoidal } from './bicategory/profunctor-bicategory';

// Suppose you have a proarrow/profunctor P with id/compose
const B = makeProfunctorBicategory<P>({ id, compose });

// Optionally provide a tensor on 1-cells
const MB = withMonoidal(B, { tensor1 });
```

These are witness-level constructs intended for law checks, refactor safety, and future category-theory extensions (e.g., double categories).


