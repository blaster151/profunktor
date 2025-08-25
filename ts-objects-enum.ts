// file: ts-objects-enum.ts
import { Corolla } from "./graphical"
export function enumerateTSObjects<J extends string, I extends string>(
  B_ops: ReadonlyArray<{ out: I; in: I[] }>,
  jColourings: ReadonlyArray<ReadonlyArray<J>>,
  phi: (j:J)=>I
): ReadonlyArray<{ op: {out:I;in:I[]}, j: ReadonlyArray<J> }> {
  const objs: any[] = []
  for (const b of B_ops) for (const jl of jColourings)
    if (JSON.stringify(b.in) === JSON.stringify(jl.map(phi))) objs.push({ op: b, j: jl })
  return objs
}
