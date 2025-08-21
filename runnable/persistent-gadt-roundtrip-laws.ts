#!/usr/bin/env tsx

import { PersistentList, PersistentMap, PersistentSet } from '../fp-persistent';
import { 
  checkListRoundtripBothWays, 
  checkMapRoundtripMapFirst, 
  checkSetRoundtripSetFirst 
} from '../fp-persistent-hkt';

const xs = PersistentList.fromArray([1, 2, 3]);
const listLaw = checkListRoundtripBothWays(xs);

const m = PersistentMap.fromEntries([['a', 1], ['b', 2], ['c', 3]]);
const mapLaw = checkMapRoundtripMapFirst(m);

const s = PersistentSet.fromArray([1, 2, 2, 3]);
const setLaw = checkSetRoundtripSetFirst(s);

const ok = listLaw.toGADT_toList && listLaw.toList_toGADT && mapLaw && setLaw;
console.log(ok ? 'OK' : 'FAIL', { listLaw, mapLaw, setLaw });
