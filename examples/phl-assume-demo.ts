// examples/phl-assume-demo.ts
import { freshConstantNames } from "../src/logic/phl-sequent";
import type { Sequent, Context, Term } from "../src/logic/phl-sequent";
import { parameterizeWithFreshConstants, assumeClosed } from "../src/logic/phl-assume";

// Example sequent ϕ ⊢_Ez ψ with Ez = (z:A, w:B)
const Ez: Context = [{ name: "z", sort: "A" }, { name: "w", sort: "B" }];
const x: Term = { kind: "var", name: "z", sort: "A" };
const y: Term = { kind: "var", name: "w", sort: "B" };

const sq: Sequent = {
  ctx: Ez,
  lhs: { all: [{ kind: "eq", left: x, right: x }] },
  rhs: { all: [{ kind: "eq", left: y, right: y }] }
};

const names = freshConstantNames(Ez, "c");
const { sequent, closedAxioms } = parameterizeWithFreshConstants(Ez, names, sq);
console.log("closed axioms (Ec↓, φ(Ec/Ez)):", closedAxioms);
console.log("rewritten sequent (closed ctx):", sequent);

// Closed-assumption trick: inline a closed Horn θ into the antecedent
const theta = { atoms: [{ pred: "T", args: [] }] } as const;
const sq2 = assumeClosed(theta, sequent);
console.log("with θ assumed in antecedent:", sq2);
