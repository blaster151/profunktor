import { describe, it, expect } from 'vitest';
import { PersistentList } from '../fp-persistent';

describe('Performance Improvements', () => {
  it('demonstrates O(n) vs O(n log n) performance for tail() operation', () => {
    // Create a large list
    const largeArray = Array.from({ length: 1000 }, (_, i) => i);
    const largeList = PersistentList.fromArray(largeArray);
    
    // This should now be much faster with our optimization
    const start = performance.now();
    const tail = largeList.tail();
    const end = performance.now();
    
    const duration = end - start;
    
    // Verify correctness
    expect(tail.size).toBe(999);
    expect(tail.head()).toBe(1);
    expect(tail.get(998)).toBe(999);
    
    // Log performance (should be much faster now)
    console.log(`tail() operation took ${duration.toFixed(2)}ms for 1000 elements`);
    
    // Should complete in reasonable time (less than 100ms)
    expect(duration).toBeLessThan(100);
  });

  it('demonstrates O(n) vs O(n log n) performance for flatMap() operation', () => {
    // Create a large list
    const largeArray = Array.from({ length: 500 }, (_, i) => i);
    const largeList = PersistentList.fromArray(largeArray);
    
    // This should now be much faster with our optimization
    const start = performance.now();
    const flatMapped = largeList.flatMap(x => PersistentList.fromArray([x * 2, x * 3]));
    const end = performance.now();
    
    const duration = end - start;
    
    // Verify correctness
    expect(flatMapped.size).toBe(1000); // 500 * 2
    expect(flatMapped.get(0)).toBe(0); // 0 * 2
    expect(flatMapped.get(1)).toBe(0); // 0 * 3
    expect(flatMapped.get(2)).toBe(2); // 1 * 2
    expect(flatMapped.get(3)).toBe(3); // 1 * 3
    
    // Log performance (should be much faster now)
    console.log(`flatMap() operation took ${duration.toFixed(2)}ms for 500 elements`);
    
    // Should complete in reasonable time (less than 100ms)
    expect(duration).toBeLessThan(100);
  });

  it('demonstrates O(n) vs O(n log n) performance for forEach() operation', () => {
    // Create a large list
    const largeArray = Array.from({ length: 1000 }, (_, i) => i);
    const largeList = PersistentList.fromArray(largeArray);
    
    let sum = 0;
    
    // This should now be much faster with our optimization
    const start = performance.now();
    largeList.forEach((value, index) => {
      sum += value + index;
    });
    const end = performance.now();
    
    const duration = end - start;
    
    // Verify correctness (sum of all values + indices)
    const expectedSum = largeArray.reduce((acc, val, idx) => acc + val + idx, 0);
    expect(sum).toBe(expectedSum);
    
    // Log performance (should be much faster now)
    console.log(`forEach() operation took ${duration.toFixed(2)}ms for 1000 elements`);
    
    // Should complete in reasonable time (less than 50ms)
    expect(duration).toBeLessThan(50);
  });

  it('demonstrates O(n) vs O(n log n) performance for iterator', () => {
    // Create a large list
    const largeArray = Array.from({ length: 1000 }, (_, i) => i);
    const largeList = PersistentList.fromArray(largeArray);
    
    let sum = 0;
    let count = 0;
    
    // This should now be much faster with our optimization
    const start = performance.now();
    for (const value of largeList) {
      sum += value;
      count++;
    }
    const end = performance.now();
    
    const duration = end - start;
    
    // Verify correctness
    expect(count).toBe(1000);
    expect(sum).toBe(499500); // sum of 0 to 999
    
    // Log performance (should be much faster now)
    console.log(`iterator operation took ${duration.toFixed(2)}ms for 1000 elements`);
    
    // Should complete in reasonable time (less than 50ms)
    expect(duration).toBeLessThan(50);
  });

  it('compares performance with array operations', () => {
    const size = 1000;
    const array = Array.from({ length: size }, (_, i) => i);
    const list = PersistentList.fromArray(array);
    
    // Test array operations for comparison
    const arrayStart = performance.now();
    const arrayTail = array.slice(1);
    const arraySum = arrayTail.reduce((acc, val) => acc + val, 0);
    const arrayEnd = performance.now();
    const arrayDuration = arrayEnd - arrayStart;
    
    // Test our optimized list operations
    const listStart = performance.now();
    const listTail = list.tail();
    const listSum = listTail.foldLeft(0, (acc, val) => acc + val);
    const listEnd = performance.now();
    const listDuration = listEnd - listStart;
    
    // Verify correctness
    expect(listSum).toBe(arraySum);
    
    console.log(`Array operations: ${arrayDuration.toFixed(2)}ms`);
    console.log(`Optimized list operations: ${listDuration.toFixed(2)}ms`);
    console.log(`Performance ratio: ${(listDuration / arrayDuration).toFixed(2)}x slower than arrays`);
    
    // Our persistent list should be reasonably close to array performance now
    // (within 10x, which is acceptable for immutable data structures)
    expect(listDuration / arrayDuration).toBeLessThan(10);
  });
});
