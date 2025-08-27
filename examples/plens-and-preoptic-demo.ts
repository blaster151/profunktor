import { dialensH1 } from '../fp-optics-dialens';
import { composeVC, VCMor } from '../fp-optics-fib-vertcart';
import { PLens, composePLens } from '../fp-optics-plens';
import { Preoptic, StrictAction, toDialens } from '../fp-optics-preoptic';

// Height-1 dialens → P-lens (span is a placeholder VC morphism here)
const DL = dialensH1<number, string, number, {patch:string}>({
  forward: n => `#${n}`,
  backward: (n, d) => ({ x1: parseInt(d.patch.slice(1),10), dx: n })
});
const P: PLens<"id", VCMor> = { base: "id", span: { v: {v:1}, c: {c:1} } };
const P2 = composePLens(composeVC as any, P, P);

// Preoptic → dialens
const act: StrictAction<"I", string> = { act: (_m,s)=>s, unit: "I", tensor: (m,n)=>m };
const PO: Preoptic<"I", number, string, string, {patch:string}> = {
  residual: "I",
  view: n => `snap#${n}`,
  up: (_m, t) => t.patch
};
const DL2 = toDialens(PO, act);
console.log(DL.get(7), DL.put(7, {patch:"#42"}), typeof P2, DL2.get(3));
