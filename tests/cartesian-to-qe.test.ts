import { cartesianToQuasiEquational, CTTheory, CTFunc, CTPred, CTAxiom, CTFormula } from "../src/phl/cartesian-to-qe";

describe("Cartesian to Quasi-Equational Theory Conversion", () => {
  
  describe("Basic conversion", () => {
    test("should convert simple cartesian theory", () => {
      // Simple cartesian theory: one sort S, one predicate P, one axiom
      const cartesianTheory: CTTheory = {
        sorts: ["S"],
        funcs: [],
        preds: [{ name: "P", argSorts: ["S"] }],
        axioms: [
          {
            ctx: [{ name: "x", sort: "S" }],
            lhs: { kind: "pred", name: "P", args: ["x"] },
            rhs: { kind: "top" }
          }
        ]
      };

      const qeTheory = cartesianToQuasiEquational(cartesianTheory);

      expect(qeTheory.sorts).toContain("S");
      expect(qeTheory.sorts).toContain("U"); // Should add unit sort
      expect(qeTheory.funcs.length).toBeGreaterThan(0);
      expect(qeTheory.axioms.length).toBeGreaterThan(0);

      // Should have function f_P for predicate P
      const fP = qeTheory.funcs.find(f => f.name === "f_P");
      expect(fP).toBeDefined();
      expect(fP?.inSorts).toEqual(["S"]);
      expect(fP?.outSort).toBe("U");
    });

    test("should handle empty theory", () => {
      const emptyTheory: CTTheory = {
        sorts: [],
        funcs: [],
        preds: [],
        axioms: []
      };

      const qeTheory = cartesianToQuasiEquational(emptyTheory);

      expect(qeTheory.sorts).toContain("U"); // Should always add unit sort
      expect(qeTheory.funcs.length).toBeGreaterThan(0); // Should have unit constant
      expect(qeTheory.axioms.length).toBeGreaterThan(0); // Should have unit axioms
    });
  });

  describe("Formula encoding", () => {
    test("should encode equality formulas", () => {
      const theory: CTTheory = {
        sorts: ["S"],
        funcs: [],
        preds: [],
        axioms: [
          {
            ctx: [{ name: "x", sort: "S" }, { name: "y", sort: "S" }],
            lhs: { kind: "eq", left: "x", right: "y" },
            rhs: { kind: "top" }
          }
        ]
      };

      const qeTheory = cartesianToQuasiEquational(theory);
      expect(qeTheory.axioms.length).toBeGreaterThan(0);
    });

    test("should encode conjunction formulas", () => {
      const theory: CTTheory = {
        sorts: ["S"],
        funcs: [],
        preds: [{ name: "P", argSorts: ["S"] }, { name: "Q", argSorts: ["S"] }],
        axioms: [
          {
            ctx: [{ name: "x", sort: "S" }],
            lhs: { 
              kind: "and", 
              l: { kind: "pred", name: "P", args: ["x"] },
              r: { kind: "pred", name: "Q", args: ["x"] }
            },
            rhs: { kind: "top" }
          }
        ]
      };

      const qeTheory = cartesianToQuasiEquational(theory);
      
      // Should have functions for both predicates
      expect(qeTheory.funcs.some(f => f.name === "f_P")).toBe(true);
      expect(qeTheory.funcs.some(f => f.name === "f_Q")).toBe(true);
    });

    test("should encode exists1 formulas", () => {
      const theory: CTTheory = {
        sorts: ["S"],
        funcs: [],
        preds: [{ name: "P", argSorts: ["S"] }],
        axioms: [
          {
            ctx: [{ name: "x", sort: "S" }],
            lhs: { 
              kind: "exists1", 
              bound: { name: "y", sort: "S" },
              body: { kind: "pred", name: "P", args: ["y"] }
            },
            rhs: { kind: "top" }
          }
        ]
      };

      const qeTheory = cartesianToQuasiEquational(theory);
      
      // Should have witness function for exists1
      const witnessFuncs = qeTheory.funcs.filter(f => f.name.startsWith("W_"));
      expect(witnessFuncs.length).toBeGreaterThan(0);
      expect(witnessFuncs[0].outSort).toBe("S");
    });
  });

  describe("Theory structure preservation", () => {
    test("should preserve sorts from original theory", () => {
      const theory: CTTheory = {
        sorts: ["A", "B", "C"],
        funcs: [],
        preds: [],
        axioms: []
      };

      const qeTheory = cartesianToQuasiEquational(theory);
      
      expect(qeTheory.sorts).toContain("A");
      expect(qeTheory.sorts).toContain("B");
      expect(qeTheory.sorts).toContain("C");
      expect(qeTheory.sorts).toContain("U");
    });

    test("should preserve functions from original theory", () => {
      const theory: CTTheory = {
        sorts: ["S"],
        funcs: [
          { name: "f", inSorts: ["S"], outSort: "S" },
          { name: "g", inSorts: ["S", "S"], outSort: "S" }
        ],
        preds: [],
        axioms: []
      };

      const qeTheory = cartesianToQuasiEquational(theory);
      
      // Should preserve original functions
      expect(qeTheory.funcs.some(f => f.name === "f")).toBe(true);
      expect(qeTheory.funcs.some(f => f.name === "g")).toBe(true);
      
      // Should add unit constant
      expect(qeTheory.funcs.some(f => f.name === "u")).toBe(true);
    });
  });

  describe("Unit sort axioms", () => {
    test("should include unit sort axioms", () => {
      const theory: CTTheory = {
        sorts: ["S"],
        funcs: [],
        preds: [],
        axioms: []
      };

      const qeTheory = cartesianToQuasiEquational(theory);
      
      // Should have axioms for unit sort
      const unitAxioms = qeTheory.axioms.filter(ax => 
        ax.rhs.includes("u()") || ax.rhs.includes("defined(u())")
      );
      expect(unitAxioms.length).toBeGreaterThan(0);
    });
  });

  describe("Complex theory conversion", () => {
    test("should handle theory with multiple components", () => {
      const complexTheory: CTTheory = {
        sorts: ["A", "B"],
        funcs: [
          { name: "f", inSorts: ["A"], outSort: "B" }
        ],
        preds: [
          { name: "P", argSorts: ["A"] },
          { name: "Q", argSorts: ["B"] }
        ],
        axioms: [
          {
            ctx: [{ name: "x", sort: "A" }],
            lhs: { kind: "pred", name: "P", args: ["x"] },
            rhs: { kind: "pred", name: "Q", args: ["f(x)"] }
          }
        ]
      };

      const qeTheory = cartesianToQuasiEquational(complexTheory);
      
      expect(qeTheory.sorts).toEqual(expect.arrayContaining(["A", "B", "U"]));
      expect(qeTheory.funcs.some(f => f.name === "f")).toBe(true);
      expect(qeTheory.funcs.some(f => f.name === "f_P")).toBe(true);
      expect(qeTheory.funcs.some(f => f.name === "f_Q")).toBe(true);
      expect(qeTheory.funcs.some(f => f.name === "u")).toBe(true);
    });
  });
});
