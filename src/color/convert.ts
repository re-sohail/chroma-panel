import type { Hsl, Hsla, Hsva, Hwba, Rgb, Rgba } from './types';

/* ------------------------------------------------------------------ *
 * Numeric helpers
 * ------------------------------------------------------------------ */

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Fold any hue — including negatives produced by `hsl(-30deg ...)` — into
 * 0-360. Must run BEFORE hsvaToRgba, whose sector index assumes 0-360.
 */
export function normalizeHue(h: number): number {
  const r = h % 360;
  return r < 0 ? r + 360 : r;
}

/* ------------------------------------------------------------------ *
 * RGB <-> HSV
 * ------------------------------------------------------------------ */

/**
 * Note the two "powerless" outputs this produces:
 *   - h is 0 whenever max === min (achromatic)
 *   - s is 0 whenever max === 0   (black)
 * Those zeroes are information loss, which is why the store never round-trips
 * through RGB. See `sticky.ts`.
 */
export function rgbaToHsva(rgba: Rgba): Hsva {
  const { r, g, b, a } = rgba;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let hh: number;
  if (d === 0) hh = 0;
  else if (max === r) hh = (g - b) / d;
  else if (max === g) hh = 2 + (b - r) / d;
  else hh = 4 + (r - g) / d;

  return {
    h: 60 * (hh < 0 ? hh + 6 : hh),
    s: max === 0 ? 0 : (d / max) * 100,
    v: (max / 255) * 100,
    a,
  };
}

/**
 * Sector-table form. The `% 6` is load-bearing: h === 360 yields i === 6,
 * which must wrap to sector 0 rather than reading past the table.
 */
export function hsvaToRgba(hsva: Hsva): Rgba {
  const hh = (normalizeHue(hsva.h) / 360) * 6;
  const i = Math.floor(hh);
  const f = hh - i;

  const s = hsva.s; // 0-100
  const v = hsva.v; // 0-100

  // Stay in 0-100 space and scale by 255/100 only at the end.
  // Normalising first (`v/100 * (1 - s/100)`) costs accuracy: 1 - 0.8 is
  // 0.19999999999999996, which drags a half-way channel such as s=80 v=50
  // down to 25.4999... and rounds it to the wrong byte. Deferring the
  // division keeps round inputs exact.
  const p = (v * (100 - s)) / 100;
  const q = (v * (100 - f * s)) / 100;
  const t = (v * (100 - (1 - f) * s)) / 100;

  let r: number;
  let g: number;
  let b: number;

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    default: r = v; g = p; b = q; break;
  }

  return { r: (r * 255) / 100, g: (g * 255) / 100, b: (b * 255) / 100, a: hsva.a };
}

/* ------------------------------------------------------------------ *
 * HSV <-> HSL  (closed form — no RGB detour, hue passes through exactly)
 * ------------------------------------------------------------------ */

export function hsvaToHsla(hsva: Hsva): Hsla {
  const { h, s, v, a } = hsva;
  const hh = ((200 - s) * v) / 100;

  return {
    h,
    s: hh > 0 && hh < 200
      ? ((s * v) / 100 / (hh <= 100 ? hh : 200 - hh)) * 100
      : 0,
    l: hh / 2,
    a,
  };
}

export function hslaToHsva(hsla: Hsla & { a: number }): Hsva {
  const { h, s, l, a } = hsla;
  const ss = (s * (l < 50 ? l : 100 - l)) / 100;

  return {
    h,
    s: ss > 0 ? ((2 * ss) / (l + ss)) * 100 : 0,
    v: l + ss,
    a,
  };
}

/* ------------------------------------------------------------------ *
 * HWB <-> HSV  (CSS Color 4; ~10 lines, worth having in core)
 * ------------------------------------------------------------------ */

export function hwbaToHsva(hwba: Hwba): Hsva {
  const { h, a } = hwba;
  let { w, b } = hwba;

  // w + b >= 100 collapses to a grey; the ratio decides which grey.
  const sum = w + b;
  if (sum >= 100) {
    const grey = (w / sum) * 100;
    w = grey;
    b = 100 - grey;
    return { h, s: 0, v: grey, a };
  }

  const v = 100 - b;
  return { h, s: v === 0 ? 0 : (1 - w / v) * 100, v, a };
}

export function hsvaToHwba(hsva: Hsva): Hwba {
  const { h, s, v, a } = hsva;
  return { h, w: ((100 - s) * v) / 100, b: 100 - v, a };
}

/* ------------------------------------------------------------------ *
 * Convenience projections
 * ------------------------------------------------------------------ */

export function hsvaToRgb(hsva: Hsva): Rgb {
  const { r, g, b } = hsvaToRgba(hsva);
  return { r, g, b };
}

export function hsvaToHsl(hsva: Hsva): Hsl {
  const { h, s, l } = hsvaToHsla(hsva);
  return { h, s, l };
}

/** Round an Rgb/Rgba to integer channels. Serialization only — never in the store. */
export function roundRgba(rgba: Rgba): Rgba {
  return {
    r: Math.round(clamp(rgba.r, 0, 255)),
    g: Math.round(clamp(rgba.g, 0, 255)),
    b: Math.round(clamp(rgba.b, 0, 255)),
    a: clamp(rgba.a, 0, 1),
  };
}
