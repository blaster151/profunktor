// examples/free-on-graph-demo.ts
import { Tcat_signature, Tgr_signature } from "../src/logic/phl-kits";
import type { Signature, SigMorphism } from "../src/phl/sig-morphism";
import { freeLeftAdjoint } from "../src/phl/free-left-adjoint";
import type { RegularTheory } from "../src/logic/regular-cartesian";

// Pretend we already compiled T_cat into a cartesian RegularTheory (functions-as-graphs)
const Tprime: RegularTheory = /* build from your existing adapters */ {} as any;

// Σ (graphs), Σ′ (categories)
const Σ: Signature = { sorts: [...Tgr_signature().sorts], funcs: [...Tgr_signature().funcs] };
const Σp: Signature = { sorts: [...Tcat_signature().sorts], funcs: [...Tcat_signature().funcs] };

// ρ: send both sorts to themselves; d,c,id,comp kept by name (toy)
const rho: SigMorphism = {
  onSort: s => s,
  onFunc: f => f
};

// A tiny graph M
const M = {
  sigma: Σ,
  carriers: { obj: ["A","B"], arr: ["e"] },
  ops: {
    apply: (name, args) => {
      if (name === "d" && args.length === 1 && args[0] === "e") return { defined: true, value: "A" };
      if (name === "c" && args.length === 1 && args[0] === "e") return { defined: true, value: "B" };
      return { defined: false };
    }
  }
};

// Build F_ρ(M): the free category on M (unit maps each vertex/edge to its image)
const { modelPrime, unit } = freeLeftAdjoint({ sigma: Σ, sigmaPrime: Σp, rho, Tprime }, M);
console.log("η_obj(A) ⇒", unit.obj("A"));
console.log("η_arr(e) ⇒", unit.arr("e"));
