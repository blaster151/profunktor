// src/meta/th-of-C.ts
// Build Th(C) for a small cartesian category C (objects, morphisms, monos, partial morphisms, pullbacks).
// Emits a RegularTheory with axioms (t), (f1–f2), (m1–m2), (pm1–pm2), (pb1–pb4) per the paper.
// Source: Section 9.2; Lemma 57, Lemma 58, Proposition 59.  [pp. 347–348]

import type { RegularTheory, Signature, ED, RegularAtom } from "../logic/regular-cartesian";
import { mergeTheories, totalityAxiomsFor } from "../logic/regular-cartesian";
import { Tcart } from "../logic/quasieq-cartesian-kits";

export interface Obj { id: string }
export interface Mor { id: string; src: string; dst: string }        // total morphisms
export interface Mono extends Mor {}                                 // monos
export interface PMap { id: string; domMono: string; mediates: string }   // partial m = (d_f, m_f)
export interface Pullback { id: string; // square P with legs p,q and cospan f,g
  objB: string; objC: string; objD: string;
  f: string; g: string; p: string; q: string; }

export interface SmallCart {
  objects: Obj[];
  morphisms: Mor[];          // includes identities and all needed composites
  monos: Mono[];             // subset of morphisms
  pmaps: PMap[];             // chosen partial morphisms (d_f, m_f)
  pullbacks: Pullback[];     // chosen pullback squares
}

/** Construct Th(C) as a RegularTheory in our graphs-of-functions encoding. */
export function ThOfC(C: SmallCart): RegularTheory {
  const Cart = Tcart();
  const sig: Signature = Cart.sigma;

  const v = (n:string,s:string)=>({ name:n, sort:s });
  const rel = (name:string, vars:readonly string[]) => ({ kind:"rel", rel:name, vars } as RegularAtom);
  const eq  = (l:string,r:string) => ({ kind:"eq", leftVar:l, rightVar:r } as any);
  const ED_ = (forall:any[], lhs:RegularAtom[], exists:any[], rhs:RegularAtom[], unique=false): ED =>
    ({ forall, lhs:{all:lhs}, exists, rhs:{all:rhs}, unique });

  const eds: ED[] = [];

  // A copy of total morphisms as function symbols f̄ : Ā → B̄ (here: relations R_f with ∃! y)
  const totals = C.morphisms.map(m => ({ name:`f_${m.id}`, inSorts:["arr"], outSort:"arr" })); // schematic sorts
  eds.push(...totalityAxiomsFor(totals));

  // (f1) identities behave as identity:  ⊤ ⊢ x = Id_A(x)  (schematic via R_id and equality)
  C.morphisms.filter(m => m.src===m.dst && m.id.startsWith("id")).forEach(m => {
    eds.push(ED_([v("x","arr"), v("y","arr")], [ rel(`f_${m.id}`,["x","y"]) ], [], [ eq("x","y") ]));
  });

  // (f2) functoriality: ḡ(f̄(x)) = (g∘f)(x)
  C.morphisms.forEach(f => C.morphisms
    .filter(g => g.src === f.dst)
    .forEach(g => {
      const gf = C.morphisms.find(h => h.src===f.src && h.dst===g.dst && h.id===`(${g.id}∘${f.id})`);
      if (!gf) return;
      eds.push(ED_([v("x","arr"), v("u","arr"), v("v","arr"), v("w","arr")],
        [ rel(`f_${f.id}`,["x","u"]), rel(`f_${g.id}`,["u","v"]), rel(`f_${gf.id}`,["x","w"]) ],
        [], [ eq("v","w") ]));
    }));

  // Monos and their partial inverses d̃ (m1), (m2)
  C.monos.forEach(d => {
    const dbar = `f_${d.id}`;             // (Id, d)
    const dtil = `tilde_${d.id}`;         // (d, Id) : B ⇁ A  (partial)
    // Introduce the graph for d̃ as a relation with arity [B̄, Ā]
    // (m1): ⊤ ⊢ d̃(d̄(x)) = x
    eds.push(ED_([v("x","arr"), v("u","arr"), v("y","arr")],
      [ rel(dbar,["x","u"]), rel(dtil,["u","y"]) ],
      [], [ eq("y","x") ]));
    // (m2): d̃(y)↓ ⊢ d̄(d̃(y)) = y
    eds.push(ED_([v("y","arr"), v("x","arr")],
      [ rel(dtil,["y","x"]) ],
      [], [ rel(dbar,["x","y"]) ]));
  });

  // Partial morphisms f = (d_f, m_f): (pm1) domain guard; (pm2) factorization through d̃_f then m̄_f
  C.pmaps.forEach(pm => {
    const dtil = `tilde_${pm.domMono}`;       // partial inverse of mono d_f
    const mbar = `f_${pm.mediates}`;
    const fbar = `p_${pm.id}`;                // name for this partial op's graph (arity [Ā,B̄])

    // pm1: f̄(x)↓ ⇒ d̃_f(x)↓   (encode: f̄(x,y) implies ∃x' with d̃_f(x,x'))
    eds.push(ED_([v("x","arr"), v("y","arr"), v("x1","arr")],
      [ rel(fbar,["x","y"]), rel(dtil,["x","x1"]) ],
      [], []));

    // pm2: f̄(x) = m̄_f(d̃_f(x))   (graph equality via witness chain)
    eds.push(ED_([v("x","arr"), v("y","arr"), v("x1","arr"), v("z","arr")],
      [ rel(fbar,["x","y"]), rel(dtil,["x","x1"]), rel(mbar,["x1","z"]) ],
      [], [ eq("y","z") ]));
  });

  // Pullback scheme: r_P with (pb1)-(pb4)
  C.pullbacks.forEach(P => {
    const rP = `r_${P.id}`, f=`f_${P.f}`, g=`f_${P.g}`, p=`f_${P.p}`, q=`f_${P.q}`;
    eds.push(ED_([v("x","arr"), v("y","arr"), v("z","arr")],
      [ rel(f,["x","z"]), rel(g,["y","z"]) ], [], [ rel(rP,["x","y","w"]) ])); // (pb1) domain guard ⇒ rP(x,y)↓
    eds.push(ED_([v("x","arr"), v("y","arr"), v("w","arr"), v("x1","arr"), v("y1","arr")],
      [ rel(rP,["x","y","w"]), rel(p,["w","x1"]), rel(q,["w","y1"]) ],
      [], [ eq("x1","x"), eq("y1","y") ])); // (pb2),(pb3)
    eds.push(ED_([v("z","arr"), v("x","arr"), v("y","arr")],
      [ rel(p,["z","x"]), rel(q,["z","y"]), rel(rP,["x","y","w"]) ],
      [], [ eq("z","w") ])); // (pb4)
  });

  return mergeTheories(Cart, { sigma: sig, axioms: eds });
}
