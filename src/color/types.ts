/**
 * Canonical colour model for the whole library.
 *
 * Every value is a FLOAT and is never rounded while it lives in the store.
 * Rounding only happens at a serialization boundary (see `serialize.ts`).
 *
 * Ranges: h 0-360, s 0-100, v 0-100, a 0-1.
 */
export interface Hsva {
  h: number;
  s: number;
  v: number;
  a: number;
}

/** r/g/b are floats in 0-255 — deliberately not integers until serialization. */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Rgba extends Rgb {
  /** 0-1 */
  a: number;
}

/** h 0-360, s 0-100, l 0-100 */
export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export interface Hsla extends Hsl {
  a: number;
}

/** h 0-360, w 0-100, b 0-100 */
export interface Hwb {
  h: number;
  w: number;
  b: number;
}

export interface Hwba extends Hwb {
  a: number;
}

/** Output syntax for the `css` field of a change result. */
export type ColorFormat = 'hex' | 'hexa' | 'rgb' | 'rgba' | 'hsl' | 'hsla';

/**
 * The object handed to `onChange` / `onChangeComplete`.
 *
 * `hsva` carries the unrounded canonical value; every other field is a
 * rounded, display-ready projection of it.
 */
export interface ColorChangeResult {
  /** `#rrggbb` */
  hex: string;
  /** `#rrggbbaa` */
  hexa: string;
  rgb: Rgb;
  rgba: Rgba;
  hsl: Hsl;
  hsla: Hsla;
  /** Canonical, unrounded. */
  hsva: Hsva;
  /** Serialized per the picker's `format` prop. */
  css: string;
}
