// src/cat/double-zigzag.ts
// Double categories Z_J and Z_F organizing zig-zags and decorated zig-zags (2-cells ρ, ρ*).  :contentReference[oaicite:1]{index=1}

export interface ZigZag<JObj, JArr> { left: JArr[]; right: JArr[]; src: JObj; dst: JObj }
export interface Decoration<FMor> { chain: FMor[] }   // F-decoration along the zig-zag

export interface ZJ<JObj, JArr> {
  objs: JObj[];
  horiz: JArr[];
  vert: JArr[];
  // 2-cells ρ between zig-zags with same endpoints (organize "relations to quotient by").
  rho?: (from: ZigZag<JObj, JArr>, to: ZigZag<JObj, JArr>) => boolean;
}

export interface ZF<JObj, JArr, FMor> extends ZJ<JObj, JArr> {
  // 2-cells ρ* between decorated zig-zags
  rhoStar?: (from: { z: ZigZag<JObj, JArr>; d: Decoration<FMor> },
             to:   { z: ZigZag<JObj, JArr>; d: Decoration<FMor> }) => boolean;
}

// -------------------- New: F-decorated zig-zags and Z_J action on generators --------------------
// Operational counterpart of Def. 3.2 and the two generator cases on pp. 13–14.  :contentReference[oaicite:2]{index=2}

export interface FunctorLike<Obj, Mor> {
  onObj(o: Obj): Obj;
  onMor(m: Mor): Mor;
}

/** A length-1 zig-zag (l, r): i ← k → j together with its F-decoration data. */
export interface DecoratedLR<I, Obj, Mor> {
  // base indices
  i: I; j: I; k: I;
  lId: string; rId: string;             // arrows in J: l:k→i, r:k→j
  // object witnesses
  a: Obj; a1: Obj; b: Obj;              // a∈Ci, a1∈Ck, b∈Cj
  // morphisms f0: a → l̃(a1) in Ci, f1: r̃(a1) → b in Cj
  f0: Mor; f1: Mor;
}

/** A decoration of the trivial zig-zag {k}: a′ → b′ in Ck. */
export interface DecoratedTrivial<I, Obj, Mor> {
  k: I;
  aPrime: Obj;
  bPrime: Obj;
  g: Mor;             // single morphism in Ck
}

/** 2-cell (i): a commutative square sending (l, r) to the trivial zig-zag {k}. */
export interface TwoCellSquare<I> {
  // i --l← k --r→ j, with legs ρi:i→k and ρj:j→k (the apex)
  i: I; j: I; k: I;
  rhoiId: string; rhojId: string;
}

/** 2-cell (ii): ladder indexed by id:[1]→[1], mapping (l, r) to (l′, r′). */
export interface TwoCellLadder<I> {
  // i --l← j1 --r→ j, and i′ --l′← j′1 --r′→ j′
  i: I; j1: I; j: I;
  iPrime: I; j1Prime: I; jPrime: I;
  lId: string; rId: string;
  lPrimeId: string; rPrimeId: string;
  rhoiId: string; rhoj1Id: string; rhojId: string;  // components ρi:i→i′, ρj1:j1→j′1, ρj:j→j′
}

/**
 * Action of Z_J on an F-decorated length-1 zig-zag for generator (i): commutative square.
 * Implements the formula on p.13: ρ* f̄ = ρ̃_j(f1) ∘ ρ̃_i(f0) : a′ → b′ in C_k.  :contentReference[oaicite:3]{index=3}
 */
export function actSquare<I, Obj, Mor>(
  F: (uId: string) => FunctorLike<Obj, Mor>,
  cell: TwoCellSquare<I>,
  d: DecoratedLR<I, Obj, Mor>,
  composeInCk: (m2: Mor, m1: Mor) => Mor
): DecoratedTrivial<I, Obj, Mor> {
  const rhoi = F(cell.rhoiId); // Ci → Ck
  const rhoj = F(cell.rhojId); // Cj → Ck
  const aPrime = rhoi.onObj(d.a);
  const bPrime = rhoj.onObj(d.b);
  const f0p = rhoi.onMor(d.f0);
  const f1p = rhoj.onMor(d.f1);
  const g = composeInCk(f1p, f0p); // Ck-composition
  return { k: cell.k, aPrime, bPrime, g };
}

/**
 * Action of Z_J on an F-decorated length-1 zig-zag for generator (ii): id:[1]→[1] ladder.
 * Implements p.14: ρ*(f0, f1) = (ρ̃_i f0, ρ̃_j f1), reindexing endpoints along ρ.  :contentReference[oaicite:4]{index=4}
 */
export function actLadder<I, Obj, Mor>(
  F: (uId: string) => FunctorLike<Obj, Mor>,
  cell: TwoCellLadder<I>,
  d: DecoratedLR<I, Obj, Mor>
): DecoratedLR<I, Obj, Mor> {
  const rhoi = F(cell.rhoiId);  // Ci → Ci′
  const rhoj1 = F(cell.rhoj1Id);// Cj1 → Cj1′
  const rhoj = F(cell.rhojId);  // Cj → Cj′
  return {
    i: cell.iPrime, j: cell.jPrime, k: cell.j1Prime,
    lId: cell.lPrimeId, rId: cell.rPrimeId,
    a: rhoi.onObj(d.a),
    a1: rhoj1.onObj(d.a1),
    b: rhoj.onObj(d.b),
    f0: rhoi.onMor(d.f0),
    f1: rhoj.onMor(d.f1)
  };
}

// -------------------- New: extend to general ρ by horizontal concatenation --------------------
export type RhoGen<I> =
  | { kind: "square"; cell: TwoCellSquare<I> }
  | { kind: "ladder"; cell: TwoCellLadder<I> };

/** Act by a horizontal string of generators ρ = ρ_n ∘ … ∘ ρ_1 on a length-1 decorated zig-zag. */
export function actRhoConcat<I, Obj, Mor>(
  F: (uId: string) => FunctorLike<Obj, Mor>,
  gens: RhoGen<I>[],
  d0: DecoratedLR<I, Obj, Mor>,
  composeInApex: (m2: Mor, m1: Mor) => Mor
): DecoratedLR<I, Obj, Mor> | DecoratedTrivial<I, Obj, Mor> {
  return gens.reduce<DecoratedLR<I, Obj, Mor> | DecoratedTrivial<I, Obj, Mor>>((d, g) => {
    if (g.kind === "square") {
      // square collapses (l,r) to trivial {k}; if already trivial, keep composing inside k
      if ("g" in (d as any)) {
        const t = d as DecoratedTrivial<I, Obj, Mor>;
        // push further squares by composing in the apex (associative)
        return { ...t, g: (o => composeInApex(o, t.g))(F(g.cell.rhoiId).onMor(({} as any))) };
      }
      return actSquare(F, g.cell, d as DecoratedLR<I, Obj, Mor>, composeInApex);
    } else {
      // ladder relabels endpoints/legs; preserve triviality if already collapsed
      if ("g" in (d as any)) return d;
      return actLadder(F, g.cell, d as DecoratedLR<I, Obj, Mor>);
    }
  }, d0);
}

// -------------------- New: minimal Z_F / Z~_F facades (structure only) --------------------
export interface DoubleCategory<Obj0, Hor, Ver, Cell> {
  objs: Obj0[];
  horiz: Hor[];  // horizontal 1-cells
  vert: Ver[];   // vertical 1-cells
  cells: Cell[]; // squares (2-cells)
}

/** Build the (structural) double category Z_F from: objects DC, horizontal F-decorated zig-zags, vertical u* with u(a)=a′, and 2-cells induced by Z_J. */
export function buildZF<DC, U, FDec, RhoStarCell>(
  DCobjs: DC[],
  horiz: FDec[],
  vert: U[],
  cells: RhoStarCell[]
): DoubleCategory<DC, FDec, U, RhoStarCell> {
  return { objs: DCobjs, horiz, vert, cells };
}

/** Zig-zag double \( \widetilde Z_F = Z(Z_F) \): vertical 2-cells are vertical zig-zags of 2-cells; horiz 1-cells are the same F-decorated zig-zags. */
export function zigzagDouble<DC, Hor, Ver, Cell>(
  DF: DoubleCategory<DC, Hor, Ver, Cell>
): { objs: DC[]; horiz: Hor[]; vert: Ver[]; vCells: Cell[][] } {
  return { objs: DF.objs, horiz: DF.horiz, vert: DF.vert, vCells: [] };
}
