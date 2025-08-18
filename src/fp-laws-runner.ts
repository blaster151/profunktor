// src/fp-laws-runner.ts
import { collectSuites } from "./fp-laws-attach";

export type RunResult = {
  subject: string;
  passed: number;
  failed: { name: string; message: string }[];
};

export function runAll(seed = 2025): RunResult[] {
  const out: RunResult[] = [];
  for (const suite of collectSuites()) {
    const failed: RunResult["failed"] = [];
    let passed = 0;
    // give each law a fresh-ish seed
    let lawSeed = seed;
    for (const law of suite.laws) {
      const res = law.run(lawSeed);
      lawSeed = (lawSeed * 1103515245 + 12345) >>> 0;
      if (res === true) passed++;
      else failed.push({ name: law.name, message: typeof res === "string" ? res : "failed" });
    }
    out.push({ subject: suite.subject, passed, failed });
  }
  return out;
}

export function printReport(rs: RunResult[]) {
  let ok = 0, total = 0;
  for (const r of rs) {
    total += r.passed + r.failed.length;
    ok += r.passed;
    const status = r.failed.length === 0 ? "✅" : "❌";
    console.log(`${status} ${r.subject}: ${r.passed} passed, ${r.failed.length} failed`);
    for (const f of r.failed) console.log(`   • ${f.name}: ${f.message}`);
  }
  console.log(`\nCoverage: ${ok}/${total} laws passed`);
}

// Quick CLI - call this function to run all laws
export function main() {
  printReport(runAll());
}
