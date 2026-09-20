import { parse } from './parse';
import { hsvaToColorValue, parseCss4Color } from './css4';
import type { ColorValue } from './types';

export function parseColor(input: string): ColorValue | null {
  const modern = parseCss4Color(input);
  if (modern !== null) return modern;
  const legacy = parse(input);
  return legacy === null ? null : hsvaToColorValue(legacy);
}
