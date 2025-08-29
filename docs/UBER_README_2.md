# Uber README (Fluent API Suite)

This document unifies the fluent API story across the project: what’s implemented, how to use it ergonomically, and how it integrates with the broader FP/HKT ecosystem.

---

## 1) Complete Fluent API (Scope and Status)
- Fluent wrappers for all core ADTs expose `.map`, `.chain/.flatMap`, `.filter`, `.ap`, plus bifunctor methods where relevant (`.bimap`, `.mapLeft`, `.mapRight`).
- Type inference preserved across TS 4.x/5.x, with discriminated unions supported.
- Dual API support: data-last functions remain; fluent mirrors them 1:1.
- Auto-derivation: new ADTs can opt into the fluent surface via helpers; boilerplate-free.
- Tests and docs ensure consistency and law alignment with underlying typeclass ops.

Example:
```typescript
const out = Just(42)
  .map(x => x * 2)
  .chain(x => Just(x + 10))
  .filter(x => x > 50);
```

---

## 2) Fluent Methods: Design and Control
- Opt-in decoration model (`withFluentMethods`, `withMaybeFluentMethods`, etc.) for selective enablement.
- Global toggles exist but are optional; prefer explicit decoration per domain/module.
- Uses the centralized registry for typeclass lookup; purity tags preserved.

Options example:
```typescript
enableGlobalFluentMethods({ enableMap: true, enableChain: true, preservePurity: true });
```

ADT-specific decorators:
- Maybe/Either/Result: chainable ADT ops, bifunctor operations, folds, conversions
- ObservableLite: chaining plus stream ops (when applicable)

---

## 3) API Reference (Concise)
- Functor: `.map`
- Monad: `.chain`, `.flatMap`
- Bifunctor: `.bimap`, `.mapLeft`, `.mapRight`
- Applicative: `.ap`, `.of`
- ADT helpers: `.fold`, `.getOrElse`, `.orElse`
- Query ops: `.filter`, `.filterMap`

Type inference holds throughout; operations are immutable and purity-aware.

---

## 4) Interoperability and Migration
- Fluent and data-last interoperate seamlessly; mix as needed.
- Migration examples provided for replacing nested helper calls with readable chaining.
- Registry integration ensures fluent mirrors the canonical instances.

---

## 5) Best Practices and Performance
- Prefer explicit opt-in per ADT family; avoid global enable unless needed.
- Keep chains shallow and intention-revealing; use folds for ADT exits.
- For collections/streams, leverage batch/transient modes and avoid unnecessary conversions.
- Fluent wrappers are lightweight; stream evaluation remains lazy as designed.

---

## 6) Unified Fluent API (Conversions and Unification)
- Single fluent surface across ADTs, streams, and persistent collections.
- Lossless, type-safe conversions: ADT ↔ Streams ↔ Persistent collections, preserving purity metadata.
- Shared core ops across types; domain-specific ops added where relevant (stream/collection functions).

Shared core:
```typescript
.map(f)
.chain(f)
.filter(pred)
.pipe(...fns)
```

Conversions:
```typescript
const obs = list.toObservableLite();
const stream = obs.toStatefulStream({ count: 0 });
const maybe = stream.toPersistentList().toMaybe();
```

Guidelines:
- Prefer direct operations; convert only when switching computation model.
- Use structural sharing and transient modes for performance in persistent collections.

---

## 7) Status Summary
- Coverage: Maybe, Either, Result, PersistentList/Map/Set, Tree; ObservableLite/StatefulStream fluent where applicable.
- Auto-derivation helpers and decorators in place; registry-backed.
- Tests: chaining, inference, parity with data-last, conversions.

---

## 8) Pointers
- For detailed operator catalogs and conversions, see `UNIFIED_FLUENT_API.md` (content is summarized here).
- For a full “what changed and what’s verified” view, see `IMPLEMENTATION_COMPLETE_SUMMARY.md` (status mirrored here).

This completes a cohesive, ergonomic fluent experience across the FP ecosystem while preserving lawfulness, purity, and zero-overhead typeclass implementations.