// examples/meta-bridges-demo.ts
import { CartDollarT } from "../src/meta/cart-dollar-T";
import { ThOfC } from "../src/meta/th-of-C";

// Tiny toy T: one sort S, one partial op f:S⇀S, no axioms (just to show γ_* wiring)
const Cart$T = CartDollarT({
  sorts: ["S"],
  funcs: [{ name: "f", inSorts: ["S"], outSort: "S" }],
  axioms: []
});
console.log("Cart$T built with γ_S and γ_f constants:", Object.keys(Cart$T.sigma.relations).length);

// Tiny toy C: one object •, only id_• as morphism; treat id as mono; no real pullbacks
const C = {
  objects: [{ id: "•" }],
  morphisms: [{ id: "id_•", src: "•", dst: "•" }],
  monos: [{ id: "id_•", src: "•", dst: "•" }],
  pmaps: [],
  pullbacks: []
};
const ThC = ThOfC(C);
console.log("Th(C) axioms count (t,f1,f2,m1,m2,...):", ThC.axioms.length);
