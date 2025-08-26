// src/homotopy/small-object/small-object-argument.ts
//
// Paper alignment (pp. 6–7):
// - I-cellular maps = cell(I): pushouts of I, closed under transfinite composition.
// - cof(I) = retracts of cell(I).
// - inj(I) = maps with RLP wrt every i ∈ I.
// - Every f factors functorially as f = p ∘ i with i ∈ cell(I) and p ∈ inj(I).

// The arrow/object types are abstract; callers supply "ops" that know pushouts, coproducts, etc.

export interface GeneratingMap<X> { readonly map: X; readonly domainSmall: boolean }

// Minimal "category ops" surface we need to *speak about* cell(I)/inj(I).
export interface CategoryOps<X> {
  // Right lifting property witness: return a diagonal if it exists
  lift(i: X, p: X): X | undefined;
  // Pushout of i along some map into dom(p) (shape only; you can refine later)
  pushout(i: X, along: X): X;
  // Coproduct of a small family (used inside transfinite steps)
  coproduct(maps: readonly X[]): X;
  // Compose arrows
  compose(g: X, f: X): X; // g ∘ f
  // Identity on codomain/domain as needed (not fully specified here)
  idLike(x: X): X;
}

export interface CellClosure<X> {
  // NOTE: We only record *evidence*. Actual constructions are delegated to ops.
  readonly isCellular: (f: X) => boolean;
  readonly generatorPushout: (i: X, along: X) => X; // one pushout step
  readonly transfiniteCompose: (chain: readonly X[]) => X; // a "limit" step
}

export function cell<I, X>(I: readonly GeneratingMap<X>[], ops: CategoryOps<X>): CellClosure<X> {
  const generatorPushout = (i: X, along: X) => ops.pushout(i, along);
  const transfiniteCompose = (chain: readonly X[]) =>
    chain.length ? chain.reduce((acc, next) => ops.compose(next, acc)) : (undefined as unknown as X);
  // Without concrete invariants we conservatively expose a predicate that callers can strengthen.
  const isCellular = (_f: X) => true; // placeholder: treat as evidence carrier
  return { isCellular, generatorPushout, transfiniteCompose };
}

export function inj<X>(I: readonly GeneratingMap<X>[], ops: CategoryOps<X>): (p: X) => boolean {
  return (p: X) => I.every(({ map: i }) => ops.lift(i, p) !== undefined);
}

export function cof<X>(I: readonly GeneratingMap<X>[], _ops: CategoryOps<X>): (f: X) => boolean {
  // Retracts of cell(I). We don't compute retracts here; provide a stable predicate hook.
  return (_f: X) => true; // placeholder; upgrade when real retract detection is available
}

export interface SOAFactorization<X> {
  readonly left: X;  // i ∈ cell(I)
  readonly right: X; // p ∈ inj(I)
}

export interface SOAOptions {
  readonly regularCardinal?: number; // pretend bound above presentability rank; default small
  readonly maxStages?: number;       // safety for demos/tests
}

// Functorial factorization skeleton (Beke Prop. 1.3): f = (inj J) ∘ (cell I)
export function smallObjectArgument<X>(
  f: X,
  I: readonly GeneratingMap<X>[],
  ops: CategoryOps<X>,
  opts: SOAOptions = {}
): SOAFactorization<X> {
  // For now, return a shape-preserving stub that callers can replace.
  // Keep types and functorial call signature stable.
  const left = ops.idLike(f);   // pretend left factor is "cell(I)"
  const right = ops.idLike(f);  // pretend right factor is "inj(I)"
  return { left, right };
}
