/**
 * Sheafifiable Syntax
 * 
 * Encode "algebraic/combinatorial enough" syntax so the same data may be 
 * interpreted in Set and then in any topos.
 * 
 * This implements the syntactic foundation for Beke's sheafifiable model 
 * categories, providing the "algebraic/combinatorial logical data" that 
 * can be lifted from Sets to sheaf categories on any site.
 * 
 * Key insight: The same syntactic signature can be interpreted in different
 * semantic contexts (Set vs topos) while preserving the essential structure
 * needed for model category axioms.
 */

// ============================================================================
// BASE TYPES
// ============================================================================

/**
 * Constant Base
 * 
 * Default scope of the paper - Set as the base category
 */
export interface ConstantBase { 
  readonly name: 'Set'; 
}

// ============================================================================
// BASIC SYNTAX STRUCTURES
// ============================================================================

/**
 * Sort
 * 
 * A basic type/sort in the syntactic signature
 */
export interface Sort { 
  readonly name: string;
  readonly description?: string;
}

/**
 * Operation Symbol
 * 
 * A function symbol with specified arity
 */
export interface OpSym { 
  readonly name: string; 
  readonly arity: number;
  readonly domain: readonly Sort[]; // input sorts
  readonly codomain: Sort; // output sort
  readonly description?: string;
}

/**
 * Equation
 * 
 * A schematic equation between terms
 */
export interface Equation { 
  readonly left: string; 
  readonly right: string;
  readonly context?: readonly Sort[]; // variable context
  readonly description?: string;
}

/**
 * Term
 * 
 * A well-formed term in the syntax
 */
export interface Term {
  readonly kind: 'variable' | 'operation' | 'application';
  readonly name?: string;
  readonly operation?: OpSym;
  readonly arguments?: readonly Term[];
  readonly sort?: Sort;
}

/**
 * Syntactic Signature
 * 
 * The basic algebraic signature with sorts, operations, and equations
 */
export interface SyntacticSignature {
  readonly sorts: readonly Sort[];
  readonly operations: readonly OpSym[];
  readonly equations?: readonly Equation[]; // algebraic laws
  readonly name?: string;
  readonly description?: string;
}

// ============================================================================
// SEMANTIC INTERPRETATIONS
// ============================================================================

/**
 * Set Semantics
 * 
 * Interpretation of the syntax in the category of sets
 */
export interface SetSemantics {
  readonly interpretSort: (s: Sort) => unknown;
  readonly interpretOp: (op: OpSym) => (...args: unknown[]) => unknown;
  readonly equationsHold?: (eqs: readonly Equation[]) => boolean;
  readonly validateInterpretation?: (signature: SyntacticSignature) => boolean;
}

/**
 * Topos Semantics
 * 
 * Interpretation of the syntax in a topos
 */
export interface ToposSemantics<Obj> {
  readonly interpretSort: (s: Sort) => Obj;
  readonly interpretOp: (op: OpSym) => (...args: unknown[]) => Obj;
  readonly equationsHold?: (eqs: readonly Equation[]) => boolean;
  readonly validateInterpretation?: (signature: SyntacticSignature) => boolean;
}

/**
 * Sheafifiable Syntactic Package
 * 
 * Complete package with signature and both semantic interpretations
 */
export interface SheafifiableSyntacticPackage<Obj, Base = ConstantBase> {
  readonly signature: SyntacticSignature;
  readonly setSemantics: SetSemantics;       // verify Quillen axioms in Set
  readonly toposSemantics: ToposSemantics<Obj>; // then interpret in any topos
  readonly base?: Base; // default {name:'Set'}
  readonly name?: string;
  readonly description?: string;
  readonly context?: unknown;
}

// ============================================================================
// MODEL CATEGORY SPECIFIC SYNTAX
// ============================================================================

/**
 * Model Category Signature
 * 
 * Specialized signature for model category structures
 */
export interface ModelCategorySignature extends SyntacticSignature {
  readonly cofibrations: readonly OpSym[]; // generating cofibrations
  readonly fibrations: readonly OpSym[];   // generating fibrations
  readonly weakEquivalences: readonly OpSym[]; // generating weak equivalences
  readonly factorizations: readonly OpSym[]; // factorization operations
  readonly liftingProperties: readonly Equation[]; // RLP/LLP equations
}

/**
 * Cofibrantly Generated Signature
 * 
 * Signature for cofibrantly generated model categories
 */
export interface CofibrantlyGeneratedSignature extends ModelCategorySignature {
  readonly generatingCofibrations: readonly OpSym[]; // I
  readonly generatingTrivialCofibrations: readonly OpSym[]; // J
  readonly smallnessAxioms: readonly Equation[]; // domain/codomain smallness
}

/**
 * Sheafifiable Model Category Package
 * 
 * Complete package for sheafifiable model categories
 */
export interface SheafifiableModelCategoryPackage<Obj, Base = ConstantBase> extends SheafifiableSyntacticPackage<Obj, Base> {
  readonly signature: CofibrantlyGeneratedSignature;
  readonly localityAxioms: readonly Equation[]; // locality of weak equivalences
  readonly transferAxioms: readonly Equation[]; // axioms that transfer to sheaves
}

// ============================================================================
// SYNTAX VALIDATION
// ============================================================================

/**
 * Syntax Validation Result
 * 
 * Result of validating syntactic structures
 */
export interface SyntaxValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly details?: unknown;
}

/**
 * Validate Syntactic Signature
 * 
 * Check that a signature is well-formed
 */
export function validateSyntacticSignature(signature: SyntacticSignature): SyntaxValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check sorts
  if (!signature.sorts || signature.sorts.length === 0) {
    errors.push('Signature must have at least one sort');
  }

  // Check for duplicate sort names
  const sortNames = signature.sorts.map(s => s.name);
  const duplicateSorts = sortNames.filter((name, index) => sortNames.indexOf(name) !== index);
  if (duplicateSorts.length > 0) {
    errors.push(`Duplicate sort names: ${duplicateSorts.join(', ')}`);
  }

  // Check operations
  if (!signature.operations) {
    warnings.push('No operations specified');
  } else {
    // Check operation arities
    for (const op of signature.operations) {
      if (op.arity < 0) {
        errors.push(`Operation ${op.name} has negative arity`);
      }
      if (op.domain && op.domain.length !== op.arity) {
        errors.push(`Operation ${op.name} arity mismatch: declared ${op.arity}, domain has ${op.domain.length}`);
      }
    }

    // Check for duplicate operation names
    const opNames = signature.operations.map(op => op.name);
    const duplicateOps = opNames.filter((name, index) => opNames.indexOf(name) !== index);
    if (duplicateOps.length > 0) {
      errors.push(`Duplicate operation names: ${duplicateOps.join(', ')}`);
    }
  }

  // Check equations
  if (signature.equations) {
    for (const eq of signature.equations) {
      if (!eq.left || !eq.right) {
        errors.push('Equation must have both left and right sides');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate Sheafifiable Package
 * 
 * Check that a sheafifiable package is well-formed
 */
export function validateSheafifiablePackage<Obj, Base = ConstantBase>(
  pkg: SheafifiableSyntacticPackage<Obj, Base>
): SyntaxValidationResult {
  const signatureValidation = validateSyntacticSignature(pkg.signature);
  
  if (!signatureValidation.isValid) {
    return signatureValidation;
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check that both semantics are provided
  if (!pkg.setSemantics) {
    errors.push('Set semantics must be provided');
  }
  if (!pkg.toposSemantics) {
    errors.push('Topos semantics must be provided');
  }

  // Check that semantics can interpret the signature
  if (pkg.setSemantics && pkg.setSemantics.validateInterpretation) {
    if (!pkg.setSemantics.validateInterpretation(pkg.signature)) {
      errors.push('Set semantics cannot interpret the signature');
    }
  }

  if (pkg.toposSemantics && pkg.toposSemantics.validateInterpretation) {
    if (!pkg.toposSemantics.validateInterpretation(pkg.signature)) {
      errors.push('Topos semantics cannot interpret the signature');
    }
  }

  return {
    isValid: errors.length === 0,
    errors: [...signatureValidation.errors, ...errors],
    warnings: [...signatureValidation.warnings, ...warnings]
  };
}

// ============================================================================
// SYNTAX CONSTRUCTION UTILITIES
// ============================================================================

/**
 * Create Basic Sort
 * 
 * Create a basic sort
 */
export function createSort(name: string, description?: string): Sort {
  return { name, description };
}

/**
 * Create Operation Symbol
 * 
 * Create an operation symbol
 */
export function createOpSym(
  name: string, 
  arity: number, 
  domain: readonly Sort[], 
  codomain: Sort,
  description?: string
): OpSym {
  return { name, arity, domain, codomain, description };
}

/**
 * Create Equation
 * 
 * Create a schematic equation
 */
export function createEquation(
  left: string, 
  right: string, 
  context?: readonly Sort[],
  description?: string
): Equation {
  return { left, right, context, description };
}

/**
 * Create Syntactic Signature
 * 
 * Create a syntactic signature
 */
export function createSyntacticSignature(
  sorts: readonly Sort[],
  operations: readonly OpSym[],
  equations?: readonly Equation[],
  name?: string,
  description?: string
): SyntacticSignature {
  return { sorts, operations, equations, name, description };
}

/**
 * Create Sheafifiable Package
 * 
 * Create a sheafifiable syntactic package
 */
export function createSheafifiablePackage<Obj, Base = ConstantBase>(
  signature: SyntacticSignature,
  setSemantics: SetSemantics,
  toposSemantics: ToposSemantics<Obj>,
  name?: string,
  description?: string,
  base?: Base
): SheafifiableSyntacticPackage<Obj, Base> {
  return { signature, setSemantics, toposSemantics, base, name, description };
}

// ============================================================================
// MODEL CATEGORY SYNTAX UTILITIES
// ============================================================================

/**
 * Create Model Category Signature
 * 
 * Create a signature for model categories
 */
export function createModelCategorySignature(
  sorts: readonly Sort[],
  operations: readonly OpSym[],
  cofibrations: readonly OpSym[],
  fibrations: readonly OpSym[],
  weakEquivalences: readonly OpSym[],
  factorizations: readonly OpSym[],
  liftingProperties: readonly Equation[],
  equations?: readonly Equation[],
  name?: string
): ModelCategorySignature {
  return {
    sorts,
    operations,
    equations,
    cofibrations,
    fibrations,
    weakEquivalences,
    factorizations,
    liftingProperties,
    name
  };
}

/**
 * Create Cofibrantly Generated Signature
 * 
 * Create a signature for cofibrantly generated model categories
 */
export function createCofibrantlyGeneratedSignature(
  sorts: readonly Sort[],
  operations: readonly OpSym[],
  generatingCofibrations: readonly OpSym[],
  generatingTrivialCofibrations: readonly OpSym[],
  smallnessAxioms: readonly Equation[],
  equations?: readonly Equation[],
  name?: string
): CofibrantlyGeneratedSignature {
  return {
    sorts,
    operations,
    equations,
    cofibrations: generatingCofibrations,
    fibrations: [],
    weakEquivalences: [],
    factorizations: [],
    liftingProperties: [],
    generatingCofibrations,
    generatingTrivialCofibrations,
    smallnessAxioms,
    name
  };
}

/**
 * Create Sheafifiable Model Category Package
 * 
 * Create a complete package for sheafifiable model categories
 */
export function createSheafifiableModelCategoryPackage<Obj, Base = ConstantBase>(
  signature: CofibrantlyGeneratedSignature,
  setSemantics: SetSemantics,
  toposSemantics: ToposSemantics<Obj>,
  localityAxioms: readonly Equation[],
  transferAxioms: readonly Equation[],
  name?: string,
  description?: string,
  base?: Base
): SheafifiableModelCategoryPackage<Obj, Base> {
  return {
    signature,
    setSemantics,
    toposSemantics,
    base,
    localityAxioms,
    transferAxioms,
    name,
    description
  };
}
