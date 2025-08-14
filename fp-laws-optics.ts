// fp-laws-optics.ts
import { Lens } from './fp-optics.js'; // your profunctor optics module
type Eq<T> = (x:T,y:T)=>boolean;

export function checkLensLaws<S,A>(
  ln: Lens<S,S,A,A>,
  genS: ()=>S,
  genA: ()=>A,
  eqS: Eq<S>,
  eqA: Eq<A>,
  view: (ln: any, s:S)=>A,
  set: (ln: any, a:A, s:S)=>S
): { getSet: boolean; setGet: boolean; setSet: boolean } {
  // get-set: set (view s) s == s
  const s1 = genS();
  const gs = set(ln, view(ln,s1), s1);
  const getSet = eqS(gs, s1);

  // set-get: view (set a s) == a
  const s2 = genS(); const a2 = genA();
  const sg = view(ln, set(ln, a2, s2));
  const setGet = eqA(sg, a2);

  // set-set: set a (set a' s) == set a s
  const s3 = genS(), a3 = genA(), a4 = genA();
  const ss = set(ln, a3, set(ln, a4, s3));
  const sExpected = set(ln, a3, s3);
  const setSet = eqS(ss, sExpected);
  return { getSet, setGet, setSet };
}
