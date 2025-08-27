// examples/fib-vc-demo.ts
import { ClovenFibration, VCMor, dualOf } from '../fp-optics-fib-vertcart';
import { dialensH2, dialensH1 } from '../fp-optics-dialens';

// A toy cloven fibration stub sufficient to exercise VC composition.
const Fib: ClovenFibration = {
  base: { id: (_: any) => ({}), comp: (_g: any, _f: any) => ({}) },
  reindexObj: (_f, D) => D, reindexMor: (_f, h) => h,
  cartesianLift: (_f, Dp) => ({ lift: {}, dom: {}, cod: Dp }),
  factorVC: (e) => ({ v: { vOf: e }, c: { cOf: e } }),
  pullbackVertAgainstCart: (v, c) => ({ pbObj: {}, v1: { pbv: v }, c1: { pbc: c } }),
  isVertical: () => true, isCartesian: () => true,
  // optional: category-of-E composition for nicer demo traces
  // @ts-ignore
  composeE: (g: any, f: any) => ({ seq: [g, f] })
};

// Two VC morphisms and their composition via Prop. 2.7
const m1: VCMor = { v: { v: 1 }, c: { c: 'c1' } };
const m2: VCMor = { v: { v: 2 }, c: { c: 'c2' } };
const Eop = dualOf(Fib);
const m2o1 = Eop.vc.compose(m2, m1);
console.log('VC composed:', m2o1);

// Height-2 dialens that "applies" a VC update back to A
const forward = (n: number) => `#${n}`;
const backVert = (_a: number, _db: { patch: string }): VCMor => ({ v: { edit: 'v' }, c: { type: 'cart' } });
const applyVC = (_vc: VCMor, a: number) => a + 1;

const O = dialensH2(
  dialensH1<number, string, number, { patch: string }>({
    forward,
    backward: (a, db) => ({ x1: parseInt(db.patch.slice(1), 10), dx: a })
  }),
  dialensH1<string, string, { patch: string }, { patch: string }>({
    forward: (b) => b,
    backward: (b, db) => ({ x1: db.patch, dx: db })
  })
);

console.log('get 7 →', O.get(7));
console.log('put 7, {patch:"#42"} →', O.put(7, { patch: '#42' }));
