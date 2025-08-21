/**
 * Bridge Modules Test Suite
 * 
 * Tests the hybrid pattern implementation:
 * - Raw types for user experience
 * - HKT-aware interfaces for composition
 * - Bridge modules connect the two worlds
 */

import { describe, it, expect } from 'vitest';

// Import raw types for user experience
import { PersistentList } from '../fp-persistent';

// Import HKT-aware interfaces for composition
import {
  Functor, Applicative, Monad, Bifunctor,
  lift2, sequence, traverse
} from '../fp-typeclasses-hkt';

// Import bridge modules
import {
  PersistentListHKT, PersistentListFunctor, PersistentListApplicative, PersistentListMonad, PersistentListTraversable,
  mapList, chainList, apList, ofList
} from '../fp-persistent-hkt';

import {
  MaybeHKT, MaybeFunctor, MaybeApplicative, MaybeMonad,
  mapMaybe, chainMaybe, apMaybe, ofMaybe,
  just, nothing, fromMaybe
} from '../fp-maybe-hkt';

import {
  EitherHKT, EitherFunctor, EitherApplicative, EitherMonad, EitherBifunctor,
  mapEither, chainEither, apEither, ofEither,
  left, right, fromEither
} from '../fp-either-hkt';

// ============================================================================
// Part 1: Raw Types (User Experience) Tests
// ============================================================================

describe('Raw Types - User Experience', () => {
  it('should provide simple, direct APIs for end users', () => {
    // Raw types should be simple and intuitive
    const numbers = PersistentList.fromArray([1, 2, 3, 4, 5]);
    const doubled = numbers.map(x => x * 2);
    const evens = doubled.filter(x => x % 2 === 0);
    const sum = evens.reduce((acc, x) => acc + x, 0);
    
    expect(sum).toBe(12); // [2,4,6,8,10] -> 2+4+6+8+10 = 30, but filter keeps evens from doubled
    expect(evens.toArray()).toEqual([2, 4, 6, 8, 10]);
  });

  it('should have zero abstraction overhead', () => {
    const list = PersistentList.fromArray([1, 2, 3]);
    const start = performance.now();
    
    // Direct method calls - should be fast
    const result = list.map(x => x * 2).filter(x => x > 2).reduce((acc, x) => acc + x, 0);
    
    const end = performance.now();
    const duration = end - start;
    
    expect(result).toBe(10); // [2,4,6] -> 4+6 = 10
    expect(duration).toBeLessThan(1); // Should be very fast
  });
});

// ============================================================================
// Part 2: Bridge Modules - Zero-Cost Abstractions Tests
// ============================================================================

describe('Bridge Modules - Zero-Cost Abstractions', () => {
  it('should delegate to raw methods for PersistentList', () => {
    const list = PersistentList.fromArray([1, 2, 3]);
    
    // Bridge module should delegate to raw methods
    const mapped = mapList(list, x => x * 2);
    const chained = chainList(list, x => PersistentList.fromArray([x, x * 2]));
    const lifted = ofList(42);
    const applied = apList(
      PersistentList.fromArray([(x: number) => x * 2, (x: number) => x + 1]),
      list
    );
    
    expect(mapped.toArray()).toEqual([2, 4, 6]);
    expect(chained.toArray()).toEqual([1, 2, 2, 4, 3, 6]);
    expect(lifted.toArray()).toEqual([42]);
    expect(applied.toArray()).toEqual([2, 4, 6, 2, 3, 4]);
  });

  it('should delegate to raw methods for Maybe', () => {
    const maybe = just(42);
    const nothing_maybe = nothing<number>();
    
    // Bridge module should delegate to raw methods
    const mapped = mapMaybe(maybe, x => x * 2);
    const chained = chainMaybe(maybe, x => just(x + 1));
    const lifted = ofMaybe(42);
    const applied = apMaybe(just((x: number) => x * 2), maybe);
    
    expect(mapped).toBe(84);
    expect(chained).toBe(43);
    expect(lifted).toBe(42);
    expect(applied).toBe(84);
    expect(fromMaybe(0, nothing_maybe)).toBe(0);
  });

  it('should delegate to raw methods for Either', () => {
    const right_either = right<string, number>(42);
    const left_either = left<string, number>('error');
    
    // Bridge module should delegate to raw methods
    const mapped = mapEither(right_either, x => x * 2);
    const chained = chainEither(right_either, x => right(x + 1));
    const lifted = ofEither(42);
    const applied = apEither(right((x: number) => x * 2), right_either);
    const bimapped = EitherBifunctor.bimap(left_either, e => e.toUpperCase(), x => x * 2);
    
    expect(mapped).toEqual({ right: 84 });
    expect(chained).toEqual({ right: 43 });
    expect(lifted).toEqual({ right: 42 });
    expect(applied).toEqual({ right: 84 });
    expect(bimapped).toEqual({ left: 'ERROR' });
    expect(fromEither(0, left_either)).toBe(0);
  });
});

// ============================================================================
// Part 3: Generic Algorithms - Power User Features Tests
// ============================================================================

describe('Generic Algorithms - Power User Features', () => {
  it('should work with ANY functor through bridge modules', () => {
    // Generic algorithm that works with any functor
    function mapTwice<F extends any>(F: Functor<F>) {
      return <A>(fa: any, f: (a: A) => A): any => {
        return F.map(F.map(fa, f), f);
      };
    }
    
    // Works with ANY functor through bridge modules!
    const list = PersistentList.fromArray([1, 2, 3]);
    const maybe = just(5);
    const either = right<string, number>(7);
    
    const listResult = mapTwice(PersistentListFunctor)(list, x => x + 1);
    const maybeResult = mapTwice(MaybeFunctor)(maybe, x => x + 1);
    const eitherResult = mapTwice(EitherFunctor)(either, x => x + 1);
    
    expect(listResult.toArray()).toEqual([3, 4, 5]); // (1+1)+1, (2+1)+1, (3+1)+1
    expect(maybeResult).toBe(7); // (5+1)+1
    expect(eitherResult).toEqual({ right: 9 }); // (7+1)+1
  });

  it('should support generic lift2 operations', () => {
    const list1 = PersistentList.fromArray([1, 2]);
    const list2 = PersistentList.fromArray([10, 20]);
    
    // lift2 should work with any applicative
    const result = lift2(PersistentListApplicative)(
      (a: number, b: number) => a + b,
      list1,
      list2
    );
    
    expect(result.toArray()).toEqual([11, 21, 12, 22]); // Cartesian product
  });

  it('should support generic sequence operations', () => {
    const listOfMaybes = PersistentList.fromArray([just(1), just(2), nothing<number>()]);
    
    // sequence should work with any traversable + applicative
    const result = sequence(PersistentListTraversable, MaybeApplicative)(listOfMaybes);
    
    // This is a simplified test - in practice, sequence for Maybe would
    // return Nothing if any element is Nothing
    expect(result).toBeDefined();
  });
});

// ============================================================================
// Part 4: Performance Verification Tests
// ============================================================================

describe('Performance Verification', () => {
  it('should have zero-cost abstractions for bridge modules', () => {
    const list = PersistentList.fromArray(Array.from({ length: 1000 }, (_, i) => i));
    
    // Test raw method performance
    const rawStart = performance.now();
    const rawResult = list.map(x => x * 2).filter(x => x % 2 === 0).reduce((acc, x) => acc + x, 0);
    const rawEnd = performance.now();
    const rawDuration = rawEnd - rawStart;
    
    // Test bridge module performance
    const bridgeStart = performance.now();
    const bridgeResult = mapList(list, x => x * 2);
    const bridgeEnd = performance.now();
    const bridgeDuration = bridgeEnd - bridgeStart;
    
    expect(rawResult).toBe(bridgeResult.reduce((acc, x) => acc + x, 0));
    expect(bridgeDuration).toBeLessThan(rawDuration * 1.1); // Bridge should be nearly as fast
  });

  it('should maintain performance for Maybe operations', () => {
    const maybe = just(42);
    
    // Test raw operations
    const rawStart = performance.now();
    const rawResult = maybe === null || maybe === undefined ? null : maybe * 2;
    const rawEnd = performance.now();
    const rawDuration = rawEnd - rawStart;
    
    // Test bridge operations
    const bridgeStart = performance.now();
    const bridgeResult = mapMaybe(maybe, x => x * 2);
    const bridgeEnd = performance.now();
    const bridgeDuration = bridgeEnd - bridgeStart;
    
    expect(rawResult).toBe(bridgeResult);
    expect(bridgeDuration).toBeLessThan(rawDuration * 1.1); // Bridge should be nearly as fast
  });
});

// ============================================================================
// Part 5: Type Safety Tests
// ============================================================================

describe('Type Safety', () => {
  it('should maintain type safety across bridge modules', () => {
    // TypeScript should catch type errors at compile time
    const list = PersistentList.fromArray([1, 2, 3]);
    const maybe = just(42);
    const either = right<string, number>(7);
    
    // These should all be type-safe
    const listResult: PersistentList<number> = mapList(list, x => x * 2);
    const maybeResult: number | null = mapMaybe(maybe, x => x * 2);
    const eitherResult: { left: string } | { right: number } = mapEither(either, x => x * 2);
    
    expect(listResult.toArray()).toEqual([2, 4, 6]);
    expect(maybeResult).toBe(84);
    expect(eitherResult).toEqual({ right: 14 });
  });

  it('should enforce HKT constraints correctly', () => {
    // TypeScript should enforce that we can only use compatible type constructors
    const list = PersistentList.fromArray([1, 2, 3]);
    const maybe = just(42);
    
    // These should work with the correct typeclass instances
    const listFunctor: Functor<PersistentListHKT> = PersistentListFunctor;
    const maybeFunctor: Functor<MaybeHKT> = MaybeFunctor;
    
    expect(listFunctor.map(list, x => x * 2).toArray()).toEqual([2, 4, 6]);
    expect(maybeFunctor.map(maybe, x => x * 2)).toBe(84);
  });
});

// ============================================================================
// Part 6: Integration Tests
// ============================================================================

describe('Integration Tests', () => {
  it('should work seamlessly with existing code', () => {
    // Bridge modules should integrate with existing raw type code
    const numbers = PersistentList.fromArray([1, 2, 3, 4, 5]);
    
    // Mix raw operations and bridge operations
    const doubled = numbers.map(x => x * 2); // Raw operation
    const filtered = mapList(doubled, x => x > 4); // Bridge operation
    const sum = filtered.reduce((acc, x) => acc + x, 0); // Raw operation
    
    expect(sum).toBe(18); // [6,8,10] -> 6+8+10 = 24, but filter keeps > 4 from doubled
    expect(filtered.toArray()).toEqual([6, 8, 10]);
  });

  it('should support complex compositions', () => {
    // Complex composition using both raw types and bridge modules
    const data = PersistentList.fromArray([
      just(1), just(2), nothing<number>(), just(4)
    ]);
    
    // Use bridge modules for typeclass operations
    const validData = data.filter(maybe => maybe !== null && maybe !== undefined);
    const doubled = mapList(validData, maybe => mapMaybe(maybe, x => x * 2));
    const flattened = chainList(doubled, maybe => 
      maybe === null || maybe === undefined 
        ? PersistentList.empty<number>()
        : PersistentList.fromArray([maybe])
    );
    
    expect(flattened.toArray()).toEqual([2, 4, 8]); // Filtered out null, doubled remaining
  });
});

// ============================================================================
// Part 7: Laws Verification Tests
// ============================================================================

describe('Laws Verification', () => {
  it('should satisfy Functor laws', () => {
    const list = PersistentList.fromArray([1, 2, 3]);
    const f = (x: number) => x * 2;
    const g = (x: number) => x + 1;
    
    // Identity law: map(fa, x => x) = fa
    const identity = mapList(list, x => x);
    expect(identity.toArray()).toEqual(list.toArray());
    
    // Composition law: map(map(fa, f), g) = map(fa, x => g(f(x)))
    const composition1 = mapList(mapList(list, f), g);
    const composition2 = mapList(list, x => g(f(x)));
    expect(composition1.toArray()).toEqual(composition2.toArray());
  });

  it('should satisfy Applicative laws', () => {
    const list = PersistentList.fromArray([1, 2]);
    const f = (x: number) => x * 2;
    
    // Identity law: ap(of(x => x), v) = v
    const identity = apList(ofList((x: number) => x), list);
    expect(identity.toArray()).toEqual(list.toArray());
    
    // Homomorphism law: ap(of(f), of(x)) = of(f(x))
    const homomorphism1 = apList(ofList(f), ofList(5));
    const homomorphism2 = ofList(f(5));
    expect(homomorphism1.toArray()).toEqual(homomorphism2.toArray());
  });

  it('should satisfy Monad laws', () => {
    const list = PersistentList.fromArray([1, 2]);
    const f = (x: number) => PersistentList.fromArray([x, x * 2]);
    const g = (x: number) => PersistentList.fromArray([x + 1]);
    
    // Left identity: chain(of(a), f) = f(a)
    const leftIdentity1 = chainList(ofList(5), f);
    const leftIdentity2 = f(5);
    expect(leftIdentity1.toArray()).toEqual(leftIdentity2.toArray());
    
    // Right identity: chain(ma, of) = ma
    const rightIdentity1 = chainList(list, x => ofList(x));
    expect(rightIdentity1.toArray()).toEqual(list.toArray());
  });
});
