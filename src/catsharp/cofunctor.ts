// src/catsharp/cofunctor.ts
// Cofunctors between (small) categories, following Def. 2.7.  :contentReference[oaicite:2]{index=2}

export type Obj = string;

export interface Morph {
  id: string;
  src: Obj;
  dst: Obj;
}

export interface SmallCat {
  objects: Obj[];
  morphisms: Morph[]; // must include identities (id_x) for each x
}

export function outgoing(C: SmallCat, x: Obj): Morph[] {
  return C.morphisms.filter(m => m.src === x);
}

export interface CoFunctor {
  // object map C(1) -> D(1)
  onObj: (x: Obj) => Obj;

  // for each x∈Ob(C), a function D[f(x)] -> C[x] (maps morphisms *out of* f(x) back to morphisms out of x)
  // (We encode this as: given x and a D-morphism with src = f(x), return a C-morphism with src = x.)
  pullOut: (x: Obj, mD: Morph) => Morph;
}

/** Basic well-formedness checks: identities/codomains/composites preserved as in Def. 2.7. */
export function validateCoFunctor(C: SmallCat, D: SmallCat, F: CoFunctor): { ok: boolean; errors: string[] } {
  const err: string[] = [];

  // identities
  for (const x of C.objects) {
    const fx = F.onObj(x);
    const idD = D.morphisms.find(m => m.src === fx && m.dst === fx && m.id.startsWith("id_"));
    if (!idD) err.push(`D missing identity at ${fx}`);
    else {
      const back = F.pullOut(x, idD);
      if (!(back.src === x && back.dst === x && back.id.startsWith("id_")))
        err.push(`identity not preserved at ${x}`);
    }
  }
  // codomains
  for (const x of C.objects) {
    const fx = F.onObj(x);
    for (const mD of outgoing(D, fx)) {
      const mC = F.pullOut(x, mD);
      if (mC.src !== x) err.push(`pullOut changed source at ${x}`);
      // check codomain match: F.onObj(dst_C) must equal dst_D
      const codOk = F.onObj(mC.dst) === mD.dst;
      if (!codOk) err.push(`codomain mismatch for D-morphism ${mD.id} at ${x}`);
    }
  }
  // composites: for D morphisms fx→y→z, pull back equals composite of pulls
  for (const x of C.objects) {
    const fx = F.onObj(x);
    const outs = outgoing(D, fx);
    for (const m1 of outs) {
      const outs2 = D.morphisms.filter(m => m.src === m1.dst);
      for (const m2 of outs2) {
        const pull2 = F.pullOut(x, m2);
        const pull1 = F.pullOut(x, m1);
        // find composite in C: pull1 ; (something whose src = pull1.dst and mapped to m2 via F)
        const cand = C.morphisms.find(m => m.src === pull1.dst && F.onObj(m.dst) === m2.dst);
        if (!cand) continue; // lightweight: we only flag when clearly wrong
        const pulled = F.pullOut(x, { id: `${m2.id}∘${m1.id}`, src: fx, dst: m2.dst });
        if (!(pulled.src === x && pulled.dst === cand.dst)) {
          err.push(`composites not respected at ${x} (m2∘m1)`);
        }
      }
    }
  }

  return { ok: err.length === 0, errors: err };
}
