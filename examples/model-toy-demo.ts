import { isMono, isEpi, isIso, ALL_WFS } from '../fp-wfs-set';
import { ALL_MODEL_STRUCTURES } from '../fp-model-sets';
import { isQuillenEquivalent } from '../fp-quillen-equivalences';

console.log('=== Toy Model Categories Demo ===\n');

// Test SetMap predicates
const injectiveMap = { domain: [1, 2, 3], codomain: [1, 2, 3, 4], map: (x: number) => x };
const bijectiveMap = { domain: [1, 2, 3], codomain: [1, 2, 3], map: (x: number) => x };

console.log('Injective map is mono:', isMono(injectiveMap));
console.log('Bijective map is iso:', isIso(bijectiveMap));

// Display WFS and Model Structures
console.log('\nWFS count:', ALL_WFS.length);
console.log('Model structures count:', ALL_MODEL_STRUCTURES.length);

// Test Quillen equivalence
const result = isQuillenEquivalent("Mono-Epi", "Epi-Mono");
console.log('Mono-Epi ↔ Epi-Mono:', result.equiv ? `Yes (${result.via})` : 'No');

console.log('\n=== Demo Completed ===');
