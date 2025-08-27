// src/catsharp/prafunctor.ts
// Parametric right adjoint (prafunctor) evaluator from a (C,D)-bicomodule witness.
// We implement the *objectwise* formula: Φ(G)_x = ⨿_{u∈?(1)_x} Nat( ?[u], G ).
// Arrow-action can be added once you feed the bicomodule's left coaction maps.  :contentReference[oaicite:4]{index=4}

import type { SmallCat, Morph, Obj } from "./cofunctor";

// -------- Copresheaves on a small category C (functors C → Set) ----------------
export interface Copresheaf<C extends SmallCat = SmallCat> {
  onObj: (x: Obj) => string[];         // finite sets as string labels
  onMor: (m: Morph) => (a: string) => string;
}

export function natTransformations<C extends SmallCat>(
  C: C,
  F: Copresheaf<C>,
  G: Copresheaf<C>,
  cap = 2000 // guard
): Array<Record<Obj, (a: string) => string>> {
  // Enumerate all objectwise functions α_x : F(x)→G(x) and filter by naturality G(f)∘α_x = α_y∘F(f).
  // Exponential in general; fine for tiny test categories/sets.
  const objs = C.objects;
  // Precompute all function tables per object
  const funsPerObj = new Map<Obj, Array<(a: string) => string>>();
  for (const x of objs) {
    const dom = F.onObj(x), cod = G.onObj(x);
    const funcs: Array<(a: string) => string> = [];
    const choices = cod;
    // generate all functions dom→cod
    const idxs = new Array(dom.length).fill(0);
    const total = Math.pow(choices.length, dom.length);
    for (let t = 0; t < total && funcs.length < cap; t++) {
      const table = new Map(dom.map((d, i) => [d, choices[idxs[i]]] as const));
      funcs.push((a: string) => table.get(a)!);
      // increment mixed radix
      for (let i = 0; i < dom.length; i++) {
        idxs[i]++; if (idxs[i] < choices.length) break; idxs[i] = 0;
      }
    }
    funsPerObj.set(x, funcs);
  }

  // product of choices with naturality filter
  const results: Array<Record<Obj, (a: string) => string>> = [];
  function backtrack(i: number, acc: Record<Obj, (a: string) => string>) {
    if (results.length >= cap) return;
    if (i === objs.length) {
      // check naturality on all morphisms
      for (const m of C.morphisms) {
        const lhs = (a: string) => G.onMor(m)(acc[m.src]!(a));
        const rhs = (a: string) => acc[m.dst]!(F.onMor(m)(a));
        // quick check on representatives
        for (const a0 of F.onObj(m.src)) if (lhs(a0) !== rhs(a0)) return;
      }
      results.push({ ...acc });
      return;
    }
    const x = objs[i];
    const funcs = funsPerObj.get(x);
    if (funcs) {
      for (const f of funcs) {
        acc[x] = f;
        backtrack(i + 1, acc);
      }
    }
  }
  backtrack(0, {});
  return results;
}

// -------- Bicomodule witness (just enough for objectwise Φ(G)) -----------------
export interface BicomoduleWitness<Left extends SmallCat, Right extends SmallCat> {
  left: Left;               // C
  right: Right;             // D
  // positions functor ?(1) : C → Set (object-part only; arrow maps optional for now)
  positionsAt: (x: Obj) => string[]; // positions at x
  // for each *position* u over x, a D-copresheaf ?[u] : D → Set
  fiberAt: (x: Obj, u: string) => Copresheaf<Right>;
}

/** Evaluate the prafunctor Φ: D-Set → C-Set on G (objectwise). */
export function applyPra<Left extends SmallCat, Right extends SmallCat>(
  C: Left,
  D: Right,
  P: BicomoduleWitness<Left, Right>,
  G: Copresheaf<Right>,
  cap = 2000
): Copresheaf<Left> {
  return {
    onObj: (x: Obj) => {
      const U = P.positionsAt(x);
      const parts: string[] = [];
      for (const u of U) {
        const Bu = P.fiberAt(x, u);
        const homs = natTransformations(D, Bu, G, cap);
        // tag each natural transformation by a stable label
        homs.forEach((alpha, k) => parts.push(`${u}#nat${k}`));
      }
      return parts;
    },
    onMor: (_m: Morph) => (a: string) => a // TODO: add arrow action via left coaction when you need it
  };
}

/** Representable copresheaf y(x) for object x in category C. */
export function representable<C extends SmallCat>(C: C, x: string): Copresheaf<C> {
  return {
    onObj: (y: string) => {
      // y(x)(y) = C(x,y) - the set of morphisms from x to y
      return C.morphisms
        .filter(m => m.src === x && m.dst === y)
        .map(m => m.id);
    },
    onMor: (m: { id: string; src: string; dst: string }) => (f: string) => {
      // y(x)(m): y(x)(src) → y(x)(dst) by post-composition
      // For now, return identity (proper implementation would compose)
      return f;
    }
  };
}

/** External product F ⊠ G on C ⊗ D */
export function externalProduct<C extends SmallCat, D extends SmallCat>(
  C: C,
  D: D,
  F: Copresheaf<C>,
  G: Copresheaf<D>
): Copresheaf<{ objects: string[]; morphisms: Morph[] }> {
  return {
    onObj: (xy: string) => {
      // Parse ⟨x,y⟩
      const match = xy.match(/⟨(.+),(.+)⟩/);
      if (!match) return [];
      const [, x, y] = match;
      if (!x || !y) return [];
      
      const fx = F.onObj(x);
      const gy = G.onObj(y);
      
      // Cartesian product
      const result: string[] = [];
      for (const a of fx) {
        for (const b of gy) {
          result.push(`${a}⊗${b}`);
        }
      }
      return result;
    },
    onMor: (m: Morph) => (ab: string) => {
      // Parse a⊗b
      const parts = ab.split('⊗');
      if (parts.length !== 2) return ab;
      const [a, b] = parts;
      
      // Parse ⟨x,y⟩ → ⟨x',y'⟩
      const srcMatch = m.src.match(/⟨(.+),(.+)⟩/);
      const dstMatch = m.dst.match(/⟨(.+),(.+)⟩/);
      if (!srcMatch || !dstMatch) return ab;
      
      const [, x, y] = srcMatch;
      const [, xPrime, yPrime] = dstMatch;
      if (!x || !y || !xPrime || !yPrime) return ab;
      
      // Apply F and G morphisms
      const aPrime = F.onMor({ id: "temp", src: x, dst: xPrime })(a);
      const bPrime = G.onMor({ id: "temp", src: y, dst: yPrime })(b);
      
      return `${aPrime}⊗${bPrime}`;
    }
  };
}

/** Delta bicomodule for a functor F: C → D */
export function deltaFBicomodule<C extends SmallCat, D extends SmallCat>(
  C: C,
  D: D,
  Fobj: (x: string) => string
): BicomoduleWitness<C, D> {
  return {
    left: C,
    right: D,
    positionsAt: (x: string) => ["•"], // singleton position
    fiberAt: (x: string, _u: string) => {
      const fx = Fobj(x);
      return {
        onObj: (y: string) => {
          // Return morphisms from fx to y
          return D.morphisms
            .filter(m => m.src === fx && m.dst === y)
            .map(m => m.id);
        },
        onMor: (m: Morph) => (fId: string) => {
          // Find the morphism f
          const f = D.morphisms.find(mor => mor.id === fId);
          if (!f || f.src !== m.src) return fId; // fallback
          
          // Find morphism from m.dst to f.dst
          const g = D.morphisms.find(mor => mor.src === m.dst && mor.dst === f.dst);
          if (!g) return fId; // fallback
          
          // Return composition f;g
          return `${fId};${g.id}`;
        }
      };
    }
  };
}

// ---------- New: category-of-elements view for ?(1) and composition with (D,0)-bicomod ----------
// E(?(1)) objects are pairs (x∈C(1), u∈?(1)_x); this is exactly the domain of u ↦ ?[u].  :contentReference[oaicite:1]{index=1}
export function elementsOfPositions<Left extends SmallCat, Right extends SmallCat>(
  P: BicomoduleWitness<Left, Right>
): Array<{ x: Obj; u: string }> {
  const out: Array<{ x: Obj; u: string }> = [];
  for (const x of P.left.objects) for (const u of P.positionsAt(x)) out.push({ x, u });
  return out;
}

/** Build a (D,0)-bicomodule from a D-copresheaf G. This represents Example 2.10.  :contentReference[oaicite:2]{index=2} */
export function terminalBicomodule<Right extends SmallCat>(
  D: Right,
  G: Copresheaf<Right>
) {
  // We only need it as a witness to "compose equals applyPra"; no left coaction required here.
  return { right: D, toCopresheaf: () => G } as const;
}

/**
 * Compose a (C,D)-bicomodule with a (D,0)-bicomodule:
 * in Set-semantics, this *is* Φ(G) (Example 2.10). We expose it explicitly for tests/demos.  :contentReference[oaicite:3]{index=3}
 */
export function composeWithTerminal<Left extends SmallCat, Right extends SmallCat>(
  P: BicomoduleWitness<Left, Right>,
  term: ReturnType<typeof terminalBicomodule<Right>>
) {
  // Equalizer-vs-Nat correspondence: positions are natural maps ?[u]→@ (the equalizer picks those),
  // directions are the colimit over E(?[u]); objectwise this *is* Φ(G).  :contentReference[oaicite:3]{index=3}
  return applyPra(P.left, P.right, P, term.toCopresheaf());
}

// ---------- New: Right coclosure [@ -] (a.k.a. left Kan along @) ----------------------------
// Matches Def. 2.12: left adjoint to (- ⊳_3 @).  We implement its *carrier* in Set-semantics:
// for ?:(2,4)-bicomodule and @:(3,4)-bicomodule, produce a (2,3)-bicomodule whose
// positions over x are the positions of ? over x, and whose fiber at u is (objectwise)
// the prafunctor-apply of @ to ?[x,u].  This is the Set-level reading of eq. (3).  :contentReference[oaicite:1]{index=1}
export function rightCoclosure<Left extends SmallCat, Mid extends SmallCat, Right extends SmallCat>(
  At: BicomoduleWitness<Mid, Right>,    // @ : (3,4)
  Q:  BicomoduleWitness<Left, Right>    // ? : (2,4)
): BicomoduleWitness<Left, Mid> {
  return {
    left: Q.left,
    right: At.left,
    positionsAt: (x) => Q.positionsAt(x).map(u => `${u}`),
    fiberAt: (x, u) => applyPra(At.left, At.right, At, Q.fiberAt(x, u))
  };
}

// Unit and counit *witness* shims (shape only; useful for tests/demos):
export function unitOfRightCoclosure<Left extends SmallCat, Mid extends SmallCat, Right extends SmallCat>(
  At: BicomoduleWitness<Mid, Right>,
  Q:  BicomoduleWitness<Left, Right>
) {
  // ? → [@ ?] ⊳ @  (we return the two ends so callers can compare objectwise cardinalities)
  const L = rightCoclosure(At, Q);
  return { lhs: Q, rhs: (x: string, u: string) => applyPra(At.left, At.right, At, Q.fiberAt(x,u)) };
}

export function counitOfRightCoclosure<Left extends SmallCat, Mid extends SmallCat, Right extends SmallCat>(
  At: BicomoduleWitness<Mid, Right>,
  A:  BicomoduleWitness<Left, Mid>
) {
  // [@ (A ⊳ @)] → A  (shape-level: we expose both carriers for comparison)
  const composed = {
    left: A.left,
    right: At.right,
    positionsAt: (x: string) => A.positionsAt(x),
    fiberAt: (x: string, u: string) => applyPra(At.left, At.right, At, A.fiberAt(x,u))
  } as BicomoduleWitness<Left, Right>;
  const leftAdj = rightCoclosure(At, composed);
  return { lhs: leftAdj, rhs: A };
}

// Re-export Morph type for convenience
export type { Morph } from "./cofunctor";
