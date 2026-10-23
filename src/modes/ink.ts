import { hsvaToRgba } from '../color/convert';
import type { Hsva } from '../color/types';

const linear = (c: number): number => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

export function inkFor(color: Hsva): string {
  const { r, g, b } = hsvaToRgba(color);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b) > 0.179 ? '#000000' : '#ffffff';
}
