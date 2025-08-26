// src/kan/cograph.ts
// Build the cograph of F: C→D as a category presentation (Q,E).
// Objects: Ob(C) ⊔ Ob(D)
// Generators: Gen(C) ⊔ Gen(D) ⊔ { α_c : c → F(c) | c ∈ Ob(C) }
// Equations: E_C ⊔ E_D ⊔ { α_{c'} ∘ f  =  F(f) ∘ α_c  | f: c→c' a generator of C }
// We model C and D by presentations (Q,E). F.onMor acts on generator-paths of C.

import type {
  CategoryPresentation, Quiver, Path, SmallCategory, Functor
} from "./category-presentations";

const tag = (k: "C" | "D", id: string) => `${k}:${id}`;
const tagPath = (k: "C" | "D", p: Path): Path => ({ at: tag(k, p.at), arrows: p.arrows.map(a => tag(k, a)) });

export function cographFromPresentations(
  Cpres: CategoryPresentation,
  Dpres: CategoryPresentation,
  F: Functor
): CategoryPresentation {
  // Objects: tagged union
  const objects = [
    ...Cpres.Q.objects.map(o => ({ id: tag("C", o.id) })),
    ...Dpres.Q.objects.map(o => ({ id: tag("D", o.id) }))
  ];

  // Generators: tagged C & D, plus α_c
  const arrows = [
    ...Cpres.Q.arrows.map(a => ({ id: tag("C", a.id), src: tag("C", a.src), dst: tag("C", a.dst) })),
    ...Dpres.Q.arrows.map(a => ({ id: tag("D", a.id), src: tag("D", a.src), dst: tag("D", a.dst) })),
    ...Cpres.Q.objects.map(o => ({ id: `α:${o.id}`, src: tag("C", o.id), dst: tag("D", F.onObj(o.id)) }))
  ];

  // Equations: lift E_C & E_D, plus α_{c'}∘f = F(f)∘α_c for each C-generator f
  const E = [
    ...Cpres.E.map(({ left, right }) => ({ left: tagPath("C", left), right: tagPath("C", right) })),
    ...Dpres.E.map(({ left, right }) => ({ left: tagPath("D", left), right: tagPath("D", right) })),
    ...Cpres.Q.arrows.map(f => {
      // Right: α_{c'} ∘ f  (start at C:c)
      const right: Path = { at: tag("C", f.src), arrows: [tag("C", f.id), `α:${f.dst}`] };
      // Left:  F(f) ∘ α_c  (start at C:c)
      const FfInD: Path = F.onMor({ at: f.src, arrows: [f.id] }); // path in D from F(c) to F(c')
      const left: Path = { at: tag("C", f.src), arrows: [`α:${f.src}`, ...FfInD.arrows.map(a => tag("D", a))] };
      return { left, right };
    })
  ];

  return { Q: { objects, arrows } as Quiver, E };
}
