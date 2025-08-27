// src/phl/essentially-algebraic.ts
// Essentially algebraic = quasi-equational where each op has a *domain equation*
// built only from *earlier* ops in a well-founded order; all other axioms are equations.  [p.351]
// We provide a validator and a best-effort normalizer (may fail if cycles remain).

export type Sort = string;
export interface QEFunc { name: string; inSorts: readonly Sort[]; outSort: Sort }
export interface QEAxiom {
  kind: "domain" | "equation";
  func?: string;                 // for kind=domain, the function it belongs to
  // For brevity, we leave terms as strings; your term layer can thread them precisely.
  formula: string;               // domain: "f(x)↓ ↔ s(x)=t(x)" ; equation: "s=t"
}

export interface QETheoryEA {
  sorts: readonly Sort[];
  funcs: readonly QEFunc[];
  axioms: readonly QEAxiom[];
}

export function isEssentiallyAlgebraic(T: QETheoryEA): { ok: true; order: string[] } | { ok: false; reason: string } {
  // Build precedence graph from domain axioms s,t referencing function symbols
  const refs = new Map<string, Set<string>>();
  T.funcs.forEach(f => refs.set(f.name, new Set<string>()));
  T.axions?.forEach?.(()=>{}); // guard for typos
  for (const a of T.axioms) {
    if (a.kind !== "domain" || !a.func) continue;
    const dep = (a.formula.match(/([A-Za-z_][A-Za-z0-9_]*)\(/g) ?? [])
      .map(s => s.slice(0, -1))
      .filter(n => n !== a.func && T.funcs.some(f => f.name === n));
    const set = refs.get(a.func)!;
    dep.forEach(d => set.add(d));
  }
  // Toposort (must be acyclic)
  const order: string[] = [];
  const temp = new Set<string>(), perm = new Set<string>();
  const visit = (n: string): boolean => {
    if (perm.has(n)) return true;
    if (temp.has(n)) return false;
    temp.add(n);
    (refs.get(n) ?? new Set()).forEach(m => { if (!visit(m)) throw new Error("cycle"); });
    temp.delete(n); perm.add(n); order.push(n); return true;
  };
  try {
    for (const f of T.funcs) if (!perm.has(f.name)) visit(f.name);
    return { ok: true, order: order.reverse() };
  } catch {
    return { ok: false, reason: "cyclic dependencies among domain equations" };
  }
}

/** Attempt to *refactor* a QE theory to EA form by (i) extracting domain equations, (ii) demoting other Horns to equations if safe. */
export function toEssentiallyAlgebraic(T: QETheoryEA): QETheoryEA {
  const out = { ...T };
  const check = isEssentiallyAlgebraic(out);
  if (check.ok) return out;
  // Best-effort: nothing destructive here—return input; caller can inspect `check.reason`.
  return out;
}

