// fp-cooperad-dg.ts
// DG extensions for cooperad infrastructure
// Integrates fp-dg-core with existing admissible cuts

import type { Tree, Forest } from './fp-cooperad-trees';
import { admissibleCuts, keyOf, keyForest } from './fp-cooperad-trees';
import { 
  Degree, DgModule, Sum, Term, koszul, signByDeg, normalizeByKey, 
  sum, zero, scale, plus 
} from './fp-dg-core';

// ============================================================================
// Part 1: Graded Tree Extensions
// ============================================================================

/**
 * Graded tree - extends existing Tree with degree information
 */
export interface GradedTree<A> extends Tree<A> {
  readonly degree: Degree;
}

/**
 * Graded forest - array of graded trees
 */
export type GradedForest<A> = readonly GradedTree<A>[];

/**
 * Create a graded tree from existing tree with degree function
 */
export function gradedTree<A>(
  tree: Tree<A>, 
  degreeFn: (t: Tree<A>) => Degree
): GradedTree<A> {
  return {
    ...tree,
    degree: degreeFn(tree)
  };
}

/**
 * Default degree function: count edges (arity - 1)
 */
export function edgeDegree<A>(tree: Tree<A>): Degree {
  return tree.kids.length;
}

/**
 * Leaf degree function: always 0
 */
export function leafDegree<A>(_tree: Tree<A>): Degree {
  return 0;
}

// ============================================================================
// Part 2: DG Differential using Admissible Cuts
// ============================================================================

/**
 * Compute the differential of a graded tree using admissible cuts
 * This is the core of the DG structure - it uses your existing admissible cuts
 * but adds the appropriate signs and degree shifts
 */
export function dgDelta<A>(tree: GradedTree<A>): Sum<GradedTree<A>> {
  const cuts = admissibleCuts(tree);
  
  return cuts
    .filter(({ forest }) => forest.length > 0) // Skip empty cuts
    .map(({ forest, trunk }) => {
      // Compute degree of the forest
      const forestDeg = forestDegree(forest);
      
      // Apply Koszul sign: (-1)^{deg(forest) * deg(trunk)}
      const sign = koszul(forestDeg, treeDegree(trunk));
      
      // Create graded trunk with degree shifted by -1
      const gradedTrunk: GradedTree<A> = {
        ...trunk,
        degree: tree.degree - 1
      };
      
      return { coef: sign, term: gradedTrunk };
    });
}

/**
 * Compute the total degree of a forest
 */
function forestDegree<A>(forest: Forest<A>): Degree {
  return forest.reduce((sum, tree) => sum + treeDegree(tree), 0);
}

/**
 * Compute degree of a tree (assumes it's a GradedTree)
 */
function treeDegree<A>(tree: Tree<A>): Degree {
  // If it's already a GradedTree, use its degree
  if ('degree' in tree) {
    return (tree as GradedTree<A>).degree;
  }
  // Otherwise, compute edge degree
  return edgeDegree(tree);
}

// ============================================================================
// Part 3: DG Module for Graded Trees
// ============================================================================

/**
 * DG module instance for graded trees
 */
export function gradedTreeDgModule<A>(): DgModule<GradedTree<A>> {
  return {
    degree: (t: GradedTree<A>) => t.degree,
    d: dgDelta
  };
}

/**
 * Create DG module from existing tree with custom degree function
 */
export function createGradedDgModule<A>(
  degreeFn: (t: Tree<A>) => Degree = edgeDegree
): DgModule<GradedTree<A>> {
  return {
    degree: (t: GradedTree<A>) => t.degree,
    d: (t: GradedTree<A>) => {
      // Convert to graded tree if needed
      const gradedT = 'degree' in t ? t : gradedTree(t, degreeFn);
      return dgDelta(gradedT);
    }
  };
}

// ============================================================================
// Part 4: Enhanced Symmetry Modes with Grading
// ============================================================================

/**
 * Graded symmetry modes - extend your existing modes
 */
export type GradedSymmetryMode = 
  | { kind: 'planar'; graded: boolean }
  | { kind: 'symmetric-agg'; graded: boolean }
  | { kind: 'symmetric-orbit'; graded: boolean };

/**
 * Graded symmetry-aware delta
 */
export function deltaWGraded<A>(
  tr: GradedTree<A>,
  mode: GradedSymmetryMode,
  dgModule: DgModule<GradedTree<A>> = gradedTreeDgModule<A>()
): Sum<GradedTree<A>> {
  // Use your existing admissible cuts
  const cuts = admissibleCuts(tr);
  
  const terms = Array.from(cuts)
    .filter(({ forest }) => forest.length > 0) // Skip empty cuts
    .map(({ forest, trunk }) => {
      // Create graded trunk
      const gradedTrunk: GradedTree<A> = {
        ...trunk,
        degree: tr.degree - 1
      };
      
      let coefficient = 1;
      
      // Apply graded signs if enabled
      if (mode.graded) {
        const forestDeg = forestDegree(forest);
        coefficient *= koszul(forestDeg, treeDegree(trunk));
      }
      
      // Apply symmetry mode specific logic
      if (mode.kind === 'symmetric-orbit') {
        // For orbit mode, you'd need to compute automorphism size
        // This is a simplified version
        coefficient *= 1; // Placeholder for orbit normalization
      }
      
      return { coef: coefficient, term: gradedTrunk };
    });
  
  // Normalize by key to merge equivalent terms
  return normalizeByKey(terms, (t) => keyOf(t));
}

// ============================================================================
// Part 5: Homotopy-Aware Law Checking
// ============================================================================

/**
 * Result of homotopy law checking
 */
export interface HomotopyLawResult<A> {
  readonly isChainMap: boolean;
  readonly boundary: Sum<GradedTree<A>>;
  readonly degree: Degree;
  readonly details: string;
}

/**
 * Check if an operation commutes with the differential up to boundary
 * This is the key homotopy-theoretic law: d(f(x)) = f(d(x)) + boundary
 */
export function checkHomotopyLaws<A>(
  operation: (tree: GradedTree<A>) => Sum<GradedTree<A>>,
  dgModule: DgModule<GradedTree<A>> = gradedTreeDgModule<A>(),
  testTrees: GradedTree<A>[] = []
): HomotopyLawResult<A> {
  let allChainMaps = true;
  let totalBoundary: Sum<GradedTree<A>> = zero();
  let maxDegree = 0;
  const details: string[] = [];
  
  for (const tree of testTrees) {
    // Compute d(f(x))
    const dfx = dgModule.d(operation(tree)[0]?.term || tree);
    
    // Compute f(d(x))
    const fdx = operation(dgModule.d(tree)[0]?.term || tree);
    
    // The boundary is d(f(x)) - f(d(x))
    const boundary = plus(dfx, scale(-1, fdx));
    
    if (boundary.length > 0) {
      allChainMaps = false;
      totalBoundary = plus(totalBoundary, boundary);
      details.push(`Tree ${keyOf(tree)}: boundary = ${boundary.length} terms`);
    }
    
    maxDegree = Math.max(maxDegree, tree.degree);
  }
  
  return {
    isChainMap: allChainMaps,
    boundary: totalBoundary,
    degree: maxDegree,
    details: details.join('; ')
  };
}

// ============================================================================
// Part 6: Integration with Existing Cooperad Code
// ============================================================================

/**
 * Convert existing cooperad delta to DG delta
 */
export function cooperadToDgDelta<A>(
  tree: Tree<A>,
  degreeFn: (t: Tree<A>) => Degree = edgeDegree
): Sum<GradedTree<A>> {
  const gradedTree = { ...tree, degree: degreeFn(tree) };
  return dgDelta(gradedTree);
}

/**
 * Strict cooperad as DG module (zero differential)
 */
export function cooperadAsDg<A>(
  degreeFn: (t: Tree<A>) => Degree = () => 0
): DgModule<Tree<A>> {
  return {
    degree: degreeFn,
    d: (_: Tree<A>) => zero()
  };
}
