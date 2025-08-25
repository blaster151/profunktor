// file: t-left-adjoint.ts
import { leftKanAlongTStar } from "./kan-left-tstar"
import { ColimitOracle } from "./kan-left-tstar"
import type { SymMonCat } from "./poly-algebras"

export function gammaLeftAdjoint<I extends string, E extends SymMonCat>(
  Ecat: E,
  TS_objects: Record<I, unknown[]>,                 // finite: objects of 𝕋^S_i
  hatX: (b: unknown) => E["unit"],                  // Ẋ(b): object of E
  colim: ColimitOracle<any>,
): Record<I, E["unit"]> {
  const out = {} as Record<I, E["unit"]>
  for (const i in TS_objects) {
    const objs = TS_objects[i as I]
    const diagram = { objs: objs.map(hatX), mors: [] as any[] }
    out[i as I] = colim.colim(diagram).obj
  }
  return out
}
