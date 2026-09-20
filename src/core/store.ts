import { ingest, sameHsva } from '../color/sticky';
import type { ColorChangeMeta, ColorChangeSource, Hsva } from '../color/types';

export type ColorListener = (color: Hsva, meta: ColorChangeMeta) => void;
export type Unsubscribe = () => void;

export interface ColorStore {
  get(): Hsva;
  set(next: Hsva, source?: ColorChangeSource): void;
  patch(partial: Partial<Hsva>, source?: ColorChangeSource): void;
  ingest(next: Hsva, source?: ColorChangeSource): void;
  commit(source?: ColorChangeSource): void;

  subscribe(listener: ColorListener): Unsubscribe;
  subscribeCommit(listener: ColorListener): Unsubscribe;

  getSnapshot(): Hsva;
  getServerSnapshot(): Hsva;
}

export function createColorStore(initial: Hsva): ColorStore {
  let state: Hsva = initial;
  let lastSource: ColorChangeSource = 'unknown';
  const listeners = new Set<ColorListener>();
  const commitListeners = new Set<ColorListener>();

  function emit(source: ColorChangeSource): void {
    for (const listener of Array.from(listeners)) listener(state, { phase: 'change', source });
  }

  function set(next: Hsva, source: ColorChangeSource = 'unknown'): void {
    if (sameHsva(state, next)) return;
    state = next;
    lastSource = source;
    emit(source);
  }

  return {
    get: () => state,
    set,
    patch: (partial: Partial<Hsva>, source?: ColorChangeSource): void => set({ ...state, ...partial }, source),
    ingest: (next: Hsva, source?: ColorChangeSource): void => set(ingest(next, state), source),
    commit: (source: ColorChangeSource = lastSource): void => {
      for (const listener of Array.from(commitListeners)) listener(state, { phase: 'commit', source });
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
