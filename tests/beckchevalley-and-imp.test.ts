import { wave1, partialBeckChevalley, PartialFunc } from "../src/ct/partial-func";
import { Sub } from "../src/semantics/subobjects";

test("Partial Beck–Chevalley shape equality", () => {
  const f: PartialFunc<number,string> = { defined:x=>x%2===0, apply:x=>(x===0?"a":"c") };
  const g: PartialFunc<number,string> = { defined:x=>x!==1, apply:x=>x===2?"c":"a" };
  const exists_h = (A:Sub<string>) => (y:string)=> A(y);  // toy
  const exists_k = (A:Sub<number>) => (x:number)=> A(x);  // toy
  const A: Sub<string> = y => y==="c";
  const {left,right} = partialBeckChevalley(f,g,exists_h,exists_k)(A);
  [0,1,2,3].forEach(x => expect(left(x)).toBe(right(x)));
});
