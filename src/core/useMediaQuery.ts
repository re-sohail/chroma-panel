'use client';

import * as React from 'react';

type Subscribe = (onChange: () => void) => () => void;

function useSyncExternalStoreFallback<T>(subscribe: Subscribe, getSnapshot: () => T): T {
  const value = getSnapshot();
  const [, force] = React.useState(0);
  const latest = React.useRef(value);

  React.useEffect(() => {
    latest.current = value;
  });

  React.useEffect(() => {
    const check = (): void => {
      const next = getSnapshot();
      if (!Object.is(latest.current, next)) {
        latest.current = next;
        force((n) => n + 1);
      }
    };
    check();
    return subscribe(check);
  }, [subscribe, getSnapshot]);

  return value;
}

const useSyncExternal: <T>(s: Subscribe, g: () => T, sv?: () => T) => T =
  (React as unknown as { useSyncExternalStore?: typeof useSyncExternalStoreFallback })
    .useSyncExternalStore ?? useSyncExternalStoreFallback;

export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => {};
      }
      const list = window.matchMedia(query);
      if (typeof list.addEventListener === 'function') {
        list.addEventListener('change', onChange);
        return () => list.removeEventListener('change', onChange);
      }
      list.addListener(onChange);
      return () => list.removeListener(onChange);
    },
    [query],
  );

  const getSnapshot = React.useCallback((): boolean => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = React.useCallback((): boolean => false, []);

  return useSyncExternal(subscribe, getSnapshot, getServerSnapshot);
}

export const COMPACT_QUERY = '(max-width: 640px)';
