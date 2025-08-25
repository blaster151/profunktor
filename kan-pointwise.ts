// kan-pointwise.ts
import type { Category } from "./cat-core"

export interface FiniteDiagram<C extends Category> {
  objs: Array<ReturnType<C["dom"]>>
  // (we don't need nontrivial arrows for the demo; keep this total)
  mors: Array<{ dom: ReturnType<C["dom"]>; cod: ReturnType<C["dom"]>; mor: ReturnType<C["id"]> }>
}

// Abstract colimit oracle over finite diagrams (so we can plug anything in)
export interface ColimitOracle<C extends Category> {
  colim: (D: FiniteDiagram<C>) => { obj: ReturnType<C["dom"]>; injections: Array<ReturnType<C["id"]>> }
}

// Pointwise left Kan along F at object A':
// Lan_F(H)(A') := colim_{(F ↓ A')}  H ∘ π
export function pointwiseLeftKan<C extends Category>(
  C: C,
  F: { onObj: (x: any) => any; onMor: (f: any) => any },
  H: { onObj: (x: any) => any; onMor: (f: any) => any },
  buildComma: (Aprime: any) => FiniteDiagram<C>,   // builder for (F ↓ A')
  colims: ColimitOracle<C>,
  Aprime: any
): { obj: any; injections: Array<any> } {
  const comma = buildComma(Aprime)
  const Hdiag: FiniteDiagram<C> = {
    objs: comma.objs.map(H.onObj),
    mors: comma.mors.map(e => ({ dom: H.onObj(e.dom), cod: H.onObj(e.cod), mor: H.onMor(e.mor) })),
  }
  return colims.colim(Hdiag)
}
