import { clamp } from '../color/convert';
import { convertColor, parseCss4Color, serializeColor } from '../color/css4';
import { parseColor } from '../color/value';
import type { ColorValue, ModernColorSpace } from '../color/types';

export type GradientType = 'linear' | 'radial';

export interface GradientStop {
  id: string;
  color: string;
  position: number;
}

export interface GradientValue {
  type: GradientType;
  angle?: number;
  stops: readonly GradientStop[];
}

export interface GradientOptions {
  interpolation?: ModernColorSpace;
  repeating?: boolean;
}

export function normalizeGradient(value: GradientValue): GradientValue {
  const stops = value.stops
    .map((stop) => ({ ...stop, position: Number.isFinite(stop.position) ? clamp(stop.position, 0, 100) : 0 }))
    .sort((a, b) => a.position - b.position);
  return { ...value, angle: value.angle === undefined ? undefined : Number.isFinite(value.angle) ? ((value.angle % 360) + 360) % 360 : 90, stops };
}

export function gradientToCss(value: GradientValue, options: GradientOptions = {}): string {
  const normalized = normalizeGradient(value);
  const name = `${options.repeating ? 'repeating-' : ''}${normalized.type}-gradient`;
  const direction = normalized.type === 'linear' ? `${normalized.angle ?? 90}deg, ` : '';
  const interpolation = options.interpolation === undefined ? '' : `in ${options.interpolation}, `;
  const stops = normalized.stops.map((stop) => `${stop.color} ${stop.position}%`).join(', ');
  return `${name}(${direction}${interpolation}${stops})`;
}

export function sampleGradient(
  value: GradientValue,
  position: number,
  space: ModernColorSpace = 'oklab',
): ColorValue | null {
  const stops = normalizeGradient(value).stops;
  if (stops.length === 0) return null;
  const point = clamp(position, 0, 100);
  const rightIndex = stops.findIndex((stop) => stop.position >= point);
  const right = stops[rightIndex === -1 ? stops.length - 1 : rightIndex]!;
  const left = stops[Math.max(0, rightIndex === -1 ? stops.length - 1 : rightIndex - 1)]!;
  const leftColor = parseColor(left.color);
  const rightColor = parseColor(right.color);
  if (leftColor === null || rightColor === null) return null;
  const a = convertColor(leftColor, space);
  const b = convertColor(rightColor, space);
  const span = right.position - left.position;
  const t = span <= 0 ? 0 : (point - left.position) / span;
  const channels = a.channels.map((channel, index) => {
    if ((space === 'oklch' || space === 'lch') && index === 2) {
      const delta = ((b.channels[2] - channel + 540) % 360) - 180;
      return (channel + delta * t + 360) % 360;
    }
    return channel + (b.channels[index]! - channel) * t;
  }) as [number, number, number];
  return { space, channels, alpha: a.alpha + (b.alpha - a.alpha) * t };
}

export function addGradientStop(value: GradientValue, position: number, id?: string): GradientValue {
  const sampled = sampleGradient(value, position);
  const color = sampled === null ? '#000000' : serializeColor(convertColor(sampled, 'srgb'), { format: 'srgb' });
  return normalizeGradient({
    ...value,
    stops: [...value.stops, { id: id ?? `stop-${Date.now().toString(36)}`, color, position }],
  });
}

export function isGradientColorSupported(color: string): boolean {
  return parseColor(color) !== null || parseCss4Color(color) !== null;
}
