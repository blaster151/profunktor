// graphical.ts
export interface Corolla<I extends string> {
  out: I
  in: I[]         // ordered list of input colours
  label?: string  // optional name (e.g., b ∈ B)
}

export interface BiCorolla<I extends string> {
  left: Corolla<I>   // e.g., b(b1, b2, …)
  right: Corolla<I>  // result op after "contracting" inner edges
}

// Deterministic "typing" checks (no throws)
export function isWellTypedCorolla<I extends string>(c: Corolla<I>): boolean {
  return c.in.every((i) => typeof i === "string") && typeof c.out === "string"
}
export function composeAsBiCorolla<I extends string>(
  f: Corolla<I>, gs: ReadonlyArray<Corolla<I>>
): BiCorolla<I> {
  const inputs = f.in.flatMap((_, j) => gs[j]?.in ?? [])
  const out = f.out
  return { left: { out, in: inputs, label: `${f.label}∘…` }, right: { out, in: inputs } }
}
