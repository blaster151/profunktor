import { ThOfC, SmallCart, Obj, Mor, Mono, PMap, Pullback } from "../src/meta/th-of-C";
import type { RegularTheory } from "../src/logic/regular-cartesian";

describe("ThOfC - Theory of a Small Cartesian Category", () => {
  
  describe("Basic category with identities", () => {
    const simpleCart: SmallCart = {
      objects: [
        { id: "A" },
        { id: "B" }
      ],
      morphisms: [
        { id: "id_A", src: "A", dst: "A" },
        { id: "id_B", src: "B", dst: "B" },
        { id: "f", src: "A", dst: "B" }
      ],
      monos: [],
      pmaps: [],
      pullbacks: []
    };

    test("should construct theory with identity axioms", () => {
      const theory = ThOfC(simpleCart);
      
      expect(theory).toBeDefined();
      expect(theory.axioms).toBeDefined();
      expect(theory.axioms.length).toBeGreaterThan(0);
      
      // Should have totality axioms for all morphisms
      const totalityAxioms = theory.axioms.filter(ax => 
        ax.lhs.all.some(atom => 
          atom.kind === "rel" && atom.rel.startsWith("f_")
        )
      );
      expect(totalityAxioms.length).toBeGreaterThan(0);
    });

    test("should include identity behavior axioms (f1)", () => {
      const theory = ThOfC(simpleCart);
      
      // Look for identity axioms: ⊤ ⊢ x = Id_A(x)
      const identityAxioms = theory.axioms.filter(ax => 
        ax.rhs.all.some(atom => 
          atom.kind === "eq" && atom.leftVar === "x" && atom.rightVar === "y"
        ) && ax.lhs.all.some(atom => 
          atom.kind === "rel" && atom.rel.startsWith("f_id_")
        )
      );
      expect(identityAxioms.length).toBeGreaterThan(0);
    });
  });

  describe("Category with composition", () => {
    const compCart: SmallCart = {
      objects: [
        { id: "A" },
        { id: "B" },
        { id: "C" }
      ],
      morphisms: [
        { id: "id_A", src: "A", dst: "A" },
        { id: "id_B", src: "B", dst: "B" },
        { id: "id_C", src: "C", dst: "C" },
        { id: "f", src: "A", dst: "B" },
        { id: "g", src: "B", dst: "C" },
        { id: "(g∘f)", src: "A", dst: "C" }
      ],
      monos: [],
      pmaps: [],
      pullbacks: []
    };

    test("should include functoriality axioms (f2)", () => {
      const theory = ThOfC(compCart);
      
      // Look for functoriality axioms: ḡ(f̄(x)) = (g∘f)(x)
      const functorialityAxioms = theory.axioms.filter(ax => 
        ax.lhs.all.some(atom => 
          atom.kind === "rel" && atom.rel === "f_(g∘f)"
        )
      );
      expect(functorialityAxioms.length).toBeGreaterThan(0);
    });
  });

  describe("Category with monos", () => {
    const monoCart: SmallCart = {
      objects: [
        { id: "A" },
        { id: "B" }
      ],
      morphisms: [
        { id: "id_A", src: "A", dst: "A" },
        { id: "id_B", src: "B", dst: "B" },
        { id: "d", src: "A", dst: "B" }
      ],
      monos: [
        { id: "d", src: "A", dst: "B" }
      ],
      pmaps: [],
      pullbacks: []
    };



    test("should include mono axioms (m1, m2)", () => {
      const theory = ThOfC(monoCart);
      
      // Look for mono axioms with tilde relations
      const monoAxioms = theory.axioms.filter(ax => 
        ax.lhs.all.some(atom => 
          atom.kind === "rel" && atom.rel.startsWith("tilde_")
        )
      );
      expect(monoAxioms.length).toBeGreaterThan(0);
      
      // Should have both (m1) and (m2) axioms
      const m1Axioms = theory.axioms.filter(ax => 
        ax.rhs.all.some(atom => 
          atom.kind === "eq" && atom.leftVar === "y" && atom.rightVar === "x"
        ) && ax.lhs.all.some(atom => 
          atom.kind === "rel" && atom.rel.startsWith("tilde_")
        )
      );
      expect(m1Axioms.length).toBeGreaterThan(0);
    });
  });

  describe("Category with partial morphisms", () => {
    const partialCart: SmallCart = {
      objects: [
        { id: "A" },
        { id: "B" },
        { id: "C" }
      ],
      morphisms: [
        { id: "id_A", src: "A", dst: "A" },
        { id: "id_B", src: "B", dst: "B" },
        { id: "id_C", src: "C", dst: "C" },
        { id: "d_f", src: "A", dst: "B" },
        { id: "m_f", src: "B", dst: "C" }
      ],
      monos: [
        { id: "d_f", src: "A", dst: "B" }
      ],
      pmaps: [
        { id: "f", domMono: "d_f", mediates: "m_f" }
      ],
      pullbacks: []
    };

    test("should include partial morphism axioms (pm1, pm2)", () => {
      const theory = ThOfC(partialCart);
      
      // Look for partial morphism axioms with p_ relations
      const partialAxioms = theory.axioms.filter(ax => 
        ax.lhs.all.some(atom => 
          atom.kind === "rel" && atom.rel.startsWith("p_")
        )
      );
      expect(partialAxioms.length).toBeGreaterThan(0);
      
      // Should have domain guard axioms (pm1)
      const pm1Axioms = theory.axioms.filter(ax => 
        ax.lhs.all.some(atom => 
          atom.kind === "rel" && atom.rel.startsWith("p_")
        ) && ax.lhs.all.some(atom => 
          atom.kind === "rel" && atom.rel.startsWith("tilde_")
        )
      );
      expect(pm1Axioms.length).toBeGreaterThan(0);
    });
  });

  describe("Category with pullbacks", () => {
    const pullbackCart: SmallCart = {
      objects: [
        { id: "A" },
        { id: "B" },
        { id: "C" },
        { id: "D" },
        { id: "P" }
      ],
      morphisms: [
        { id: "id_A", src: "A", dst: "A" },
        { id: "id_B", src: "B", dst: "B" },
        { id: "id_C", src: "C", dst: "C" },
        { id: "id_D", src: "D", dst: "D" },
        { id: "id_P", src: "P", dst: "P" },
        { id: "f", src: "A", dst: "C" },
        { id: "g", src: "B", dst: "C" },
        { id: "p", src: "P", dst: "A" },
        { id: "q", src: "P", dst: "B" }
      ],
      monos: [],
      pmaps: [],
      pullbacks: [
        {
          id: "pb1",
          objB: "B",
          objC: "C", 
          objD: "D",
          f: "f",
          g: "g",
          p: "p",
          q: "q"
        }
      ]
    };

    test("should include pullback axioms (pb1-pb4)", () => {
      const theory = ThOfC(pullbackCart);
      
      // Look for pullback axioms with r_ relations
      const pullbackAxioms = theory.axioms.filter(ax => 
        ax.lhs.all.some(atom => 
          atom.kind === "rel" && atom.rel.startsWith("r_")
        )
      );
      expect(pullbackAxioms.length).toBeGreaterThan(0);
      
      // Should have domain guard axioms (pb1)
      const pb1Axioms = theory.axioms.filter(ax => 
        ax.lhs.all.some(atom => 
          atom.kind === "rel" && atom.rel.startsWith("f_")
        ) && ax.rhs.all.some(atom => 
          atom.kind === "rel" && atom.rel.startsWith("r_")
        )
      );
      expect(pb1Axioms.length).toBeGreaterThan(0);
    });
  });

  describe("Complex category with all features", () => {
    const complexCart: SmallCart = {
      objects: [
        { id: "A" },
        { id: "B" },
        { id: "C" },
        { id: "P" }
      ],
      morphisms: [
        { id: "id_A", src: "A", dst: "A" },
        { id: "id_B", src: "B", dst: "B" },
        { id: "id_C", src: "C", dst: "C" },
        { id: "id_P", src: "P", dst: "P" },
        { id: "f", src: "A", dst: "B" },
        { id: "g", src: "B", dst: "C" },
        { id: "(g∘f)", src: "A", dst: "C" },
        { id: "d", src: "A", dst: "B" },
        { id: "m", src: "B", dst: "C" },
        { id: "p", src: "P", dst: "A" },
        { id: "q", src: "P", dst: "B" }
      ],
      monos: [
        { id: "d", src: "A", dst: "B" }
      ],
      pmaps: [
        { id: "pm", domMono: "d", mediates: "m" }
      ],
      pullbacks: [
        {
          id: "pb",
          objB: "B",
          objC: "C",
          objD: "D", 
          f: "f",
          g: "g",
          p: "p",
          q: "q"
        }
      ]
    };

    test("should construct complete theory with all axiom types", () => {
      const theory = ThOfC(complexCart);
      
      expect(theory).toBeDefined();
      expect(theory.axioms).toBeDefined();
      expect(theory.axioms.length).toBeGreaterThan(0);
      
      // Check for all types of axioms
      const hasTotalityAxioms = theory.axioms.some(ax => 
        ax.lhs.all.some(atom => 
          atom.kind === "rel" && atom.rel.startsWith("f_")
        )
      );
      expect(hasTotalityAxioms).toBe(true);
      
      const hasMonoAxioms = theory.axioms.some(ax => 
        ax.lhs.all.some(atom => 
          atom.kind === "rel" && atom.rel.startsWith("tilde_")
        )
      );
      expect(hasMonoAxioms).toBe(true);
      
      const hasPartialAxioms = theory.axioms.some(ax => 
        ax.lhs.all.some(atom => 
          atom.kind === "rel" && atom.rel.startsWith("p_")
        )
      );
      expect(hasPartialAxioms).toBe(true);
      
      const hasPullbackAxioms = theory.axioms.some(ax => 
        ax.lhs.all.some(atom => 
          atom.kind === "rel" && atom.rel.startsWith("r_")
        )
      );
      expect(hasPullbackAxioms).toBe(true);
    });

    test("should have correct signature structure", () => {
      const theory = ThOfC(complexCart);
      
      expect(theory.sigma).toBeDefined();
      expect(theory.sigma.sorts).toBeDefined();
      expect(theory.sigma.relations).toBeDefined();
      
      // Should include basic cartesian sorts
      expect(theory.sigma.sorts).toContain("arr");
    });
  });

  describe("Edge cases", () => {
    test("should handle empty category", () => {
      const emptyCart: SmallCart = {
        objects: [],
        morphisms: [],
        monos: [],
        pmaps: [],
        pullbacks: []
      };
      
      const theory = ThOfC(emptyCart);
      expect(theory).toBeDefined();
      expect(theory.axioms).toBeDefined();
    });

    test("should handle category with only objects", () => {
      const objectsOnlyCart: SmallCart = {
        objects: [{ id: "A" }, { id: "B" }],
        morphisms: [],
        monos: [],
        pmaps: [],
        pullbacks: []
      };
      
      const theory = ThOfC(objectsOnlyCart);
      expect(theory).toBeDefined();
      expect(theory.axioms).toBeDefined();
    });

    test("should handle category with only identities", () => {
      const identitiesOnlyCart: SmallCart = {
        objects: [{ id: "A" }],
        morphisms: [{ id: "id_A", src: "A", dst: "A" }],
        monos: [],
        pmaps: [],
        pullbacks: []
      };
      
      const theory = ThOfC(identitiesOnlyCart);
      expect(theory).toBeDefined();
      expect(theory.axioms.length).toBeGreaterThan(0);
    });
  });

  describe("Theory structure validation", () => {
    const testCart: SmallCart = {
      objects: [{ id: "A" }, { id: "B" }],
      morphisms: [
        { id: "id_A", src: "A", dst: "A" },
        { id: "id_B", src: "B", dst: "B" },
        { id: "f", src: "A", dst: "B" }
      ],
      monos: [],
      pmaps: [],
      pullbacks: []
    };

    test("should produce valid RegularTheory structure", () => {
      const theory = ThOfC(testCart);
      
      // Check theory structure
      expect(theory).toHaveProperty("sigma");
      expect(theory).toHaveProperty("axioms");
      expect(Array.isArray(theory.axioms)).toBe(true);
      
      // Check axiom structure
      theory.axioms.forEach(axiom => {
        expect(axiom).toHaveProperty("forall");
        expect(axiom).toHaveProperty("lhs");
        expect(axiom).toHaveProperty("exists");
        expect(axiom).toHaveProperty("rhs");
        expect(axiom).toHaveProperty("unique");
        
        expect(Array.isArray(axiom.forall)).toBe(true);
        expect(Array.isArray(axiom.exists)).toBe(true);
        expect(axiom.lhs).toHaveProperty("all");
        expect(axiom.rhs).toHaveProperty("all");
        expect(Array.isArray(axiom.lhs.all)).toBe(true);
        expect(Array.isArray(axiom.rhs.all)).toBe(true);
      });
    });

    test("should have consistent variable usage", () => {
      const theory = ThOfC(testCart);
      
      theory.axioms.forEach(axiom => {
        // Check that variables in forall are used in lhs (if lhs is not empty)
        if (axiom.lhs.all.length > 0) {
          const forallVars = new Set(axiom.forall.map(v => v.name));
          const lhsVars = new Set<string>();
          
          axiom.lhs.all.forEach(atom => {
            if (atom.kind === "rel") {
              atom.vars.forEach(v => lhsVars.add(v));
            } else if (atom.kind === "eq") {
              lhsVars.add(atom.leftVar);
              lhsVars.add(atom.rightVar);
            }
          });
          
          // All forall variables should appear in lhs
          forallVars.forEach(v => {
            expect(lhsVars.has(v)).toBe(true);
          });
        }
      });
    });
  });
});
