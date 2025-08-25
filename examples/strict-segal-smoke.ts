// examples/strict-segal-smoke.ts
import { isStrictSegalObject, nerve } from "../cat-internal"
import { Category, InternalCategory } from "../cat-internal"

// Finite-Set base category (objects = arrays, morphisms = total functions + dom/cod)
type SetObj = ReadonlyArray<unknown>
type Fn = { dom: SetObj; cod: SetObj; f: (x: unknown) => unknown }
const SetCat: Category<SetObj, Fn> = {
  id: (x) => ({ dom: x, cod: x, f: (a) => a }),
  comp: (g, f) => ({ dom: f.dom, cod: g.cod, f: (a) => g.f(f.f(a)) }),
  dom: (f) => f.dom, cod: (f) => f.cod,
  product: (a, b) => a.flatMap((x) => b.map((y) => [x, y] as const)),
  pullback: (f, g) => {
    const obj = f.dom.flatMap((x) => g.dom.map((y) => [x, y] as const))
      .filter(([x, y]) => SetCat.eqObj([f.f(x)], [g.f(y)]))
    // projections
    const π1: Fn = { dom: obj, cod: f.dom, f: ([x]) => x }
    const π2: Fn = { dom: obj, cod: g.dom, f: ([, y]) => y }
    return { obj, π1, π2 }
  },
  eqMor: (f, g) => f.dom.length === g.dom.length &&
    f.dom.every((x, i) => f.f(x) === g.f(g.dom[i])),
  eqObj: (a, b) => a.length === b.length && a.every((x, i) => x === b[i]),
}

// Internal category in Set: one object •, only id arrows
const C0: SetObj = [Symbol.for("•")]
type Arrow = { src: unknown; dst: unknown } // only identities
const C1: ReadonlyArray<Arrow> = [{ src: C0[0], dst: C0[0] }]
const s: Fn = { dom: C1, cod: C0, f: (a) => (a as Arrow).src }
const t: Fn = { dom: C1, cod: C0, f: (a) => (a as Arrow).dst }
const i: Fn = { dom: C0, cod: C1, f: (x) => ({ src: x, dst: x }) }
const pb = SetCat.pullback(t, s)
const m: Fn = { dom: pb.obj, cod: C1, f: () => C1[0] } // id ∘ id = id

const I: InternalCategory<typeof SetCat> = { C: SetCat, C0, C1, s, t, i, m, compPB: pb }

// Build nerve and check "strict Segal" up to n=3 (iso oracle = identity check)
void nerve(I)
console.log("Strict Segal (n≤3)?", isStrictSegalObject(I, () => true, 3))
