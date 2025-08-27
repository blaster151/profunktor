// examples/decorated-zigzag-action.demo.ts
import {
  actSquare, actLadder,
  type DecoratedLR, type TwoCellSquare, type TwoCellLadder, type FunctorLike
} from "../src/cat/double-zigzag";

// Minimal functor lookup over "categories" keyed by J-arrows; onMor just tags id.
type Obj = { id: string };
type Mor = { id: string; src: Obj; dst: Obj };

const F = (uId: string): FunctorLike<Obj, Mor> => ({
  onObj: (o) => ({ id: `${uId}·${o.id}` }),
  onMor: (m) => ({ id: `${uId}·${m.id}`, src: { id: `${uId}·${m.src.id}` }, dst: { id: `${uId}·${m.dst.id}` } })
});

// Length-1 decorated zig-zag (l, r): i ← k → j
const dec: DecoratedLR<string, Obj, Mor> = {
  i: "i", j: "j", k: "k",
  lId: "l", rId: "r",
  a: { id: "a" }, a1: { id: "ak" }, b: { id: "b" },
  f0: { id: "f0", src: { id: "a" }, dst: { id: "l·ak" } },
  f1: { id: "f1", src: { id: "r·ak" }, dst: { id: "b" } }
};

// (i) Square: collapse to trivial zig-zag {k} via ρi:i→k, ρj:j→k
const sq: TwoCellSquare<string> = { i: "i", j: "j", k: "k", rhoiId: "ρi", rhojId: "ρj" };
const composeInCk = (m2: Mor, m1: Mor): Mor => ({ id: `${m2.id}∘${m1.id}`, src: m1.src, dst: m2.dst });
const pushed = actSquare(F, sq, dec, composeInCk);
console.log("square action → trivial:", pushed);

// (ii) Ladder: relabel (l,r) to (l',r') via ρ
const lad: TwoCellLadder<string> = {
  i: "i", j1: "k", j: "j",
  iPrime: "i′", j1Prime: "k′", jPrime: "j′",
  lId: "l", rId: "r", lPrimeId: "l′", rPrimeId: "r′",
  rhoiId: "ρi", rhoj1Id: "ρκ", rhojId: "ρj"
};
const relabeled = actLadder(F, lad, dec);
console.log("ladder action → relabeled length-1:", relabeled);
