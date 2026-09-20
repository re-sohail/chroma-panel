import { beforeEach, describe, expect, it } from 'vitest';
import { clearNamedColors, isValidColor, parse, registerNamedColors } from '../src/color/parse';
import { toHex, toHexa, toHslString, toRgbaString, toRgbString } from '../src/color/serialize';
import { hsvaToRgba } from '../src/color/convert';

beforeEach(() => clearNamedColors());

describe('hex parsing', () => {
  it('reads all four hex lengths', () => {
    expect(toHex(parse('#f00')!)).toBe('#ff0000');
    expect(toHex(parse('#ff0000')!)).toBe('#ff0000');
    expect(toHexa(parse('#f00f')!)).toBe('#ff0000ff');
    expect(toHexa(parse('#ff000080')!)).toBe('#ff000080');
  });

  it('accepts a bare hex without # so the hex field can be typed into', () => {
    expect(toHex(parse('ff0000')!)).toBe('#ff0000');
    expect(toHex(parse('F00')!)).toBe('#ff0000');
  });

  it('rejects malformed hex', () => {
    for (const bad of ['#', '#ff', '#fffff', '#gg0000', '#1234567', 'zzz', '']) {
      expect(parse(bad), bad).toBeNull();
    }
  });

  it('is case insensitive', () => {
    expect(toHex(parse('#AbCdEf')!)).toBe('#abcdef');
  });
});

describe('alpha is a byte-exact fixed point', () => {
  it('survives hex -> parse -> hex for all 256 alpha bytes', () => {
    for (let byte = 0; byte < 256; byte++) {
      const hex = '#3366cc' + byte.toString(16).padStart(2, '0');
      expect(toHexa(parse(hex)!), `alpha byte ${byte}`).toBe(hex);
    }
  });

  it('does not disturb RGB when only alpha changes', () => {
    const base = parse('#c87823')!;
    const faded = { ...base, a: 0.5 };
    const a = hsvaToRgba(base);
    const b = hsvaToRgba(faded);
    expect(b.r).toBe(a.r);
    expect(b.g).toBe(a.g);
    expect(b.b).toBe(a.b);
    expect(toHex(faded)).toBe(toHex(base));
  });
});

describe('rgb()', () => {
  it('reads the legacy comma form', () => {
    expect(toHex(parse('rgb(255, 0, 0)')!)).toBe('#ff0000');
    expect(toHexa(parse('rgba(255, 0, 0, 0.5)')!)).toBe('#ff000080');
  });

  it('reads the modern space-separated form with slash alpha', () => {
    expect(toHex(parse('rgb(255 0 0)')!)).toBe('#ff0000');
    expect(toHexa(parse('rgb(255 0 0 / 50%)')!)).toBe('#ff000080');
    expect(toHexa(parse('rgb(255 0 0 / 0.5)')!)).toBe('#ff000080');
  });

  it('reads percentage channels', () => {
    expect(toHex(parse('rgb(100%, 0%, 0%)')!)).toBe('#ff0000');
  });

  it('clamps out-of-range channels instead of failing', () => {
    expect(toHex(parse('rgb(300, -20, 0)')!)).toBe('#ff0000');
  });
});

describe('hsl() and hwb()', () => {
  it('reads both hsl syntaxes', () => {
    expect(toHex(parse('hsl(0, 100%, 50%)')!)).toBe('#ff0000');
    expect(toHex(parse('hsl(120 100% 50%)')!)).toBe('#00ff00');
    expect(toHexa(parse('hsla(240, 100%, 50%, 0.5)')!)).toBe('#0000ff80');
  });

  it('reads every CSS angle unit', () => {
    expect(toHex(parse('hsl(120deg 100% 50%)')!)).toBe('#00ff00');
    expect(toHex(parse('hsl(0.3333turn 100% 50%)')!)).toBe('#00ff00');
    expect(toHex(parse('hsl(133.33grad 100% 50%)')!)).toBe('#00ff00');
    expect(toHex(parse('hsl(2.0944rad 100% 50%)')!)).toBe('#00ff00');
  });

  it('reads a negative hue', () => {
    expect(toHex(parse('hsl(-120, 100%, 50%)')!)).toBe('#0000ff');
  });

  it('reads hwb()', () => {
    expect(toHex(parse('hwb(0 0% 0%)')!)).toBe('#ff0000');
    expect(toHex(parse('hwb(0 100% 0%)')!)).toBe('#ffffff');
    expect(toHex(parse('hwb(0 0% 100%)')!)).toBe('#000000');
  });
});

describe('keywords and named colors', () => {
  it('knows `transparent` without the named table', () => {
    expect(toHexa(parse('transparent')!)).toBe('#00000000');
  });

  it('does not know named colors until they are registered', () => {
    expect(parse('rebeccapurple')).toBeNull();
    registerNamedColors({ rebeccapurple: '663399' });
    expect(toHex(parse('rebeccapurple')!)).toBe('#663399');
  });

  it('matches names case-insensitively', () => {
    registerNamedColors({ tomato: 'ff6347' });
    expect(toHex(parse('ToMaTo')!)).toBe('#ff6347');
  });
});

describe('robustness', () => {
  it('returns null rather than throwing on junk', () => {
    for (const bad of ['rgb(1,2)', 'hsl()', 'oklch(0.7 0.2 30)', 'rgb(a,b,c)', '   ', 'rgb(1 2 3 4 5)']) {
      expect(() => parse(bad)).not.toThrow();
      expect(parse(bad), bad).toBeNull();
    }
  });

  it('tolerates surrounding whitespace', () => {
    expect(toHex(parse('   #ff0000   ')!)).toBe('#ff0000');
  });

  it('isValidColor agrees with parse', () => {
    expect(isValidColor('#fff')).toBe(true);
    expect(isValidColor('nonsense')).toBe(false);
  });
});

describe('serialize', () => {
  it('emits each CSS syntax', () => {
    const c = parse('#3366cc')!;
    expect(toRgbString(c)).toBe('rgb(51, 102, 204)');
    expect(toRgbaString({ ...c, a: 0.5 })).toBe('rgba(51, 102, 204, 0.5)');
    expect(toHslString(c)).toBe('hsl(220, 60%, 50%)');
  });

  it('round-trips every emitted syntax back through the parser', () => {
    const c = parse('#3366cc80')!;
    for (const s of [toHex(c), toHexa(c), toRgbString(c), toRgbaString(c), toHslString(c)]) {
      expect(parse(s), s).not.toBeNull();
    }
  });
});

describe('image extraction options are validated', () => {
  it('rejects nonsense rather than failing deep inside the decoder', async () => {
    const { extractPalette } = await import('../src/image/extract');
    const blob = new Blob([], { type: 'image/png' });

    await expect(extractPalette(blob, { maxColors: 1 })).rejects.toThrow(/maxColors/);
    await expect(extractPalette(blob, { size: 2 })).rejects.toThrow(/size/);
    await expect(extractPalette(blob, { alphaThreshold: 999 })).rejects.toThrow(/alphaThreshold/);
    await expect(extractPalette(blob, { maxFileSize: 0 })).rejects.toThrow(/maxFileSize/);
    await expect(extractPalette(blob, { maxSourcePixels: 1 })).rejects.toThrow(/maxSourcePixels/);
  });

  it('rejects oversized and non-image blobs before decoding them', async () => {
    const { extractPalette } = await import('../src/image/extract');

    await expect(extractPalette(new Blob(['large'], { type: 'image/png' }), { maxFileSize: 2 }))
      .rejects.toThrow(/MB or smaller/);
    await expect(extractPalette(new Blob(['text'], { type: 'text/plain' })))
      .rejects.toThrow(/not an image/);
  });
});
