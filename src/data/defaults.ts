import { toHex } from '../color/serialize';
import type { ColorPalette } from '../core/context';

/**
 * Built-in swatches, generated rather than stored as literal tables — a few
 * hundred hard-coded hex strings would sit in every bundle, including for the
 * consumers who pass their own.
 */

/**
 * The hue sequence Apple uses across the twelve columns of the iOS colour
 * grid, in degrees.
 *
 * It is NOT an even 30-degree split: the warm end is compressed (18, 36, 43,
 * 58, 65) so that oranges, ambers and yellows each get a column, while the
 * blues are spread wider. An even split gives noticeably muddier yellows.
 * Measured from the grid data in noppefoxwolf/ColorPicker.
 */
const HUES = [194.4, 219.6, 252, 284.4, 338.4, 3.6, 18, 36, 43.2, 57.6, 64.8, 90];

export const PENCIL_COLUMNS = 12;

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/**
 * The pencils grid: 12 columns x 10 rows = 120 colours, matching iOS.
 *
 * Row 1 is a twelve-step greyscale ramp; rows 2-10 run dark-to-light across
 * the hue sequence above.
 *
 * The row count matters more than it looks. This grid renders as a gapless
 * mosaic with no borders between cells — exactly as Apple's does — and it
 * reads as discrete tiles only because the steps between neighbours are
 * coarse enough to clear the just-noticeable difference. Add rows to make it
 * "smoother" and the whole grid turns back into a smear.
 */
export function defaultPencils(): string[] {
  const out: string[] = [];

  // Row 1: white -> black.
  for (let i = 0; i < PENCIL_COLUMNS; i++) {
    out.push(toHex({ h: 0, s: 0, v: 100 - (i * 100) / (PENCIL_COLUMNS - 1), a: 1 }));
  }

  // Rows 2-10: nine chromatic rows running shade -> pure hue -> tint.
  //
  // Dropping saturation linearly alongside brightness across all nine rows
  // looks obvious but is wrong: it drags every middle row through low
  // saturation at medium brightness, which is the definition of mud. Every
  // row between the darkest and the palest comes out brown or olive and the
  // grid has no vivid colours at all.
  //
  // Instead, hold saturation at full while brightness climbs to the pure hue
  // (row 5), then hold brightness at full while saturation falls away to a
  // pastel. Shades below, tints above, saturated colour in the middle.
  const SHADES = 5;
  const TINTS = 4;
  for (let row = 0; row < SHADES + TINTS; row++) {
    const s = row < SHADES ? 100 : lerp(80, 16, (row - SHADES) / (TINTS - 1));
    const v = row < SHADES ? lerp(28, 100, row / (SHADES - 1)) : 100;
    for (const h of HUES) out.push(toHex({ h, s, v, a: 1 }));
  }

  return out;
}

/**
 * Palettes are discrete, nameable colours — not ramps.
 *
 * A smooth spectrum belongs in the pencils mosaic, where the gapless layout
 * suits it. Presented as spaced swatches, a fine ramp is exactly the content
 * that blurs into one continuous band.
 */
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
