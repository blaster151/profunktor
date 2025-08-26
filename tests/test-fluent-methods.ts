/**
 * Test file to verify fp-fluent-methods functionality
 */

import { fluent } from './fp-fluent-methods';

// Test 1: fluent({ tag:'Just', value: 1 }).map(x=>x+1).value() returns { tag:'Just', value:2 }
const result1 = fluent({ tag: 'Just', value: 1 }).map(x => x + 1).value();
console.log('Test 1:', result1); // Should be { tag: 'Just', value: 2 }

// Test 2: fluent({ tag:'Left', value:'e' }).bimap(e=>e+'!', x=>x).value().tag === 'Left'
const result2 = fluent({ tag: 'Left', value: 'e' }).bimap(e => e + '!', x => x).value();
console.log('Test 2:', result2); // Should be { tag: 'Left', value: 'e!' }

// Test 3: Chain operation
const result3 = fluent({ tag: 'Just', value: 5 })
  .chain(x => fluent({ tag: 'Just', value: x * 2 }))
  .value();
console.log('Test 3:', result3); // Should be { tag: 'Just', value: 10 }

// Test 4: Either Right case
const result4 = fluent({ tag: 'Right', value: 10 }).map(x => x + 5).value();
console.log('Test 4:', result4); // Should be { tag: 'Right', value: 15 }

export { };
