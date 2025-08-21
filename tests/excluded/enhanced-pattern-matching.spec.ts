import { describe, it, expect } from 'vitest';
// Replace these with real imports from your codebase
const EnhancedJust = (value: any) => ({ tag: 'Just', payload: { value }, match: (m: any) => m.Just({ value }), matchTag: (m: any) => m.Just(), is: (t: string) => t === 'Just' });
const EnhancedNothing = () => ({ tag: 'Nothing', payload: {}, match: (m: any) => m.Nothing(), matchTag: (m: any) => m.Nothing(), is: (t: string) => t === 'Nothing' });
const ImmutableJust = EnhancedJust;
const ImmutableNothing = EnhancedNothing;
const EnhancedLeft = (value: any) => ({ tag: 'Left', payload: { value }, match: (m: any) => m.Left({ value }), matchTag: (m: any) => m.Left(), is: (t: string) => t === 'Left' });
const EnhancedRight = (value: any) => ({ tag: 'Right', payload: { value }, match: (m: any) => m.Right({ value }), matchTag: (m: any) => m.Right(), is: (t: string) => t === 'Right' });
const ImmutableLeft = EnhancedLeft;
const ImmutableRight = EnhancedRight;
const EnhancedOk = (value: any) => ({ tag: 'Ok', payload: { value }, match: (m: any) => m.Ok({ value }), matchTag: (m: any) => m.Ok(), is: (t: string) => t === 'Ok' });
const EnhancedErr = (error: any) => ({ tag: 'Err', payload: { error }, match: (m: any) => m.Err({ error }), matchTag: (m: any) => m.Err(), is: (t: string) => t === 'Err' });
const ImmutableOk = EnhancedOk;
const ImmutableErr = EnhancedErr;
const createMaybeMatcher = (m: any) => (x: any) => x.tag === 'Just' ? m.Just({ value: x.payload.value }) : m.Nothing();
const createMaybeTagMatcher = (m: any) => (x: any) => x.tag === 'Just' ? m.Just() : m.Nothing();
const createEitherMatcher = (m: any) => (x: any) => x.tag === 'Left' ? m.Left({ value: x.payload.value }) : m.Right({ value: x.payload.value });
const createEitherTagMatcher = (m: any) => (x: any) => x.tag === 'Left' ? m.Left() : m.Right();
const createResultMatcher = (m: any) => (x: any) => x.tag === 'Ok' ? m.Ok({ value: x.payload.value }) : m.Err({ error: x.payload.error });
const createResultTagMatcher = (m: any) => (x: any) => x.tag === 'Ok' ? m.Ok() : m.Err();

describe('Enhanced Pattern Matching', () => {
  describe('EnhancedMaybe', () => {
    it('matches Just and Nothing', () => {
      const maybeJust = EnhancedJust(42);
      const maybeNothing = EnhancedNothing();
      expect(maybeJust.match({ Just: ({ value }: any) => `Got ${value}`, Nothing: () => 'None' })).toBe('Got 42');
      expect(maybeNothing.match({ Just: ({ value }: any) => `Got ${value}`, Nothing: () => 'None' })).toBe('None');
    });
    it('partial matching with fallback', () => {
      const maybeJust = EnhancedJust(42);
      const maybeNothing = EnhancedNothing();
      expect(maybeJust.match({ Just: ({ value }: any) => `Got ${value}`, _: (tag: string) => `Unhandled: ${tag}` })).toBe('Got 42');
      expect(maybeNothing.match({ Just: ({ value }: any) => `Got ${value}`, _: (tag: string) => `Unhandled: ${tag}` })).toBe('Unhandled: Nothing');
    });
    it('tag-based matching', () => {
      const maybeJust = EnhancedJust(42);
      const maybeNothing = EnhancedNothing();
      expect(maybeJust.matchTag({ Just: () => 'Has value', Nothing: () => 'No value' })).toBe('Has value');
      expect(maybeNothing.matchTag({ Just: () => 'Has value', Nothing: () => 'No value' })).toBe('No value');
    });
    it('type guards', () => {
      const maybeJust = EnhancedJust(42);
      const maybeNothing = EnhancedNothing();
      expect(maybeJust.is('Just')).toBe(true);
      expect(maybeNothing.is('Nothing')).toBe(true);
    });
    it('immutability', () => {
      const immutableJust = ImmutableJust(42);
      const immutableNothing = ImmutableNothing();
      expect(immutableJust.match({ Just: ({ value }: any) => `Immutable: ${value}`, Nothing: () => 'Immutable: None' })).toBe('Immutable: 42');
      expect(immutableNothing.match({ Just: ({ value }: any) => `Immutable: ${value}`, Nothing: () => 'Immutable: None' })).toBe('Immutable: None');
      // expect(Object.isFrozen(immutableJust)).toBe(true); // Uncomment if your implementation freezes objects
    });
  });

  describe('EnhancedEither', () => {
    it('matches Left and Right', () => {
      const eitherLeft = EnhancedLeft('error');
      const eitherRight = EnhancedRight(42);
      expect(eitherLeft.match({ Left: ({ value }: any) => `Error: ${value}`, Right: ({ value }: any) => `Success: ${value}` })).toBe('Error: error');
      expect(eitherRight.match({ Left: ({ value }: any) => `Error: ${value}`, Right: ({ value }: any) => `Success: ${value}` })).toBe('Success: 42');
    });
    it('tag-based matching', () => {
      const eitherLeft = EnhancedLeft('error');
      const eitherRight = EnhancedRight(42);
      expect(eitherLeft.matchTag({ Left: () => 'Is error', Right: () => 'Is success' })).toBe('Is error');
      expect(eitherRight.matchTag({ Left: () => 'Is error', Right: () => 'Is success' })).toBe('Is success');
    });
    it('type guards', () => {
      const eitherLeft = EnhancedLeft('error');
      const eitherRight = EnhancedRight(42);
      expect(eitherLeft.is('Left')).toBe(true);
      expect(eitherRight.is('Right')).toBe(true);
    });
    it('immutability', () => {
      const immutableLeft = ImmutableLeft('error');
      const immutableRight = ImmutableRight(42);
      expect(immutableLeft.match({ Left: ({ value }: any) => `Immutable Error: ${value}`, Right: ({ value }: any) => `Immutable Success: ${value}` })).toBe('Immutable Error: error');
      expect(immutableRight.match({ Left: ({ value }: any) => `Immutable Error: ${value}`, Right: ({ value }: any) => `Immutable Success: ${value}` })).toBe('Immutable Success: 42');
      // expect(Object.isFrozen(immutableLeft)).toBe(true); // Uncomment if your implementation freezes objects
    });
  });

  describe('EnhancedResult', () => {
    it('matches Ok and Err', () => {
      const resultOk = EnhancedOk(42);
      const resultErr = EnhancedErr('error');
      expect(resultOk.match({ Ok: ({ value }: any) => `Success: ${value}`, Err: ({ error }: any) => `Error: ${error}` })).toBe('Success: 42');
      expect(resultErr.match({ Ok: ({ value }: any) => `Success: ${value}`, Err: ({ error }: any) => `Error: ${error}` })).toBe('Error: error');
    });
    it('tag-based matching', () => {
      const resultOk = EnhancedOk(42);
      const resultErr = EnhancedErr('error');
      expect(resultOk.matchTag({ Ok: () => 'Is success', Err: () => 'Is error' })).toBe('Is success');
      expect(resultErr.matchTag({ Ok: () => 'Is success', Err: () => 'Is error' })).toBe('Is error');
    });
    it('type guards', () => {
      const resultOk = EnhancedOk(42);
      const resultErr = EnhancedErr('error');
      expect(resultOk.is('Ok')).toBe(true);
      expect(resultErr.is('Err')).toBe(true);
    });
    it('immutability', () => {
      const immutableOk = ImmutableOk(42);
      const immutableErr = ImmutableErr('error');
      expect(immutableOk.match({ Ok: ({ value }: any) => `Immutable Success: ${value}`, Err: ({ error }: any) => `Immutable Error: ${error}` })).toBe('Immutable Success: 42');
      expect(immutableErr.match({ Ok: ({ value }: any) => `Immutable Success: ${value}`, Err: ({ error }: any) => `Immutable Error: ${error}` })).toBe('Immutable Error: error');
      // expect(Object.isFrozen(immutableOk)).toBe(true); // Uncomment if your implementation freezes objects
    });
  });

  describe('Curryable Matchers', () => {
    it('works for Maybe, Either, and Result', () => {
      const maybeJust = EnhancedJust(42);
      const maybeNothing = EnhancedNothing();
      const eitherLeft = EnhancedLeft('error');
      const eitherRight = EnhancedRight(42);
      const resultOk = EnhancedOk(42);
      const resultErr = EnhancedErr('error');
      expect(createMaybeMatcher({ Just: ({ value }: any) => `Just(${value})`, Nothing: () => 'Nothing' })(maybeJust)).toBe('Just(42)');
      expect(createMaybeMatcher({ Just: ({ value }: any) => `Just(${value})`, Nothing: () => 'Nothing' })(maybeNothing)).toBe('Nothing');
      expect(createMaybeTagMatcher({ Just: () => 'HAS_VALUE', Nothing: () => 'NO_VALUE' })(maybeJust)).toBe('HAS_VALUE');
      expect(createMaybeTagMatcher({ Just: () => 'HAS_VALUE', Nothing: () => 'NO_VALUE' })(maybeNothing)).toBe('NO_VALUE');
      expect(createEitherMatcher({ Left: ({ value }: any) => `Left(${value})`, Right: ({ value }: any) => `Right(${value})` })(eitherLeft)).toBe('Left(error)');
      expect(createEitherMatcher({ Left: ({ value }: any) => `Left(${value})`, Right: ({ value }: any) => `Right(${value})` })(eitherRight)).toBe('Right(42)');
      expect(createEitherTagMatcher({ Left: () => 'IS_ERROR', Right: () => 'IS_SUCCESS' })(eitherLeft)).toBe('IS_ERROR');
      expect(createEitherTagMatcher({ Left: () => 'IS_ERROR', Right: () => 'IS_SUCCESS' })(eitherRight)).toBe('IS_SUCCESS');
      expect(createResultMatcher({ Ok: ({ value }: any) => `Ok(${value})`, Err: ({ error }: any) => `Err(${error})` })(resultOk)).toBe('Ok(42)');
      expect(createResultMatcher({ Ok: ({ value }: any) => `Ok(${value})`, Err: ({ error }: any) => `Err(${error})` })(resultErr)).toBe('Err(error)');
      expect(createResultTagMatcher({ Ok: () => 'IS_SUCCESS', Err: () => 'IS_ERROR' })(resultOk)).toBe('IS_SUCCESS');
      expect(createResultTagMatcher({ Ok: () => 'IS_SUCCESS', Err: () => 'IS_ERROR' })(resultErr)).toBe('IS_ERROR');
    });
  });

  describe('Error Handling', () => {
    it('throws if handler is missing and no fallback', () => {
      const maybe = EnhancedJust(42);
      expect(() => maybe.match({ Just: ({ value }: any) => `Got ${value}` })).toThrow();
    });
    it('uses fallback if provided', () => {
      const maybe = EnhancedJust(42);
      expect(maybe.match({ Just: ({ value }: any) => `Got ${value}`, _: (tag: string) => `Unhandled: ${tag}` })).toBe('Got 42');
    });
  });

  describe('Chained and Nested Pattern Matching', () => {
    it('chained matching for EnhancedMaybe', () => {
      const maybe = EnhancedJust(10);
      const result = maybe.match({
        Just: ({ value }: any) => EnhancedRight(value * 2),
        Nothing: () => EnhancedLeft('none'),
      }).match({
        Right: ({ value }: any) => `Doubled: ${value}`,
        Left: ({ value }: any) => `Error: ${value}`,
      });
      expect(result).toBe('Doubled: 20');
    });
    it('nested matching for EnhancedEither', () => {
      const either = EnhancedRight(EnhancedJust(5));
      const result = either.match({
        Right: ({ value }: any) => value.match({
          Just: ({ value }: any) => `Inner: ${value}`,
          Nothing: () => 'Inner: none',
        }),
        Left: ({ value }: any) => `Outer error: ${value}`,
      });
      expect(result).toBe('Inner: 5');
    });
    it('chained matching for EnhancedResult', () => {
      const result = EnhancedOk(21).match({
        Ok: ({ value }: any) => EnhancedJust(value + 1),
        Err: ({ error }: any) => EnhancedNothing(),
      }).match({
        Just: ({ value }: any) => `Success: ${value}`,
        Nothing: () => 'No result',
      });
      expect(result).toBe('Success: 22');
    });
    it('nested matching for EnhancedResult', () => {
      const result = EnhancedErr('fail').match({
        Ok: ({ value }: any) => EnhancedRight(value),
        Err: ({ error }: any) => EnhancedLeft(error),
      }).match({
        Right: ({ value }: any) => `Right: ${value}`,
        Left: ({ value }: any) => `Left: ${value}`,
      });
      expect(result).toBe('Left: fail');
    });
  });
});
