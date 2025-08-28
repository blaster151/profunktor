# Profunktor: Foundations, Capabilities, and Implementation Status

This Uber-README orients new contributors quickly: what the system is, what you can build, and the current implementation status across core modules.

---

## 1. Foundations and Capabilities (Concise)

See `FOUNDATIONS_AND_CAPABILITIES.md` for details; highlights:
- Unified ADT Definition System: one-call ADT setup with automatic typeclass derivation, fluent API, registry metadata, and optics hooks.
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

## 2. Implementation Complete Summary (Eq/Ord/Show)

The ADT Eq, Ord, and Show rollout is complete across core types. Summary table (see `IMPLEMENTATION_COMPLETE_SUMMARY.md` for full details):

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

## 3. Where to Go Next

- API and how-to: `FOUNDATIONS_AND_CAPABILITIES.md`
- Law coverage and instances: `IMPLEMENTATION_COMPLETE_SUMMARY.md`
- Optics, Streams, FRP details: docs under `optics*`, `STREAM_*`, and related.
- Contribution and governance: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`.

---

## 4. Index

- Foundations: `FOUNDATIONS_AND_CAPABILITIES.md`
- Implementation status: `IMPLEMENTATION_COMPLETE_SUMMARY.md`
- Optics overview: `OPTICS_FOUNDATIONS.md` or `PROFUNCTOR_OPTICS.md`
- Streams overview: `STREAM_FUSION.md`, `stream-core.md`
- Fluent API: `UNIFIED_FLUENT_API.md`, `FLUENT_API_COMPLETE_SUMMARY.md`
- Typeclasses/HKT: `FP_TYPECLASSES_GUIDE.md`, `HKT_IMPLEMENTATION_SUMMARY.md`