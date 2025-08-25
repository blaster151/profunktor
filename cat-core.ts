// cat-core.ts
// Minimal, *total* category scaffolding sufficient for pointwise Lan demos.

export type SetObj = ReadonlyArray<unknown>
export type SetMor = { dom: SetObj; cod: SetObj; f: (x: unknown) => unknown }

// A tiny category interface + a concrete "FinSet" instance.
export interface Category<O = unknown, M = unknown> {
  id: (x: O) => M
  comp: (g: M, f: M) => M
  dom: (f: M) => O
  cod: (f: M) => O
  eqMor: (f: M, g: M) => boolean
  eqObj: (a: O, b: O) => boolean
}

export interface Functor<C extends Category> {
  onObj: (x: ReturnType<C["dom"]>) => ReturnType<C["dom"]>
  onMor: (f: ReturnType<C["id"]>) => ReturnType<C["id"]>
}

// ---------- A concrete finite-sets category ----------
export const FinSet: Category<SetObj, SetMor> = {
  id: (x) => ({ dom: x, cod: x, f: (z) => z }),
  comp: (g, f) => ({ dom: f.dom, cod: g.cod, f: (z) => g.f(f.f(z)) }),
  dom: (f) => f.dom,
  cod: (f) => f.cod,
  eqMor: (f, g) =>
    f.dom.length === g.dom.length &&
    f.cod.length === g.cod.length &&
    f.dom.every((x, i) => f.f(x) === g.f(g.dom[i])),
  eqObj: (a, b) =>
    a.length === b.length && a.every((x, i) => x === b[i]),
}

// Identity functor helper
export function Id<C extends Category>(/*C: C*/): Functor<C> {
  return {
    onObj: (x: any) => x,
    onMor: (f: any) => f,
  }
}
