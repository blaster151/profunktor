// examples/tfg-final-smoke.ts
import { CorollaObj, checkFGCommuteDistinctSlots, Gen } from "../tfg-classifier-presentation"
import { isCoproductOfCatsWithTerminal, type SmallCat, type FinalWitness } from "../final-subcategory-check"

const c0: CorollaObj = { opId: "b", inColours: ["K","K","X"] } // two K-edges at slots 0,1

console.log("F/G commute on distinct slots?",
  checkFGCommuteDistinctSlots(c0, /*iF*/0, /*iG*/1))

// Build a tiny component: vary K→L at any slot (Gens are all F-steps on K slots)
const objs: CorollaObj[] = [
  c0,
  { opId: "b", inColours: ["L","K","X"] },
  { opId: "b", inColours: ["K","L","X"] },
  { opId: "b", inColours: ["L","L","X"] }, // terminal candidate (no K)
]
const cat: SmallCat = {
  objs,
  gensFrom: (c) =>
    c.inColours.flatMap((col, idx) => col === "K" ? [{ kind: "F", idx } as Gen] : []),
}
const wit: FinalWitness = {
  compIdOf: (c) => c.opId,                           // same opId ⇒ same component
  terminalOf: (_id) => ({ opId: "b", inColours: ["L","L","X"] }),
}

console.log("Final-subcategory (coproduct of cats with terminal)?",
  isCoproductOfCatsWithTerminal(cat, wit))
