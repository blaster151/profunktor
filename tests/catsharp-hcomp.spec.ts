/* @jest-environment node */
import { hcomp, hid, type EqualizerTools } from "../src/catsharp/definition";

const P = (name: string) => ({ name });
const H = (from: any, to: any, label: string) => ({ from, to, label });
const comonoid = (name: string) => {
  const c = P(name);
  return { poly: c, counit: H(c, P("y"), `ε_${name}`), comult: H(c, P(`${name}▷${name}`), `δ_${name}`) };
};
const bicomod = (L: any, R: any, carrier: string) => ({
  left: L, right: R, carrier: P(carrier),
  coactL: H(P(`${L.poly.name}▷${carrier}`), P(carrier), `λ_${L.poly.name}_${carrier}`),
  coactR: H(P(carrier), P(`${carrier}▷${R.poly.name}`), `ρ_${carrier}_${R.poly.name}`)
});
const Tools: EqualizerTools = {
  equalizeTopRow: ({ c, d, e, p, q }) => {
    const carrier = P(`${p.carrier.name}⋉_${d.poly.name}${q.carrier.name}`);
    return { carrier, intoMid: H(carrier, P(`${p.carrier.name}⋉${q.carrier.name}`), "ι") };
  },
  induceCoactions: ({ c, e, carrier }) => ({
    coactL: H(P(`${c.poly.name}▷${carrier.name}`), carrier, "λ"),
    coactR: H(carrier, P(`${carrier.name}▷${e.poly.name}`), "ρ")
  })
};

describe("Cat♯ horizontal composition", () => {
  test("boundaries line up and names are sensible", () => {
    const c = comonoid("c"), d = comonoid("d"), e = comonoid("e");
    const p = bicomod(c, d, "P");
    const q = bicomod(d, e, "Q");
    const pq = hcomp(p, q, Tools);
    expect(pq.left).toBe(c);
    expect(pq.right).toBe(e);
    expect(pq.carrier.name).toBe("P⋉_dQ");
  });

  test("horizontal identity has matching boundaries", () => {
    const c = comonoid("c");
    const idh = hid(c);
    expect(idh.left).toBe(c);
    expect(idh.right).toBe(c);
  });
});
