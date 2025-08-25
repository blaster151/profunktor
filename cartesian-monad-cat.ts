import { Category, InternalCategory } from "./internal-category"

export interface CartesianMonad<C extends Category> {
  C: C
  T0: (X: ReturnType<C['id']>) => ReturnType<C['id']>  // on objects (schematic)
  T1: (f: ReturnType<C['id']>) => ReturnType<C['id']>  // on morphisms
  η:  (X: ReturnType<C['id']>) => ReturnType<C['id']>
  μ:  (X: ReturnType<C['id']>) => ReturnType<C['id']>
  preservesPullbacks: boolean
}

export interface CategoricalTAlgebra<C extends Category> {
  I: InternalCategory<C>
  ξ: (x: ReturnType<C['id']>) => ReturnType<C['id']> // structure map T(I) -> I (schematic)
}

export interface LaxTMorphism<C extends Category> {
  f: (x: ReturnType<C['id']>) => ReturnType<C['id']>   // internal functor I->J (schematic)
  φ: (x: ReturnType<C['id']>) => ReturnType<C['id']>   // nat. transf. T(f) ⇒ f
}

export function checkLaxSquares<C extends Category>(
  T: CartesianMonad<C>, A: CategoricalTAlgebra<C>, B: CategoricalTAlgebra<C>,
  lax: LaxTMorphism<C>, eq: (u: ReturnType<C['id']>, v: ReturnType<C['id']>) => boolean
): string[] {
  const e: string[] = []
  try {
    // Two naturality squares (unit, mult) from the page (schematic; wire to real terms):
    const left1  = lax.f(T.η(A.I.C0))
    const right1 = A.ξ(lax.f(A.I.C0 as any))
    if (!eq(left1, right1)) e.push("Unit naturality square failed.")

    const left2  = lax.f(T.μ(A.I.C0))
    const right2 = A.ξ(lax.f(A.I.C0 as any))
    if (!eq(left2, right2)) e.push("Multiplication naturality square failed.")
  } catch { e.push("Exception while checking lax squares.") }
  return e
}

// --- Cartesian adjunction + monad morphism scaffolding ----------------------

export interface CartesianAdjunction<C extends Category, D extends Category> {
  C: C
  D: D
  c: { onObj: (x: any) => any; onMor: (f: any) => any; preservesPullbacks: boolean }
  d: { onObj: (x: any) => any; onMor: (f: any) => any }
  // unit η: Id_D ⇒ d∘c, counit ε: c∘d ⇒ Id_C
  unit:  (X: any) => CMor<C | D>      // η_X: X → d(c(X))
  counit:(Y: any) => CMor<C | D>      // ε_Y: c(d(Y)) → Y
  // Oracles: these witnesses say the naturality squares of η, ε are pullbacks
  unitIsCartesian: boolean
  counitIsCartesian: boolean
}

export interface CartMonad<C extends Category> extends CartesianMonad<C> {}

export interface MonadMorphismData<C extends Category, D extends Category> {
  S: CartMonad<D>          // monad on D
  T: CartMonad<C>          // monad on C
  Adj: CartesianAdjunction<C, D> // c ⊣ d
  // Φ : S ⇒ d∘T∘c  (components on objects/morphisms of D)
  Phi_onObj: (X: any) => CMor<C | D>
  Phi_onMor: (f: any) => CMor<C | D>
  // Oracles telling us whether certain Nats are cartesian (pullback squares)
  isCartesianNat: (nat: "Phi" | "PhiPrime" | "Theta") => boolean
}

// Mate Φ' : cS ⇒ Tc computed from Φ by postcomposing with counit
export function matePhiPrime<C extends Category, D extends Category>(
  mm: MonadMorphismData<C, D>, X: any
): CMor<C | D> {
  // Φ'_X := ε_{T(cX)} ∘ c(Φ_X)
  const { Adj, Phi_onObj } = mm
  const cPhiX = Adj.c.onMor(Phi_onObj(X))
  const eps   = Adj.counit(mm.T.T0(Adj.c.onObj(X)))
  return (mm.T.C.comp as any)(eps, cPhiX)
}

// θ : T∘c∘S ⇒ T∘c  (right S-module on Tc)  defined by θ := (μ_c) ∘ T(Φ')
export function thetaFromPhiPrime<C extends Category, D extends Category>(
  mm: MonadMorphismData<C, D>, X: any
): CMor<C | D> {
  const TcX   = mm.T.T0(mm.Adj.c.onObj(X))
  const mu_c  = mm.T.μ(mm.Adj.c.onObj(X))       // μ_{cX} : T^2(cX) → T(cX)
  const phiP  = matePhiPrime(mm, X)             // Φ'_X : cS X → T c X
  const TphiP = mm.T.T1(phiP)                   // T(Φ')
  return (mm.T.C.comp as any)(mu_c, TphiP)      // μ ∘ T(Φ')
}

// Definition 5.7 + Lemma 5.8 checks (diagnostics, no throws)
export function checkCartesianMonadMorphism<C extends Category, D extends Category>(
  mm: MonadMorphismData<C, D>
): string[] {
  const errs: string[] = []
  // Adjunction must be cartesian
  if (!mm.Adj.c.preservesPullbacks) errs.push("c does not preserve pullbacks")
  if (!mm.Adj.unitIsCartesian)      errs.push("unit η is not cartesian")
  if (!mm.Adj.counitIsCartesian)    errs.push("counit ε is not cartesian")
  // Φ cartesian, Φ' cartesian, θ cartesian
  if (!mm.isCartesianNat("Phi"))      errs.push("Φ is not cartesian")
  if (!mm.isCartesianNat("PhiPrime")) errs.push("Φ' (mate) is not cartesian")
  if (!mm.isCartesianNat("Theta"))    errs.push("θ is not cartesian")
  return errs
}

export function checkRightSModuleTiny<C extends Category, D extends Category>(
  mm: MonadMorphismData<C, D>, sampleX: any
): string[] {
  const errs: string[] = []
  try {
    const theta = thetaFromPhiPrime(mm, sampleX)
    // Deterministic "shape" test: θ has same codomain as μ_{cX}
    const mu_c  = mm.T.μ(mm.Adj.c.onObj(sampleX))
    const sameShape =
      JSON.stringify(mm.T.C.cod(theta)) === JSON.stringify(mm.T.C.cod(mu_c))
    if (!sameShape) errs.push("θ codomain does not match μ_{cX} codomain")
  } catch { errs.push("theta construction threw") }
  return errs
}
