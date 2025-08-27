// Effects as polynomial coalgebras + a bounded cofree-comonoid carrier.  :contentReference[oaicite:1]{index=1}

/** A finitary polynomial: positions ?(1) and fibers ?[u] as finite string labels. */
export interface Polynomial {
  positions: string[];                 // ?(1)
  fiber: (u: string) => string[];      // ?[u]
}

/** A ?-coalgebra on state S: s ↦ (u, k) where k : ?[u] → S (continuation). */
export interface Coalgebra<S> {
  poly: Polynomial;
  step: (s: S) => { pos: string; cont: (dir: string) => S };
}

/** One small step of an effectful run with a *choice* of direction from the environment. */
export function runStep<S>(
  C: Coalgebra<S>,
  choose: (u: string, fiber: string[]) => string,
  s: S
): S {
  const { pos, cont } = C.step(s);
  const d = choose(pos, C.poly.fiber(pos));
  return cont(d);
}

// ---------- Bounded approximation to the cofree comonoid c? (Definition 5.2) ----------
// We materialize ?(n) by trees of depth n whose nodes are positions and whose outgoing
// edges are labeled by directions in ?[u]. The inverse limit c? (Prop. 5.3) is approximated
// by increasing n; here we expose a generator for depth≤N trees.  :contentReference[oaicite:2]{index=2}

export type CFNode = { pos: string; edges: { dir: string; next: CFNode | undefined }[] };

/** Build all "shape" trees up to depth N from a root position u0. */
export function cfreeApproxFrom(poly: Polynomial, u0: string, N: number): CFNode {
  function build(u: string, n: number): CFNode {
    const outs = poly.fiber(u).map(dir => ({ dir, next: n > 0 ? build(u, n - 1) : undefined }));
    return { pos: u, edges: outs };
  }
  return build(u0, Math.max(0, N));
}
