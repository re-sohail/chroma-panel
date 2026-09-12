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
