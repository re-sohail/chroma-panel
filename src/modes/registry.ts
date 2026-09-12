import type * as React from 'react';
import { warnOnce } from '../core/dev';

/** The five modes shipped in the box. Consumers may register their own. */
export type ModeId = 'wheel' | 'sliders' | 'palettes' | 'image' | 'pencils';

/**
 * A mode is plain data.
 *
 * Keeping it a registry rather than a switch statement is what lets a new
 * mode (OKLCH, gradients, a brand picker) be added later without editing the
 * toolbar, the panel, or any existing mode.
 */
export interface PickerMode {
  id: string;
  /** Accessible name for the toolbar tab. */
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

/**
 * Resolve the `modes` prop, which accepts ids or whole mode objects.
 * Unknown ids are dropped with a development warning rather than throwing —
 * a typo should not blank the picker.
 */
export function resolveModes(requested: (string | PickerMode)[]): PickerMode[] {
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
