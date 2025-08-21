import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  Expr,
  evaluate,
  MaybeGADT,
  MaybeGADTApplicative,
  MaybeGADTMonad,
  EitherGADT,
  EitherGADTBifunctor,
  pmatch,
  ExprFunctor,
} from '../fp-gadt-enhanced';

describe('Expr GADT - evaluation', () => {
  it('evaluates constants', () => {
    expect(evaluate(Expr.Const(5))).toBe(5);
    expect(evaluate(Expr.Const(true) as any)).toBe(true);
  });

  it('evaluates addition', () => {
    expect(evaluate(Expr.Add(Expr.Const(2), Expr.Const(3)))).toBe(5);
  });

  it('evaluates conditional expressions', () => {
    expect(evaluate(Expr.If(Expr.Const(true) as any, Expr.Const(1), Expr.Const(2)))).toBe(1);
    expect(evaluate(Expr.If(Expr.Const(false) as any, Expr.Const(1), Expr.Const(2)))).toBe(2);
  });
});

describe('ExprFunctor - functor laws (sampled)', () => {
  it('identity preserves evaluation', () => {
    // Build a small expression tree
    const tree = Expr.Add(
      Expr.Const(2),
      Expr.If<number>(Expr.Const(true), Expr.Const(3), Expr.Const(4))
    );
    const mapped = ExprFunctor.map(tree as any, (x: number) => x);
    expect(evaluate(mapped)).toBe(evaluate(tree as any));
  });

  it('composition preserves evaluation', () => {
    const tree = Expr.Add(
      Expr.Const(1),
      Expr.If<number>(Expr.Const(false), Expr.Const(10), Expr.Const(20))
    );
    const f = (n: number) => n + 1;
    const g = (n: number) => n * 3;
    const left = ExprFunctor.map(ExprFunctor.map(tree as any, f) as any, g) as any;
    const right = ExprFunctor.map(tree as any, (x: number) => g(f(x))) as any;
    expect(evaluate(left)).toBe(evaluate(right));
  });
});

describe('EitherGADT - bifunctor operations', () => {
  it('bimap transforms both sides', () => {
    const left = EitherGADT.Left(5);
    const right = EitherGADT.Right('hello');
    const f = (n: number) => n * 2;
    const g = (s: string) => s.toUpperCase();
    expect(EitherGADTBifunctor.bimap(left as any, f, g)).toEqual(EitherGADT.Left(10));
    expect(EitherGADTBifunctor.bimap(right as any, f, g)).toEqual(EitherGADT.Right('HELLO'));
  });

  it('mapLeft transforms only left side', () => {
    const left = EitherGADT.Left(3);
    const right = EitherGADT.Right('test');
    const f = (n: number) => n + 1;
    expect(EitherGADTBifunctor.mapLeft(left as any, f)).toEqual(EitherGADT.Left(4));
    expect(EitherGADTBifunctor.mapLeft(right as any, f)).toEqual(right);
  });

  it('mapRight transforms only right side', () => {
    const left = EitherGADT.Left(7);
    const right = EitherGADT.Right('world');
    const g = (s: string) => s.length;
    expect(EitherGADTBifunctor.mapRight(left as any, g)).toEqual(left);
    expect(EitherGADTBifunctor.mapRight(right as any, g)).toEqual(EitherGADT.Right(5));
  });
});

describe('Expr - property-based transformations', () => {
  it('evaluate is idempotent', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: -100, max: 100 }),
          fc.boolean()
        ),
        (value) => {
          const expr = Expr.Const(value);
          const result1 = evaluate(expr);
          const result2 = evaluate(expr);
          return result1 === result2;
        }
      )
    );
  });

  it('map preserves evaluation semantics', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -50, max: 50 }),
        fc.integer({ min: -50, max: 50 }),
        (a, b) => {
          const expr = Expr.Add(Expr.Const(a), Expr.Const(b));
          const mapped = ExprFunctor.map(expr as any, (x: number) => x + 1);
          const expected = evaluate(expr) + 1;
          const actual = evaluate(mapped as any);
          return actual === expected;
        }
      )
    );
  });
});

describe('MaybeGADT instances', () => {
  it('Applicative of creates Just', () => {
    const result = MaybeGADTApplicative.of(42);
    expect(result).toEqual(MaybeGADT.Just(42));
  });

  it('Applicative ap applies function', () => {
    const fn = MaybeGADT.Just((x: number) => x * 2);
    const value = MaybeGADT.Just(21);
    const result = MaybeGADTApplicative.ap(fn, value);
    expect(result).toEqual(MaybeGADT.Just(42));
  });

  it('Monad chain basics', () => {
    const fa: MaybeGADT<number> = MaybeGADTMonad.of(5);
    const chained = MaybeGADTMonad.chain(fa, (n) => MaybeGADTMonad.of(n * 3) as any);
    expect(chained).toEqual(MaybeGADTMonad.of(15));
  });

  it('Applicative laws: identity, homomorphism, interchange (sampled)', () => {
    const of = MaybeGADTApplicative.of as <A>(a: A) => MaybeGADT<A>;
    const ap = MaybeGADTApplicative.ap as <A, B>(ff: MaybeGADT<(a: A) => B>, fa: MaybeGADT<A>) => MaybeGADT<B>;
    const id = <A>(a: A) => a;
    const v = of(7);
    // identity
    expect(ap(of(id), v)).toEqual(v);
    // homomorphism
    const f = (n: number) => n + 2;
    expect(ap(of(f), of(3))).toEqual(of(f(3)));
    // interchange
    const u = of((n: number) => n * 2);
    const y = 5;
    const ofApplyY = of((fn: (n: number) => number) => fn(y));
    expect(ap(u, of(y))).toEqual(ap(ofApplyY, u));
  });

  it('Monad laws: left/right identity (sampled)', () => {
    const of = MaybeGADTMonad.of as <A>(a: A) => MaybeGADT<A>;
    const chain = MaybeGADTMonad.chain as <A, B>(fa: MaybeGADT<A>, f: (a: A) => MaybeGADT<B>) => MaybeGADT<B>;
    const a = 9;
    const f = (n: number) => of(n + 1);
    // left identity
    expect(chain(of(a), f)).toEqual(f(a));
    // right identity
    const m = of(3);
    expect(chain(m, of)).toEqual(m);
  });
});

describe('pmatch - exhaustiveness edge cases', () => {
  it('handles nested GADTs', () => {
    const nested: MaybeGADT<EitherGADT<number, string>> = MaybeGADT.Just(
      EitherGADT.Right('nested')
    );
    const result = pmatch(nested)
      .with('Just', ({ value }) => 
        pmatch(value)
          .with('Left', ({ value: n }) => `left: ${n}`)
          .with('Right', ({ value: s }) => `right: ${s}`)
          .exhaustive()
      )
      .with('Nothing', () => 'nothing')
      .exhaustive();
    expect(result).toBe('right: nested');
  });

  it('handles complex conditional expressions', () => {
    const complexExpr = Expr.If<number>(
      Expr.Const(true),
      Expr.Add(Expr.Const(1), Expr.Const(2)),
      Expr.Const(0)
    );
    const result = evaluate(complexExpr);
    expect(result).toBe(3);
  });

  it('handles deep nested expressions', () => {
    const deepExpr = Expr.Add(
      Expr.If<number>(
        Expr.Const(true),
        Expr.Const(1),
        Expr.Const(2)
      ),
      Expr.If<number>(
        Expr.Const(false),
        Expr.Const(3),
        Expr.Const(4)
      )
    );
    const result = evaluate(deepExpr);
    expect(result).toBe(5); // 1 + 4
  });
});

describe('EitherGADT - property-based bifunctor laws', () => {
  it('bimap identity law', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: -100, max: 100 }).map(n => EitherGADT.Left(n)),
          fc.string().map(s => EitherGADT.Right(s))
        ),
        (either) => {
          const id = <A>(a: A) => a;
          const result = EitherGADTBifunctor.bimap(either as any, id, id);
          return JSON.stringify(result) === JSON.stringify(either);
        }
      )
    );
  });

  it('bimap composition law', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 100 }).map(n => EitherGADT.Left(n)),
        (either) => {
          const f1 = (n: number) => n + 1;
          const f2 = (n: number) => n * 2;
          const g1 = (s: string) => s.toUpperCase();
          const g2 = (s: string) => s + '!';
          
          const left = EitherGADTBifunctor.bimap(
            EitherGADTBifunctor.bimap(either as any, f1, g1),
            f2, g2
          );
          const right = EitherGADTBifunctor.bimap(
            either as any,
            (n: number) => f2(f1(n)),
            (s: string) => g2(g1(s))
          );
          return JSON.stringify(left) === JSON.stringify(right);
        }
      )
    );
  });
});


