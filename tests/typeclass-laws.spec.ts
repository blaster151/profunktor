import { describe, it, expect } from 'vitest';
import { MaybeGADT, EitherGADT, Result } from '../fp-gadt-enhanced';
import { MaybeGADTFunctor, MaybeGADTApplicative, MaybeGADTMonad } from '../fp-gadt-enhanced';
import { EitherGADTBifunctor } from '../fp-gadt-enhanced';
import { ResultFunctor, ResultApplicative, ResultMonad } from '../fp-gadt-enhanced';
import { pmatch } from '../fp-gadt-enhanced';

describe('Typeclass Laws Integration Tests', () => {
  describe('MaybeGADT Functor Laws', () => {
    it('preserves identity: map id = id', () => {
      const id = <A>(x: A) => x;
      const maybe = MaybeGADT.Just(5);
      const mapped = MaybeGADTFunctor.map(maybe, id);
      expect(mapped).toEqual(maybe);
    });

    it('preserves composition: map (f . g) = map f . map g', () => {
      const f = (x: number) => x * 2;
      const g = (x: number) => x + 1;
      const maybe = MaybeGADT.Just(3);
      
      const composed = MaybeGADTFunctor.map(maybe, (x) => f(g(x)));
      const mapped = MaybeGADTFunctor.map(MaybeGADTFunctor.map(maybe, g), f);
      
      expect(composed).toEqual(mapped);
    });

    it('handles Nothing correctly', () => {
      const f = (x: number) => x * 2;
      const nothing = MaybeGADT.Nothing();
      const mapped = MaybeGADTFunctor.map(nothing, f);
      expect(mapped).toEqual(nothing);
    });
  });

  describe('MaybeGADT Applicative Laws', () => {
    it('identity: pure id <*> v = v', () => {
      const id = <A>(x: A) => x;
      const maybe = MaybeGADT.Just(5);
      const pureId = MaybeGADTApplicative.of(id);
      const applied = MaybeGADTApplicative.ap(pureId, maybe);
      expect(applied).toEqual(maybe);
    });

    it('homomorphism: pure f <*> pure x = pure (f x)', () => {
      const f = (x: number) => x * 2;
      const x = 5;
      const pureF = MaybeGADTApplicative.of(f);
      const pureX = MaybeGADTApplicative.of(x);
      const applied = MaybeGADTApplicative.ap(pureF, pureX);
      const expected = MaybeGADTApplicative.of(f(x));
      expect(applied).toEqual(expected);
    });

    it('interchange: u <*> pure y = pure ($ y) <*> u', () => {
      const f = (x: number) => x * 2;
      const y = 5;
      const u = MaybeGADT.Just(f);
      const pureY = MaybeGADTApplicative.of(y);
      
      const left = MaybeGADTApplicative.ap(u, pureY);
      const right = MaybeGADTApplicative.ap(MaybeGADTApplicative.of((g: (x: number) => number) => g(y)), u);
      
      expect(left).toEqual(right);
    });
  });

  describe('MaybeGADT Monad Laws', () => {
    it('left identity: return a >>= f = f a', () => {
      const a = 5;
      const f = (x: number) => MaybeGADT.Just(x * 2);
      const left = MaybeGADTMonad.chain(MaybeGADTApplicative.of(a), f);
      const right = f(a);
      expect(left).toEqual(right);
    });

    it('right identity: m >>= return = m', () => {
      const maybe = MaybeGADT.Just(5);
      const chained = MaybeGADTMonad.chain(maybe, MaybeGADTApplicative.of);
      expect(chained).toEqual(maybe);
    });

    it('associativity: (m >>= f) >>= g = m >>= (\\x -> f x >>= g)', () => {
      const maybe = MaybeGADT.Just(5);
      const f = (x: number) => MaybeGADT.Just(x * 2);
      const g = (x: number) => MaybeGADT.Just(x + 1);
      
      const left = MaybeGADTMonad.chain(MaybeGADTMonad.chain(maybe, f), g);
      const right = MaybeGADTMonad.chain(maybe, (x) => MaybeGADTMonad.chain(f(x), g));
      
      expect(left).toEqual(right);
    });
  });

  describe('EitherGADT Bifunctor Laws', () => {
    it('bimap preserves identity', () => {
      const id = <A>(x: A) => x;
      const either = EitherGADT.Left(5);
      const bimapped = EitherGADTBifunctor.bimap(either, id, id);
      expect(bimapped).toEqual(either);
    });

    it('bimap preserves composition', () => {
      const f = (x: number) => x * 2;
      const g = (x: number) => x + 1;
      const h = (x: string) => x.toUpperCase();
      const i = (x: string) => x + '!';
      const either = EitherGADT.Left(5);
      
      const left = EitherGADTBifunctor.bimap(
        EitherGADTBifunctor.bimap(either, f, h),
        g,
        i
      );
      const right = EitherGADTBifunctor.bimap(either, (x) => g(f(x)), (x) => i(h(x)));
      
      expect(left).toEqual(right);
    });

    it('mapLeft and mapRight work correctly', () => {
      const f = (x: number) => x * 2;
      const g = (x: string) => x.toUpperCase();
      const left = EitherGADT.Left(5);
      const right = EitherGADT.Right('hello');
      
      const leftMapped = EitherGADTBifunctor.mapLeft(left, f);
      const rightMapped = EitherGADTBifunctor.mapRight(right, g);
      
      expect(leftMapped).toEqual(EitherGADT.Left(10));
      expect(rightMapped).toEqual(EitherGADT.Right('HELLO'));
    });
  });

  describe('Result Functor Laws', () => {
    it('preserves identity: map id = id', () => {
      const id = <A>(x: A) => x;
      const result = Result.Ok(5);
      const mapped = ResultFunctor.map(result, id);
      expect(mapped).toEqual(result);
    });

    it('preserves composition: map (f . g) = map f . map g', () => {
      const f = (x: number) => x * 2;
      const g = (x: number) => x + 1;
      const result = Result.Ok(3);
      
      const composed = ResultFunctor.map(result, (x) => f(g(x)));
      const mapped = ResultFunctor.map(ResultFunctor.map(result, g), f);
      
      expect(composed).toEqual(mapped);
    });

    it('handles Err correctly', () => {
      const f = (x: number) => x * 2;
      const err = Result.Err('error');
      const mapped = ResultFunctor.map(err, f);
      expect(mapped).toEqual(err);
    });
  });

  describe('Result Applicative Laws', () => {
    it('identity: pure id <*> v = v', () => {
      const id = <A>(x: A) => x;
      const result = Result.Ok(5);
      const pureId = ResultApplicative.of(id);
      const applied = ResultApplicative.ap(pureId, result);
      expect(applied).toEqual(result);
    });

    it('homomorphism: pure f <*> pure x = pure (f x)', () => {
      const f = (x: number) => x * 2;
      const x = 5;
      const pureF = ResultApplicative.of(f);
      const pureX = ResultApplicative.of(x);
      const applied = ResultApplicative.ap(pureF, pureX);
      const expected = ResultApplicative.of(f(x));
      expect(applied).toEqual(expected);
    });

    it('interchange: u <*> pure y = pure ($ y) <*> u', () => {
      const f = (x: number) => x * 2;
      const y = 5;
      const u = Result.Ok(f);
      const pureY = ResultApplicative.of(y);
      
      const left = ResultApplicative.ap(u, pureY);
      const right = ResultApplicative.ap(ResultApplicative.of((g: (x: number) => number) => g(y)), u);
      
      expect(left).toEqual(right);
    });
  });

  describe('Result Monad Laws', () => {
    it('left identity: return a >>= f = f a', () => {
      const a = 5;
      const f = (x: number) => Result.Ok(x * 2);
      const left = ResultMonad.chain(ResultApplicative.of(a), f);
      const right = f(a);
      expect(left).toEqual(right);
    });

    it('right identity: m >>= return = m', () => {
      const result = Result.Ok(5);
      const chained = ResultMonad.chain(result, ResultApplicative.of);
      expect(chained).toEqual(result);
    });

    it('associativity: (m >>= f) >>= g = m >>= (\\x -> f x >>= g)', () => {
      const result = Result.Ok(5);
      const f = (x: number) => Result.Ok(x * 2);
      const g = (x: number) => Result.Ok(x + 1);
      
      const left = ResultMonad.chain(ResultMonad.chain(result, f), g);
      const right = ResultMonad.chain(result, (x) => ResultMonad.chain(f(x), g));
      
      expect(left).toEqual(right);
    });
  });

  describe('Integration with pmatch', () => {
    it('pmatch works with typeclass instances', () => {
      const maybe = MaybeGADT.Just(42);
      const mapped = MaybeGADTFunctor.map(maybe, (x) => x * 2);
      
      const result = pmatch(mapped)
        .with('Just', (payload: any) => payload.value)
        .with('Nothing', () => 0)
        .exhaustive();
      
      expect(result).toBe(84);
    });

    it('pmatch works with Result instances', () => {
      const result = Result.Ok(42);
      const mapped = ResultFunctor.map(result, (x) => x * 2);
      
      const value = pmatch(mapped)
        .with('Ok', (payload: any) => payload.value)
        .with('Err', (payload: any) => 0)
        .exhaustive();
      
      expect(value).toBe(84);
    });
  });
});
