# Profunktor: Foundations, Capabilities, and Implementation Status

This Uber-README orients new contributors quickly: what the system is, what you can build, the core type-system foundations, and current implementation status across modules.

---

## 1. Type-System Foundations (HKT, HOK, Typeclasses)
See `TYPE_SYSTEM_FOUNDATIONS.md` for full details. Highlights:
- HKT (Kind/Apply) enable first-class type constructors and generic algorithms.
- HOK generalizes to functions between kinds; unlocks polymorphic typeclasses across arities.
- FP typeclass suite (Functor/Applicative/Monad, Bifunctor/Profunctor) with laws.

---

## 2. Foundations and Capabilities
See `FOUNDATIONS_AND_CAPABILITIES.md` for details; highlights:
- Unified ADT Definition System: one-call ADT setup with automatic typeclass derivation, fluent API, registry metadata, optics hooks.
- Profunctor optics integrated with HKT + purity; streams with usage-aware composition.
- Capability areas: tangent categories, coalgebras/recursion schemes, compact-closed and span bicategories, TQFT, higher categories, developer tooling, and research workflows.

Quickstart:
```typescript
import { defineADT } from './fp-unified-adt-definition';
const Maybe = defineADT('Maybe', { Just: (a:any)=>({a}), Nothing: ()=>({}) });
```

Best practices:
- Use barrels (`data/either`, `optics/index`, `stream/index`) for imports.
- Keep purity and laws visible; rely on law suites.
- Prefer data-last in pipelines; fluent for ergonomics.

---

## 3. Implementation Complete Summary (Eq/Ord/Show)
The ADT Eq, Ord, and Show rollout is complete across core types. See `IMPLEMENTATION_COMPLETE_SUMMARY.md`.

- Core ADTs (Maybe, Either, Result, Array, Tuple, Tree) covered.
- Effect monads: Eq via reference where applicable; Ord/Show limited by semantics.
- Persistent collections: deep equality and ordering semantics.
- Registry integration and fluent/data-last interop verified by tests.

Example usage (fluent):
```typescript
const tree = Tree.constructors.Leaf(1);
const isEqual = tree.equals(Tree.constructors.Leaf(1));
const str = tree.show();
```

---

## 4. Where to Go Next
- Type system: `TYPE_SYSTEM_FOUNDATIONS.md`
- API and how-to: `FOUNDATIONS_AND_CAPABILITIES.md`
- Law coverage and instances: `IMPLEMENTATION_COMPLETE_SUMMARY.md`
- Optics, Streams, FRP: `OPTICS_FOUNDATIONS.md`, `PROFUNCTOR_OPTICS.md`, `STREAM_FUSION.md`, `stream-core.md`
- Fluent API: `UNIFIED_FLUENT_API.md`, `FLUENT_API_COMPLETE_SUMMARY.md`
- Typeclasses/HKT: `FP_TYPECLASSES_GUIDE.md`, `HKT_IMPLEMENTATION_SUMMARY.md`

---

## 5. Index
- Type foundations: `TYPE_SYSTEM_FOUNDATIONS.md`
- Foundations/capabilities: `FOUNDATIONS_AND_CAPABILITIES.md`
- Implementation status: `IMPLEMENTATION_COMPLETE_SUMMARY.md`
- Optics overview: `OPTICS_FOUNDATIONS.md` or `PROFUNCTOR_OPTICS.md`
- Streams overview: `STREAM_FUSION.md`, `stream-core.md`
- Fluent API: `UNIFIED_FLUENT_API.md`, `FLUENT_API_COMPLETE_SUMMARY.md`
- Typeclasses/HKT: `FP_TYPECLASSES_GUIDE.md`, `HKT_IMPLEMENTATION_SUMMARY.md`