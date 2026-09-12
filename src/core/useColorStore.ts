'use client';

import * as React from 'react';
import type { Hsva } from '../color/types';
import type { ColorStore } from './store';

type SubscribeFn = (onChange: () => void) => () => void;

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
    check(); 
    return subscribe(check);
  }, [subscribe, getSnapshot]);

  return value;
}

const useSyncExternal: <T>(s: SubscribeFn, g: () => T, sv?: () => T) => T =
  (React as unknown as { useSyncExternalStore?: typeof useSyncExternalStoreFallback })
    .useSyncExternalStore ?? useSyncExternalStoreFallback;

export function useColorValue(store: ColorStore): Hsva {
  return useSyncExternal(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

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
