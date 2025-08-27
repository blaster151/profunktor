// Fibrational "dialens": a bidirectional optic layered over your existing optics stack.
// Keep it separate from core; compose with existing Lens/Optional as needed.
export interface Dialens<X, Y, dX = unknown, dY = unknown> {
  get: (x: X) => Y;
  put: (x: X, dy: dY) => { x1: X; dx: dX };
}

export function composeDialens<A,B,C,dA,dB,dC>(
  o1: Dialens<A,B,dA,dB>, o2: Dialens<B,C,dB,dC>
): Dialens<A,C,dA,dC> {
  return {
    get: (a) => o2.get(o1.get(a)),
    put: (a, dC) => {
      const mid = o2.put(o1.get(a), dC);
      const back = o1.put(a, mid.dx);
      return { x1: back.x1, dx: back.dx as dA };
    }
  };
}

// Optional: adapters to/from your core optics (so dialens can interop with Lens/Optional).
export function fromLens<S,T,A,B>(L: { get:(s:S)=>A; set:(b:B,s:S)=>T }): Dialens<S,A,S, B> {
  return {
    get: L.get,
    put: (s, b) => ({ x1: L.set(b, s), dx: s })
  };
}
