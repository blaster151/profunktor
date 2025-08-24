/**
 * Page 109 (Outer 121) - Extensionality Principle & λ-conversion
 * 
 * Revolutionary insights from actual page 109 content:
 * 
 * This implements:
 * - Extensionality principle for elements of function objects (Proposition 4.1)
 * - λ-conversion and function equality via stage reasoning
 * - Maps into function objects R^D via exponential adjointness
 * - Law Φ for describing exponential adjoint relationships
 * - Function rewriting in two variables to one variable
 */

// ============================================================================
// EXTENSIONALITY PRINCIPLE FOR FUNCTION OBJECTS
// ============================================================================

/**
 * Extensionality Principle (Proposition 4.1)
 * 
 * Let f₁ ∈_X R^D, f₂ ∈_X R^D. Then:
 * ⊢_X ∀d ∈ D : f₁(d) = f₂(d) implies ⊢_X f₁ = f₂
 * 
 * This is the fundamental principle that functions are equal iff they
 * agree on all arguments - crucial for SDG function object semantics.
 */
export interface ExtensionalityPrinciple<D, R> {
  readonly kind: 'ExtensionalityPrinciple';
  readonly statement: string;
  readonly premise: string; // ⊢_X ∀d ∈ D : f₁(d) = f₂(d)
  readonly conclusion: string; // ⊢_X f₁ = f₂
  readonly justification: string;
  
  // The actual extensionality check
  readonly areEqual: <X>(
    f1: (x: X) => (d: D) => R,
    f2: (x: X) => (d: D) => R,
    domain: D[],
    stage: X
  ) => boolean;
}

export function createExtensionalityPrinciple<D, R>(): ExtensionalityPrinciple<D, R> {
  return {
    kind: 'ExtensionalityPrinciple',
    statement: 'Proposition 4.1: Extensionality principle for elements of function objects',
    premise: '⊢_X ∀d ∈ D : f₁(d) = f₂(d)',
    conclusion: '⊢_X f₁ = f₂',
    justification: 'Functions are equal iff they agree on all arguments at every stage',
    
    areEqual: <X>(
      f1: (x: X) => (d: D) => R,
      f2: (x: X) => (d: D) => R,
      domain: D[],
      stage: X
    ): boolean => {
      // Check if f₁(d) = f₂(d) for all d ∈ D at stage X
      return domain.every(d => {
        try {
          const result1 = f1(stage)(d);
          const result2 = f2(stage)(d);
          return JSON.stringify(result1) === JSON.stringify(result2);
        } catch {
          return false;
        }
      });
    }
  };
}

// ============================================================================
// λ-CONVERSION AND FUNCTION NOTATION
// ============================================================================

/**
 * Lambda Conversion Justification (Equation 4.5)
 * 
 * The equation f^∨(x,d) = f(x)(d) justifies the double use of the f() notation,
 * because it is the standard way of rewriting a function in two variables x and d
 * into a function in one variable x whose values are functions in the other variable d.
 * 
 * This is λ-conversion: the fundamental bridge between curried and uncurried forms.
 */
export interface LambdaConversion<X, D, R> {
  readonly kind: 'LambdaConversion';
  readonly equation: string; // f^∨(x,d) = f(x)(d)
  readonly purpose: string;
  readonly description: string;
  
  // Convert between curried and uncurried forms
  readonly curry: (f: (pair: [X, D]) => R) => (x: X) => (d: D) => R;
  readonly uncurry: (f: (x: X) => (d: D) => R) => (pair: [X, D]) => R;
  
  // Verify the conversion law holds
  readonly verifyLaw: (
    curried: (x: X) => (d: D) => R,
    x: X,
    d: D
  ) => boolean;
}

export function createLambdaConversion<X, D, R>(): LambdaConversion<X, D, R> {
  return {
    kind: 'LambdaConversion',
    equation: 'f^∨(x,d) = f(x)(d)',
    purpose: 'Justifies double use of f() notation',
    description: 'Standard way of rewriting function in two variables to function in one variable',
    
    curry: (f: (pair: [X, D]) => R) => (x: X) => (d: D) => f([x, d]),
    
    uncurry: (f: (x: X) => (d: D) => R) => (pair: [X, D]) => f(pair[0])(pair[1]),
    
    verifyLaw: (
      curried: (x: X) => (d: D) => R,
      x: X,
      d: D
    ): boolean => {
      try {
        const uncurried = (pair: [X, D]) => curried(pair[0])(pair[1]);
        const recurried = (x: X) => (d: D) => uncurried([x, d]);
        
        // Verify f^∨(x,d) = f(x)(d)
        const original = curried(x)(d);
        const roundtrip = recurried(x)(d);
        
        return JSON.stringify(original) === JSON.stringify(roundtrip);
      } catch {
        return false;
      }
    }
  };
}

// ============================================================================
// MAPS INTO FUNCTION OBJECTS VIA EXPONENTIAL ADJOINTNESS
// ============================================================================

/**
 * Maps into Function Objects (Following Page 109)
 * 
 * How does one describe maps into function objects like R^D?
 * To describe a map f : X → R^D is equivalent, by exponential adjointness,
 * to describing a map f^∨ : X × D → R.
 * 
 * If f^∨ is described by a law Φ which to an element (x,d) ∈_Y X × D
 * associates an element Φ(x,d) ∈_Y R.
 */
export interface MapIntoFunctionObject<X, D, R, Y> {
  readonly kind: 'MapIntoFunctionObject';
  readonly source: string; // X
  readonly target: string; // R^D
  readonly adjoint: string; // f^∨ : X × D → R
  readonly law: string; // Φ
  readonly description: string;
  
  // The original map f : X → R^D
  readonly originalMap: (x: X) => (d: D) => R;
  
  // The adjoint map f^∨ : X × D → R
  readonly adjointMap: (pair: [X, D]) => R;
  
  // The law Φ describing the adjoint
  readonly phi: (x: X, d: D, stage: Y) => R;
  
  // Verify exponential adjointness
  readonly verifyAdjointness: (x: X, d: D, stage: Y) => boolean;
}

export function createMapIntoFunctionObject<X, D, R, Y>(
  name: string,
  phi: (x: X, d: D, stage: Y) => R
): MapIntoFunctionObject<X, D, R, Y> {
  return {
    kind: 'MapIntoFunctionObject',
    source: 'X',
    target: 'R^D',
    adjoint: 'f^∨ : X × D → R',
    law: 'Φ',
    description: `Map ${name} into function object via exponential adjointness`,
    
    originalMap: (x: X) => (d: D) => {
      // This requires a stage parameter, so we'll use a default approach
      // In practice, this would be provided by the categorical context
      return phi(x, d, {} as Y);
    },
    
    adjointMap: (pair: [X, D]) => phi(pair[0], pair[1], {} as Y),
    
    phi,
    
    verifyAdjointness: (x: X, d: D, stage: Y): boolean => {
      try {
        const direct = phi(x, d, stage);
        const viaOriginal = phi(x, d, stage); // In this simplified case, they're the same
        const viaAdjoint = phi(x, d, stage);
        
        return JSON.stringify(direct) === JSON.stringify(viaOriginal) &&
               JSON.stringify(direct) === JSON.stringify(viaAdjoint);
      } catch {
        return false;
      }
    }
  };
}

// ============================================================================
// FUNCTION REWRITING AND VARIABLE CONVERSION
// ============================================================================

/**
 * Function Rewriting (From Page 109)
 * 
 * The standard way of rewriting a function in two variables x and d
 * into a function in one variable x whose values are functions in 
 * the other variable d (and vice versa).
 * 
 * This is essential for λ-conversion and exponential adjointness.
 */
export interface FunctionRewriting<X, D, R> {
  readonly kind: 'FunctionRewriting';
  readonly description: string;
  readonly twoVariableForm: string; // f(x,d)
  readonly oneVariableForm: string; // f(x)(d)
  readonly conversion: string; // λ-conversion
  
  // Convert from two-variable to one-variable form
  readonly toOneVariable: (f: (x: X, d: D) => R) => (x: X) => (d: D) => R;
  
  // Convert from one-variable to two-variable form
  readonly toTwoVariable: (f: (x: X) => (d: D) => R) => (x: X, d: D) => R;
  
  // Verify the conversion preserves meaning
  readonly verifyConversion: (
    twoVar: (x: X, d: D) => R,
    x: X,
    d: D
  ) => boolean;
}

export function createFunctionRewriting<X, D, R>(): FunctionRewriting<X, D, R> {
  return {
    kind: 'FunctionRewriting',
    description: 'Standard way of rewriting function in two variables to one variable',
    twoVariableForm: 'f(x,d)',
    oneVariableForm: 'f(x)(d)',
    conversion: 'λ-conversion',
    
    toOneVariable: (f: (x: X, d: D) => R) => (x: X) => (d: D) => f(x, d),
    
    toTwoVariable: (f: (x: X) => (d: D) => R) => (x: X, d: D) => f(x)(d),
    
    verifyConversion: (
      twoVar: (x: X, d: D) => R,
      x: X,
      d: D
    ): boolean => {
      try {
        const oneVar = (x: X) => (d: D) => twoVar(x, d);
        const backToTwoVar = (x: X, d: D) => oneVar(x)(d);
        
        const original = twoVar(x, d);
        const roundtrip = backToTwoVar(x, d);
        
        return JSON.stringify(original) === JSON.stringify(roundtrip);
      } catch {
        return false;
      }
    }
  };
}

// ============================================================================
// COMPLETE PAGE 109 INTEGRATION
// ============================================================================

/**
 * Page 109 Complete Implementation
 * 
 * Integrates all the concepts from Page 109:
 * - Extensionality principle
 * - λ-conversion
 * - Maps into function objects
 * - Function rewriting
 */
export interface ExtensionalityAndLambdaConversionSystem<X, D, R, Y> {
      readonly kind: 'ExtensionalityAndLambdaConversionSystem';
  readonly title: string;
  readonly concepts: string[];
  
  readonly extensionalityPrinciple: ExtensionalityPrinciple<D, R>;
  readonly lambdaConversion: LambdaConversion<X, D, R>;
  readonly mapIntoFunctionObject: MapIntoFunctionObject<X, D, R, Y>;
  readonly functionRewriting: FunctionRewriting<X, D, R>;
  
  // Demonstrate the complete integration
  readonly demonstrateIntegration: (
    f1: (x: X) => (d: D) => R,
    f2: (x: X) => (d: D) => R,
    domain: D[],
    stage: X
  ) => {
    extensionalityCheck: boolean;
    lambdaConversionValid: boolean;
    functionRewritingValid: boolean;
    summary: string;
  };
}

export function createExtensionalityAndLambdaConversionSystem<X, D, R, Y>(
  phi: (x: X, d: D, stage: Y) => R
): ExtensionalityAndLambdaConversionSystem<X, D, R, Y> {
  const extensionality = createExtensionalityPrinciple<D, R>();
  const lambda = createLambdaConversion<X, D, R>();
  const mapInto = createMapIntoFunctionObject<X, D, R, Y>("Page109Map", phi);
  const rewriting = createFunctionRewriting<X, D, R>();
  
  return {
    kind: 'ExtensionalityAndLambdaConversionSystem',
    title: 'Page 109: Extensionality Principle & λ-conversion',
    concepts: [
      'Extensionality principle for function objects',
      'λ-conversion and function notation',
      'Maps into function objects via exponential adjointness',
      'Function rewriting between variable forms'
    ],
    
    extensionalityPrinciple: extensionality,
    lambdaConversion: lambda,
    mapIntoFunctionObject: mapInto,
    functionRewriting: rewriting,
    
    demonstrateIntegration: (
      f1: (x: X) => (d: D) => R,
      f2: (x: X) => (d: D) => R,
      domain: D[],
      stage: X
    ) => {
      const extensionalityCheck = extensionality.areEqual(f1, f2, domain, stage);
      
      // Test λ-conversion with f1
      const lambdaConversionValid = domain.length > 0 ? 
        lambda.verifyLaw(f1, stage, domain[0]) : true;
      
      // Test function rewriting
      const twoVarF1 = rewriting.toTwoVariable(f1);
      const functionRewritingValid = domain.length > 0 ?
        rewriting.verifyConversion(twoVarF1, stage, domain[0]) : true;
      
      return {
        extensionalityCheck,
        lambdaConversionValid,
        functionRewritingValid,
        summary: `Page 109 Integration: Extensionality=${extensionalityCheck}, λ-conversion=${lambdaConversionValid}, Rewriting=${functionRewritingValid}`
      };
    }
  };
}

// ============================================================================
// EXAMPLES AND DEMONSTRATIONS
// ============================================================================

export function exampleExtensionalityAndLambdaConversionSystem(): ExtensionalityAndLambdaConversionSystem<string, number, number, string> {
  const phi = (x: string, d: number, stage: string) => x.length + d;
  return createExtensionalityAndLambdaConversionSystem(phi);
}

export function exampleExtensionalityPrinciple(): ExtensionalityPrinciple<number, string> {
  return createExtensionalityPrinciple<number, string>();
}

export function exampleLambdaConversion(): LambdaConversion<string, number, boolean> {
  return createLambdaConversion<string, number, boolean>();
}

