export interface Hsva {
  h: number;
  s: number;
  v: number;
  a: number;
}

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Rgba extends Rgb {
  a: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export interface Hsla extends Hsl {
  a: number;
}

export interface Hwb {
  h: number;
  w: number;
  b: number;
}

export interface Hwba extends Hwb {
  a: number;
}

export type ColorFormat = 'hex' | 'hexa' | 'rgb' | 'rgba' | 'hsl' | 'hsla';

export interface ColorChangeResult {
  hex: string;
  hexa: string;
  rgb: Rgb;
  rgba: Rgba;
  hsl: Hsl;
  hsla: Hsla;
  hsva: Hsva;
  css: string;
}

export type ColorChangeSource =
  | 'pointer' | 'keyboard' | 'field' | 'swatch' | 'eyedropper'
  | 'image' | 'recent' | 'programmatic' | 'unknown';

export interface ColorChangeMeta {
  phase: 'change' | 'commit';
  source: ColorChangeSource;
}

export type ModernColorSpace = 'srgb' | 'display-p3' | 'oklab' | 'oklch' | 'lab' | 'lch';

export interface ColorValue {
  space: ModernColorSpace;
  channels: readonly [number, number, number];
  alpha: number;
}

export interface SerializeColorOptions {
  format?: ModernColorSpace;
  precision?: number;
  gamut?: 'preserve' | 'srgb' | 'display-p3';
}
