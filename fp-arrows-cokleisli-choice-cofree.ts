/**
 * Registry glue: Arrow + ArrowChoice for CoKleisli<Cofree<F,_>>.
 *
 * Depends on:
 *  - arrowCoKleisli / arrowChoiceCoKleisli (generic CoKleisli Arrow/ArrowChoice)
 *  - Comonad_Cofree(F) and ChoiceW_CofreeUniform(F) (from fp-cofree-choice-uniform)
 *
 * Usage:
 *   registerArrowChoice_CoKleisli_Cofree(FunctorF, { hktName: 'CoKl<Cofree<ArrayK>>', baseName: 'CoKl<Cofree>' })
 */

import { Kind1 } from './fp-hkt';
import { Functor } from './fp-typeclasses-hkt';
import { CofreeK } from './fp-free';
import { Comonad_Cofree, ChoiceW_CofreeUniform, Functor_ArrayK, uniformLeftCofree } from './fp-cofree-choice-uniform';
import { arrowCoKleisli, arrowChoiceCoKleisli, Comonad } from './fp-arrows-cokleisli-choice'; // from the earlier prompt

// Optional: pull registry if present
function getReg(): any | undefined {
  try {
    // Use dynamic import for optional dependency
    return (globalThis as any).__fp_registry;
  } catch { return undefined; }
}

export function registerArrowChoice_CoKleisli_Cofree<F extends Kind1>(
  F: Functor<F>,
  opts: { hktName: string; baseName?: string } // names for your registry browser
): void {
  const reg = getReg();
  if (!reg) return;

  const W = Comonad_Cofree(F) as Comonad<CofreeK<F>>; // Cast to ensure map is required
  const base = arrowCoKleisli<CofreeK<F>>(W);
  const AC  = arrowChoiceCoKleisli<CofreeK<F>>(W, base, ChoiceW_CofreeUniform(F));

  // HKT label for display/debug
  const hktName = opts.hktName;
  const baseName = opts.baseName ?? hktName;

  try {
    reg.registerHKT?.(hktName, `CoKleisliK<CofreeK<${baseName}>>`);
  } catch {}

  reg.registerTypeclass(hktName, 'Arrow', base);
  reg.registerTypeclass(hktName, 'ArrowChoice', AC);
}

// Quick smoke test (using proper ES6 imports)
function runSmokeTest() {
  try {
    // Safe no-op if no registry; still builds dictionaries
    registerArrowChoice_CoKleisli_Cofree(Functor_ArrayK, { hktName: 'CoKl<Cofree<ArrayK>>' });

    // Tiny runnable check (no laws): build a left over Either and run left(arr(+1))
    const uL = uniformLeftCofree(Functor_ArrayK, 1, (n: number) => [n + 1, n + 2]);

    const W = Comonad_Cofree(Functor_ArrayK) as any; // Cast to ensure map is required
    const base = arrowCoKleisli(W);
    const AC = arrowChoiceCoKleisli(W, base, ChoiceW_CofreeUniform(Functor_ArrayK));

    const f = base.arr((n: number) => n + 1);
    const leftF = AC.left<number, number, string>(f);

    console.log('left on Left 41 =', leftF(uL)); // Left something (structure-preserving via Cofree split)
  } catch (error) {
    console.log('Smoke test failed:', error);
  }
}

// Run test if this module is executed directly (browser-compatible check)
if (typeof globalThis !== 'undefined' && (globalThis as any).__runTests) {
  runSmokeTest();
}
