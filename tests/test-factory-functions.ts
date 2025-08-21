// test-factory-functions.ts - Simple test to verify the new factory pattern works

import { getEitherApplicative, getResultApplicative } from './fp-typeclasses-std';
import type { EitherGADT, Result } from './fp-gadt-enhanced';

// Test Either factory functions
const eitherStringApplicative = getEitherApplicative<string>();

// Test Result factory functions  
const resultErrorApplicative = getResultApplicative<Error>();

// Simple verification that they produce the right types
const testEither: EitherGADT<string, number> = eitherStringApplicative.of(42);
const testResult: Result<number, Error> = resultErrorApplicative.of(42);

console.log('Factory functions created successfully!');
console.log('Either test:', testEither);
console.log('Result test:', testResult);
