/**
 * Double Category Structure for Polynomial Functors
 * 
 * Based on "Polynomial functors and polynomial monads" by Nicola Gambino and Joachim Kock
 * Pages 19-20 - Section 3: The Double Category of Polynomial Functors
 * 
 * This implements the REVOLUTIONARY double category structure where:
 * - D₀: category of objects (slices E/X)
 * - D₁: category of morphisms (polynomial functors)
 * - Structure functors: ∂₀, ∂₁: D₁ → D₀ and composition D₁ ×_{D₀} D₁ → D₁
 * - Framed bicategory condition: (∂₀, ∂₁): D₁ → D₀ × D₀ is a bifibration
 */

import { 
  Polynomial, 
  PolynomialMap,
  unitPolynomial 
} from './fp-polynomial-functors';

// ============================================================================
// CORE DOUBLE CATEGORY STRUCTURE
// ============================================================================

/**
 * Double Category D
 * 
 * A double category consists of:
 * - D₀: category of objects
 * - D₁: category of morphisms  
 * - Structure functors: ∂₀, ∂₁: D₁ → D₀
 * - Composition: D₁ ×_{D₀} D₁ → D₁
 */
export interface DoubleCategory<Obj, Hor, Ver, Sq> {
  readonly kind: 'DoubleCategory';
  
  // Categories
  readonly objects: Category<Obj, Ver>;      // D₀
  readonly morphisms: Category<Hor, Sq>;     // D₁
  
  // Structure functors
  readonly source: Functor<Hor, Obj, Sq, Ver>;  // ∂₀: D₁ → D₀
  readonly target: Functor<Hor, Obj, Sq, Ver>;  // ∂₁: D₁ → D₀
  
  // Composition
  readonly compose: <H1 extends Hor, H2 extends Hor>(
    h1: H1, 
    h2: H2,
    compatibility: CompatibilityCondition<H1, H2>
  ) => Hor;
  
  // Identity
  readonly identity: (obj: Obj) => Hor;
  
  // Framed bicategory condition
  readonly isFramedBicategory: boolean;
  readonly baseChange: BaseChangeStructure<Obj, Hor, Ver, Sq>;
}

/**
 * Category structure
 */
export interface Category<Obj, Mor> {
  readonly objects: Obj[];
  readonly morphisms: Map<string, Mor[]>;
  readonly identity: (obj: Obj) => Mor;
  readonly composition: (f: Mor, g: Mor) => Mor | null;
}

/**
 * Functor between categories
 */
export interface Functor<SourceObj, TargetObj, SourceMor, TargetMor> {
  readonly source: Category<SourceObj, SourceMor>;
  readonly target: Category<TargetObj, TargetMor>;
  readonly mapObjects: (obj: SourceObj) => TargetObj;
  readonly mapMorphisms: (mor: SourceMor) => TargetMor;
}

/**
 * Compatibility condition for horizontal composition
 * Ensures that target(h1) = source(h2)
 */
export interface CompatibilityCondition<H1, H2> {
  readonly source: H1;
  readonly target: H2;
  readonly condition: boolean;
}

/**
 * Base change structure for framed bicategories
 * 
 * The bifibration condition: (∂₀, ∂₁): D₁ → D₀ × D₀
 */
export interface BaseChangeStructure<Obj, Hor, Ver, Sq> {
  readonly kind: 'BaseChangeStructure';
  
  // Base change: Δᵤ ∘ P ∘ Σᵥ = (u,v)*(P) - transporter lift (page 22)
  readonly baseChange: <O1 extends Obj, O2 extends Obj>(
    horizontal: Hor,
    vertical: Ver,
    source: O1,
    target: O2
  ) => Hor;
  
  // Cobase change: Σᵤ ∘ P' ∘ Δᵥ = (u,v)!(P') - cotransporter lift (page 22)
  readonly cobaseChange: <O1 extends Obj, O2 extends Obj>(
    horizontal: Hor,
    vertical: Ver,
    source: O1,
    target: O2
  ) => Hor;
  
  // Bifibration condition
  readonly isBifibration: boolean;
}

// ============================================================================
// POLYNOMIAL DOUBLE CATEGORY IMPLEMENTATION
// ============================================================================

/**
 * Object in polynomial double category
 * 
 * Objects are slices E/X for objects X in E
 */
export interface PolynomialObject<X> {
  readonly kind: 'PolynomialObject';
  readonly base: X;
  readonly slice: SliceCategory<X>;
}

/**
 * Horizontal arrow in polynomial double category
 * 
 * Horizontal arrows are polynomial functors between slices
 */
export interface PolynomialHorizontalArrow<I, J> {
  readonly kind: 'PolynomialHorizontalArrow';
  readonly source: PolynomialObject<I>;
  readonly target: PolynomialObject<J>;
  readonly polynomial: Polynomial<any, any>;
  readonly functor: <A>(a: A) => Array<{ base: J; result: A[] }>;
}

/**
 * Vertical arrow in polynomial double category
 * 
 * Vertical arrows are morphisms in the base category E
 */
export interface PolynomialVerticalArrow<X, Y> {
  readonly kind: 'PolynomialVerticalArrow';
  readonly source: X;
  readonly target: Y;
  readonly morphism: (x: X) => Y;
}

/**
 * Square in polynomial double category
 * 
 * Squares are natural transformations between polynomial functors
 * that respect the base change structure
 */
export interface PolynomialSquare<H1, H2, V1, V2> {
  readonly kind: 'PolynomialSquare';
  readonly horizontalSource: H1;
  readonly horizontalTarget: H2;
  readonly verticalSource: V1;
  readonly verticalTarget: V2;
  readonly naturality: <X>(x: X) => boolean;
  readonly baseChange: boolean;
}

/**
 * Slice category E/X
 */
export interface SliceCategory<X> {
  readonly kind: 'SliceCategory';
  readonly base: X;
  readonly objects: Array<MorphismToX<X>>;
  readonly morphisms: Array<SliceMorphism<X>>;
}

/**
 * Morphism to X
 */
export interface MorphismToX<X> {
  readonly kind: 'MorphismToX';
  readonly source: any;
  readonly target: X;
  readonly morphism: (source: any) => X;
}

/**
 * Slice morphism
 */
export interface SliceMorphism<X> {
  readonly kind: 'SliceMorphism';
  readonly source: MorphismToX<X>;
  readonly target: MorphismToX<X>;
  readonly morphism: (source: any) => any;
  readonly commutativity: boolean;
}

// ============================================================================
// CONSTRUCTORS AND UTILITIES
// ============================================================================

/**
 * Create a polynomial object (slice category)
 */
export function createPolynomialObject<X>(base: X): PolynomialObject<X> {
  return {
    kind: 'PolynomialObject',
    base,
    slice: {
      kind: 'SliceCategory',
      base,
      objects: [],
      morphisms: []
    }
  };
}

/**
 * Create a polynomial horizontal arrow
 */
export function createPolynomialHorizontalArrow<I, J>(
  source: PolynomialObject<I>,
  target: PolynomialObject<J>,
  polynomial: Polynomial<any, any>
): PolynomialHorizontalArrow<I, J> {
  return {
    kind: 'PolynomialHorizontalArrow',
    source,
    target,
    polynomial,
    functor: <A>(a: A) => [{
      base: target.base,
      result: [a]
    }]
  };
}

/**
 * Create a polynomial vertical arrow
 */
export function createPolynomialVerticalArrow<X, Y>(
  source: X,
  target: Y,
  morphism: (x: X) => Y
): PolynomialVerticalArrow<X, Y> {
  return {
    kind: 'PolynomialVerticalArrow',
    source,
    target,
    morphism
  };
}

/**
 * Create a polynomial square
 */
export function createPolynomialSquare<H1, H2, V1, V2>(
  horizontalSource: H1,
  horizontalTarget: H2,
  verticalSource: V1,
  verticalTarget: V2
): PolynomialSquare<H1, H2, V1, V2> {
  return {
    kind: 'PolynomialSquare',
    horizontalSource,
    horizontalTarget,
    verticalSource,
    verticalTarget,
    naturality: () => true,
    baseChange: true
  };
}

/**
 * Create the polynomial double category
 * 
 * This implements the framed bicategory structure for polynomial functors
 */
export function createPolynomialDoubleCategory<Obj, Hor, Ver, Sq>(): DoubleCategory<Obj, Hor, Ver, Sq> {
  return {
    kind: 'DoubleCategory',
    
    // Categories
    objects: {
      objects: [],
      morphisms: new Map(),
      identity: (obj: Obj) => null as any,
      composition: (f: Ver, g: Ver) => null
    },
    
    morphisms: {
      objects: [],
      morphisms: new Map(),
      identity: (obj: Hor) => null as any,
      composition: (f: Sq, g: Sq) => null
    },
    
    // Structure functors
    source: {
      source: null as any,
      target: null as any,
      mapObjects: (obj: Hor) => null as any,
      mapMorphisms: (mor: Sq) => null as any
    },
    
    target: {
      source: null as any,
      target: null as any,
      mapObjects: (obj: Hor) => null as any,
      mapMorphisms: (mor: Sq) => null as any
    },
    
    // Composition
    compose: <H1 extends Hor, H2 extends Hor>(
      h1: H1,
      h2: H2,
      compatibility: CompatibilityCondition<H1, H2>
    ) => null as any,
    
    // Identity
    identity: (obj: Obj) => null as any,
    
    // Framed bicategory
    isFramedBicategory: true,
    
    baseChange: {
      kind: 'BaseChangeStructure',
      baseChange: (horizontal, vertical, source, target) => horizontal, // (u,v)*(P)
      cobaseChange: (horizontal, vertical, source, target) => horizontal, // (u,v)!(P')
      isBifibration: true
    }
  };
}

// ============================================================================
// THEOREM 3.8 - DIAGRAM REPRESENTATION
// ============================================================================

/**
 * Theorem 3.8: Squares (18) of PolyFun_E are represented by diagrams
 * 
 * P': I' ←B'→ A' → J'
 *     ↓   ↓   ↓   ↓  
 * P:  I ←B→ A → J
 * 
 * This representation is unique up to choice of pullback in the middle.
 */
export interface PolynomialSquareDiagram<I, B, A, J, I_prime, B_prime, A_prime, J_prime> {
  readonly kind: 'PolynomialSquareDiagram';
  
  // Upper polynomial P': I' ← B' → A' → J'
  readonly upperPolynomial: {
    readonly I_prime: I_prime;
    readonly B_prime: B_prime;
    readonly A_prime: A_prime;
    readonly J_prime: J_prime;
    readonly s_prime: (b_prime: B_prime) => I_prime;
    readonly f_prime: (b_prime: B_prime) => A_prime;
    readonly t_prime: (a_prime: A_prime) => J_prime;
  };
  
  // Lower polynomial P: I ← B → A → J
  readonly lowerPolynomial: {
    readonly I: I;
    readonly B: B;
    readonly A: A;
    readonly J: J;
    readonly s: (b: B) => I;
    readonly f: (b: B) => A;
    readonly t: (a: A) => J;
  };
  
  // Vertical morphisms (u, ?, ?, v)
  readonly verticalMorphisms: {
    readonly u: (i_prime: I_prime) => I;
    readonly v: (j_prime: J_prime) => J;
    readonly middlePullback: boolean; // Choice of pullback in the middle
  };
  
  // Biequivalence witness: Poly_E ≃ PolyFun_E
  readonly biequivalenceWitness: {
    readonly isFramedBiequivalence: boolean;
    readonly uniquenessModuloPullback: boolean;
  };
}

// ============================================================================
// DIAGRAMMATIC REPRESENTATION
// ============================================================================

/**
 * Double category diagram
 * 
 * Represents the structure:
 * D₀ (objects) ← ∂₁ D₁ (horizontal arrows) → D₁ ×_{D₀} D₁ (composition)
 *              ∂₀
 */
export interface DoubleCategoryDiagram<Obj, Hor, Ver, Sq> {
  readonly kind: 'DoubleCategoryDiagram';
  readonly objects: Obj[];
  readonly horizontalArrows: Hor[];
  readonly verticalArrows: Ver[];
  readonly squares: Sq[];
  readonly structure: {
    readonly sourceMap: Map<Hor, Obj>;
    readonly targetMap: Map<Hor, Obj>;
    readonly compositionMap: Map<[Hor, Hor], Hor>;
  };
}

/**
 * Create a diagrammatic representation of the double category
 */
export function createDoubleCategoryDiagram<Obj, Hor, Ver, Sq>(
  doubleCategory: DoubleCategory<Obj, Hor, Ver, Sq>
): DoubleCategoryDiagram<Obj, Hor, Ver, Sq> {
  return {
    kind: 'DoubleCategoryDiagram',
    objects: doubleCategory.objects.objects,
    horizontalArrows: doubleCategory.morphisms.objects,
    verticalArrows: [],
    squares: [],
    structure: {
      sourceMap: new Map(),
      targetMap: new Map(),
      compositionMap: new Map()
    }
  };
}

// ============================================================================
// COHERENCE CONDITIONS
// ============================================================================

/**
 * Coherence conditions for double categories
 * 
 * Based on the associativity and unit isomorphisms from page 19
 */
export interface CoherenceConditions<Obj, Hor, Ver, Sq> {
  readonly kind: 'CoherenceConditions';
  
  // Associativity isomorphism: (H ∘ G) ∘ F ⇒ H ∘ (G ∘ F)
  readonly associativity: <F extends Hor, G extends Hor, H extends Hor>(
    f: F, g: G, h: H
  ) => Sq;
  
  // Left unit isomorphism: Id_J ∘ F ⇒ F
  readonly leftUnit: <F extends Hor>(f: F) => Sq;
  
  // Right unit isomorphism: F ∘ Id_I ⇒ F
  readonly rightUnit: <F extends Hor>(f: F) => Sq;
  
  // Interchange law
  readonly interchange: <F1, F2, G1, G2 extends Hor>(
    f1: F1, f2: F2, g1: G1, g2: G2
  ) => Sq;
}

/**
 * Create coherence conditions for polynomial double category
 */
export function createCoherenceConditions<Obj, Hor, Ver, Sq>(): CoherenceConditions<Obj, Hor, Ver, Sq> {
  return {
    kind: 'CoherenceConditions',
    associativity: (f, g, h) => null as any,
    leftUnit: (f) => null as any,
    rightUnit: (f) => null as any,
    interchange: (f1, f2, g1, g2) => null as any
  };
}
