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
- Optics (enabled so far): `fp-optics-core.ts` (shim), `fp-optics-traversal.ts`, `fp-adt-optics.ts`, `fp-optics-iso-helpers.ts`, `fp-optics-everywhere.ts` (trimmed to use adapter), `fp-optics-affine.ts`, `fp-optics-indexed.ts` (local Strong/Choice), `fp-optics-instances.ts` (lite)
  - `src/**/*.ts`
- exclude:
  - `dist`, `node_modules`
  - Many additional heavy/demo modules excluded via globs (see tsconfig)
  - Cleaned: removed excludes that conflicted with explicit includes (`fp-optics-instances.ts`, `fp-optics-everywhere.ts`, `fp-optics-affine.ts`, `fp-profunctor-optics.ts`)

### Temporarily stubbed modules
- `fp-stream-ops.ts`: ObservableLite mixins only (no `fp-stream-state` import)
- `fp-frp-bridge.ts`: returns `StatefulStream` via `createStatefulStream`
- `fp-fluent-api.ts`: minimal prototype mixin helper

### Modules intentionally excluded (to be reintroduced later)
- `fp-optics.ts` remains a minimal barrel; full implementation deferred
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
- [x] Enforce `fp-optics.ts` as minimal barrel to avoid duplicate exports
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
- [x] Add safe composition helpers in adapter: `composeLensLens`, `composeLensPrism`, `composePrismLens`
- [x] Route `fp-adt-optics-simple.ts` and `fp-adt-optics.ts` back through barrel `fp-optics` to stabilize public imports
- [ ] Expand optics features incrementally inside adapter, then consider folding back into `fp-optics.ts`

### Status
- Build: green (`npm run typecheck`)
- Stream ops: optimized variant methods (`_map`, `_filter`, etc.) restored for parity
- Optics core: using `fp-optics-core.ts` + `fp-optics-adapter.ts` (barrel at `fp-optics.ts`)
- Traversal: introduced lightweight shim (`fp-traversal-shim.ts`) and re-exported from adapter to provide a minimal, conflict-free API (`traversal`, `modifyOf`, `setOf`, `overOf`, `getAllOf`, `foldOf`, `foldMapOf`)
- Iso helpers: enabled `fp-optics-iso-helpers.ts` with a safe callback arity fix compatible with the shim
- Optics modules enabled and aligned to adapter: `fp-optics-traversal.ts`, `fp-observable-optics.ts`, `fp-optics-indexed.ts`, `fp-profunctor-optics.ts` (facade), `fp-optics-auto-derivation.ts` (facade)
- Unfolds: added `fp-anamorphisms.ts` (new, minimal builder-driven ana + unified ADT helpers)
 - Added minimal `fp-registry-init.ts` facade (no eager imports) to support optional registry usage
 - Harness `fp-optics-law-harness.ts` kept out of build to avoid generic-cast noise; runnable as standalone if needed
- Registry: attempted `fp-registry-init.ts`, reverted due to duplicate/compat errors to keep build green

### This pass
- Enforced `fp-optics.ts` as minimal barrel to adapter to prevent symbol conflicts
- Slimmed `fp-optics-everywhere.ts` to use the `fp-optics` barrel/adapter and trim heavy imports
- Cleaned `tsconfig.json` excludes that contradicted includes (removed specific excludes for already-included optics files)
- Added `fp-adt-optics-simple.ts` to `include` (lightweight consumer aligned with barrel)
- Added `fp-traversal-shim.ts` and exposed traversal helpers via adapter
- Enabled `fp-optics-iso-helpers.ts` and adapted traversal callback signature


