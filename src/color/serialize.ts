import { clamp, hsvaToHsla, hsvaToRgba, normalizeHue, roundRgba } from './convert';
import type { ColorChangeResult, ColorFormat, Hsva } from './types';

function hex2(channel: number): string {
  const v = Math.round(clamp(channel, 0, 255));
  return v < 16 ? '0' + v.toString(16) : v.toString(16);
}

/** `#rrggbb` — alpha discarded. */
export function toHex(hsva: Hsva): string {
  const { r, g, b } = hsvaToRgba(hsva);
  return '#' + hex2(r) + hex2(g) + hex2(b);
}

/**
 * `#rrggbbaa`.
 *
 * Alpha is quantised straight to a byte (`round(a * 255)`). Rounding alpha to
 * two decimals first — which several popular pickers do — makes
 * hex -> parse -> hex a non-fixed-point for roughly half of the 256 alpha
 * values, so a colour drifts every time it round-trips.
 */
export function toHexa(hsva: Hsva): string {
  const { r, g, b, a } = hsvaToRgba(hsva);
  return '#' + hex2(r) + hex2(g) + hex2(b) + hex2(clamp(a, 0, 1) * 255);
}

export function toRgbString(hsva: Hsva): string {
  const { r, g, b } = roundRgba(hsvaToRgba(hsva));
  return `rgb(${r}, ${g}, ${b})`;
}

export function toRgbaString(hsva: Hsva): string {
  const { r, g, b, a } = roundRgba(hsvaToRgba(hsva));
  return `rgba(${r}, ${g}, ${b}, ${round(a, 3)})`;
}

export function toHslString(hsva: Hsva): string {
  const { h, s, l } = hsvaToHsla(hsva);
  return `hsl(${Math.round(normalizeHue(h))}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

export function toHslaString(hsva: Hsva): string {
  const { h, s, l, a } = hsvaToHsla(hsva);
  return `hsla(${Math.round(normalizeHue(h))}, ${Math.round(s)}%, ${Math.round(l)}%, ${round(a, 3)})`;
}

function round(value: number, places: number): number {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}

/** Serialize per the picker's `format` prop. */
export function toFormat(hsva: Hsva, format: ColorFormat): string {
  switch (format) {
    case 'hexa': return toHexa(hsva);
    case 'rgb': return toRgbString(hsva);
    case 'rgba': return toRgbaString(hsva);
    case 'hsl': return toHslString(hsva);
    case 'hsla': return toHslaString(hsva);
    default: return toHex(hsva);
  }
}

/**
 * Build the object handed to `onChange`.
 *
 * `hsva` is passed through unrounded; everything else is a display-ready
 * projection. Consumers who need precision read `hsva`.
 */
export function toResult(hsva: Hsva, format: ColorFormat): ColorChangeResult {
  const rgba = roundRgba(hsvaToRgba(hsva));
  const hsla = hsvaToHsla(hsva);

  const hsl = {
    h: Math.round(normalizeHue(hsla.h)),
    s: Math.round(hsla.s),
    l: Math.round(hsla.l),
  };

  return {
    hex: toHex(hsva),
    hexa: toHexa(hsva),
    rgb: { r: rgba.r, g: rgba.g, b: rgba.b },
    rgba,
    hsl,
    hsla: { ...hsl, a: round(hsva.a, 3) },
    hsva,
    css: toFormat(hsva, format),
  };
}
