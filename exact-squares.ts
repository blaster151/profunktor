// exact-squares.ts
import type { Category } from "./cat-core"
import type { FiniteDiagram, ColimitOracle } from "./kan-pointwise"

// If you already have a Functor type elsewhere, you can replace this local alias.
// It's structural, so it won't clash.
export type Functor<C extends Category> = {
  onObj: (x: any) => any
  onMor: (f: ReturnType<C["id"]>) => ReturnType<C["id"]>
}

export type ExactReason = "pullback-square" | "discrete-fibrations" | "beck-chevalley"

// X --top--> X'
// |          |
// L          R
// v          v
// Y --bot--> Y'
export interface ExactSquare<C extends Category> {
  X: C; Xp: C; Y: C; Yp: C
  top: Functor<C>; left: Functor<C>; right: Functor<C>; bot: Functor<C>
  reason: ExactReason
}

// Minimal acceptance for an exact square (you can refine to do real checks later)
export function isExactSquare<C extends Category>(sq: ExactSquare<C>): boolean {
  return sq.reason === "pullback-square" ||
         sq.reason === "discrete-fibrations" ||
         sq.reason === "beck-chevalley"
}

// Tiny pointwise Lan (kept here to avoid adding a new file)
// Lan_top(H)(A') := colim_{(top ↓ A')} H∘π  (we rely on your FiniteDiagram/ColimitOracle)
function pointwiseLeftKan<C extends Category>(
  C: C,
  top: Functor<C>,
  H: { onObj: (x: any) => any; onMor: (f: any) => any },
  buildComma: (Aprime: any) => FiniteDiagram<C>,
  colims: ColimitOracle<C>,
  Aprime: any
): { obj: any; injections: Array<any> } {
  const comma = buildComma(Aprime)
  const Hdiag: FiniteDiagram<C> = {
    objs: comma.objs.map(H.onObj),
    mors: comma.mors.map(e => ({ dom: H.onObj(e.dom), cod: H.onObj(e.cod), mor: H.onMor(e.mor) })),
  }
  return colims.colim(Hdiag)
}

/**
 * Operational lemma (Remark 5.16 style):
 * If the square is exact, then postcomposing a pointwise Lan along `top` with `right`
 * yields the same underlying object as taking Lan along `bot` after transporting along `left`.
 */
export function preservesPointwiseLanUnderExactSquare<C extends Category>(
  sq: ExactSquare<C>,
  buildCommaTop: (Aprime: any) => FiniteDiagram<C>,
  buildCommaBot: (Bprime: any) => FiniteDiagram<C>,
  H_on_X:    { onObj: (x: any) => any; onMor: (f: any) => any }, // diagram over X
  H_on_Y:    { onObj: (y: any) => any; onMor: (g: any) => any }, // transported diagram over Y
  colimsX: ColimitOracle<C>,
  colimsY: ColimitOracle<C>,
  Aprime: any,                           // object of X'
  sameObj: (u: any, v: any) => boolean   // equality on underlying objects
): { ok: true } | { ok: false; reason: string } {
  if (!isExactSquare(sq)) return { ok: false, reason: "square not exact" }

  // Route 1: Lan_top(H) at A' (object in X'), then push with `right`
  const lanTop = pointwiseLeftKan(sq.X, sq.top, H_on_X, buildCommaTop, colimsX, Aprime)
  const route1 = sq.right.onObj(lanTop.obj)

  // Route 2: transport along `left`, compute Lan_bot(H_on_Y) at right(A')
  const Aprime_in_Yp = sq.right.onObj(Aprime)
  const lanBot = pointwiseLeftKan(sq.Y, sq.bot, H_on_Y, buildCommaBot, colimsY, Aprime_in_Yp)
  const route2 = lanBot.obj

  return sameObj(route1, route2) ? { ok: true } : { ok: false, reason: "underlying objects differ" }
}
