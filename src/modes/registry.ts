import type * as React from 'react';
import { warnOnce } from '../core/dev';

export type ModeId = 'wheel' | 'sliders' | 'palettes' | 'image' | 'pencils';

export interface PickerMode {
  id: string;
  label: string;
  icon: React.ComponentType;
  Panel: React.ComponentType;
}

const registry = new Map<string, PickerMode>();

export function registerMode(mode: PickerMode): void {
  registry.set(mode.id, mode);
}

export function getMode(id: string): PickerMode | undefined {
  return registry.get(id);
}

export function resolveModes(requested: readonly (string | PickerMode)[]): PickerMode[] {
  const out: PickerMode[] = [];
  for (const entry of requested) {
    if (typeof entry !== 'string') {
      out.push(entry);
      continue;
    }
    const found = registry.get(entry);
    if (found !== undefined) {
      out.push(found);
    } else {
      warnOnce(
        `unknown mode "${entry}". Known modes: ${Array.from(registry.keys()).join(', ')}.`,
      );
    }
  }
  return out;
}
