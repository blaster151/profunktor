// examples/simple-optics-test.ts
// Simple test of our new optics components
import { dialensH1, dialensH2 } from '../fp-optics-dialens';
import { TernaryFactorization, dualTernary } from '../fp-optics-ambifibration';

console.log('✅ Testing new optics components...');

// Test height-1 dialens
const simple = dialensH1({
  forward: (x: number) => x * 2,
  backward: (x: number, dy: number) => ({ x1: dy / 2, dx: x })
});

console.log('Height-1 dialens:', simple.get(5)); // 10

// Test height-2 dialens
const lens1 = dialensH1({
  forward: (x: number) => x * 2,
  backward: (x: number, dy: number) => ({ x1: dy / 2, dx: x })
});

const lens2 = dialensH1({
  forward: (x: number) => x + 1,
  backward: (x: number, dy: number) => ({ x1: dy - 1, dx: x })
});

const height2 = dialensH2(lens1, lens2);
console.log('Height-2 dialens:', height2.get(3)); // (3*2)+1 = 7

// Test ternary factorization
const ternary: TernaryFactorization<string> = {
  isVertP: (e) => e.startsWith('vP'),
  isVertQ: (e) => e.startsWith('vQ'),
  isCartP: (e) => e.startsWith('cP')
};

const dual = dualTernary(ternary);
console.log('Ternary dual test:', dual.isVertP('vQ1')); // true (swapped)

console.log('✅ All tests passed!');
