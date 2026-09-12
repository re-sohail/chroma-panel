import { describe, expect, it, vi } from 'vitest';
import { createColorStore } from '../src/core/store';
import { parse } from '../src/color/parse';
import { toHex } from '../src/color/serialize';
import type { Hsva } from '../src/color/types';

const RED: Hsva = { h: 0, s: 100, v: 100, a: 1 };

describe('createColorStore', () => {
  it('reads back what it was given', () => {
    expect(createColorStore(RED).get()).toEqual(RED);
  });

  it('notifies subscribers on change', () => {
    const store = createColorStore(RED);
    const seen: Hsva[] = [];
    store.subscribe((c) => seen.push(c));

    store.set({ ...RED, h: 120 });
    expect(seen).toHaveLength(1);
    expect(seen[0]!.h).toBe(120);
  });

  it('does not notify when the value is unchanged', () => {
    const store = createColorStore(RED);
    const listener = vi.fn();
    store.subscribe(listener);

    store.set({ ...RED });         // structurally equal
    store.patch({ h: 0 });         // same value
    expect(listener).not.toHaveBeenCalled();
  });

  it('unsubscribes cleanly', () => {
    const store = createColorStore(RED);
    const listener = vi.fn();
    const off = store.subscribe(listener);

    store.set({ ...RED, h: 10 });
    off();
    store.set({ ...RED, h: 20 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not skip a listener when another unsubscribes mid-notify', () => {
    const store = createColorStore(RED);
    const second = vi.fn();
    let offFirst = (): void => {};
    offFirst = store.subscribe(() => offFirst());
    store.subscribe(second);

    store.set({ ...RED, h: 42 });
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe('getSnapshot identity', () => {
  // useSyncExternalStore throws "getSnapshot should be cached" and loops
  // forever if this returns a fresh object each call.
  it('is stable between changes', () => {
    const store = createColorStore(RED);
    expect(store.getSnapshot()).toBe(store.getSnapshot());

    store.set({ ...RED, h: 90 });
    const after = store.getSnapshot();
    expect(after).toBe(store.getSnapshot());
    expect(after.h).toBe(90);
  });

  it('has a server snapshot so SSR does not throw', () => {
    const store = createColorStore(RED);
    expect(store.getServerSnapshot()).toBe(store.getSnapshot());
  });
});

describe('patch writes only the axes a control owns', () => {
  it('leaves the other axes untouched', () => {
    const store = createColorStore({ h: 200, s: 50, v: 60, a: 0.8 });
    store.patch({ s: 75 });
    expect(store.get()).toEqual({ h: 200, s: 75, v: 60, a: 0.8 });
  });
});

describe('ingest keeps powerless components alive', () => {
  it('holds hue when an external black arrives', () => {
    const store = createColorStore({ h: 265, s: 80, v: 50, a: 1 });
    store.ingest(parse('#000000')!);

    expect(store.get().h).toBe(265);
    expect(store.get().s).toBe(80);
    expect(store.get().v).toBe(0);
  });

  it('lets the user climb back out of black with the original hue', () => {
    const store = createColorStore({ h: 265, s: 80, v: 50, a: 1 });
    store.ingest(parse('#000000')!);
    store.patch({ v: 50 });
    expect(toHex(store.get())).toBe('#441a80');
  });

  it('accepts a genuine external colour wholesale', () => {
    const store = createColorStore(RED);
    store.ingest(parse('#00ff00')!);
    expect(toHex(store.get())).toBe('#00ff00');
  });
});

describe('commit', () => {
  it('notifies commit listeners with the current colour', () => {
    const store = createColorStore(RED);
    const onCommit = vi.fn();
    store.subscribeCommit(onCommit);

    store.patch({ h: 180 });
    expect(onCommit).not.toHaveBeenCalled(); // change alone is not a commit

    store.commit();
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit.mock.calls[0]![0].h).toBe(180);
  });

  it('keeps commit and change subscriptions independent', () => {
    const store = createColorStore(RED);
    const onChange = vi.fn();
    const onCommit = vi.fn();
    store.subscribe(onChange);
    const off = store.subscribeCommit(onCommit);

    off();
    store.patch({ v: 10 });
    store.commit();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onCommit).not.toHaveBeenCalled();
  });
});
