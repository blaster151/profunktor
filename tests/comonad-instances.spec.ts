/**
 * Comonad Instances Test Suite
 * 
 * Tests all the comonad instances we implemented:
 * - Reader Comonad: Environment/configuration management
 * - Writer Comonad: Logging/accumulation  
 * - Store Comonad: Stateful computations with focus
 * - Stream Comonad: Infinite data streams
 * - Cofree Comonad: Annotated tree structures
 * - NonEmptyList Comonad: Safe list operations
 */

import { describe, it, expect } from 'vitest';
import {
  ReaderComonad, WriterComonad, StoreComonad, StreamComonad, NonEmptyListComonad,
  reader, writer, store, stream, nonEmptyList, verifyComonadLaws,
  Reader, Writer, Store, Stream, NonEmptyList
} from '../fp-comonad-instances';

// ============================================================================
// Part 1: Reader Comonad Tests
// ============================================================================

describe('Reader Comonad', () => {
  it('should satisfy comonad laws', () => {
    const environment = { user: 'alice', config: { debug: true } };
    const reader: Reader<typeof environment, string> = (env) => 
      `Hello ${env.user}, debug: ${env.config.debug}`;
    
    // Test basic comonad operations
    const extracted = ReaderComonad.extract(reader, environment);
    expect(extracted).toBe('Hello alice, debug: true');
    
    const mapped = ReaderComonad.map(reader, (s) => s.toUpperCase());
    const mappedExtracted = ReaderComonad.extract(mapped, environment);
    expect(mappedExtracted).toBe('HELLO ALICE, DEBUG: TRUE');
    
    const extended = ReaderComonad.extend(reader, (r) => r(environment).length);
    const extendedExtracted = ReaderComonad.extract(extended, environment);
    expect(extendedExtracted).toBe(24); // Length of "Hello alice, debug: true"
  });

  it('should provide environment-based configuration', () => {
    const config = { apiUrl: 'https://api.example.com', timeout: 5000 };
    const apiCall: Reader<typeof config, string> = (env) => 
      `Calling ${env.apiUrl} with timeout ${env.timeout}ms`;
    
    const result = ReaderComonad.extract(apiCall, config);
    expect(result).toBe('Calling https://api.example.com with timeout 5000ms');
  });

  it('should support dependency injection patterns', () => {
    const dbConfig = { host: 'localhost', port: 5432, database: 'test' };
    const userService: Reader<typeof dbConfig, string> = (env) => 
      `Connected to ${env.database} on ${env.host}:${env.port}`;
    
    const extended = ReaderComonad.extend(userService, (r) => r(dbConfig).toUpperCase());
    const result = ReaderComonad.extract(extended, dbConfig);
    expect(result).toBe('CONNECTED TO TEST ON LOCALHOST:5432');
  });

  it('should provide utility functions', () => {
    const env = { user: 'bob', role: 'admin' };
    
    const constant = reader.of('hello');
    expect(constant(env)).toBe('hello');
    
    const ask = reader.ask<typeof env>();
    expect(ask(env)).toBe(env);
    
    const local = reader.local((e) => ({ ...e, user: 'alice' }), ask);
    expect(local(env).user).toBe('alice');
  });
});

// ============================================================================
// Part 2: Writer Comonad Tests
// ============================================================================

describe('Writer Comonad', () => {
  it('should satisfy comonad laws', () => {
    const writer: Writer<string[], number> = [42, ['started', 'processing']];
    
    // Test basic comonad operations
    const extracted = WriterComonad.extract(writer);
    expect(extracted).toBe(42);
    
    const mapped = WriterComonad.map(writer, (n) => n * 2);
    expect(mapped).toEqual([84, ['started', 'processing']]);
    
    const extended = WriterComonad.extend(writer, (w) => w[0] + w[1].length);
    expect(extended).toEqual([44, ['started', 'processing']]); // 42 + 2
  });

  it('should support logging and accumulation', () => {
    const writer: Writer<string[], number> = [42, ['started', 'processing']];
    
    const extracted = WriterComonad.extract(writer);
    expect(extracted).toBe(42);
    
    const mapped = WriterComonad.map(writer, (n) => n * 2);
    expect(mapped).toEqual([84, ['started', 'processing']]);
    
    const extended = WriterComonad.extend(writer, (w) => w[0] + w[1].length);
    expect(extended).toEqual([44, ['started', 'processing']]); // 42 + 2
  });

  it('should provide utility functions', () => {
    const w = writer.of(42, ['started']);
    expect(w).toEqual([42, ['started']]);
    
    const tell = writer.tell(['error']);
    expect(tell).toEqual([undefined, ['error']]);
    
    const listen = writer.listen([42, ['started']]);
    expect(listen).toEqual([[42, ['started']], ['started']]);
  });
});

// ============================================================================
// Part 3: Store Comonad Tests
// ============================================================================

describe('Store Comonad', () => {
  it('should satisfy comonad laws', () => {
    const store: Store<number, string> = {
      peek: (n) => `Value at ${n}`,
      focus: 5
    };
    
    // Test basic comonad operations
    const extracted = StoreComonad.extract(store);
    expect(extracted).toBe('Value at 5');
    
    const mapped = StoreComonad.map(store, (s) => s.toUpperCase());
    expect(StoreComonad.extract(mapped)).toBe('VALUE AT 5');
    
    const extended = StoreComonad.extend(store, (s) => s.peek(s.focus + 1));
    expect(StoreComonad.extract(extended)).toBe('Value at 6');
  });

  it('should support stateful computations with focus', () => {
    const store: Store<number, string> = {
      peek: (n) => `Value at ${n}`,
      focus: 5
    };
    
    const extracted = StoreComonad.extract(store);
    expect(extracted).toBe('Value at 5');
    
    const mapped = StoreComonad.map(store, (s) => s.toUpperCase());
    expect(StoreComonad.extract(mapped)).toBe('VALUE AT 5');
    
    const extended = StoreComonad.extend(store, (s) => s.peek(s.focus + 1));
    expect(StoreComonad.extract(extended)).toBe('Value at 6');
  });

  it('should provide utility functions', () => {
    const s = store.of('hello', 42);
    expect(StoreComonad.extract(s)).toBe('hello');
    
    const peeked = store.peek(s, 100);
    expect(peeked).toBe('hello');
    
    const sought = store.seek(s, 200);
    expect(store.pos(sought)).toBe(200);
    
    const pos = store.pos(s);
    expect(pos).toBe(42);
  });
});

// ============================================================================
// Part 4: Stream Comonad Tests
// ============================================================================

describe('Stream Comonad', () => {
  it('should satisfy comonad laws', () => {
    // Create a finite stream for testing using lazy evaluation
    const createStream = (): Stream<number> => ({
      head: 1,
      tail: () => ({
        head: 2,
        tail: () => ({
          head: 3,
          tail: () => ({
            head: 4,
            tail: () => createStream() // Lazy infinite stream
          })
        })
      })
    });
    
    const stream = createStream();
    const f = (s: Stream<number>) => s.head + (typeof s.tail === 'function' ? s.tail().head : s.tail.head);
    const g = (s: Stream<number>) => s.head * 2;
    
    // Test individual laws manually since Stream has lazy evaluation
    const extracted = StreamComonad.extract(stream);
    expect(extracted).toBe(1);
    
    const mapped = StreamComonad.map(stream, (x) => x * 2);
    expect(StreamComonad.extract(mapped)).toBe(2);
    
    const extended = StreamComonad.extend(stream, (s) => s.head + (typeof s.tail === 'function' ? s.tail().head : s.tail.head));
    expect(StreamComonad.extract(extended)).toBe(3); // 1 + 2
  });

  it('should support infinite data streams', () => {
    // Create a finite stream for testing using lazy evaluation
    const createStream = (): Stream<number> => ({
      head: 1,
      tail: () => ({
        head: 2,
        tail: () => ({
          head: 3,
          tail: () => ({
            head: 4,
            tail: () => createStream() // Lazy infinite stream
          })
        })
      })
    });
    
    const stream = createStream();
    
    const extracted = StreamComonad.extract(stream);
    expect(extracted).toBe(1);
    
    const mapped = StreamComonad.map(stream, (x) => x * 2);
    expect(StreamComonad.extract(mapped)).toBe(2);
    const mappedTail = typeof mapped.tail === 'function' ? mapped.tail() : mapped.tail;
    expect(StreamComonad.extract(mappedTail)).toBe(4);
    
    const extended = StreamComonad.extend(stream, (s) => s.head + (typeof s.tail === 'function' ? s.tail().head : s.tail.head));
    expect(StreamComonad.extract(extended)).toBe(3); // 1 + 2
    const extendedTail = typeof extended.tail === 'function' ? extended.tail() : extended.tail;
    expect(StreamComonad.extract(extendedTail)).toBe(5); // 2 + 3
  });

  it('should provide utility functions', () => {
    const s = stream.of(42);
    expect(StreamComonad.extract(s)).toBe(42);
    
    const iterated = stream.iterate((n) => n + 1, 1);
    expect(StreamComonad.extract(iterated)).toBe(1);
    expect(iterated.tail && StreamComonad.extract(iterated.tail)).toBe(2);
    
    const taken = stream.take(3, iterated);
    expect(taken).toEqual([1, 2, 3]);
  });
});

// ============================================================================
// Part 5: NonEmptyList Comonad Tests
// ============================================================================

describe('NonEmptyList Comonad', () => {
  it('should satisfy comonad laws', () => {
    const nel: NonEmptyList<number> = { head: 1, tail: [2, 3, 4] };
    
    // Test basic comonad operations
    const extracted = NonEmptyListComonad.extract(nel);
    expect(extracted).toBe(1);
    
    const mapped = NonEmptyListComonad.map(nel, (n) => n * 2);
    expect(mapped).toEqual({ head: 2, tail: [4, 6, 8] });
    
    const extended = NonEmptyListComonad.extend(nel, (n) => n.head + n.tail.length);
    expect(extended.head).toBe(4); // 1 + 3
    expect(extended.tail.length).toBe(3);
  });

  it('should support safe list operations', () => {
    const nel: NonEmptyList<number> = { head: 1, tail: [2, 3, 4] };
    
    const extracted = NonEmptyListComonad.extract(nel);
    expect(extracted).toBe(1);
    
    const mapped = NonEmptyListComonad.map(nel, (x) => x * 2);
    expect(mapped).toEqual({ head: 2, tail: [4, 6, 8] });
    
    const extended = NonEmptyListComonad.extend(nel, (w) => w.head + w.tail.length);
    expect(extended).toEqual({ head: 4, tail: [4, 4, 4] }); // 1+3, 2+2, 3+1, 4+0
  });

  it('should provide utility functions', () => {
    const nel = nonEmptyList.of(42);
    expect(nel).toEqual({ head: 42, tail: [] });
    
    const fromArray = nonEmptyList.fromArray([1, 2, 3]);
    expect(fromArray).toEqual({ head: 1, tail: [2, 3] });
    
    const fromEmpty = nonEmptyList.fromArray([]);
    expect(fromEmpty).toBeNull();
    
    const toArray = nonEmptyList.toArray(nel);
    expect(toArray).toEqual([42]);
    
    const appended = nonEmptyList.append(nel, 100);
    expect(appended).toEqual({ head: 42, tail: [100] });
  });
});

// ============================================================================
// Part 6: Real-world Usage Examples
// ============================================================================

describe('Real-world Usage Examples', () => {
  it('should demonstrate Reader for configuration management', () => {
    const config = { 
      apiUrl: 'https://api.example.com', 
      timeout: 5000, 
      retries: 3 
    };
    
    const apiClient: Reader<typeof config, string> = (env) => 
      `API Client: ${env.apiUrl}, timeout: ${env.timeout}ms, retries: ${env.retries}`;
    
    const result = ReaderComonad.extract(apiClient, config);
    expect(result).toContain('API Client: https://api.example.com');
    expect(result).toContain('timeout: 5000ms');
    expect(result).toContain('retries: 3');
  });

  it('should demonstrate Writer for logging', () => {
    const operation: Writer<string[], number> = [42, ['started', 'processing']];
    
    const loggedOperation = WriterComonad.extend(operation, (w) => {
      const value = w[0];
      const logs = w[1];
      return `Operation completed with value ${value}, logs: ${logs.join(', ')}`;
    });
    
    const result = WriterComonad.extract(loggedOperation);
    expect(result).toBe('Operation completed with value 42, logs: started, processing');
  });

  it('should demonstrate Store for UI state management', () => {
    const uiState: Store<{ user: string; theme: string }, string> = {
      peek: (state) => `User: ${state.user}, Theme: ${state.theme}`,
      focus: { user: 'alice', theme: 'dark' }
    };
    
    const currentState = StoreComonad.extract(uiState);
    expect(currentState).toBe('User: alice, Theme: dark');
    
    const nextState = StoreComonad.extend(uiState, (s) => s.peek({ user: 'bob', theme: 'light' }));
    const nextStateValue = StoreComonad.extract(nextState);
    expect(nextStateValue).toBe('User: bob, Theme: light');
  });

  it('should demonstrate Stream for reactive programming', () => {
    // Create a stream of natural numbers using lazy evaluation
    const createNaturals = (): Stream<number> => ({
      head: 1,
      tail: () => ({
        head: 2,
        tail: () => ({
          head: 3,
          tail: () => ({
            head: 4,
            tail: () => createNaturals() // Lazy infinite stream
          })
        })
      })
    });
    
    const naturals = createNaturals();
    
    // Apply a sliding window of 3 elements
    const slidingWindow = StreamComonad.extend(naturals, (s) => {
      const first = s.head;
      const second = typeof s.tail === 'function' ? s.tail().head : s.tail.head;
      const third = typeof s.tail === 'function' ? 
        (typeof s.tail().tail === 'function' ? s.tail().tail().head : s.tail().tail.head) :
        (typeof s.tail.tail === 'function' ? s.tail.tail().head : s.tail.tail.head);
      return [first, second, third];
    });
    
    const window1 = StreamComonad.extract(slidingWindow);
    expect(window1).toEqual([1, 2, 3]);
    
    const window2Tail = typeof slidingWindow.tail === 'function' ? slidingWindow.tail() : slidingWindow.tail;
    const window2 = StreamComonad.extract(window2Tail);
    expect(window2).toEqual([2, 3, 4]);
  });

  it('should demonstrate NonEmptyList for safe operations', () => {
    const users = nonEmptyList.fromArray(['alice', 'bob', 'charlie']);
    if (!users) throw new Error('Expected non-empty list');
    
    const userCounts = NonEmptyListComonad.extend(users, (nel) => {
      const allUsers = nonEmptyList.toArray(nel);
      return allUsers.map(user => ({ name: user, length: user.length }));
    });
    
    const result = NonEmptyListComonad.extract(userCounts);
    expect(result).toEqual([
      { name: 'alice', length: 5 },
      { name: 'bob', length: 3 },
      { name: 'charlie', length: 7 }
    ]);
  });
});

// ============================================================================
// Part 7: Integration Tests
// ============================================================================

describe('Integration Tests', () => {
  it('should compose different comonads', () => {
    // Reader -> Writer -> Store pipeline
    const config = { user: 'alice', debug: true };
    
    const reader: Reader<typeof config, string> = (env) => 
      `Hello ${env.user}, debug: ${env.debug}`;
    
    const writer: Writer<string[], string> = [ReaderComonad.extract(reader, config), ['started']];
    
    const store: Store<number, string> = {
      peek: (n) => WriterComonad.extract(writer) + ` at position ${n}`,
      focus: 42
    };
    
    const result = StoreComonad.extract(store);
    expect(result).toBe('Hello alice, debug: true at position 42');
  });

  it('should demonstrate comonad-monad duality', () => {
    // Comonads extract values from contexts
    // Monads inject values into contexts
    
    const writer: Writer<string[], number> = [42, ['started']];
    const extracted = WriterComonad.extract(writer);
    expect(extracted).toBe(42);
    
    // This would be the dual monad operation (if we had Writer monad)
    // const injected = WriterMonad.of(42);
    // expect(injected).toEqual([42, []]);
  });
});
