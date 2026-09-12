import { hsvaToRgba } from '../color/convert';
import { parse } from '../color/parse';
import type { Hsva, Rgb } from '../color/types';

function toRgb(input: string | Hsva): Rgb | null {
  if (typeof input !== 'string') return hsvaToRgba(input);
  const parsed = parse(input);
  return parsed === null ? null : hsvaToRgba(parsed);
}

/* ------------------------------------------------------------------ *
 * WCAG 2.1
 * ------------------------------------------------------------------ */

function linearise(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.1 relative luminance, 0-1. */
export function relativeLuminance(color: string | Hsva): number {
  const rgb = toRgb(color);
  if (rgb === null) return 0;
  return 0.2126 * linearise(rgb.r) + 0.7152 * linearise(rgb.g) + 0.0722 * linearise(rgb.b);
}

/**
 * WCAG 2.1 contrast ratio, 1-21.
 *
 * This is the number audits check, so it is what the UI should display —
 * even though it is a poor predictor of readability at the dark end, which
 * is why `readableTextColor` uses APCA to actually decide.
 */
export function contrastRatio(a: string | Hsva, b: string | Hsva): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

export type WcagLevel = 'AAA' | 'AA' | 'AA Large' | 'Fail';

export function wcagLevel(a: string | Hsva, b: string | Hsva): WcagLevel {
  const ratio = contrastRatio(a, b);
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return 'Fail';
}

/* ------------------------------------------------------------------ *
 * APCA (SAPC-98 G-4g)
 * ------------------------------------------------------------------ */

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
  // Soft clamp near black.
  return y > BLK_THRS ? y : y + (BLK_THRS - y) ** BLK_CLMP;
}

/**
 * APCA lightness contrast (Lc), roughly -108 to +106. The sign encodes
 * polarity: positive is dark text on light, negative is light on dark.
 *
 * Rough guide: |Lc| 45 for large headlines, 60 is about WCAG's 4.5:1,
 * 75 is the practical floor for smaller text, 90+ for body copy.
 */
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

/**
 * Pick black or white for a label drawn on `background`.
 *
 * Uses APCA rather than the common `luminance > 0.179 ? black : white`
 * shortcut, which picks black over mid-blues where white actually reads
 * better.
 */
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
