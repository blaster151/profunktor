// src/fp-laws-suites.ts
import type { Suite } from "./fp-laws-core";
import { forAll, forAll2 } from "./fp-laws-core";
import { need } from "./fp-witness-registry";

// =========== Functor ===========
export function functorSuite(rec: any): Suite {
  const F = need(rec, "Functor");
  const GenFA = need(rec, "Gen");  // expects Gen<any> producing fa
  const EqFA = need(rec, "Eq");    // Eq for the carrier (fa)
  const id = <A>(a:A)=>a;
  return {
    subject: `${rec.name} — Functor`,
    laws: [
      forAll(50, GenFA, (fa:any) => EqFA(F.map(fa, id), fa) || "map id = id"),
      forAll2(50, GenFA, (_:number)=>((x:number)=>x+1), (fa:any, f:any) => {
        const g = (x:number)=>x*2;
        const left = F.map(F.map(fa, f), g);
        const right = F.map(fa, (x:any)=>g(f(x)));
        return EqFA(left, right) || "map (g∘f) = map g ∘ map f";
      }),
    ]
  };
}

// =========== Applicative (select few) ===========
export function applicativeSuite(rec: any): Suite {
  const A = need(rec,"Applicative"), EqFA = need(rec,"Eq"), GenFA = need(rec,"Gen");
  return {
    subject: `${rec.name} — Applicative`,
    laws: [
      forAll(30, (_)=>A.of(42), (u:any)=> EqFA(A.ap(A.of((x:number)=>x), u), u) || "identity"),
      forAll2(30, (_)=>A.of((x:number)=>x+1), GenFA, (uf:any, u:any) => {
        const v = A.of(3);
        const left = A.ap(A.ap(A.map(uf, (f:any)=> (g:any)=> (x:any)=> f(g(x))), A.of((y:number)=>y+2)), v);
        const right= A.ap(uf, A.ap(A.of((f:any)=>(x:any)=>f((x as number)+2)), v));
        return EqFA(left, right) || "composition (restricted)";
      })
    ]
  };
}

// =========== Monad (select few) ===========
export function monadSuite(rec:any): Suite {
  const M = need(rec,"Monad"), EqFA = need(rec,"Eq"), GenFA = need(rec,"Gen");
  return {
    subject: `${rec.name} — Monad`,
    laws: [
      forAll(40, (_)=>42, (a:number)=> {
        const left  = M.chain(M.of(a), M.of);
        const right = M.of(a);
        return EqFA(left, right) || "right identity";
      }),
      forAll(40, GenFA, (m:any)=> {
        const left  = M.chain(m, M.of);
        return EqFA(left, m) || "left identity";
      }),
    ]
  };
}

// =========== Profunctor ===========
export function profunctorSuite(rec:any): Suite {
  const P = need(rec,"Profunctor"), EqP = need(rec,"Eq"), GenP = need(rec,"Gen");
  const f = (x:number)=>x+1, g = (y:number)=>y*2;
  return {
    subject: `${rec.name} — Profunctor`,
    laws: [
      forAll(30, GenP, (p:any)=> {
        const left = P.dimap(P.dimap(p, (c:number)=>c+1, (b:number)=>b+1), (d:number)=>d-1, (e:number)=>e-1);
        const right= P.dimap(p, (x:number)=>x, (y:number)=>y);
        return EqP(left, right) || "dimap respects identities (restricted test)";
      })
    ]
  };
}

// =========== Category / Arrow (hooks; plug your detailed ones) ===========
export function categorySuite(rec:any): Suite {
  const C = need(rec,"Category"), EqA = need(rec,"Eq");
  return {
    subject: `${rec.name} — Category`,
    laws: [
      // sanity; plug full assoc/identity suite you drafted earlier
      { name: "id ∘ id = id", run: () => {
        const id = C.id<any>();
        return EqA(C.compose(id, id), id) || "id ∘ id = id";
      }}
    ]
  };
}
