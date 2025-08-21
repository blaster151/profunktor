import { describe, it, expect } from 'vitest';
import { StatefulStream } from '../fp-stream-state';

describe('StatefulStream - Unit Tests', () => {
  describe('constructor and basic operations', () => {
    it('creates stream with correct initial state', () => {
      const stream = new StatefulStream<number, string, boolean>(
        (input) => (state) => [state + input.toString(), input > 0]
      );
      
      expect(stream).toBeInstanceOf(StatefulStream);
    });

    it('runs stream with input and state', () => {
      const stream = new StatefulStream<number, string, boolean>(
        (input) => (state) => [state + input.toString(), input > 0]
      );
      
      const [newState, output] = stream.run(5)('count:');
      expect(newState).toBe('count:5');
      expect(output).toBe(true);
    });
  });

  describe('map - isolated unit test', () => {
    it('transforms output without affecting state', () => {
      const originalStream = new StatefulStream<number, string, number>(
        (input) => (state) => [state + input.toString(), input * 2]
      );
      
      const mappedStream = originalStream.map((output) => output + 1);
      
      const [state1, output1] = originalStream.run(3)('test:');
      const [state2, output2] = mappedStream.run(3)('test:');
      
      // State should be identical
      expect(state1).toBe(state2);
      // Output should be transformed
      expect(output1).toBe(6);
      expect(output2).toBe(7);
    });

    it('preserves purity markers', () => {
      const pureStream = new StatefulStream<number, string, number>(
        (input) => (state) => [state, input],
        'Pure'
      );
      
      const mappedStream = pureStream.map((x) => x + 1);
      expect(mappedStream.__purity).toBe('Pure');
    });
  });

  describe('ap - isolated unit test', () => {
    it('applies function stream to value stream', () => {
      const fnStream = new StatefulStream<number, string, (x: number) => number>(
        (input) => (state) => [state + 'fn', (x: number) => x + input]
      );
      
      const valueStream = new StatefulStream<number, string, number>(
        (input) => (state) => [state + 'val', input * 2]
      );
      
      const appliedStream = fnStream.ap(valueStream);
      
      const [state, output] = appliedStream.run(3)('init:');
      expect(state).toBe('init:fnval');
      expect(output).toBe(9); // (3 * 2) + 3
    });

    it('handles state composition correctly', () => {
      const fnStream = new StatefulStream<number, string, (x: number) => string>(
        (input) => (state) => [state + 'f', (x: number) => `${x}+${input}`]
      );
      
      const valueStream = new StatefulStream<number, string, number>(
        (input) => (state) => [state + 'v', input]
      );
      
      const appliedStream = fnStream.ap(valueStream);
      
      const [state, output] = appliedStream.run(5)('start:');
      expect(state).toBe('start:fv');
      expect(output).toBe('5+5');
    });
  });

  describe('chain - isolated unit test', () => {
    it('chains streams with state accumulation', () => {
      const stream1 = new StatefulStream<number, string, number>(
        (input) => (state) => [state + '1', input + 1]
      );
      
      const stream2 = new StatefulStream<number, string, number>(
        (input) => (state) => [state + '2', input * 2]
      );
      
      const chainedStream = stream1.chain((output) => stream2);
      
      const [state, output] = chainedStream.run(3)('init:');
      expect(state).toBe('init:12');
      expect(output).toBe(8); // (3 + 1) * 2
    });

    it('preserves state through chain', () => {
      const stream1 = new StatefulStream<number, string, number>(
        (input) => (state) => [state + input.toString(), input]
      );
      
      const stream2 = new StatefulStream<number, string, string>(
        (input) => (state) => [state + 'processed', `result: ${input}`]
      );
      
      const chainedStream = stream1.chain((output) => stream2);
      
      const [state, output] = chainedStream.run(42)('count:');
      expect(state).toBe('count:42processed');
      expect(output).toBe('result: 42');
    });
  });

  describe('purity tracking', () => {
    it('marks pure streams correctly', () => {
      const pureStream = new StatefulStream<number, string, number>(
        (input) => (state) => [state, input],
        'Pure'
      );
      
      expect(pureStream.__purity).toBe('Pure');
    });

    it('marks stateful streams correctly', () => {
      const statefulStream = new StatefulStream<number, string, number>(
        (input) => (state) => [state + input.toString(), input],
        'State'
      );
      
      expect(statefulStream.__purity).toBe('State');
    });

    it('propagates purity through map', () => {
      const pureStream = new StatefulStream<number, string, number>(
        (input) => (state) => [state, input],
        'Pure'
      );
      
      const mappedStream = pureStream.map((x) => x + 1);
      expect(mappedStream.__purity).toBe('Pure');
    });

    it('propagates state through map', () => {
      const statefulStream = new StatefulStream<number, string, number>(
        (input) => (state) => [state + input.toString(), input],
        'State'
      );
      
      const mappedStream = statefulStream.map((x) => x + 1);
      expect(mappedStream.__purity).toBe('State');
    });
  });

  describe('edge cases', () => {
    it('handles zero input', () => {
      const stream = new StatefulStream<number, string, number>(
        (input) => (state) => [state + input.toString(), input]
      );
      
      const [state, output] = stream.run(0)('test:');
      expect(state).toBe('test:0');
      expect(output).toBe(0);
    });

    it('handles empty state', () => {
      const stream = new StatefulStream<number, string, number>(
        (input) => (state) => [state + input.toString(), input]
      );
      
      const [state, output] = stream.run(5)('');
      expect(state).toBe('5');
      expect(output).toBe(5);
    });

    it('handles complex state transformations', () => {
      const stream = new StatefulStream<number, { count: number; history: number[] }, number>(
        (input) => (state) => [
          { count: state.count + 1, history: [...state.history, input] },
          input * state.count
        ]
      );
      
      const initialState = { count: 0, history: [] };
      const [state, output] = stream.run(10)(initialState);
      
      expect(state.count).toBe(1);
      expect(state.history).toEqual([10]);
      expect(output).toBe(0); // 10 * 0
    });
  });
});
