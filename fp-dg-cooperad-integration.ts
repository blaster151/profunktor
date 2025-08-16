// fp-dg-cooperad-integration.ts
// Integration layer connecting fp-dg-cooperad with existing cooperad infrastructure

import { Tree, admissibleCuts, keyOf } from './fp-cooperad-trees';
import { GradedTree, gradedTree, edgeDegree } from './fp-cooperad-dg';
import { makeDgCooperad, Cooperad, DgCooperad } from './fp-dg-cooperad';
import { Sum, sum, zero, scale, plus } from './fp-dg-core';

// ============================================================================
// Part 1: Adapter for Existing Tree Cooperad
// ============================================================================

/**
 * Adapter that wraps your existing tree cooperad to match the Cooperad interface
 */
export function treeCooperadAdapter<A>(): Cooperad<Tree<A>> {
  return {
    // Convert your existing admissible cuts to Sum<[T, T]> format
    delta: (t: Tree<A>): Sum<[Tree<A>, Tree<A>]> => {
      const cuts = admissibleCuts(t);
      return cuts
        .filter(({ forest, trunk }) => forest.length > 0) // Skip empty cut
        .map(({ forest, trunk }) => ({
          coef: 1,
          term: [forest[0], trunk] as [Tree<A>, Tree<A>] // Simplified: take first tree from forest
        }));
    },
    
    // Use your existing key function
    key: keyOf,
    
    // Default degree function
    degree: edgeDegree
  };
}

/**
 * Adapter for graded trees
 */
export function gradedTreeCooperadAdapter<A>(): Cooperad<GradedTree<A>> {
  const baseAdapter = treeCooperadAdapter<A>();
  
  return {
    delta: (t: GradedTree<A>): Sum<[GradedTree<A>, GradedTree<A>]> => {
      const baseDelta = baseAdapter.delta(t);
      return baseDelta.map(({ coef, term: [forest, trunk] }) => ({
        coef,
        term: [
          { ...forest, degree: t.degree - 1 },
          { ...trunk, degree: t.degree - 1 }
        ] as [GradedTree<A>, GradedTree<A>]
      }));
    },
    
    key: (t: GradedTree<A>) => keyOf(t),
    degree: (t: GradedTree<A>) => t.degree
  };
}

// ============================================================================
// Part 2: Local Differential Examples
// ============================================================================

/**
 * Example local differential: acts only on leaves
 */
export function leafDifferential<A>(t: Tree<A>): Sum<Tree<A>> {
  if (t.kids.length === 0) {
    // Leaf: apply some transformation
    return sum({ coef: 1, term: { ...t, label: `d(${t.label})` as A } });
  }
  // Non-leaf: no local action
  return zero();
}

/**
 * Example local differential: acts on binary nodes
 */
export function binaryNodeDifferential<A>(t: Tree<A>): Sum<Tree<A>> {
  if (t.kids.length === 2) {
    // Binary node: swap children
    return sum({ 
      coef: -1, // Sign for swapping
      term: { 
        ...t, 
        kids: [t.kids[1], t.kids[0]] 
      } 
    });
  }
  return zero();
}

/**
 * Example local differential: acts on nodes with specific labels
 */
export function labelSpecificDifferential<A>(
  targetLabel: A,
  replacement: A
): (t: Tree<A>) => Sum<Tree<A>> {
  return (t: Tree<A>): Sum<Tree<A>> => {
    if (t.label === targetLabel) {
      return sum({ coef: 1, term: { ...t, label: replacement } });
    }
    return zero();
  };
}

// ============================================================================
// Part 3: Integration Examples
// ============================================================================

/**
 * Create a DG cooperad from your existing tree cooperad with a local differential
 */
export function createTreeDgCooperad<A>(
  dLocal: (t: Tree<A>) => Sum<Tree<A>>
): DgCooperad<Tree<A>> {
  const baseCooperad = treeCooperadAdapter<A>();
  return makeDgCooperad(baseCooperad, dLocal);
}

/**
 * Create a DG cooperad for graded trees
 */
export function createGradedTreeDgCooperad<A>(
  dLocal: (t: GradedTree<A>) => Sum<GradedTree<A>>
): DgCooperad<GradedTree<A>> {
  const baseCooperad = gradedTreeCooperadAdapter<A>();
  return makeDgCooperad(baseCooperad, dLocal);
}

// ============================================================================
// Part 4: Enhanced Reassembly for Tree Cooperads
// ============================================================================

/**
 * Enhanced reassembly for tree cooperads
 * This provides a more sophisticated reassembly than the basic "left wins" approach
 */
export function treeReassemble<A>(
  left: Tree<A>, 
  right: Tree<A>, 
  originalTree: Tree<A>
): Tree<A> {
  // For tree cooperads, we can implement more sophisticated reassembly
  // based on the structure of the original tree and the cut information
  
  // Simple approach: if right is a leaf, graft it into left
  if (right.kids.length === 0) {
    // Find a suitable position in left to graft right
    // This is a simplified version - in practice you'd use cut metadata
    return graftLeaf(left, right);
  }
  
  // More complex: reconstruct based on original structure
  return reconstructFromCut(left, right, originalTree);
}

/**
 * Graft a leaf into a tree at a suitable position
 */
function graftLeaf<A>(tree: Tree<A>, leaf: Tree<A>): Tree<A> {
  // Find a position where we can graft the leaf
  // This is a simplified implementation
  if (tree.kids.length === 0) {
    // Tree is a leaf, create a new node with both
    return { label: tree.label, kids: [tree, leaf] };
  }
  
  // Recursively try to graft into children
  const newKids = tree.kids.map(kid => graftLeaf(kid, leaf));
  return { ...tree, kids: newKids };
}

/**
 * Reconstruct a tree from cut pieces using original structure
 */
function reconstructFromCut<A>(
  left: Tree<A>, 
  right: Tree<A>, 
  original: Tree<A>
): Tree<A> {
  // This would use information about where the cut occurred
  // For now, return a simplified reconstruction
  return { ...left, kids: [...left.kids, right] };
}

// ============================================================================
// Part 5: Validation and Testing
// ============================================================================

/**
 * Validate that a DG cooperad satisfies the co-Leibniz law
 */
export function validateCoLeibnizLaw<A>(
  dgCooperad: DgCooperad<A>,
  testTerms: A[]
): { passed: boolean; failures: string[] } {
  const failures: string[] = [];
  
  for (const term of testTerms) {
    // Check: Δ(d(t)) = (d ⊗ id + id ⊗ d)(Δ(t))
    const dTerm = dgCooperad.d(term);
    let leftSide: Sum<[A, A]> = [];
    
    // Collect all terms from d(term) and apply delta to each
    for (const { coef, term: dTermValue } of dTerm) {
      const deltaResult = dgCooperad.delta(dTermValue);
      leftSide = [...leftSide, ...deltaResult.map(({ coef: c, term }) => ({ coef: coef * c, term }))];
    }
    
    const rightSide = computeCoLeibnizRightSide(dgCooperad, term);
    
    if (!sumsEqual(leftSide, rightSide, (pair: [A, A]) => `${dgCooperad.key(pair[0])}-${dgCooperad.key(pair[1])}`)) {
      failures.push(`Co-Leibniz failed for term: ${dgCooperad.key(term)}`);
    }
  }
  
  return {
    passed: failures.length === 0,
    failures
  };
}

/**
 * Compute the right side of the co-Leibniz law: (d ⊗ id + id ⊗ d)(Δ(t))
 */
function computeCoLeibnizRightSide<A>(
  dgCooperad: DgCooperad<A>,
  term: A
): Sum<[A, A]> {
  const delta = dgCooperad.delta(term);
  let result: Array<{ coef: number; term: [A, A] }> = [];
  
  for (const { coef, term: [x, y] } of delta) {
    // (d ⊗ id)(x, y)
    const dx = dgCooperad.d(x);
    for (const { coef: a, term: dxTerm } of dx) {
      result = [...result, { coef: coef * a, term: [dxTerm, y] }];
    }
    
    // (id ⊗ d)(x, y) with sign
    const dy = dgCooperad.d(y);
    const sign = (-1) ** (dgCooperad.degree(x) % 2);
    for (const { coef: b, term: dyTerm } of dy) {
      result = [...result, { coef: coef * sign * b, term: [x, dyTerm] }];
    }
  }
  
  return result;
}

/**
 * Check if two sums are equal (up to normalization)
 */
function sumsEqual<A>(
  sum1: Sum<A>, 
  sum2: Sum<A>, 
  keyFn: (a: A) => string
): boolean {
  // Normalize both sums and compare
  const normalized1 = normalizeByKey(sum1, keyFn);
  const normalized2 = normalizeByKey(sum2, keyFn);
  
  if (normalized1.length !== normalized2.length) return false;
  
  // Create maps for comparison
  const map1 = new Map(normalized1.map(t => [keyFn(t.term), t.coef]));
  const map2 = new Map(normalized2.map(t => [keyFn(t.term), t.coef]));
  
  for (const [key, coef1] of map1) {
    const coef2 = map2.get(key);
    if (coef2 === undefined || coef1 !== coef2) return false;
  }
  
  return true;
}

// ============================================================================
// Part 6: Utility Functions
// ============================================================================

/**
 * Normalize a sum by key (re-export from fp-dg-core for convenience)
 */
export function normalizeByKey<T>(s: Sum<T>, key: (t: T) => string): Sum<T> {
  const m = new Map<string, { coef: number; term: T }>();
  for (const { coef, term } of s) {
    const k = key(term);
    const prev = m.get(k);
    if (prev) prev.coef += coef;
    else m.set(k, { coef, term });
  }
  return [...m.values()].filter(x => x.coef !== 0);
}

/**
 * Create a simple test tree for validation
 */
export function createTestTree<A>(label: A, children: Tree<A>[] = []): Tree<A> {
  return { label, kids: children };
}

/**
 * Create a test graded tree
 */
export function createTestGradedTree<A>(
  label: A, 
  children: GradedTree<A>[] = []
): GradedTree<A> {
  return { label, kids: children, degree: children.length };
}
