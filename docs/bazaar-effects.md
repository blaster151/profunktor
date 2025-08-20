# Bazaar Effect Systems

A small, witness-only layer to interpret Bazaar optics against a variety of Applicatives without deep recursion.

## Key APIs

From `fp-bazaar-effects.ts`:

- Compose/Product/Const/Validation Applicatives
  - `ComposeApplicative(F, G)`
  - `ProductApplicative(F, G)`
  - `ConstApplicative(Monoid)`
  - `ValidationApplicative(Semigroup)`
- Promise strategies
  - `PromiseParallelApplicative`
  - `PromiseSequentialApplicative`
- Runners
  - `runBazaarWith(F, baz, s, k)`
  - `runBazaarPromiseParallel(baz, s, k)`
  - `runBazaarPromiseSequential(baz, s, k)`
  - `runBazaarProduct(F, G, baz, s, k)`
  - `runBazaarCompose(F, G, baz, s, k)`
- Derived folds
  - `collectWithMonoid(Monoid, baz, s, measure)`
  - `validateBazaar(Semigroup, baz, s, validate)`

## Usage (sketch)

```ts
const Sum = { empty: 0, concat: (x: number, y: number) => x + y };
const total = collectWithMonoid(Sum, baz, input, n => n);

const ESemi = { concat: (x: string[], y: string[]) => x.concat(y) };
const res = validateBazaar(ESemi, baz, input, n => n % 2 ? Success(n) : Failure([`bad:${n}`]));
```

Notes:
- Prefer `ValidationApplicative` to accumulate errors.
- Prefer `ConstApplicative` to collect metrics/keys while traversing.


