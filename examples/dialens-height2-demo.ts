// examples/dialens-height2-demo.ts
import { dialensH1, dialensH2 } from '../fp-optics-dialens';

// A → B (round 1)
const a_to_b = dialensH1<number, string, number, {replace:string}>({
  forward: (n) => `#${n}`,
  backward: (n, dB) => ({ x1: parseInt((dB.replace ?? `#${n}`).slice(1), 10), dx: n })
});

// B → C (round 2)
const b_to_c = dialensH1<string, {tag:string}, {replace:string}, {patch:{tag:string}}>({
  forward: (s) => ({ tag: s }),
  backward: (_s, dC) => ({ x1: dC.patch.tag, dx: { replace: dC.patch.tag } })
});

// Height-2 "optic-like" dialens
const a_to_c = dialensH2(a_to_b, b_to_c);
console.log(a_to_c.get(7));                              // { tag: "#7" }
console.log(a_to_c.put(7, { patch: { tag: "#42" } }));   // { x1: 42, dx: 7 }
