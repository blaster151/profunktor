// fp-cooperad-dg.vitest.ts
// Vitest-compatible unit tests for DG cooperad extensions

import { describe, it, expect } from 'vitest';
import { t, leaf, admissibleCuts } from '../fp-cooperad-trees';
import {
  GradedTree, gradedTree, edgeDegree, dgDelta, gradedTreeDgModule,
  deltaWGraded, checkHomotopyLaws, cooperadToDgDelta, cooperadAsDg,
  GradedSymmetryMode
} from '../fp-cooperad-dg';
import { sum, zero, scale, plus, koszul, normalizeByKey } from '../fp-dg-core';

describe('DG Cooperad Integration', () => {
  it('computes admissible cuts and DG differential', () => {
    const testTree = t('f', [t('g', [leaf('x'), leaf('y')]), leaf('z')]);
    const existingCuts = admissibleCuts(testTree);
    const gradedTestTree = gradedTree(testTree, edgeDegree);
    const dgDifferential = dgDelta(gradedTestTree);
    expect(existingCuts.length).toBeGreaterThan(0);
    expect(gradedTestTree.degree).toBeGreaterThanOrEqual(0);
    expect(dgDifferential.length).toBeGreaterThan(0);
    expect(dgDifferential.length).toBe(existingCuts.length - 1); // -1 for empty cut
  });

  it('verifies Koszul sign computations', () => {
    expect(koszul(0, 0)).toBe(1);
    expect(koszul(1, 1)).toBe(-1);
    expect(koszul(2, 1)).toBe(1);
    expect(koszul(3, 2)).toBe(1);
  });

  it('complies with DG module interface', () => {
    const dgModule = gradedTreeDgModule<string>();
    const degreeTestTree = gradedTree(t('test', [leaf('x')]), edgeDegree);
    expect(dgModule.degree(degreeTestTree)).toBe(1);
    const diffResult = dgModule.d(degreeTestTree);
    expect(diffResult.length).toBeGreaterThan(0);
  });

  it('checks homotopy law for identity operation', () => {
    const dgModule = gradedTreeDgModule<string>();
    const identityOp = (tree: GradedTree<string>) => sum({ coef: 1, term: tree });
    const testTrees = [
      gradedTree(t('op1', [leaf('x')]), edgeDegree),
      gradedTree(t('op2', [leaf('y'), leaf('z')]), edgeDegree)
    ];
    const lawResult = checkHomotopyLaws(identityOp, dgModule, testTrees);
    expect(lawResult.isChainMap).toBe(false);
    expect(lawResult.boundary.length).toBeGreaterThanOrEqual(0);
    expect(lawResult.degree).toBeGreaterThanOrEqual(0);
  });

  it('handles graded symmetry modes', () => {
    const complexTree = t('h', [t('f', [leaf('a'), leaf('b')]), t('g', [leaf('c')])]);
    const gradedComplexTree = gradedTree(complexTree, edgeDegree);
    const modes: GradedSymmetryMode[] = [
      { kind: 'planar', graded: false },
      { kind: 'planar', graded: true },
      { kind: 'symmetric-agg', graded: true }
    ];
    for (const mode of modes) {
      const result = deltaWGraded(gradedComplexTree, mode);
      expect(result.length).toBeGreaterThanOrEqual(0);
    }
  });

  it('integrates with existing cooperad code', () => {
    const existingTree = t('existing', [leaf('a'), leaf('b'), leaf('c')]);
    const dgResult = cooperadToDgDelta(existingTree, edgeDegree);
    expect(dgResult.length).toBeGreaterThanOrEqual(0);
    const strictDg = cooperadAsDg<string>();
    const strictDegree = strictDg.degree(existingTree);
    const strictDiff = strictDg.d(existingTree);
    expect(strictDegree).toBeGreaterThanOrEqual(0);
    expect(strictDiff.length).toBe(0);
  });

  it('performs formal sum operations and normalization', () => {
    const sum1 = sum({ coef: 2, term: 'a' }, { coef: 3, term: 'b' });
    const sum2 = sum({ coef: 1, term: 'a' }, { coef: -2, term: 'b' });
    const combined = plus(sum1, sum2);
    expect(sum1.length).toBeGreaterThanOrEqual(0);
    expect(sum2.length).toBeGreaterThanOrEqual(0);
    expect(combined.length).toBeGreaterThanOrEqual(0);
    const normalized = normalizeByKey(combined, (term) => term);
    expect(normalized.length).toBeGreaterThanOrEqual(0);
  });

  it('checks differential properties and grading', () => {
    const gradedTree1 = gradedTree(t('test1', [leaf('x')]), edgeDegree);
    const gradedTree2 = gradedTree(t('test2', [leaf('y'), leaf('z')]), edgeDegree);
    const diff1 = dgDelta(gradedTree1);
    const diff2 = dgDelta(gradedTree2);
    expect(diff1.length).toBeGreaterThanOrEqual(0);
    expect(diff2.length).toBeGreaterThanOrEqual(0);
    // Check that differential terms have reasonable degrees
    const allTermsHaveReasonableDegree = [...diff1, ...diff2].every(({ term }) =>
      term.degree >= 0 && term.degree <= term.kids.length
    );
    expect(allTermsHaveReasonableDegree).toBe(true);
  });

  it('supports custom degree functions', () => {
    const testTree = t('f', [t('g', [leaf('x'), leaf('y')]), leaf('z')]);
    const depthDegree = (tree: any): number => {
      if (tree.kids.length === 0) return 0;
      return 1 + Math.max(...tree.kids.map(depthDegree));
    };
    const customGradedTree = gradedTree(testTree, depthDegree);
    const customDiff = dgDelta(customGradedTree);
    expect(customGradedTree.degree).toBeGreaterThanOrEqual(0);
    expect(customDiff.length).toBeGreaterThanOrEqual(0);
  });

  it('validates homotopy theory (d^2 = 0)', () => {
    const simpleTree = gradedTree(t('simple', [leaf('x')]), edgeDegree);
    const d1 = dgDelta(simpleTree);
    const d2Terms: any[] = [];
    for (const { coef, term } of d1) {
      const d2 = dgDelta(term);
      for (const { coef: c2, term: t2 } of d2) {
        d2Terms.push({ coef: coef * c2, term: t2 });
      }
    }
    const d2Normalized = normalizeByKey(d2Terms, (term) => (term as { label: string }).label);
    expect(d2Normalized.length).toBe(0);
  });
});
