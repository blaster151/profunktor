// examples/optics-barrel-test.ts
// Test that all new optics components can be imported from the main barrel
import { 
  Dialens, 
  dialensH1, 
  dialensH2, 
  composeDialens, 
  fromLens,
  ClovenFibration,
  VCMor,
  composeVC,
  dualOf,
  PLens,
  composePLens,
  plensFromDialens,
  Preoptic,
  StrictAction,
  preopticToDialens,
  TernaryFactorization,
  Ambifibration,
  dualTernary
} from '../fp-optics';

console.log('✅ All optics components imported successfully!');

// Test a simple height-1 dialens
const simple = dialensH1({
  forward: (x: number) => x * 2,
  backward: (x: number, dy: number) => ({ x1: dy / 2, dx: x })
});

console.log('Height-1 dialens test:', simple.get(5)); // 10

// Test ternary factorization
const ternary: TernaryFactorization<string> = {
  isVertP: (e) => e.startsWith('vP'),
  isVertQ: (e) => e.startsWith('vQ'),
  isCartP: (e) => e.startsWith('cP')
};

console.log('Ternary factorization test:', ternary.isVertP('vP1')); // true
