'use client';

import * as React from 'react';

export function useScrollFade(
  ref: React.RefObject<HTMLElement | null>,
  key?: unknown,
  axis: 'x' | 'y' = 'y',
): void {
  React.useEffect(() => {
    const el = ref.current;
    if (el === null || typeof ResizeObserver === 'undefined') return;

    const horizontal = axis === 'x';
    let frame = 0;

    const apply = (): void => {
      frame = 0;
      const offset = horizontal ? el.scrollLeft : el.scrollTop;
      const view = horizontal ? el.clientWidth : el.clientHeight;
      const total = horizontal ? el.scrollWidth : el.scrollHeight;
      const before = offset > 1;
      const after = offset + view < total - 1;

      const next = before && after ? 'both' : before ? 'start' : after ? 'end' : null;
      if (next === null) el.removeAttribute('data-cp-fade');
      else if (el.getAttribute('data-cp-fade') !== next) el.setAttribute('data-cp-fade', next);
    };

    const schedule = (): void => {
      if (frame === 0) frame = requestAnimationFrame(apply);
    };

    apply();
    el.addEventListener('scroll', schedule, { passive: true });

    const observer = new ResizeObserver(schedule);
    observer.observe(el);
    for (let i = 0; i < el.children.length; i++) observer.observe(el.children[i] as Element);

    return () => {
      el.removeEventListener('scroll', schedule);
      observer.disconnect();
      if (frame !== 0) cancelAnimationFrame(frame);
      el.removeAttribute('data-cp-fade');
    };
  }, [ref, key, axis]);
}
