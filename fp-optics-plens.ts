// fp-optics-plens.ts
// P-lenses = morphisms in the dual fibration P^∨. We keep this minimal and inside optics/.
// Works with the VC-span surface you've already added (fp-optics-fib-vertcart.ts).

export interface PLens<BaseArr = unknown, VC = { v: unknown; c: unknown }> {
  /** Base leg f : U → V (lives in the base category) */
  base: BaseArr;
  /** Vertical–Cartesian span in E encoding the dual arrow (backward leg) */
  span: VC; // { v: vertical; c: cartesian } in E
}

// Composition in P^∨ is VC-span composition (pull vertical past cartesian).
export function composePLens<B, VC>(
  composeVC: (m2: VC, m1: VC) => VC,
  g: PLens<B, VC>, f: PLens<B, VC>
): PLens<B, VC> {
  return { base: /* base comp, if tracked outside */ g.base, span: composeVC(g.span, f.span) };
}

// Lift a height-1 dialens into a P-lens by packaging its backward step as a VC span.
import type { Dialens } from './fp-optics-dialens';
export function plensFromDialens<A,B,ΔA,ΔB,BaseArr,VC>(
  d: Dialens<A,B,ΔA,ΔB>, base: BaseArr, toVC: (a:A, db:ΔB)=>VC
): PLens<BaseArr,VC> {
  return { base, span: toVC as any };
}
