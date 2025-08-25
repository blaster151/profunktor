import { defineADT } from '../fp-unified-adt-definition';

console.log('=== Optics Integration Demo ===\n');

// Define a simple ADT with optics enabled
const Maybe = defineADT("Maybe", {
  Just: (value: any) => ({ value }),
  Nothing: () => ({})
}, { optics: true });

console.log('Created Maybe ADT with optics enabled');

// Test lens functionality
const justValue = Maybe.Just(42);
console.log('Created Just(42):', justValue);

// Test lens on product-like field
const valueLens = justValue.lens("value");
console.log('Created lens for "value" field');

if (valueLens) {
  // For sum types, lens returns an Optional
  if (valueLens.getOption) {
    const currentValue = valueLens.getOption(justValue);
    console.log('Current value via lens (Optional):', currentValue);
    
    const updatedValue = valueLens.set(100, justValue);
    console.log('Updated value via lens (Optional):', updatedValue);
    
    const modifiedValue = valueLens.modify(x => x * 2)(justValue);
    console.log('Modified value via lens (Optional, x * 2):', modifiedValue);
  } else {
    // For product types, lens returns a Lens
    const currentValue = valueLens.get(justValue);
    console.log('Current value via lens (Lens):', currentValue);
    
    const updatedValue = valueLens.set(100, justValue);
    console.log('Updated value via lens (Lens):', updatedValue);
    
    const modifiedValue = valueLens.modify(x => x * 2)(justValue);
    console.log('Modified value via lens (Lens, x * 2):', modifiedValue);
  }
}

// Test prism functionality
const valuePrism = justValue.prism("Just");
console.log('Created prism for "Just" constructor');

if (valuePrism) {
  const matchResult = valuePrism.getOption(justValue);
  console.log('Match result via prism:', matchResult);
  
  const builtValue = valuePrism.build({ value: 200 });
  console.log('Built value via prism:', builtValue);
  
  const modifiedViaPrism = valuePrism.modify(payload => ({ ...payload, value: payload.value * 3 }))(justValue);
  console.log('Modified via prism (value * 3):', modifiedViaPrism);
}

// Test with Nothing constructor
const nothingValue = Maybe.Nothing();
console.log('\nCreated Nothing():', nothingValue);

const nothingPrism = nothingValue.prism("Nothing");
if (nothingPrism) {
  const matchResult = nothingPrism.getOption(nothingValue);
  console.log('Match result for Nothing via prism:', matchResult);
  
  const builtNothing = nothingPrism.build({});
  console.log('Built Nothing via prism:', builtNothing);
}

// Test lens on Nothing (should return Optional)
const nothingLens = nothingValue.lens("value");
if (nothingLens) {
  if (nothingLens.getOption) {
    const currentValue = nothingLens.getOption(nothingValue);
    console.log('Current value via lens (Nothing):', currentValue);
    
    const updatedValue = nothingLens.set(999, nothingValue);
    console.log('Updated value via lens (Nothing):', updatedValue);
  }
}

console.log('\n=== Optics Integration Demo Completed ===');
