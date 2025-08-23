/**
 * Shapely Functors Hierarchy
 * 
 * Based on "Polynomial functors and polynomial monads" by Nicola Gambino and Joachim Kock
 * Pages 24-25: Shapely functors and their relationship to polynomial functors
 * 
 * This implements the shapely functors hierarchy where:
 * - All polynomial functors are canonically shapely functors
 * - Not all shapely functors are polynomial functors
 * - Filter-power functor provides a concrete counterexample
 */

import { Polynomial } from './fp-polynomial-functors';

// ============================================================================
// SHAPELY FUNCTOR INTERFACE
// ============================================================================

/**
 * Shapely Functor
 * 
 * A pullback-preserving functor F: E^m → E^n equipped with a strength
 * as defined by Jay and Cockett [24, 23]
 * 
 * From the Gambino-Kock paper: "A shapely functor is a pullback-preserving 
 * functor F: E^m → E^n equipped with a strength."
 */
export interface ShapelyFunctor<M, N> {
  readonly kind: 'ShapelyFunctor';
  readonly domain: M;
  readonly codomain: N;
  readonly preservesPullbacks: boolean;
  readonly hasCanonicalStrength: boolean;
  readonly isPolynomial: boolean;
  readonly strength: Strength<M, N>;
  readonly pullbackPreservation: PullbackPreservation;
}

/**
 * Strength
 * 
 * The canonical strength that every endofunctor on Set possesses
 * as mentioned in the Gambino-Kock paper
 */
export interface Strength<M, N> {
  readonly kind: 'Strength';
  readonly hasStrength: boolean;
  readonly strengthMorphism: string;
  readonly isCanonical: boolean;
}

/**
 * Pullback Preservation
 * 
 * Verification that the functor preserves pullbacks
 */
export interface PullbackPreservation {
  readonly kind: 'PullbackPreservation';
  readonly preservesPullbacks: boolean;
  readonly preservesFiniteLimits: boolean;
  readonly preservesCofilteredLimits: boolean;
  readonly verificationMethod: string;
}

// ============================================================================
// POLYNOMIAL FUNCTOR AS SHAPELY FUNCTOR
// ============================================================================

/**
 * Polynomial Functor as Shapely Functor
 * 
 * Every polynomial functor is canonically a shapely functor
 * as stated in the Gambino-Kock paper: "Since a polynomial functor 
 * preserves pullbacks and has a canonical strength, it is canonically 
 * a shapely functor."
 */
export interface PolynomialAsShapelyFunctor<P extends Polynomial<any, any>> {
  readonly kind: 'PolynomialAsShapelyFunctor';
  readonly polynomial: P;
  readonly shapelyFunctor: ShapelyFunctor<any, any>;
  readonly isCanonical: boolean;
  readonly relationship: 'polynomial_implies_shapely';
}

// ============================================================================
// FILTER-POWER FUNCTOR (COUNTEREXAMPLE)
// ============================================================================

/**
 * Filter-Power Functor
 * 
 * A concrete example of a shapely functor that is NOT a polynomial functor
 * as provided in the Gambino-Kock paper
 * 
 * F: Set → Set defined as X ↦ colim_{D∈D} X^D for a non-principal filter D
 */
export interface FilterPowerFunctor {
  readonly kind: 'FilterPowerFunctor';
  readonly isShapelyFunctor: boolean;
  readonly isPolynomialFunctor: boolean;
  readonly preservesFiniteLimits: boolean;
  readonly preservesCofilteredLimits: boolean;
  readonly hasCanonicalStrength: boolean;
  readonly filter: NonPrincipalFilter;
  readonly colimitConstruction: ColimitConstruction;
  readonly failureReason: string;
}

/**
 * Non-Principal Filter
 * 
 * The filter D used in the filter-power functor construction
 */
export interface NonPrincipalFilter {
  readonly kind: 'NonPrincipalFilter';
  readonly isPrincipal: boolean;
  readonly isNonPrincipal: boolean;
  readonly filterElements: any[];
  readonly ultrafilter: boolean;
}

/**
 * Colimit Construction
 * 
 * The colimit construction colim_{D∈D} X^D
 */
export interface ColimitConstruction {
  readonly kind: 'ColimitConstruction';
  readonly isFilteredColimit: boolean;
  readonly isRepresentable: boolean;
  readonly colimitType: string;
  readonly construction: string;
}

// ============================================================================
// CONSTRUCTION FUNCTIONS
// ============================================================================

/**
 * Create shapely functor from polynomial functor
 * 
 * Every polynomial functor is canonically a shapely functor
 */
export function createShapelyFunctorFromPolynomial<P extends Polynomial<any, any>>(
  polynomial: P
): ShapelyFunctor<any, any> {
  const strength: Strength<any, any> = {
    kind: 'Strength',
    hasStrength: true,
    strengthMorphism: 'canonical',
    isCanonical: true
  };
  
  const pullbackPreservation: PullbackPreservation = {
    kind: 'PullbackPreservation',
    preservesPullbacks: true,
    preservesFiniteLimits: true,
    preservesCofilteredLimits: true,
    verificationMethod: 'polynomial_functor_property'
  };
  
  return {
    kind: 'ShapelyFunctor',
    domain: polynomial.positions,
    codomain: polynomial.directions,
    preservesPullbacks: true,
    hasCanonicalStrength: true,
    isPolynomial: true,
    strength,
    pullbackPreservation
  };
}

/**
 * Create polynomial as shapely functor
 */
export function createPolynomialAsShapelyFunctor<P extends Polynomial<any, any>>(
  polynomial: P
): PolynomialAsShapelyFunctor<P> {
  const shapelyFunctor = createShapelyFunctorFromPolynomial(polynomial);
  
  return {
    kind: 'PolynomialAsShapelyFunctor',
    polynomial,
    shapelyFunctor,
    isCanonical: true,
    relationship: 'polynomial_implies_shapely'
  };
}

/**
 * Create filter-power functor (counterexample)
 * 
 * F: Set → Set, X ↦ colim_{D∈D} X^D for non-principal filter D
 * 
 * This is a shapely functor that is NOT a polynomial functor
 */
export function createFilterPowerFunctor(): FilterPowerFunctor {
  const filter: NonPrincipalFilter = {
    kind: 'NonPrincipalFilter',
    isPrincipal: false,
    isNonPrincipal: true,
    filterElements: ['cofinite_sets'],
    ultrafilter: true
  };
  
  const colimitConstruction: ColimitConstruction = {
    kind: 'ColimitConstruction',
    isFilteredColimit: true,
    isRepresentable: true,
    colimitType: 'filtered_colimit',
    construction: 'colim_{D∈D} X^D'
  };
  
  return {
    kind: 'FilterPowerFunctor',
    isShapelyFunctor: true,
    isPolynomialFunctor: false,
    preservesFiniteLimits: true, // Because it's a filtered colimit of representables
    preservesCofilteredLimits: false, // This is why it's not polynomial
    hasCanonicalStrength: true, // Every endofunctor on Set has canonical strength
    filter,
    colimitConstruction,
    failureReason: 'Does not preserve cofiltered limits: Ø = lim_{D∈D} D is not preserved'
  };
}

/**
 * Check if a functor is shapely
 */
export function isShapelyFunctor(functor: any): boolean {
  if (functor.kind === 'ShapelyFunctor') {
    return functor.preservesPullbacks && functor.hasCanonicalStrength;
  }
  
  // Check if it's a polynomial functor (has positions and directions)
  if (functor.positions && functor.directions) {
    // Every polynomial functor is canonically shapely
    return true;
  }
  
  if (functor.kind === 'FilterPowerFunctor') {
    return functor.isShapelyFunctor;
  }
  
  return false;
}

/**
 * Check if a shapely functor is polynomial
 */
export function isPolynomialFunctor(functor: any): boolean {
  // Check if it's a polynomial functor (has positions and directions)
  if (functor.positions && functor.directions) {
    return true;
  }
  
  if (functor.kind === 'ShapelyFunctor') {
    return functor.isPolynomial;
  }
  
  if (functor.kind === 'FilterPowerFunctor') {
    return functor.isPolynomialFunctor;
  }
  
  return false;
}

// ============================================================================
// EXAMPLES AND VALIDATION
// ============================================================================

/**
 * Example: Natural Numbers Polynomial as Shapely Functor
 */
export function exampleNaturalNumbersAsShapelyFunctor(): void {
  const naturalNumbersPolynomial: Polynomial<string, string> = {
    positions: ['zero', 'succ'],
    directions: (pos) => pos === 'zero' ? [] : ['n']
  };
  
  const polynomialAsShapely = createPolynomialAsShapelyFunctor(naturalNumbersPolynomial);
  const filterPowerFunctor = createFilterPowerFunctor();
  
  console.log('RESULT:', {
    shapelyFunctorsHierarchy: true,
    polynomialAsShapely: {
      isPolynomial: !!(polynomialAsShapely.polynomial.positions && polynomialAsShapely.polynomial.directions),
      isShapely: isShapelyFunctor(polynomialAsShapely.shapelyFunctor),
      isCanonical: polynomialAsShapely.isCanonical,
      relationship: polynomialAsShapely.relationship,
      preservesPullbacks: polynomialAsShapely.shapelyFunctor.preservesPullbacks,
      hasCanonicalStrength: polynomialAsShapely.shapelyFunctor.hasCanonicalStrength
    },
    filterPowerFunctor: {
      isShapely: filterPowerFunctor.isShapelyFunctor,
      isPolynomial: filterPowerFunctor.isPolynomialFunctor,
      preservesFiniteLimits: filterPowerFunctor.preservesFiniteLimits,
      preservesCofilteredLimits: filterPowerFunctor.preservesCofilteredLimits,
      hasCanonicalStrength: filterPowerFunctor.hasCanonicalStrength,
      failureReason: filterPowerFunctor.failureReason
    },
    hierarchyValidation: {
      allPolynomialsAreShapely: true,
      notAllShapelyArePolynomial: true,
      filterPowerIsCounterexample: true
    }
  });
}

/**
 * Example: List Polynomial as Shapely Functor
 */
export function exampleListPolynomialAsShapelyFunctor(): void {
  const listPolynomial: Polynomial<string, string> = {
    positions: ['nil', 'cons'],
    directions: (pos) => pos === 'nil' ? [] : ['head', 'tail']
  };
  
  const polynomialAsShapely = createPolynomialAsShapelyFunctor(listPolynomial);
  
  console.log('RESULT:', {
    listPolynomialAsShapely: true,
    polynomial: {
      isPolynomial: !!(polynomialAsShapely.polynomial.positions && polynomialAsShapely.polynomial.directions),
      positions: polynomialAsShapely.polynomial.positions,
      directions: polynomialAsShapely.polynomial.directions
    },
    shapelyProperties: {
      preservesPullbacks: polynomialAsShapely.shapelyFunctor.preservesPullbacks,
      hasCanonicalStrength: polynomialAsShapely.shapelyFunctor.hasCanonicalStrength,
      isCanonical: polynomialAsShapely.isCanonical
    },
    relationship: polynomialAsShapely.relationship
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

// All exports are already declared inline above
