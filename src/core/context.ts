'use client';

import * as React from 'react';
import type { ColorStore } from './store';

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

export interface ColorPalette {
  name: string;
  colors: (string | { color: string; name?: string })[];
}

export interface PanelOptions {
  modeProps: Record<string, Record<string, unknown>>;
  palettes: ColorPalette[] | undefined;
  pencils: string[] | undefined;
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

export function cx(...parts: (string | false | null | undefined)[]): string {
  let out = '';
  for (const part of parts) {
    if (typeof part === 'string' && part !== '') out = out === '' ? part : out + ' ' + part;
  }
  return out;
}

let idCounter = 0;

export function useStableId(prefix: string): string {
  const reactUseId = (React as unknown as { useId?: () => string }).useId;
  if (typeof reactUseId === 'function') {
    return prefix + reactUseId().replace(/:/g, '');
  }
  const ref = React.useRef<string | null>(null);
  if (ref.current === null) ref.current = prefix + String(++idCounter);
  return ref.current;
}
