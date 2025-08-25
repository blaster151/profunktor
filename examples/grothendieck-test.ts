import { 
  SmallCategory, 
  Functor, 
  categoryOfElements 
} from '../fp-grothendieck-construction';

console.log('=== Grothendieck Construction Test ===\n');

// Simple category A with strings as objects and morphisms
const categoryA: SmallCategory<string, string> = {
  id: (o: string) => `id_${o}`,
  dom: (m: string) => m.split('->')[0],
  cod: (m: string) => m.split('->')[1],
  comp: (g: string, f: string) => `${f.split('->')[0]}->${g.split('->')[1]}`
};

// Simple category E with numbers as objects and morphisms
const categoryE: SmallCategory<number, string> = {
  id: (o: number) => `id_${o}`,
  dom: (m: string) => parseInt(m.split('->')[0]),
  cod: (m: string) => parseInt(m.split('->')[1]),
  comp: (g: string, f: string) => `${f.split('->')[0]}->${g.split('->')[1]}`
};

// Functor F: A → E that maps strings to their lengths
const functorF: Functor<string, string, number, string> = {
  A: categoryA,
  E: categoryE,
  onObj: (a: string) => a.length,
  onMor: (f: string) => `${f.split('->')[0].length}->${f.split('->')[1].length}`
};

console.log('Created functor F: A → E');
console.log('  A objects: strings');
console.log('  E objects: numbers (length of strings)');
console.log('  Example: F("hello") = 5');

// Create category of elements ∫F
const categoryOfElementsF = categoryOfElements(functorF);

console.log('\n--- Category of Elements ∫F ---');

// Test object creation
const obj1 = categoryOfElementsF.makeObj('hello', 5, '5->5');
const obj2 = categoryOfElementsF.makeObj('world', 5, '5->5');

console.log('Created objects:');
console.log('  obj1:', obj1);
console.log('  obj2:', obj2);

// Test morphism creation
const mor = categoryOfElementsF.makeMor(obj1, obj2, 'hello->world', '5->5');
console.log('Created morphism:', mor);

// Test identity morphism
const id1 = categoryOfElementsF.id(obj1);
console.log('Identity morphism for obj1:', id1);

// Test composition
const comp = categoryOfElementsF.comp(id1, id1);
console.log('Composition of identity with itself:', comp);

console.log('\n=== Grothendieck Construction Test Completed ===');
