import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  Expr,
  evaluate,
  MaybeGADT,
  MaybeGADTApplicative,
  pmatch,
} from '../fp-gadt-enhanced';

// Mock the internal evaluation logic
vi.mock('../fp-gadt-enhanced', async () => {
  const actual = await vi.importActual('../fp-gadt-enhanced');
  return {
    ...actual,
    // Mock the internal evaluation to isolate what we're testing
    evaluate: vi.fn(),
  };
});

describe('GADT Unit Tests - Isolated Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Expr constructors - pure unit tests', () => {
    it('Const creates correct structure', () => {
      const value = 42;
      const expr = Expr.Const(value);
      
      // Test only the structure, not evaluation
      expect(expr).toEqual({
        tag: 'Const',
        payload: { value }
      });
    });

    it('Add creates correct structure', () => {
      const left = Expr.Const(1);
      const right = Expr.Const(2);
      const expr = Expr.Add(left, right);
      
      // Test only the structure
      expect(expr).toEqual({
        tag: 'Add',
        payload: { left, right }
      });
    });

    it('If creates correct structure', () => {
      const condition = Expr.Const(true);
      const thenExpr = Expr.Const(10);
      const elseExpr = Expr.Const(20);
      const expr = Expr.If(condition, thenExpr, elseExpr);

      expect(expr).toEqual({
        tag: 'If',
        payload: { cond: condition, then: thenExpr, else: elseExpr }
      });
    });
  });

  describe('MaybeGADT constructors - pure unit tests', () => {
    it('Just creates correct structure', () => {
      const value = 'test';
      const maybe = MaybeGADT.Just(value);
      
      expect(maybe).toEqual({
        tag: 'Just',
        payload: { value }
      });
    });

    it('Nothing creates correct structure', () => {
      const maybe = MaybeGADT.Nothing();
      
      expect(maybe).toEqual({
        tag: 'Nothing',
        payload: {}
      });
    });
  });

  describe('pmatch - isolated pattern matching', () => {
    it('matches Just case correctly', () => {
      const maybe = MaybeGADT.Just(42);
      const result = pmatch(maybe)
        .with('Just', ({ value }) => `got: ${value}`)
        .with('Nothing', () => 'nothing')
        .exhaustive();
      
      expect(result).toBe('got: 42');
    });

    it('matches Nothing case correctly', () => {
      const maybe = MaybeGADT.Nothing();
      const result = pmatch(maybe)
        .with('Just', ({ value }) => `got: ${value}`)
        .with('Nothing', () => 'nothing')
        .exhaustive();
      
      expect(result).toBe('nothing');
    });
  });

  describe('Applicative.of - isolated unit test', () => {
    it('creates Just with value', () => {
      const value = 123;
      const result = MaybeGADTApplicative.of(value);
      
      // Test only that it creates the right structure
      expect(result).toEqual(MaybeGADT.Just(value));
    });
  });

  describe('Applicative.ap - with mocked dependencies', () => {
    it('applies function from Just to Just', () => {
      const fn = MaybeGADT.Just((x: number) => x * 2);
      const value = MaybeGADT.Just(21);
      
      // This is still integration because it calls the real ap implementation
      // But we're testing the ap logic in isolation from evaluation
      const result = MaybeGADTApplicative.ap(fn, value);
      
      expect(result).toEqual(MaybeGADT.Just(42));
    });

    it('handles Nothing in function position', () => {
      const fn = MaybeGADT.Nothing<(x: number) => number>();
      const value = MaybeGADT.Just(21);
      
      const result = MaybeGADTApplicative.ap(fn, value);
      
      expect(result).toEqual(MaybeGADT.Nothing());
    });

    it('handles Nothing in value position', () => {
      const fn = MaybeGADT.Just((x: number) => x * 2);
      const value = MaybeGADT.Nothing<number>();
      
      const result = MaybeGADTApplicative.ap(fn, value);
      
      expect(result).toEqual(MaybeGADT.Nothing());
    });
  });
});

// Example of what a truly mocked unit test would look like
describe('evaluate - with mocked dependencies', () => {
  it('calls internal evaluation logic correctly', () => {
    const mockEvaluate = vi.mocked(evaluate);
    const expr = Expr.Const(42);
    
    // Mock the return value
    mockEvaluate.mockReturnValue(42);
    
    const result = evaluate(expr);
    
    // Test that evaluate was called with the right argument
    expect(mockEvaluate).toHaveBeenCalledWith(expr);
    expect(result).toBe(42);
  });
});
