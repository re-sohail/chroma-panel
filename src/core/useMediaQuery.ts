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

/**
 * Track a media query.
 *
 * The server snapshot is always `false`, so the first client render matches
 * the server and hydration stays clean; the real value arrives on subscribe.
 * That means a phone briefly renders the desktop branch — acceptable, and far
 * better than a hydration mismatch, which React treats as an error.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => {};
      }
      const list = window.matchMedia(query);
      // Safari below 14 has no addEventListener on MediaQueryList.
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

/**
 * The breakpoint at which the popover becomes a bottom sheet.
 *
 * A media query, not a container query: the sheet is portalled to the body and
 * sized by the viewport, and an element cannot query itself anyway. Container
 * queries are the right tool for the panel's internal layout, not for how it
 * is presented.
 */
export const COMPACT_QUERY = '(max-width: 640px)';
