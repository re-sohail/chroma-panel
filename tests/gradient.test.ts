import { describe, expect, it } from 'vitest';
import {
  addGradientStop, gradientToCss, normalizeGradient, sampleGradient,
  type GradientValue,
} from '../src/gradient';

const gradient: GradientValue = {
  type: 'linear', angle: -90,
  stops: [
    { id: 'end', color: '#ffffff', position: 100 },
    { id: 'start', color: '#000000', position: 0 },
  ],
};

describe('gradient model', () => {
  it('normalizes direction, positions and order', () => {
    const normalized = normalizeGradient(gradient);
    expect(normalized.angle).toBe(270);
    expect(normalized.stops.map((stop) => stop.id)).toEqual(['start', 'end']);
  });

  it('serializes standards-based interpolation', () => {
    expect(gradientToCss(gradient, { interpolation: 'oklab' }))
      .toBe('linear-gradient(270deg, in oklab, #000000 0%, #ffffff 100%)');
  });

  it('samples gradients in perceptual color spaces', () => {
    const middle = sampleGradient(gradient, 50, 'oklab');
    expect(middle?.space).toBe('oklab');
    expect(middle?.channels[0]).toBeGreaterThan(0.45);
    expect(middle?.channels[0]).toBeLessThan(0.55);
  });

  it('adds a stop using the sampled color', () => {
    const next = addGradientStop(gradient, 25, 'quarter');
    expect(next.stops).toHaveLength(3);
    expect(next.stops[1]?.id).toBe('quarter');
    expect(next.stops[1]?.color).toMatch(/^color\(srgb /);
  });
});
