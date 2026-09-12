import type { Hsl, Hsla, Hsva, Hwba, Rgb, Rgba } from './types';

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function normalizeHue(h: number): number {
  const r = h % 360;
  return r < 0 ? r + 360 : r;
}

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

export function hsvaToRgba(hsva: Hsva): Rgba {
  const hh = (normalizeHue(hsva.h) / 360) * 6;
  const i = Math.floor(hh);
  const f = hh - i;

  const s = hsva.s; 
  const v = hsva.v; 

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

export function hwbaToHsva(hwba: Hwba): Hsva {
  const { h, a } = hwba;
  let { w, b } = hwba;

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

export function hsvaToRgb(hsva: Hsva): Rgb {
  const { r, g, b } = hsvaToRgba(hsva);
  return { r, g, b };
}

export function hsvaToHsl(hsva: Hsva): Hsl {
  const { h, s, l } = hsvaToHsla(hsva);
  return { h, s, l };
}

export function roundRgba(rgba: Rgba): Rgba {
  return {
    r: Math.round(clamp(rgba.r, 0, 255)),
    g: Math.round(clamp(rgba.g, 0, 255)),
    b: Math.round(clamp(rgba.b, 0, 255)),
    a: clamp(rgba.a, 0, 1),
  };
}
