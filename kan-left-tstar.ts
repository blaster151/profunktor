// kan-left-tstar.ts
export interface FiniteDiagram<C extends Category> {
  objs: any[]                 // objects in C
  mors: Array<{ dom: any; cod: any; mor: CMor<C> }>
}

export interface ColimitOracle<C extends Category> {
  colim: (D: FiniteDiagram<C>) => { obj: any; injections: Array<CMor<C>> }
}

export function leftKanAlongTStar<C extends Category>(
  C: C,
  Tstar: { onObj: (x: any) => any; onMor: (f: any) => CMor<C> },
  Y:     { onObj: (x: any) => any; onMor: (f: any) => CMor<C> },
  commaBuilder: (A: any) => FiniteDiagram<C>,      // builds (T* ↓ A)
  colimOracle: ColimitOracle<C>,
  A: any
): { obj: any; injections: Array<CMor<C>> } {
  // Pointwise Lan_{T*} Y at A is colim over (T* ↓ A) of Y∘π
  const comma = commaBuilder(A)
  // Project to the Y-component (keep same shape; we assume π already used in builder)
  const diagram: FiniteDiagram<C> = {
    objs: comma.objs.map(Y.onObj),
    mors: comma.mors.map(e => ({ dom: Y.onObj(e.dom), cod: Y.onObj(e.cod), mor: Y.onMor(e.mor) as any }))
  }
  return colimOracle.colim(diagram)
}
