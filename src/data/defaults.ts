import { toHex } from '../color/serialize';
import type { ColorPalette } from '../core/context';

const HUES = [194.4, 219.6, 252, 284.4, 338.4, 3.6, 18, 36, 43.2, 57.6, 64.8, 90];

export const PENCIL_COLUMNS = 12;

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function defaultPencils(): string[] {
  const out: string[] = [];

  for (let i = 0; i < PENCIL_COLUMNS; i++) {
    out.push(toHex({ h: 0, s: 0, v: 100 - (i * 100) / (PENCIL_COLUMNS - 1), a: 1 }));
  }

  const SHADES = 5;
  const TINTS = 4;
  for (let row = 0; row < SHADES + TINTS; row++) {
    const s = row < SHADES ? 100 : lerp(80, 16, (row - SHADES) / (TINTS - 1));
    const v = row < SHADES ? lerp(28, 100, row / (SHADES - 1)) : 100;
    for (const h of HUES) out.push(toHex({ h, s, v, a: 1 }));
  }

  return out;
}

export function defaultPalettes(): ColorPalette[] {
  const spectrum = HUES.map((h) => toHex({ h, s: 90, v: 95, a: 1 }));

  const greys: string[] = [];
  for (let i = 0; i < 12; i++) greys.push(toHex({ h: 0, s: 0, v: (i * 100) / 11, a: 1 }));

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
    { name: 'Spectrum', colors: spectrum },
    { name: 'Greyscale', colors: greys },
  ];
}
