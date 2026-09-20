import { clamp, hsvaToRgba, rgbaToHsva } from './convert';
import type { ColorValue, Hsva, ModernColorSpace, Rgba, SerializeColorOptions } from './types';

type Triple = [number, number, number];
const D50: Triple = [0.96422, 1, 0.82521];
const D65_TO_D50 = [[1.0479298, 0.0229468, -0.0501922], [0.0296278, 0.9904345, -0.0170738], [-0.009243, 0.0150552, 0.7518743]] as const;
const D50_TO_D65 = [[0.9554734, -0.0230985, 0.0632593], [-0.0283697, 1.0099955, 0.0210414], [0.012314, -0.0205077, 1.3303659]] as const;

function mul(matrix: readonly (readonly number[])[], value: Triple): Triple {
  return matrix.map((row) => row[0]! * value[0] + row[1]! * value[1] + row[2]! * value[2]) as Triple;
}

function linear(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  return sign * (abs <= 0.04045 ? abs / 12.92 : ((abs + 0.055) / 1.055) ** 2.4);
}

function gamma(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  return sign * (abs <= 0.0031308 ? 12.92 * abs : 1.055 * abs ** (1 / 2.4) - 0.055);
}

function rgbToXyz(rgb: Triple, space: 'srgb' | 'display-p3'): Triple {
  return mul(space === 'srgb'
    ? [[0.4123908, 0.3575843, 0.1804808], [0.212639, 0.7151687, 0.0721923], [0.0193308, 0.1191948, 0.9505322]]
    : [[0.4865709, 0.2656677, 0.1982173], [0.2289746, 0.6917385, 0.0792869], [0, 0.0451134, 1.0439444]], rgb.map(linear) as Triple);
}

function xyzToRgb(xyz: Triple, space: 'srgb' | 'display-p3'): Triple {
  return mul(space === 'srgb'
    ? [[3.2409699, -1.5373832, -0.4986108], [-0.9692436, 1.8759675, 0.0415551], [0.0556301, -0.203977, 1.0569715]]
    : [[2.4934969, -0.9313836, -0.4027108], [-0.829489, 1.762664, 0.0236247], [0.0358458, -0.0761724, 0.9568845]], xyz).map(gamma) as Triple;
}

function xyzToOklab(xyz: Triple): Triple {
  const lms = mul([[0.8190224, 0.3619063, -0.1288738], [0.0329837, 0.9292868, 0.0361447], [0.0481772, 0.2642395, 0.6335478]], xyz).map(Math.cbrt) as Triple;
  return mul([[0.2104543, 0.7936178, -0.004072], [1.9779985, -2.4285922, 0.4505937], [0.025904, 0.7827718, -0.8086758]], lms);
}

function oklabToXyz(lab: Triple): Triple {
  const lms = mul([[1, 0.3963378, 0.2158038], [1, -0.1055613, -0.0638542], [1, -0.0894842, -1.2914855]], lab).map((v) => v ** 3) as Triple;
  return mul([[1.2268798758, -0.5578149945, 0.2813910457], [-0.0405757452, 1.1122868033, -0.0717110581], [-0.0763729367, -0.4214933324, 1.5869240198]], lms);
}

function xyzD50ToLab(xyz: Triple): Triple {
  const e = 216 / 24389;
  const k = 24389 / 27;
  const f = xyz.map((v, i) => { const n = v / D50[i]!; return n > e ? Math.cbrt(n) : (k * n + 16) / 116; }) as Triple;
  return [116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])];
}

function labToXyzD50(lab: Triple): Triple {
  const f: Triple = [lab[1] / 500 + (lab[0] + 16) / 116, (lab[0] + 16) / 116, (lab[0] + 16) / 116 - lab[2] / 200];
  const e = 216 / 24389;
  const k = 24389 / 27;
  return f.map((v, i) => D50[i]! * (v ** 3 > e ? v ** 3 : (116 * v - 16) / k)) as Triple;
}

function polar(value: Triple): Triple {
  const r = value[2] * Math.PI / 180;
  return [value[0], value[1] * Math.cos(r), value[1] * Math.sin(r)];
}

function cylindrical(value: Triple): Triple {
  const c = Math.hypot(value[1], value[2]);
  return [value[0], c, c < 1e-7 ? 0 : (Math.atan2(value[2], value[1]) * 180 / Math.PI + 360) % 360];
}

function toXyz(color: ColorValue): Triple {
  switch (color.space) {
    case 'srgb': case 'display-p3': return rgbToXyz([...color.channels], color.space);
    case 'oklab': return oklabToXyz([...color.channels]);
    case 'oklch': return oklabToXyz(polar([...color.channels]));
    case 'lab': return mul(D50_TO_D65, labToXyzD50([...color.channels]));
    case 'lch': return mul(D50_TO_D65, labToXyzD50(polar([...color.channels])));
  }
}

export function convertColor(color: ColorValue, space: ModernColorSpace): ColorValue {
  if (color.space === space) return { ...color, channels: [...color.channels] as Triple };
  const xyz = toXyz(color);
  let channels: Triple;
  switch (space) {
    case 'srgb': case 'display-p3': channels = xyzToRgb(xyz, space); break;
    case 'oklab': channels = xyzToOklab(xyz); break;
    case 'oklch': channels = cylindrical(xyzToOklab(xyz)); break;
    case 'lab': channels = xyzD50ToLab(mul(D65_TO_D50, xyz)); break;
    case 'lch': channels = cylindrical(xyzD50ToLab(mul(D65_TO_D50, xyz))); break;
  }
  return { space, channels, alpha: color.alpha };
}

export function isInGamut(color: ColorValue, gamut: 'srgb' | 'display-p3' = 'srgb'): boolean {
  return convertColor(color, gamut).channels.every((v) => v >= -1e-7 && v <= 1 + 1e-7);
}

export function mapToGamut(color: ColorValue, gamut: 'srgb' | 'display-p3' = 'srgb'): ColorValue {
  if (isInGamut(color, gamut)) return convertColor(color, gamut);
  const source = convertColor(color, 'oklch');
  let low = 0;
  let high = Math.max(0, source.channels[1]);
  for (let i = 0; i < 24; i++) {
    const c = (low + high) / 2;
    if (isInGamut({ ...source, channels: [source.channels[0], c, source.channels[2]] }, gamut)) low = c;
    else high = c;
  }
  const mapped = convertColor(
    { ...source, channels: [source.channels[0], low, source.channels[2]] },
    gamut,
  );
  return {
    ...mapped,
    channels: mapped.channels.map((channel) => clamp(channel, 0, 1)) as Triple,
  };
}

function num(token: string, percentScale = 1): number | null {
  if (token.toLowerCase() === 'none') return 0;
  const percent = token.endsWith('%');
  const value = Number(percent ? token.slice(0, -1) : token);
  return Number.isFinite(value) ? value * (percent ? percentScale / 100 : 1) : null;
}

function hue(token: string): number | null {
  if (token.toLowerCase() === 'none') return 0;
  const m = token.match(/^([-+]?(?:\d*\.)?\d+)(deg|grad|rad|turn)?$/i);
  if (m === null) return null;
  const value = Number(m[1]);
  return m[2] === 'grad' ? value * 0.9 : m[2] === 'rad' ? value * 180 / Math.PI : m[2] === 'turn' ? value * 360 : value;
}

function lightness(token: string, ok: boolean): number | null {
  if (token.toLowerCase() === 'none') return 0;
  const percent = token.endsWith('%');
  const value = Number(percent ? token.slice(0, -1) : token);
  if (!Number.isFinite(value)) return null;
  return ok && percent ? value / 100 : value;
}

export function parseCss4Color(input: string): ColorValue | null {
  const rgb = input.trim().match(/^color\((srgb|display-p3)\s+([^/]+?)(?:\s*\/\s*([^\s]+))?\)$/i);
  if (rgb !== null) {
    const values = rgb[2]!.trim().split(/\s+/).map((v) => num(v, 1));
    const alpha = rgb[3] === undefined ? 1 : num(rgb[3], 1);
    return values.length === 3 && values.every((v) => v !== null) && alpha !== null
      ? { space: rgb[1]!.toLowerCase() as 'srgb' | 'display-p3', channels: values as Triple, alpha: clamp(alpha, 0, 1) } : null;
  }
  const match = input.trim().match(/^(oklab|oklch|lab|lch)\((.*)\)$/i);
  if (match === null) return null;
  const sections = match[2]!.split('/');
  const parts = sections[0]!.trim().split(/\s+/);
  const space = match[1]!.toLowerCase() as 'oklab' | 'oklch' | 'lab' | 'lch';
  if (parts.length !== 3 || sections.length > 2) return null;
  const l = lightness(parts[0]!, space.startsWith('ok'));
  const second = num(parts[1]!, space.startsWith('ok') ? 0.4 : space === 'lch' ? 150 : 125);
  const third = space.endsWith('ch') ? hue(parts[2]!) : num(parts[2]!, space === 'oklab' ? 0.4 : 125);
  const alpha = sections[1] === undefined ? 1 : num(sections[1]!.trim(), 1);
  if (l === null || second === null || third === null || alpha === null) return null;
  return { space, channels: [l, space.endsWith('ch') ? Math.max(0, second) : second, space.endsWith('ch') ? (third % 360 + 360) % 360 : third], alpha: clamp(alpha, 0, 1) };
}

export function colorValueToHsva(color: ColorValue): Hsva {
  const rgb = mapToGamut(color, 'srgb');
  return rgbaToHsva({ r: clamp(rgb.channels[0], 0, 1) * 255, g: clamp(rgb.channels[1], 0, 1) * 255, b: clamp(rgb.channels[2], 0, 1) * 255, a: color.alpha });
}

export function hsvaToColorValue(color: Hsva): ColorValue {
  const rgb: Rgba = hsvaToRgba(color);
  return { space: 'srgb', channels: [rgb.r / 255, rgb.g / 255, rgb.b / 255], alpha: rgb.a };
}

const out = (value: number, precision: number): string => String(Number(value.toFixed(precision)));

export function serializeColor(color: ColorValue, options: SerializeColorOptions = {}): string {
  const format = options.format ?? color.space;
  const precision = Math.min(8, Math.max(0, options.precision ?? 4));
  const base = options.gamut === undefined || options.gamut === 'preserve' ? color : mapToGamut(color, options.gamut);
  const converted = convertColor(base, format);
  const [x, y, z] = converted.channels;
  const alpha = converted.alpha < 1 ? ` / ${out(converted.alpha, precision)}` : '';
  if (format === 'srgb' || format === 'display-p3') return `color(${format} ${out(x, precision)} ${out(y, precision)} ${out(z, precision)}${alpha})`;
  const lightness = format.startsWith('ok') ? x * 100 : x;
  return `${format}(${out(lightness, precision)}% ${out(y, precision)} ${out(z, precision)}${alpha})`;
}
