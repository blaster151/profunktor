import {
  createWeilAlgebra,
  createSpecConstruction,
  createAxiom1W,
  createWpqWeilAlgebra,
  createDPqContainment,
  createHigherOrderInfinitesimal,
  createMinorBasedFunction,
  createWeilAlgebraSystem,
  isWeilAlgebra,
  isWpqWeilAlgebra,
  isSpecConstruction,
  isAxiom1W,
  isDPqContainment,
  isHigherOrderInfinitesimal,
  isMinorBasedFunction,
  exampleWeilAlgebraSystem,
  integrateWithSDG,
  connectToPolynomialFunctors
} from '../fp-weil-algebras';

describe('Weil Algebras', () => {
  describe('Core Weil Algebra Interface', () => {
    test('should create a basic Weil algebra', () => {
      const weil = createWeilAlgebra('W', 'R', 'I', 2);
      
      expect(weil.kind).toBe('WeilAlgebra');
      expect(weil.name).toBe('W');
      expect(weil.underlyingRing).toBe('R');
      expect(weil.nilpotentIdeal).toBe('I');
      expect(weil.dimension).toBe(2);
      expect(weil.isFiniteDimensional).toBe(true);
      expect(weil.hasYonedaIsomorphism).toBe(true);
      expect(weil.satisfiesAxiom1W).toBe(true);
    });

    test('should validate Weil algebra objects', () => {
      const weil = createWeilAlgebra('W', 'R', 'I', 2);
      const invalid = { name: 'W' };
      
      expect(isWeilAlgebra(weil)).toBe(true);
      expect(isWeilAlgebra(invalid)).toBe(false);
    });
  });

  describe('Spec Construction', () => {
    test('should create Spec construction with Yoneda isomorphism', () => {
      const weil = createWeilAlgebra('W', 'R', 'I', 2);
      const spec = createSpecConstruction(weil, 'C');
      
      expect(spec.kind).toBe('SpecConstruction');
      expect(spec.weilAlgebra).toBe(weil);
      expect(spec.category).toBe('C');
      expect(spec.specObject).toBe('Spec_C(W)');
      expect(spec.yonedaIsomorphism.exists).toBe(true);
      expect(spec.yonedaIsomorphism.isomorphism).toBe('ν: Hom(W, R) → Spec_C(W)');
      expect(spec.yonedaIsomorphism.naturality).toBe(true);
    });

    test('should validate Spec construction objects', () => {
      const weil = createWeilAlgebra('W', 'R', 'I', 2);
      const spec = createSpecConstruction(weil, 'C');
      const invalid = { weilAlgebra: weil };
      
      expect(isSpecConstruction(spec)).toBe(true);
      expect(isSpecConstruction(invalid)).toBe(false);
    });
  });

  describe('Axiom 1^W', () => {
    test('should create Axiom 1^W with all conditions', () => {
      const weil = createWeilAlgebra('W', 'R', 'I', 2);
      const axiom1W = createAxiom1W(weil);
      
      expect(axiom1W.kind).toBe('Axiom1W');
      expect(axiom1W.weilAlgebra).toBe(weil);
      expect(axiom1W.condition.forAllFunctions).toBe(true);
      expect(axiom1W.condition.uniqueExtension).toBe(true);
      expect(axiom1W.condition.linearity).toBe(true);
      expect(axiom1W.generalization.fromKockLawvere).toBe(true);
      expect(axiom1W.generalization.higherOrder).toBe(true);
      expect(axiom1W.generalization.nilpotentIdeal).toBe(true);
    });

    test('should validate Axiom 1^W objects', () => {
      const weil = createWeilAlgebra('W', 'R', 'I', 2);
      const axiom1W = createAxiom1W(weil);
      const invalid = { weilAlgebra: weil };
      
      expect(isAxiom1W(axiom1W)).toBe(true);
      expect(isAxiom1W(invalid)).toBe(false);
    });
  });

  describe('W(p,q) Weil Algebras', () => {
    test('should create W(2,3) Weil algebra with generators and relations', () => {
      const wpqWeil = createWpqWeilAlgebra('W(2,3)', 'R', 'I', 2, 3);
      
      expect(wpqWeil.kind).toBe('WpqWeilAlgebra');
      expect(wpqWeil.name).toBe('W(2,3)');
      expect(wpqWeil.p).toBe(2);
      expect(wpqWeil.q).toBe(3);
      expect(wpqWeil.generators).toEqual(['x_1', 'x_2']);
      expect(wpqWeil.relations).toEqual(['x_1^3 = 0', 'x_2^3 = 0']);
      expect(wpqWeil.dimension).toBe(6);
      expect(wpqWeil.dPqContainment.contains).toBe(true);
      expect(wpqWeil.dPqContainment.containment).toBe('D(2,3) ⊆ W(2,3)');
      expect(wpqWeil.dPqContainment.isomorphism).toBe('D(p,q) ≅ W(p,q)/I');
    });

    test('should validate W(p,q) Weil algebra objects', () => {
      const wpqWeil = createWpqWeilAlgebra('W(2,3)', 'R', 'I', 2, 3);
      const invalid = { name: 'W(2,3)' };
      
      expect(isWpqWeilAlgebra(wpqWeil)).toBe(true);
      expect(isWpqWeilAlgebra(invalid)).toBe(false);
    });
  });

  describe('D(p,q) Containment', () => {
    test('should create D(2,3) containment with higher-order infinitesimals', () => {
      const wpqWeil = createWpqWeilAlgebra('W(2,3)', 'R', 'I', 2, 3);
      const dpqContainment = createDPqContainment(2, 3, wpqWeil);
      
      expect(dpqContainment.kind).toBe('DPqContainment');
      expect(dpqContainment.p).toBe(2);
      expect(dpqContainment.q).toBe(3);
      expect(dpqContainment.weilAlgebra).toBe(wpqWeil);
      expect(dpqContainment.containment.dPqInWpq).toBe(true);
      expect(dpqContainment.containment.isomorphism).toBe('D(2,3) ≅ W(2,3)/I');
      expect(dpqContainment.containment.naturality).toBe(true);
      expect(dpqContainment.higherOrderInfinitesimals.hasHigherOrder).toBe(true);
      expect(dpqContainment.higherOrderInfinitesimals.order).toBe(3);
      expect(dpqContainment.higherOrderInfinitesimals.structure).toBe('x_i^3 = 0 for all i');
    });

    test('should validate D(p,q) containment objects', () => {
      const wpqWeil = createWpqWeilAlgebra('W(2,3)', 'R', 'I', 2, 3);
      const dpqContainment = createDPqContainment(2, 3, wpqWeil);
      const invalid = { p: 2, q: 3 };
      
      expect(isDPqContainment(dpqContainment)).toBe(true);
      expect(isDPqContainment(invalid)).toBe(false);
    });
  });

  describe('Higher-Order Infinitesimals', () => {
    test('should create higher-order infinitesimal with connections', () => {
      const weil = createWeilAlgebra('W', 'R', 'I', 2);
      const higherOrder = createHigherOrderInfinitesimal(3, weil);
      
      expect(higherOrder.kind).toBe('HigherOrderInfinitesimal');
      expect(higherOrder.order).toBe(3);
      expect(higherOrder.weilAlgebra).toBe(weil);
      expect(higherOrder.structure.generators).toEqual(['x']);
      expect(higherOrder.structure.relations).toEqual(['x^3 = 0']);
      expect(higherOrder.structure.nilpotency).toBe(3);
      expect(higherOrder.connection.toMinorBased).toBe(true);
      expect(higherOrder.connection.toPolynomialFunctors).toBe(true);
      expect(higherOrder.connection.toSyntheticCalculus).toBe(true);
    });

    test('should validate higher-order infinitesimal objects', () => {
      const weil = createWeilAlgebra('W', 'R', 'I', 2);
      const higherOrder = createHigherOrderInfinitesimal(3, weil);
      const invalid = { order: 3 };
      
      expect(isHigherOrderInfinitesimal(higherOrder)).toBe(true);
      expect(isHigherOrderInfinitesimal(invalid)).toBe(false);
    });
  });

  describe('Minor-Based Functions', () => {
    test('should create minor-based function with polynomial properties', () => {
      const weil = createWeilAlgebra('W', 'R', 'I', 2);
      const minorFunction = createMinorBasedFunction(weil, 'D', 'R');
      
      expect(minorFunction.kind).toBe('MinorBasedFunction');
      expect(minorFunction.weilAlgebra).toBe(weil);
      expect(minorFunction.function.domain).toBe('D');
      expect(minorFunction.function.codomain).toBe('R');
      expect(minorFunction.function.minorRepresentation).toBe('f(x) = Σ a_i x^i');
      expect(minorFunction.properties.isPolynomial).toBe(true);
      expect(minorFunction.properties.hasTaylorExpansion).toBe(true);
      expect(minorFunction.properties.preservesStructure).toBe(true);
    });

    test('should validate minor-based function objects', () => {
      const weil = createWeilAlgebra('W', 'R', 'I', 2);
      const minorFunction = createMinorBasedFunction(weil, 'D', 'R');
      const invalid = { weilAlgebra: weil };
      
      expect(isMinorBasedFunction(minorFunction)).toBe(true);
      expect(isMinorBasedFunction(invalid)).toBe(false);
    });
  });

  describe('Weil Algebra System', () => {
    test('should create empty Weil algebra system', () => {
      const system = createWeilAlgebraSystem();
      
      expect(system.kind).toBe('WeilAlgebraSystem');
      expect(system.algebras).toEqual([]);
      expect(system.specConstructions).toEqual([]);
      expect(system.axiom1W).toEqual([]);
      expect(system.wpqAlgebras).toEqual([]);
      expect(system.dpqContainments).toEqual([]);
      expect(system.higherOrderInfinitesimals).toEqual([]);
      expect(system.minorBasedFunctions).toEqual([]);
    });
  });

  describe('Integration Examples', () => {
    test('should integrate with existing SDG', () => {
      const weil = createWeilAlgebra('W', 'R', 'I', 2);
      const integration = integrateWithSDG(weil);
      
      expect(integration.kockLawvereConnection).toBe(true);
      expect(integration.infinitesimalObjects).toEqual(['D', 'D_k', 'D(n)', 'D_k(n)']);
      expect(integration.taylorSeries).toBe(true);
      expect(integration.vectorFields).toBe(true);
    });

    test('should connect to polynomial functors', () => {
      const weil = createWeilAlgebra('W', 'R', 'I', 2);
      const connection = connectToPolynomialFunctors(weil);
      
      expect(connection.preservesPullbacks).toBe(true);
      expect(connection.hasBeckChevalley).toBe(true);
      expect(connection.polynomialRepresentation).toBe('P(X) = Σ_{i=0}^{n} a_i X^i');
    });
  });

  describe('Example Usage', () => {
    test('should run example without throwing errors', () => {
      expect(() => exampleWeilAlgebraSystem()).not.toThrow();
    });
  });

  describe('Mathematical Properties', () => {
    test('should maintain Weil algebra properties under operations', () => {
      const weil1 = createWeilAlgebra('W1', 'R', 'I1', 2);
      const weil2 = createWeilAlgebra('W2', 'R', 'I2', 3);
      
      // Both should satisfy Axiom 1^W
      const axiom1W1 = createAxiom1W(weil1);
      const axiom1W2 = createAxiom1W(weil2);
      
      expect(axiom1W1.condition.forAllFunctions).toBe(true);
      expect(axiom1W2.condition.forAllFunctions).toBe(true);
      expect(axiom1W1.generalization.fromKockLawvere).toBe(true);
      expect(axiom1W2.generalization.fromKockLawvere).toBe(true);
    });

    test('should handle different dimensions correctly', () => {
      const weil1 = createWeilAlgebra('W1', 'R', 'I1', 1);
      const weil2 = createWeilAlgebra('W2', 'R', 'I2', 5);
      const weil3 = createWeilAlgebra('W3', 'R', 'I3', Infinity);
      
      expect(weil1.isFiniteDimensional).toBe(true);
      expect(weil2.isFiniteDimensional).toBe(true);
      expect(weil3.isFiniteDimensional).toBe(false);
    });

    test('should generate correct W(p,q) structures', () => {
      const wpq1 = createWpqWeilAlgebra('W(1,2)', 'R', 'I', 1, 2);
      const wpq2 = createWpqWeilAlgebra('W(3,4)', 'R', 'I', 3, 4);
      
      expect(wpq1.generators).toEqual(['x_1']);
      expect(wpq1.relations).toEqual(['x_1^2 = 0']);
      expect(wpq1.dimension).toBe(2);
      
      expect(wpq2.generators).toEqual(['x_1', 'x_2', 'x_3']);
      expect(wpq2.relations).toEqual(['x_1^4 = 0', 'x_2^4 = 0', 'x_3^4 = 0']);
      expect(wpq2.dimension).toBe(12);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero-dimensional Weil algebra', () => {
      const weil = createWeilAlgebra('W0', 'R', 'I', 0);
      
      expect(weil.dimension).toBe(0);
      expect(weil.isFiniteDimensional).toBe(true);
      expect(weil.hasYonedaIsomorphism).toBe(true);
    });

    test('should handle W(0,q) Weil algebra', () => {
      const wpqWeil = createWpqWeilAlgebra('W(0,3)', 'R', 'I', 0, 3);
      
      expect(wpqWeil.generators).toEqual([]);
      expect(wpqWeil.relations).toEqual([]);
      expect(wpqWeil.dimension).toBe(0);
    });

    test('should handle W(p,1) Weil algebra (no nilpotency)', () => {
      const wpqWeil = createWpqWeilAlgebra('W(2,1)', 'R', 'I', 2, 1);
      
      expect(wpqWeil.generators).toEqual(['x_1', 'x_2']);
      expect(wpqWeil.relations).toEqual(['x_1^1 = 0', 'x_2^1 = 0']);
      expect(wpqWeil.dimension).toBe(2);
    });
  });
});
