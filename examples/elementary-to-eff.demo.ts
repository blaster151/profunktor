// Demo: elementary successor handler on ℕ (finite window), lift to Effects and Cat♯.
import type { Polynomial } from "../src/eff/polynomial";
import { identityElementary, composeElementary, toEffectsHandler } from "../src/eff/elementary";
import { elementaryToCatSharp } from "../src/eff/elementary-to-catsharp";

// Tiny ℕ-window polynomials (positions = {"0","1","2"}, directions irrelevant for this demo)
const N3: Polynomial = { positions: ["0","1","2"], fiber: (_)=> ["*"] };

// Elementary "successor": !(n) = n+1 (clamp at top) and pull is identity on directions.
const succ = {
  from: N3, to: N3, carrier: N3,
  onPos: (u: string) => (u === "0" ? "1" : u === "1" ? "2" : "2"),
  pull: (d: string) => d
};

const idN = identityElementary(N3);
const twice = composeElementary(succ, succ); // approx: min(n+2, 2)

// Effects-level reification
const H_succ = toEffectsHandler(succ);
console.log("translate('0') →", H_succ.translate("0").v); // "1"
console.log("translate('1') →", H_succ.translate("1").v); // "2"

// Lift to Cat♯ via c−
const B_succ = elementaryToCatSharp(succ);
console.log("Cat♯ boundaries:", B_succ.bicomodule.left.poly.name, "▷", B_succ.bicomodule.right.poly.name);
console.log("Cat♯ carrier tag:", (B_succ.bicomodule as any).carrier.name);
