// Map an Eff square to Cat♯ and print boundaries + witness tag.
import { cofreeComonoidOf, bicomoduleOfHandler, squareFromEff, projAfterEpsilonIsEpi } from "../src/eff/to-catsharp";
import type { Polynomial } from "../src/eff/polynomial";
import type { Handler } from "../src/eff/handler";

const Q: Polynomial = { positions:["u"], fiber:(_)=>["du"] };
const R: Polynomial = { positions:["v"], fiber:(_)=>["dv"] };
const H1: Handler = { from: Q, to: R, translate: (_)=> ({ v:"v", pull:(_)=> "du" }) };
const H2: Handler = { from: Q, to: R, translate: (_)=> ({ v:"v", pull:(_)=> "du" }) };

const cQ = cofreeComonoidOf(Q, "cQ");
const cR = cofreeComonoidOf(R, "cR");
const B  = bicomoduleOfHandler(H1, cQ, cR);
const Bp = bicomoduleOfHandler(H2, cQ, cR);

const sq = squareFromEff(cQ, cR, B, cQ, cR, Bp, "θ_demo");
console.log("Square boundaries:", sq.p.left.poly.name, "▷", sq.p.right.poly.name, "→", sq.pPrime.left.poly.name, "▷", sq.pPrime.right.poly.name);
console.log("Witness label:", sq.gamma.label);
console.log("B⊳ε is epi (3≠0)?", projAfterEpsilonIsEpi(R.positions.length>0, ["•"]));
