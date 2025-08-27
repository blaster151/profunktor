import type { SmallCat } from "../src/catsharp/cofunctor";
import {
  type BicomoduleWitness, applyPra,
  rightCoclosure, unitOfRightCoclosure, counitOfRightCoclosure
} from "../src/catsharp/prafunctor";

const disc = (xs:string[]): SmallCat => ({ objects: xs, morphisms: xs.map(x=>({id:`id_${x}`,src:x,dst:x})) });
const C = disc(["c"]); const D = disc(["d"]); const E = disc(["e"]);

// @ : (D,E)-bicomodule; ? : (C,E)-bicomodule (all discrete for clarity)
const At: BicomoduleWitness<typeof D, typeof E> = {
  left: D, right: E,
  positionsAt: (_)=> ["α"],                                  // one op at each d
  fiberAt: (_,_u)=> ({ onObj: (_e)=> ["*","**"], onMor: (_)=> (a)=> a })
};
const Q:  BicomoduleWitness<typeof C, typeof E> = {
  left: C, right: E,
  positionsAt: (_)=> ["u","v"],
  fiberAt: (_,_u)=> ({ onObj: (_e)=> ["0","1"], onMor: (_)=> (a)=> a })
};

// Compute [@ ?] : (C,D)-bicomodule
const L = rightCoclosure(At, Q);
console.log("positions @[c]:", L.positionsAt("c"));
console.log("fiber size at 'u' then d:", L.fiberAt("c","u").onObj("d").length); // ~ Nat count proxy

// Unit & counit shape checks
const unit = unitOfRightCoclosure(At, Q);
const counit = counitOfRightCoclosure(At, { left: C, right: D, positionsAt: (_)=>["w"], fiberAt: (_,_)=> ({ onObj:(_)=>["x"], onMor:(_)=>a=>a }) });
console.log("unit.lhs positions:", unit.lhs.positionsAt("c"));
console.log("counit.lhs positions:", counit.lhs.positionsAt("c")); // shape-only
