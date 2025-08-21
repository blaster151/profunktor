import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

// Helper to run a TypeScript file and capture its output
function runTypeScriptFile(filePath: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(`npx tsx ${filePath}`, {
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: any) {
    console.log(`Error running ${filePath}:`, error.message);
    console.log('stdout:', error.stdout);
    console.log('stderr:', error.stderr);
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message || '',
      exitCode: error.status || 1
    };
  }
}



describe('Runnable TypeScript Programs', () => {
  describe('03-monad-maybe.ts', () => {
    it('runs successfully and produces expected output', () => {
      const result = runTypeScriptFile('runnable/03-monad-maybe.ts');
      
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      
      // Validate the specific expected output from the program
      expect(result.stdout).toContain('RESULT: { ok1: \'q=42\', ok2: \'err\', ok3: \'rec=1\' }');
      expect(result.stdout).toContain('Monad success: OK');
      expect(result.stdout).toContain('Monad failure -> default: OK');
      expect(result.stdout).toContain('Monad recovery: OK');
      
      // The program should NOT have any FAIL assertions
      expect(result.stdout).not.toContain('FAIL');
    });
  });

  describe('02-applicative-maybe.ts', () => {
    it('runs successfully and produces expected output', () => {
      const result = runTypeScriptFile('runnable/02-applicative-maybe.ts');
      
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      
      // Validate the specific expected output from the program
      expect(result.stdout).toContain('RESULT: { good: 42, fallback: 0 }');
      expect(result.stdout).toContain('Applicative good: OK');
      expect(result.stdout).toContain('Applicative fallback: OK');
      
      // The program should NOT have any FAIL assertions
      expect(result.stdout).not.toContain('FAIL');
    });
  });

  describe('06-gadt-match-ergonomics.ts', () => {
    it('runs successfully and produces expected output', () => {
      const result = runTypeScriptFile('runnable/06-gadt-match-ergonomics.ts');
      
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      
      // Validate the specific expected output from the program
      expect(result.stdout).toContain('OK');
      
      // The program should NOT have any FAIL assertions
      expect(result.stdout).not.toContain('FAIL');
    });
  });

  describe('05-persistent-foldable-traversable.ts', () => {
    it('runs successfully and produces expected output', () => {
      const result = runTypeScriptFile('runnable/05-persistent-foldable-traversable.ts');
      
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      
      // Validate the specific expected output from the program
      expect(result.stdout).toContain('foldr sum: 6');
      expect(result.stdout).toContain('foldl sum: 6');
      expect(result.stdout).toContain('traverseList result: [ 2, 4, 6 ]');
      expect(result.stdout).toContain('All tests passed! ✓');
      expect(result.stdout).toContain('OK');
      
      // The program should NOT have any FAIL assertions
      expect(result.stdout).not.toContain('FAIL');
    });
  });

  describe('04-persistent-gadt-roundtrip-laws.ts', () => {
    it('runs successfully and produces expected output', () => {
      const result = runTypeScriptFile('runnable/04-persistent-gadt-roundtrip-laws.ts');
      
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      
      // Validate the specific expected output from the program
      expect(result.stdout).toContain('OK');
      expect(result.stdout).toContain('listLaw: { toGADT_toList: true, toList_toGADT: true }');
      expect(result.stdout).toContain('mapLaw: true');
      expect(result.stdout).toContain('setLaw: true');
      
      // The program should NOT have any FAIL assertions
      expect(result.stdout).not.toContain('FAIL');
    });
  });

  describe('09-test-gadt-pattern-matching.ts', () => {
    it('runs successfully and produces expected output', () => {
      const result = runTypeScriptFile('runnable/09-test-gadt-pattern-matching.ts');
      
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      
      // Validate the specific expected output from the program
      expect(result.stdout).toContain('List test: PASS');
      expect(result.stdout).toContain('Map test: PASS');
      expect(result.stdout).toContain('Overall: OK');
      
      // The program should NOT have any FAIL assertions
      expect(result.stdout).not.toContain('FAIL');
    });
  });

  describe('07-persistent-functionk-bridges-list.ts', () => {
    it('runs successfully and produces expected output', () => {
      const result = runTypeScriptFile('runnable/07-persistent-functionk-bridges-list.ts');
      
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      
      // Validate the specific expected output from the program
      expect(result.stdout).toContain('All tests passed! ✓');
      expect(result.stdout).toContain('Original array: [ 1, 2, 3 ]');
      expect(result.stdout).toContain('Roundtrip array: [ 1, 2, 3 ]');
      expect(result.stdout).toContain('List from Just(42): [ 42 ]');
      expect(result.stdout).toContain('List from Nothing: []');
      expect(result.stdout).toContain('OK');
      
      // The program should NOT have any FAIL assertions
      expect(result.stdout).not.toContain('FAIL');
    });
  });

  describe('08-persistent-functionk-bridges-set-map.ts', () => {
    it('runs successfully and produces expected output', () => {
      const result = runTypeScriptFile('runnable/08-persistent-functionk-bridges-set-map.ts');
      
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      
      // Validate the specific expected output from the program
      expect(result.stdout).toContain('All tests passed! ✓');
      expect(result.stdout).toContain('Original array with dupes: [ 1, 2, 2, 3, 1 ]');
      expect(result.stdout).toContain('Deduplicated array from set: [ 1, 2, 3 ]');
      expect(result.stdout).toContain('Set from Just(42): [ 42 ]');
      expect(result.stdout).toContain('Set from Nothing: []');
      expect(result.stdout).toContain('OK');
      
      // The program should NOT have any FAIL assertions
      expect(result.stdout).not.toContain('FAIL');
    });
  });

  describe('01-basic-functor-maybe.ts', () => {
    it('runs successfully and produces expected output', () => {
      const result = runTypeScriptFile('runnable/01-basic-functor-maybe.ts');
      
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      
      // Validate the specific expected output from the program
      expect(result.stdout).toContain('RESULT: Value: 42');
      expect(result.stdout).toContain('Functor/Filter/Fold: OK');
      
      // The program should NOT have any FAIL assertions
      expect(result.stdout).not.toContain('FAIL');
    });
  });

  // Skip the .js file since we're testing TypeScript programs
  // describe('basic-functor-maybe.js', () => { ... });
});
