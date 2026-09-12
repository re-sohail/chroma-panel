'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../core/context';

export interface PopoverProps {
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  /** Gap between anchor and panel, in px. Default 8. */
  offset?: number;
  className?: string;
  children: React.ReactNode;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
  'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * An anchored, focus-trapped popover with no positioning dependency.
 *
 * Rendered through a portal on document.body so it escapes `overflow: hidden`
 * and stacking contexts — the usual cause of "the picker is clipped inside my
 * modal" reports.
 */
export function Popover(props: PopoverProps): React.ReactElement | null {
  const { anchor, open, onClose, offset = 8, className, children } = props;
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null);

  // Portals need a DOM; render nothing on the server and on first paint.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const place = React.useCallback((): void => {
    const panel = panelRef.current;
    if (anchor === null || panel === null) return;

    const a = anchor.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Below by default; flip above when it would overflow the viewport and
    // there is more room up there.
    let top = a.bottom + offset;
    if (top + p.height > window.innerHeight && a.top - offset - p.height > 0) {
      top = a.top - offset - p.height;
    }

    // Keep within the viewport horizontally.
    let left = a.left;
    const maxLeft = window.innerWidth - p.width - 8;
    if (left > maxLeft) left = Math.max(8, maxLeft);
    if (left < 8) left = 8;

    setPosition({ top: top + scrollY, left: left + scrollX });
  }, [anchor, offset]);

  React.useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    place();

    // Capture phase so nested scrollers reposition us too.
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, place]);

  // Move focus in on open, and back to the trigger on close.
  //
  // Gated on `position` having been measured, because until then the panel is
  // still `visibility: hidden` -- and focus() on an element inside a hidden
  // subtree silently does nothing. Focusing before measurement leaves the
  // popover open with focus stranded on <body>, which strands keyboard users.
  const hasFocused = React.useRef(false);

  React.useEffect(() => {
    if (!open) {
      hasFocused.current = false;
      return;
    }
    const panel = panelRef.current;
    if (panel === null || position === null || hasFocused.current) return;

    hasFocused.current = true;
    const previous = document.activeElement as HTMLElement | null;
    const first = panel.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel).focus({ preventScroll: true });

    return () => {
      // Only restore if focus is still inside us; otherwise the user has
      // deliberately moved on and yanking focus back would be hostile.
      if (panel.contains(document.activeElement)) previous?.focus({ preventScroll: true });
    };
  }, [open, position]);

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        anchor?.focus({ preventScroll: true });
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (panel === null) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (items.length === 0) return;

      const first = items[0] as HTMLElement;
      const last = items[items.length - 1] as HTMLElement;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) === true) return;
      if (anchor?.contains(target) === true) return; // the trigger toggles itself
      onClose();
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [open, onClose, anchor]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      ref={panelRef}
      className={cx('cp-popover', className)}
      tabIndex={-1}
      style={{
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        // Avoid a first-frame flash at 0,0 before measurement lands.
        visibility: position === null ? 'hidden' : 'visible',
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
