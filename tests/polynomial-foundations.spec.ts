/**
 * Tests for Foundational Definitions of Polynomial Functors
 * 
 * Based on "Polynomial functors and polynomial monads" by Nicola Gambino and Joachim Kock
 * 
 * Tests:
 * - Section 1.4: Definition of a polynomial over a category
 * - Equation (8): The fundamental formula for polynomial functors
 * - Section 1.5: Special case I = J = 1
 * - Section 1.6: Core examples (identity, constant functors)
 * - Section 1.7: Span example
 * 
 * Pages 7-9 of the foundational paper
 */

import { describe, it, expect, vi } from 'vitest';

import {
  // Section 1.4: Definition of a polynomial over a category
  PolynomialDiagram,
  PolynomialFunctor,
  createPolynomialFunctor,
  
  // Equation (8): Fundamental formula
  Equation8,
  createEquation8,
  
  // Section 1.5: Special case I = J = 1
  SingleVariablePolynomial,
  createSingleVariablePolynomial,
  
  // Section 1.6: Examples
  IdentityPolynomial,
  createIdentityPolynomial,
  ConstantPolynomial,
  createConstantPolynomial,
  
  // Section 1.7: Span example
  SpanPolynomial,
  createSpanPolynomial,
  
  // Verification
  verifyPolynomialDiagram,
  verifyPolynomialFunctor,
  verifyEquation8,
  
  // Examples
  exampleNaturalNumbersPolynomial,
  exampleBinaryTreesPolynomial,
  exampleIdentityPolynomial,
  exampleConstantPolynomial,
  exampleSpanPolynomial
} from '../fp-polynomial-foundations';

describe('Foundational Definitions of Polynomial Functors', () => {
  
  describe('Section 1.4: Definition of a polynomial over a category', () => {
    
    it('should create polynomial diagram', () => {
      const diagram: PolynomialDiagram<string, string, string, string> = {
        kind: 'PolynomialDiagram',
        s: (b) => 'I',
        f: (b) => 'A',
        t: (a) => 'J',
        I: 'I',
        B: 'B',
        A: 'A',
        J: 'J'
      };
      
      expect(diagram.kind).toBe('PolynomialDiagram');
      expect(diagram.s('B')).toBe('I');
      expect(diagram.f('B')).toBe('A');
      expect(diagram.t('A')).toBe('J');
      expect(diagram.I).toBe('I');
      expect(diagram.B).toBe('B');
      expect(diagram.A).toBe('A');
      expect(diagram.J).toBe('J');
    });
    
    it('should create polynomial functor from diagram', () => {
      const diagram: PolynomialDiagram<string, string, string, string> = {
        kind: 'PolynomialDiagram',
        s: (b) => 'I',
        f: (b) => 'A',
        t: (a) => 'J',
        I: 'I',
        B: 'B',
        A: 'A',
        J: 'J'
      };
      
      const functor = createPolynomialFunctor(diagram);
      
      expect(functor.kind).toBe('PolynomialFunctor');
      expect(functor.diagram).toBe(diagram);
      
      const deltaS = functor.deltaS('test');
      const piF = functor.piF('test');
      const sigmaT = functor.sigmaT('test');
      const composite = functor.composite('test');
      
      expect(deltaS).toHaveLength(1);
      expect(piF).toHaveLength(1);
      expect(sigmaT).toHaveLength(1);
      expect(composite).toHaveLength(1);
      
      expect(deltaS[0].base).toBe('B');
      expect(piF[0].base).toBe('A');
      expect(sigmaT[0].base).toBe('J');
      expect(composite[0].base).toBe('J');
    });
    
    it('should verify polynomial diagram', () => {
      const diagram: PolynomialDiagram<string, string, string, string> = {
        kind: 'PolynomialDiagram',
        s: (b) => 'I',
        f: (b) => 'A',
        t: (a) => 'J',
        I: 'I',
        B: 'B',
        A: 'A',
        J: 'J'
      };
      
      const verification = verifyPolynomialDiagram(diagram);
      
      expect(verification.isValid).toBe(true);
      expect(verification.sourceMap).toBe('I');
      expect(verification.fiberMap).toBe('A');
      expect(verification.targetMap).toBe('J');
    });
    
    it('should verify polynomial functor', () => {
      const diagram: PolynomialDiagram<string, string, string, string> = {
        kind: 'PolynomialDiagram',
        s: (b) => 'I',
        f: (b) => 'A',
        t: (a) => 'J',
        I: 'I',
        B: 'B',
        A: 'A',
        J: 'J'
      };
      
      const functor = createPolynomialFunctor(diagram);
      const verification = verifyPolynomialFunctor(functor);
      
      expect(verification.isValid).toBe(true);
      expect(verification.deltaS).toHaveLength(1);
      expect(verification.piF).toHaveLength(1);
      expect(verification.sigmaT).toHaveLength(1);
      expect(verification.composite).toHaveLength(1);
    });
    
  });
  
  describe('Equation (8): Fundamental formula for polynomial functors', () => {
    
    it('should create Equation (8) from polynomial diagram', () => {
      const diagram: PolynomialDiagram<string, string, string, string> = {
        kind: 'PolynomialDiagram',
        s: (b) => 'I',
        f: (b) => 'A',
        t: (a) => 'J',
        I: 'I',
        B: 'B',
        A: 'A',
        J: 'J'
      };
      
      const equation = createEquation8(diagram);
      
      expect(equation.kind).toBe('Equation8');
      expect(equation.diagram).toBe(diagram);
      
      const leftSide = equation.leftSide('test');
      const rightSide = equation.rightSide('test');
      
      expect(leftSide).toHaveLength(1);
      expect(rightSide).toHaveLength(1);
      expect(leftSide[0].input).toBe('I');
      expect(rightSide[0].output).toBe('J');
    });
    
    it('should verify Equation (8)', () => {
      const diagram: PolynomialDiagram<string, string, string, string> = {
        kind: 'PolynomialDiagram',
        s: (b) => 'I',
        f: (b) => 'A',
        t: (a) => 'J',
        I: 'I',
        B: 'B',
        A: 'A',
        J: 'J'
      };
      
      const equation = createEquation8(diagram);
      const verification = verifyEquation8(equation);
      
      expect(verification.isValid).toBe(true);
      expect(verification.leftSide).toHaveLength(1);
      expect(verification.rightSide).toHaveLength(1);
      expect(verification.equationHolds).toBe(true);
    });
    
  });
  
  describe('Section 1.5: Special case I = J = 1', () => {
    
    it('should create single variable polynomial', () => {
      const f = (b: string) => 'A';
      const polynomial = createSingleVariablePolynomial(f);
      
      expect(polynomial.kind).toBe('SingleVariablePolynomial');
      expect(polynomial.f).toBe(f);
      expect(polynomial.formula).toBe("P(X) = Σ_{a∈A} X^{B_a}");
      
      const evaluate = polynomial.evaluate('test');
      expect(evaluate).toHaveLength(1);
      expect(evaluate[0].argument).toBe('A');
      expect(evaluate[0].power).toHaveLength(3);
    });
    
  });
  
  describe('Section 1.6: Examples', () => {
    
    it('should create identity polynomial', () => {
      const identity = createIdentityPolynomial('I');
      
      expect(identity.kind).toBe('IdentityPolynomial');
      expect(identity.I).toBe('I');
      expect(identity.isIdentity).toBe(true);
      
      const diagram = identity.diagram;
      expect(diagram.kind).toBe('PolynomialDiagram');
      expect(diagram.s('I')).toBe('I');
      expect(diagram.f('I')).toBe('I');
      expect(diagram.t('I')).toBe('I');
    });
    
    it('should create constant polynomial', () => {
      const constant = createConstantPolynomial('I', 'A', 'J');
      
      expect(constant.kind).toBe('ConstantPolynomial');
      expect(constant.I).toBe('I');
      expect(constant.A).toBe('A');
      expect(constant.J).toBe('J');
      expect(constant.isConstant).toBe(true);
      
      const diagram = constant.diagram;
      expect(diagram.kind).toBe('PolynomialDiagram');
      expect(diagram.s(null)).toBe('I');
      expect(diagram.f(null)).toBe('A');
      expect(diagram.t('A')).toBe('J');
    });
    
    it('should verify identity polynomial functor', () => {
      const identity = createIdentityPolynomial('I');
      const functor = createPolynomialFunctor(identity.diagram);
      const verification = verifyPolynomialFunctor(functor);
      
      expect(verification.isValid).toBe(true);
      expect(verification.deltaS).toHaveLength(1);
      expect(verification.piF).toHaveLength(1);
      expect(verification.sigmaT).toHaveLength(1);
      expect(verification.composite).toHaveLength(1);
    });
    
    it('should verify constant polynomial functor', () => {
      const constant = createConstantPolynomial('I', 'A', 'J');
      const functor = createPolynomialFunctor(constant.diagram);
      const verification = verifyPolynomialFunctor(functor);
      
      expect(verification.isValid).toBe(true);
      expect(verification.deltaS).toHaveLength(1);
      expect(verification.piF).toHaveLength(1);
      expect(verification.sigmaT).toHaveLength(1);
      expect(verification.composite).toHaveLength(1);
    });
    
  });
  
  describe('Section 1.7: Span example', () => {
    
    it('should create span polynomial', () => {
      const span = createSpanPolynomial(
        (m) => 'I',
        (m) => 'J',
        'M'
      );
      
      expect(span.kind).toBe('SpanPolynomial');
      expect(span.s('M')).toBe('I');
      expect(span.t('M')).toBe('J');
      
      const diagram = span.diagram;
      expect(diagram.kind).toBe('PolynomialDiagram');
      expect(diagram.s('M')).toBe('I');
      expect(diagram.f('M')).toBe('M');
      expect(diagram.t('M')).toBe('J');
    });
    
    it('should evaluate span polynomial functor', () => {
      const span = createSpanPolynomial(
        (m) => 'I',
        (m) => 'J',
        'M'
      );
      
      const polynomialFunctor = span.polynomialFunctor('test');
      expect(polynomialFunctor).toHaveLength(1);
      expect(polynomialFunctor[0].output).toBe('J');
      expect(polynomialFunctor[0].sum).toHaveLength(2);
    });
    
    it('should verify span polynomial functor', () => {
      const span = createSpanPolynomial(
        (m) => 'I',
        (m) => 'J',
        'M'
      );
      
      const functor = createPolynomialFunctor(span.diagram);
      const verification = verifyPolynomialFunctor(functor);
      
      expect(verification.isValid).toBe(true);
      expect(verification.deltaS).toHaveLength(1);
      expect(verification.piF).toHaveLength(1);
      expect(verification.sigmaT).toHaveLength(1);
      expect(verification.composite).toHaveLength(1);
    });
    
  });
  
  describe('Integration Examples', () => {
    
    it('should run natural numbers polynomial example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleNaturalNumbersPolynomial();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          naturalNumbersPolynomial: true,
          diagramValid: true,
          functorValid: true,
          equationValid: true,
          composite: expect.any(Array),
          leftSide: expect.any(Array),
          rightSide: expect.any(Array)
        })
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should run binary trees polynomial example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleBinaryTreesPolynomial();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          binaryTreesPolynomial: true,
          diagramValid: true,
          functorValid: true,
          equationValid: true,
          composite: expect.any(Array),
          leftSide: expect.any(Array),
          rightSide: expect.any(Array)
        })
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should run identity polynomial example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleIdentityPolynomial();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          identityPolynomial: true,
          isIdentity: true,
          functorValid: true,
          composite: expect.any(Array),
          deltaS: expect.any(Array),
          piF: expect.any(Array),
          sigmaT: expect.any(Array)
        })
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should run constant polynomial example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleConstantPolynomial();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          constantPolynomial: true,
          isConstant: true,
          functorValid: true,
          composite: expect.any(Array),
          deltaS: expect.any(Array),
          piF: expect.any(Array),
          sigmaT: expect.any(Array)
        })
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should run span polynomial example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleSpanPolynomial();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          spanPolynomial: true,
          functorValid: true,
          composite: expect.any(Array),
          polynomialFunctor: expect.any(Array),
          deltaS: expect.any(Array),
          piF: expect.any(Array),
          sigmaT: expect.any(Array)
        })
      );
      
      consoleSpy.mockRestore();
    });
    
  });
  
  describe('Mathematical Properties and Edge Cases', () => {
    
    it('should handle empty polynomial diagrams', () => {
      const diagram: PolynomialDiagram<string, string, string, string> = {
        kind: 'PolynomialDiagram',
        s: (b) => '',
        f: (b) => '',
        t: (a) => '',
        I: '',
        B: '',
        A: '',
        J: ''
      };
      
      const verification = verifyPolynomialDiagram(diagram);
      expect(verification.isValid).toBe(true);
      
      const functor = createPolynomialFunctor(diagram);
      const functorVerification = verifyPolynomialFunctor(functor);
      expect(functorVerification.isValid).toBe(true);
    });
    
    it('should handle singleton polynomial diagrams', () => {
      const diagram: PolynomialDiagram<string, string, string, string> = {
        kind: 'PolynomialDiagram',
        s: (b) => 'single',
        f: (b) => 'single',
        t: (a) => 'single',
        I: 'single',
        B: 'single',
        A: 'single',
        J: 'single'
      };
      
      const verification = verifyPolynomialDiagram(diagram);
      expect(verification.isValid).toBe(true);
      
      const functor = createPolynomialFunctor(diagram);
      const functorVerification = verifyPolynomialFunctor(functor);
      expect(functorVerification.isValid).toBe(true);
    });
    
    it('should verify mathematical coherence of polynomial diagrams', () => {
      // Test that polynomial diagrams preserve the fundamental structure
      const diagram: PolynomialDiagram<string, string, string, string> = {
        kind: 'PolynomialDiagram',
        s: (b) => 'I',
        f: (b) => 'A',
        t: (a) => 'J',
        I: 'I',
        B: 'B',
        A: 'A',
        J: 'J'
      };
      
      const verification = verifyPolynomialDiagram(diagram);
      expect(verification.isValid).toBe(true);
      
      // The diagram should preserve the fundamental structure
      expect(diagram.s('B')).toBe('I');
      expect(diagram.f('B')).toBe('A');
      expect(diagram.t('A')).toBe('J');
    });
    
    it('should verify mathematical coherence of polynomial functors', () => {
      // Test that polynomial functors preserve the fundamental structure
      const diagram: PolynomialDiagram<string, string, string, string> = {
        kind: 'PolynomialDiagram',
        s: (b) => 'I',
        f: (b) => 'A',
        t: (a) => 'J',
        I: 'I',
        B: 'B',
        A: 'A',
        J: 'J'
      };
      
      const functor = createPolynomialFunctor(diagram);
      const verification = verifyPolynomialFunctor(functor);
      expect(verification.isValid).toBe(true);
      
      // The functor should preserve the fundamental structure
      expect(verification.deltaS[0].base).toBe('B');
      expect(verification.piF[0].base).toBe('A');
      expect(verification.sigmaT[0].base).toBe('J');
      expect(verification.composite[0].base).toBe('J');
    });
    
    it('should verify mathematical coherence of Equation (8)', () => {
      // Test that Equation (8) preserves the fundamental structure
      const diagram: PolynomialDiagram<string, string, string, string> = {
        kind: 'PolynomialDiagram',
        s: (b) => 'I',
        f: (b) => 'A',
        t: (a) => 'J',
        I: 'I',
        B: 'B',
        A: 'A',
        J: 'J'
      };
      
      const equation = createEquation8(diagram);
      const verification = verifyEquation8(equation);
      expect(verification.isValid).toBe(true);
      expect(verification.equationHolds).toBe(true);
      
      // The equation should preserve the fundamental structure
      expect(verification.leftSide[0].input).toBe('I');
      expect(verification.rightSide[0].output).toBe('J');
    });
    
  });
  
  describe('Advanced Mathematical Properties', () => {
    
    it('should verify identity polynomial preserves identity structure', () => {
      const identity = createIdentityPolynomial('I');
      
      // The identity polynomial should preserve the identity structure
      expect(identity.isIdentity).toBe(true);
      expect(identity.diagram.s('I')).toBe('I');
      expect(identity.diagram.f('I')).toBe('I');
      expect(identity.diagram.t('I')).toBe('I');
      
      const functor = createPolynomialFunctor(identity.diagram);
      const verification = verifyPolynomialFunctor(functor);
      expect(verification.isValid).toBe(true);
    });
    
    it('should verify constant polynomial preserves constant structure', () => {
      const constant = createConstantPolynomial('I', 'A', 'J');
      
      // The constant polynomial should preserve the constant structure
      expect(constant.isConstant).toBe(true);
      expect(constant.diagram.s(null)).toBe('I');
      expect(constant.diagram.f(null)).toBe('A');
      expect(constant.diagram.t('A')).toBe('J');
      
      const functor = createPolynomialFunctor(constant.diagram);
      const verification = verifyPolynomialFunctor(functor);
      expect(verification.isValid).toBe(true);
    });
    
    it('should verify span polynomial preserves span structure', () => {
      const span = createSpanPolynomial(
        (m) => 'I',
        (m) => 'J',
        'M'
      );
      
      // The span polynomial should preserve the span structure
      expect(span.s('M')).toBe('I');
      expect(span.t('M')).toBe('J');
      expect(span.diagram.f('M')).toBe('M');
      
      const functor = createPolynomialFunctor(span.diagram);
      const verification = verifyPolynomialFunctor(functor);
      expect(verification.isValid).toBe(true);
    });
    
    it('should verify single variable polynomial preserves single variable structure', () => {
      const f = (b: string) => 'A';
      const polynomial = createSingleVariablePolynomial(f);
      
      // The single variable polynomial should preserve the single variable structure
      expect(polynomial.f).toBe(f);
      expect(polynomial.formula).toBe("P(X) = Σ_{a∈A} X^{B_a}");
      
      const evaluate = polynomial.evaluate('test');
      expect(evaluate).toHaveLength(1);
      expect(evaluate[0].argument).toBe('A');
    });
    
  });
  
});
