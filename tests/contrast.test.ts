import { describe, expect, it } from 'vitest';
import {
  contrastRatio, meetsContrast, meetsNonTextContrast, contrastReport,
  relativeLuminance,
} from '../src/a11y/contrast';

describe('WCAG thresholds', () => {
  // SC 1.4.3 (AA): 4.5 normal, 3 large. SC 1.4.6 (AAA): 7 normal, 4.5 large.
  it('applies the right threshold for each level and size', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);

    expect(meetsContrast('#000', '#fff', { level: 'AAA' })).toBe(true);
    expect(meetsContrast('#767676', '#fff', { level: 'AA' })).toBe(true);
    expect(meetsContrast('#767676', '#fff', { level: 'AAA' })).toBe(false);
    expect(meetsContrast('#949494', '#fff', { level: 'AA', size: 'large' })).toBe(true);
    expect(meetsContrast('#949494', '#fff', { level: 'AA', size: 'normal' })).toBe(false);
  });

  it('defaults to normal text, the stricter threshold', () => {
    // Omitting `size` must fail closed, not open.
    const grey = '#949494'; // about 3.1:1 on white
    expect(meetsContrast(grey, '#fff', { level: 'AA' }))
      .toBe(meetsContrast(grey, '#fff', { level: 'AA', size: 'normal' }));
    expect(meetsContrast(grey, '#fff', { level: 'AA' })).toBe(false);
  });

  it('treats non-text contrast as its own flat 3:1 criterion', () => {
    // SC 1.4.11 has no AAA counterpart and no size distinction.
    expect(meetsNonTextContrast('#949494', '#fff')).toBe(true);
    expect(meetsNonTextContrast('#bbbbbb', '#fff')).toBe(false);
  });

  it('reports every outcome rather than one misleading label', () => {
    // 5:1 is simultaneously AA-normal, AA-large, AAA-large, and NOT AAA-normal.
    // The old single-label API called this "AA" and hid the AAA-large pass.
    const report = contrastReport('#5b5b5b', '#ffffff');
    expect(report.ratio).toBeGreaterThan(4.5);
    expect(report.ratio).toBeLessThan(7);
    expect(report.text.normal.aa).toBe(true);
    expect(report.text.normal.aaa).toBe(false);
    expect(report.text.large.aaa).toBe(true);
    expect(report.nonText).toBe(true);
  });
});

describe('the sRGB breakpoint', () => {
  // WCAG 2.1/2.2 corrected 0.03928 to 0.04045 by erratum. For 8-bit input the
  // two are indistinguishable, because no integer channel value lands between
  // them — this asserts that, so the change is provably cosmetic.
  it('agrees with the superseded constant for every 8-bit value', () => {
    const old = (channel: number): number => {
      const c = channel / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const now = (channel: number): number => {
      const c = channel / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    for (let v = 0; v <= 255; v++) {
      expect(now(v), `channel ${v}`).toBe(old(v));
    }
  });

  it('anchors luminance at the extremes', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 10);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 10);
  });

  it('does not round internally', () => {
    // polished and colord round luminance to 3 and 2 decimals, which can flip
    // a verdict near 4.5. Ours must carry full precision.
    const ratio = contrastRatio('#777777', '#ffffff');
    expect(ratio).not.toBe(Number(ratio.toFixed(2)));
  });
});
