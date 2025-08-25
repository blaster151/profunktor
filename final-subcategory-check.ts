// final-subcategory-check.ts
import { applyGen, Gen, CorollaObj } from "./tfg-classifier-presentation"

export type ObjId = string
export interface SmallCat {
  objs: CorollaObj[]
  gensFrom: (c: CorollaObj) => Gen[]   // enumerate one-step generators from c
}

export interface FinalWitness {
  // one distinguished terminal per connected component
  terminalOf: (compId: string) => CorollaObj
  compIdOf: (c: CorollaObj) => string
}

// BFS reachability to the chosen terminal in the same component
export function hasArrowToTerminal(cat: SmallCat, wit: FinalWitness, start: CorollaObj): boolean {
  const target = wit.terminalOf(wit.compIdOf(start))
  const key = (c: CorollaObj) => `${c.opId}|${c.inColours.join("")}`
  const seen = new Set<string>()
  const q: CorollaObj[] = [start]
  const limit = 2000
  while (q.length && seen.size < limit) {
    const x = q.shift()!
    if (key(x) === key(target)) return true
    if (seen.has(key(x))) continue
    seen.add(key(x))
    // expand by applying all one-step gens
    for (const g of cat.gensFrom(x)) q.push(applyGen(x, g))
  }
  return key(start) === key(target) // trivial hit if already terminal
}

// The discrete-final-subcategory test (Lemma 7.6 (ii)):
// pick exactly one terminal per component and ensure every object reaches it.
export function isCoproductOfCatsWithTerminal(cat: SmallCat, wit: FinalWitness): { ok: true } | { ok: false; offenders: CorollaObj[] } {
  const offenders = cat.objs.filter(o => !hasArrowToTerminal(cat, wit, o))
  return offenders.length === 0 ? { ok: true } : { ok: false, offenders }
}
