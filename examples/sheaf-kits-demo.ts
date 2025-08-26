// examples/sheaf-kits-demo.ts
import { Sheaf, SheafInternalized } from "../src/logic/quasieq-cartesian-kits";
import { freeReflect } from "../src/logic/chase";

// tiny lattice {0 < a < b}, with ∧, ∨
const L = {
  elems: ["0","a","b"],
  leq: (x:string,y:string)=> x===y || x==="0" || (x==="a" && y==="b"),
  meet:(x:string,y:string)=> (x==="0"||y==="0")?"0":(x==="a"&&y==="b"||x==="b"&&y==="a"?"a":"b"),
  join:(x:string,y:string)=> (x==="b"||y==="b")?"b":(x==="a"||y==="a"?"a":"0")
};

// Externalized version
const T = Sheaf(L);
const seed = { sorts: { X_0: [Symbol("*")], X_a: [], X_b: [] }, relations: {} as any };
const M = freeReflect(T, seed);
console.log("X_0 singleton?", (M.sorts["X_0"] ?? []).length === 1);

// Internalized variant
const Tint = SheafInternalized();
const seed2 = { sorts: { X: [], L: [] }, relations: {} as any };
void freeReflect(Tint, seed2);
