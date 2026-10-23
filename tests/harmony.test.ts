import { describe, expect, it } from 'vitest';
import { harmonyColors } from '../src/modes/harmony/index';

const base = { h: 350, s: 60, v: 80, a: 1 };
const hues = (rule: Parameters<typeof harmonyColors>[1]): number[] =>
  harmonyColors(base, rule).map((p) => p.color.h);

describe('harmonyColors', () => {
  it('wraps hues around the wheel', () => {
    expect(hues('complementary')).toEqual([350, 170]);
    expect(hues('analogous')).toEqual([320, 350, 20]);
    expect(hues('triadic')).toEqual([350, 110, 230]);
    expect(hues('split')).toEqual([350, 140, 200]);
    expect(hues('tetradic')).toEqual([350, 80, 170, 260]);
  });

  it('keeps saturation, brightness and opacity', () => {
    for (const { color } of harmonyColors(base, 'tetradic')) {
      expect([color.s, color.v, color.a]).toEqual([60, 80, 1]);
    }
  });
});
