'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../core/context';
import { COMPACT_QUERY, useMediaQuery } from '../core/useMediaQuery';

export interface PopoverProps {
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  offset?: number;
  sheetOnMobile?: boolean;
  className?: string;
  children: React.ReactNode;
}

const MARGIN = 8;

const MIN_AVAILABLE = 160;

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
  'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Popover(props: PopoverProps): React.ReactElement | null {
  const {
    anchor, open, onClose, offset = 8, sheetOnMobile = true, className, children,
  } = props;

  const panelRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] =
    React.useState<{ top: number; left: number; available: number } | null>(null);

  const compact = useMediaQuery(COMPACT_QUERY);
  const asSheet = sheetOnMobile && compact;

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const place = React.useCallback((): void => {
    const panel = panelRef.current;
    if (anchor === null || panel === null) return;

    const a = anchor.getBoundingClientRect();
    const p = panel.getBoundingClientRect();

    const below = window.innerHeight - a.bottom - offset - MARGIN;
    const above = a.top - offset - MARGIN;

    let top: number;
    let available: number;
    if (p.height <= below || (below >= above && p.height > above)) {
      top = a.bottom + offset;
      available = below;
    } else {
      available = above;
      top = Math.max(MARGIN, a.top - offset - p.height);
    }

    let left = a.left;
    const maxLeft = window.innerWidth - p.width - MARGIN;
    if (left > maxLeft) left = Math.max(MARGIN, maxLeft);
    if (left < MARGIN) left = MARGIN;

    setPosition({
      top: top + window.scrollY,
      left: left + window.scrollX,
      available: Math.max(available, MIN_AVAILABLE),
    });
  }, [anchor, offset]);

  React.useLayoutEffect(() => {
    if (!open || asSheet) {
      setPosition(null);
      return;
    }
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, asSheet, place]);

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
      if (anchor?.contains(target) === true) return; 
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
        <div className="cp-scrim" aria-hidden="true" />
        <div ref={panelRef} className={cx('cp-sheet', className)} tabIndex={-1}>
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
        visibility: position === null ? 'hidden' : 'visible',
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
