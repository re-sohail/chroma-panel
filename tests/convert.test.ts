import { describe, expect, it } from 'vitest';
import {
  hslaToHsva,
  hsvaToHsla,
  hsvaToRgba,
  hwbaToHsva,
  hsvaToHwba,
  normalizeHue,
  rgbaToHsva,
} from '../src/color/convert';
import type { Hsva } from '../src/color/types';

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomHsva(rnd: () => number): Hsva {
  return { h: rnd() * 360, s: rnd() * 100, v: rnd() * 100, a: rnd() };
}

describe('normalizeHue', () => {
  it('folds negative and over-range hues into 0-360', () => {
    expect(normalizeHue(-30)).toBeCloseTo(330, 10);
    expect(normalizeHue(-390)).toBeCloseTo(330, 10);
    expect(normalizeHue(720)).toBeCloseTo(0, 10);
    expect(normalizeHue(361)).toBeCloseTo(1, 10);
  });

  it('leaves an in-range hue untouched', () => {
    expect(normalizeHue(0)).toBe(0);
    expect(normalizeHue(359.9)).toBeCloseTo(359.9, 10);
  });
});

describe('HSV <-> RGB', () => {
  it('round-trips 10k random colours within float tolerance', () => {
    const rnd = mulberry32(0xc0ffee);
    for (let i = 0; i < 10_000; i++) {
      const src = randomHsva(rnd);
      const back = rgbaToHsva(hsvaToRgba(src));

      if (src.s > 0.01 && src.v > 0.01) {
        expect(Math.abs(normalizeHue(back.h) - normalizeHue(src.h))).toBeLessThan(0.001);
      }
      if (src.v > 0.01) expect(back.s).toBeCloseTo(src.s, 6);
      expect(back.v).toBeCloseTo(src.v, 6);
      expect(back.a).toBe(src.a);
    }
  });

  it('handles h === 360 without reading past the sector table', () => {
    const at360 = hsvaToRgba({ h: 360, s: 100, v: 100, a: 1 });
    const at0 = hsvaToRgba({ h: 0, s: 100, v: 100, a: 1 });
    expect(at360.r).toBeCloseTo(at0.r, 10);
    expect(at360.g).toBeCloseTo(at0.g, 10);
    expect(at360.b).toBeCloseTo(at0.b, 10);
    expect(at360).toMatchObject({ r: 255, g: 0, b: 0 });
  });

  it('converts the primaries exactly', () => {
    expect(hsvaToRgba({ h: 0, s: 100, v: 100, a: 1 })).toMatchObject({ r: 255, g: 0, b: 0 });
    expect(hsvaToRgba({ h: 120, s: 100, v: 100, a: 1 })).toMatchObject({ r: 0, g: 255, b: 0 });
    expect(hsvaToRgba({ h: 240, s: 100, v: 100, a: 1 })).toMatchObject({ r: 0, g: 0, b: 255 });
    expect(hsvaToRgba({ h: 0, s: 0, v: 100, a: 1 })).toMatchObject({ r: 255, g: 255, b: 255 });
    expect(hsvaToRgba({ h: 0, s: 0, v: 0, a: 1 })).toMatchObject({ r: 0, g: 0, b: 0 });
  });

  it('accepts a negative hue', () => {
    const neg = hsvaToRgba({ h: -120, s: 100, v: 100, a: 1 });
    const pos = hsvaToRgba({ h: 240, s: 100, v: 100, a: 1 });
    expect(neg.r).toBeCloseTo(pos.r, 10);
    expect(neg.g).toBeCloseTo(pos.g, 10);
    expect(neg.b).toBeCloseTo(pos.b, 10);
  });
});

describe('HSV <-> HSL', () => {
  it('round-trips 10k random colours and passes hue through untouched', () => {
    const rnd = mulberry32(0xbadc0de);
    for (let i = 0; i < 10_000; i++) {
      const src = randomHsva(rnd);
      const hsla = hsvaToHsla(src);
      const back = hslaToHsva(hsla);

      expect(hsla.h).toBe(src.h);
      expect(back.h).toBe(src.h);

      if (src.v > 0.01) expect(back.s).toBeCloseTo(src.s, 6);
      expect(back.v).toBeCloseTo(src.v, 6);
    }
  });

  it('maps the known anchors', () => {
    expect(hsvaToHsla({ h: 0, s: 100, v: 100, a: 1 })).toMatchObject({ s: 100, l: 50 });
    expect(hsvaToHsla({ h: 0, s: 0, v: 100, a: 1 })).toMatchObject({ s: 0, l: 100 });
    expect(hsvaToHsla({ h: 0, s: 0, v: 0, a: 1 })).toMatchObject({ s: 0, l: 0 });
  });
});

describe('HSV <-> HWB', () => {
  it('round-trips 10k random colours', () => {
    const rnd = mulberry32(0x5eed);
    for (let i = 0; i < 10_000; i++) {
      const src = randomHsva(rnd);
      const back = hwbaToHsva(hsvaToHwba(src));
      expect(back.h).toBe(src.h);
      if (src.v > 0.01) expect(back.s).toBeCloseTo(src.s, 6);
      expect(back.v).toBeCloseTo(src.v, 6);
    }
  });

  it('collapses w + b >= 100 to the correct grey', () => {
    expect(hwbaToHsva({ h: 30, w: 60, b: 60, a: 1 }).v).toBeCloseTo(50, 6);
    expect(hwbaToHsva({ h: 30, w: 60, b: 60, a: 1 }).s).toBe(0);
    expect(hwbaToHsva({ h: 30, w: 100, b: 100, a: 1 }).v).toBeCloseTo(50, 6);
  });
});

describe('float precision at half-way channel values', () => {
  it('lands exactly on .5 for s=80 v=50 instead of 0.4999...', () => {
    const { g } = hsvaToRgba({ h: 265, s: 80, v: 50, a: 1 });
    expect(g).toBe(25.5);
    expect(Math.round(g)).toBe(26);
  });

  it('keeps the primaries and greys byte-exact', () => {
    for (let v = 0; v <= 100; v += 5) {
      const grey = hsvaToRgba({ h: 0, s: 0, v, a: 1 });
      expect(grey.r).toBeCloseTo((v * 255) / 100, 10);
      expect(grey.r).toBe(grey.g);
      expect(grey.g).toBe(grey.b);
    }
  });
});
