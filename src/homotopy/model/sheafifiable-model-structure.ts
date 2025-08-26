/**
 * Sheafifiable Model Structure
 * 
 * Implementation of Beke's "Sheafifiable Homotopy Model Categories"
 * 
 * Core insight: When a Quillen model category can be presented by suitable 
 * algebraic/combinatorial logical data, its axioms holding in Sets lift 
 * formally to sheaf categories on any site. This yields a functor sending:
 * - Topoi/geometric morphisms → Model categories/Quillen adjunctions
 * 
 * This file provides the typed scaffolding to "lift" a Quillen-like spec 
 * from Sets to sheaves over a site.
 */

import type { CategoryOps as CatOps, GeneratingMap as GenMap } from "../small-object/small-object-argument";
import { cell, inj as injRLP, cof as cofRetracts, smallObjectArgument } from "../small-object/small-object-argument";

// ============================================================================
// PRESENTABILITY AND ACCESSIBILITY
// ============================================================================

/**
 * Has Limits and Colimits
 * 
 * Basic completeness and cocompleteness evidence
 */
export interface HasLimitsColimits { 
  readonly hasAllLimits: boolean; 
  readonly hasAllColimits: boolean; 
}

/**
 * Locally Presentable
 * 
 * Evidence that the category is locally presentable (accessible + cocomplete)
 */
export interface LocallyPresentable extends HasLimitsColimits {
  readonly hasFilteredColimits: boolean;
  readonly hasSmallGenerators: boolean; // a set of generators
}

// ============================================================================
// CORE SITE AND TOPOLOGY TYPES
// ============================================================================

/**
 * Site
 * 
 * A small category with a Grothendieck topology
 */
export interface Site { 
  readonly objects: readonly unknown[];
  readonly morphisms?: readonly unknown[]; // optional for lightweight usage
}

/**
 * Cover
 * 
 * A family of arrows {U_i → U} that covers U
 */
export interface Cover { 
  readonly family: readonly unknown[]; // {U_i -> U}
  readonly target?: unknown; // the object U being covered
}

/**
 * Sieve
 * 
 * A collection of arrows with common target that is closed under composition
 */
export interface Sieve {
  readonly arrows: readonly unknown[];
  readonly target: unknown;
  readonly isClosed: boolean; // closed under composition
}

/**
 * Grothendieck Topology
 * 
 * Assigns to each object U a collection of covers of U
 */
export interface GrothendieckTopology { 
  covers(U: unknown): Cover[];
  sieves(U: unknown): Sieve[];
}

// ============================================================================
// COFIBRANTLY GENERATED INGREDIENTS
// ============================================================================

/**
 * Generating Map
 * 
 * A morphism with domain smallness witness for cofibrantly generated model categories
 */
export interface GeneratingMap<X> { 
  readonly map: X; 
  readonly domainSmall: boolean;
  readonly codomainSmall?: boolean;
  readonly name?: string; // for debugging
}

/**
 * Cofibrantly Generated Structure
 * 
 * A model category is cofibrantly generated if it has generating sets I and J
 * where I generates cofibrations and J generates trivial cofibrations
 */
export interface CofibrantlyGenerated<X> {
  readonly I: readonly GeneratingMap<X>[]; // generating cofibrations
  readonly J: readonly GeneratingMap<X>[]; // generating trivial cofibrations
  readonly cofibration: (f: X) => boolean; // usually ≤ monos
  readonly trivialCofibration: (f: X) => boolean; // cofibrations that are weak equivalences
}

/**
 * Small Object Argument Witness
 * 
 * Witness that the small object argument can be applied
 */
export interface SmallObjectWitness<X> {
  readonly canApply: boolean;
  readonly reason?: string;
  readonly generatingSet: readonly GeneratingMap<X>[];
  readonly factorization: (f: X) => { cofibration: X; trivialFibration: X };
}

/**
 * Category Operations
 * 
 * Handle for category operations needed by the small object argument
 */
export interface CategoryOps<X> extends CatOps<X> {}

// ============================================================================
// SHEAFIFIABLE SPECIFICATION
// ============================================================================

/**
 * Sheafifiable Spec
 * 
 * The bits that must be interpretable in any topos.
 * This is the "algebraic/combinatorial logical data" that can be lifted.
 */
export interface SheafifiableSpec<X> extends CofibrantlyGenerated<X> {
  // Local weak equivalence: true if f is a weak eq after testing on a cover
  readonly isLocalWeakEquivalence: (f: X, cover: Cover) => boolean;
  
  // Optional fibrations via RLP against J
  readonly hasRLP?: (i: X, p: X) => boolean;
  
  // Optional properness toggles
  readonly isLeftProper?: boolean;
  readonly isRightProper?: boolean;
  
  // Optional simplicial structure
  readonly isSimplicial?: boolean;
  
  // Optional small object argument witnesses
  readonly smallObjectWitness?: SmallObjectWitness<X>;
  
  // NEW: gives us pushout/coproduct/compose for SOA
  readonly ops?: CategoryOps<X>;
}

// ============================================================================
// MODEL CATEGORY STRUCTURE
// ============================================================================

/**
 * Trivial Morphisms
 * 
 * Trivial cofibrations and fibrations
 */
export interface TrivialMorphisms<X> {
  readonly isTrivialCofibration: (f: X) => boolean;
  readonly isTrivialFibration: (p: X) => boolean;
}

/**
 * Model Category
 * 
 * Abstract model-category surface with explicit Quillen axioms M1-M5
 */
export interface ModelCategory<X> {
  // M1: Completeness and cocompleteness
  readonly hasAllLimits: boolean;
  readonly hasAllColimits: boolean;
  
  // Predicates
  readonly isCofibration: (f: X) => boolean;
  readonly isFibration: (p: X) => boolean;
  readonly isWeakEquivalence: (f: X) => boolean;
  
  // M4 (lifting) and M5 (factorization) — placeholders/witness hooks:
  readonly lift?: (i: X, p: X) => X | undefined; // produce a diagonal if exists
  readonly factor: (f: X) => { cofibration: X; trivialFibration: X } | { trivialCofibration: X; fibration: X };
  
  // M2 (2-of-3)
  readonly has2of3: (g: X, f: X, h: X) => boolean;
  
  // Optional structure
  readonly isLeftProper?: boolean;
  readonly isRightProper?: boolean;
  readonly isSimplicial?: boolean;
}

/**
 * Build Options
 * 
 * Options for building the sheaf model
 */
export interface BuildOptions {
  readonly checkCofibrantlyGenerated?: boolean; // ensure I,J are sets & small
  readonly enableSmallObjectArgument?: boolean; // use SOA for factorization
  readonly strictLocality?: boolean; // require strict locality checks
  readonly debug?: boolean; // enable debug output
}

// ============================================================================
// MAIN BUILDER FUNCTION
// ============================================================================

/**
 * Build Sheaf Model
 * 
 * Main builder: interpretable data + Set-based axioms ⇒ functorially in any topos
 * 
 * This is the core of Beke's lifting theorem. Given a sheafifiable spec that
 * works in Sets, this function produces a model category structure on sheaves
 * over any site.
 */
export function buildSheafModel<X>(
  site: Site,
  topology: GrothendieckTopology,
  spec: SheafifiableSpec<X>,
  presentable: LocallyPresentable,
  _opts: BuildOptions = {}
): ModelCategory<X> {
  
  // Validate cofibrantly generated structure if requested
  if (_opts.checkCofibrantlyGenerated) {
    validateCofibrantlyGenerated(spec);
  }

  // Core model category structure
  const isCofibration = (f: X) =>
    spec.ops ? cofRetracts(spec.I, spec.ops)(f) : spec.cofibration(f);

  const isWeakEquivalence = (f: X): boolean => {
    // Localize over any available cover (paper: "locally weak equivalences")
    for (const U of site.objects) {
      const covers = topology.covers(U);
      for (const cover of covers) {
        if (spec.isLocalWeakEquivalence(f, cover)) {
          if (_opts.debug) {
            console.log(`Weak equivalence detected on cover:`, cover);
          }
          return true;
        }
      }
    }
    return false;
  };

  const isFibration = (p: X) => {
    if (spec.ops) return injRLP(spec.J, spec.ops)(p);
    if (!spec.hasRLP) return false;
    return spec.J.every(j => spec.hasRLP!(j.map, p));
  };

  const factor = (f: X) => {
    if (spec.ops) {
      const fac = smallObjectArgument(f, spec.I, spec.ops, { maxStages: 32 });
      return { cofibration: fac.left, trivialFibration: fac.right } as const;
    }
    // fallback (no ops): keep old placeholder
    return { cofibration: f, trivialFibration: f } as const;
  };

  const has2of3 = (g: X, f: X, h: X) => {
    // Stub: property-transfer harness will check this properly
    // The 2-out-of-3 property: if g∘f=h and two of f,g,h are weak equivalences, then the third is too
    return true;
  };

  return { 
    // M1: Completeness and cocompleteness
    hasAllLimits: presentable.hasAllLimits,
    hasAllColimits: presentable.hasAllColimits,
    
    // Predicates
    isCofibration, 
    isFibration, 
    isWeakEquivalence, 
    
    // M5 (factorization)
    factor, 
    
    // M2 (2-of-3)
    has2of3,
    
    // Optional structure (only include if defined)
    ...(spec.isLeftProper !== undefined && { isLeftProper: spec.isLeftProper }),
    ...(spec.isRightProper !== undefined && { isRightProper: spec.isRightProper }),
    ...(spec.isSimplicial !== undefined && { isSimplicial: spec.isSimplicial })
  };
}

// ============================================================================
// FUNCTORIALITY IN THE TOPOS PARAMETER
// ============================================================================

/**
 * Topos Point
 * 
 * A topos "point" lets you speak of the set-based stalk (paper: "constant stalk" viewpoint)
 */
export interface ToposPoint<Obj> { 
  readonly stalk: (A: Obj) => unknown; /* Set-object */
  readonly name?: string;
}

/**
 * Topos Parameter
 * 
 * Parameter for functoriality in the topos
 */
export interface ToposParameter<Obj, Mor> {
  readonly objects: readonly Obj[];
  readonly morphisms: readonly Mor[];
  readonly points?: readonly ToposPoint<Obj>[]; // optional stalks
  readonly site?: Site;
  readonly topology?: GrothendieckTopology;
}

/**
 * Geometric Morphism
 * 
 * A geometric morphism between topoi
 */
export interface GeometricMorphism<ShA, ShB> {
  readonly leftExactPullback: (b: ShB) => ShA; // f^*
  readonly rightAdjointPushforward: (a: ShA) => ShB; // f_*
  readonly leftAdjointPushforward?: (a: ShA) => ShB; // f_! (if essential)
}

/**
 * Quillen Adjunction
 * 
 * A Quillen adjunction between model categories
 */
export interface QuillenAdjunction<A, B> {
  readonly left: (b: B) => A;   // left Quillen functor (often f^*)
  readonly right: (a: A) => B;  // right Quillen functor (often f_*)
  readonly preservesCofibrations: (f: B) => boolean;
  readonly preservesTrivialCofibrations: (f: B) => boolean;
  readonly preservesFibrations: (p: A) => boolean;
  readonly preservesTrivialFibrations: (p: A) => boolean;
}

/**
 * Beke Functor
 * 
 * The functor sending geometric morphisms to Quillen adjunctions
 */
export function bekeFunctor<A, B>(
  f: GeometricMorphism<A, B>,
  modelA: ModelCategory<A>,
  modelB: ModelCategory<B>
): QuillenAdjunction<A, B> {
  return {
    left: f.leftExactPullback,
    right: f.rightAdjointPushforward,
    preservesCofibrations: (g) => modelA.isCofibration(f.leftExactPullback(g as unknown as B) as unknown as A),
    preservesTrivialCofibrations: (g) => {
      const Lg = f.leftExactPullback(g as unknown as B) as unknown as A;
      return modelA.isCofibration(Lg) && modelA.isWeakEquivalence(Lg);
    },
    preservesFibrations: (p) => modelB.isFibration(f.rightAdjointPushforward(p as unknown as A) as unknown as B),
    preservesTrivialFibrations: (p) => {
      const Rp = f.rightAdjointPushforward(p as unknown as A) as unknown as B;
      return modelB.isFibration(Rp) && modelB.isWeakEquivalence(Rp);
    }
  };
}

// ============================================================================
// VALIDATION AND UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate Cofibrantly Generated Structure
 * 
 * Check that the generating sets I and J are valid
 */
function validateCofibrantlyGenerated<X>(spec: SheafifiableSpec<X>): void {
  if (!spec.I || spec.I.length === 0) {
    throw new Error('Generating set I cannot be empty');
  }
  
  if (!spec.J || spec.J.length === 0) {
    throw new Error('Generating set J cannot be empty');
  }
  
  // Check that all generating maps have small domains
  for (const i of spec.I) {
    if (!i.domainSmall) {
      throw new Error(`Generating cofibration ${i.name || 'unnamed'} does not have small domain`);
    }
  }
  
  for (const j of spec.J) {
    if (!j.domainSmall) {
      throw new Error(`Generating trivial cofibration ${j.name || 'unnamed'} does not have small domain`);
    }
  }
}

/**
 * Create Simple Site
 * 
 * Create a simple site for testing
 */
export function createSimpleSite(objects: readonly unknown[]): Site {
  return { objects };
}

/**
 * Create Simple Topology
 * 
 * Create a simple topology for testing
 */
export function createSimpleTopology(covers: (U: unknown) => Cover[]): GrothendieckTopology {
  return {
    covers,
    sieves: (U: unknown) => [] // stub
  };
}

/**
 * Create Simple Sheafifiable Spec
 * 
 * Create a simple sheafifiable spec for testing
 */
export function createSimpleSheafifiableSpec<X>(
  I: readonly GeneratingMap<X>[],
  J: readonly GeneratingMap<X>[],
  cofibration: (f: X) => boolean,
  isLocalWeakEquivalence: (f: X, cover: Cover) => boolean
): SheafifiableSpec<X> {
  return {
    I,
    J,
    cofibration,
    trivialCofibration: (f: X) => cofibration(f), // stub
    isLocalWeakEquivalence
  };
}
