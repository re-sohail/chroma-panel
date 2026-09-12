'use client';

import * as React from 'react';

export function useScrollFade(
  ref: React.RefObject<HTMLElement | null>,
  key?: unknown,
): void {
  React.useEffect(() => {
    const el = ref.current;
    if (el === null || typeof ResizeObserver === 'undefined') return;

    let frame = 0;

    const apply = (): void => {
      frame = 0;
      const above = el.scrollTop > 1;
      const below = el.scrollTop + el.clientHeight < el.scrollHeight - 1;

      const next = above && below ? 'both' : above ? 'top' : below ? 'bottom' : null;
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
  }, [ref, key]);
}
