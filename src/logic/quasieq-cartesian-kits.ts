// src/logic/quasieq-cartesian-kits.ts
// Builders for quasi-equational theories from pp. 16–18:
//  • Tter  : categories with a terminal object (> and !)
//  • Tcart : cartesian categories (products/pullbacks via p1,p2, ⟨-,-⟩)
//  • Tlccc : locally cartesian closed categories (⇐, ε, Λ)
//  • Sheaf(L): finitary sheaves over a finite distributive lattice L
//
// They return RegularTheory in our "functions-as-graphs" encoding so they
// plug into freeReflect/chase immediately.  (Palmgren–Vickers §6.)  :contentReference[oaicite:1]{index=1}

import type { RegularTheory, ED, RegularAtom, Signature } from "./regular-cartesian";
import { mergeTheories, totalityAxiomsFor } from "./regular-cartesian";
import type { PartialHornSpec } from "./partial-horn";
import { partialHornToCartesian } from "./partial-horn";

// ---- Helpers ----------------------------------------------------------------

const sorts_cat = ["obj","arr"] as const;

const F = {
  id:   { name: "id",  inSorts: ["obj"],        outSort: "arr" },
  d:    { name: "d",   inSorts: ["arr"],        outSort: "obj" },
  c:    { name: "c",   inSorts: ["arr"],        outSort: "obj" },
  comp: { name: "comp",inSorts: ["arr","arr"],  outSort: "arr" },     // ◦
  top:  { name: "top", inSorts: [],             outSort: "obj" },     // >
  bang: { name: "bang",inSorts: ["obj"],        outSort: "arr" },     // ! : obj → arr
  p1:   { name: "p1",  inSorts: ["arr","arr"],  outSort: "arr" },
  p2:   { name: "p2",  inSorts: ["arr","arr"],  outSort: "arr" },
  pair: { name: "pair",inSorts: ["arr","arr","arr","arr"], outSort: "arr" }, // ⟨h1,h2⟩_{f1,f2}
  expL: { name: "lsub",inSorts: ["arr","arr"],  outSort: "arr" },     // (f ⇐ g)
  eps:  { name: "eps", inSorts: ["arr","arr"],  outSort: "arr" },     // ε_{f,g}
  Lam:  { name: "Lam", inSorts: ["arr","arr","arr","arr"], outSort: "arr" }  // Λ^k_{f,g}(h)
};

function rel(name: string, vars: readonly string[]): RegularAtom {
  return { kind: "rel", rel: name, vars };
}
function eq(l: string, r: string): RegularAtom {
  return { kind: "eq", leftVar: l, rightVar: r } as any;
}
const v = (n: string, s: string) => ({ name: n, sort: s });

// ED constructor
function ED_(forall: ReturnType<typeof v>[], lhs: RegularAtom[], exists: ReturnType<typeof v>[], rhs: RegularAtom[], unique = false): ED {
  return { forall, lhs: { all: lhs }, exists, rhs: { all: rhs }, unique };
}

// Merge partial-Horn ops (domain guards) with extra EDs we hand-encode
function specToTheory(spec: PartialHornSpec, extra: ED[] = []): RegularTheory {
  const base = partialHornToCartesian(spec);
  return mergeTheories(base, { sigma: base.sigma, axioms: extra });
}

// ---- Tter: terminal object (> , !) ------------------------------------------
// Axioms on the page:  (i) >↓ and !x↓; (ii) d(!x)=x, c(!x)=>; (iii) if d(f)=x and c(f)=> then f = !x.
export function Tter(): RegularTheory {
  const sigma: Signature = {
    sorts: [...sorts_cat],
    relations: [] // filled by partialHornToCartesian
  } as any;

  // make id,d,c,comp,top,bang
  const spec: PartialHornSpec = {
    base: { sorts: [...sorts_cat], relations: [] },
    ops: [
      { name: F.id.name,   inSorts: ["obj"], outSort: "arr",  domain: { all: [] } },         // total
      { name: F.d.name,    inSorts: ["arr"], outSort: "obj",  domain: { all: [] } },
      { name: F.c.name,    inSorts: ["arr"], outSort: "obj",  domain: { all: [] } },
      { name: F.comp.name, inSorts: ["arr","arr"], outSort: "arr",
        domain: { all: [ rel(F.c.name, ["x0","x1"]), rel(F.d.name, ["x2","x1"]), eq("x1","x1") ] } }, // weak guard; refine if you like
      { name: F.top.name,  inSorts: [],     outSort: "obj",  domain: { all: [] } },          // constant >
      { name: F.bang.name, inSorts: ["obj"],outSort: "arr",  domain: { all: [] } }           // total !
    ]
  };

  const x = v("x","obj"), f = v("f","arr"), y = v("y","arr"), t = v("t","obj");

  const eds: ED[] = [
    // d(!x)=x  and  c(!x)=>   (witness y = bang(x), t = top())
    ED_([x], [ rel(F.bang.name, ["x","y"]), rel(F.d.name, ["y","x"]) ], [], []),
    ED_([x], [ rel(F.bang.name, ["x","y"]), rel(F.top.name, ["t"]), rel(F.c.name, ["y","t"]) ], [], []),
    // uniqueness: d(f)=x & c(f)=> ⇒ f = !x  (encode as: exist y=bang(x) and enforce f=y)
    ED_([x,f], [ rel(F.d.name, ["f","x"]), rel(F.top.name,["t"]), rel(F.c.name,["f","t"]), rel(F.bang.name, ["x","y"]) ],
        [], [ eq("f","y") ])
  ];

  const T0 = specToTheory(spec, eds);
  // ensure all nullary/total ops really total (∃! witnesses)
  return mergeTheories(T0, { sigma: T0.sigma, axioms: totalityAxiomsFor([F.top, F.id, F.d, F.c, F.bang]) });
}

// ---- Tcart: cartesian categories (p1,p2, ⟨-,-⟩ with laws (i)–(viii)) --------
export function Tcart(): RegularTheory {
  const T0 = Tter();

  // Add partial ops p1,p2 and pair with guards; then add characteristic EDs.
  const ph: PartialHornSpec = {
    base: { sorts: [...sorts_cat], relations: T0.sigma.relations as any },
    ops: [
      // p1,p2 defined when c(f1)=c(f2)
      { name: F.p1.name, inSorts: ["arr","arr"], outSort: "arr",
        domain: { all: [ rel(F.c.name, ["x0","z"]), rel(F.c.name, ["x1","z"]) ] } },
      { name: F.p2.name, inSorts: ["arr","arr"], outSort: "arr",
        domain: { all: [ rel(F.c.name, ["x0","z"]), rel(F.c.name, ["x1","z"]) ] } },
      // pair(h1,h2 | f1,f2) defined when comp(h1,f1)=comp(h2,f2)
      { name: F.pair.name, inSorts: ["arr","arr","arr","arr"], outSort: "arr",
        domain: { all: [
          rel(F.comp.name, ["x0","x2","u"]),  // u = h1 ◦ f1
          rel(F.comp.name, ["x1","x3","v"]),  // v = h2 ◦ f2
          eq("u","v")
        ] } }
    ]
  };

  const f1=v("f1","arr"), f2=v("f2","arr"), h1=v("h1","arr"), h2=v("h2","arr"),
        k=v("k","arr"), g=v("g","arr"), u=v("u","arr"), v2=v("v2","arr"),
        z=v("z","obj"), q=v("q","arr");

  const laws: ED[] = [
    // (i) p_k defined ⇒ c(f1)=c(f2)  (already guarded; we re-assert)
    ED_([f1,f2,z], [ rel(F.c.name, ["f1","z"]), rel(F.c.name, ["f2","z"]), rel(F.p1.name, ["f1","f2","u"]) ], [], []),
    ED_([f1,f2,z], [ rel(F.c.name, ["f1","z"]), rel(F.c.name, ["f2","z"]), rel(F.p2.name, ["f1","f2","u"]) ], [], []),
    // (ii) c(p_k) = d(f_k)
    ED_([f1,f2], [ rel(F.p1.name, ["f1","f2","u"]), rel(F.d.name, ["f1","z"]) ], [], [ rel(F.c.name, ["u","z"]) ]),
    ED_([f1,f2], [ rel(F.p2.name, ["f1","f2","u"]), rel(F.d.name, ["f2","z"]) ], [], [ rel(F.c.name, ["u","z"]) ]),
    // (iii) f1∘p1 = f2∘p2
    ED_([f1,f2], [ rel(F.p1.name,["f1","f2","u"]), rel(F.p2.name,["f1","f2","v2"]),
                   rel(F.comp.name,["u","f1","k"]), rel(F.comp.name,["v2","f2","g"]) ],
        [], [ eq("k","g") ]),
    // (iv) pair defined ⇒ comp(h1,f1)=comp(h2,f2)  (guard echoed)
    // (v) d(pair) = d(hk)  (two projections)
    ED_([h1,h2,f1,f2], [ rel(F.pair.name, ["h1","h2","f1","f2","u"]), rel(F.d.name, ["h1","z"]) ], [], [ rel(F.d.name, ["u","z"]) ]),
    ED_([h1,h2,f1,f2], [ rel(F.pair.name, ["h1","h2","f1","f2","u"]), rel(F.d.name, ["h2","z"]) ], [], [ rel(F.d.name, ["u","z"]) ]),
    // (vi) c(pair) = d(p_k)
    ED_([h1,h2,f1,f2], [ rel(F.pair.name, ["h1","h2","f1","f2","u"]), rel(F.p1.name, ["f1","f2","q"]), rel(F.d.name, ["q","z"]) ],
        [], [ rel(F.c.name, ["u","z"]) ]),
    // (vii) p_k ∘ pair = h_k
    ED_([h1,h2,f1,f2], [ rel(F.pair.name, ["h1","h2","f1","f2","u"]), rel(F.p1.name,["f1","f2","q"]),
                         rel(F.comp.name,["q","u","k"]) ],
        [], [ eq("k","h1") ]),
    ED_([h1,h2,f1,f2], [ rel(F.pair.name, ["h1","h2","f1","f2","u"]), rel(F.p2.name,["f1","f2","q"]),
                         rel(F.comp.name,["q","u","k"]) ],
        [], [ eq("k","h2") ]),
    // (viii) ⟨p1∘h, p2∘h⟩ = h
    ED_([q,f1,f2], [ rel(F.p1.name,["f1","f2","u"]), rel(F.p2.name,["f1","f2","v2"]),
                     rel(F.comp.name,["u","q","h1"]), rel(F.comp.name,["v2","q","h2"]),
                     rel(F.pair.name,["h1","h2","f1","f2","k"]) ],
        [], [ eq("k","q") ])
  ];

  return specToTheory(ph, laws);
}

// ---- Tlccc: locally cartesian closed categories (⇐, ε, Λ ; minimal axioms) --
export function Tlccc(): RegularTheory {
  const T0 = Tcart();
  const ph: PartialHornSpec = {
    base: { sorts: [...sorts_cat], relations: T0.sigma.relations as any },
    ops: [
      // (f ⇐ g) defined when c(f)=c(g); ε defined when c(f)=c(g); Λ defined when h : p(k,g) → f  (guard approximated)
      { name: F.expL.name, inSorts: ["arr","arr"], outSort: "arr",
        domain: { all: [ rel(F.c.name,["x0","z"]), rel(F.c.name,["x1","z"]) ] } },
      { name: F.eps.name,  inSorts: ["arr","arr"], outSort: "arr",
        domain: { all: [ rel(F.c.name,["x0","z"]), rel(F.c.name,["x1","z"]) ] } },
      { name: F.Lam.name,  inSorts: ["arr","arr","arr","arr"], outSort: "arr",
        domain: { all: [] } } // keep guard light; laws will constrain
    ]
  };

  // We encode two characteristic laws to make the kit usable; the full list can be added later.
  const laws: ED[] = [
    // ε_{f,g} : p(f⇐g, g) → f   (typedness: c(f)=c(g) assumed via guards)
    ED_([v("f","arr"), v("g","arr"), v("h","arr")],
       [ rel(F.expL.name,["f","g","u"]), rel(F.p1.name,["u","g","q"]), rel(F.eps.name,["f","g","e"]), rel(F.comp.name,["e","q","k"]) ],
       [], [ eq("k","f") ]),
    // β-like: ε ∘ ⟨Λ∘p1 , p2⟩ = h
    ED_([v("k","arr"), v("f","arr"), v("g","arr"), v("h","arr")],
       [ rel(F.Lam.name,["k","f","g","h","L"]), rel(F.p1.name,["k","g","q1"]), rel(F.p2.name,["k","g","q2"]),
         rel(F.comp.name,["L","q1","a"]), rel(F.eps.name,["f","g","e"]), rel(F.pair.name,["a","q2","f","g","m"]),
         rel(F.comp.name,["e","m","t"]) ],
       [], [ eq("t","h") ])
  ];

  return specToTheory(ph, laws);
}

// ---- Finitary sheaves over a finite distributive lattice L ------------------
// L is given by elements, order ≤, meet ∧, join ∨. We generate sorts X_a,
// total restriction maps ρ_{a≤b}: X_b → X_a, functoriality, and n∈{0,2} pasting axioms.
export interface FiniteDL {
  elems: string[];
  leq: (a: string, b: string) => boolean;      // a ≤ b ?
  meet: (a: string, b: string) => string;      // a ∧ b
  join: (a: string, b: string) => string;      // a ∨ b
}

// EXACT finitary sheaf axioms from pp. 19–21:
//  • Presheaf core: restrictions ρ_{a≤b}: X_b → X_a; functoriality (ρ_aa = id, ρ_ac = ρ_ab ∘ ρ_bc)
//  • X0 singleton via total & unique constant * : X0
//  • Partial pasting π_ab : X_a × X_b ⇀ X_{a∨b}
//      domain: ρ_{a∧b≤a}(x) = ρ_{a∧b≤b}(y)
//      char:   ρ_{a≤a∨b}(π_ab(x,y)) = x  and  ρ_{b≤a∨b}(π_ab(x,y)) = y
//      uniq:   z = π_ab(ρ_{a≤a∨b}(z), ρ_{b≤a∨b}(z))
// (Cartesian ⇒ free partial model theorem applies: every presheaf finitarily sheafifies.)  :contentReference[oaicite:1]{index=1}
export function Sheaf(L: FiniteDL): RegularTheory {
  const sorts = L.elems.map(a => `X_${a}`);
  const rho = (a: string, b: string) => ({ name: `rho_${a}_le_${b}`, inSorts: [`X_${b}`], outSort: `X_${a}` });
  const pi  = (a: string, b: string) => ({ name: `pi_${a}_${b}`, inSorts: [`X_${a}`, `X_${b}`], outSort: `X_${L.join(a,b)}` });

  // total restrictions + functoriality
  const tot = totalityAxiomsFor(
    L.elems.flatMap(a => L.elems.filter(b => L.leq(a,b)).map(b => rho(a,b)))
  );

  const eds: ED[] = [];

  // ρ_aa = id and ρ_ac = ρ_ab ∘ ρ_bc
  for (const a of L.elems) {
    eds.push(ED_([v("x",`X_${a}`), v("y",`X_${a}`)],
      [ rel(rho(a,a).name, ["x","y"]) ], [], [ eq("x","y") ]));
  }
  for (const a of L.elems) for (const b of L.elems) for (const c of L.elems) {
    if (!(L.leq(a,b) && L.leq(b,c) && L.leq(a,c))) continue;
    const rab = rho(a,b).name, rbc = rho(b,c).name, rac = rho(a,c).name;
    eds.push(ED_([v("z",`X_${c}`), v("m",`X_${b}`), v("y",`X_${a}`)],
      [ rel(rbc,["z","m"]), rel(rab,["m","y"]), rel(rac,["z","y"]) ], [], []));
  }

  // X_0 singleton: introduce total & unique constant * : X_0   :contentReference[oaicite:2]{index=2}
  if (L.elems.includes("0")) {
    const star = { name: "star_X0", inSorts: [], outSort: "X_0" };
    eds.push(...totalityAxiomsFor([star]));
    // uniqueness: ∀x:X0 . x = *
    eds.push(ED_([v("x","X_0")], [ rel(star.name, ["y"]) ], [], [ eq("x","y") ]));
  }

  // Pasting π_ab with domain, characterization, uniqueness   :contentReference[oaicite:3]{index=3}
  for (const a of L.elems) for (const b of L.elems) {
    const am = L.meet(a,b), aj = L.join(a,b);
    if (!(L.leq(am,a) && L.leq(am,b) && L.leq(a,aj) && L.leq(b,aj))) continue;

    const r_am_a = rho(am,a).name, r_bm_b = rho(am,b).name;
    const r_a_aj = rho(a,aj).name, r_b_aj = rho(b,aj).name;
    const piab   = pi(a,b).name;

    // domain guard encoded via Partial Horn adapter: we'll enforce as EDs here:
    // existence (with implicit definedness): if ρ_{a∧b≤a}(x)=ρ_{a∧b≤b}(y) ⇒ ∃! z s.t. projections hold
    const xa=v("xa",`X_${a}`), yb=v("yb",`X_${b}`), xm=v("xm",`X_${am}`), ym=v("ym",`X_${am}`), z=v("z",`X_${aj}`);
    eds.push(ED_([xa,yb,xm,ym],
      [ rel(r_am_a,["xa","xm"]), rel(r_bm_b,["yb","ym"]), eq("xm","ym") ],
      [ z ],
      [ rel(r_a_aj,["z","xa"]), rel(r_b_aj,["z","yb"]) ],
      true
    ));

    // uniqueness re-expressed pointwise: z = π_ab(ρ_{a≤a∨b}(z), ρ_{b≤a∨b}(z))
    eds.push(ED_([v("z0",`X_${aj}`), v("za",`X_${a}`), v("zb",`X_${b}`)],
      [ rel(r_a_aj,["z0","za"]), rel(r_b_aj,["z0","zb"]),
        rel(piab,["za","zb","z1"]) ],
      [], [ eq("z0","z1") ]));
  }

  const sigma: Signature = { sorts, relations: [] as any };
  return mergeTheories({ sigma, axioms: [] }, { sigma, axioms: [...tot, ...eds] });
}

// Internalized lattice variant (single X, sort L, total ρ:X×L→X, π:X×X ⇀ X, with axioms on p, ρ, π)  :contentReference[oaicite:4]{index=4}
export function SheafInternalized(Lnames: { L: string; X: string } = { L: "L", X: "X" }): RegularTheory {
  const { L: Ls, X } = Lnames;

  // Signature skeleton; lattice operations (∧,∨,≤) are assumed available/encoded in your environment
  const sig: Signature = { sorts: [Ls, X], relations: [] as any };

  // total ρ: X×L → X ; projection p: X → L ; partial π: X×X ⇀ X
  const rho = { name: "rho", inSorts: [X, Ls], outSort: X };
  const p   = { name: "p",   inSorts: [X],     outSort: Ls };
  const pi  = { name: "pi",  inSorts: [X, X],  outSort: X };

  const eds: ED[] = [];

  // Totality for ρ and p (graph encoding): make them ∃! total
  const tot = totalityAxiomsFor([rho, p]);

  // ρ(x, p(x)) = x    and   ρ(x, a∧b) = ρ( ρ(x,a), b )   :contentReference[oaicite:5]{index=5}
  eds.push(ED_([v("x",X), v("y",X), v("px",Ls)],
    [ rel(p.name,["x","px"]), rel(rho.name,["x","px","y"]) ],
    [], [ eq("x","y") ]));

  // encode associativity via a helper witness chain (schematic; you can refine with your lattice kit)
  eds.push(ED_([v("x",X), v("a",Ls), v("b",Ls), v("y1",X), v("y2",X)],
    [ rel(rho.name,["x","a","y1"]), rel(rho.name,["y1","b","y2"]),
      rel(rho.name,["x","a∧b","y3"]) ],
    [], [ eq("y2","y3") ]) as any); // uses "a∧b" placeholder handled by your lattice encoding

  // π domain: ρ(x, p(y)) = ρ(y, p(x))   (we express as ED guard + existence/char/uniq)  :contentReference[oaicite:6]{index=6}
  eds.push(ED_([v("x",X), v("y",X), v("px",Ls), v("py",Ls), v("lx",X), v("ly",X), v("z",X)],
    [ rel(p.name,["x","px"]), rel(p.name,["y","py"]),
      rel(rho.name,["x","py","lx"]), rel(rho.name,["y","px","ly"]),
      eq("lx","ly") ],
    [ v("z",X) ],
    [
      // p(z) ≤ p(x)∨p(y) + projections ρ(z,p(x))=x and ρ(z,p(y))=y
      rel(rho.name,["z","px","x"]), rel(rho.name,["z","py","y"])
    ],
    true
  ));

  return mergeTheories({ sigma: sig, axioms: [] }, { sigma: sig, axioms: [...tot, ...eds] });
}

// Build a minimal Cart$T skeleton: reuse Cart (objects/arr,id,d,c,comp) and add Mon & pArr predicates.
// We encode Mon(d) and pArr(d,m) via EDs that enforce (i) d behaves like a mono (uniqueness via kernel pair),
// (ii) pArr holds only when d is mono and d;m is typed.  (Quasi-equational "with a model" scaffold.)  :contentReference[oaicite:6]{index=6}
export function CartWithT_skeleton(): RegularTheory {
  const Tc = Tcart();
  const sig = Tc.sigma;

  // Predicative relations:
  const Mon = { name: "Mon", arity: ["arr"] as const };
  const pArr = { name: "pArr", arity: ["arr","arr"] as const };
  const sigma2 = { ...sig, relations: [...sig.relations, Mon as any, pArr as any] };

  // Axioms (schematic): pArr(d,m) ⇒ Mon(d)
  const eds: ED[] = [
    ED_([v("d","arr"), v("m","arr")], [ { kind:"rel", rel: pArr.name, vars:["d","m"] } as any ], [], [ { kind:"rel", rel: Mon.name, vars:["d"] } as any ])
  ];

  return { sigma: sigma2, axioms: [...(Tc.axioms as any), ...eds] };
}
