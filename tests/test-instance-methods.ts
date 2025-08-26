/**
 * Test the fluent instance methods installation
 */

import { installFluent, unavailableInstallReason } from './fp-fluent-instance-methods';

// Test 1: Calling installFluent() without options should be a no-op
console.log('Before installation:', unavailableInstallReason);
installFluent();
console.log('After empty installation:', unavailableInstallReason);

// Test 2: Mock Maybe class for testing
class MockMaybe {
  constructor(public value: any, public tag: string) {}
  
  static of(value: any) {
    return new MockMaybe(value, 'Just');
  }
}

// Test 3: Install on MockMaybe
installFluent({ MaybeClass: MockMaybe });
console.log('After MockMaybe installation:', unavailableInstallReason);

// Test 4: Check if methods are installed
const instance = MockMaybe.of(5);
console.log('Has map method:', typeof (instance as any).map === 'function');
console.log('Has chain method:', typeof (instance as any).chain === 'function');
console.log('Has ap method:', typeof (instance as any).ap === 'function');

// Test 5: Calling twice shouldn't throw
try {
  installFluent({ MaybeClass: MockMaybe });
  console.log('Second installation succeeded (idempotent)');
} catch (error) {
  console.log('Second installation failed:', error);
}

export { };
