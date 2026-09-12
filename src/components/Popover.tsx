'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../core/context';
import { COMPACT_QUERY, useMediaQuery } from '../core/useMediaQuery';

export interface PopoverProps {
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  /** Gap between anchor and panel, in px. Default 8. */
  offset?: number;
  /**
   * Present as a bottom sheet on narrow viewports. Default true.
   * Set false to keep an anchored popover at every size.
   */
  sheetOnMobile?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Breathing room between the panel and the viewport edge, in px. */
const MARGIN = 8;

/** Floor for the clamp, so an extreme viewport still leaves something usable. */
const MIN_AVAILABLE = 160;

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
  'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * An anchored popover that becomes a bottom sheet on small screens.
 *
 * Rendered through a portal on document.body so it escapes `overflow: hidden`
 * and stacking contexts — the usual cause of "the picker is clipped inside my
 * modal" reports.
 *
 * The two presentations are separate layouts rather than one that stretches,
 * which is what Apple, Radix and Vaul all do: a popover points at something,
 * a sheet does not.
 */
export function Popover(props: PopoverProps): React.ReactElement | null {
  const {
    anchor, open, onClose, offset = 8, sheetOnMobile = true, className, children,
  } = props;

  const panelRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] =
    React.useState<{ top: number; left: number; available: number } | null>(null);

  const compact = useMediaQuery(COMPACT_QUERY);
  const asSheet = sheetOnMobile && compact;

  // Portals need a DOM; render nothing on the server and on the first paint.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const place = React.useCallback((): void => {
    const panel = panelRef.current;
    if (anchor === null || panel === null) return;

    const a = anchor.getBoundingClientRect();
    const p = panel.getBoundingClientRect();

    // Room on each side, measured from the ANCHOR and the viewport only —
    // never from the panel's own height. That independence is what stops this
    // oscillating: clamping changes p.height, and a side chosen from p.height
    // could then flip back and forth on every scroll event.
    const below = window.innerHeight - a.bottom - offset - MARGIN;
    const above = a.top - offset - MARGIN;

    // Below by default; flip above when it does not fit and would there.
    // When it fits neither, take the roomier side and let the panel scroll —
    // previously it stayed below and simply ran off the screen, putting the
    // footer and its OK button out of reach.
    let top: number;
    let available: number;
    if (p.height <= below || (below >= above && p.height > above)) {
      top = a.bottom + offset;
      available = below;
    } else {
      available = above;
      // Pin to the top margin when the panel is taller than the gap it is
      // about to occupy, so its top edge stays on screen.
      top = Math.max(MARGIN, a.top - offset - p.height);
    }

    let left = a.left;
    const maxLeft = window.innerWidth - p.width - MARGIN;
    if (left > maxLeft) left = Math.max(MARGIN, maxLeft);
    if (left < MARGIN) left = MARGIN;

    setPosition({
      top: top + window.scrollY,
      left: left + window.scrollX,
      // Never negative: a tiny viewport should give a small scrollable panel,
      // not a collapsed one.
      available: Math.max(available, MIN_AVAILABLE),
    });
  }, [anchor, offset]);

  React.useLayoutEffect(() => {
    if (!open || asSheet) {
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
  }, [open, asSheet, place]);

  // Move focus in on open, and back to the trigger on close.
  //
  // Gated on the panel being visible: until a popover has been measured it is
  // still `visibility: hidden`, and focus() on an element inside a hidden
  // subtree silently does nothing, stranding keyboard users on <body>.
  const hasFocused = React.useRef(false);
  const visible = asSheet || position !== null;

  React.useEffect(() => {
    if (!open) {
      hasFocused.current = false;
      return;
    }
    const panel = panelRef.current;
    if (panel === null || !visible || hasFocused.current) return;

    hasFocused.current = true;
    const previous = document.activeElement as HTMLElement | null;
    const first = panel.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel).focus({ preventScroll: true });

    return () => {
      // Only restore if focus is still inside; otherwise the user has moved on
      // deliberately and yanking it back would be hostile.
      if (panel.contains(document.activeElement)) previous?.focus({ preventScroll: true });
    };
  }, [open, visible]);

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

  if (asSheet) {
    return createPortal(
      <div className="cp-sheet-root" data-cp-open="true">
        {/* Scrim. Dismissal is handled by the document-level pointerdown
            listener above, so this stays presentational. */}
        <div className="cp-scrim" aria-hidden="true" />
        <div ref={panelRef} className={cx('cp-sheet', className)} tabIndex={-1}>
          {/* A real control, not decoration. Tapping the scrim and swiping
              are both pointer gestures, which would leave a screen-reader or
              switch user with no way out of the sheet. It looks exactly like
              the handle it already was. */}
          <button
            type="button"
            className="cp-grabber"
            aria-label="Close"
            onClick={onClose}
          />
          {children}
        </div>
      </div>,
      document.body,
    );
  }

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
        // Spent by ".cp-popover .cp-root { max-height: var(--cp-available-h) }".
        // Left unset until measured, so the panel is its natural height for the
        // measurement that decides the clamp.
        ...(position === null
          ? null
          : { ['--cp-available-h' as string]: `${position.available}px` }),
      } as React.CSSProperties}
    >
      {children}
    </div>,
    document.body,
  );
}
