import { ingest, sameHsva } from '../color/sticky';
import type { Hsva } from '../color/types';

export type ColorListener = (color: Hsva) => void;
export type Unsubscribe = () => void;

/**
 * A framework-free colour store.
 *
 * This exists so that dragging can update the UI without React rendering at
 * all. A 120Hz pointer stream driven through `setState` would schedule 120
 * reconciliations per second across the whole panel — and across the
 * consumer's tree too, if they lifted the value. Instead, listeners are
 * notified synchronously and the surfaces mutate the DOM directly; React only
 * hears about it where it genuinely needs to (text fields, the public
 * `onChange`).
 */
export interface ColorStore {
  /** Current canonical colour. Never rounded. */
  get(): Hsva;
  /**
   * Replace the colour wholesale. Use for axis writes you fully control.
   * No-ops when the value is unchanged, so listeners never see a false change.
   */
  set(next: Hsva): void;
  /** Write only the axes a control owns, leaving the rest untouched. */
  patch(partial: Partial<Hsva>): void;
  /**
   * Accept a colour from outside (controlled prop, hex field, eyedropper),
   * merging rather than replacing so powerless hue/saturation survive.
   */
  ingest(next: Hsva): void;
  /** Signal the end of an interaction — drives `onChangeComplete`. */
  commit(): void;

  subscribe(listener: ColorListener): Unsubscribe;
  subscribeCommit(listener: ColorListener): Unsubscribe;

  /**
   * Stable snapshot for useSyncExternalStore. The identity only changes when
   * the colour actually changes; returning a fresh object on every call would
   * trip React's "getSnapshot should be cached" infinite loop.
   */
  getSnapshot(): Hsva;
  /** Required, or server rendering throws. */
  getServerSnapshot(): Hsva;
}

export function createColorStore(initial: Hsva): ColorStore {
  let state: Hsva = initial;
  const listeners = new Set<ColorListener>();
  const commitListeners = new Set<ColorListener>();

  function emit(): void {
    // Iterate a copy so a listener that unsubscribes mid-notify cannot make
    // the Set skip its neighbour.
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
