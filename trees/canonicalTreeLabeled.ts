// src/trees/canonicalTreeLabeled.ts
// AHU-style canonical code + exact automorphism size for labeled rooted unordered trees.

export type Lbl = string | number | symbol;
export type LTree<L extends Lbl = string> = { label?: L; children?: LTree<L>[] };

export interface CanonicalInfo {
  code: string;         // canonical parenthesized string with labels
  aut: bigint;          // |Aut(tree)| as BigInt
}

function factorialBig(n: bigint): bigint {
  let acc = 1n; for (let i = 2n; i <= n; i++) acc *= i; return acc;
}

export function canonicalizeLabeled<L extends Lbl>(t: LTree<L>): CanonicalInfo {
  if (!t.children || t.children.length === 0) {
    const lbl = t.label === undefined ? "#" : String(t.label);
    return { code: `(${lbl})`, aut: 1n };
  }

  // compute child infos
  const infos = t.children.map(canonicalizeLabeled);
  
  // group by (label, code) pairs for labeled canonicalization
  const buckets = new Map<string, { count: bigint; aut: bigint }>();
  for (const { code, aut } of infos) {
    const b = buckets.get(code);
    if (b) b.count += 1n;
    else buckets.set(code, { count: 1n, aut });
  }

  // sorted codes for canonical representation
  const codes = [...buckets.keys()].sort();

  // automorphism: ∏ aut_i^{m_i} * ∏ m_i!
  let aut = 1n;
  for (const code of codes) {
    const { count, aut: a } = buckets.get(code)!;
    // a^count
    let pow = 1n; for (let i = 0n; i < count; i++) pow *= a;
    aut *= pow;
    aut *= factorialBig(count);
  }

  const expanded = codes.flatMap(code => Array(Number(buckets.get(code)!.count)).fill(code));
  const lbl = t.label === undefined ? "#" : String(t.label);
  const code = `(${lbl}|${expanded.join("")})`;

  return { code, aut };
}
