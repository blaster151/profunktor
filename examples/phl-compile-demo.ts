// examples/phl-compile-demo.ts
import { quasiEquationalize, type PHLHornTheory } from "../src/phl/quasi-equationalize";

const T: PHLHornTheory = {
  sigma: {
    sorts: ["A","B"],
    funcs: [{ name: "f", inSorts: ["A"], outSort: "B" }],
    preds: [{ name: "R", argSorts: ["A","B"] }]
  },
  axioms: [
    { forall: [{name:"x",sort:"A"},{name:"y",sort:"B"}], lhs: "R(x,y)", rhs: "true" }
  ]
};

console.log(quasiEquationalize(T)); // predicates become f_R(...):U with definedness guards
