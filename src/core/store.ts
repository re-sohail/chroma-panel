import { ingest, sameHsva } from '../color/sticky';
import type { Hsva } from '../color/types';

export type ColorListener = (color: Hsva) => void;
export type Unsubscribe = () => void;

export interface ColorStore {
  get(): Hsva;
  set(next: Hsva): void;
  patch(partial: Partial<Hsva>): void;
  ingest(next: Hsva): void;
  commit(): void;

  subscribe(listener: ColorListener): Unsubscribe;
  subscribeCommit(listener: ColorListener): Unsubscribe;

  getSnapshot(): Hsva;
  getServerSnapshot(): Hsva;
}

export function createColorStore(initial: Hsva): ColorStore {
  let state: Hsva = initial;
  const listeners = new Set<ColorListener>();
  const commitListeners = new Set<ColorListener>();

  function emit(): void {
    for (const listener of Array.from(listeners)) listener(state);
  }

  function set(next: Hsva): void {
    if (sameHsva(state, next)) return;
    state = next;
    emit();
  }

  return {
    get: () => state,
    set,
    patch: (partial: Partial<Hsva>): void => set({ ...state, ...partial }),
    ingest: (next: Hsva): void => set(ingest(next, state)),
    commit: (): void => {
      for (const listener of Array.from(commitListeners)) listener(state);
    },
    subscribe: (listener: ColorListener): Unsubscribe => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    subscribeCommit: (listener: ColorListener): Unsubscribe => {
      commitListeners.add(listener);
      return () => {
        commitListeners.delete(listener);
      };
    },
    getSnapshot: () => state,
    getServerSnapshot: () => state,
  };
}
