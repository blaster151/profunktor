#!/usr/bin/env tsx

import { PersistentList, PersistentMap, PersistentSet } from '../fp-persistent';
import { 
  listToGADT, mapToGADT, setToGADT,
  pmatchList, pmatchListTag, pmatchMap, pmatchMapTag, pmatchSet, pmatchSetTag,
  isNil, isCons, isEmptyMap, isNonEmptyMap, isEmptySet, isNonEmptySet 
} from '../fp-persistent-hkt';

function demoList(): boolean {
  const xs = PersistentList.fromArray([1, 2, 3]);
  const g = listToGADT(xs);

  const r1 = pmatchList<number, number>(g)
    .with('Nil', () => 0)
    .with('Cons', ({ head, tail }) => head + 0)
    .exhaustive();

  const r2 = pmatchListTag<number, string>(g)
    .with('Nil', () => 'empty')
    .with('Cons', () => 'nonempty')
    .exhaustive();

  const t1 = isCons(g) && typeof g.payload.head === 'number';
  const t2 = !(isNil(g) && isCons(g)); // mutually exclusive

  return typeof r1 === 'number' && (r2 === 'empty' || r2 === 'nonempty') && t1 && t2;
}

function demoMap(): boolean {
  const m = PersistentMap.fromEntries([['a', 1], ['b', 2]]);
  const g = mapToGADT(m);
  const r = pmatchMap<string, number, number>(g)
    .with('Empty', () => 0)
    .with('NonEmpty', ({ value, rest }) => value + 0)
    .exhaustive();

  const t = isNonEmptyMap(g) || isEmptyMap(g);
  return typeof r === 'number' && t;
}

function demoSet(): boolean {
  const s = PersistentSet.fromArray([1, 2, 2, 3]);
  const g = setToGADT(s);
  const r = pmatchSet<number, string>(g)
    .with('Empty', () => 'zero')
    .with('NonEmpty', ({ element }) => (typeof element === 'number' ? 'hasNum' : 'other'))
    .exhaustive();
  const t = isEmptySet(g) || isNonEmptySet(g);
  return (r === 'zero' || r === 'hasNum' || r === 'other') && t;
}

const ok = demoList() && demoMap() && demoSet();
console.log(ok ? 'OK' : 'FAIL');
