// examples/phl-demo.ts
import { defined, partialSubstitution, type Sequent, type Context, type Term } from "../src/logic/phl-sequent";

// ϕ ⊢_Ex ψ  with Ex = (x:A), Ey = (y:A)
const Ex: Context = [{ name: "x", sort: "A" }];
const Ey: Context = [{ name: "y", sort: "A" }];
const x: Term = { kind: "var", name: "x", sort: "A" };
const y: Term = { kind: "var", name: "y", sort: "A" };
const sq: Sequent = { ctx: Ex, lhs: { all: [defined(x)] }, rhs: { all: [{ kind: "eq", left: x, right: x }] } };

// Substitute Et = (y)
const out = partialSubstitution(sq, Ex, Ey, [y]);
console.log("derived sequent:", out);
