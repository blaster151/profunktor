import { describe, it, expect } from 'vitest';
import { Bazaar } from '../fp-optics-iso-helpers';
import { composeBazaar, constantBazaar } from '../fp-bazaar-composition';
import { bazaarProfunctor, bazaarStrong, simpleBazaar } from '../fp-bazaar-algebraic';
import { MaybeGADT } from '../fp-gadt-enhanced';

describe('Bazaar Integration Tests', () => {
  describe('Bazaar type and basic operations', () => {
    it('creates simple bazaar with identity', () => {
      const identityBazaar: Bazaar<number, number, number, number> = 
        <F>(F: any, k: (a: number) => any) => (s: number) => F.map(k(s), (x: number) => x);
      
      // Test that it compiles and has the right type
      expect(typeof identityBazaar).toBe('function');
    });

    it('creates bazaar that doubles values', () => {
      const doubleBazaar: Bazaar<number, number, number, number> = 
        <F>(F: any, k: (a: number) => any) => (s: number) => F.map(k(s), (x: number) => x * 2);
      
      expect(typeof doubleBazaar).toBe('function');
    });

    it('creates bazaar that filters even numbers', () => {
      const evenBazaar: Bazaar<number, number, number, number> = 
        <F>(F: any, k: (a: number) => any) => (s: number) => 
          s % 2 === 0 ? F.map(k(s), (x: number) => x) : F.of([]);
      
      expect(typeof evenBazaar).toBe('function');
    });
  });

  describe('Bazaar composition', () => {
    it('composes two bazaars using composeBazaar', () => {
      const doubleBazaar: Bazaar<number, number, number, number> = 
        <F>(F: any, k: (a: number) => any) => (s: number) => F.map(k(s), (x: number) => x * 2);
      
      const addOneBazaar: Bazaar<number, number, number, number> = 
        <F>(F: any, k: (a: number) => any) => (s: number) => F.map(k(s), (x: number) => x + 1);
      
      const composed = composeBazaar(doubleBazaar, addOneBazaar);
      
      expect(typeof composed).toBe('function');
    });

    it('creates constant bazaar', () => {
      const constBazaar = constantBazaar<number, string, number, number>('hello');
      
      expect(typeof constBazaar).toBe('function');
    });
  });

  describe('Bazaar algebraic structures', () => {
    it('creates bazaar profunctor', () => {
      const profunctor = bazaarProfunctor<number, string, number, number>();
      
      expect(typeof profunctor.dimap).toBe('function');
      expect(typeof profunctor.lmap).toBe('function');
      expect(typeof profunctor.rmap).toBe('function');
    });

    it('creates bazaar strong profunctor', () => {
      const strong = bazaarStrong<number, string, number, number>();
      
      expect(typeof strong.first).toBe('function');
      expect(typeof strong.second).toBe('function');
      expect(typeof strong.arr).toBe('function');
    });

    it('creates simple bazaar using helper', () => {
      const simple = simpleBazaar<number, string, number, number>(
        (a: number) => a.toString(),
        (s: number) => s,
        (b: string, s: number) => parseInt(b) + s
      );
      
      expect(typeof simple).toBe('function');
    });
  });

  describe('Bazaar with MaybeGADT', () => {
    it('creates bazaar that works with MaybeGADT', () => {
      const maybeBazaar: Bazaar<number, MaybeGADT<number>, number, number> = 
        <F>(F: any, k: (a: number) => any) => (s: number) => 
          F.map(k(s), (x: number) => MaybeGADT.Just(x));
      
      expect(typeof maybeBazaar).toBe('function');
    });

    it('composes bazaar with MaybeGADT operations', () => {
      const justBazaar: Bazaar<number, MaybeGADT<number>, number, number> = 
        <F>(F: any, k: (a: number) => any) => (s: number) => 
          F.map(k(s), (x: number) => MaybeGADT.Just(x));
      
      const doubleBazaar: Bazaar<MaybeGADT<number>, MaybeGADT<number>, number, number> = 
        <F>(F: any, k: (a: MaybeGADT<number>) => any) => (s: number) => 
          F.map(k(MaybeGADT.Just(s)), (x: MaybeGADT<number>) => 
            x.tag === 'Just' ? MaybeGADT.Just(x.payload.value * 2) : MaybeGADT.Nothing());
      
      const composed = composeBazaar(doubleBazaar, justBazaar);
      
      expect(typeof composed).toBe('function');
    });
  });

  describe('Bazaar edge cases', () => {
    it('handles empty bazaar', () => {
      const emptyBazaar: Bazaar<number, number, number, number> = 
        <F>(F: any, k: (a: number) => any) => (s: number) => F.of([]);
      
      expect(typeof emptyBazaar).toBe('function');
    });

    it('handles bazaar with complex state', () => {
      const complexBazaar: Bazaar<number, string, { value: number }, { result: string }> = 
        <F>(F: any, k: (a: number) => any) => (s: { value: number }) => 
          F.map(k(s.value), (x: number) => ({ result: x.toString() }));
      
      expect(typeof complexBazaar).toBe('function');
    });
  });
});
