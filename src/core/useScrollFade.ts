'use client';

import * as React from 'react';

/**
 * Fades the edge of a scroll container that has more content beyond it.
 *
 * Writes one attribute and nothing else:
 *
 *   data-cp-fade="top" | "bottom" | "both"   — or absent
 *
 * The stylesheet turns that into a `mask-image`. Two properties are the whole
 * point of doing it this way:
 *
 * 1. **A mask, not an overlay.** The content fades itself, so nothing is ever
 *    layered on top of a swatch — the failure mode where an edge ends up
 *    half-buried under a gradient cannot happen.
 * 2. **Absent, not zero, when nothing scrolls.** Removing the attribute
 *    removes the mask entirely, so the modes that fit carry no stacking
 *    context and nothing gets dimmed that was already fully visible. Reaching
 *    either end clears that side the same way.
 *
 * It mutates the DOM directly and holds no React state, so it causes **zero
 * renders** — the same transient approach as `useTransientColor` and
 * `usePointerDrag`. A colour panel repaints on every drag frame; nothing here
 * may add to that.
 *
 * `ResizeObserver` covers the changes a scroll event cannot: switching mode,
 * and filtering the palette list, both change the content height without the
 * user scrolling at all.
 */
export function useScrollFade(
  ref: React.RefObject<HTMLElement | null>,
  /** Re-attach when the observed content is replaced wholesale. */
  key?: unknown,
): void {
  React.useEffect(() => {
    const el = ref.current;
    if (el === null || typeof ResizeObserver === 'undefined') return;

    let frame = 0;

    const apply = (): void => {
      frame = 0;
      // 1px of slack: fractional scroll offsets and zoom mean an exact
      // comparison flickers the attribute on and off at the ends.
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
    // The panel inside is what actually grows and shrinks; observing only the
    // port would miss a filtered list, whose port never changes size.
    for (let i = 0; i < el.children.length; i++) observer.observe(el.children[i] as Element);

    return () => {
      el.removeEventListener('scroll', schedule);
      observer.disconnect();
      if (frame !== 0) cancelAnimationFrame(frame);
      el.removeAttribute('data-cp-fade');
    };
  }, [ref, key]);
}
