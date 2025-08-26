/**
 * Tangent Categories Tests
 * 
 * Based on "Differential bundles and fibrations for tangent categories"
 * by J.R.B. Cockett and G.S.H. Cruttwell (arXiv:1606.08379)
 */

import { describe, it, expect } from 'vitest';
import {
  createTangentFunctor,
  createTangentCategory,
  createDifferentialBundle,
  createLinearBundleMorphism,
  createDifferentialObject,
  createCartesianDifferentialCategory,
  createDifferentialAxioms,
  createDisplaySystem,
  createDisplayMap,
  createTransverseSystem,
  createTransverseMap,
  createTangentFibration,
  createDifferentialFibration,
  createDisplayDifferentialBundle,
  hasDisplaySystem,
  hasTransverseSystem,
  getDifferentialObjects,
  getDifferentialBundles,
  isLocallyTrivial,
  hasScalarMultiplication,
  applyTangentFunctor,
  validateTangentCategory,
  validateDifferentialBundle,
  validateTangentFibration,
  createSmoothManifoldTangentCategory,
  createTangentCategoryWithDisplaySystem,
  createDisplayDifferentialBundleExample
} from '../fp-tangent-categories';

describe('Tangent Categories Revolution', () => {
  describe('TangentFunctor', () => {
    it('should create tangent functor with proper natural transformations', () => {
      const category = { kind: 'Category', objects: [], morphisms: new Map() };
      const functor = { kind: 'Functor', source: category, target: category, mapObjects: (x: any) => x, mapMorphisms: (f: any) => f };
      const p = { source: 'T', target: 'Id', component: (x: any) => x, naturality: () => true };
      const zero = { source: 'Id', target: 'T', component: (x: any) => x, naturality: () => true };
      const add = { source: 'T×T', target: 'T', component: (x: any) => x, naturality: () => true };
      const c = { source: 'T', target: 'T', component: (x: any) => x, naturality: () => true };
      const l = { source: 'T²', target: 'T²', component: (x: any) => x, naturality: () => true };

      const tangentFunctor = createTangentFunctor(category, functor, p, zero, add, c, l);

      expect(tangentFunctor.kind).toBe('TangentFunctor');
      expect(tangentFunctor.category).toBe(category);
      expect(tangentFunctor.functor).toBe(functor);
      expect(tangentFunctor.p).toBe(p);
      expect(tangentFunctor.zero).toBe(zero);
      expect(tangentFunctor.add).toBe(add);
      expect(tangentFunctor.c).toBe(c);
      expect(tangentFunctor.l).toBe(l);
    });
  });

  describe('TangentCategory', () => {
    it('should create tangent category with proper structure', () => {
      const category = { kind: 'Category', objects: [], morphisms: new Map() };
      const functor = { kind: 'Functor', source: category, target: category, mapObjects: (x: any) => x, mapMorphisms: (f: any) => f };
      const p = { source: 'T', target: 'Id', component: (x: any) => x, naturality: () => true };
      const zero = { source: 'Id', target: 'T', component: (x: any) => x, naturality: () => true };
      const add = { source: 'T×T', target: 'T', component: (x: any) => x, naturality: () => true };
      const c = { source: 'T', target: 'T', component: (x: any) => x, naturality: () => true };
      const l = { source: 'T²', target: 'T²', component: (x: any) => x, naturality: () => true };

      const tangentFunctor = createTangentFunctor(category, functor, p, zero, add, c, l);
      const tangentCategory = createTangentCategory(category, tangentFunctor);

      expect(tangentCategory.kind).toBe('TangentCategory');
      expect(tangentCategory.category).toBe(category);
      expect(tangentCategory.tangentFunctor).toBe(tangentFunctor);
      expect(tangentCategory.differentialObjects).toEqual([]);
      expect(tangentCategory.differentialBundles).toEqual([]);
    });

    it('should create tangent category with display and transverse systems', () => {
      const category = { kind: 'Category', objects: [], morphisms: new Map() };
      const functor = { kind: 'Functor', source: category, target: category, mapObjects: (x: any) => x, mapMorphisms: (f: any) => f };
      const p = { source: 'T', target: 'Id', component: (x: any) => x, naturality: () => true };
      const zero = { source: 'Id', target: 'T', component: (x: any) => x, naturality: () => true };
      const add = { source: 'T×T', target: 'T', component: (x: any) => x, naturality: () => true };
      const c = { source: 'T', target: 'T', component: (x: any) => x, naturality: () => true };
      const l = { source: 'T²', target: 'T²', component: (x: any) => x, naturality: () => true };

      const tangentFunctor = createTangentFunctor(category, functor, p, zero, add, c, l);
      const tangentCategory = createTangentCategory(category, tangentFunctor);

      const displaySystem = createDisplaySystem(tangentCategory);
      const transverseSystem = createTransverseSystem(tangentCategory);

      const tangentCategoryWithSystems = createTangentCategory(
        category, 
        tangentFunctor, 
        [], 
        [], 
        displaySystem, 
        transverseSystem
      );

      expect(tangentCategoryWithSystems.displaySystem).toBe(displaySystem);
      expect(tangentCategoryWithSystems.transverseSystem).toBe(transverseSystem);
    });
  });

  describe('DifferentialBundle', () => {
    it('should create differential bundle with the crucial lift map', () => {
      const totalSpace = { kind: 'TotalSpace' };
      const baseSpace = { kind: 'BaseSpace' };
      const projection = { kind: 'Morphism' };
      const addition = { kind: 'Morphism' };
      const zero = { kind: 'Morphism' };
      const lift = { kind: 'Morphism' }; // THE KEY MAP: λ: E → T(E)

      const bundle = createDifferentialBundle(
        totalSpace,
        baseSpace,
        projection,
        addition,
        zero,
        lift,
        false, // Not locally trivial
        false  // No scalar multiplication
      );

      expect(bundle.kind).toBe('DifferentialBundle');
      expect(bundle.totalSpace).toBe(totalSpace);
      expect(bundle.baseSpace).toBe(baseSpace);
      expect(bundle.projection).toBe(projection);
      expect(bundle.addition).toBe(addition);
      expect(bundle.zero).toBe(zero);
      expect(bundle.lift).toBe(lift); // THE KEY MAP
      expect(bundle.isLocallyTrivial).toBe(false);
      expect(bundle.hasScalarMultiplication).toBe(false);
    });

    it('should create locally trivial bundle with scalar multiplication', () => {
      const totalSpace = { kind: 'TotalSpace' };
      const baseSpace = { kind: 'BaseSpace' };
      const projection = { kind: 'Morphism' };
      const addition = { kind: 'Morphism' };
      const zero = { kind: 'Morphism' };
      const lift = { kind: 'Morphism' };

      const bundle = createDifferentialBundle(
        totalSpace,
        baseSpace,
        projection,
        addition,
        zero,
        lift,
        true,  // Locally trivial
        true   // Has scalar multiplication
      );

      expect(bundle.isLocallyTrivial).toBe(true);
      expect(bundle.hasScalarMultiplication).toBe(true);
    });
  });

  describe('LinearBundleMorphism', () => {
    it('should create linear bundle morphism preserving structure', () => {
      const sourceBundle = createDifferentialBundle(
        { kind: 'SourceTotal' },
        { kind: 'SourceBase' },
        { kind: 'SourceProjection' },
        { kind: 'SourceAddition' },
        { kind: 'SourceZero' },
        { kind: 'SourceLift' }
      );

      const targetBundle = createDifferentialBundle(
        { kind: 'TargetTotal' },
        { kind: 'TargetBase' },
        { kind: 'TargetProjection' },
        { kind: 'TargetAddition' },
        { kind: 'TargetZero' },
        { kind: 'TargetLift' }
      );

      const morphism = { kind: 'Morphism' };
      const baseMorphism = { kind: 'BaseMorphism' };

      const linearMorphism = createLinearBundleMorphism(
        sourceBundle,
        targetBundle,
        morphism,
        baseMorphism,
        true,  // preservesAddition
        true,  // preservesZero
        true   // preservesLift
      );

      expect(linearMorphism.kind).toBe('LinearBundleMorphism');
      expect(linearMorphism.source).toBe(sourceBundle);
      expect(linearMorphism.target).toBe(targetBundle);
      expect(linearMorphism.morphism).toBe(morphism);
      expect(linearMorphism.baseMorphism).toBe(baseMorphism);
      expect(linearMorphism.preservesAddition).toBe(true);
      expect(linearMorphism.preservesZero).toBe(true);
      expect(linearMorphism.preservesLift).toBe(true);
    });
  });

  describe('DifferentialObject', () => {
    it('should create differential object with differential structure', () => {
      const object = { kind: 'Object' };
      const tangentObject = { kind: 'TangentObject' };
      const differential = { kind: 'Differential' };

      const diffObject = createDifferentialObject(
        object,
        tangentObject,
        differential,
        true,  // isVectorSpace
        (r: any, x: any) => x,  // scalarMultiplication
        (x: any, y: any) => x   // addition
      );

      expect(diffObject.kind).toBe('DifferentialObject');
      expect(diffObject.object).toBe(object);
      expect(diffObject.tangentObject).toBe(tangentObject);
      expect(diffObject.differential).toBe(differential);
      expect(diffObject.isVectorSpace).toBe(true);
      expect(diffObject.scalarMultiplication).toBeDefined();
      expect(diffObject.addition).toBeDefined();
    });
  });

  describe('CartesianDifferentialCategory', () => {
    it('should create Cartesian differential category with proper axioms', () => {
      const category = { kind: 'Category', objects: [], morphisms: new Map() };
      const products = (x: any, y: any) => ({ kind: 'Product', x, y });
      const projections = (x: any, y: any) => [{ kind: 'Projection1' }, { kind: 'Projection2' }];
      const diagonals = (x: any) => ({ kind: 'Diagonal', x });
      const terminal = { kind: 'Terminal' };
      const differentialCombinator = (f: any) => ({ kind: 'Differential', f });

      const differentialAxioms = createDifferentialAxioms(
        () => true,  // linearity
        () => true,  // chainRule
        () => true,  // constantRule
        () => true,  // productRule
        () => true   // cartesianRule
      );

      const cartesianDiffCategory = createCartesianDifferentialCategory(
        category,
        products,
        projections,
        diagonals,
        terminal,
        differentialCombinator,
        differentialAxioms
      );

      expect(cartesianDiffCategory.kind).toBe('CartesianDifferentialCategory');
      expect(cartesianDiffCategory.category).toBe(category);
      expect(cartesianDiffCategory.products).toBe(products);
      expect(cartesianDiffCategory.projections).toBe(projections);
      expect(cartesianDiffCategory.diagonals).toBe(diagonals);
      expect(cartesianDiffCategory.terminal).toBe(terminal);
      expect(cartesianDiffCategory.differentialCombinator).toBe(differentialCombinator);
      expect(cartesianDiffCategory.differentialAxioms).toBe(differentialAxioms);
    });
  });

  describe('Display and Transverse Systems', () => {
    it('should create display system with display maps', () => {
      const category = { kind: 'Category', objects: [], morphisms: new Map() };
      const functor = { kind: 'Functor', source: category, target: category, mapObjects: (x: any) => x, mapMorphisms: (f: any) => f };
      const p = { source: 'T', target: 'Id', component: (x: any) => x, naturality: () => true };
      const zero = { source: 'Id', target: 'T', component: (x: any) => x, naturality: () => true };
      const add = { source: 'T×T', target: 'T', component: (x: any) => x, naturality: () => true };
      const c = { source: 'T', target: 'T', component: (x: any) => x, naturality: () => true };
      const l = { source: 'T²', target: 'T²', component: (x: any) => x, naturality: () => true };

      const tangentFunctor = createTangentFunctor(category, functor, p, zero, add, c, l);
      const tangentCategory = createTangentCategory(category, tangentFunctor);

      const displayMap = createDisplayMap({ kind: 'Morphism' });
      const displaySystem = createDisplaySystem(
        tangentCategory,
        [displayMap],
        () => true,  // pullbackStability
        (f: any, g: any) => f  // tangentPullback
      );

      expect(displaySystem.kind).toBe('DisplaySystem');
      expect(displaySystem.tangentCategory).toBe(tangentCategory);
      expect(displaySystem.displayMaps).toEqual([displayMap]);
    });

    it('should create transverse system with transverse maps', () => {
      const category = { kind: 'Category', objects: [], morphisms: new Map() };
      const functor = { kind: 'Functor', source: category, target: category, mapObjects: (x: any) => x, mapMorphisms: (f: any) => f };
      const p = { source: 'T', target: 'Id', component: (x: any) => x, naturality: () => true };
      const zero = { source: 'Id', target: 'T', component: (x: any) => x, naturality: () => true };
      const add = { source: 'T×T', target: 'T', component: (x: any) => x, naturality: () => true };
      const c = { source: 'T', target: 'T', component: (x: any) => x, naturality: () => true };
      const l = { source: 'T²', target: 'T²', component: (x: any) => x, naturality: () => true };

      const tangentFunctor = createTangentFunctor(category, functor, p, zero, add, c, l);
      const tangentCategory = createTangentCategory(category, tangentFunctor);

      const transverseMap = createTransverseMap({ kind: 'Morphism' });
      const transverseSystem = createTransverseSystem(
        tangentCategory,
        [transverseMap],
        (f: any, g: any) => f  // transversePullback
      );

      expect(transverseSystem.kind).toBe('TransverseSystem');
      expect(transverseSystem.tangentCategory).toBe(tangentCategory);
      expect(transverseSystem.transverseMaps).toEqual([transverseMap]);
    });
  });

  describe('Tangent Fibrations', () => {
    it('should create tangent fibration with Cartesian differential fibres', () => {
      const category = { kind: 'Category', objects: [], morphisms: new Map() };
      const functor = { kind: 'Functor', source: category, target: category, mapObjects: (x: any) => x, mapMorphisms: (f: any) => f };
      const p = { source: 'T', target: 'Id', component: (x: any) => x, naturality: () => true };
      const zero = { source: 'Id', target: 'T', component: (x: any) => x, naturality: () => true };
      const add = { source: 'T×T', target: 'T', component: (x: any) => x, naturality: () => true };
      const c = { source: 'T', target: 'T', component: (x: any) => x, naturality: () => true };
      const l = { source: 'T²', target: 'T²', component: (x: any) => x, naturality: () => true };

      const tangentFunctor = createTangentFunctor(category, functor, p, zero, add, c, l);
      const tangentCategory = createTangentCategory(category, tangentFunctor);

      const projection = { kind: 'Functor', map: (x: any) => x };
      const tangentFibration = createTangentFibration(
        tangentCategory,
        category,
        category,
        projection,
        (f: any, b: any) => f,  // cartesianLifts
        (f: any, b: any) => f,  // tangentLifts
        true  // fibresAreCartesianDifferential
      );

      expect(tangentFibration.kind).toBe('TangentFibration');
      expect(tangentFibration.tangentCategory).toBe(tangentCategory);
      expect(tangentFibration.baseCategory).toBe(category);
      expect(tangentFibration.totalCategory).toBe(category);
      expect(tangentFibration.projection).toBe(projection);
      expect(tangentFibration.fibresAreCartesianDifferential).toBe(true);
    });

    it('should create differential fibration with coherent differential structure', () => {
      const category = { kind: 'Category', objects: [], morphisms: new Map() };
      const functor = { kind: 'Functor', source: category, target: category, mapObjects: (x: any) => x, mapMorphisms: (f: any) => f };
      const p = { source: 'T', target: 'Id', component: (x: any) => x, naturality: () => true };
      const zero = { source: 'Id', target: 'T', component: (x: any) => x, naturality: () => true };
      const add = { source: 'T×T', target: 'T', component: (x: any) => x, naturality: () => true };
      const c = { source: 'T', target: 'T', component: (x: any) => x, naturality: () => true };
      const l = { source: 'T²', target: 'T²', component: (x: any) => x, naturality: () => true };

      const tangentFunctor = createTangentFunctor(category, functor, p, zero, add, c, l);
      const tangentCategory = createTangentCategory(category, tangentFunctor);

      const projection = { kind: 'Functor', map: (x: any) => x };
      const tangentFibration = createTangentFibration(
        tangentCategory,
        category,
        category,
        projection
      );

      const fibreDifferentialStructure = (b: any) => ({
        kind: 'DifferentialStructure',
        differential: (f: any) => f,
        chainRule: () => true,
        linearity: () => true,
        constantRule: () => true,
        productRule: () => true
      });

      const differentialFibration = createDifferentialFibration(
        tangentFibration,
        fibreDifferentialStructure,
        true  // coherentDifferentialStructure
      );

      expect(differentialFibration.kind).toBe('DifferentialFibration');
      expect(differentialFibration.tangentFibration).toBe(tangentFibration);
      expect(differentialFibration.fibreDifferentialStructure).toBe(fibreDifferentialStructure);
      expect(differentialFibration.coherentDifferentialStructure).toBe(true);
    });
  });

  describe('Display Differential Bundles', () => {
    it('should create display differential bundle with Cartesian differential fibres', () => {
      const tangentCategory = createTangentCategoryWithDisplaySystem();
      
      const cartesianDifferentialFibre = createCartesianDifferentialCategory(
        { kind: 'Category', objects: [], morphisms: new Map() },
        (x: any, y: any) => x,  // products
        (x: any, y: any) => [{ kind: 'Projection1' }, { kind: 'Projection2' }],  // projections
        (x: any) => ({ kind: 'Diagonal', x }),  // diagonals
        { kind: 'Terminal' },  // terminal
        (f: any) => ({ kind: 'Differential', f }),  // differentialCombinator
        createDifferentialAxioms(
          () => true,  // linearity
          () => true,  // chainRule
          () => true,  // constantRule
          () => true,  // productRule
          () => true   // cartesianRule
        )
      );

      const displayBundle = createDisplayDifferentialBundle(
        tangentCategory,
        { kind: 'TotalSpace' },  // totalSpace
        { kind: 'BaseSpace' },   // baseSpace
        { kind: 'Projection' },  // projection
        { kind: 'Addition' },    // addition
        { kind: 'Zero' },        // zero
        { kind: 'Lift' },        // lift - THE KEY MAP
        cartesianDifferentialFibre
      );

      expect(displayBundle.kind).toBe('DifferentialBundle');
      expect(displayBundle.totalSpace).toEqual({ kind: 'TotalSpace' });
      expect(displayBundle.baseSpace).toEqual({ kind: 'BaseSpace' });
      expect(displayBundle.projection).toEqual({ kind: 'Projection' });
      expect(displayBundle.addition).toEqual({ kind: 'Addition' });
      expect(displayBundle.zero).toEqual({ kind: 'Zero' });
      expect(displayBundle.lift).toEqual({ kind: 'Lift' }); // THE KEY MAP
      expect(displayBundle.isLocallyTrivial).toBe(false);
      expect(displayBundle.hasScalarMultiplication).toBe(false);
    });

    it('should throw error for display differential bundle without display system', () => {
      const category = { kind: 'Category', objects: [], morphisms: new Map() };
      const functor = { kind: 'Functor', source: category, target: category, mapObjects: (x: any) => x, mapMorphisms: (f: any) => f };
      const p = { source: 'T', target: 'Id', component: (x: any) => x, naturality: () => true };
      const zero = { source: 'Id', target: 'T', component: (x: any) => x, naturality: () => true };
      const add = { source: 'T×T', target: 'T', component: (x: any) => x, naturality: () => true };
      const c = { source: 'T', target: 'T', component: (x: any) => x, naturality: () => true };
      const l = { source: 'T²', target: 'T²', component: (x: any) => x, naturality: () => true };

      const tangentFunctor = createTangentFunctor(category, functor, p, zero, add, c, l);
      const tangentCategory = createTangentCategory(category, tangentFunctor); // No display system

      const cartesianDifferentialFibre = createCartesianDifferentialCategory(
        { kind: 'Category', objects: [], morphisms: new Map() },
        (x: any, y: any) => x,
        (x: any, y: any) => [{ kind: 'Projection1' }, { kind: 'Projection2' }],
        (x: any) => ({ kind: 'Diagonal', x }),
        { kind: 'Terminal' },
        (f: any) => ({ kind: 'Differential', f }),
        createDifferentialAxioms(() => true, () => true, () => true, () => true, () => true)
      );

      expect(() => {
        createDisplayDifferentialBundle(
          tangentCategory,
          { kind: 'TotalSpace' },
          { kind: 'BaseSpace' },
          { kind: 'Projection' },
          { kind: 'Addition' },
          { kind: 'Zero' },
          { kind: 'Lift' },
          cartesianDifferentialFibre
        );
      }).toThrow('Tangent category must have a display system for display differential bundles');
    });
  });

  describe('Utility Functions', () => {
    it('should check for display and transverse systems', () => {
      const tangentCategory = createTangentCategoryWithDisplaySystem();
      
      expect(hasDisplaySystem(tangentCategory)).toBe(true);
      expect(hasTransverseSystem(tangentCategory)).toBe(false);
    });

    it('should get differential objects and bundles', () => {
      const category = { kind: 'Category', objects: [], morphisms: new Map() };
      const functor = { kind: 'Functor', source: category, target: category, mapObjects: (x: any) => x, mapMorphisms: (f: any) => f };
      const p = { source: 'T', target: 'Id', component: (x: any) => x, naturality: () => true };
      const zero = { source: 'Id', target: 'T', component: (x: any) => x, naturality: () => true };
      const add = { source: 'T×T', target: 'T', component: (x: any) => x, naturality: () => true };
      const c = { source: 'T', target: 'T', component: (x: any) => x, naturality: () => true };
      const l = { source: 'T²', target: 'T²', component: (x: any) => x, naturality: () => true };

      const tangentFunctor = createTangentFunctor(category, functor, p, zero, add, c, l);
      
      const diffObject = createDifferentialObject(
        { kind: 'Object' },
        { kind: 'TangentObject' },
        { kind: 'Differential' }
      );

      const bundle = createDifferentialBundle(
        { kind: 'TotalSpace' },
        { kind: 'BaseSpace' },
        { kind: 'Projection' },
        { kind: 'Addition' },
        { kind: 'Zero' },
        { kind: 'Lift' }
      );

      const tangentCategory = createTangentCategory(
        category, 
        tangentFunctor, 
        [diffObject], 
        [bundle]
      );

      expect(getDifferentialObjects(tangentCategory)).toEqual([diffObject]);
      expect(getDifferentialBundles(tangentCategory)).toEqual([bundle]);
    });

    it('should check bundle properties', () => {
      const bundle = createDifferentialBundle(
        { kind: 'TotalSpace' },
        { kind: 'BaseSpace' },
        { kind: 'Projection' },
        { kind: 'Addition' },
        { kind: 'Zero' },
        { kind: 'Lift' },
        true,   // isLocallyTrivial
        true    // hasScalarMultiplication
      );

      expect(isLocallyTrivial(bundle)).toBe(true);
      expect(hasScalarMultiplication(bundle)).toBe(true);
    });

    it('should apply tangent functor to morphism', () => {
      const category = { kind: 'Category', objects: [], morphisms: new Map() };
      const functor = { kind: 'Functor', source: category, target: category, mapObjects: (x: any) => x, mapMorphisms: (f: any) => ({ kind: 'TangentMorphism', f }) };
      const p = { source: 'T', target: 'Id', component: (x: any) => x, naturality: () => true };
      const zero = { source: 'Id', target: 'T', component: (x: any) => x, naturality: () => true };
      const add = { source: 'T×T', target: 'T', component: (x: any) => x, naturality: () => true };
      const c = { source: 'T', target: 'T', component: (x: any) => x, naturality: () => true };
      const l = { source: 'T²', target: 'T²', component: (x: any) => x, naturality: () => true };

      const tangentFunctor = createTangentFunctor(category, functor, p, zero, add, c, l);
      const tangentCategory = createTangentCategory(category, tangentFunctor);

      const morphism = { kind: 'Morphism' };
      const tangentMorphism = applyTangentFunctor(tangentCategory, morphism);

      expect(tangentMorphism).toEqual({ kind: 'TangentMorphism', f: morphism });
    });
  });

  describe('Validation Functions', () => {
    it('should validate tangent category', () => {
      const category = { kind: 'Category', objects: [], morphisms: new Map() };
      const functor = { kind: 'Functor', source: category, target: category, mapObjects: (x: any) => x, mapMorphisms: (f: any) => f };
      const p = { source: 'T', target: 'Id', component: (x: any) => x, naturality: () => true };
      const zero = { source: 'Id', target: 'T', component: (x: any) => x, naturality: () => true };
      const add = { source: 'T×T', target: 'T', component: (x: any) => x, naturality: () => true };
      const c = { source: 'T', target: 'T', component: (x: any) => x, naturality: () => true };
      const l = { source: 'T²', target: 'T²', component: (x: any) => x, naturality: () => true };

      const tangentFunctor = createTangentFunctor(category, functor, p, zero, add, c, l);
      const tangentCategory = createTangentCategory(category, tangentFunctor);

      const validation = validateTangentCategory(tangentCategory);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should validate differential bundle', () => {
      const bundle = createDifferentialBundle(
        { kind: 'TotalSpace' },
        { kind: 'BaseSpace' },
        { kind: 'Projection' },
        { kind: 'Addition' },
        { kind: 'Zero' },
        { kind: 'Lift' }
      );

      const validation = validateDifferentialBundle(bundle);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should validate tangent fibration', () => {
      const category = { kind: 'Category', objects: [], morphisms: new Map() };
      const functor = { kind: 'Functor', source: category, target: category, mapObjects: (x: any) => x, mapMorphisms: (f: any) => f };
      const p = { source: 'T', target: 'Id', component: (x: any) => x, naturality: () => true };
      const zero = { source: 'Id', target: 'T', component: (x: any) => x, naturality: () => true };
      const add = { source: 'T×T', target: 'T', component: (x: any) => x, naturality: () => true };
      const c = { source: 'T', target: 'T', component: (x: any) => x, naturality: () => true };
      const l = { source: 'T²', target: 'T²', component: (x: any) => x, naturality: () => true };

      const tangentFunctor = createTangentFunctor(category, functor, p, zero, add, c, l);
      const tangentCategory = createTangentCategory(category, tangentFunctor);

      const projection = { kind: 'Functor', map: (x: any) => x };
      const tangentFibration = createTangentFibration(
        tangentCategory,
        category,
        category,
        projection
      );

      const validation = validateTangentFibration(tangentFibration);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });
  });

  describe('Examples', () => {
    it('should create smooth manifold tangent category example', () => {
      const smoothCategory = createSmoothManifoldTangentCategory();

      expect(smoothCategory.kind).toBe('TangentCategory');
      expect(smoothCategory.category).toBeDefined();
      expect(smoothCategory.tangentFunctor).toBeDefined();
    });

    it('should create tangent category with display system example', () => {
      const categoryWithDisplay = createTangentCategoryWithDisplaySystem();

      expect(categoryWithDisplay.kind).toBe('TangentCategory');
      expect(categoryWithDisplay.displaySystem).toBeDefined();
    });

    it('should create display differential bundle example', () => {
      const displayBundle = createDisplayDifferentialBundleExample();

      expect(displayBundle.kind).toBe('DifferentialBundle');
      expect(displayBundle.lift).toBeDefined(); // THE KEY MAP
      expect(displayBundle.isLocallyTrivial).toBe(false);
      expect(displayBundle.hasScalarMultiplication).toBe(false);
    });
  });

  describe('Revolutionary Features', () => {
    it('should demonstrate the key insight: lift map λ: E → T(E)', () => {
      // This is the revolutionary insight from the paper:
      // Instead of requiring scalar multiplication, differential bundles
      // are defined by the crucial lift map λ: E → T(E)
      
      const bundle = createDifferentialBundle(
        { kind: 'TotalSpace' },
        { kind: 'BaseSpace' },
        { kind: 'Projection' },
        { kind: 'Addition' },
        { kind: 'Zero' },
        { kind: 'Lift' } // THE KEY MAP: λ: E → T(E)
      );

      expect(bundle.lift).toEqual({ kind: 'Lift' });
      expect(bundle.hasScalarMultiplication).toBe(false); // May not have scalar multiplication
      expect(bundle.isLocallyTrivial).toBe(false); // Need not be locally trivial
    });

    it('should demonstrate connection to Cartesian differential categories', () => {
      // The paper's key insight: fibres of tangent fibrations are
      // Cartesian differential categories
      
      const tangentCategory = createTangentCategoryWithDisplaySystem();
      const displayBundle = createDisplayDifferentialBundleExample();

      expect(hasDisplaySystem(tangentCategory)).toBe(true);
      expect(displayBundle.kind).toBe('DifferentialBundle');
      expect(displayBundle.lift).toBeDefined(); // THE KEY MAP
    });

    it('should demonstrate the tight connection mentioned in the paper', () => {
      // From the paper: "Strikingly, in such examples the fibres are 
      // Cartesian differential categories demonstrating a -- not unexpected -- 
      // tight connection between the theory of these categories and that of tangent categories."
      
      const cartesianDiffCategory = createCartesianDifferentialCategory(
        { kind: 'Category', objects: [], morphisms: new Map() },
        (x: any, y: any) => x,
        (x: any, y: any) => [{ kind: 'Projection1' }, { kind: 'Projection2' }],
        (x: any) => ({ kind: 'Diagonal', x }),
        { kind: 'Terminal' },
        (f: any) => ({ kind: 'Differential', f }),
        createDifferentialAxioms(() => true, () => true, () => true, () => true, () => true)
      );

      expect(cartesianDiffCategory.kind).toBe('CartesianDifferentialCategory');
      expect(cartesianDiffCategory.differentialCombinator).toBeDefined();
      expect(cartesianDiffCategory.differentialAxioms).toBeDefined();
    });
  });
});
