import { describe, it, expect } from 'vitest';
import { MaybeGADT, EitherGADT, Result } from '../fp-gadt-enhanced';
import { pmatch } from '../fp-gadt-enhanced';

describe('Simple Working Tests', () => {
  describe('GADT Constructors', () => {
    it('creates MaybeGADT instances', () => {
      const just = MaybeGADT.Just(42);
      const nothing = MaybeGADT.Nothing();
      
      expect(just.tag).toBe('Just');
      expect((just.payload as any).value).toBe(42);
      expect(nothing.tag).toBe('Nothing');
    });

    it('creates EitherGADT instances', () => {
      const left = EitherGADT.Left(42);
      const right = EitherGADT.Right('hello');
      
      expect(left.tag).toBe('Left');
      expect((left.payload as any).value).toBe(42);
      expect(right.tag).toBe('Right');
      expect((right.payload as any).value).toBe('hello');
    });

    it('creates Result instances', () => {
      const ok = Result.Ok(42);
      const err = Result.Err('error');
      
      expect(ok.tag).toBe('Ok');
      expect((ok.payload as any).value).toBe(42);
      expect(err.tag).toBe('Err');
      expect((err.payload as any).error).toBe('error');
    });
  });

  describe('pmatch function', () => {
    it('matches MaybeGADT cases', () => {
      const just = MaybeGADT.Just(42);
      const nothing = MaybeGADT.Nothing();
      
      const justResult = pmatch(just)
        .with('Just', (payload: any) => payload.value * 2)
        .with('Nothing', () => 0)
        .exhaustive();
      
      const nothingResult = pmatch(nothing)
        .with('Just', (payload: any) => payload.value * 2)
        .with('Nothing', () => 0)
        .exhaustive();
      
      expect(justResult).toBe(84);
      expect(nothingResult).toBe(0);
    });

    it('matches EitherGADT cases', () => {
      const left = EitherGADT.Left(42);
      const right = EitherGADT.Right('hello');
      
      const leftResult = pmatch(left)
        .with('Left', (payload: any) => payload.value * 2)
        .with('Right', (payload: any) => payload.value.length)
        .exhaustive();
      
      const rightResult = pmatch(right)
        .with('Left', (payload: any) => payload.value * 2)
        .with('Right', (payload: any) => payload.value.length)
        .exhaustive();
      
      expect(leftResult).toBe(84);
      expect(rightResult).toBe(5);
    });

    it('matches Result cases', () => {
      const ok = Result.Ok(42);
      const err = Result.Err('error');
      
      const okResult = pmatch(ok)
        .with('Ok', (payload: any) => payload.value * 2)
        .with('Err', (payload: any) => 0)
        .exhaustive();
      
      const errResult = pmatch(err)
        .with('Ok', (payload: any) => payload.value * 2)
        .with('Err', (payload: any) => 0)
        .exhaustive();
      
      expect(okResult).toBe(84);
      expect(errResult).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('handles nested GADTs', () => {
      const nestedMaybe = MaybeGADT.Just(MaybeGADT.Just(42));
      
      const result = pmatch(nestedMaybe)
        .with('Just', (payload: any) => pmatch(payload.value)
          .with('Just', (innerPayload: any) => innerPayload.value * 2)
          .with('Nothing', () => 0)
          .exhaustive())
        .with('Nothing', () => 0)
        .exhaustive();
      
      expect(result).toBe(84);
    });

    it('handles complex nested structures', () => {
      const complex = EitherGADT.Left(MaybeGADT.Just(Result.Ok(42)));
      
      const result = pmatch(complex)
        .with('Left', (payload: any) => pmatch(payload.value)
          .with('Just', (maybePayload: any) => pmatch(maybePayload.value)
            .with('Ok', (resultPayload: any) => resultPayload.value * 2)
            .with('Err', () => 0)
            .exhaustive())
          .with('Nothing', () => 0)
          .exhaustive())
        .with('Right', () => 0)
        .exhaustive();
      
      expect(result).toBe(84);
    });
  });

  describe('Integration scenarios', () => {
    it('simulates validation pipeline', () => {
      const validateAge = (age: number): Result<number, string> => {
        if (age < 0) return Result.Err('Age cannot be negative');
        if (age > 150) return Result.Err('Age seems unrealistic');
        return Result.Ok(age);
      };
      
      const validateName = (name: string): Result<string, string> => {
        if (name.length === 0) return Result.Err('Name cannot be empty');
        if (name.length > 100) return Result.Err('Name too long');
        return Result.Ok(name);
      };
      
      const ageResult = validateAge(25);
      const nameResult = validateName('John');
      
      const ageValue = pmatch(ageResult)
        .with('Ok', (payload: any) => payload.value)
        .with('Err', () => 0)
        .exhaustive();
      
      const nameValue = pmatch(nameResult)
        .with('Ok', (payload: any) => payload.value)
        .with('Err', () => 'Unknown')
        .exhaustive();
      
      expect(ageValue).toBe(25);
      expect(nameValue).toBe('John');
    });

    it('simulates configuration parsing', () => {
      const parseConfig = (input: string): EitherGADT<string, { port: number; host: string }> => {
        try {
          const config = JSON.parse(input);
          if (typeof config.port !== 'number' || typeof config.host !== 'string') {
            return EitherGADT.Left('Invalid config structure');
          }
          return EitherGADT.Right({ port: config.port, host: config.host });
        } catch {
          return EitherGADT.Left('Invalid JSON');
        }
      };
      
      const validConfig = parseConfig('{"port": 3000, "host": "localhost"}');
      const invalidConfig = parseConfig('invalid json');
      
      const validResult = pmatch(validConfig)
        .with('Left', (payload: any) => `Error: ${payload.value}`)
        .with('Right', (payload: any) => `Config: ${payload.value.host}:${payload.value.port}`)
        .exhaustive();
      
      const invalidResult = pmatch(invalidConfig)
        .with('Left', (payload: any) => `Error: ${payload.value}`)
        .with('Right', (payload: any) => `Config: ${payload.value.host}:${payload.value.port}`)
        .exhaustive();
      
      expect(validResult).toBe('Config: localhost:3000');
      expect(invalidResult).toBe('Error: Invalid JSON');
    });
  });
});
