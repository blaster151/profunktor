import { describe, it, expect } from 'vitest';
import {
  Result,
  ResultApplicative,
  ResultMonad,
} from '../fp-gadt-enhanced';

describe('ResultK - Applicative and Monad basics', () => {
  it('of produces Ok', () => {
    const r = ResultApplicative.of<number, string>(42);
    expect(r).toEqual(Result.Ok<number, string>(42));
  });

  it('ap applies when both are Ok, propagates Err otherwise', () => {
    const fOk = ResultApplicative.of<(n: number) => number, string>((n) => n + 1);
    const aOk = ResultApplicative.of<number, string>(1);
    const aErr = Result.Err<number, string>('e');

    expect(ResultApplicative.ap(fOk, aOk)).toEqual(Result.Ok<number, string>(2));
    expect(ResultApplicative.ap(fOk, aErr)).toEqual(Result.Err<number, string>('e'));
  });

  it('chain sequences Ok and short-circuits on Err', () => {
    const ok1 = Result.Ok<number, string>(3);
    const err = Result.Err<number, string>('oops');
    const f = (n: number) => Result.Ok<number, string>(n * 2);

    expect(ResultMonad.chain(ok1, f)).toEqual(Result.Ok<number, string>(6));
    expect(ResultMonad.chain(err as any, f)).toEqual(Result.Err<number, string>('oops'));
  });
});


