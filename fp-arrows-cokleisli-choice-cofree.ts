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
import { Comonad_Cofree, ChoiceW_CofreeUniform } from './fp-cofree-choice-uniform';
import { arrowCoKleisli, arrowChoiceCoKleisli } from './fp-arrows-cokleisli-choice'; // from the earlier prompt

// Optional: pull registry if present
function getReg(): any | undefined {
  try {
    const { getFPRegistry } = require('./fp-registry-init');
    return getFPRegistry?.();
  } catch { return undefined; }
}

export function registerArrowChoice_CoKleisli_Cofree<F extends Kind1>(
  F: Functor<F>,
  opts: { hktName: string; baseName?: string } // names for your registry browser
): void {
  const reg = getReg();
  if (!reg) return;

  const W = Comonad_Cofree(F);
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

// quick smoke (requires you to have Functor_ArrayK exported, or supply your own)
if (require.main === module) {
  const { Functor_ArrayK } = require('./fp-cofree-choice-uniform');

  // Safe no-op if no registry; still builds dictionaries
  registerArrowChoice_CoKleisli_Cofree(Functor_ArrayK, { hktName: 'CoKl<Cofree<ArrayK>>' });

  // Tiny runnable check (no laws): build a left over Either and run left(arr(+1))
  const { uniformLeftCofree } = require('./fp-cofree-choice-uniform');
  const uL = uniformLeftCofree(Functor_ArrayK, 1, (n: number) => [n + 1, n + 2]);

  const { arrowCoKleisli } = require('./fp-arrows-cokleisli-choice');
  const { Comonad_Cofree } = require('./fp-cofree-choice-uniform');
  const W = Comonad_Cofree(Functor_ArrayK);
  const base = arrowCoKleisli(W);
  const ac   = require('./fp-arrows-cokleisli-choice');
  const AC   = ac.arrowChoiceCoKleisli(W, base, require('./fp-cofree-choice-uniform').ChoiceW_CofreeUniform(Functor_ArrayK));

  const f = base.arr((n: number) => n + 1);
  const leftF = AC.left<number, number, string>(f);
  const Either = require('./fp-hkt').Either;

  console.log('left on Left 41 =', leftF(uL)); // Left something (structure-preserving via Cofree split)
}
