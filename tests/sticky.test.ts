import { describe, expect, it } from 'vitest';
import { ingest, sameHsva, sameRendered } from '../src/color/sticky';
import { rgbaToHsva, hsvaToRgba } from '../src/color/convert';
import { parse } from '../src/color/parse';
import { toHex, toHexa } from '../src/color/serialize';
import type { Hsva } from '../src/color/types';

/**
 * Simulates what a naive picker does: push the colour out through RGB/hex and
 * read it back. This is exactly the lossy path that produces the bugs below.
 */
function roundTripThroughRgb(c: Hsva): Hsva {
  return rgbaToHsva(hsvaToRgba(c));
}

describe('hue survives a trip to the achromatic poles', () => {
  // react-colorful #176 — "Hue resetting when dragging saturation to extreme"
  it('keeps hue when saturation is dragged to 0 and back', () => {
    const start: Hsva = { h: 210, s: 80, v: 90, a: 1 };

    // Drag saturation to zero. RGB now says "grey", hue reads back as 0.
    const greyed = roundTripThroughRgb({ ...start, s: 0 });
    expect(greyed.h).toBe(0); // the information loss, confirmed

    // Merging keeps the user's hue alive through the pole.
    const held = ingest(greyed, start);
    expect(held.h).toBe(210);

    // Drag saturation back up — the original hue is still there.
    const restored = ingest({ ...held, s: 80 }, held);
    expect(restored.h).toBe(210);
    expect(toHex(restored)).toBe(toHex(start));
  });

  // @uiw/react-color #98 "wheel gets stuck at V = 0" and #136 "jumpy on dark colours"
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

  it('survives a full round trip: colour -> black -> colour', () => {
    const start: Hsva = { h: 285, s: 55, v: 40, a: 0.75 };
    let state = start;

    // Drag brightness all the way down, one step at a time.
    for (let v = 40; v >= 0; v -= 5) {
      state = ingest(roundTripThroughRgb({ ...state, v }), state);
    }
    // ...and all the way back up.
    for (let v = 0; v <= 40; v += 5) {
      state = ingest(roundTripThroughRgb({ ...state, v }), state);
    }

    expect(state.h).toBeCloseTo(285, 6);
    expect(state.s).toBeCloseTo(55, 6);
    expect(toHexa(state)).toBe(toHexa(start));
  });

  // @uiw/react-color #185 — "Unable to move the color slider if any grayscale color set"
  it('still moves every axis after a grayscale colour is set', () => {
    const grey = parse('#808080')!;
    expect(grey.s).toBe(0);

    // Hue must still be settable even though the current colour is grey.
    const hued = ingest({ ...grey, h: 180, s: 50 }, grey);
    expect(hued.h).toBe(180);
    expect(hued.s).toBe(50);
    expect(toHex(hued)).not.toBe('#808080');

    // And pure black must not be a dead end either.
    const black = parse('#000000')!;
    const lifted = ingest({ ...black, h: 90, s: 100, v: 50 }, black);
    expect(toHex(lifted)).not.toBe('#000000');
  });
});

describe('controlled-value sync gate', () => {
  // If a parent echoes onChange back into `value`, comparing HSVA would see a
  // difference (the echoed value lost its powerless components) and stomp the
  // sticky hue every frame. Comparing the rendered output does not.
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

describe('ingest is a no-op for well-defined colours', () => {
  it('passes a fully saturated, bright colour straight through', () => {
    const prev: Hsva = { h: 10, s: 10, v: 10, a: 1 };
    const next: Hsva = { h: 200, s: 90, v: 90, a: 0.5 };
    expect(ingest(next, prev)).toEqual(next);
  });
});
