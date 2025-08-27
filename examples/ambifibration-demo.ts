// examples/ambifibration-demo.ts
import { TernaryFactorization, Ambifibration, dualTernary } from '../fp-optics-ambifibration';

// A simple ternary factorization for demonstration
const simpleTernary: TernaryFactorization<string> = {
  isVertP: (e: string) => e.startsWith('vP'),
  isVertQ: (e: string) => e.startsWith('vQ'),
  isCartP: (e: string) => e.startsWith('cP')
};

// Test the ternary factorization
console.log('Original ternary:');
console.log('isVertP("vP1"):', simpleTernary.isVertP('vP1')); // true
console.log('isVertQ("vQ1"):', simpleTernary.isVertQ('vQ1')); // true
console.log('isCartP("cP1"):', simpleTernary.isCartP('cP1')); // true
console.log('isVertP("vQ1"):', simpleTernary.isVertP('vQ1')); // false

// Test the dual ternary factorization
const dual = dualTernary(simpleTernary);
console.log('\nDual ternary (swapped vert_P and vert_Q):');
console.log('isVertP("vQ1"):', dual.isVertP('vQ1')); // true (was vert_Q)
console.log('isVertQ("vP1"):', dual.isVertQ('vP1')); // true (was vert_P)
console.log('isCartP("cP1"):', dual.isCartP('cP1')); // true (unchanged)

// A simple ambifibration
const simpleAmbifibration: Ambifibration<string> = {
  opcartLiftOnL: (e: string) => `opcart_${e}`,
  cartLiftOnR: (e: string) => `cart_${e}`
};

console.log('\nAmbifibration lifts:');
console.log('opcartLiftOnL("test"):', simpleAmbifibration.opcartLiftOnL('test'));
console.log('cartLiftOnR("test"):', simpleAmbifibration.cartLiftOnR('test'));
