## Introduction

Profunktor is an opinionated TypeScript toolkit for writing compositional, law‑respecting software with the vocabulary of modern functional programming and category theory. If you’ve ever wanted the ergonomics of a fluent API, the guarantees of law‑checked typeclasses, and the reach of research‑grade abstractions (optics, recursion schemes, profunctors, monoidal/bicategorical structure, homotopy‑inspired bridges) in one coherent system, this project is that attempt—built for practical use today, not as a thought experiment.

The core bet is simple: when you treat data types as algebraic objects (ADTs), effects as first‑class metadata (purity tags), and composition as the default mode of building programs, the incidental complexity of everyday code drops sharply while the headroom for advanced modeling rises. Everything else in this repo is in service of that bet: a unified ADT definition system; a registry that knows about typeclasses, purity, and usage; higher‑kinded types (HKT) and higher‑order kinds (HOK) that let algorithms stay generic; a profunctor‑based optics core; a stream layer that interops losslessly with ADTs and persistent collections; and a fluent API that never abandons the underlying laws.

### What this is, in one sentence
A compositional programming substrate where algebraic data types, typeclasses, optics, streams, and persistence share one consistent, law‑driven surface—so you can move ideas between theory and production code without rewriting them.

### Why it exists
- To bridge research and production: the same constructs used to reason about programs are the ones you ship.
- To reduce glue code: one call defines an ADT and wires derivations, fluent methods, optics hooks, and registry metadata.
- To keep codebases coherent: a single import surface, a single set of laws, and a single set of stories for composition.

### Where it innovates (in practice, not just on paper)
- Unified ADT definition: one entrypoint yields constructors, typeclass instances (derived), fluent methods, registry entries, and optic hooks—no scattered boilerplate.
- Law‑aware registry: a central registry carries typeclass witnesses, purity tags (Pure/Async/IO/State), and even usage bounds for stream/optic integration. Composition consults this metadata.
- HKT + HOK under one roof: HKTs for everyday generic programming; HOKs to treat type constructors as inputs/outputs of type‑level functions, enabling cross‑arity polymorphism and better reuse.
- Profunctor optics as a first‑class citizen: Lens/Prism/Traversal are built on principled profunctor machinery and integrate with purity and streams.
- Unified fluent API across domains: Maybe/Either/Result, ObservableLite/StatefulStream, and PersistentList/Map/Set share one fluent surface with lossless, type‑safe conversions.
- Research‑grade modules in the open: bicategories, compact‑closed structure, polynomial functors, tangent categories, and homotopy bridges are present as real code, not isolated notes.

### What it enables
- Faster exploration: define a data type and immediately get lawful operations, optics, conversions, fluent ergonomics, and testable laws.
- Vertical composability: move fluidly between persistent collections, streams, and ADTs without information loss or API cliff‑edges.
- Safer refactors: a common law suite and a single registry make it obvious when a change violates intended algebraic behavior.
- Design by laws: adopt the minimal algebra necessary (Functor → Applicative → Monad; Bifunctor/Profunctor where appropriate) and let the system enforce the rest.

### What it can become
- A programmable algebraic substrate for applications: richer effect systems, verified derivations, and deeper IDE support that understands laws and purity.
- A plugin ecosystem: derivation plugins, optic dialects, stream schedulers, and topic‑specific kits (e.g., graph optics, probabilistic effects) registered into the same uniform surface.
- A verified workbench: property‑based and law‑based testing wired from the registry, with coverage metrics tied to algebraic guarantees rather than only code branches.

### A mental model
Think “literate algebra” in TypeScript: you write with values and morphisms (data and functions), decorate them with minimal laws, and the system arranges fluent ergonomics and interoperable runtimes (optics, streams, persistence) around those guarantees. Composition is the primitive. Glue is the exception.

### A quick storyline
1) Define an ADT in one call. You immediately get Functor/Applicative/Monad (if requested), Eq/Ord/Show (where meaningful), fluent instance methods, registry metadata, and optic lenses/prisms when it makes sense.
2) Use it in pipelines with other structures: persistent collections fold into streams, streams convert back to ADTs, and purity tags annotate the journey. Nothing is “special”; everything composes.
3) Check the laws. Suites run via common helpers; failures point to either a buggy instance or a misapplied algebra.
4) Scale up: swap traversals for optics, or stream combinators for batch transforms. The story does not change.

### Principles guiding the code
- Compositionality first: everything should compose—both at the value level and the type level.
- Purity is data: treat effect information as metadata that informs composition and testing.
- Laws over conventions: correctness flows from algebraic laws, not only from style guides.
- Ergonomics without compromise: fluent methods are fine—so long as they’re lawful, typed, and interchangeable with data‑last functions.
- Escape hatches exist: when you must drop to concrete code, do it knowingly and keep the algebra at the boundaries.

### How to approach the repo
- If you’re new to the type system: start with the type‑system foundations (HKT/HOK) to understand how generic algorithms stay reusable.
- If you’re here for the API: read the unified fluent API overview, then the ADT/optics/stream sections, then the law/registry pieces.
- If you’re experimenting: define an ADT, derive instances, and wire an optic; convert it through the stream layer and back; run the law suites.

### Who this is for
- FP engineers who want a principled but productive stack.
- Researchers who want clean, executable artifacts for categorical structures.
- Builders who want the readability of fluent APIs but refuse to give up algebraic guarantees.

The rest of this document is a map—first the type‑system foundations that make the generic story real, then the capabilities and ergonomics you use day‑to‑day, and finally status and pointers for where to deepen your exploration.

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

## 2.1 Fluent ADT System (Doc 8)
- Automatic derivation for core typeclasses (Functor, Applicative, Monad; plus Eq/Ord/Show where applicable).
- Prototype augmentation adds fluent methods consistently across ADTs and collections.
- Global auto-registration hooks bind instances to the central registry.

Snippet:
```typescript
const result = Just(42)
  .map(x => x * 2)
  .chain(x => Just(x.toString()));
```

Key modules: `fp-fluent-adt.ts` (fluent), `fp-derivation-helpers.ts` (derive*), `fp-auto-registration.ts`.

---

## 2.2 Unified Fluent API (Doc 9)
- Single, unified fluent surface for Maybe/Either/Result, ObservableLite/StatefulStream, and PersistentList/Map/Set.
- Lossless, type-safe conversions across domains (ADT ↔ Streams ↔ Persistent collections), preserving purity metadata.
- Stream/collection-specific operators coexist with shared core operations.

Shared ops:
```typescript
.map(f)
.chain(f)
.filter(pred)
.pipe(...fns)
```

Conversions (examples):
```typescript
const obs = list.toObservableLite();
const stream = obs.toStatefulStream({ count: 0 });
const maybe = stream.toPersistentList().toMaybe();
```

Guidelines:
- Prefer direct ops; convert only when switching models.
- Use transient/batch modes for performance in persistent collections.

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