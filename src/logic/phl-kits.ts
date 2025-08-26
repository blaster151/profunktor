// src/logic/phl-kits.ts
import type { Context, Horn, Sequent, Sort, Term, Var } from "./phl-sequent";
import { defined } from "./phl-sequent";

// Totality axioms: > ⊢ f(x̄)↓  for every function symbol in Σ (Theorem 9). :contentReference[oaicite:6]{index=6}
export function totAxioms(symbols: readonly { name: string; inSorts: readonly Sort[]; outSort: Sort }[]): Sequent[] {
  return symbols.map(sym => {
    const Ex: Context = sym.inSorts.map((s, i) => ({ name: `x${i}`, sort: s }));
    const app: Term = { kind: "app", sym: sym.name, args: Ex.map(v => ({ kind: "var", name: v.name, sort: v.sort })), sort: sym.outSort };
    const lhs: Horn = { all: [] };
    const rhs: Horn = { all: [defined(app)] };
    return { ctx: Ex, lhs, rhs };
  });
}

// Quasi-equational T_cat (objects/arr; total id,d,c; partial ◦ with domain d(f)=c(g)) (Example 4). :contentReference[oaicite:7]{index=7}
export function Tcat_signature() {
  return {
    sorts: ["obj", "arr"] as const,
    funcs: [
      { name: "id", inSorts: ["obj" as const], outSort: "arr" as const },
      { name: "d",  inSorts: ["arr" as const], outSort: "obj" as const },
      { name: "c",  inSorts: ["arr" as const], outSort: "obj" as const },
      { name: "comp", inSorts: ["arr","arr"] as const, outSort: "arr" as const } // ◦
    ]
  };
}

// Quasi-equational T_gr (graphs): total d,c on arr (Example 5). :contentReference[oaicite:8]{index=8}
export function Tgr_signature() {
  return {
    sorts: ["obj", "arr"] as const,
    funcs: [
      { name: "d",  inSorts: ["arr" as const], outSort: "obj" as const },
      { name: "c",  inSorts: ["arr" as const], outSort: "obj" as const },
    ]
  };
}
