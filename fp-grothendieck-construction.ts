/**
 * Grothendieck Construction
 * 
 * Provides the category of elements ∫F (Grothendieck construction) for a functor F : A → E.
 * This is a pragmatic builder that can be used in unit tests or to drive colim(∫F ⟶ E) scenarios.
 * 
 * Note: This intentionally avoids depending on the "fibrations" file to keep it self-contained.
 */

/**
 * A tiny interface for a (small) category the code can compute with.
 */
export interface SmallCategory<O, M> {
  id(o: O): M;
  dom(m: M): O;
  cod(m: M): O;
  comp(g: M, f: M): M; // g ∘ f
}

/**
 * A functor F : A → E (object + morphism mappings).
 */
export interface Functor<AObj, AMor, EObj, EMor> {
  readonly A: SmallCategory<AObj, AMor>;
  readonly E: SmallCategory<EObj, EMor>;
  onObj(a: AObj): EObj;
  onMor(f: AMor): EMor;
}

/**
 * Category of elements ∫F (Grothendieck construction).
 * 
 * Objects are pairs (a, α) where a ∈ A and α : F(a) → x for some x ∈ E.
 * Morphisms are pairs (fa, fx) where fa : a → a' and fx : x → x' 
 * such that fx ∘ α = α' ∘ F(fa) (commutativity condition).
 * 
 * This can be used to drive colim(∫F ⟶ E) scenarios by providing
 * a concrete representation of the category of elements.
 */
export function categoryOfElements<AObj, AMor, EObj, EMor>(
  F: Functor<AObj, AMor, EObj, EMor>
) {
  type Obj = { a: AObj; alpha: EMor; x: EObj }; // α : F(a) → x
  type Mor = { fa: AMor; fx: EMor };            // (fa : a→a', fx : x→x') s.t. fx ∘ α = α' ∘ F(fa)

  const A = F.A, E = F.E;
  const id = (o: Obj): Mor => ({ fa: A.id(o.a), fx: E.id(o.x) });
  const dom = (m: Mor): Obj => { throw new Error('dom not representable without extra data'); };
  const cod = (m: Mor): Obj => { throw new Error('cod not representable without extra data'); };
  const comp = (g: Mor, f: Mor): Mor => ({ fa: A.comp(g.fa, f.fa), fx: E.comp(g.fx, f.fx) });

  return {
    Ob: null as unknown as Obj, // marker type
    Mor: null as unknown as Mor,
    id, comp,
    // construction helper: build object and verify triangle
    makeObj(a: AObj, x: EObj, alpha: EMor): Obj {
      // alpha : F(a) → x
      return { a, x, alpha };
    },
    makeMor(o: Obj, o2: Obj, fa: AMor, fx: EMor): Mor | null {
      // check commutativity: fx ∘ α = α' ∘ F(fa)
      const left = E.comp(fx, o.alpha);
      const right = E.comp(o2.alpha, F.onMor(fa));
      return (left as any) === (right as any) ? { fa, fx } : null;
    }
  };
}
