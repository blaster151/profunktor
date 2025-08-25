// examples/exact-lan-smoke.ts
import { preservesPointwiseLanUnderExactSquare, type ExactSquare, type Functor } from "../exact-squares"
import type { Category } from "../cat-core"
import type { FiniteDiagram, ColimitOracle } from "../kan-pointwise"

// Local toy category implementing *your* Category interface (kept *inside* the example).
type Obj = ReadonlyArray<unknown>
type Mor = { dom: Obj; cod: Obj; f: (x: unknown) => unknown }
const ToySet: Category<Obj, Mor> = {
  id: (x) => ({ dom: x, cod: x, f: (z) => z }),
  comp: (g, f) => ({ dom: f.dom, cod: g.cod, f: (z) => g.f(f.f(z)) }),
  dom: (f) => f.dom,
  cod: (f) => f.cod,
  eqMor: (f, g) =>
    f.dom.length === g.dom.length &&
    f.cod.length === g.cod.length &&
    f.dom.every((x, i) => f.f(x) === g.f(g.dom[i])),
  eqObj: (a, b) => a.length === b.length && a.every((x, i) => x === b[i]),
}

// Identity functor (again, local to the example)
const Id: Functor<typeof ToySet> = { onObj: (x) => x, onMor: (f) => f }

// Exact square: everything identity; witness reason = "pullback-square"
const sq: ExactSquare<typeof ToySet> = {
  X: ToySet, Xp: ToySet, Y: ToySet, Yp: ToySet,
  top: Id, left: Id, right: Id, bot: Id,
  reason: "pullback-square",
}

// Discrete 2-object comma categories (same for top/bot in this toy)
const buildComma = (_: any): FiniteDiagram<typeof ToySet> => ({
  objs: [ [1, 2], ["x", "y", "z"] ],
  mors: [],
})

// Colimit oracle: "disjoint union" = concat. Keeps injections for shape completeness.
const colims: ColimitOracle<typeof ToySet> = {
  colim: (D) => {
    const obj = (D.objs[0] as any[]).concat(D.objs[1] as any[])
    const inj1 = ToySet.id(D.objs[0]); const inj2 = ToySet.id(D.objs[1])
    return { obj, injections: [inj1 as any, inj2 as any] }
  }
}

// H over X and transported H over Y (identical in the toy case)
const H = { onObj: (x: any) => x, onMor: (f: any) => f }
const Hleft = H

const res = preservesPointwiseLanUnderExactSquare(
  sq,
  buildComma, buildComma,
  H, Hleft,
  colims, colims,
  /*A'*/ ["•"],
  (u, v) => JSON.stringify(u) === JSON.stringify(v)
)

console.log("Preserves pointwise Lan under exact square?", res) // -> { ok: true }
