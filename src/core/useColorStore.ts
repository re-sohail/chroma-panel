'use client';

import * as React from 'react';
import type { Hsva } from '../color/types';
import type { ColorStore } from './store';

type SubscribeFn = (onChange: () => void) => () => void;

/**
 * React 18 gave us useSyncExternalStore; 16.8 and 17 did not have it.
 *
 * Rather than take a dependency on the official shim, fall back to a
 * subscribe-and-force-render hook. Those versions render synchronously, so
 * the tearing that useSyncExternalStore exists to prevent cannot occur there.
 */
function useSyncExternalStoreFallback<T>(subscribe: SubscribeFn, getSnapshot: () => T): T {
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
    check(); // catch a change that landed between render and subscribe
    return subscribe(check);
  }, [subscribe, getSnapshot]);

  return value;
}

const useSyncExternal: <T>(s: SubscribeFn, g: () => T, sv?: () => T) => T =
  (React as unknown as { useSyncExternalStore?: typeof useSyncExternalStoreFallback })
    .useSyncExternalStore ?? useSyncExternalStoreFallback;

/**
 * Subscribe a React component to the store.
 *
 * Use this ONLY where React must re-render: text fields, the preview swatch's
 * accessible label, the public onChange bridge. Anything that moves during a
 * drag should use `useTransientColor` instead and mutate the DOM.
 */
export function useColorValue(store: ColorStore): Hsva {
  return useSyncExternal(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

/**
 * Subscribe WITHOUT re-rendering.
 *
 * `effect` runs once on mount and again on every colour change, outside of
 * React's render cycle. This is what keeps a drag at zero renders.
 */
export function useTransientColor(store: ColorStore, effect: (color: Hsva) => void): void {
  const latest = React.useRef(effect);

  React.useEffect(() => {
    latest.current = effect;
  });

  React.useEffect(() => {
    const run = (color: Hsva): void => latest.current(color);
    run(store.get());
    return store.subscribe(run);
  }, [store]);
}