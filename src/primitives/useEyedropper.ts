'use client';

import * as React from 'react';

interface EyeDropperResult {
  sRGBHex: string;
}

interface EyeDropperInstance {
  open: (options?: { signal?: AbortSignal }) => Promise<EyeDropperResult>;
}

type EyeDropperCtor = new () => EyeDropperInstance;

function getConstructor(): EyeDropperCtor | null {
  if (typeof window === 'undefined') return null;
  const ctor = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper;
  return typeof ctor === 'function' ? ctor : null;
}

export interface Eyedropper {
  /** False in Firefox and Safari, which have not shipped the API. */
  supported: boolean;
  /** Resolves to an `#rrggbb` string, or null if the user cancelled. */
  pick: () => Promise<string | null>;
}

/**
 * Screen colour picking, as progressive enhancement.
 *
 * Feature-detected rather than assumed: the API is Chromium-only, and a
 * button that silently does nothing in Firefox is a bug report. The caller
 * should hide or disable the control when `supported` is false.
 *
 * Detection runs in an effect, not during render, so the server and the first
 * client render agree and hydration stays clean.
 */
export function useEyedropper(): Eyedropper {
  const [supported, setSupported] = React.useState(false);

  React.useEffect(() => {
    setSupported(getConstructor() !== null);
  }, []);

  const pick = React.useCallback(async (): Promise<string | null> => {
    const Ctor = getConstructor();
    if (Ctor === null) return null;
    try {
      // Must be called from a user gesture; the click handler is one.
      const result = await new Ctor().open();
      return result.sRGBHex;
    } catch {
      // AbortError is the normal "user pressed Escape" path, not a failure.
      return null;
    }
  }, []);

  return { supported, pick };
}
