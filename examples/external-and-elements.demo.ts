// examples/external-and-elements.demo.ts
import { prod } from "../src/catsharp/duoidal";
import type { SmallCat } from "../src/catsharp/cofunctor";
import { representable, externalProduct, deltaFBicomodule, applyPra } from "../src/catsharp/prafunctor";
import { graphOfElements } from "../src/catsharp/graphs";

// Discrete C,D for clarity
const disc = (xs:string[]): SmallCat => ({ objects: xs, morphisms: xs.map(x => ({ id:`id_${x}`, src:x, dst:x })) });
const C = disc(["c0","c1"]);
const D = disc(["d0"]);
const CxD = prod(C, D);

// External product F ⊠ G on C ⊗ D
const F = representable(C, "c0");
const G = representable(D, "d0");
const FxG = externalProduct(C, D, F, G);
console.log("⊠ at ⟨c0,d0⟩:", FxG.onObj("⟨c0,d0⟩")); // pairs of Hom-choices (labels)
console.log("⊠ at ⟨c1,d0⟩:", FxG.onObj("⟨c1,d0⟩"));

// Δ_F bicomodule for a functor F:C→D (object map only here)
const Fobj = (_x:string) => "d0";
const ΔF = deltaFBicomodule(C, D, Fobj);

// Apply prafunctor of ΔF to a D-copresheaf to get a C-copresheaf, then take graph of elements
const Gset = representable(D, "d0");
const Phi = applyPra(C, D, ΔF, Gset);
console.log("Φ(G) at c0:", Phi.onObj("c0"));

// Graph of elements for a C-copresheaf
const Gelems = graphOfElements(C, Phi);
console.log("#vertices:", Gelems.vertices.length, "#edges:", Gelems.edges.length);
