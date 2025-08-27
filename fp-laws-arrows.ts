// fp-laws-arrows.ts (augment) — tiny tests for ParTraverseIf, Selective, Commutative

import { Kind1, Kind2, Apply } from './fp-hkt';
import { Applicative } from './fp-typeclasses-hkt';
import { Bazaar } from './fp-bazaar-traversable-bridge';
import { makeParTraverseIf, optimizePlan, compilePlanToStream } from './fp-bazaar-planner';
import { Selective, IdSelective, OptionSelective, checkSelectiveLaws } from './fp-selective';

export async function testParTraverseIf<F extends Kind1, A, B, S, T>(
  runEffect: <X>(fx: Apply<F, [X]>) => Promise<X>,
  F: Applicative<F>,
  asyncF: any,
  bracket: any,
  baz: Bazaar<A, B, S, T>,
  s: S,
  predAsync: (a: A) => Promise<boolean>,
  kAsync: (a: A) => Promise<B>
): Promise<B[]> {
  const plan = makeParTraverseIf(baz, s, predAsync, kAsync, { concurrency: 4, preserveOrder: true });
  const stream = compilePlanToStream(runEffect, F, asyncF, bracket, plan);
  const out = await (stream as any).compile.fold([], async (acc: B[], b: B) => { if (b !== undefined) acc.push(b); return acc; });
  return out;
}

export function testSelectiveLaws(): { idOk: boolean; optionOk: boolean } {
  const id = checkSelectiveLaws(IdSelective, (b) => b as any, (a) => a as any);
  const option = checkSelectiveLaws(OptionSelective as unknown as Selective<any>, (b) => (b ? true : true) as any, (a) => a as any);
  return { idOk: id.identity, optionOk: option.identity };
}

export async function testFilterRewriteEquivalenceId<F extends Kind1, A, B, S, T>(
  runEffect: <X>(fx: Apply<F, [X]>) => Promise<X>,
  F: Applicative<F>,
  asyncF: any,
  bracket: any,
  baz: Bazaar<A, B, S, T>,
  s: S,
  pA: (a: A) => boolean,
  k: (a: A) => B
): Promise<boolean> {
  const plan0 = { tag: 'Seq', steps: [ { tag: 'FilterA', pA: pA as any, baz: baz as any, s: s as any } as any, { tag: 'Traverse', baz: baz as any, s: s as any, k: k as any } as any ] } as any;
  const s0 = compilePlanToStream(runEffect, F, asyncF, bracket, plan0);
  const out0 = await (s0 as any).compile.fold([], async (acc: B[], b: B) => { if (b !== undefined) acc.push(b); return acc; });
  const plan1 = optimizePlan(plan0, { fuse: true });
  const s1 = compilePlanToStream(runEffect, F, asyncF, bracket, plan1);
  const out1 = await (s1 as any).compile.fold([], async (acc: B[], b: B) => { if (b !== undefined) acc.push(b); return acc; });
  return JSON.stringify(out0) === JSON.stringify(out1);
}

import { Category, Arrow, ArrowChoice, ArrowApply } from './fp-arrows-kleisli-star';
import { Either } from './fp-either-unified';

export type Eq<T> = (x: T, y: T) => boolean;
export type Gen<T> = () => T;

type LawCheck = { name: string; ok: boolean };
export type LawReport = { sampleCount: number; checks: LawCheck[] };

type Left<X>  = { tag: 'Left';  value: X };
type Right<X> = { tag: 'Right'; value: X };

function all(checks: LawCheck[]): boolean { return checks.every(c => c.ok); }
function repeat(n: number): number[] { return Array.from({ length: n }, (_, i) => i); }

/** Equality for arrows via an evaluator + domain samples */
export function eqArrow<P extends Kind2, A, B>(
  evalP: <X, Y>(p: Apply<P, [X, Y]>) => (x: X) => Y,
  eqB: Eq<B>,
  samples: A[]
): (p1: Apply<P, [A, B]>, p2: Apply<P, [A, B]>) => boolean {
  return (p1, p2) => {
    const f1 = evalP(p1), f2 = evalP(p2);
    for (const a of samples) {
      if (!eqB(f1(a), f2(a))) return false;
    }
    return true;
  };
}

// -----------------------------------------
// Category laws
// -----------------------------------------
export function runCategoryLaws<P extends Kind2, A, B, C, D>(
  C: Category<P>,
  cfg: {
    lift: <X, Y>(f: (x: X) => Y) => Apply<P, [X, Y]>;
    evalP: <X, Y>(p: Apply<P, [X, Y]>) => (x: X) => Y;
    genA: Gen<A>;
    genB: Gen<B>;
    genC: Gen<C>;
    genD: Gen<D>;
    eqD: Eq<D>;
    samples?: number;
  }
): LawReport {
  const N = cfg.samples ?? 50;
  const As = repeat(N).map(cfg.genA);
  const eq = eqArrow<P, A, D>(cfg.evalP, cfg.eqD, As);

  // build random endomorphisms via lift
  const f = cfg.lift<A, B>(x => cfg.genB());
  const g = cfg.lift<B, C>(x => cfg.genC());
  const h = cfg.lift<C, D>(x => cfg.genD());

  const assoc = eq(
    C.compose(C.compose(h, g) as any, f as any) as any,
    C.compose(h as any, C.compose(g, f) as any) as any
  );

  const idL = eq(C.compose(C.id<A>(), f as any) as any, f as any);
  const idR = eq(C.compose(f as any, C.id<B>()) as any, f as any);

  return { sampleCount: N, checks: [
    { name: 'Category: associativity', ok: assoc },
    { name: 'Category: left identity', ok: idL },
    { name: 'Category: right identity', ok: idR },
  ]};
}

// -----------------------------------------
// Arrow laws (arr, first)
// -----------------------------------------
export function runArrowLaws<P extends Kind2, A, B, C, D>(
  Ainst: Arrow<P>,
  cfg: {
    evalP: <X, Y>(p: Apply<P, [X, Y]>) => (x: X) => Y;
    genA: Gen<A>;
    genB: Gen<B>;
    genC: Gen<C>;
    genD: Gen<D>;
    eq: {
      AB: Eq<B>;
      AC: Eq<[A, C]>;
      BC: Eq<[B, C]>;
      DC: Eq<[D, C]>;
    };
    samples?: number;
  }
): LawReport {
  const N = cfg.samples ?? 50;
  const As = repeat(N).map(cfg.genA);
  const ACs = repeat(N).map(() => [cfg.genA(), cfg.genC()] as [A, C]);
  const eqArr = <X, Y>(eqY: Eq<Y>, Xs: X[]) => eqArrow<P, X, Y>(cfg.evalP, eqY, Xs);

  const f = (a: A) => cfg.genB();
  const g = (b: B) => cfg.genD();

  // arr id = id
  const lawArrId = eqArr<A, A>((x, y) => x === y, As)(
    Ainst.arr<A, A>(x => x),
    Ainst.id<A>()
  );

  // arr (g∘f) = arr g ∘ arr f
  const lawArrComp = eqArr<A, D>(cfg.eq.AB as any, As)(
    Ainst.arr<A, D>(x => g(f(x))),
    Ainst.compose(Ainst.arr<B, D>(g), Ainst.arr<A, B>(f))
  );

  // first (f ∘ g) = first f ∘ first g
  const af = Ainst.arr<A, B>(f);
  const ag = Ainst.arr<B, D>(g);
  const lawFirstComp = eqArr<[A, C], [D, C]>(cfg.eq.DC, ACs)(
    Ainst.first(Ainst.compose(ag, af)),
    Ainst.compose(Ainst.first(ag), Ainst.first(af))
  );

  // Naturality of first: first(arr h) = arr (mapFst h)
  const h = (a: A) => cfg.genA();
  const mapFst = (hc: [A, C]) : [A, C] => [h(hc[0]), hc[1]];
  const lawFirstNaturality = eqArr<[A, C], [A, C]>(cfg.eq.AC, ACs)(
    Ainst.first(Ainst.arr<A, A>(h)),
    Ainst.arr<[A, C], [A, C]>(mapFst)
  );

  return { sampleCount: N, checks: [
    { name: 'Arrow: arr id = id', ok: lawArrId },
    { name: 'Arrow: arr (g∘f) = arr g ∘ arr f', ok: lawArrComp },
    { name: 'Arrow: first distributes over composition', ok: lawFirstComp },
    { name: 'Arrow: first naturality (tuple)', ok: lawFirstNaturality },
  ]};
}

// -----------------------------------------
// ArrowChoice laws (left)
// -----------------------------------------
export function runArrowChoiceLaws<P extends Kind2, A, B, C>(
  AC: ArrowChoice<P>,
  cfg: {
    evalP: <X, Y>(p: Apply<P, [X, Y]>) => (x: X) => Y;
    genA: Gen<A>;
    genB: Gen<B>;
    genC: Gen<C>;
    samples?: number;
  }
): LawReport {
  const N = cfg.samples ?? 50;
  const Es: Either<A, C>[] = repeat(N).map(i => i % 2 === 0 ? ({ left: cfg.genA() } as Either<A, C>) : ({ right: cfg.genC() } as Either<A, C>));
  const eqEither: Eq<Either<B, C>> = (x, y) => (
    'left' in (x as any)
      ? ('left' in (y as any) && (x as any).left === (y as any).left)
      : ('right' in (y as any) && (x as any).right === (y as any).right)
  );
  const eqArr = eqArrow<P, Either<A, C>, Either<B, C>>(cfg.evalP, eqEither, Es);

  const f = (a: A) => cfg.genB();

  // left (arr f) = arr (left f)
  const lawLeftArr = eqArr(
    AC.left<A, B, C>(AC.arr<A, B>(f)),
    AC.arr<Either<A, C>, Either<B, C>>(e => ('left' in (e as any) ? ({ left: f((e as any).left as A) } as Either<B, C>) : ({ right: (e as any).right } as Either<B, C>)))
  );

  return { sampleCount: N, checks: [
    { name: 'ArrowChoice: left (arr f) = arr (left f)', ok: lawLeftArr },
  ]};
}

// Named guard function to avoid binding-pattern type predicate
function hasA<P extends Kind2, A, B>(t: readonly [Apply<P, [A, B]>, A | undefined]): t is readonly [Apply<P, [A, B]>, A] {
  return t[1] !== undefined;
}

// -----------------------------------------
// ArrowApply laws (beta/eta-like)
// -----------------------------------------
export function runArrowApplyLaws<P extends Kind2, A, B>(
  AA: ArrowApply<P>,
  cfg: {
    evalP: <X, Y>(p: Apply<P, [X, Y]>) => (x: X) => Y;
    genA: Gen<A>;
    genF: Gen<(a: A) => B>;
    eqB: Eq<B>;
    samples?: number;
  }
): LawReport {
  const N = cfg.samples ?? 50;
  const As = repeat(N).map(cfg.genA);
  const Fs = repeat(N).map(cfg.genF);
  const rawPairs = Fs.map((f, i) => [AA.arr<A, B>(f), As[i % As.length]] as [Apply<P, [A, B]>, A | undefined]);
  const pairs = rawPairs.filter(hasA<P, A, B>) as [Apply<P, [A, B]>, A][];
  const eq = eqArrow<P, [ Apply<P, [A, B]>, A ], B>(
    cfg.evalP,
    cfg.eqB,
    pairs
  );

  // Beta: app ∘ (arr (\(f,a) -> (f,a))) = arr (\(f,a) -> f a)
  const pairId = AA.arr<[
    Apply<P, [A, B]>,
    A
  ], [
    Apply<P, [A, B]>,
    A
  ]>(x => x as [Apply<P, [A, B]>, A]);
  const beta = eq(
    AA.compose(AA.app<A, B>(), pairId),
    AA.arr(([pf, a]) => cfg.evalP(pf)(a))
  );

  // Eta: f = app ∘ (arr (\a -> (f,a)))
  const anyF = AA.arr<A, B>(cfg.genF()); // fixed arrow
  const etaEq = eqArrow<P, A, B>(cfg.evalP, cfg.eqB, As)(
    anyF,
    AA.compose(AA.app<A, B>(), AA.arr<A, [Apply<P, [A, B]>, A]>(a => [anyF, a]))
  );

  return { sampleCount: N, checks: [
    { name: 'ArrowApply: beta', ok: beta },
    { name: 'ArrowApply: eta  (weak, sampled)', ok: etaEq },
  ]};
}


