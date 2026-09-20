import { clamp, hslaToHsva, hwbaToHsva, rgbaToHsva } from './convert';
import { colorValueToHsva, parseCss4Color } from './css4';
import type { Hsva } from './types';

let namedTable: Record<string, string> | null = null;

export function registerNamedColors(table: Record<string, string>): void {
  namedTable = namedTable ? { ...namedTable, ...table } : { ...table };
}

export function clearNamedColors(): void {
  namedTable = null;
}

const NUM = /^([+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?)(%?)$/i;
const ANGLE = /^([+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?)(deg|grad|rad|turn)?$/i;

function parseHue(token: string): number | null {
  const m = ANGLE.exec(token);
  if (!m) return null;
  const n = Number.parseFloat(m[1] as string);
  if (!Number.isFinite(n)) return null;
  switch ((m[2] ?? 'deg').toLowerCase()) {
    case 'grad': return n * 0.9;
    case 'rad': return (n * 180) / Math.PI;
    case 'turn': return n * 360;
    default: return n;
  }
}

function parseChannel(token: string): number | null {
  const m = NUM.exec(token);
  if (!m) return null;
  const n = Number.parseFloat(m[1] as string);
  if (!Number.isFinite(n)) return null;
  return m[2] ? (n / 100) * 255 : n;
}

function parsePercent(token: string): number | null {
  const m = NUM.exec(token);
  if (!m) return null;
  const n = Number.parseFloat(m[1] as string);
  return Number.isFinite(n) ? n : null;
}

function parseAlpha(token: string | null): number | null {
  if (token === null) return 1;
  if (token.toLowerCase() === 'none') return 1;
  const m = NUM.exec(token);
  if (!m) return null;
  const n = Number.parseFloat(m[1] as string);
  if (!Number.isFinite(n)) return null;
  return clamp(m[2] ? n / 100 : n, 0, 1);
}

function splitArgs(body: string): { parts: string[]; alpha: string | null } {
  const slash = body.indexOf('/');
  let head = body;
  let alpha: string | null = null;

  if (slash !== -1) {
    head = body.slice(0, slash);
    alpha = body.slice(slash + 1).trim() || null;
  }

  const parts = head.split(/[\s,]+/).filter(Boolean);

  if (alpha === null && parts.length === 4) {
    alpha = parts.pop() as string;
  }

  return { parts, alpha };
}

const HEX = /^#?([0-9a-f]{3,8})$/i;

function parseHex(input: string): Hsva | null {
  const m = HEX.exec(input);
  if (!m) return null;

  const hex = m[1] as string;
  const len = hex.length;
  if (len !== 3 && len !== 4 && len !== 6 && len !== 8) return null;

  const short = len < 6;
  const step = short ? 1 : 2;
  const read = (i: number): number => {
    const slice = hex.slice(i * step, i * step + step);
    const value = Number.parseInt(short ? slice + slice : slice, 16);
    return value;
  };

  const hasAlpha = len === 4 || len === 8;
  return rgbaToHsva({
    r: read(0),
    g: read(1),
    b: read(2),
    a: hasAlpha ? read(3) / 255 : 1,
  });
}

const FUNC = /^([a-z]+)\(\s*([^)]*)\)$/i;

export function parse(input: string): Hsva | null {
  const raw = input.trim();
  if (raw === '') return null;

  const lower = raw.toLowerCase();

  if (lower === 'transparent') {
    return { h: 0, s: 0, v: 0, a: 0 };
  }

  if (namedTable !== null) {
    const named = namedTable[lower];
    if (named !== undefined) return parseHex(named);
  }

  if (raw.charCodeAt(0) === 35 ) return parseHex(raw);

  const fn = FUNC.exec(raw);
  if (fn === null) {
    return parseHex(raw);
  }

  const name = (fn[1] as string).toLowerCase();
  const { parts, alpha: alphaToken } = splitArgs(fn[2] as string);
  if (parts.length !== 3) return null;

  const alpha = parseAlpha(alphaToken);
  if (alpha === null) return null;

  if (name === 'rgb' || name === 'rgba') {
    const r = parseChannel(parts[0] as string);
    const g = parseChannel(parts[1] as string);
    const b = parseChannel(parts[2] as string);
    if (r === null || g === null || b === null) return null;
    return rgbaToHsva({
      r: clamp(r, 0, 255),
      g: clamp(g, 0, 255),
      b: clamp(b, 0, 255),
      a: alpha,
    });
  }

  if (name === 'hsl' || name === 'hsla') {
    const h = parseHue(parts[0] as string);
    const s = parsePercent(parts[1] as string);
    const l = parsePercent(parts[2] as string);
    if (h === null || s === null || l === null) return null;
    return hslaToHsva({ h, s: clamp(s, 0, 100), l: clamp(l, 0, 100), a: alpha });
  }

  if (name === 'hwb') {
    const h = parseHue(parts[0] as string);
    const w = parsePercent(parts[1] as string);
    const b = parsePercent(parts[2] as string);
    if (h === null || w === null || b === null) return null;
    return hwbaToHsva({ h, w: clamp(w, 0, 100), b: clamp(b, 0, 100), a: alpha });
  }

  const modern = parseCss4Color(raw);
  return modern === null ? null : colorValueToHsva(modern);
}

export function isValidColor(input: string): boolean {
  return parse(input) !== null;
}
