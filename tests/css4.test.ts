import { describe, expect, it } from 'vitest';
import {
  convertColor, isInGamut, mapToGamut, parse, parseColor,
  parseCss4Color, serializeColor,
} from '../src/core';

describe('CSS Color 4', () => {
  it('parses OKLCH and preserves its color space', () => {
    const color = parseColor('oklch(62.8% 0.2577 29.23)');
    expect(color?.space).toBe('oklch');
    expect(color?.channels[0]).toBeCloseTo(0.628, 3);
    expect(parse('oklch(62.8% 0.2577 29.23)')).not.toBeNull();
  });

  it('supports Display P3 colors and detects their gamut', () => {
    const red = parseCss4Color('color(display-p3 1 0 0 / 80%)');
    expect(red).not.toBeNull();
    expect(red?.alpha).toBeCloseTo(0.8);
    expect(isInGamut(red!, 'display-p3')).toBe(true);
    expect(isInGamut(red!, 'srgb')).toBe(false);
  });

  it('round-trips perceptual color spaces', () => {
    const source = parseCss4Color('oklch(72% 0.16 255 / 0.5)')!;
    const roundTrip = convertColor(convertColor(source, 'display-p3'), 'oklch');
    expect(roundTrip.channels[0]).toBeCloseTo(source.channels[0], 5);
    expect(roundTrip.channels[1]).toBeCloseTo(source.channels[1], 5);
    expect(roundTrip.channels[2]).toBeCloseTo(source.channels[2], 4);
    expect(serializeColor(source)).toBe('oklch(72% 0.16 255 / 0.5)');
  });

  it('maps wide-gamut colors without clipping channels', () => {
    const p3 = parseCss4Color('color(display-p3 1 0 0)')!;
    const mapped = mapToGamut(p3, 'srgb');
    expect(mapped.space).toBe('srgb');
    expect(mapped.channels.every((channel) => channel >= 0 && channel <= 1)).toBe(true);
  });

  it('rejects malformed modern colors', () => {
    expect(parseCss4Color('oklch(50% 0.2)')).toBeNull();
    expect(parseColor('color(rec2020 1 0 0)')).toBeNull();
  });
});
