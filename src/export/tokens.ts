import { parseColor } from '../color/value';
import { serializeColor } from '../color/css4';
import type { ModernColorSpace } from '../color/types';

export type ColorTokenMap = Record<string, string>;

export interface TokenExportOptions {
  prefix?: string;
  format?: ModernColorSpace | 'preserve';
  selector?: string;
}

function safeName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'color';
}

function formatColor(color: string, format: ModernColorSpace | 'preserve'): string {
  if (format === 'preserve') return color;
  const parsed = parseColor(color);
  return parsed === null ? color : serializeColor(parsed, { format, gamut: format === 'display-p3' ? 'display-p3' : 'preserve' });
}

export function toCssVariables(tokens: ColorTokenMap, options: TokenExportOptions = {}): string {
  const prefix = safeName(options.prefix ?? 'color');
  const format = options.format ?? 'preserve';
  const lines = Object.entries(tokens).map(([name, color]) => `  --${prefix}-${safeName(name)}: ${formatColor(color, format)};`);
  return `${options.selector ?? ':root'} {\n${lines.join('\n')}\n}`;
}

export function toScssVariables(tokens: ColorTokenMap, options: Omit<TokenExportOptions, 'selector'> = {}): string {
  const prefix = safeName(options.prefix ?? 'color');
  const format = options.format ?? 'preserve';
  return Object.entries(tokens).map(([name, color]) => `$${prefix}-${safeName(name)}: ${formatColor(color, format)};`).join('\n');
}

export function toTailwindColors(tokens: ColorTokenMap): Record<string, string> {
  return Object.fromEntries(Object.entries(tokens).map(([name, color]) => [safeName(name), color]));
}

export function toDesignTokens(tokens: ColorTokenMap): Record<string, { $type: 'color'; $value: string }> {
  return Object.fromEntries(Object.entries(tokens).map(([name, color]) => [safeName(name), { $type: 'color' as const, $value: color }]));
}
