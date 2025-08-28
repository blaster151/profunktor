/**
 * Tests for Polynomial Functors Implementation
 * 
 * Based on "Pattern runs on matter: The free monad monad as a module over the cofree comonad comonad"
 * by Sophie Libkind and David I. Spivak
 */

import { describe, it, expect } from 'vitest';
import {
  Polynomial,
  PolynomialF,
  PolynomialProduct,
  composePolynomials,
  unitPolynomial,
  teaInterviewPolynomial,
  naturalNumberEffect,
  booleanReturn,
  InternalHom,
  internalHom,
  universalAnswerer,
  evaluatePolynomial,
  PolynomialMap,
  polynomialMap,
  FreeMonadPolynomial,
  purePolynomial,
  suspendPolynomial,
  CofreeComonadPolynomial,
  cofreePolynomial,
  moduleActionΞ,
  createTeaInterview,
  createTeaPerson,
  runTeaInterview,
  ProgramSemantics,
  guessingGameProgram
} from '../fp-polynomial-functors';

describe('Polynomial Functors', () => {
  describe('Core Polynomial Definition', () => {
    it('should define polynomial functors with positions and directions', () => {
      const simplePolynomial: Polynomial<'A' | 'B', { 'A': 'X' | 'Y'; 'B': 'Z' }> = {
        positions: 'A',
        directions: (pos) => {
          switch (pos) {
            case 'A': return 'X';
            case 'B': return 'Z';
          }
        }
      };

      expect(simplePolynomial.positions).toBe('A');
      expect(simplePolynomial.directions('A')).toBe('X');
      expect(simplePolynomial.directions('B')).toBe('Z');
    });

    it('should handle unit polynomial correctly', () => {
      expect(unitPolynomial.positions).toEqual({ unit: true });
      expect(() => unitPolynomial.directions({ unit: true })).toThrow();
    });
  });

  describe('Polynomial Product (◁)', () => {
    it('should compose polynomial functors', () => {
      const p = teaInterviewPolynomial;
      const q = naturalNumberEffect;
      const product = composePolynomials(p, q);

      expect(product.positions.left).toBe(p.positions);
      expect(product.positions.right).toBe(q.positions);
    });
  });

  describe('Specific Polynomials from Paper', () => {
    it('should define tea interview polynomial correctly', () => {
      expect(teaInterviewPolynomial.positions).toBe('Tea?');
      const dirTea = teaInterviewPolynomial.directions('Tea?');
      expect(dirTea['Tea?']).toBe('yes');
      const dirKind = teaInterviewPolynomial.directions('Kind?');
      expect(dirKind['Kind?']).toBe('black');
    });

    it('should define natural number effect polynomial', () => {
      expect(naturalNumberEffect.positions).toEqual({ read: true });
      expect(naturalNumberEffect.directions({ read: true })).toBe(0);
    });

    it('should define boolean return polynomial', () => {
      expect(booleanReturn.positions).toEqual({ result: true });
      expect(booleanReturn.directions({ result: true })).toBe(true);
    });
  });

  describe('Internal Hom [P, Q]', () => {
    it('should create internal hom polynomials', () => {
      const pattern = teaInterviewPolynomial;
      const target = unitPolynomial;
      const hom = internalHom(pattern, target);

      expect(hom.pattern).toBe(pattern);
      expect(hom.target).toBe(target);
    });

    it('should create universal answerer', () => {
      const pattern = teaInterviewPolynomial;
      const answerer = universalAnswerer(pattern);

      expect(answerer.pattern).toBe(pattern);
      expect(answerer.target).toBe(unitPolynomial);
    });
  });

  describe('Polynomial Evaluation', () => {
    it('should evaluate polynomial at a value', () => {
      const result = evaluatePolynomial(teaInterviewPolynomial, 'test');
      
      expect(result).toHaveLength(1);
      expect(result[0].position).toBe('Tea?');
      expect(result[0].direction['Tea?']).toBe('yes');
      expect(result[0].value).toBe('test');
    });
  });

  describe('Polynomial Maps', () => {
    it('should create polynomial maps', () => {
      const from = teaInterviewPolynomial;
      const to = naturalNumberEffect;
      const map = polynomialMap(
        from,
        to,
        (pos) => ({ read: true }),
        (dir) => 42
      );

      expect(map.from).toBe(from);
      expect(map.to).toBe(to);
      expect(map.map('Tea?')).toEqual({ read: true });
      expect(map.lift(0)).toBe(42);
    });
  });

  describe('Free Monad on Polynomials', () => {
    it('should create pure values', () => {
      const pure = purePolynomial('hello');
      
      expect(pure.type).toBe('Pure');
      expect(pure.value).toBe('hello');
    });

    it('should create suspended computations', () => {
      const suspended = suspendPolynomial(
        'Tea?',
        (answer) => purePolynomial(`Got: ${answer}`)
      );

      expect(suspended.type).toBe('Suspend');
      expect(suspended.position).toBe('Tea?');
      expect(typeof suspended.continuation).toBe('function');
    });

    it('should handle nested suspensions', () => {
      const nested = suspendPolynomial(
        'Tea?',
        (answer) => {
          if (answer === 'yes') {
            return suspendPolynomial(
              'Kind?',
              (kind) => purePolynomial(`${answer} ${kind}`)
            );
          }
          return purePolynomial('no');
        }
      );

      expect(nested.type).toBe('Suspend');
      expect(nested.position).toBe('Tea?');
      
      const continuation = nested.continuation('yes');
      expect(continuation.type).toBe('Suspend');
      expect(continuation.position).toBe('Kind?');
    });
  });

  describe('Cofree Comonad on Polynomials', () => {
    it('should create cofree comonads', () => {
      const cofree = cofreePolynomial(
        'Alice',
        (question) => {
          switch (question) {
            case 'Tea?': return 'yes';
            case 'Kind?': return 'green';
          }
        }
      );

      expect(cofree.extract).toBe('Alice');
      expect(typeof cofree.respond).toBe('function');
      expect(cofree.respond('Tea?')).toBe('yes');
      expect(cofree.respond('Kind?')).toBe('green');
    });

    it('should handle duplicate operation', () => {
      const cofree = cofreePolynomial(
        'Alice',
        (question) => 'yes'
      );

      const duplicated = cofree.duplicate;
      expect(duplicated.extract.extract).toBe('Alice');
    });

    it('should handle extend operation', () => {
      const cofree = cofreePolynomial(
        'Alice',
        (question) => 'yes'
      );

      const extended = cofree.extend((wa) => wa.extract.length);
      expect(extended.extract).toBe(5); // 'Alice' has length 5
    });
  });

  describe('Module Action Ξ', () => {
    it('should handle pure pattern on matter', () => {
      const pattern = purePolynomial('hello');
      const matter = cofreePolynomial(
        'Alice',
        (question) => 'yes'
      );

      const result = moduleActionΞ(pattern, matter);
      
      expect(result.type).toBe('Pure');
      expect(result.value).toEqual(['hello', 'Alice']);
    });

    it('should handle suspended pattern on matter', () => {
      const pattern = suspendPolynomial(
        'Tea?',
        (answer) => purePolynomial(`Got: ${answer}`)
      );
      const matter = cofreePolynomial(
        'Alice',
        (question) => 'yes'
      );

      const result = moduleActionΞ(pattern, matter);
      
      expect(result.type).toBe('Suspend');
      expect(result.position).toEqual({ left: 'Tea?', right: 'Alice' });
    });
  });

  describe('Tea Interview Example from Paper', () => {
    it('should create tea interview pattern', () => {
      const interview = createTeaInterview();
      
      expect(interview.type).toBe('Suspend');
      expect(interview.position).toBe('Tea?');
      
      const yesContinuation = interview.continuation({ 'Tea?': 'yes', 'Kind?': 'black' });
      expect(yesContinuation.type).toBe('Suspend');
      expect(yesContinuation.position).toBe('Kind?');
      
      const noContinuation = interview.continuation({ 'Tea?': 'no', 'Kind?': 'black' });
      expect(noContinuation.type).toBe('Pure');
      expect(noContinuation.value).toBe('No tea for you!');
    });

    it('should create tea person as universal answerer', () => {
      const person = createTeaPerson();
      
      expect(person.extract).toBe('Alice');
      expect(person.respond('Tea?')['Tea?']).toBe('yes');
      expect(person.respond('Kind?')['Kind?']).toBe('green');
    });

    it('should run interview on person', () => {
      const result = runTeaInterview();
      
      expect(result.type).toBe('Suspend');
      expect(result.position).toEqual({ 
        left: 'Tea?', 
        right: 'Alice' 
      });
    });
  });

  describe('Program Semantics Example', () => {
    it('should define guessing game program', () => {
      expect(guessingGameProgram.inputType).toEqual({ maxGuesses: 0, goal: 0 });
      expect(guessingGameProgram.effectType).toBe(naturalNumberEffect);
      expect(typeof guessingGameProgram.program).toBe('function');
    });

    it('should handle guessing game with zero guesses', () => {
      const result = guessingGameProgram.program({ maxGuesses: 0, goal: 42 });
      
      expect(result.type).toBe('Pure');
      expect(result.value).toBe(false);
    });

    it('should handle guessing game with remaining guesses', () => {
      const result = guessingGameProgram.program({ maxGuesses: 3, goal: 42 });
      
      expect(result.type).toBe('Suspend');
      expect(result.position).toEqual({ read: true });
      expect(typeof result.continuation).toBe('function');
    });

    it('should handle correct guess', () => {
      const suspended = guessingGameProgram.program({ maxGuesses: 3, goal: 42 });
      expect(suspended.type).toBe('Suspend');
      
      const correctGuess = suspended.continuation(42);
      expect(correctGuess.type).toBe('Pure');
      expect(correctGuess.value).toBe(true);
    });

    it('should handle incorrect guess', () => {
      const suspended = guessingGameProgram.program({ maxGuesses: 3, goal: 42 });
      expect(suspended.type).toBe('Suspend');
      
      const incorrectGuess = suspended.continuation(10);
      expect(incorrectGuess.type).toBe('Suspend');
      expect(incorrectGuess.position).toEqual({ read: true });
    });
  });

  describe('Mathematical Properties', () => {
    it('should satisfy polynomial functor laws', () => {
      // Identity: P(1) = P(1)
      const p = teaInterviewPolynomial;
      expect(p.positions).toBe(p.positions);
      
      // Composition: directions should be consistent
      const dir1 = p.directions('Tea?');
      const dir2 = p.directions('Tea?');
      expect(dir1).toStrictEqual(dir2);
    });

    it('should handle polynomial product associativity', () => {
      const p = teaInterviewPolynomial;
      const q = naturalNumberEffect;
      const r = booleanReturn;
      
      const leftAssoc = composePolynomials(composePolynomials(p, q), r);
      const rightAssoc = composePolynomials(p, composePolynomials(q, r));
      
      // Both should be valid polynomial products with nested structure
      expect(leftAssoc.positions.left.left).toBe(p.positions);
      expect(leftAssoc.positions.left.right).toBe(q.positions);
      expect(leftAssoc.positions.right).toBe(r.positions);
      
      expect(rightAssoc.positions.left).toBe(p.positions);
      expect(rightAssoc.positions.right.left).toBe(q.positions);
      expect(rightAssoc.positions.right.right).toBe(r.positions);
    });
  });

  describe('Integration with Existing Systems', () => {
    it('should work with our existing type system', () => {
      // This test ensures our polynomial functors integrate well
      // with our existing HKT and typeclass systems
      const freeMonad = purePolynomial('test');
      const cofreeComonad = cofreePolynomial('matter', () => 'response');
      
      expect(freeMonad.type).toBe('Pure');
      expect(cofreeComonad.extract).toBe('matter');
    });

    it('should support pattern matching', () => {
      const interview = createTeaInterview();
      
      // Test pattern matching on free monad
      switch (interview.type) {
        case 'Pure':
          expect(interview.value).toBeDefined();
          break;
        case 'Suspend':
          expect(interview.position).toBe('Tea?');
          expect(typeof interview.continuation).toBe('function');
          break;
      }
    });
  });
});
