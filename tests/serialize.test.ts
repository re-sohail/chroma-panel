import { describe, expect, it } from 'vitest';
import { parse } from '../src/color/parse';
import { toOutputFormat, toResult } from '../src/color/serialize';

const translucent = parse('#3366cc80')!;
const opaque = parse('#3366cc')!;

describe('toOutputFormat keeps opacity', () => {
  it('widens hex, rgb and hsl for a translucent color', () => {
    expect(toOutputFormat(translucent, 'hex')).toBe('#3366cc80');
    expect(toOutputFormat(translucent, 'rgb')).toBe('rgba(51, 102, 204, 0.502)');
    expect(toOutputFormat(translucent, 'hsl')).toBe('hsla(220, 60%, 50%, 0.502)');
  });

  it('leaves opaque colors and alpha formats unchanged', () => {
    expect(toOutputFormat(opaque, 'hex')).toBe('#3366cc');
    expect(toOutputFormat(opaque, 'rgb')).toBe('rgb(51, 102, 204)');
    expect(toOutputFormat(translucent, 'hexa')).toBe('#3366cc80');
  });

  it('drops opacity only when the opacity control is off', () => {
    expect(toOutputFormat(translucent, 'hex', false)).toBe('#3366cc');
  });

  it('is what the change result exposes as css', () => {
    expect(toResult(translucent, 'hex').css).toBe('#3366cc80');
    expect(toResult(translucent, 'hex', false).css).toBe('#3366cc');
    expect(toResult(translucent, 'hex').hex).toBe('#3366cc');
  });
});
