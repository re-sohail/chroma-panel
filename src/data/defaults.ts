import { toHex } from '../color/serialize';
import type { ColorPalette } from '../core/context';

/**
 * Built-in swatches are generated rather than stored as literal tables.
 *
 * A hard-coded 80-entry pencil grid plus several palettes would be a couple
 * of KB of string data in every bundle, including for the consumers who pass
 * their own. Generating them from HSV costs about 20 lines and compresses to
 * nothing.
 */

function ramp(hueCount: number, levels: { s: number; v: number }[]): string[] {
  const out: string[] = [];
  for (const level of levels) {
    for (let i = 0; i < hueCount; i++) {
      out.push(toHex({ h: (360 / hueCount) * i, s: level.s, v: level.v, a: 1 }));
    }
  }
  return out;
}

function greys(steps: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < steps; i++) {
    out.push(toHex({ h: 0, s: 0, v: (100 / (steps - 1)) * i, a: 1 }));
  }
  return out;
}

/** The pencil grid: hue across, tint/shade down, with a greyscale row. */
export function defaultPencils(): string[] {
  return [
    ...ramp(12, [
      { s: 30, v: 100 },
      { s: 60, v: 100 },
      { s: 100, v: 100 },
      { s: 100, v: 75 },
      { s: 100, v: 50 },
    ]),
    ...greys(12),
  ];
}

export function defaultPalettes(): ColorPalette[] {
  return [
    {
      name: 'Basic',
      colors: [
        { color: '#ff3b30', name: 'Red' },
        { color: '#ff9500', name: 'Orange' },
        { color: '#ffcc00', name: 'Yellow' },
        { color: '#34c759', name: 'Green' },
        { color: '#00c7be', name: 'Teal' },
        { color: '#30b0c7', name: 'Cyan' },
        { color: '#007aff', name: 'Blue' },
        { color: '#5856d6', name: 'Indigo' },
        { color: '#af52de', name: 'Purple' },
        { color: '#ff2d55', name: 'Pink' },
        { color: '#a2845e', name: 'Brown' },
        { color: '#8e8e93', name: 'Grey' },
      ],
    },
    { name: 'Spectrum', colors: ramp(12, [{ s: 60, v: 100 }, { s: 100, v: 95 }, { s: 100, v: 60 }]) },
    { name: 'Greyscale', colors: greys(12) },
  ];
}
