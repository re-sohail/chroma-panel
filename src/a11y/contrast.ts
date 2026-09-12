import { hsvaToRgba } from '../color/convert';
import { parse } from '../color/parse';
import type { Hsva, Rgb } from '../color/types';
import { warnOnce } from '../core/dev';

function toRgb(input: string | Hsva): Rgb | null {
  if (typeof input !== 'string') return hsvaToRgba(input);
  const parsed = parse(input);
  return parsed === null ? null : hsvaToRgba(parsed);
}

/* ------------------------------------------------------------------ *
 * WCAG 2.1
 * ------------------------------------------------------------------ */

/**
 * sRGB inverse transfer function.
 *
 * The breakpoint is 0.04045, matching the current WCAG 2.1/2.2 text. WCAG 2.0
 * printed 0.03928 — a number taken from the 1996 pre-standard sRGB proposal
 * rather than the IEC standard it cited — and a published erratum corrected it
 * on 2022-02-22.
 *
 * The correction changes nothing for 8-bit input: no integer channel value
 * falls between 10.0164 and 10.31475, so both constants select the same branch
 * for all 256 inputs and produce bit-identical luminance. It is used here for
 * spec conformance, and because it does matter if this ever accepts float or
 * wide-gamut channels.
 */
function linearise(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
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

/** Text size as WCAG defines it: 18pt, or 14pt bold, and above is "large". */
export type TextSize = 'normal' | 'large';

export interface ContrastOptions {
  level: 'AA' | 'AAA';
  /** Defaults to `normal` — the stricter threshold, so omitting it fails closed. */
  size?: TextSize;
}

/**
 * Does this pair meet a specific WCAG criterion?
 *
 * The level and the text size both have to be supplied, because a ratio on its
 * own does not determine a verdict. 5:1 passes AA for any text, passes AAA for
 * large text, and fails AAA for normal text — all at once.
 *
 * Thresholds come from SC 1.4.3 (AA) and SC 1.4.6 (AAA).
 */
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

/**
 * SC 1.4.11 Non-text Contrast: a flat 3:1 for UI components and graphical
 * objects. It has no AAA counterpart and no size distinction, which is why it
 * is a separate function rather than an option.
 */
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

/**
 * Every outcome for a pair at once.
 *
 * A ratio maps to a SET of conformance results, not a point on a ladder, so
 * this returns the set rather than collapsing it into one misleading label.
 */
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

/** @deprecated Ambiguous by construction — see `wcagLevel` below. */
export type WcagLevel = 'AAA' | 'AA' | 'AA Large' | 'Fail';

/**
 * @deprecated Use `meetsContrast`, `meetsNonTextContrast` or `contrastReport`.
 *
 * This cannot be correct. "AA Large" is not a WCAG conformance level — the
 * string does not appear anywhere in WCAG 2.2 — and the function cannot know
 * the text size that would decide between thresholds. It also understates
 * AAA: 5:1 is AAA-conformant for large text but is reported here as "AA".
 *
 * Kept for one version so existing callers do not break.
 */
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
