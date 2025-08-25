// tfg-classifier-presentation.ts
export type EdgeColour = "X" | "K" | "L"

export interface CorollaObj {
  opId: string           // label for the underlying b ∈ B = T(1)
  inColours: EdgeColour[]// incoming edge colours (one per input slot)
}

// Generators acting on a *specific* K-edge slot
export type GenKind = "T2" | "F" | "G"
export interface Gen {
  kind: GenKind
  idx: number            // which input edge is targeted
  note?: string          // optional provenance/debug
}

// Apply a generator to a corolla (total; no throws)
export function applyGen(c: CorollaObj, g: Gen): CorollaObj {
  const next = { ...c, inColours: [...c.inColours] }
  if (g.kind === "F" && next.inColours[g.idx] === "K") next.inColours[g.idx] = "L"
  else if (g.kind === "G" && next.inColours[g.idx] === "K") next.inColours[g.idx] = "X"
  // T2 acts on X-structure; at shape level we keep colours unchanged
  return next
}

// Word application
export function applyWord(c: CorollaObj, w: Gen[]): CorollaObj {
  return w.reduce(applyGen, c)
}

// Commutation (21): when F and the T+2-part act on disjoint slots we can swap
// and update indices if needed. Here: T2 is colour-preserving ⇒ just swap.
export function swapIfCommutable(a: Gen, b: Gen): [Gen, Gen] {
  if (a.kind === "T2" && (b.kind === "F" || b.kind === "G")) return [b, a]
  if ((a.kind === "F" || a.kind === "G") && b.kind === "T2") return [b, a]
  // F vs G on *distinct* indices commute (p.49, eq. 22 in the easy case)
  if ((a.kind === "F" && b.kind === "G" || a.kind === "G" && b.kind === "F") && a.idx !== b.idx) {
    return [b, a]
  }
  return [a, b]
}

// Normalize a word to canonical order: all T2 first, then all F, then all G,
// using local swaps from the commuting squares.
export function normalizeWord(w: Gen[]): Gen[] {
  const arr = [...w]
  let moved = true
  while (moved) {
    moved = false
    for (let i = 0; i+1 < arr.length; i++) {
      const [x,y] = swapIfCommutable(arr[i], arr[i+1])
      if (x !== arr[i]) { arr[i] = x; arr[i+1] = y; moved = true }
    }
  }
  return arr
}

// Tiny check: if F and G target distinct slots, order doesn't matter.
export function checkFGCommuteDistinctSlots(c: CorollaObj, iF: number, iG: number): boolean {
  const wFG: Gen[] = [{kind:"F", idx:iF}, {kind:"G", idx:iG}]
  const wGF: Gen[] = [{kind:"G", idx:iG}, {kind:"F", idx:iF}]
  const a = applyWord(c, normalizeWord(wFG))
  const b = applyWord(c, normalizeWord(wGF))
  return JSON.stringify(a) === JSON.stringify(b)
}
