// file: tstar-action.ts
export type JColouring<J extends string> = ReadonlyArray<J>
export function pushColouring<J extends string, I extends string>(
  jlist: JColouring<J>, phi: (j: J) => I
): ReadonlyArray<I> { return jlist.map(phi) }

export function TstarOnOp<J extends string, I extends string>(
  b: { out: I, in: ReadonlyArray<I> },        // target colour in I
  jInputs: JColouring<J>,                     // J-colouring of sources
  phi: (j: J) => I
): { out: I, in: ReadonlyArray<I> } {
  return { out: b.out, in: pushColouring(jInputs, phi) }
}
