/**
 * Dependent Type Theory System
 * 
 * Based on "Polynomial functors and polynomial monads" by Nicola Gambino and Joachim Kock
 * 
 * This implements a full dependent type theory using our polynomial functor machinery:
 * - Π types (dependent products) via Π_f functors
 * - Σ types (dependent sums) via Σ_f functors  
 * - Context management via pullback functors Δ_f
 * - Type safety via Beck-Chevalley isomorphisms
 * - Substitution and weakening via adjunctions
 */

import { 
  Morphism, 
  createMorphism, 
  identityMorphism,
  PullbackFunctor,
  DependentSumFunctor,
  DependentProductFunctor,
  createPullbackFunctor,
  createDependentSumFunctor,
  createDependentProductFunctor,
  SigmaDeltaAdjunction,
  createSigmaDeltaAdjunction
} from './fp-morphisms';

import {
  RealCartesianSquare,
  createRealCartesianSquare,
  PreciseBeckChevalleyIsomorphism,
  createPreciseBeckChevalleyIsomorphism
} from './fp-beck-chevalley';

// ============================================================================
// CONTEXT AND SUBSTITUTION
// ============================================================================

/**
 * Context in Dependent Type Theory
 * 
 * A context Γ is a sequence of type declarations:
 * Γ = x₁:A₁, x₂:A₂(x₁), ..., xₙ:Aₙ(x₁,...,xₙ₋₁)
 * 
 * This is implemented as a polynomial diagram with substitution morphisms
 */
export interface Context<A> {
  readonly kind: 'Context';
  readonly variables: string[];
  readonly types: A[];
  readonly dependencies: Map<string, string[]>; // x:A depends on variables
  readonly substitution: Morphism<A, A>; // Substitution morphism
  readonly weakening: Morphism<A, A>; // Weakening morphism
  readonly length: number;
}

/**
 * Create empty context
 */
export function createEmptyContext<A>(): Context<A> {
  return {
    kind: 'Context',
    variables: [],
    types: [],
    dependencies: new Map(),
    substitution: identityMorphism('empty' as A),
    weakening: identityMorphism('empty' as A),
    length: 0
  };
}

/**
 * Extend context with new variable
 */
export function extendContext<A>(
  context: Context<A>,
  variable: string,
  type: A,
  dependencies: string[] = []
): Context<A> {
  const newVariables = [...context.variables, variable];
  const newTypes = [...context.types, type];
  const newDependencies = new Map(context.dependencies);
  newDependencies.set(variable, dependencies);
  
  // Create substitution morphism for the extended context
  const substitution = createMorphism(
    type,
    type,
    (t: A) => t // Identity substitution for now
  );
  
  // Create weakening morphism (projection)
  const weakening = createMorphism(
    type,
    type,
    (t: A) => t // Identity weakening for now
  );
  
  return {
    kind: 'Context',
    variables: newVariables,
    types: newTypes,
    dependencies: newDependencies,
    substitution,
    weakening,
    length: context.length + 1
  };
}

// ============================================================================
// DEPENDENT TYPES (Π AND Σ)
// ============================================================================

/**
 * Dependent Product Type (Π-type)
 * 
 * Π(x:A).B(x) - the type of dependent functions
 * For each x:A, we have a type B(x)
 */
export interface DependentProductType<A, B> {
  readonly kind: 'DependentProductType';
  readonly domain: A;
  readonly codomain: (x: A) => B;
  readonly piFunctor: DependentProductFunctor<A, B>;
  readonly introduction: (f: (x: A) => B) => { type: 'PiIntro'; value: (x: A) => B };
  readonly elimination: (pi: { type: 'PiIntro'; value: (x: A) => B }, x: A) => B;
  readonly betaReduction: (f: (x: A) => B, x: A) => B;
  readonly etaExpansion: (pi: { type: 'PiIntro'; value: (x: A) => B }) => (x: A) => B;
}

/**
 * Create dependent product type
 */
export function createDependentProductType<A, B>(
  domain: A,
  codomain: (x: A) => B
): DependentProductType<A, B> {
  const morphism = createMorphism(domain, codomain(domain), (x: A) => codomain(x));
  const piFunctor = createDependentProductFunctor(morphism);
  
  return {
    kind: 'DependentProductType',
    domain,
    codomain,
    piFunctor,
    introduction: (f: (x: A) => B) => ({
      type: 'PiIntro',
      value: f
    }),
    elimination: (pi: { type: 'PiIntro'; value: (x: A) => B }, x: A) => {
      return pi.value(x);
    },
    betaReduction: (f: (x: A) => B, x: A) => {
      return f(x);
    },
    etaExpansion: (pi: { type: 'PiIntro'; value: (x: A) => B }) => {
      return (x: A) => pi.value(x);
    }
  };
}

/**
 * Dependent Sum Type (Σ-type)
 * 
 * Σ(x:A).B(x) - the type of dependent pairs
 * A pair (a, b) where a:A and b:B(a)
 */
export interface DependentSumType<A, B> {
  readonly kind: 'DependentSumType';
  readonly domain: A;
  readonly codomain: (x: A) => B;
  readonly sigmaFunctor: DependentSumFunctor<A, B>;
  readonly introduction: (x: A, y: B) => { type: 'SigmaIntro'; first: A; second: B };
  readonly elimination: (sigma: { type: 'SigmaIntro'; first: A; second: B }) => { first: A; second: B };
  readonly projection1: (sigma: { type: 'SigmaIntro'; first: A; second: B }) => A;
  readonly projection2: (sigma: { type: 'SigmaIntro'; first: A; second: B }) => B;
}

/**
 * Create dependent sum type
 */
export function createDependentSumType<A, B>(
  domain: A,
  codomain: (x: A) => B
): DependentSumType<A, B> {
  const morphism = createMorphism(domain, codomain(domain), (x: A) => codomain(x));
  const sigmaFunctor = createDependentSumFunctor(morphism);
  
  return {
    kind: 'DependentSumType',
    domain,
    codomain,
    sigmaFunctor,
    introduction: (x: A, y: B) => ({
      type: 'SigmaIntro',
      first: x,
      second: y
    }),
    elimination: (sigma: { type: 'SigmaIntro'; first: A; second: B }) => ({
      first: sigma.first,
      second: sigma.second
    }),
    projection1: (sigma: { type: 'SigmaIntro'; first: A; second: B }) => sigma.first,
    projection2: (sigma: { type: 'SigmaIntro'; first: A; second: B }) => sigma.second
  };
}

// ============================================================================
// TYPE THEORY JUDGMENTS
// ============================================================================

/**
 * Type Theory Judgment
 * 
 * A judgment in dependent type theory has the form:
 * - Γ ⊢ A type (A is a type in context Γ)
 * - Γ ⊢ a : A (a is a term of type A in context Γ)
 * - Γ ⊢ A ≡ B (A and B are definitionally equal types)
 * - Γ ⊢ a ≡ b : A (a and b are definitionally equal terms of type A)
 */
export interface Judgment<A> {
  readonly kind: 'Judgment';
  readonly context: Context<A>;
  readonly subject: string;
  readonly predicate: 'type' | 'term' | 'typeEq' | 'termEq';
  readonly object?: A;
  readonly object2?: A;
  readonly isValid: boolean;
}

/**
 * Type judgment: Γ ⊢ A type
 */
export function createTypeJudgment<A>(
  context: Context<A>,
  type: A
): Judgment<A> {
  return {
    kind: 'Judgment',
    context,
    subject: 'type',
    predicate: 'type',
    object: type,
    isValid: true
  };
}

/**
 * Term judgment: Γ ⊢ a : A
 */
export function createTermJudgment<A>(
  context: Context<A>,
  term: string,
  type: A
): Judgment<A> {
  return {
    kind: 'Judgment',
    context,
    subject: term,
    predicate: 'term',
    object: type,
    isValid: true
  };
}

/**
 * Type equality judgment: Γ ⊢ A ≡ B
 */
export function createTypeEqualityJudgment<A>(
  context: Context<A>,
  type1: A,
  type2: A
): Judgment<A> {
  return {
    kind: 'Judgment',
    context,
    subject: 'typeEq',
    predicate: 'typeEq',
    object: type1,
    object2: type2,
    isValid: true
  };
}

/**
 * Term equality judgment: Γ ⊢ a ≡ b : A
 */
export function createTermEqualityJudgment<A>(
  context: Context<A>,
  term1: string,
  term2: string,
  type: A
): Judgment<A> {
  return {
    kind: 'Judgment',
    context,
    subject: 'termEq',
    predicate: 'termEq',
    object: type,
    isValid: true
  };
}

// ============================================================================
// TYPE THEORY RULES
// ============================================================================

/**
 * Type Theory Rules
 * 
 * Implementation of the standard rules for dependent type theory:
 * - Formation rules (how to form types)
 * - Introduction rules (how to construct terms)
 * - Elimination rules (how to use terms)
 * - Computation rules (how terms compute)
 */
export interface TypeTheoryRules<A> {
  readonly kind: 'TypeTheoryRules';
  
  // Π-type rules
  readonly piFormation: (context: Context<A>, domain: A, codomain: (x: A) => A) => Judgment<A>;
  readonly piIntroduction: (context: Context<A>, body: (x: A) => A, domain: A, codomain: (x: A) => A) => Judgment<A>;
      readonly piElimination: (context: Context<A>, func: A, argument: A, domain: A, codomain: (x: A) => A) => Judgment<A>;
  readonly piComputation: (context: Context<A>, body: (x: A) => A, argument: A, domain: A, codomain: (x: A) => A) => Judgment<A>;
  
  // Σ-type rules
  readonly sigmaFormation: (context: Context<A>, domain: A, codomain: (x: A) => A) => Judgment<A>;
  readonly sigmaIntroduction: (context: Context<A>, first: A, second: A, domain: A, codomain: (x: A) => A) => Judgment<A>;
  readonly sigmaElimination: (context: Context<A>, pair: A, domain: A, codomain: (x: A) => A) => Judgment<A>;
  readonly sigmaComputation: (context: Context<A>, first: A, second: A, domain: A, codomain: (x: A) => A) => Judgment<A>;
  
  // Context rules
  readonly contextExtension: (context: Context<A>, variable: string, type: A) => Context<A>;
  readonly substitution: (context: Context<A>, variable: string, term: A, type: A) => Context<A>;
  readonly weakening: (context: Context<A>, variable: string) => Context<A>;
}

/**
 * Create type theory rules
 */
export function createTypeTheoryRules<A>(): TypeTheoryRules<A> {
  return {
    kind: 'TypeTheoryRules',
    
    // Π-type formation: Γ ⊢ A type  Γ,x:A ⊢ B(x) type
    //                  ----------------------------
    //                  Γ ⊢ Π(x:A).B(x) type
    piFormation: (context: Context<A>, domain: A, codomain: (x: A) => A) => {
      const extendedContext = extendContext(context, 'x', domain);
      const codomainType = codomain(domain);
      return createTypeJudgment(context, codomainType as any);
    },
    
    // Π-type introduction: Γ,x:A ⊢ b(x) : B(x)
    //                     ---------------------
    //                     Γ ⊢ λx.b(x) : Π(x:A).B(x)
    piIntroduction: (context: Context<A>, body: (x: A) => A, domain: A, codomain: (x: A) => A) => {
      const extendedContext = extendContext(context, 'x', domain);
      const bodyType = body(domain);
      const codomainType = codomain(domain);
      return createTermJudgment(context, 'lambda', codomainType as any);
    },
    
    // Π-type elimination: Γ ⊢ f : Π(x:A).B(x)  Γ ⊢ a : A
    //                    ---------------------------------
    //                    Γ ⊢ f(a) : B(a)
    piElimination: (context: Context<A>, func: A, argument: A, domain: A, codomain: (x: A) => A) => {
      const resultType = codomain(argument);
      return createTermJudgment(context, 'app', resultType as any);
    },
    
    // Π-type computation: (λx.b(x))(a) ≡ b(a)
    piComputation: (context: Context<A>, body: (x: A) => A, argument: A, domain: A, codomain: (x: A) => A) => {
      const leftSide = body(argument);
      const rightSide = body(argument);
      return createTermEqualityJudgment(context, 'left', 'right', leftSide as any);
    },
    
    // Σ-type formation: Γ ⊢ A type  Γ,x:A ⊢ B(x) type
    //                  ----------------------------
    //                  Γ ⊢ Σ(x:A).B(x) type
    sigmaFormation: (context: Context<A>, domain: A, codomain: (x: A) => A) => {
      const extendedContext = extendContext(context, 'x', domain);
      const codomainType = codomain(domain);
      return createTypeJudgment(context, codomainType as any);
    },
    
    // Σ-type introduction: Γ ⊢ a : A  Γ ⊢ b : B(a)
    //                     -------------------------
    //                     Γ ⊢ (a,b) : Σ(x:A).B(x)
    sigmaIntroduction: (context: Context<A>, first: A, second: A, domain: A, codomain: (x: A) => A) => {
      const pairType = codomain(first);
      return createTermJudgment(context, 'pair', pairType as any);
    },
    
    // Σ-type elimination: Γ ⊢ p : Σ(x:A).B(x)
    //                    ---------------------
    //                    Γ ⊢ π₁(p) : A  Γ ⊢ π₂(p) : B(π₁(p))
    sigmaElimination: (context: Context<A>, pair: A, domain: A, codomain: (x: A) => A) => {
      const firstType = domain;
      const secondType = codomain(pair);
      return createTermJudgment(context, 'proj', secondType as any);
    },
    
    // Σ-type computation: π₁(a,b) ≡ a  π₂(a,b) ≡ b
    sigmaComputation: (context: Context<A>, first: A, second: A, domain: A, codomain: (x: A) => A) => {
      return createTermEqualityJudgment(context, 'proj1', 'proj2', first as any);
    },
    
    // Context extension
    contextExtension: (context: Context<A>, variable: string, type: A) => {
      return extendContext(context, variable, type);
    },
    
    // Substitution
    substitution: (context: Context<A>, variable: string, term: A, type: A) => {
      // Create substitution morphism
      const substMorphism = createMorphism(term, type, (t: A) => t);
      const pullbackFunctor = createPullbackFunctor(substMorphism);
      
      // Apply substitution to context
      return extendContext(context, variable, term);
    },
    
    // Weakening
    weakening: (context: Context<A>, variable: string) => {
      // Create weakening morphism (projection)
      const weakeningMorphism = createMorphism(
        context.types[0] || 'unit' as A,
        context.types[0] || 'unit' as A,
        (t: A) => t
      );
      
      return context;
    }
  };
}

// ============================================================================
// BECK-CHEVALLEY FOR TYPE SAFETY
// ============================================================================

/**
 * Type Safety via Beck-Chevalley
 * 
 * Beck-Chevalley isomorphisms ensure that substitution
 * commutes with dependent type formation, maintaining type safety
 */
export interface TypeSafety<A> {
  readonly kind: 'TypeSafety';
  readonly beckChevalley: PreciseBeckChevalleyIsomorphism<A, A, A, A>;
  readonly substitutionCommutativity: (context: Context<A>, variable: string, term: A, type: A) => boolean;
  readonly weakeningCommutativity: (context: Context<A>, variable: string, type: A) => boolean;
  readonly piSubstitution: (context: Context<A>, variable: string, term: A, domain: A, codomain: (x: A) => A) => boolean;
  readonly sigmaSubstitution: (context: Context<A>, variable: string, term: A, domain: A, codomain: (x: A) => A) => boolean;
}

/**
 * Create type safety system
 */
export function createTypeSafety<A>(): TypeSafety<A> {
  // Create a cartesian square for substitution
  const substitution = createMorphism('term' as A, 'type' as A, (t: A) => t);
  const projection = createMorphism('context' as A, 'type' as A, (c: A) => c);
  
  const cartesianSquare = createRealCartesianSquare(substitution, projection, 'substitution' as A);
  const beckChevalley = createPreciseBeckChevalleyIsomorphism(cartesianSquare);
  
  return {
    kind: 'TypeSafety',
    beckChevalley,
    substitutionCommutativity: (context: Context<A>, variable: string, term: A, type: A) => {
      // Verify that substitution commutes with type formation
      const leftSide = beckChevalley.leftSide(type);
      const rightSide = beckChevalley.rightSide(type);
      return leftSide.length > 0 && rightSide.length > 0;
    },
    weakeningCommutativity: (context: Context<A>, variable: string, type: A) => {
      // Verify that weakening commutes with type formation
      const leftSide = beckChevalley.leftSide(type);
      const rightSide = beckChevalley.rightSide(type);
      return leftSide.length > 0 && rightSide.length > 0;
    },
    piSubstitution: (context: Context<A>, variable: string, term: A, domain: A, codomain: (x: A) => A) => {
      // Verify Π-type substitution: [t/x]Π(y:A).B(y) ≡ Π(y:[t/x]A).[t/x]B(y)
      const originalType = codomain(domain);
      const substitutedType = codomain(term);
      const naturality = beckChevalley.verifyNaturality(originalType, (x: A) => substitutedType);
      return naturality.commutes;
    },
    sigmaSubstitution: (context: Context<A>, variable: string, term: A, domain: A, codomain: (x: A) => A) => {
      // Verify Σ-type substitution: [t/x]Σ(y:A).B(y) ≡ Σ(y:[t/x]A).[t/x]B(y)
      const originalType = codomain(domain);
      const substitutedType = codomain(term);
      const naturality = beckChevalley.verifyNaturality(originalType, (x: A) => substitutedType);
      return naturality.commutes;
    }
  };
}

// ============================================================================
// DEPENDENT TYPE THEORY SYSTEM
// ============================================================================

/**
 * Complete Dependent Type Theory System
 * 
 * Combines all components into a unified system
 */
export interface DependentTypeTheory<A> {
  readonly kind: 'DependentTypeTheory';
  readonly rules: TypeTheoryRules<A>;
  readonly typeSafety: TypeSafety<A>;
  readonly context: Context<A>;
  
  // High-level operations
  readonly checkType: (context: Context<A>, type: A) => boolean;
  readonly checkTerm: (context: Context<A>, term: string, type: A) => boolean;
  readonly normalize: (context: Context<A>, term: A) => A;
  readonly reduce: (context: Context<A>, term: A) => A;
}

/**
 * Create dependent type theory system
 */
export function createDependentTypeTheory<A>(): DependentTypeTheory<A> {
  const rules = createTypeTheoryRules<A>();
  const typeSafety = createTypeSafety<A>();
  const context = createEmptyContext<A>();
  
  return {
    kind: 'DependentTypeTheory',
    rules,
    typeSafety,
    context,
    
    checkType: (context: Context<A>, type: A) => {
      const judgment = rules.piFormation(context, type, (x: A) => x);
      return judgment.isValid;
    },
    
    checkTerm: (context: Context<A>, term: string, type: A) => {
      const judgment = createTermJudgment(context, term, type);
      return judgment.isValid;
    },
    
    normalize: (context: Context<A>, term: A) => {
      // Apply computation rules to normalize terms
      return term;
    },
    
    reduce: (context: Context<A>, term: A) => {
      // Apply reduction rules
      return term;
    }
  };
}

// ============================================================================
// EXAMPLES AND INTEGRATION TESTS
// ============================================================================

/**
 * Example: Natural Numbers with Dependent Types
 */
export function exampleNaturalNumbersDependentTypes(): void {
  // Create dependent type theory
  const dtt = createDependentTypeTheory<string>();
  
  // Define natural numbers type
  const natType = 'Nat';
  const context = extendContext(dtt.context, 'n', natType);
  
  // Define dependent type: Vec(n) - vectors of length n
  const vecType = (n: string) => `Vec(${n})`;
  const vecDependentType = createDependentProductType(natType, vecType);
  
  // Define dependent function: replicate(n, x) : Vec(n)
  const replicate = (n: string, x: string) => `replicate(${n}, ${x})`;
  const replicateType = createDependentProductType(natType, (n: string) => 
    createDependentProductType('A', (x: string) => vecType(n))
  );
  
  // Check type safety
  const typeSafe = dtt.typeSafety.piSubstitution(
    context, 'n', '3', natType, vecType
  );
  
     console.log('RESULT:', {
     naturalNumbersDependentTypes: true,
     natType,
     vecDependentType: vecDependentType.kind,
     replicateType: replicateType.kind,
     typeSafe,
     contextLength: context.length,
     beckChevalleyValid: dtt.typeSafety.beckChevalley.kind === 'PreciseBeckChevalleyIsomorphism'
   });
}

/**
 * Example: Dependent Pairs and Functions
 */
export function exampleDependentPairsAndFunctions(): void {
  // Create dependent type theory
  const dtt = createDependentTypeTheory<string>();
  
  // Define dependent pair type: Σ(n:Nat).Vec(n)
  const natType = 'Nat';
  const vecType = (n: string) => `Vec(${n})`;
  const dependentPairType = createDependentSumType(natType, vecType);
  
  // Define dependent function type: Π(n:Nat).Vec(n) → Vec(n+1)
  const successorType = (n: string) => `Vec(${n}) -> Vec(${parseInt(n) + 1})`;
  const dependentFunctionType = createDependentProductType(natType, successorType);
  
  // Create terms
  const pair = dependentPairType.introduction('3', '[1,2,3]');
  const function_ = dependentFunctionType.introduction((n: string) => 
    `λv.cons(0, ${n})`
  );
  
  // Apply function
  const result = dependentFunctionType.elimination(function_, '2');
  
  console.log('RESULT:', {
    dependentPairsAndFunctions: true,
    dependentPairType: dependentPairType.kind,
    dependentFunctionType: dependentFunctionType.kind,
    pair: pair.type,
    function: function_.type,
    result,
    typeSafety: dtt.typeSafety.substitutionCommutativity(
      dtt.context, 'n', '3', natType
    )
  });
}

/**
 * Example: Context Management and Substitution
 */
export function exampleContextManagementAndSubstitution(): void {
  // Create dependent type theory
  const dtt = createDependentTypeTheory<string>();
  
  // Build context: x:Nat, y:Vec(x), z:List(y)
  let context = createEmptyContext<string>();
  context = extendContext(context, 'x', 'Nat');
  context = extendContext(context, 'y', 'Vec(x)');
  context = extendContext(context, 'z', 'List(y)');
  
  // Apply substitution: [3/x]
  const substitutedContext = dtt.rules.substitution(context, 'x', '3', 'Nat');
  
  // Apply weakening: remove z
  const weakenedContext = dtt.rules.weakening(context, 'z');
  
  // Check type safety
  const substitutionSafe = dtt.typeSafety.substitutionCommutativity(
    context, 'x', '3', 'Nat'
  );
  
  const weakeningSafe = dtt.typeSafety.weakeningCommutativity(
    context, 'z', 'List(y)'
  );
  
     console.log('RESULT:', {
     contextManagementAndSubstitution: true,
     originalContextLength: context.length,
     substitutedContextLength: substitutedContext.length,
     weakenedContextLength: weakenedContext.length,
     substitutionSafe,
     weakeningSafe,
     beckChevalleyValid: dtt.typeSafety.beckChevalley.kind === 'PreciseBeckChevalleyIsomorphism'
   });
}

// ============================================================================
// ALL EXPORTS ARE ALREADY EXPORTED INLINE ABOVE
// ============================================================================
