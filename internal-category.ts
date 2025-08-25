export type Obj = unknown & { readonly __Obj: unique symbol }
export type Mor = unknown & { readonly __Mor: unique symbol }

export interface Category<CObj = Obj, CMor = Mor> {
  id: (x: CObj) => CMor
  comp: (g: CMor, f: CMor) => CMor
  dom: (f: CMor) => CObj
  cod: (f: CMor) => CObj
  // Products/pullbacks are abstracted behind these:
  product: (a: CObj, b: CObj) => CObj
  pullback: (f: CMor, g: CMor) => { obj: CObj, π1: CMor, π2: CMor }
  // Equality witnesses (structural/semantic):
  eqMor: (f: CMor, g: CMor) => boolean
  eqObj: (a: CObj, b: CObj) => boolean
}

export interface InternalCategory<C extends Category> {
  C: C
  C0: C['dom'] extends (f: infer _) => infer O ? O : never
  C1: C['dom'] extends (f: infer _) => infer O ? O : never
  s: C['id'] extends (x: any) => infer M ? M : never     // C1 -> C0
  t: C['id'] extends (x: any) => infer M ? M : never     // C1 -> C0
  i: C['id'] extends (x: any) => infer M ? M : never     // C0 -> C1
  m: C['id'] extends (x: any) => infer M ? M : never     // C1 ×_{C0} C1 -> C1
  // Projections of the pullback C1 ×_{C0} C1 of (t, s)
  compPB: { obj: InternalCategory<C>['C1']; π1: any; π2: any } | null
}

/** Check unit/assoc squares + the "square with m × id and id × m" in the scan. */
export function validateInternalCategory<C extends Category>(
  Ic: InternalCategory<C>
): string[] {
  const { C, s, t, i, m } = Ic
  const errs: string[] = []
  // Minimal, schematic checks; you can expand with your symbolic morphism layer.

  // Domain/codomain sanity (types align). Placeholders to be tightened with your term representation:
  try {
    // Unit: s ∘ i = id_{C0}, t ∘ i = id_{C0}
    // Assoc: m ∘ (m × id) = m ∘ (id × m)
    // Square on the page: (id_C1 × m) ; m  =  (m × id_C1) ; m
    // These require building products/pullbacks; here we just assert presence:
    if (!Ic.compPB) errs.push("Missing pullback for composition (C1 ×_{C0} C1).")
  } catch {
    errs.push("Exception during internal category validation.")
  }
  return errs
}
