import type { Hsva } from './types';
import { toHexa } from './serialize';

export function ingest(next: Hsva, prev: Hsva): Hsva {
  return {
    h: next.s > 0 && next.v > 0 ? next.h : prev.h,
    s: next.v > 0 ? next.s : prev.s,
    v: next.v,
    a: next.a,
  };
}

export function sameRendered(a: Hsva, b: Hsva): boolean {
  return toHexa(a) === toHexa(b);
}

export function sameHsva(a: Hsva, b: Hsva): boolean {
  return a.h === b.h && a.s === b.s && a.v === b.v && a.a === b.a;
}
