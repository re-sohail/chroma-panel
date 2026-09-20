import { describe, expect, it } from 'vitest';
import {
  contrastRatio, meetsContrast, meetsNonTextContrast, contrastReport,
  contrastRatioWithAlpha, relativeLuminance, suggestAccessibleColor,
} from '../src/a11y/contrast';

describe('WCAG thresholds', () => {
  it('applies the right threshold for each level and size', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);

    expect(meetsContrast('#000', '#fff', { level: 'AAA' })).toBe(true);
    expect(meetsContrast('#767676', '#fff', { level: 'AA' })).toBe(true);
    expect(meetsContrast('#767676', '#fff', { level: 'AAA' })).toBe(false);
    expect(meetsContrast('#949494', '#fff', { level: 'AA', size: 'large' })).toBe(true);
    expect(meetsContrast('#949494', '#fff', { level: 'AA', size: 'normal' })).toBe(false);
  });

  it('defaults to normal text, the stricter threshold', () => {
    const grey = '#949494'; // about 3.1:1 on white
    expect(meetsContrast(grey, '#fff', { level: 'AA' }))
      .toBe(meetsContrast(grey, '#fff', { level: 'AA', size: 'normal' }));
    expect(meetsContrast(grey, '#fff', { level: 'AA' })).toBe(false);
  });

  it('treats non-text contrast as its own flat 3:1 criterion', () => {
    expect(meetsNonTextContrast('#949494', '#fff')).toBe(true);
    expect(meetsNonTextContrast('#bbbbbb', '#fff')).toBe(false);
  });

  it('reports every outcome rather than one misleading label', () => {
    const report = contrastReport('#5b5b5b', '#ffffff');
    expect(report.ratio).toBeGreaterThan(4.5);
    expect(report.ratio).toBeLessThan(7);
    expect(report.text.normal.aa).toBe(true);
    expect(report.text.normal.aaa).toBe(false);
    expect(report.text.large.aaa).toBe(true);
    expect(report.nonText).toBe(true);
  });
});

describe('transparent and suggested colors', () => {
  it('composites alpha before measuring contrast', () => {
    expect(contrastRatioWithAlpha('rgb(0 0 0 / 50%)', '#ffffff')).toBeCloseTo(3.98, 1);
  });

  it('finds a nearby color that reaches the requested ratio', () => {
    const suggestion = suggestAccessibleColor('#aaaaaa', '#ffffff', 4.5);
    expect(suggestion).not.toBeNull();
    expect(suggestion!.changed).toBe(true);
    expect(suggestion!.ratio).toBeGreaterThanOrEqual(4.49);
  });
});

describe('the sRGB breakpoint', () => {
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
    const ratio = contrastRatio('#777777', '#ffffff');
    expect(ratio).not.toBe(Number(ratio.toFixed(2)));
  });
});
