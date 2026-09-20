import { hsvaToRgba, rgbaToHsva } from '../color/convert';
import { convertColor, mapToGamut } from '../color/css4';
import { toHex } from '../color/serialize';
import { parseColor } from '../color/value';
import { parse } from '../color/parse';
import type { Hsva, Rgb } from '../color/types';
import { warnOnce } from '../core/dev';

function toRgb(input: string | Hsva): Rgb | null {
  if (typeof input !== 'string') return hsvaToRgba(input);
  const parsed = parse(input);
  return parsed === null ? null : hsvaToRgba(parsed);
}

function linearise(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: string | Hsva): number {
  const rgb = toRgb(color);
  if (rgb === null) return 0;
  return 0.2126 * linearise(rgb.r) + 0.7152 * linearise(rgb.g) + 0.0722 * linearise(rgb.b);
}

export function contrastRatio(a: string | Hsva, b: string | Hsva): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

export function compositeColor(foreground: string | Hsva, background: string | Hsva): Hsva | null {
  const fg = typeof foreground === 'string' ? parse(foreground) : foreground;
  const bg = typeof background === 'string' ? parse(background) : background;
  if (fg === null || bg === null) return null;
  const f = hsvaToRgba(fg);
  const b = hsvaToRgba(bg);
  const alpha = f.a + b.a * (1 - f.a);
  if (alpha === 0) return { h: 0, s: 0, v: 0, a: 0 };
  return rgbaToHsva({
    r: (f.r * f.a + b.r * b.a * (1 - f.a)) / alpha,
    g: (f.g * f.a + b.g * b.a * (1 - f.a)) / alpha,
    b: (f.b * f.a + b.b * b.a * (1 - f.a)) / alpha,
    a: alpha,
  });
}

export function contrastRatioWithAlpha(
  foreground: string | Hsva,
  background: string | Hsva,
  canvas: string | Hsva = '#ffffff',
): number {
  const opaqueBackground = compositeColor(background, canvas);
  if (opaqueBackground === null) return 1;
  const opaqueForeground = compositeColor(foreground, opaqueBackground);
  return opaqueForeground === null ? 1 : contrastRatio(opaqueForeground, opaqueBackground);
}

export interface AccessibleColorSuggestion {
  color: string;
  ratio: number;
  changed: boolean;
}

export function suggestAccessibleColor(
  foreground: string,
  background: string,
  targetRatio: number = 4.5,
): AccessibleColorSuggestion | null {
  const source = parseColor(foreground);
  if (source === null || parse(background) === null || !Number.isFinite(targetRatio) || targetRatio < 1) return null;
  const currentRatio = contrastRatioWithAlpha(foreground, background);
  if (currentRatio >= targetRatio) return { color: foreground, ratio: currentRatio, changed: false };
  const oklch = convertColor(source, 'oklch');
  const candidates: AccessibleColorSuggestion[] = [];
  for (const endpoint of [0, 1]) {
    let passing = endpoint;
    let failing = oklch.channels[0];
    const endpointColor = { ...oklch, channels: [endpoint, oklch.channels[1], oklch.channels[2]] as const, alpha: 1 };
    const endpointHex = toHexColor(endpointColor);
    if (contrastRatio(endpointHex, background) < targetRatio) continue;
    for (let index = 0; index < 24; index++) {
      const lightness = (passing + failing) / 2;
      const candidate = { ...oklch, channels: [lightness, oklch.channels[1], oklch.channels[2]] as const, alpha: 1 };
      if (contrastRatio(toHexColor(candidate), background) >= targetRatio) passing = lightness;
      else failing = lightness;
    }
    const color = toHexColor({ ...oklch, channels: [passing, oklch.channels[1], oklch.channels[2]], alpha: 1 });
    candidates.push({ color, ratio: contrastRatio(color, background), changed: true });
  }
  return candidates.sort((a, b) => Math.abs(convertColor(parseColor(a.color)!, 'oklch').channels[0] - oklch.channels[0]) - Math.abs(convertColor(parseColor(b.color)!, 'oklch').channels[0] - oklch.channels[0]))[0] ?? null;
}

function toHexColor(color: import('../color/types').ColorValue): string {
  const srgb = mapToGamut(color, 'srgb');
  return toHex(rgbaToHsva({ r: srgb.channels[0] * 255, g: srgb.channels[1] * 255, b: srgb.channels[2] * 255, a: 1 }));
}

export type TextSize = 'normal' | 'large';

export interface ContrastOptions {
  level: 'AA' | 'AAA';
  size?: TextSize;
}

export function meetsContrast(
  a: string | Hsva,
  b: string | Hsva,
  options: ContrastOptions,
): boolean {
  const { level, size = 'normal' } = options;
  const ratio = contrastRatio(a, b);
  if (level === 'AAA') return ratio >= (size === 'large' ? 4.5 : 7);
  return ratio >= (size === 'large' ? 3 : 4.5);
}

export function meetsNonTextContrast(a: string | Hsva, b: string | Hsva): boolean {
  return contrastRatio(a, b) >= 3;
}

export interface ContrastReport {
  ratio: number;
  text: {
    normal: { aa: boolean; aaa: boolean };
    large: { aa: boolean; aaa: boolean };
  };
  nonText: boolean;
}

export function contrastReport(a: string | Hsva, b: string | Hsva): ContrastReport {
  const ratio = contrastRatio(a, b);
  return {
    ratio,
    text: {
      normal: { aa: ratio >= 4.5, aaa: ratio >= 7 },
      large: { aa: ratio >= 3, aaa: ratio >= 4.5 },
    },
    nonText: ratio >= 3,
  };
}

export type WcagLevel = 'AAA' | 'AA' | 'AA Large' | 'Fail';

export function wcagLevel(a: string | Hsva, b: string | Hsva): WcagLevel {
  warnOnce(
    'wcagLevel() is deprecated and cannot be accurate — a ratio alone does not ' +
      'determine a level. Use meetsContrast(a, b, { level, size }) instead.',
  );
  const ratio = contrastRatio(a, b);
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return 'Fail';
}

const S_RCO = 0.2126729;
const S_GCO = 0.7151522;
const S_BCO = 0.0721750;
const MAIN_TRC = 2.4;
const NORM_BG = 0.56;
const NORM_TXT = 0.57;
const REV_TXT = 0.62;
const REV_BG = 0.65;
const SCALE_BOW = 1.14;
const SCALE_WOB = 1.14;
const LO_BOW_OFFSET = 0.027;
const LO_WOB_OFFSET = 0.027;
const BLK_THRS = 0.022;
const BLK_CLMP = 1.414;
const DELTA_Y_MIN = 0.0005;
const LO_CLIP = 0.1;

function apcaY(rgb: Rgb): number {
  const y =
    S_RCO * (rgb.r / 255) ** MAIN_TRC +
    S_GCO * (rgb.g / 255) ** MAIN_TRC +
    S_BCO * (rgb.b / 255) ** MAIN_TRC;
  return y > BLK_THRS ? y : y + (BLK_THRS - y) ** BLK_CLMP;
}

export function apcaContrast(text: string | Hsva, background: string | Hsva): number {
  const t = toRgb(text);
  const b = toRgb(background);
  if (t === null || b === null) return 0;

  const yText = apcaY(t);
  const yBg = apcaY(b);
  if (Math.abs(yBg - yText) < DELTA_Y_MIN) return 0;

  if (yBg > yText) {
    const s = (yBg ** NORM_BG - yText ** NORM_TXT) * SCALE_BOW;
    return s < LO_CLIP ? 0 : (s - LO_BOW_OFFSET) * 100;
  }

  const s = (yBg ** REV_BG - yText ** REV_TXT) * SCALE_WOB;
  return s > -LO_CLIP ? 0 : (s + LO_WOB_OFFSET) * 100;
}

export function readableTextColor(
  background: string | Hsva,
  options: { dark?: string; light?: string } = {},
): string {
  const dark = options.dark ?? '#000000';
  const light = options.light ?? '#ffffff';
  return Math.abs(apcaContrast(dark, background)) >= Math.abs(apcaContrast(light, background))
    ? dark
    : light;
}
