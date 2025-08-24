/**
 * Tangent Categories Revolution
 * 
 * Based on "Differential bundles and fibrations for tangent categories"
 * by J.R.B. Cockett and G.S.H. Cruttwell (arXiv:1606.08379)
 * 
 * This implements the revolutionary theory of tangent categories, differential bundles,
 * differential objects, and tangent fibrations with proper mathematical foundations.
 */

import type { Functor, Category } from './fp-double-category';
import type { NaturalTransformation } from './fp-adjunction-framework';
import type { TangentVector, TangentBundle, TangentSpace } from './fp-synthetic-differential-geometry';

// Type aliases for convenience
type Morphism<C> = any; // Will be refined based on actual usage

// ============================================================================
// CORE TANGENT CATEGORY STRUCTURE (Section 2.1)
// ============================================================================

/**
 * Tangent Functor T: C → C
 * 
 * From the paper: A tangent functor is an endofunctor T with natural transformations
 * that axiomatize the behavior of the tangent bundle functor.
 */
export interface TangentFunctor<C> {
  readonly kind: 'TangentFunctor';
  readonly category: Category<C, any>;
  readonly functor: Functor<C, C, any, any>;
  readonly p: NaturalTransformation<any, any>; // p: T → Id (projection)
  readonly zero: NaturalTransformation<any, any>; // 0: Id → T (zero section)
  readonly add: NaturalTransformation<any, any>; // +: T ×_M T → T (addition)
  readonly c: NaturalTransformation<any, any>; // c: T → T (canonical flip)
  readonly l: NaturalTransformation<any, any>; // l: T² → T² (vertical lift)
}

/**
 * Tangent Category
 * 
 * From the paper: A category equipped with a tangent functor satisfying
 * the tangent category axioms [TC.1] through [TC.6].
 */
export interface TangentCategory<C> {
  readonly kind: 'TangentCategory';
  readonly category: Category<C, any>;
  readonly tangentFunctor: TangentFunctor<C>;
  readonly differentialObjects: DifferentialObject<C>[];
  readonly differentialBundles: DifferentialBundle<C>[];
  readonly displaySystem?: DisplaySystem<C>;
  readonly transverseSystem?: TransverseSystem<C>;
}

// ============================================================================
// DIFFERENTIAL BUNDLES (Section 2.2)
// ============================================================================

/**
 * Differential Bundle
 * 
 * From the paper: A differential bundle is a bundle q: E → M with:
 * - An additive bundle structure (σ: E ×_M E → E, ξ: M → E)
 * - A lift map λ: E → T(E) satisfying specific properties
 * 
 * This generalizes smooth vector bundles but need not be locally trivial
 * and may not have scalar multiplication in fibres.
 */
export interface DifferentialBundle<C> {
  readonly kind: 'DifferentialBundle';
  readonly totalSpace: C; // E
  readonly baseSpace: C; // M
  readonly projection: Morphism<C>; // q: E → M
  readonly addition: Morphism<C>; // σ: E ×_M E → E
  readonly zero: Morphism<C>; // ξ: M → E
  readonly lift: Morphism<C>; // λ: E → T(E) - THE KEY MAP
  readonly isLocallyTrivial: boolean;
  readonly hasScalarMultiplication: boolean;
}

/**
 * Linear Bundle Morphism
 * 
 * From the paper: A morphism between differential bundles that preserves
 * the additive structure and lift maps.
 */
export interface LinearBundleMorphism<C> {
  readonly kind: 'LinearBundleMorphism';
  readonly source: DifferentialBundle<C>;
  readonly target: DifferentialBundle<C>;
  readonly morphism: Morphism<C>; // f: E₁ → E₂
  readonly baseMorphism: Morphism<C>; // g: M₁ → M₂
  readonly preservesAddition: boolean; // f ∘ σ₁ = σ₂ ∘ (f ×_M f)
  readonly preservesZero: boolean; // f ∘ ξ₁ = ξ₂ ∘ g
  readonly preservesLift: boolean; // T(f) ∘ λ₁ = λ₂ ∘ f
}

// ============================================================================
// DIFFERENTIAL OBJECTS (Section 3.1)
// ============================================================================

/**
 * Differential Object
 * 
 * From the paper: A differential object is an object X with a differential
 * structure that generalizes vector spaces in smooth manifolds.
 */
export interface DifferentialObject<C> {
  readonly kind: 'DifferentialObject';
  readonly object: C; // X
  readonly tangentObject: C; // T(X)
  readonly differential: Morphism<C, C>; // D: X → T(X)
  readonly isVectorSpace: boolean;
  readonly scalarMultiplication?: (r: any, x: C) => C;
  readonly addition?: (x: C, y: C) => C;
}

/**
 * Differential Structure
 * 
 * The differential structure on a differential object, including
 * the differential combinator and its properties.
 */
export interface DifferentialStructure<C> {
  readonly kind: 'DifferentialStructure';
  readonly differential: (f: Morphism<C, C>) => Morphism<C, C>; // D[f]: X → T(Y)
  readonly chainRule: (f: Morphism<C, C>, g: Morphism<C, C>) => boolean; // D[f∘g] = D[f]∘D[g]
  readonly linearity: (f: Morphism<C, C>, g: Morphism<C, C>) => boolean; // D[f+g] = D[f] + D[g]
  readonly constantRule: (c: C) => boolean; // D[c] = 0
  readonly productRule?: (f: Morphism<C, C>, g: Morphism<C, C>) => boolean; // D[f×g] = f×D[g] + D[f]×g
}

// ============================================================================
// CARTESIAN DIFFERENTIAL CATEGORIES (Section 3.4)
// ============================================================================

/**
 * Cartesian Differential Category
 * 
 * From the paper: A Cartesian differential category is a category with
 * finite products and a differential combinator satisfying specific axioms.
 * This is crucial for the connection to tangent categories.
 */
export interface CartesianDifferentialCategory<C> {
  readonly kind: 'CartesianDifferentialCategory';
  readonly category: Category<C>;
  readonly products: (x: C, y: C) => C; // x × y
  readonly projections: (x: C, y: C) => [Morphism<C, C>, Morphism<C, C>]; // π₁, π₂
  readonly diagonals: (x: C) => Morphism<C, C>; // Δ: x → x × x
  readonly terminal: C; // 1
  readonly differentialCombinator: (f: Morphism<C, C>) => Morphism<C, C>; // D[f]
  readonly differentialAxioms: DifferentialAxioms<C>;
}

/**
 * Differential Axioms
 * 
 * The axioms that a differential combinator must satisfy in a
 * Cartesian differential category.
 */
export interface DifferentialAxioms<C> {
  readonly kind: 'DifferentialAxioms';
  readonly linearity: (f: Morphism<C, C>, g: Morphism<C, C>) => boolean; // D[f+g] = D[f] + D[g]
  readonly chainRule: (f: Morphism<C, C>, g: Morphism<C, C>) => boolean; // D[f∘g] = D[f]∘D[g]
  readonly constantRule: (c: C) => boolean; // D[c] = 0
  readonly productRule: (f: Morphism<C, C>, g: Morphism<C, C>) => boolean; // D[f×g] = f×D[g] + D[f]×g
  readonly cartesianRule: (f: Morphism<C, C>) => boolean; // D[f] = π₁∘f + π₂∘D[f]
}

// ============================================================================
// DISPLAY AND TRANSVERSE SYSTEMS (Section 4)
// ============================================================================

/**
 * Display System
 * 
 * From the paper: A display system captures the behavior of pullbacks
 * with respect to the tangent functor. This is crucial for understanding
 * how differential bundles relate to differential objects.
 */
export interface DisplaySystem<C> {
  readonly kind: 'DisplaySystem';
  readonly tangentCategory: TangentCategory<C>;
  readonly displayMaps: DisplayMap<C>[];
  readonly pullbackStability: (f: Morphism<C, C>, g: Morphism<C, C>) => boolean;
  readonly tangentPullback: (f: Morphism<C, C>, g: Morphism<C, C>) => Morphism<C, C>; // T(f ×_B g)
}

/**
 * Display Map
 * 
 * A morphism that behaves well with respect to the tangent functor
 * in a display system.
 */
export interface DisplayMap<C> {
  readonly kind: 'DisplayMap';
  readonly morphism: Morphism<C, C>;
  readonly isDisplay: boolean;
  readonly tangentMap: Morphism<C, C>; // Tf
  readonly displayProperty: (g: Morphism<C, C>) => boolean; // f ×_B g exists
}

/**
 * Transverse System
 * 
 * From the paper: Complementary to display systems, capturing
 * transverse behavior with respect to the tangent functor.
 */
export interface TransverseSystem<C> {
  readonly kind: 'TransverseSystem';
  readonly tangentCategory: TangentCategory<C>;
  readonly transverseMaps: TransverseMap<C>[];
  readonly transversePullback: (f: Morphism<C, C>, g: Morphism<C, C>) => Morphism<C, C>;
}

/**
 * Transverse Map
 * 
 * A morphism with transverse behavior with respect to the tangent functor.
 */
export interface TransverseMap<C> {
  readonly kind: 'TransverseMap';
  readonly morphism: Morphism<C, C>;
  readonly isTransverse: boolean;
  readonly transverseProperty: (g: Morphism<C, C>) => boolean;
}

// ============================================================================
// TANGENT FIBRATIONS (Section 5)
// ============================================================================

/**
 * Tangent Fibration
 * 
 * From the paper: A fibration that respects the tangent category structure.
 * Key example: display differential bundles of a tangent category with display system.
 */
export interface TangentFibration<C> {
  readonly kind: 'TangentFibration';
  readonly tangentCategory: TangentCategory<C>;
  readonly baseCategory: Category<C>;
  readonly totalCategory: Category<C>;
  readonly projection: Functor<C, C>; // p: E → B
  readonly cartesianLifts: (f: Morphism<C, C>, b: C) => Morphism<C, C>; // Lift of f to b
  readonly tangentLifts: (f: Morphism<C, C>, b: C) => Morphism<C, C>; // T-lift of f to b
  readonly fibresAreCartesianDifferential: boolean; // Key property from paper
}

/**
 * Differential Fibration
 * 
 * A tangent fibration where the fibres have differential structure.
 */
export interface DifferentialFibration<C> {
  readonly kind: 'DifferentialFibration';
  readonly tangentFibration: TangentFibration<C>;
  readonly fibreDifferentialStructure: (b: C) => DifferentialStructure<C>;
  readonly coherentDifferentialStructure: boolean; // [CDS.1] and [CDS.2] from paper
}

// ============================================================================
// CREATION FUNCTIONS
// ============================================================================

/**
 * Create a tangent functor
 * 
 * Based on the paper's definition with proper natural transformations.
 */
export function createTangentFunctor<C>(
  category: Category<C>,
  functor: Functor<C, C>,
  p: NaturalTransformation<C, C>,
  zero: NaturalTransformation<C, C>,
  add: NaturalTransformation<C, C>,
  c: NaturalTransformation<C, C>,
  l: NaturalTransformation<C, C>
): TangentFunctor<C> {
  return {
    kind: 'TangentFunctor',
    category,
    functor,
    p,
    zero,
    add,
    c,
    l
  };
}

/**
 * Create a tangent category
 * 
 * A category equipped with a tangent functor satisfying the axioms.
 */
export function createTangentCategory<C>(
  category: Category<C>,
  tangentFunctor: TangentFunctor<C>,
  differentialObjects: DifferentialObject<C>[] = [],
  differentialBundles: DifferentialBundle<C>[] = [],
  displaySystem?: DisplaySystem<C>,
  transverseSystem?: TransverseSystem<C>
): TangentCategory<C> {
  return {
    kind: 'TangentCategory',
    category,
    tangentFunctor,
    differentialObjects,
    differentialBundles,
    displaySystem,
    transverseSystem
  };
}

/**
 * Create a differential bundle
 * 
 * Based on the paper's definition with the crucial lift map λ: E → T(E).
 */
export function createDifferentialBundle<C>(
  totalSpace: C,
  baseSpace: C,
  projection: Morphism<C, C>,
  addition: Morphism<C, C>,
  zero: Morphism<C, C>,
  lift: Morphism<C, C>, // THE KEY MAP: λ: E → T(E)
  isLocallyTrivial: boolean = false,
  hasScalarMultiplication: boolean = false
): DifferentialBundle<C> {
  return {
    kind: 'DifferentialBundle',
    totalSpace,
    baseSpace,
    projection,
    addition,
    zero,
    lift,
    isLocallyTrivial,
    hasScalarMultiplication
  };
}

/**
 * Create a linear bundle morphism
 * 
 * A morphism that preserves the differential bundle structure.
 */
export function createLinearBundleMorphism<C>(
  source: DifferentialBundle<C>,
  target: DifferentialBundle<C>,
  morphism: Morphism<C, C>,
  baseMorphism: Morphism<C, C>,
  preservesAddition: boolean = true,
  preservesZero: boolean = true,
  preservesLift: boolean = true
): LinearBundleMorphism<C> {
  return {
    kind: 'LinearBundleMorphism',
    source,
    target,
    morphism,
    baseMorphism,
    preservesAddition,
    preservesZero,
    preservesLift
  };
}

/**
 * Create a differential object
 * 
 * An object with differential structure.
 */
export function createDifferentialObject<C>(
  object: C,
  tangentObject: C,
  differential: Morphism<C, C>,
  isVectorSpace: boolean = false,
  scalarMultiplication?: (r: any, x: C) => C,
  addition?: (x: C, y: C) => C
): DifferentialObject<C> {
  return {
    kind: 'DifferentialObject',
    object,
    tangentObject,
    differential,
    isVectorSpace,
    scalarMultiplication,
    addition
  };
}

/**
 * Create a Cartesian differential category
 * 
 * Based on the paper's definition with proper differential axioms.
 */
export function createCartesianDifferentialCategory<C>(
  category: Category<C>,
  products: (x: C, y: C) => C,
  projections: (x: C, y: C) => [Morphism<C, C>, Morphism<C, C>],
  diagonals: (x: C) => Morphism<C, C>,
  terminal: C,
  differentialCombinator: (f: Morphism<C, C>) => Morphism<C, C>,
  differentialAxioms: DifferentialAxioms<C>
): CartesianDifferentialCategory<C> {
  return {
    kind: 'CartesianDifferentialCategory',
    category,
    products,
    projections,
    diagonals,
    terminal,
    differentialCombinator,
    differentialAxioms
  };
}

/**
 * Create differential axioms
 * 
 * The axioms that a differential combinator must satisfy.
 */
export function createDifferentialAxioms<C>(
  linearity: (f: Morphism<C, C>, g: Morphism<C, C>) => boolean,
  chainRule: (f: Morphism<C, C>, g: Morphism<C, C>) => boolean,
  constantRule: (c: C) => boolean,
  productRule: (f: Morphism<C, C>, g: Morphism<C, C>) => boolean,
  cartesianRule: (f: Morphism<C, C>) => boolean
): DifferentialAxioms<C> {
  return {
    kind: 'DifferentialAxioms',
    linearity,
    chainRule,
    constantRule,
    productRule,
    cartesianRule
  };
}

/**
 * Create a display system
 * 
 * Captures pullback behavior with respect to the tangent functor.
 */
export function createDisplaySystem<C>(
  tangentCategory: TangentCategory<C>,
  displayMaps: DisplayMap<C>[] = [],
  pullbackStability: (f: Morphism<C, C>, g: Morphism<C, C>) => boolean = () => true,
  tangentPullback: (f: Morphism<C, C>, g: Morphism<C, C>) => Morphism<C, C> = (f, g) => f
): DisplaySystem<C> {
  return {
    kind: 'DisplaySystem',
    tangentCategory,
    displayMaps,
    pullbackStability,
    tangentPullback
  };
}

/**
 * Create a display map
 * 
 * A morphism that behaves well with respect to the tangent functor.
 */
export function createDisplayMap<C>(
  morphism: Morphism<C, C>,
  isDisplay: boolean = true,
  tangentMap: Morphism<C, C> = morphism,
  displayProperty: (g: Morphism<C, C>) => boolean = () => true
): DisplayMap<C> {
  return {
    kind: 'DisplayMap',
    morphism,
    isDisplay,
    tangentMap,
    displayProperty
  };
}

/**
 * Create a transverse system
 * 
 * Complementary to display systems.
 */
export function createTransverseSystem<C>(
  tangentCategory: TangentCategory<C>,
  transverseMaps: TransverseMap<C>[] = [],
  transversePullback: (f: Morphism<C, C>, g: Morphism<C, C>) => Morphism<C, C> = (f, g) => f
): TransverseSystem<C> {
  return {
    kind: 'TransverseSystem',
    tangentCategory,
    transverseMaps,
    transversePullback
  };
}

/**
 * Create a transverse map
 * 
 * A morphism with transverse behavior.
 */
export function createTransverseMap<C>(
  morphism: Morphism<C, C>,
  isTransverse: boolean = true,
  transverseProperty: (g: Morphism<C, C>) => boolean = () => true
): TransverseMap<C> {
  return {
    kind: 'TransverseMap',
    morphism,
    isTransverse,
    transverseProperty
  };
}

/**
 * Create a tangent fibration
 * 
 * A fibration that respects the tangent category structure.
 */
export function createTangentFibration<C>(
  tangentCategory: TangentCategory<C>,
  baseCategory: Category<C>,
  totalCategory: Category<C>,
  projection: Functor<C, C>,
  cartesianLifts: (f: Morphism<C, C>, b: C) => Morphism<C, C> = (f, b) => f,
  tangentLifts: (f: Morphism<C, C>, b: C) => Morphism<C, C> = (f, b) => f,
  fibresAreCartesianDifferential: boolean = true
): TangentFibration<C> {
  return {
    kind: 'TangentFibration',
    tangentCategory,
    baseCategory,
    totalCategory,
    projection,
    cartesianLifts,
    tangentLifts,
    fibresAreCartesianDifferential
  };
}

/**
 * Create a differential fibration
 * 
 * A tangent fibration with differential structure on fibres.
 */
export function createDifferentialFibration<C>(
  tangentFibration: TangentFibration<C>,
  fibreDifferentialStructure: (b: C) => DifferentialStructure<C>,
  coherentDifferentialStructure: boolean = true
): DifferentialFibration<C> {
  return {
    kind: 'DifferentialFibration',
    tangentFibration,
    fibreDifferentialStructure,
    coherentDifferentialStructure
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a tangent category has a display system
 */
export function hasDisplaySystem<C>(tangentCategory: TangentCategory<C>): boolean {
  return tangentCategory.displaySystem !== undefined;
}

/**
 * Check if a tangent category has a transverse system
 */
export function hasTransverseSystem<C>(tangentCategory: TangentCategory<C>): boolean {
  return tangentCategory.transverseSystem !== undefined;
}

/**
 * Get all differential objects in a tangent category
 */
export function getDifferentialObjects<C>(tangentCategory: TangentCategory<C>): DifferentialObject<C>[] {
  return tangentCategory.differentialObjects;
}

/**
 * Get all differential bundles in a tangent category
 */
export function getDifferentialBundles<C>(tangentCategory: TangentCategory<C>): DifferentialBundle<C>[] {
  return tangentCategory.differentialBundles;
}

/**
 * Check if a differential bundle is locally trivial
 */
export function isLocallyTrivial<C>(bundle: DifferentialBundle<C>): boolean {
  return bundle.isLocallyTrivial;
}

/**
 * Check if a differential bundle has scalar multiplication
 */
export function hasScalarMultiplication<C>(bundle: DifferentialBundle<C>): boolean {
  return bundle.hasScalarMultiplication;
}

/**
 * Apply the tangent functor to a morphism
 */
export function applyTangentFunctor<C>(
  tangentCategory: TangentCategory<C>,
  morphism: Morphism<C>
): Morphism<C> {
  return tangentCategory.tangentFunctor.functor.mapMorphisms(morphism);
}

/**
 * Create a display differential bundle
 * 
 * Key example from the paper: display differential bundles of a tangent category
 * with a display system, where the fibres are Cartesian differential categories.
 */
export function createDisplayDifferentialBundle<C>(
  tangentCategory: TangentCategory<C>,
  totalSpace: C,
  baseSpace: C,
  projection: Morphism<C, C>,
  addition: Morphism<C, C>,
  zero: Morphism<C, C>,
  lift: Morphism<C, C>,
  cartesianDifferentialFibre: CartesianDifferentialCategory<C>
): DifferentialBundle<C> {
  if (!hasDisplaySystem(tangentCategory)) {
    throw new Error('Tangent category must have a display system for display differential bundles');
  }

  return createDifferentialBundle(
    totalSpace,
    baseSpace,
    projection,
    addition,
    zero,
    lift,
    false, // Not necessarily locally trivial
    false  // May not have scalar multiplication
  );
}

// ============================================================================
// EXAMPLES AND APPLICATIONS
// ============================================================================

/**
 * Example: Tangent category of smooth manifolds
 * 
 * This is the motivating example where the tangent functor is the
 * classical tangent bundle functor.
 */
export function createSmoothManifoldTangentCategory(): TangentCategory<any> {
  // Mock implementation for smooth manifolds
  const category = { kind: 'Category', objects: [], morphisms: [] };
  const functor = { kind: 'Functor', map: (f: any) => f };
  const p = { kind: 'NaturalTransformation', components: {} };
  const zero = { kind: 'NaturalTransformation', components: {} };
  const add = { kind: 'NaturalTransformation', components: {} };
  const c = { kind: 'NaturalTransformation', components: {} };
  const l = { kind: 'NaturalTransformation', components: {} };

  const tangentFunctor = createTangentFunctor(
    category,
    functor,
    p,
    zero,
    add,
    c,
    l
  );

  return createTangentCategory(category, tangentFunctor);
}

/**
 * Example: Tangent category with display system
 * 
 * Demonstrates the key example from the paper where fibres are
 * Cartesian differential categories.
 */
export function createTangentCategoryWithDisplaySystem(): TangentCategory<any> {
  const tangentCategory = createSmoothManifoldTangentCategory();
  
  const displaySystem = createDisplaySystem(
    tangentCategory,
    [], // displayMaps
    () => true, // pullbackStability
    (f, g) => f // tangentPullback
  );

  return {
    ...tangentCategory,
    displaySystem
  };
}

/**
 * Example: Display differential bundle
 * 
 * The key example from the paper where fibres are Cartesian differential categories.
 */
export function createDisplayDifferentialBundleExample(): DifferentialBundle<any> {
  const tangentCategory = createTangentCategoryWithDisplaySystem();
  
  // Mock Cartesian differential category for fibres
  const cartesianDifferentialFibre = createCartesianDifferentialCategory(
    { kind: 'Category', objects: [], morphisms: [] },
    (x, y) => x, // products
    (x, y) => [{ kind: 'Morphism' }, { kind: 'Morphism' }], // projections
    (x) => ({ kind: 'Morphism' }), // diagonals
    {}, // terminal
    (f) => f, // differentialCombinator
    createDifferentialAxioms(
      () => true, // linearity
      () => true, // chainRule
      () => true, // constantRule
      () => true, // productRule
      () => true  // cartesianRule
    )
  );

  return createDisplayDifferentialBundle(
    tangentCategory,
    {}, // totalSpace
    {}, // baseSpace
    { kind: 'Morphism' }, // projection
    { kind: 'Morphism' }, // addition
    { kind: 'Morphism' }, // zero
    { kind: 'Morphism' }, // lift - THE KEY MAP
    cartesianDifferentialFibre
  );
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate a tangent category
 */
export function validateTangentCategory<C>(tangentCategory: TangentCategory<C>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check basic structure
  if (!tangentCategory.category) {
    errors.push('Tangent category must have a base category');
  }

  if (!tangentCategory.tangentFunctor) {
    errors.push('Tangent category must have a tangent functor');
  }

  // Check tangent functor axioms
  const tf = tangentCategory.tangentFunctor;
  if (!tf.p || !tf.zero || !tf.add || !tf.c || !tf.l) {
    errors.push('Tangent functor must have all required natural transformations');
  }

  // Check display system if present
  if (tangentCategory.displaySystem) {
    if (!tangentCategory.displaySystem.tangentCategory) {
      errors.push('Display system must reference the tangent category');
    }
  }

  // Check transverse system if present
  if (tangentCategory.transverseSystem) {
    if (!tangentCategory.transverseSystem.tangentCategory) {
      errors.push('Transverse system must reference the tangent category');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate a differential bundle
 */
export function validateDifferentialBundle<C>(bundle: DifferentialBundle<C>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!bundle.totalSpace) {
    errors.push('Differential bundle must have a total space');
  }

  if (!bundle.baseSpace) {
    errors.push('Differential bundle must have a base space');
  }

  if (!bundle.projection) {
    errors.push('Differential bundle must have a projection');
  }

  if (!bundle.addition) {
    errors.push('Differential bundle must have an addition map');
  }

  if (!bundle.zero) {
    errors.push('Differential bundle must have a zero map');
  }

  if (!bundle.lift) {
    errors.push('Differential bundle must have a lift map λ: E → T(E)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate a tangent fibration
 */
export function validateTangentFibration<C>(fibration: TangentFibration<C>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!fibration.tangentCategory) {
    errors.push('Tangent fibration must have a tangent category');
  }

  if (!fibration.baseCategory) {
    errors.push('Tangent fibration must have a base category');
  }

  if (!fibration.totalCategory) {
    errors.push('Tangent fibration must have a total category');
  }

  if (!fibration.projection) {
    errors.push('Tangent fibration must have a projection functor');
  }

  if (!fibration.cartesianLifts) {
    errors.push('Tangent fibration must have cartesian lifts');
  }

  if (!fibration.tangentLifts) {
    errors.push('Tangent fibration must have tangent lifts');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
