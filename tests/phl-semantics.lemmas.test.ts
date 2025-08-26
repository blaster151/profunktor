// tests/phl-semantics.lemmas.test.ts
import { wave1, wave1ViaExists, PartialFunc } from "../src/ct/partial-func";
import { Meet, Top, Bot } from "../src/semantics/subobjects";
import { checkPartialSubstitution } from "../src/semantics/phl-categorical";

// Toy carriers & partials for Set-model
const A = [0,1,2], B = ["a","b","c"];
const f: PartialFunc<number,string> = {
  defined: (x) => x % 2 === 0,
  apply:   (x) => (x===0 ? "a" : "c")
};
const g: PartialFunc<string,string> = {
  defined: (y) => y !== "b",
  apply:   (y) => y
};

test("Lemma 36(ii): f~1 distributes over ∧", () => {
  const a = (y:string)=> y==="a" || y==="c";
  const b = (y:string)=> y==="c";
  const left  = (x:number) => wave1(f, (y)=> a(y) && b(y))(x);
  const right = (x:number) => (wave1(f,a)(x) && wave1(f,b)(x));
  expect(A.every(x => left(x) === right(x))).toBe(true);
});

test("Decomposition f~1 = ∃_d ∘ m^{-1}", () => {
  // Realize d_f and m_f from f's graph over D={x|f defined}.
  const D = A.filter(f.defined);
  const incl = (d: number)=> d;           // mono d_f : D ↪ A
  const med  = (d: number)=> f.apply(d);  // m_f : D → B
  const a = (y:string)=> y==="c";
  const w1  = (x:number)=> wave1(f,a)(x);
  const w1e = (x:number)=> wave1ViaExists(incl,med,a)(x);
  expect(A.every(x => w1(x)===w1e(x))).toBe(true);
});

test("Partial-substitution rule (a3) holds in Set-model", () => {
  // Build a tiny model where functions are total over small product envs; check inclusion guard.
  const M = {
    carriers: { A, B },
    func: (sym: string) => (sym==="pair"
      ? { defined: (env)=> true, apply: (env)=> env } as any
      : { defined: (_)=> true, apply: (args)=> args[0] }),
    eq: (_s: string) => ([u,v]) => u===v
  };
  const x = (i:number)=> ({ kind:"var" as const, idx:i, sort:"A" });
  const phi = { all: [{ kind:"eq" as const, left: x(0), right: x(0) }] };
  const psi = { all: [{ kind:"eq" as const, left: x(0), right: x(0) }] };
  expect(checkPartialSubstitution(M as any, phi, psi, [x(0)])).toBe(true);
});
