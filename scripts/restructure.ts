/*
  Restructure script (dry-run and execute)

  - Computes a mapping from current files to new locations under src/
  - Normalizes names by removing a leading "fp-" prefix
  - Groups files into topic folders based on filename patterns
  - Updates import specifiers to point to new paths (absolute from src/)
  - Can generate a full Markdown report of the plan in docs/RESTRUCTURE_PLAN.md

  Usage:
    - Dry run (no changes, write plan):
        npx tsx scripts/restructure.ts --dry-run
    - Execute (apply moves and rewrite imports):
        npx tsx scripts/restructure.ts --apply

  Notes:
    - Only moves TypeScript source files that are part of the library (root-level fp-*.ts and select folders).
    - Leaves tests (tests/**), docs/**, examples/**, runnable/**, papers/** unchanged.
    - Moves existing src/fp-*.ts files into grouped subfolders and removes the fp- prefix.
*/

import { promises as fs } from 'fs';
import path from 'path';

type Move = { fromAbs: string; toAbs: string; fromRel: string; toRel: string };
type ImportChange = { fileAbs: string; from: string; to: string };

const repoRoot = path.resolve('.');
const srcRoot = path.join(repoRoot, 'src');
const planPath = path.join(repoRoot, 'docs', 'RESTRUCTURE_PLAN.md');

function isTsFile(p: string): boolean {
  return p.endsWith('.ts') && !p.endsWith('.d.ts');
}

function withoutExt(p: string): string {
  return p.replace(/\.[jt]sx?$/, '');
}

function stripFpPrefix(name: string): string {
  return name.startsWith('fp-') ? name.slice(3) : name;
}

function ensureDirname(p: string): string {
  return p.endsWith(path.sep) ? p : p + path.sep;
}

// Folder grouping rules: ordered list; first match wins
const GROUPS: Array<{ name: string; rationale: string; match: (base: string, fullRel: string) => boolean; destDir: string }>= [
  {
    name: 'core',
    rationale: 'Core kinds, typeclasses, natural transformations, small algebraic utilities. These are foundational and imported broadly.',
    match: (b) => /^(hkt(\b|-)|typeclasses(\b|-)|nat\b|semiring\b|monoids\b|variance|yoneda\b|partial\b|trampoline\b|readonly|immutable\b)$/.test(stripFpPrefix(withoutExt(b))),
    destDir: 'src/core',
  },
  {
    name: 'data/either',
    rationale: 'Either data type and related helpers live under data/either for discoverability and cohesion.',
    match: (b) => /^fp-either/.test(b),
    destDir: 'src/data/either',
  },
  {
    name: 'data/maybe',
    rationale: 'Maybe/Option and their unified builders go under data/maybe as algebraic data types.',
    match: (b) => /^fp-maybe/.test(b) || /^fp-option/.test(b),
    destDir: 'src/data/maybe',
  },
  {
    name: 'data/result',
    rationale: 'Result/Ok/Err and their unified interfaces are grouped together under data/result.',
    match: (b) => /^fp-result/.test(b),
    destDir: 'src/data/result',
  },
  {
    name: 'optics',
    rationale: 'Profunctor optics core, instances, laws, and utilities belong under optics for a single entry point.',
    match: (b) => /^fp-optics/.test(b) || /bazaar/.test(b),
    destDir: 'src/optics',
  },
  {
    name: 'free',
    rationale: 'Free/Cofree modules and related constructions clustered for recursion schemes and categorical encodings.',
    match: (b) => /^fp-free/.test(b) || /^fp-cofree/.test(b) || /^fp-cokleisli/.test(b) || /free-monad/.test(b),
    destDir: 'src/free',
  },
  {
    name: 'arrow',
    rationale: 'Arrow/Kleisli/CoKleisli abstractions and SF/Mealy related laws and implementations.',
    match: (b) => /^fp-arrows?/.test(b) || /^fp-sf-/.test(b) || /^fp-mealy/.test(b) || /arrowchoice/.test(b),
    destDir: 'src/arrow',
  },
  {
    name: 'stream',
    rationale: 'Stream core, fusion, state, and coordination modules unified under a dedicated stream namespace.',
    match: (b) => /^fp-stream/.test(b) || /observable/.test(b) || /dot-?stream/.test(b),
    destDir: 'src/stream',
  },
  {
    name: 'effects',
    rationale: 'Effect monads and IO/Task/State variants grouped as effect systems.',
    match: (b) => /^fp-effect/.test(b) || /purity/.test(b),
    destDir: 'src/effects',
  },
  {
    name: 'polynomial',
    rationale: 'Polynomial functors, their algebras, monads, and categorical characterizations.',
    match: (b, rel) => /^fp-polynomial/.test(b) || rel.startsWith('poly/'),
    destDir: 'src/polynomial',
  },
  {
    name: 'lawvere',
    rationale: 'Lawvere theories and comodel formulations co-located for algebraic effects work.',
    match: (b) => /lawvere/.test(b),
    destDir: 'src/lawvere',
  },
  {
    name: 'category',
    rationale: 'General category-theoretic bridges and utilities that are not specific to bicategories or homotopy.',
    match: (b) => /(adjunction|algebra|monoidal(?!-laws)|monoid(?!s$)|yoneda|morphisms|category|compact-closed|commutative-applicative)/.test(b),
    destDir: 'src/category',
  },
  {
    name: 'bicategory',
    rationale: 'Bicategory-specific modules; retains existing src/bicategory structure.',
    match: (_b, rel) => rel.startsWith('src/bicategory/'),
    destDir: 'src/bicategory',
  },
  {
    name: 'homotopy',
    rationale: 'Homotopy/type-theory bridges and synthetic differential geometry under dedicated research domains.',
    match: (b) => /(homotopy|tangent|topological-quantum|kripke-joyal|khavkine-schreiber|sdg|simplicial)/.test(b),
    destDir: 'src/homotopy',
  },
  {
    name: 'math',
    rationale: 'General math helpers and rational arithmetic grouped under math.',
    match: (_b, rel) => rel.startsWith('math/'),
    destDir: 'src/math',
  },
  {
    name: 'trees',
    rationale: 'Tree utilities and canonical trees maintained under a trees namespace.',
    match: (_b, rel) => rel.startsWith('trees/'),
    destDir: 'src/trees',
  },
  {
    name: 'fluent',
    rationale: 'Fluent API and related runtime installation kept in a dedicated namespace.',
    match: (b, rel) => /^fp-fluent/.test(b) || rel.startsWith('src/fluent/'),
    destDir: 'src/fluent',
  },
  {
    name: 'util',
    rationale: 'Small utilities that don’t fit elsewhere. These provide glue code and helpers used across modules. Keeping them in one place reduces incidental dependencies.',
    match: (b) => /(readonly|immutable|interrupt|registry|usageRegistry|operatorMetadata)/.test(b),
    destDir: 'src/util',
  },
  {
    name: 'legacy',
    rationale: 'Items not recognized by rules go to legacy for manual triage with minimal disruption.',
    match: (_b) => true,
    destDir: 'src/legacy',
  },
];

async function listAllTsFiles(): Promise<string[]> {
  // Simple recursive walk to avoid extra deps
  async function walk(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const out: string[] = [];
    for (const e of entries) {
      const full = path.join(dir, e.name);
      const rel = path.relative(repoRoot, full);
      if (rel.startsWith('node_modules') || rel.startsWith('dist')) continue;
      if (rel.startsWith('docs') || rel.startsWith('papers')) continue;
      if (rel.startsWith('tests')) continue;
      if (rel.startsWith('examples')) continue;
      if (rel.startsWith('runnable')) continue;
      if (e.isDirectory()) {
        out.push(...await walk(full));
      } else if (isTsFile(e.name)) {
        out.push(rel);
      }
    }
    return out;
  }
  return walk(repoRoot);
}

function chooseDest(relPath: string): { destDir: string; newBase: string } {
  const base = path.basename(relPath);
  const baseNoExt = withoutExt(base);
  // Only strip fp- prefix for modules that start with it
  const normalizedBaseNoExt = stripFpPrefix(baseNoExt);

  for (const g of GROUPS) {
    if (g.match(base, relPath)) {
      return { destDir: g.destDir, newBase: normalizedBaseNoExt + '.ts' };
    }
  }
  // Fallback to legacy
  return { destDir: 'src/legacy', newBase: normalizedBaseNoExt + '.ts' };
}

async function computeMoves(allFiles: string[]): Promise<Move[]> {
  const moves: Move[] = [];
  for (const rel of allFiles) {
    // Only move items that are not already under src/, or that reside in src with an fp- prefix
    const isUnderSrc = rel.startsWith('src' + path.sep);
    const base = path.basename(rel);
    const shouldConsider = !isUnderSrc || base.startsWith('fp-');
    if (!shouldConsider) continue;

    const { destDir, newBase } = chooseDest(rel);
    const toRel = path.join(destDir, newBase);
    const fromAbs = path.join(repoRoot, rel);
    const toAbs = path.join(repoRoot, toRel);
    if (path.normalize(fromAbs) === path.normalize(toAbs)) continue;
    moves.push({ fromAbs, toAbs, fromRel: rel, toRel });
  }
  return moves;
}

function toPosix(p: string): string { return p.split(path.sep).join('/'); }

function resolveAbsoluteImport(fromFileAbs: string, toFileAbs: string): string {
  // Convert to absolute-from-src import like 'core/hkt' (without .ts)
  const relFromSrc = path.relative(srcRoot, toFileAbs);
  const noExt = withoutExt(toPosix(relFromSrc));
  return noExt;
}

async function indexMovedByBasename(moves: Move[]): Promise<Map<string, Move[]>> {
  const map = new Map<string, Move[]>();
  for (const m of moves) {
    const base = withoutExt(path.basename(m.fromRel));
    if (!map.has(base)) map.set(base, []);
    map.get(base)!.push(m);
  }
  return map;
}

async function collectImportChanges(moves: Move[]): Promise<ImportChange[]> {
  const movedPaths = new Map<string, Move>();
  for (const m of moves) {
    movedPaths.set(toPosix(m.fromRel), m);
  }
  const files = await listAllTsFiles();
  const changes: ImportChange[] = [];
  const importRe = /from\s+['"]([^'"]+)['"];?/g;
  for (const rel of files) {
    const full = path.join(repoRoot, rel);
    const text = await fs.readFile(full, 'utf8');
    let match;
    importRe.lastIndex = 0;
    while ((match = importRe.exec(text))) {
      const spec = match[1];
      if (spec.startsWith('http') || spec.startsWith('node:')) continue;
      // Resolve to an absolute path candidate
      // Try to map relative or project-local imports
      let candidate: string | undefined;
      if (spec.startsWith('.')) {
        const absSpec = path.resolve(path.dirname(full), spec);
        const candidates = [absSpec + '.ts', absSpec + '.tsx', path.join(absSpec, 'index.ts')];
        for (const c of candidates) {
          const relC = toPosix(path.relative(repoRoot, c));
          if (movedPaths.has(relC)) { candidate = relC; break; }
        }
      } else {
        // Bare specifiers referencing our repo; we conservatively remap those that point to fp-* at root
        if (spec.startsWith('fp-')) {
          const relC = spec + '.ts';
          if (movedPaths.has(relC)) candidate = relC;
        }
        // Also support old baseUrl '.' imports like 'src/...'
        if (!candidate && spec.startsWith('src/')) {
          const relC = spec + '.ts';
          if (movedPaths.has(relC)) candidate = relC;
        }
      }
      if (candidate) {
        const m = movedPaths.get(candidate)!;
        const newSpec = resolveAbsoluteImport(full, m.toAbs);
        if (spec !== newSpec) {
          changes.push({ fileAbs: full, from: spec, to: newSpec });
        }
      }
    }
  }
  return changes;
}

async function writePlanMarkdown(moves: Move[], importChanges: ImportChange[], missingSpecs: string[]) {
  const byDir = new Map<string, Move[]>();
  for (const m of moves) {
    const dir = path.dirname(m.toRel);
    if (!byDir.has(dir)) byDir.set(dir, []);
    byDir.get(dir)!.push(m);
  }

  function folderRationale(dir: string): string {
    const g = GROUPS.find(g => ensureDirname(g.destDir) === ensureDirname(dir));
    return g?.rationale ?? 'Miscellaneous modules placed here by fallback rule.';
  }

  const lines: string[] = [];
  lines.push('# Source Restructure Plan');
  lines.push('');
  lines.push('## Folder rationales');
  for (const dir of Array.from(byDir.keys()).sort()) {
    lines.push(`- ${'**'}${dir}${'**'}: ${folderRationale(dir)}`);
  }
  lines.push('');

  lines.push('## New structure (text diagram)');
  const tree: Record<string, string[]> = {};
  for (const [dir, items] of byDir.entries()) {
    tree[dir] = items.map(m => path.basename(m.toRel)).sort();
  }
  const orderedDirs = Object.keys(tree).sort();
  for (const dir of orderedDirs) {
    lines.push(`- ${dir}/`);
    for (const file of tree[dir]) {
      lines.push(`  - ${file}`);
    }
  }
  lines.push('');

  lines.push('## File moves (from → to)');
  for (const m of moves.sort((a,b) => a.fromRel.localeCompare(b.fromRel))) {
    lines.push(`- ${'`'}${m.fromRel}${'`'} → ${'`'}${m.toRel}${'`'}`);
  }
  lines.push('');

  lines.push('## Import path updates');
  for (const c of importChanges.sort((a,b) => a.fileAbs.localeCompare(b.fileAbs) || a.from.localeCompare(b.from))) {
    const fileRel = path.relative(repoRoot, c.fileAbs);
    lines.push(`- ${'`'}${fileRel}${'`'}: ${'`'}${c.from}${'`'} → ${'`'}${c.to}${'`'}`);
  }
  lines.push('');

  lines.push('## Source files missing a corresponding spec.ts');
  for (const m of missingSpecs.sort()) {
    lines.push(`- ${'`'}${m}${'`'}`);
  }
  lines.push('');

  await fs.mkdir(path.dirname(planPath), { recursive: true });
  await fs.writeFile(planPath, lines.join('\n'), 'utf8');
}

async function listSourceFilesPostMove(moves: Move[]): Promise<string[]> {
  // Determine which files will exist under src after the move
  const stay: string[] = [];
  const files = await listAllTsFiles();
  for (const rel of files) {
    if (rel.startsWith('tests/')) continue;
    const mv = moves.find(m => m.fromRel === rel);
    if (mv) {
      stay.push(mv.toRel);
    } else if (rel.startsWith('src/')) {
      stay.push(rel);
    }
  }
  return stay;
}

async function listMissingSpecs(moves: Move[]): Promise<string[]> {
  const srcFiles = await listSourceFilesPostMove(moves);
  // Build a set of basenames for quick test lookup
  const wanted = new Set(srcFiles.map(rel => path.basename(rel)));
  // Scan tests for *.spec.ts
  async function walk(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const out: string[] = [];
    for (const e of entries) {
      const full = path.join(dir, e.name);
      const rel = path.relative(repoRoot, full);
      if (e.isDirectory()) out.push(...await walk(full));
      else if (e.name.endsWith('.spec.ts')) out.push(rel);
    }
    return out;
  }
  const testsDir = path.join(repoRoot, 'tests');
  let specs: string[] = [];
  try { specs = await walk(testsDir); } catch { specs = []; }
  const have = new Set(specs.map(s => path.basename(s).replace(/\.spec\.ts$/, '.ts')));
  const missing: string[] = [];
  for (const b of wanted) {
    if (!have.has(b)) missing.push(b);
  }
  return missing;
}

async function rewriteFileImports(fileAbs: string, changes: ImportChange[]) {
  let text = await fs.readFile(fileAbs, 'utf8');
  for (const c of changes) {
    if (c.fileAbs !== fileAbs) continue;
    const re = new RegExp(`(from\\s+['"])${c.from}(['"])`,'g');
    text = text.replace(re, `$1${c.to}$2`);
  }
  await fs.writeFile(fileAbs, text, 'utf8');
}

async function applyMoves(moves: Move[], importChanges: ImportChange[]) {
  // Create destination dirs
  const dirs = new Set(moves.map(m => path.dirname(m.toAbs)));
  for (const d of dirs) await fs.mkdir(d, { recursive: true });
  // Move files
  for (const m of moves) {
    await fs.mkdir(path.dirname(m.toAbs), { recursive: true });
    await fs.rename(m.fromAbs, m.toAbs);
  }
  // Rewrite imports
  const files = await listAllTsFiles();
  for (const fRel of files) {
    const fAbs = path.join(repoRoot, fRel);
    await rewriteFileImports(fAbs, importChanges);
  }
  // Update tsconfig baseUrl to src
  const tsconfigPath = path.join(repoRoot, 'tsconfig.json');
  try {
    const tsText = await fs.readFile(tsconfigPath, 'utf8');
    const updated = tsText
      .replace(/"baseUrl"\s*:\s*"\."/g, '"baseUrl": "src"')
      .replace(/"rootDir"\s*:\s*"\."/g, '"rootDir": "src"');
    await fs.writeFile(tsconfigPath, updated, 'utf8');
  } catch {}
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');
  const apply = args.has('--apply');
  if (!dryRun && !apply) {
    console.log('Usage: npx tsx scripts/restructure.ts --dry-run | --apply');
    process.exit(1);
  }

  const all = await listAllTsFiles();
  const candidates = all.filter(rel => (
    // root-level fp-*.ts
    (/^fp-.*\.ts$/.test(rel)) ||
    // files in poly/, math/, trees/
    rel.startsWith('poly/') || rel.startsWith('math/') || rel.startsWith('trees/') ||
    // src files starting with fp-
    (rel.startsWith('src/') && path.basename(rel).startsWith('fp-'))
  ));

  const moves = await computeMoves(candidates);
  const importChanges = await collectImportChanges(moves);
  const missing = await listMissingSpecs(moves);

  await writePlanMarkdown(moves, importChanges, missing);
  console.log(`Wrote plan to ${path.relative(repoRoot, planPath)}`);

  if (apply) {
    await applyMoves(moves, importChanges);
    console.log('Applied moves and import rewrites.');
  } else {
    console.log('Dry run only. No files were changed.');
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

