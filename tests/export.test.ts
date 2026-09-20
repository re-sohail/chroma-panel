import { describe, expect, it } from 'vitest';
import { toCssVariables, toDesignTokens, toScssVariables, toTailwindColors } from '../src/export';

const colors = { Primary: '#3366cc', 'Surface Raised': 'oklch(95% 0.01 250)' };

describe('design token exports', () => {
  it('creates safe CSS custom properties', () => {
    expect(toCssVariables(colors, { prefix: 'brand' })).toContain('--brand-surface-raised: oklch');
  });

  it('can convert output color spaces', () => {
    expect(toScssVariables(colors, { format: 'display-p3' })).toContain('color(display-p3');
  });

  it('creates Tailwind and DTCG-compatible objects', () => {
    expect(toTailwindColors(colors)).toHaveProperty('surface-raised');
    expect(toDesignTokens(colors).primary).toEqual({ $type: 'color', $value: '#3366cc' });
  });
});
