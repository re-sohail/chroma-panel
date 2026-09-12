import { hsvaToRgba, roundRgba } from '../color/convert';
import { toRgbString } from '../color/serialize';
import type { Hsva } from '../color/types';

export function redTrack(c: Hsva): string {
  const { g, b } = roundRgba(hsvaToRgba(c));
  return `linear-gradient(to right, rgb(0, ${g}, ${b}), rgb(255, ${g}, ${b}))`;
}

export function greenTrack(c: Hsva): string {
  const { r, b } = roundRgba(hsvaToRgba(c));
  return `linear-gradient(to right, rgb(${r}, 0, ${b}), rgb(${r}, 255, ${b}))`;
}

export function blueTrack(c: Hsva): string {
  const { r, g } = roundRgba(hsvaToRgba(c));
  return `linear-gradient(to right, rgb(${r}, ${g}, 0), rgb(${r}, ${g}, 255))`;
}

export function saturationTrack(c: Hsva): string {
  const from = toRgbString({ ...c, s: 0 });
  const to = toRgbString({ ...c, s: 100 });
  return `linear-gradient(to right, ${from}, ${to})`;
}

export function brightnessTrack(c: Hsva): string {
  const to = toRgbString({ ...c, v: 100 });
  return `linear-gradient(to right, #000, ${to})`;
}

export function lightnessTrack(c: Hsva): string {
  const mid = toRgbString({ ...c, v: 100, s: c.s === 0 ? 0 : 100 });
  return `linear-gradient(to right, #000, ${mid}, #fff)`;
}

export function alphaTrack(c: Hsva): string {
  const solid = toRgbString(c);
  return `linear-gradient(to right, transparent, ${solid})`;
}
