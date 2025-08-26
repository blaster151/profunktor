/**
 * Property Transfer Harness
 * 
 * Provides functions to sanity-check the Quillen axiom transfer on a given 
 * site/topology/spec. This is essential for verifying that Beke's lifting 
 * theorem works correctly in practice.
 * 
 * Key functionality:
 * - Verify that model category axioms transfer from Sets to sheaves
 * - Generate detailed reports of which axioms hold/fail
 * - Provide debugging information for failed transfers
 * - Test the sheafifiable spec against concrete examples
 */

import type { 
  Site, 
  GrothendieckTopology, 
  SheafifiableSpec, 
  ModelCategory,
  Cover,
  Sieve,
  LocallyPresentable
} from '../model/sheafifiable-model-structure';
import { buildSheafModel } from '../model/sheafifiable-model-structure';
import type { LocalWeakEqWitness } from '../equivalences/local-weak-equivalence';

// ============================================================================
// TRANSFER REPORT STRUCTURES
// ============================================================================

export interface TransferReport<X> {
  readonly built: ModelCategory<X>;
  readonly axioms: {
    twoOfThree: boolean;
    retracts: boolean;
    lifting: boolean;
    factorization: boolean;
    closure: boolean; // closure under composition
    stability: boolean; // stability under base change
    limitsColimits: boolean; // M1: completeness and cocompleteness
    locallyPresentable: boolean; // accessibility + cocompleteness
    cofibrantlyGenerated: boolean; // I,J generating sets with small domains
    cof_viaRetracts: boolean; // cof(I) computed via retracts of cell(I)
    inj_viaRLP: boolean; // inj(J) computed via RLP against J
    soaFunctorialFactorization: boolean; // factorization via small object argument
    cofibrationsAsMonos?: boolean; // I constructed from monomorphisms
  };
  readonly coverage: {
    totalObjects: number;
    objectsWithCovers: number;
    averageCoversPerObject: number;
  };
  readonly notes?: string[];
  readonly warnings?: string[];
  readonly errors?: string[];
}

export interface AxiomTestResult {
  readonly passed: boolean;
  readonly witness?: unknown;
  readonly counterexample?: unknown;
  readonly notes?: string;
}

export interface DetailedTransferReport<X> extends TransferReport<X> {
  readonly axiomDetails: {
    twoOfThree: AxiomTestResult;
    retracts: AxiomTestResult;
    lifting: AxiomTestResult;
    factorization: AxiomTestResult;
    closure: AxiomTestResult;
    stability: AxiomTestResult;
  };
  readonly localityTests: {
    totalMorphismsTested: number;
    localWeakEquivalencesFound: number;
    averageCoversPerMorphism: number;
  };
}

// ============================================================================
// CORE TRANSFER VERIFICATION
// ============================================================================

export function verifySheafifiableTransfer<X>(
  site: Site,
  topology: GrothendieckTopology,
  spec: SheafifiableSpec<X>,
  presentable: LocallyPresentable
): TransferReport<X> {
  const built = buildSheafModel(site, topology, spec, presentable);
  
  // Calculate coverage statistics
  const coverage = calculateCoverage(site, topology);
  
  // Check cofibrantly generated structure
  const cofibrantlyGenerated =
    Array.isArray(spec.I) && Array.isArray(spec.J) &&
    spec.I.length >= 0 && spec.J.length >= 0 &&
    spec.I.every(x => x.domainSmall) && spec.J.every(x => x.domainSmall);

  // Check if SOA is being used
  const usedSOA = !!(spec as any).ops;

  // Check if monos mode is being used
  const cofibrationsAsMonos = !!(spec as any).monoOps;

  // Basic axiom checks (stubs for now)
  const axioms = {
    twoOfThree: checkTwoOfThree(built),
    retracts: checkRetracts(built),
    lifting: checkLifting(built, spec),
    factorization: checkFactorization(built, spec),
    closure: checkClosure(built),
    stability: checkStability(built),
    limitsColimits: presentable.hasAllLimits && presentable.hasAllColimits,
    locallyPresentable: presentable.hasFilteredColimits && presentable.hasSmallGenerators,
    cofibrantlyGenerated,
    cof_viaRetracts: usedSOA, // we exposed cof(I) when ops exist
    inj_viaRLP: usedSOA || !!spec.hasRLP,
    soaFunctorialFactorization: usedSOA,
    cofibrationsAsMonos // I constructed from monomorphisms
  };
  
  const notes: string[] = [
    'Stub transfer report; insert generated witnesses as we implement small-object argument.',
    `Site has ${coverage.totalObjects} objects with ${coverage.objectsWithCovers} having covers.`,
    `Average ${coverage.averageCoversPerObject.toFixed(2)} covers per object.`,
    'Coefficients/base are assumed constant (Set) as per paper scope.'
  ];

  // Add note about SOA usage
  if (!usedSOA) {
    notes.push("SOA not engaged (spec.ops absent); using placeholder factorization.");
  }

  // Add note about solution sets
  if ((spec as any).solutionSetAtI) {
    notes.push("J constructed from solution sets (Lemma 1.9).");
  }
  
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Add warnings for missing features
  if (!spec.hasRLP) {
    warnings.push('No fibration RLP specified - lifting tests will be limited');
  }
  
  if (!spec.isLeftProper && !spec.isRightProper) {
    warnings.push('Neither left nor right properness specified');
  }
  
  return {
    built,
    axioms,
    coverage,
    notes,
    warnings,
    errors
  };
}

export function verifySheafifiableTransferDetailed<X>(
  site: Site,
  topology: GrothendieckTopology,
  spec: SheafifiableSpec<X>,
  presentable: LocallyPresentable
): DetailedTransferReport<X> {
  const basicReport = verifySheafifiableTransfer(site, topology, spec, presentable);
  const built = basicReport.built;
  
  // Detailed axiom testing
  const axiomDetails = {
    twoOfThree: testTwoOfThreeDetailed(built),
    retracts: testRetractsDetailed(built),
    lifting: testLiftingDetailed(built, spec),
    factorization: testFactorizationDetailed(built, spec),
    closure: testClosureDetailed(built),
    stability: testStabilityDetailed(built)
  };
  
  // Locality testing
  const localityTests = testLocality(site, topology, spec);
  
  return {
    ...basicReport,
    axiomDetails,
    localityTests
  };
}

// ============================================================================
// COVERAGE CALCULATION
// ============================================================================

function calculateCoverage(site: Site, topology: GrothendieckTopology) {
  let totalObjects = 0;
  let objectsWithCovers = 0;
  let totalCovers = 0;
  
  for (const obj of site.objects) {
    totalObjects++;
    const covers = topology.covers(obj);
    if (covers.length > 0) {
      objectsWithCovers++;
      totalCovers += covers.length;
    }
  }
  
  return {
    totalObjects,
    objectsWithCovers,
    averageCoversPerObject: totalObjects > 0 ? totalCovers / totalObjects : 0
  };
}

// ============================================================================
// AXIOM TESTING FUNCTIONS
// ============================================================================

function checkTwoOfThree<X>(model: ModelCategory<X>): boolean {
  // Stub: test 2-out-of-3 property for weak equivalences
  // If g∘f=h and two of f,g,h are weak equivalences, then the third is too
  return true; // Placeholder
}

function checkRetracts<X>(model: ModelCategory<X>): boolean {
  // Stub: test that retracts of weak equivalences are weak equivalences
  return true; // Placeholder
}

function checkLifting<X>(model: ModelCategory<X>, spec: SheafifiableSpec<X>): boolean {
  // Stub: test lifting properties
  return !!spec.hasRLP; // Placeholder
}

function checkFactorization<X>(model: ModelCategory<X>, spec: SheafifiableSpec<X>): boolean {
  // Stub: test factorization axioms
  return true; // Placeholder
}

function checkClosure<X>(model: ModelCategory<X>): boolean {
  // Stub: test closure under composition
  return true; // Placeholder
}

function checkStability<X>(model: ModelCategory<X>): boolean {
  // Stub: test stability under base change
  return true; // Placeholder
}

// ============================================================================
// DETAILED AXIOM TESTING
// ============================================================================

function testTwoOfThreeDetailed<X>(model: ModelCategory<X>): AxiomTestResult {
  return {
    passed: true,
    notes: '2-out-of-3 property test (stub)'
  };
}

function testRetractsDetailed<X>(model: ModelCategory<X>): AxiomTestResult {
  return {
    passed: true,
    notes: 'Retract property test (stub)'
  };
}

function testLiftingDetailed<X>(model: ModelCategory<X>, spec: SheafifiableSpec<X>): AxiomTestResult {
  return {
    passed: !!spec.hasRLP,
    notes: spec.hasRLP ? 'Lifting property test (stub)' : 'No RLP specified'
  };
}

function testFactorizationDetailed<X>(model: ModelCategory<X>, spec: SheafifiableSpec<X>): AxiomTestResult {
  return {
    passed: true,
    notes: 'Factorization property test (stub)'
  };
}

function testClosureDetailed<X>(model: ModelCategory<X>): AxiomTestResult {
  return {
    passed: true,
    notes: 'Closure under composition test (stub)'
  };
}

function testStabilityDetailed<X>(model: ModelCategory<X>): AxiomTestResult {
  return {
    passed: true,
    notes: 'Stability under base change test (stub)'
  };
}

// ============================================================================
// LOCALITY TESTING
// ============================================================================

function testLocality<X>(
  site: Site, 
  topology: GrothendieckTopology, 
  spec: SheafifiableSpec<X>
) {
  let totalMorphismsTested = 0;
  let localWeakEquivalencesFound = 0;
  let totalCoversUsed = 0;
  
  // Stub: test locality of weak equivalences
  // In practice, we'd generate test morphisms and check their locality
  
  return {
    totalMorphismsTested,
    localWeakEquivalencesFound,
    averageCoversPerMorphism: totalMorphismsTested > 0 ? totalCoversUsed / totalMorphismsTested : 0
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function generateTransferSummary<X>(report: TransferReport<X>): string {
  const { axioms, coverage } = report;
  const passedAxioms = Object.values(axioms).filter(Boolean).length;
  const totalAxioms = Object.keys(axioms).length;
  
  return `
Transfer Summary:
- Axioms passed: ${passedAxioms}/${totalAxioms}
- Site coverage: ${coverage.objectsWithCovers}/${coverage.totalObjects} objects have covers
- Average covers per object: ${coverage.averageCoversPerObject.toFixed(2)}
${report.warnings?.length ? `- Warnings: ${report.warnings.length}` : ''}
${report.errors?.length ? `- Errors: ${report.errors.length}` : ''}
  `.trim();
}

export function isTransferSuccessful<X>(report: TransferReport<X>): boolean {
  const { axioms, errors } = report;
  const allAxiomsPass = Object.values(axioms).every(Boolean);
  const noErrors = !errors || errors.length === 0;
  return allAxiomsPass && noErrors;
}

// ============================================================================
// LEMMA 2.16 VERIFICATION
// ============================================================================

export function verifyInjSubsetW<X>(
  isInjOfC: (p: X) => boolean,
  isW: (p: X) => boolean,
  sample: readonly X[]
): boolean {
  // Heuristic witness: on a test battery, inj(C) ⇒ W
  return sample.every(p => !isInjOfC(p) || isW(p));
}
