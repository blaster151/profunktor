### Refactoring Log: TypeScript Repair Track

This log tracks temporary exclusions and stubs added to keep the core build green while we incrementally reintroduce complex modules.

### Current tsconfig state
- include (core + reintroduced safe modules; all green):
  - Core: `index.ts`, `fp-hkt.ts`, `fp-typeclasses-hkt.ts`, `fp-derivation-helpers.ts`, `fp-adt-builders.ts`
  - Unified ADTs: `fp-maybe-unified.ts`, `fp-either-unified.ts`, `fp-result-unified.ts`
  - Purity/stream core: `fp-bimonad-extended.ts`, `fp-purity.ts`, `fp-stream-fusion.ts`
  - Observable/fluent/bridge (lightweight): `fp-observable-lite.ts`, `fp-fluent-api.ts`, `fp-frp-bridge.ts`, `fp-stream-ops.ts`
  - Usage: `fp-usage-integration.ts`, `fluent-usage-wrapper.ts`
  - Stream/FP helpers added this pass: `fp-commutative-applicative.ts`, `fp-closure.ts`, `fp-yoneda.ts`, `fp-semiring.ts`, `fp-nat.ts`, `fp-partial.ts`, `fp-array-extensions.ts`, `fp-selective.ts`, `fp-free.ts`, `fp-mealy.ts`, `fp-align.ts`, `fp-cofree-lazy.ts`, `fp-free-applicative.ts`, `fp-either-classes.ts`, `fp-trampoline.ts`, `fp-either-ops-table.ts`, `fp-cofree-lazy-iter.ts`, `fp-cofree-lazy-para.ts`, `fp-free-cofree-pairing.ts`, `fp-cofree-lazy-bfs-build.ts`, `fp-cofree-comonad.ts`, `fp-cofree-async.ts`, `fp-cochoice.ts`, `fp-match-product.ts`, `fp-recursion-schemes-extra.ts`, `fp-algebras-forgetful.ts`, `fp-cokleisli.ts`, `fp-cokleisli-cofree.ts`, `fp-monoids.ts`, `fp-cokleisli-arrow-choice.ts`, `fp-cofree-choice-uniform.ts`, `fp-fromarray.ts`, `fp-option.ts`
  - Streams: `fp-stream-state.ts`
  - Optics (enabled so far): `fp-optics-core.ts` (shim), `fp-optics-traversal.ts`, `fp-optics-instances.ts`, `fp-adt-optics.ts`, `fp-optics-indexed.ts`, `fp-optics-iso-helpers.ts`, `fp-optics-everywhere.ts`, `fp-optics-affine.ts`, `fp-observable-optics.ts`, `fp-profunctor-optics.ts`
  - `src/**/*.ts`
- exclude:
  - `dist`, `node_modules`
- `fp-optics.ts` (enabled as minimal barrel re-export of `fp-optics-adapter.ts`)
  - Many additional heavy/demo modules excluded via globs (see tsconfig)
- Re-enabled: `fp-observable-lite.ts`, `fp-stream-state.ts`, `fp-optics-core.ts`, `fp-optics-traversal.ts`, `fp-optics-instances.ts`

### Temporarily stubbed modules
- `fp-stream-ops.ts`: ObservableLite mixins only (no `fp-stream-state` import)
- `fp-frp-bridge.ts`: returns `StatefulStream` via `createStatefulStream`
- `fp-fluent-api.ts`: minimal prototype mixin helper

### Modules intentionally excluded (to be reintroduced later)
- `fp-optics.ts`
- Many additional heavy/demo modules excluded via globs.

### Lightweight substitutions / adaptations made in this pass
- Unified ADTs integration across optics (`Just`/`Nothing`, `matchMaybe`/`matchEither`).
- `fp-optics-core.ts`: minimal shim enabled (Lens/Optional/Prism + guards + purity markers)
- `fp-optics-traversal.ts`: adapted to unified ADTs and enabled
- `fp-optics-instances.ts`: adapted sum/product derivation to unified ADTs and enabled

### Unstub checklist (in order)
- [ ] Port real `fp-stream-ops.ts` and delete the stub
- [ ] Port real `fp-frp-bridge.ts` and delete the stub
- [ ] Port real `fp-fluent-api.ts` and delete the stub
- [ ] Fix `fp-observable-lite.ts` ADT constructors/matchers per unified ADTs
- [x] Re-enable `fp-stream-state.ts` in `tsconfig.json`
- [x] Introduce and enable minimal `fp-optics-core.ts` shim
- [x] Reintroduce `fp-optics-traversal.ts` and `fp-optics-instances.ts`, resolving typing with unified ADTs
- [ ] Reintroduce `fp-optics.ts`, resolving duplicate exports and typing
- [ ] Revisit `fp-purity.ts` to replace the local `ObservableLite` alias with the real class/type if safe
- [x] Revisit `fp-purity.ts` to replace the local `ObservableLite` alias with the real class/type if safe

### Progressively reintroducing modules (small, safe steps)
- [x] Replace stubs with minimal real implementations (stream ops, frp bridge, fluent api)
- [x] Re-enable `fp-stream-state.ts` with lightweight local optics and fix conversions
- [x] Normalize ADT usage in `fp-observable-lite.ts` for `Nothing()`
- [x] Introduce minimal `fp-optics-core.ts` shim and enable it
- [x] Enable `fp-optics-traversal.ts` and `fp-optics-instances.ts`
- [x] Enable `fp-adt-optics.ts`
- [x] Enable `fp-optics-indexed.ts`
- [x] Enable `fp-optics-iso-helpers.ts`
- [x] Enable `fp-optics-everywhere.ts`
- [x] Enable `fp-optics-affine.ts`
- [x] Enable `fp-observable-optics.ts`
- [x] Enable `fp-profunctor-optics.ts`
- [x] Add `fp-optics-adapter.ts` (safe shim aligned with `fp-optics-core`/`fp-optics-traversal`)
- [x] Redirect light optics consumers to adapter: `fp-adt-optics-simple.ts`, `fp-adt-optics.ts`, `fp-optics-auto-derivation.ts`
- [x] Enable `fp-optics.ts` as minimal barrel re-export of adapter
- [ ] Expand optics features incrementally, then enable `fp-optics.ts`

### Status
- Build: green (`npm run typecheck`)
- Stream ops: optimized variant methods (`_map`, `_filter`, etc.) restored for parity
- Optics: multiple modules enabled (including profunctor and observable optics); core remains shimmed
- Next: prepare a reduced `fp-optics.ts` adapter that aligns with `fp-optics-core` shim (no re-exports conflicting with traversal/instances), then re-enable.


