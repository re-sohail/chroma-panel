import { describe, expect, it } from 'vitest';
import { quantize } from '../src/image/mmcq';

/** Build flat RGBA bytes from a list of [r,g,b,count] runs. */
function pixels(runs: [number, number, number, number][], alpha = 255): Uint8ClampedArray {
  const total = runs.reduce((n, r) => n + r[3], 0);
  const data = new Uint8ClampedArray(total * 4);
  let i = 0;
  for (const [r, g, b, count] of runs) {
    for (let n = 0; n < count; n++) {
      data[i++] = r; data[i++] = g; data[i++] = b; data[i++] = alpha;
    }
  }
  return data;
}

describe('quantize', () => {
  it('returns nothing for an empty or fully transparent image', () => {
    expect(quantize(new Uint8ClampedArray(0), 8)).toEqual([]);
    expect(quantize(pixels([[255, 0, 0, 50]], 0), 8)).toEqual([]);
  });

  it('finds a single flat colour', () => {
    const result = quantize(pixels([[255, 0, 0, 100]]), 8);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]!.hex).toBe('#ff0000');
    expect(result[0]!.population).toBe(100);
  });

  it('separates three distinct colours', () => {
    const result = quantize(
      pixels([[255, 0, 0, 300], [0, 255, 0, 200], [0, 0, 255, 100]]),
      8,
    );
    const hexes = result.map((s) => s.hex);
    expect(hexes).toContain('#ff0000');
    expect(hexes).toContain('#00ff00');
    expect(hexes).toContain('#0000ff');
  });

  it('orders swatches by population, most common first', () => {
    const result = quantize(
      pixels([[10, 10, 200, 50], [200, 10, 10, 400], [10, 200, 10, 150]]),
      8,
    );
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1]!.population).toBeGreaterThanOrEqual(result[i]!.population);
    }
    expect(result[0]!.rgb[0]).toBeGreaterThan(150); // the red run dominates
  });

  it('keeps a small accent alive next to a dominant flat background', () => {
    // Plain median cut tends to spend every box on the background here.
    const result = quantize(
      pixels([[245, 245, 245, 9500], [255, 80, 0, 500]]),
      8,
    );
    const hasAccent = result.some((s) => s.rgb[0] > 200 && s.rgb[1] < 140 && s.rgb[2] < 90);
    expect(hasAccent).toBe(true);
  });

  it('never exceeds the requested palette size', () => {
    const runs: [number, number, number, number][] = [];
    for (let i = 0; i < 200; i++) {
      runs.push([(i * 7) % 256, (i * 13) % 256, (i * 29) % 256, 10]);
    }
    for (const max of [2, 5, 8, 16]) {
      expect(quantize(pixels(runs), max).length).toBeLessThanOrEqual(max);
    }
  });

  it('ignores pixels below the alpha threshold', () => {
    const opaque = pixels([[255, 0, 0, 100]]);
    const withGhosts = new Uint8ClampedArray(opaque.length + 400);
    withGhosts.set(opaque);
    for (let i = opaque.length; i < withGhosts.length; i += 4) {
      withGhosts[i] = 0; withGhosts[i + 1] = 255; withGhosts[i + 2] = 0; withGhosts[i + 3] = 10;
    }
    const result = quantize(withGhosts, 8);
    expect(result.every((s) => s.rgb[1] < 100)).toBe(true);
  });

  it('handles a photographic spread within a sane time budget', () => {
    const data = new Uint8ClampedArray(100 * 100 * 4);
    let seed = 12345;
    for (let i = 0; i < data.length; i += 4) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      data[i] = seed % 256;
      data[i + 1] = (seed >> 8) % 256;
      data[i + 2] = (seed >> 16) % 256;
      data[i + 3] = 255;
    }
    const started = Date.now();
    const result = quantize(data, 16);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(16);
    expect(Date.now() - started).toBeLessThan(500);
  });
});
