// examples/cartesian-kits-demo.ts
import { Kits } from "../src/kan/chase-lkan";

// Tter quick check
const T0 = Kits.Tter();
const seed0 = { sorts: { obj: ["A"], arr: [] }, relations: {} as any };
const M0 = (await import("../src/kan/chase-lkan")).freeModel(T0, seed0);
console.log("!A exists with c(!A)=top:", M0);

// Tcart: tiny sanity (pairing/project)
const Tc = Kits.Tcart();
// (Provide a seed later or rely on free model from empty seed.)

// Finitary sheaves over a 2-point lattice {0 < a}
const L = { elems: ["0","a"], leq: (x:string,y:string)=> x==="0"||x===y, meet:(x:string,y:string)=> (x==="0"||y==="0")?"0":"a", join:(x:string,y:string)=> (x==="a"||y==="a")?"a":"0"};
const Ts = Kits.Sheaf(L);
const seedS = { sorts: { X_0: [Symbol("⋆")] , X_a: [] }, relations: {} as any };
const Ms = (await import("../src/kan/chase-lkan")).freeModel(Ts, seedS);
console.log("sheaf(X_0) singleton via ∃!:", Ms.sorts["X_0"]?.length === 1);
