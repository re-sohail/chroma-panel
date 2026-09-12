'use client';

import * as React from 'react';
import type { ColorStore } from './store';

/**
 * Per-slot class hooks.
 *
 * This is the real Tailwind story: a consumer styles any part of the panel
 * with their own utilities without having to out-specify our stylesheet.
 */
export interface ChromaClassNames {
  root?: string;
  titlebar?: string;
  toolbar?: string;
  tab?: string;
  panel?: string;
  footer?: string;
  swatch?: string;
  slider?: string;
  thumb?: string;
  field?: string;
  trigger?: string;
  popover?: string;
}

/** A named group of colours for the palettes mode. */
export interface ColorPalette {
  name: string;
  colors: (string | { color: string; name?: string })[];
}

/**
 * Everything the modes need, carried on the context rather than threaded
 * through props — so a new mode can be registered without touching the shell.
 */
export interface PanelOptions {
  palettes: ColorPalette[];
  pencils: string[];
  showAlpha: boolean;
  showEyedropper: boolean;
  showRecentColors: boolean;
  recentColors: string[];
  onRecentColorsChange?: (colors: string[]) => void;
}

export interface PanelContextValue {
  store: ColorStore;
  disabled: boolean;
  classNames: ChromaClassNames;
  options: PanelOptions;
  /** Unique per panel instance; used to build aria-controls / label ids. */
  idPrefix: string;
}

const PanelContext = React.createContext<PanelContextValue | null>(null);

export const PanelProvider: React.Provider<PanelContextValue | null> = PanelContext.Provider;

export function usePanel(): PanelContextValue {
  const value = React.useContext(PanelContext);
  if (value === null) {
    throw new Error(
      'chroma-panel: this component must be rendered inside <ChromaPanel> or <ColorInput>.',
    );
  }
  return value;
}

/** Join class names, dropping empties. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  let out = '';
  for (const part of parts) {
    if (typeof part === 'string' && part !== '') out = out === '' ? part : out + ' ' + part;
  }
  return out;
}

let idCounter = 0;

/**
 * Stable unique id.
 *
 * React.useId arrived in 18; on 16.8/17 we fall back to a module counter.
 * The counter is only reached on versions without concurrent rendering, so
 * it cannot produce a hydration mismatch there.
 */
export function useStableId(prefix: string): string {
  const reactUseId = (React as unknown as { useId?: () => string }).useId;
  if (typeof reactUseId === 'function') {
    // Safe: the branch is decided by the React build, which never changes
    // within a running app, so hook order is stable.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return prefix + reactUseId().replace(/:/g, '');
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const ref = React.useRef<string | null>(null);
  if (ref.current === null) ref.current = prefix + String(++idCounter);
  return ref.current;
}
