# Bazaar System Overview

A concise summary of recent Bazaar-related additions across effects, streaming, planning, selective/commutative support, monoidal witnesses, ArrowChoice fixes, and tests.

## Bazaar Effects

- New runners and applicatives
  - ComposeApplicative(F, G), ProductApplicative(F, G)
  - ConstApplicative(Monoid), ValidationApplicative(Semigroup)
  - PromiseParallelApplicative, PromiseSequentialApplicative
- Execution helpers
  - runBazaarWith(F, baz, s, k)
  - runBazaarProduct(F, G, baz, s, k), runBazaarCompose(F, G, baz, s, k)
- Derived folds
  - collectWithMonoid(Monoid, baz, s, measure)
  - validateBazaar(Semigroup, baz, s, validate)

## Bazaar ↔ Streaming

- Bridge APIs (effect‑polymorphic StreamK, Pull)
  - bazaarToStream, bazaarToStreamPerFocus
  - parBazaarToStream(..., { concurrency, preserveOrder })
  - chunkedBazaarToStream (batching), interruptibleBazaarToStream (CancelToken)
  - resourceBazaarToStream (Resource/Bracket)
- Focus helpers
  - enumerateBazaarFoci(baz, s): A[]
  - fociToStream(runEffect, F, baz, s): StreamK<F, A>

## Planner & Scheduler

- Plan IR
  - Seq, Map, Filter, FilterA, Traverse, ParTraverse, ParTraverseIf
  - SelectTraverse, SelectTraverseBool, ResourceTraverse, Batch, Observe, Barrier
- Optimizer
  - Map fusion; optional chunking after traversals (Batch)
  - Traverse→ParTraverse by cost threshold
  - FilterA + Traverse/ParTraverse → ParTraverseIf (predicate + handler fused)
  - Commutative‑aware pushdown of trailing Map into Traverse/ParTraverse
- Scheduling
  - latencyEMA(alpha?)
  - scheduleOptic(baz, source, handlerAsync, opts)
  - tunePlanWithLatency(plan, ema, opts)
  - runScheduled(runEffect, F, asyncF, bracket, baz, source, handlerAsync, opts)

## Selective & Commutative

- Selective<F>
  - Instances: IdSelective, OptionSelective
  - Helpers: whenS, ifS, branchS
  - Law harness: checkSelectiveLaws
- CommutativeApplicative<F>
  - Witness for safe reordering; groundwork for stronger optimizer rules
- Selective‑aware compile hook
  - compilePlanToStreamSelective(..., { selectRunner? })
  - SelectRunner<F> integration point for true in‑effect short‑circuiting

## Monoidal Layer

- MonoidalProduct (×, 1) and MonoidalSum (injL/injR/match) witnesses
- Lax monoidal from Applicative: laxFromApplicative(F)
- MonoidalLaws: symmetry (swap∘swap=id) and assoc round‑trip checks
- Bridge helpers: parStar, fanout; registry registration hook

## ArrowChoice over CoKleisli<Cofree>

- Fixed selectLeft for Cofree to map tails via provided Functor<F>
- Uses unified Either helpers (Left, Right, matchEither)
- Avoids this‑binding and ad‑hoc peeking

## Tests

- ParTraverseIf: end‑to‑end execution test (collect to array)
- Filter rewrite: FilterA + Traverse ≃ optimized plan under Id baseline
- Selective: Id/Option identity sanity via checkSelectiveLaws

## Pointers

- Effects: fp-bazaar-effects.ts
- Streaming: fp-bazaar-stream.ts
- Planner: fp-bazaar-planner.ts, fp-optics-scheduler.ts
- Selective: fp-selective.ts
- Monoidal: fp-monoidal.ts, fp-monoidal-bridge.ts
- ArrowChoice fix: fp-cokleisli-arrow-choice.ts
- Laws/tests: fp-laws-arrows.ts