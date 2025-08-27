/* @jest-environment node */
import { explicitColimitC } from "../src/cat/colimit-explicit";
import type { DiagramCat, SmallCategory } from "../src/cat/zigzag-colimit";
import type { DecoratedLR, RhoGen } from "../src/cat/double-zigzag";

// Tiny span K→I, K→J (pushout shape)
const K: SmallCategory = { name:"K", objects:["x"], morphisms:[] };
const I: SmallCategory = { name:"I", objects:["a"], morphisms:[] };
const J: SmallCategory = { name:"J", objects:["b"], morphisms:[] };
const diag: DiagramCat = {
  J: { objects:["k","i","j"], arrows:[{id:"l",src:"k",dst:"i"},{id:"r",src:"k",dst:"j"}] },
  C: { k: K, i: I, j: J },
  F: {
    l: { id:"l", src:"k", dst:"i", onObj: (_:string)=>"a", onMor: (m:any)=>m },
    r: { id:"r", src:"k", dst:"j", onObj: (_:string)=>"b", onMor: (m:any)=>m }
  } as any
};
const C = explicitColimitC<{id:string},{id:string;src:any;dst:any}>(diag);
const idIn = (_i:string,_a:{id:string}) => ({ id:"id", src:_a, dst:_a });
const Flookup = (_:string)=>({ onObj:<T>(o:T)=>o, onMor:<M>(m:M)=>m });
const composeInApex = (m2:{id:string},m1:{id:string}) => ({ id:`${m2.id}∘${m1.id}`, src:m1.src, dst:m2.dst });

describe("explicit colimit category: identity and associativity", () => {
  test("identity laws: id ∘ f = f = f ∘ id", () => {
    const lr: DecoratedLR<string,{id:string},{id:string;src:any;dst:any}> = {
      i:"i", j:"j", k:"k", lId:"l", rId:"r",
      a:{id:"a"}, a1:{id:"x"}, b:{id:"b"},
      f0:{id:"f0", src:{id:"a"}, dst:{id:"a"}}, f1:{id:"id_b", src:{id:"b"}, dst:{id:"b"}}
    };
    const f = C.mkMor("i","a","j","b", lr);
    const id_a = C.id("i","a", idIn);
    const id_b = C.id("j","b", idIn);

    // Compose with ObF bridge
    const leftId = C.compose(f, id_a, {
      ObF: { Ob: { k:["x"], i:["a"], j:["b"] }, uObj: { l: (_:"x")=>"a", r: (_:"x")=>"b" } },
      idIn
    });
    const rightId = C.compose(id_b, f, {
      ObF: { Ob: { k:["x"], i:["a"], j:["b"] }, uObj: { l: (_:"x")=>"a", r: (_:"x")=>"b" } },
      idIn
    });

    // Check equality modulo normalization
    expect(C.equalModulo(Flookup, [], composeInApex, leftId, f)).toBe(true);
    expect(C.equalModulo(Flookup, [], composeInApex, rightId, f)).toBe(true);
  });

  test("associativity: (h ∘ g) ∘ f = h ∘ (g ∘ f)", () => {
    const lr1: DecoratedLR<string,{id:string},{id:string;src:any;dst:any}> = {
      i:"i", j:"j", k:"k", lId:"l", rId:"r",
      a:{id:"a"}, a1:{id:"x"}, b:{id:"b"},
      f0:{id:"f0", src:{id:"a"}, dst:{id:"a"}}, f1:{id:"id_b", src:{id:"b"}, dst:{id:"b"}}
    };
    const lr2: DecoratedLR<string,{id:string},{id:string;src:any;dst:any}> = {
      i:"j", j:"j", k:"j", lId:"id", rId:"id",
      a:{id:"b"}, a1:{id:"b"}, b:{id:"b"},
      f0:{id:"g", src:{id:"b"}, dst:{id:"b"}}, f1:{id:"id_b", src:{id:"b"}, dst:{id:"b"}}
    };
    const lr3: DecoratedLR<string,{id:string},{id:string;src:any;dst:any}> = {
      i:"j", j:"j", k:"j", lId:"id", rId:"id",
      a:{id:"b"}, a1:{id:"b"}, b:{id:"b"},
      f0:{id:"h", src:{id:"b"}, dst:{id:"b"}}, f1:{id:"id_b", src:{id:"b"}, dst:{id:"b"}}
    };

    const f = C.mkMor("i","a","j","b", lr1);
    const g = C.mkMor("j","b","j","b", lr2);
    const h = C.mkMor("j","b","j","b", lr3);

    const ObF = { Ob: { k:["x"], i:["a"], j:["b"] }, uObj: { l: (_:"x")=>"a", r: (_:"x")=>"b" } };

    // Left association: (h ∘ g) ∘ f
    const hg = C.compose(h, g, { ObF, idIn });
    const leftAssoc = C.compose(hg, f, { ObF, idIn });

    // Right association: h ∘ (g ∘ f)
    const gf = C.compose(g, f, { ObF, idIn });
    const rightAssoc = C.compose(h, gf, { ObF, idIn });

    // Check associativity
    expect(C.equalModulo(Flookup, [], composeInApex, leftAssoc, rightAssoc)).toBe(true);
  });
});
