import { describe, expect, it } from 'vitest';
import { ingest, sameHsva, sameRendered } from '../src/color/sticky';
import { rgbaToHsva, hsvaToRgba } from '../src/color/convert';
import { parse } from '../src/color/parse';
import { toHex, toHexa } from '../src/color/serialize';
import type { Hsva } from '../src/color/types';

function roundTripThroughRgb(c: Hsva): Hsva {
  return rgbaToHsva(hsvaToRgba(c));
}

describe('hue survives a trip to the achromatic poles', () => {
  it('keeps hue when saturation is dragged to 0 and back', () => {
    const start: Hsva = { h: 210, s: 80, v: 90, a: 1 };

    const greyed = roundTripThroughRgb({ ...start, s: 0 });
    expect(greyed.h).toBe(0); // the information loss, confirmed

    const held = ingest(greyed, start);
    expect(held.h).toBe(210);

    const restored = ingest({ ...held, s: 80 }, held);
    expect(restored.h).toBe(210);
    expect(toHex(restored)).toBe(toHex(start));
  });

  it('keeps hue and saturation when brightness is dragged to 0 and back', () => {
    const start: Hsva = { h: 45, s: 70, v: 60, a: 1 };

    const blacked = roundTripThroughRgb({ ...start, v: 0 });
    expect(blacked.h).toBe(0); // lost
    expect(blacked.s).toBe(0); // also lost

    const held = ingest(blacked, start);
    expect(held.h).toBe(45);
    expect(held.s).toBe(70);
    expect(held.v).toBe(0);

    const restored = ingest({ ...held, v: 60 }, held);
    expect(toHex(restored)).toBe(toHex(start));
  });

  it('survives a full round trip: color -> black -> color', () => {
    const start: Hsva = { h: 285, s: 55, v: 40, a: 0.75 };
    let state = start;

    for (let v = 40; v >= 0; v -= 5) {
      state = ingest(roundTripThroughRgb({ ...state, v }), state);
    }
    for (let v = 0; v <= 40; v += 5) {
      state = ingest(roundTripThroughRgb({ ...state, v }), state);
    }

    expect(state.h).toBeCloseTo(285, 6);
    expect(state.s).toBeCloseTo(55, 6);
    expect(toHexa(state)).toBe(toHexa(start));
  });

  it('still moves every axis after a grayscale color is set', () => {
    const grey = parse('#808080')!;
    expect(grey.s).toBe(0);

    const hued = ingest({ ...grey, h: 180, s: 50 }, grey);
    expect(hued.h).toBe(180);
    expect(hued.s).toBe(50);
    expect(toHex(hued)).not.toBe('#808080');

    const black = parse('#000000')!;
    const lifted = ingest({ ...black, h: 90, s: 100, v: 50 }, black);
    expect(toHex(lifted)).not.toBe('#000000');
  });
});

describe('controlled-value sync gate', () => {
  it('treats an echoed value as unchanged even though HSVA differs', () => {
    const held: Hsva = { h: 210, s: 80, v: 0, a: 1 }; // black, but remembers hue
    const echoed = roundTripThroughRgb(held);         // what the parent sends back

    expect(sameHsva(held, echoed)).toBe(false); // structurally different
    expect(sameRendered(held, echoed)).toBe(true); // renders identically
  });

  it('detects a genuine external change', () => {
    const a = parse('#ff0000')!;
    const b = parse('#00ff00')!;
    expect(sameRendered(a, b)).toBe(false);
  });

  it('notices an alpha-only change', () => {
    const a = parse('#ff0000ff')!;
    const b = parse('#ff000080')!;
    expect(sameRendered(a, b)).toBe(false);
  });
});

describe('ingest is a no-op for well-defined colors', () => {
  it('passes a fully saturated, bright color straight through', () => {
    const prev: Hsva = { h: 10, s: 10, v: 10, a: 1 };
    const next: Hsva = { h: 200, s: 90, v: 90, a: 0.5 };
    expect(ingest(next, prev)).toEqual(next);
  });
});
