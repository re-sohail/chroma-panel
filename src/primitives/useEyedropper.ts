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
  supported: boolean;
  pick: () => Promise<string | null>;
}

export function useEyedropper(): Eyedropper {
  const [supported, setSupported] = React.useState(false);

  React.useEffect(() => {
    setSupported(getConstructor() !== null);
  }, []);

  const pick = React.useCallback(async (): Promise<string | null> => {
    const Ctor = getConstructor();
    if (Ctor === null) return null;
    try {
      const result = await new Ctor().open();
      return result.sRGBHex;
    } catch {
      return null;
    }
  }, []);

  return { supported, pick };
}
