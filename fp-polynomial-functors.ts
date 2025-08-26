/**
 * Polynomial Functors Implementation
 * 
 * Based on "Pattern runs on matter: The free monad monad as a module over the cofree comonad comonad"
 * by Sophie Libkind and David I. Spivak
 * 
 * Polynomial functors are the foundation for the "Pattern runs on Matter" framework
 */

// ============================================================================
// CORE POLYNOMIAL FUNCTOR DEFINITION
// ============================================================================

/**
 * Polynomial Functor: P(A) = Σ_{i:P(1)} A^{P[i]}
 * 
 * Where:
 * - P(1) = positions (set of "questions" or "choices")
 * - P[i] = directions at position i (set of "answers" or "next steps")
 * - A = the variable type
 */
export interface Polynomial<Positions, Directions> {
  readonly positions: Positions;
  readonly directions: (pos: Positions) => Directions;
}

/**
 * Polynomial Functor as a type constructor
 */
export type PolynomialF<Positions, Directions, A> = {
  position: Positions;
  direction: Directions;
  value: A;
};

// ============================================================================
// POLYNOMIAL PRODUCT (◁)
// ============================================================================

/**
 * Polynomial Product: (P ◁ Q)(A) = P(Q(A))
 * 
 * This is the composition of polynomial functors
 */
export type PolynomialProduct<
  P extends Polynomial<any, any>,
  Q extends Polynomial<any, any>
> = Polynomial<
  { left: P['positions']; right: Q['positions'] },
  { left: P['directions']; right: Q['directions'] }
>;

/**
 * Compose two polynomial functors
 */
export function composePolynomials<
  P extends Polynomial<any, any>,
  Q extends Polynomial<any, any>
>(p: P, q: Q): PolynomialProduct<P, Q> {
  return {
    positions: { left: p.positions, right: q.positions } as any,
    directions: (_pos) => ({
      left: (typeof p.directions === 'function'
        ? p.directions(p.positions as any)
        : p.directions) as any,
      right: (typeof q.directions === 'function'
        ? q.directions(q.positions as any)
        : q.directions) as any
    })
  };
}

// ============================================================================
// UNIT POLYNOMIAL (y)
// ============================================================================

/**
 * Unit polynomial: y(A) = A
 * 
 * This represents the identity polynomial functor
 */
export const unitPolynomial: Polynomial<{ unit: true }, never> = {
  positions: { unit: true },
  directions: () => {
    throw new Error("Unit polynomial has no directions");
  }
};

// ============================================================================
// SPECIFIC POLYNOMIALS FROM THE PAPER
// ============================================================================

/**
 * Tea Interview Polynomial from the paper
 * p = {Tea?}y^{yes,no} + {Kind?}y^{green,black,herbal}
 */
export const teaInterviewPolynomial: Polynomial<
  'Tea?' | 'Kind?',
  { 'Tea?': 'yes' | 'no'; 'Kind?': 'green' | 'black' | 'herbal' }
> = {
  positions: 'Tea?' as const,
  directions: (pos) => {
    switch (pos) {
      case 'Tea?':
        return { 'Tea?': 'yes' as const, 'Kind?': 'green' as const };
      case 'Kind?':
        return { 'Tea?': 'no' as const, 'Kind?': 'black' as const };
      default:
        return { 'Tea?': 'yes' as const, 'Kind?': 'green' as const };
    }
  }
};

/**
 * Natural Number Effect Polynomial
 * p = y^N (reading natural numbers)
 */
export const naturalNumberEffect: Polynomial<{ read: true }, number> = {
  positions: { read: true },
  directions: () => 0 // Default direction
};

/**
 * Boolean Return Type Polynomial
 * r = y^{Bool}
 */
export const booleanReturn: Polynomial<{ result: true }, boolean> = {
  positions: { result: true },
  directions: () => true // Default direction
};

// ============================================================================
// INTERNAL HOM [P, Q]
// ============================================================================

/**
 * Internal Hom: [P, Q] = universal answerer for polynomial P
 * 
 * [P, Q](A) = Π_{i:P(1)} Q(A)^{P[i]}
 */
export interface InternalHom<P extends Polynomial<any, any>, Q extends Polynomial<any, any>> {
  readonly pattern: P;
  readonly target: Q;
}

/**
 * Create internal hom polynomial
 */
export function internalHom<P extends Polynomial<any, any>, Q extends Polynomial<any, any>>(
  pattern: P,
  target: Q
): InternalHom<P, Q> {
  return { pattern, target };
}

/**
 * Universal Answerer: [P, y] = Π_{i:P(1)} y^{P[i]}
 * 
 * This is the "matter" that responds to the "pattern" P
 */
export function universalAnswerer<P extends Polynomial<any, any>>(
  pattern: P
): InternalHom<P, typeof unitPolynomial> {
  return internalHom(pattern, unitPolynomial);
}

// ============================================================================
// POLYNOMIAL EVALUATION
// ============================================================================

/**
 * Evaluate a polynomial at a specific type
 */
export function evaluatePolynomial<P extends Polynomial<any, any>, A>(
  polynomial: P,
  value: A
): PolynomialF<P['positions'], P['directions'], A>[] {
  const positions = polynomial.positions;
  const directions = polynomial.directions(positions);
  
  // For simplicity, we'll return a single evaluation
  // In practice, this would handle the full Σ_{i:P(1)} A^{P[i]} structure
  return [{
    position: positions,
    direction: directions,
    value
  }];
}

// ============================================================================
// POLYNOMIAL MAPS
// ============================================================================

/**
 * Map between polynomial functors
 */
export interface PolynomialMap<P extends Polynomial<any, any>, Q extends Polynomial<any, any>> {
  readonly from: P;
  readonly to: Q;
  readonly map: (p: P['positions']) => Q['positions'];
  readonly lift: (q: Q['directions']) => P['directions'];
}

/**
 * Create a polynomial map
 */
export function polynomialMap<P extends Polynomial<any, any>, Q extends Polynomial<any, any>>(
  from: P,
  to: Q,
  map: (p: P['positions']) => Q['positions'],
  lift: (q: Q['directions']) => P['directions']
): PolynomialMap<P, Q> {
  return { from, to, map, lift };
}

// ============================================================================
// FREE MONAD ON POLYNOMIALS
// ============================================================================

/**
 * Free Monad on a polynomial functor
 * 
 * m_p = colim_{α<κ} P(α) where P(α+1) = y + P ◁ P(α)
 */
export type FreeMonadPolynomial<P extends Polynomial<any, any>, A> = 
  | { type: 'Pure'; value: A }
  | { type: 'Suspend'; position: P['positions']; continuation: (direction: P['directions']) => FreeMonadPolynomial<P, A> };

/**
 * Create pure value in free monad
 */
export function purePolynomial<P extends Polynomial<any, any>, A>(value: A): FreeMonadPolynomial<P, A> {
  return { type: 'Pure', value };
}

/**
 * Suspend computation in free monad
 */
export function suspendPolynomial<P extends Polynomial<any, any>, A>(
  position: P['positions'],
  continuation: (direction: P['directions']) => FreeMonadPolynomial<P, A>
): FreeMonadPolynomial<P, A> {
  return { type: 'Suspend', position, continuation };
}

// ============================================================================
// COFREE COMONAD ON POLYNOMIALS
// ============================================================================

/**
 * Cofree Comonad on a polynomial functor
 * 
 * c_p = universal answerer [p, y]
 */
export interface CofreeComonadPolynomial<P extends Polynomial<any, any>, A> {
  readonly extract: A;
  readonly duplicate: CofreeComonadPolynomial<P, CofreeComonadPolynomial<P, A>>;
  readonly extend: <B>(f: (wa: CofreeComonadPolynomial<P, A>) => B) => CofreeComonadPolynomial<P, B>;
  readonly respond: (position: P['positions']) => P['directions'];
}

/**
 * Create cofree comonad from coalgebra
 */
export function cofreePolynomial<P extends Polynomial<any, any>, A>(
  extract: A,
  respond: (position: P['positions']) => P['directions']
): CofreeComonadPolynomial<P, A> {
  // Use lazy evaluation to avoid circular references
  let _duplicate: CofreeComonadPolynomial<P, CofreeComonadPolynomial<P, A>> | null = null;
  
  const cofree: CofreeComonadPolynomial<P, A> = {
    extract,
    respond,
    get duplicate() {
      if (!_duplicate) {
        _duplicate = {
          extract: cofree,
          respond,
          get duplicate() {
            // ensure the duplicate is one level deeper: Cofree<P, Cofree<P, Cofree<P, A>>>
            return cofreePolynomial(_duplicate!, respond);
          },
          extend: <C>(f: (wa: CofreeComonadPolynomial<P, CofreeComonadPolynomial<P, A>>) => C) => 
            cofreePolynomial(f(_duplicate!), respond)
        };
      }
      return _duplicate!;
    },
    extend: <B>(f: (wa: CofreeComonadPolynomial<P, A>) => B) => 
      cofreePolynomial(f(cofree), respond)
  };
  
  return cofree;
}

// ============================================================================
// MODULE ACTION Ξ: m_p ⊗ c_q → m_{p⊗q}
// ============================================================================

/**
 * Module Action: pattern runs on matter
 * 
 * This implements the core formula: Ξp,q: Mp ⊗ Cq → Mp⊗q
 */
export function moduleActionΞ<P extends Polynomial<any, any>, Q extends Polynomial<any, any>, A, B>(
  pattern: FreeMonadPolynomial<P, A>,
  matter: CofreeComonadPolynomial<Q, B>
): FreeMonadPolynomial<PolynomialProduct<P, Q>, [A, B]> {
  switch (pattern.type) {
    case 'Pure':
      // Pure pattern runs on matter by pairing values
      return purePolynomial([pattern.value, matter.extract]);
    
    case 'Suspend':
      // Suspend pattern runs on matter by suspending the interaction
      return suspendPolynomial(
        { left: pattern.position, right: matter.extract },
        (direction) => {
          // This is a simplified version - in practice, we'd need to handle
          // the full polynomial product structure
          const continuedPattern = pattern.continuation(direction as any);
          // Use matter directly, not suspendedMatter, to avoid nested CofreeComonadPolynomial
          return moduleActionΞ(continuedPattern, matter);
        }
      );
  }
}

// ============================================================================
// CONCRETE EXAMPLES FROM THE PAPER
// ============================================================================

/**
 * Example: Tea Interview Pattern
 */
export function createTeaInterview(): FreeMonadPolynomial<typeof teaInterviewPolynomial, string> {
  return suspendPolynomial('Tea?', (dir1) => {
    if (dir1['Tea?'] === 'yes') {
      return suspendPolynomial('Kind?', (dir2) => {
        return purePolynomial(`You chose ${dir2['Kind?']} tea!`);
      });
    } else {
      return purePolynomial('No tea for you!');
    }
  });
}

/**
 * Example: Person as Universal Answerer (Matter)
 */
export function createTeaPerson(): CofreeComonadPolynomial<typeof teaInterviewPolynomial, string> {
  return cofreePolynomial('Alice', (question) => {
    // Always return a full directions object matching the polynomial's directions for the given position.
    // Example policy: prefers tea and defaults to green.
    if (question === 'Tea?') {
      return { 'Tea?': 'yes', 'Kind?': 'green' } as any;
    }
    if (question === 'Kind?') {
      return { 'Tea?': 'yes', 'Kind?': 'green' } as any;
    }
    // Fallback (shouldn't be hit if positions are only 'Tea?' | 'Kind?')
    return { 'Tea?': 'no', 'Kind?': 'green' } as any;
  });
}

/**
 * Example: Run interview on person
 */
export function runTeaInterview(): FreeMonadPolynomial<PolynomialProduct<typeof teaInterviewPolynomial, typeof teaInterviewPolynomial>, [string, string]> {
  const interview = createTeaInterview();
  const person = createTeaPerson();
  return moduleActionΞ(interview, person);
}

// ============================================================================
// PROGRAM SEMANTICS EXAMPLE
// ============================================================================

/**
 * Program Semantics: r → m_p
 * 
 * Example: guessing_game program from the paper
 */
export interface ProgramSemantics<R, P extends Polynomial<any, any>> {
  readonly inputType: R;
  readonly effectType: P;
  readonly program: (input: R) => FreeMonadPolynomial<P, any>;
}

/**
 * Guessing Game Program
 * 
 * r = Σ_{m:N,g:N} y^{Bool}
 * p = y^N (reading natural numbers)
 */
export const guessingGameProgram: ProgramSemantics<
  { maxGuesses: number; goal: number },
  typeof naturalNumberEffect
> = {
  inputType: { maxGuesses: 0, goal: 0 },
  effectType: naturalNumberEffect,
  program: (input) => {
    if (input.maxGuesses === 0) {
      return purePolynomial(false);
    }
    
    return suspendPolynomial({ read: true }, (guess) => {
      if (guess({ read: true }) === input.goal) {
        return purePolynomial(true);
      }
      
      return guessingGameProgram.program({
        maxGuesses: input.maxGuesses - 1,
        goal: input.goal
      });
    });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

// All exports are already exported inline above
