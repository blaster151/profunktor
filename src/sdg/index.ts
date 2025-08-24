/**
 * Synthetic Differential Geometry (SDG) Module Exports
 * 
 * This is the main entry point for the modular SDG system.
 * It re-exports all the functionality from the original monolithic file
 * while maintaining the same API for backward compatibility.
 */

// ============================================================================
// CATEGORICAL LOGIC MODULES
// ============================================================================

// Page 108: Function Objects
export * from './categorical-logic/function-objects';

// Page 109: Extensionality Principle & λ-conversion
export * from './categorical-logic/extensionality';

// Page 110: Function Description & Homomorphisms
export * from './categorical-logic/function-description';

// Page 111: Hom-Objects & Ring Structures
export * from './categorical-logic/hom-objects';

// ============================================================================
// CORE SDG MODULES (TO BE EXTRACTED)
// ============================================================================
// export * from './categorical-logic/function-description'; // Page 110
// export * from './categorical-logic/hom-objects';        // Page 111

// ============================================================================
// CORE SDG MODULES (TO BE EXTRACTED)
// ============================================================================

// TODO: Extract these from the main file:
// export * from './core/axioms';           // Kock-Lawvere axiom
// export * from './core/infinitesimals';   // D, D_k, D(n)
// export * from './core/rings';            // Ring objects, Q-algebras

// ============================================================================
// VECTOR CALCULUS MODULES (TO BE EXTRACTED)
// ============================================================================

// TODO: Extract these from the main file:
// export * from './vector-calculus/vector-fields';    // Vector fields
// export * from './vector-calculus/tangent-spaces';   // Tangent vectors
// export * from './vector-calculus/integration';      // Integration theory

// ============================================================================
// COOPERAD MODULES (TO BE EXTRACTED)
// ============================================================================

// TODO: Extract these from the main file:
// export * from './cooperads/dg-cooperads';     // DG-cooperads
// export * from './cooperads/deformation';      // Deformation theory
