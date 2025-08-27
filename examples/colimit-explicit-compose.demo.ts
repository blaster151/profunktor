// examples/colimit-explicit-compose.demo.ts
import { explicitColimitC } from "../src/cat/colimit-explicit";
import type { DiagramCat, SmallCategory } from "../src/cat/zigzag-colimit";
import type { DecoratedLR } from "../src/cat/double-zigzag";

// Tiny span J: k→i, k→j and a "jump" j→j′ in J so [(j,b)] might differ from [(j′,b′)] even with same class.
const K: SmallCategory = { name:"K", objects:["x"], morphisms:[] };
const I: SmallCategory = { name:"I", objects:["a"], morphisms:[] };
const J0: SmallCategory = { name:"J", objects:["b"], morphisms:[] };
const J1: SmallCategory = { name:"J'", objects:["b'"], morphisms:[] };

const J = {
  objects:["k","i","j","j'"],
  arrows:[
    {id:"l", src:"k", dst:"i"},
    {id:"r", src:"k", dst:"j"},
    {id:"t", src:"j", dst:"j'"} // transports b ↦ b'
  ]
};

const diag: DiagramCat = {
  J,
  C: { k: K, i: I, j: J0, "j'": J1 },
  F: {
    l: { id:"l", src:"k", dst:"i", onObj: (_:string)=>"a", onMor: (m:any)=>m },
    r: { id:"r", src:"k", dst:"j", onObj: (_:string)=>"b", onMor: (m:any)=>m },
    t: { id:"t", src:"j", dst:"j'", onObj: (_b:string)=>"b'", onMor: (m:any)=>m }
  } as any
};

const C = explicitColimitC<{id:string},{id:string;src:any;dst:any}>(diag);
const idIn = (_i:string,_a:{id:string}) => ({ id:"id", src:_a, dst:_a });

const lr1: DecoratedLR<string,{id:string},{id:string;src:any;dst:any}> = {
  i:"i", j:"j", k:"k", lId:"l", rId:"r",
  a:{id:"a"}, a1:{id:"x"}, b:{id:"b"},
  f0:{id:"f0", src:{id:"a"}, dst:{id:"a"}}, f1:{id:"id_b", src:{id:"b"}, dst:{id:"b"}}
};
const lr2: DecoratedLR<string,{id:string},{id:string;src:any;dst:any}> = {
  i:"j'", j:"j'", k:"j'", lId:"id", rId:"id",
  a:{id:"b'"}, a1:{id:"b'"}, b:{id:"b'"},
  f0:{id:"g", src:{id:"b'"}, dst:{id:"b'"}}, f1:{id:"id_b'", src:{id:"b'"}, dst:{id:"b'"}}
};

const m1 = C.mkMor("i","a","j","b", lr1);
const m2 = C.mkMor("j'","b'","j'","b'", lr2);

// Compose with an ObF bridge from (j,b) to (j',b')
const composed = C.compose(m2, m1, {
  ObF: {
    Ob: { k:["x"], i:["a"], j:["b"], "j'":["b'"] },
    uObj: {
      l: (_:"x")=>"a",
      r: (_:"x")=>"b",
      t: (_:"b")=>"b'"
    }
  },
  idIn
});

console.log("src,dst:", composed.src, composed.dst);
console.log("bead count after bridge insert:", composed.dec.lrChain.length);
