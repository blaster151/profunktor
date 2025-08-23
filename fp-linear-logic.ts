/**
 * Linear Logic Implementation
 * 
 * Based on Girard's Linear Logic and our Normal Functors foundation
 * Building on "Polynomial functors and polynomial monads" by Nicola Gambino and Joachim Kock
 * 
 * This implements:
 * - Linear Logic connectives (⊗, ⊕, ⊸, !, ?)
 * - Proof nets using polynomial functor structure
 * - Linear logic models via normal functors
 * - Connection to polynomial functors via pullback preservation
 * - Sequent calculus and cut elimination
 */

import { NormalFunctor } from './fp-normal-functors-slice';
import { Polynomial } from './fp-polynomial-functors';

// ============================================================================
// LINEAR LOGIC CONNECTIVES
// ============================================================================

/**
 * Linear Logic Formula
 * 
 * Represents formulas in linear logic with connectives:
 * - ⊗ (tensor product)
 * - ⊕ (direct sum) 
 * - ⊸ (linear implication)
 * - ! (of course)
 * - ? (why not)
 */
export interface LinearLogicFormula {
  readonly kind: 'LinearLogicFormula';
  readonly connective: LinearLogicConnective;
  readonly subformulas: LinearLogicFormula[];
  readonly isAtomic: boolean;
  readonly atomicType?: string;
}

export type LinearLogicConnective = 
  | 'tensor'      // ⊗
  | 'directSum'   // ⊕
  | 'linearImpl'  // ⊸
  | 'ofCourse'    // !
  | 'whyNot'      // ?
  | 'atomic';

export function createAtomicFormula(type: string): LinearLogicFormula {
  return {
    kind: 'LinearLogicFormula',
    connective: 'atomic',
    subformulas: [],
    isAtomic: true,
    atomicType: type
  };
}

export function createTensorFormula(
  left: LinearLogicFormula, 
  right: LinearLogicFormula
): LinearLogicFormula {
  return {
    kind: 'LinearLogicFormula',
    connective: 'tensor',
    subformulas: [left, right],
    isAtomic: false
  };
}

export function createDirectSumFormula(
  left: LinearLogicFormula, 
  right: LinearLogicFormula
): LinearLogicFormula {
  return {
    kind: 'LinearLogicFormula',
    connective: 'directSum',
    subformulas: [left, right],
    isAtomic: false
  };
}

export function createLinearImplFormula(
  antecedent: LinearLogicFormula, 
  consequent: LinearLogicFormula
): LinearLogicFormula {
  return {
    kind: 'LinearLogicFormula',
    connective: 'linearImpl',
    subformulas: [antecedent, consequent],
    isAtomic: false
  };
}

export function createOfCourseFormula(formula: LinearLogicFormula): LinearLogicFormula {
  return {
    kind: 'LinearLogicFormula',
    connective: 'ofCourse',
    subformulas: [formula],
    isAtomic: false
  };
}

export function createWhyNotFormula(formula: LinearLogicFormula): LinearLogicFormula {
  return {
    kind: 'LinearLogicFormula',
    connective: 'whyNot',
    subformulas: [formula],
    isAtomic: false
  };
}

// ============================================================================
// PROOF NETS USING POLYNOMIAL FUNCTOR STRUCTURE
// ============================================================================

/**
 * Proof Net Node
 * 
 * Represents a node in a proof net, using polynomial functor structure
 * for the underlying mathematical foundation
 */
export interface ProofNetNode {
  readonly kind: 'ProofNetNode';
  readonly nodeType: 'axiom' | 'cut' | 'tensor' | 'directSum' | 'linearImpl' | 'ofCourse' | 'whyNot';
  readonly formula: LinearLogicFormula;
  readonly connections: ProofNetConnection[];
  readonly polynomialStructure?: Polynomial<any, any>;
}

export interface ProofNetConnection {
  readonly kind: 'ProofNetConnection';
  readonly source: ProofNetNode;
  readonly target: ProofNetNode;
  readonly connectionType: 'axiom' | 'cut' | 'logical';
}

/**
 * Proof Net
 * 
 * A proof net is a graph-like structure representing a linear logic proof
 * using polynomial functor structure for the underlying mathematics
 */
export interface ProofNet {
  readonly kind: 'ProofNet';
  readonly nodes: ProofNetNode[];
  readonly connections: ProofNetConnection[];
  readonly conclusion: LinearLogicFormula;
  readonly isCorrect: boolean;
  readonly polynomialFunctor: Polynomial<any, any>;
}

export function createProofNet(
  nodes: ProofNetNode[],
  connections: ProofNetConnection[],
  conclusion: LinearLogicFormula,
  polynomialFunctor: Polynomial<any, any>
): ProofNet {
  return {
    kind: 'ProofNet',
    nodes,
    connections,
    conclusion,
    isCorrect: validateProofNet(nodes, connections),
    polynomialFunctor
  };
}

function validateProofNet(nodes: ProofNetNode[], connections: ProofNetConnection[]): boolean {
  // Basic validation: every node should be connected
  const connectedNodes = new Set<ProofNetNode>();
  
  for (const connection of connections) {
    connectedNodes.add(connection.source);
    connectedNodes.add(connection.target);
  }
  
  return nodes.every(node => connectedNodes.has(node));
}

// ============================================================================
// LINEAR LOGIC MODELS VIA NORMAL FUNCTORS
// ============================================================================

/**
 * Linear Logic Model
 * 
 * A model of linear logic using normal functors
 * This connects linear logic to polynomial functors via pullback preservation
 */
export interface LinearLogicModel<I, J> {
  readonly kind: 'LinearLogicModel';
  readonly normalFunctor: NormalFunctor<I, J>;
  readonly interpretation: Map<LinearLogicFormula, any>;
  readonly pullbackPreservation: boolean;
  readonly tensorInterpretation: (a: any, b: any) => any;
  readonly directSumInterpretation: (a: any, b: any) => any;
  readonly linearImplInterpretation: (a: any, b: any) => any;
}

export function createLinearLogicModel<I, J>(
  normalFunctor: NormalFunctor<I, J>
): LinearLogicModel<I, J> {
  return {
    kind: 'LinearLogicModel',
    normalFunctor,
    interpretation: new Map(),
    pullbackPreservation: normalFunctor.preservesPullbacks,
    tensorInterpretation: (a, b) => ({ kind: 'tensor', left: a, right: b }),
    directSumInterpretation: (a, b) => ({ kind: 'directSum', left: a, right: b }),
    linearImplInterpretation: (a, b) => ({ kind: 'linearImpl', antecedent: a, consequent: b })
  };
}

// ============================================================================
// SEQUENT CALCULUS
// ============================================================================

/**
 * Linear Logic Sequent
 * 
 * A sequent Γ ⊢ Δ where Γ and Δ are multisets of formulas
 */
export interface LinearLogicSequent {
  readonly kind: 'LinearLogicSequent';
  readonly antecedent: LinearLogicFormula[];  // Γ
  readonly consequent: LinearLogicFormula[];  // Δ
  readonly isProvable: boolean;
}

export function createSequent(
  antecedent: LinearLogicFormula[], 
  consequent: LinearLogicFormula[]
): LinearLogicSequent {
  return {
    kind: 'LinearLogicSequent',
    antecedent,
    consequent,
    isProvable: false // Would need proof search to determine
  };
}

/**
 * Cut Elimination
 * 
 * The process of eliminating cuts from proofs
 * This is a fundamental property of linear logic
 */
export interface CutElimination {
  readonly kind: 'CutElimination';
  readonly originalProof: ProofNet;
  readonly cutFreeProof: ProofNet;
  readonly eliminationSteps: CutEliminationStep[];
  readonly isSuccessful: boolean;
}

export interface CutEliminationStep {
  readonly kind: 'CutEliminationStep';
  readonly stepType: 'commutative' | 'logical' | 'axiom';
  readonly description: string;
  readonly before: ProofNet;
  readonly after: ProofNet;
}

export function createCutElimination(
  originalProof: ProofNet,
  cutFreeProof: ProofNet,
  steps: CutEliminationStep[]
): CutElimination {
  return {
    kind: 'CutElimination',
    originalProof,
    cutFreeProof,
    eliminationSteps: steps,
    isSuccessful: cutFreeProof.isCorrect
  };
}

// ============================================================================
// CONNECTION TO POLYNOMIAL FUNCTORS
// ============================================================================

/**
 * Polynomial Functor to Linear Logic Translation
 * 
 * Translates polynomial functors to linear logic formulas
 * This is the key insight: polynomial functors preserve pullbacks
 * which corresponds to the linear nature of linear logic
 */
export interface PolynomialToLinearLogic<P extends Polynomial<any, any>> {
  readonly kind: 'PolynomialToLinearLogic';
  readonly polynomial: P;
  readonly linearFormula: LinearLogicFormula;
  readonly translation: {
    readonly positions: LinearLogicFormula;  // A in I ← B → A → J
    readonly directions: LinearLogicFormula; // B in I ← B → A → J
    readonly source: LinearLogicFormula;     // I in I ← B → A → J
    readonly target: LinearLogicFormula;     // J in I ← B → A → J
  };
  readonly pullbackPreservation: boolean;
}

export function createPolynomialToLinearLogic<P extends Polynomial<any, any>>(
  polynomial: P
): PolynomialToLinearLogic<P> {
  // Create atomic formulas for the components
  const positions = createAtomicFormula('positions');
  const directions = createAtomicFormula('directions');
  const source = createAtomicFormula('source');
  const target = createAtomicFormula('target');
  
  // The polynomial functor corresponds to a tensor product
  const linearFormula = createTensorFormula(
    createTensorFormula(source, directions),
    createTensorFormula(positions, target)
  );
  
  return {
    kind: 'PolynomialToLinearLogic',
    polynomial,
    linearFormula,
    translation: {
      positions,
      directions,
      source,
      target
    },
    pullbackPreservation: true // Polynomial functors preserve pullbacks
  };
}

// ============================================================================
// EXAMPLE FUNCTIONS
// ============================================================================

export function exampleLinearLogicFormulas(): void {
  const A = createAtomicFormula('A');
  const B = createAtomicFormula('B');
  const C = createAtomicFormula('C');
  
  const tensorAB = createTensorFormula(A, B);
  const implABC = createLinearImplFormula(tensorAB, C);
  const ofCourseA = createOfCourseFormula(A);
  
  console.log('RESULT:', {
    linearLogic: true,
    atomicA: A.atomicType,
    tensorAB: tensorAB.connective,
    implABC: implABC.connective,
    ofCourseA: ofCourseA.connective,
    examples: [A, tensorAB, implABC, ofCourseA]
  });
}

export function exampleProofNet(): void {
  const A = createAtomicFormula('A');
  const B = createAtomicFormula('B');
  const tensorAB = createTensorFormula(A, B);
  
  const node1: ProofNetNode = {
    kind: 'ProofNetNode',
    nodeType: 'axiom',
    formula: A,
    connections: []
  };
  
  const node2: ProofNetNode = {
    kind: 'ProofNetNode',
    nodeType: 'axiom',
    formula: B,
    connections: []
  };
  
  const node3: ProofNetNode = {
    kind: 'ProofNetNode',
    nodeType: 'tensor',
    formula: tensorAB,
    connections: []
  };
  
  const connection1: ProofNetConnection = {
    kind: 'ProofNetConnection',
    source: node1,
    target: node3,
    connectionType: 'logical'
  };
  
  const connection2: ProofNetConnection = {
    kind: 'ProofNetConnection',
    source: node2,
    target: node3,
    connectionType: 'logical'
  };
  
  const proofNet = createProofNet(
    [node1, node2, node3],
    [connection1, connection2],
    tensorAB,
    { kind: 'Polynomial', positions: [], directions: [] } as any
  );
  
  console.log('RESULT:', {
    proofNet: true,
    isCorrect: proofNet.isCorrect,
    nodeCount: proofNet.nodes.length,
    connectionCount: proofNet.connections.length,
    conclusion: proofNet.conclusion.connective,
    examples: [proofNet]
  });
}

export function examplePolynomialToLinearLogic(): void {
  const polynomial = { 
    kind: 'Polynomial', 
    positions: ['pos1', 'pos2'], 
    directions: ['dir1', 'dir2'] 
  } as any;
  
  const translation = createPolynomialToLinearLogic(polynomial);
  
  console.log('RESULT:', {
    polynomialToLinearLogic: true,
    polynomialKind: translation.polynomial.kind,
    linearFormula: translation.linearFormula.connective,
    pullbackPreservation: translation.pullbackPreservation,
    translation: {
      positions: translation.translation.positions.atomicType,
      directions: translation.translation.directions.atomicType,
      source: translation.translation.source.atomicType,
      target: translation.translation.target.atomicType
    },
    examples: [translation]
  });
}
