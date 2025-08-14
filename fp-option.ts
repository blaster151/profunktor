// fp-option.ts
import { Kind1, Apply } from './fp-hkt';
import { Functor, Applicative } from './fp-typeclasses-hkt';
import { Maybe as Option, Just, Nothing, matchMaybe } from './fp-maybe-unified';

// Re-export as Option
export { Option, Just, Nothing };

export interface OptionK extends Kind1 { readonly type: Option<this['arg0']>; }

export const OptionFunctor: Functor<OptionK> = {
  map: <A,B>(fa: Apply<OptionK,[A]>, f: (a:A)=>B): Apply<OptionK,[B]> =>
    matchMaybe(fa as unknown as Option<A>, { Just: (a: A) => Just(f(a)), Nothing: () => Nothing() }) as unknown as Apply<OptionK,[B]>
};

export const OptionApplicative: Applicative<OptionK> = {
  of: <A>(a:A): Apply<OptionK,[A]> => Just(a),
  ap: <A,B>(ff: Apply<OptionK,[(a:A)=>B]>, fa: Apply<OptionK,[A]>) =>
    matchMaybe(ff as unknown as Option<(a:A)=>B>, {
      Just: (f: (a:A)=>B) => matchMaybe(fa as unknown as Option<A>, { Just: (a: A) => Just(f(a)), Nothing }),
      Nothing
    }) as unknown as Apply<OptionK,[B]>,
  map: OptionFunctor.map
};

// ---------- effectful traversal demo (short-circuit on Nothing) ----------
export function traverseArrayOption<A,B>(
  f: (a:A)=> Apply<OptionK,[B]>,
  as: A[]
): Apply<OptionK,[B[]]> {
  let acc: Option<B[]> = Just<B[]>([]);
  for (const a of as) {
    acc = matchMaybe(acc, {
      Nothing,
      Just: (bs: B[]) => matchMaybe(f(a) as unknown as Option<B>, {
        Nothing,
        Just: (b: B) => Just<B[]>([...bs, b])
      }) as Option<B[]>
    });
  }
  return acc as unknown as Apply<OptionK,[B[]]> ;
}

// tiny helper: parse all ints or fail
export const parseAllInts = (xs: string[]) =>
  traverseArrayOption(s => {
    const n = Number(s);
    return Number.isInteger(n) ? Just(n) : Nothing();
  }, xs);

