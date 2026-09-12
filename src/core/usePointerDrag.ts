'use client';

import * as React from 'react';
import { clamp } from '../color/convert';

/** Pointer position normalised to 0-1 within the target element. */
export interface DragPosition {
  x: number;
  y: number;
}

export interface UsePointerDragOptions {
  /** Fires at most once per animation frame while dragging. */
  onMove: (position: DragPosition) => void;
  onStart?: (position: DragPosition) => void;
  /** Fires on pointerup, pointercancel, and any lost capture. */
  onEnd?: () => void;
  disabled?: boolean;
}

export interface PointerDragProps {
  onPointerDown: React.PointerEventHandler<HTMLElement>;
  onPointerMove: React.PointerEventHandler<HTMLElement>;
  onPointerUp: React.PointerEventHandler<HTMLElement>;
  onLostPointerCapture: React.PointerEventHandler<HTMLElement>;
  style: React.CSSProperties;
}

function positionIn(element: HTMLElement, clientX: number, clientY: number): DragPosition {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.width === 0 ? 0 : clamp((clientX - rect.left) / rect.width, 0, 1),
    y: rect.height === 0 ? 0 : clamp((clientY - rect.top) / rect.height, 0, 1),
  };
}

/**
 * Drag behaviour for the 2D area, the wheel and every slider.
 *
 * Two deliberate choices:
 *
 * 1. Pointer capture instead of document-level listeners. The pointer is tied
 *    to the element, so dragging outside the window, over an iframe or across
 *    another element all keep working, and `lostpointercapture` gives one
 *    place to handle pointerup, pointercancel and element removal. Libraries
 *    that bind mouse+touch on the document instead are the ones with open
 *    "drag gets stuck when I mix touch and mouse" bugs.
 *
 * 2. `touch-action: none` in CSS rather than preventDefault() on touchmove.
 *    Touch listeners are passive by default, so preventDefault() there is
 *    ignored and logs a console error.
 */
export function usePointerDrag(options: UsePointerDragOptions): PointerDragProps {
  const latest = React.useRef(options);
  React.useEffect(() => {
    latest.current = options;
  });

  const frame = React.useRef(0);
  const pending = React.useRef<DragPosition | null>(null);
  const dragging = React.useRef(false);
  const activePointer = React.useRef<number | null>(null);
  const captured = React.useRef(false);

  // Flush any coalesced move immediately — used before ending a drag so the
  // final pointer position is never dropped on the floor.
  const flush = React.useCallback((): void => {
    if (frame.current !== 0) {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    }
    if (pending.current !== null) {
      latest.current.onMove(pending.current);
      pending.current = null;
    }
  }, []);

  React.useEffect(() => {
    return () => {
      if (frame.current !== 0) cancelAnimationFrame(frame.current);
    };
  }, []);

  const schedule = React.useCallback((position: DragPosition): void => {
    pending.current = position;
    if (frame.current !== 0) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const next = pending.current;
      pending.current = null;
      if (next !== null) latest.current.onMove(next);
    });
  }, []);

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLElement>): void => {
      if (latest.current.disabled === true) return;
      // Ignore secondary mouse buttons; touch and pen report button 0.
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      const element = event.currentTarget;

      // Best-effort: setPointerCapture throws NotFoundError when the pointer
      // id is not currently active, which happens with synthetic events and in
      // a few exotic embedding contexts. A failure here must degrade the drag,
      // never break it, so the drag is tracked by pointer id as well.
      try {
        element.setPointerCapture(event.pointerId);
        captured.current = true;
      } catch {
        captured.current = false;
      }

      event.preventDefault(); // stop text selection and the focus flicker

      dragging.current = true;
      activePointer.current = event.pointerId;
      const position = positionIn(element, event.clientX, event.clientY);
      latest.current.onStart?.(position);
      latest.current.onMove(position);
    },
    [],
  );

  const onPointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLElement>): void => {
      if (!dragging.current || latest.current.disabled === true) return;
      // Ignore any pointer that is not the one that started this drag — a
      // second finger, say. Comparing ids rather than asking for capture keeps
      // this correct even when capture was refused above.
      if (activePointer.current !== event.pointerId) return;
      schedule(positionIn(event.currentTarget, event.clientX, event.clientY));
    },
    [schedule],
  );

  // Covers pointerup, pointercancel (iOS system gestures), tab switches and
  // the element being removed mid-drag — all of which release capture.
  const endDrag = React.useCallback((): void => {
    if (!dragging.current) return;
    dragging.current = false;
    activePointer.current = null;
    captured.current = false;
    flush();
    latest.current.onEnd?.();
  }, [flush]);

  const onLostPointerCapture = React.useCallback((): void => endDrag(), [endDrag]);

  // Safety net for the no-capture path: without capture there is no
  // lostpointercapture event, so a pointerup outside the element would leave
  // the drag stuck on forever.
  const onPointerUp = React.useCallback(
    (event: React.PointerEvent<HTMLElement>): void => {
      if (captured.current) return; // lostpointercapture will handle it
      if (activePointer.current !== event.pointerId) return;
      endDrag();
    },
    [endDrag],
  );

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const onWindowUp = (event: PointerEvent): void => {
      if (captured.current || !dragging.current) return;
      if (activePointer.current !== event.pointerId) return;
      endDrag();
    };
    document.addEventListener('pointerup', onWindowUp);
    document.addEventListener('pointercancel', onWindowUp);
    return () => {
      document.removeEventListener('pointerup', onWindowUp);
      document.removeEventListener('pointercancel', onWindowUp);
    };
  }, [endDrag]);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onLostPointerCapture,
    style: {
      touchAction: 'none',
      WebkitUserSelect: 'none',
      userSelect: 'none',
      // Suppresses the iOS long-press callout over a draggable surface.
      WebkitTouchCallout: 'none',
    } as React.CSSProperties,
  };
}

/* ------------------------------------------------------------------ *
 * Keyboard
 * ------------------------------------------------------------------ */

export interface UseAxisKeyboardOptions {
  /** Delta in the control's own units (already scaled by step size). */
  onStep: (delta: DragPosition) => void;
  /** Home / End — jump to an extreme of one axis. */
  onEdge?: (edge: 'min' | 'max', axis: 'x' | 'y') => void;
  onEnd?: () => void;
  /** Arrow key increment. Default 1. */
  step?: number;
  /** Shift+arrow and PageUp/PageDown increment. Default 10. */
  largeStep?: number;
  /** Restrict to one axis for 1D controls. Default 'both'. */
  axis?: 'x' | 'y' | 'both';
  disabled?: boolean;
}

export interface AxisKeyboardProps {
  onKeyDown: React.KeyboardEventHandler<HTMLElement>;
  onKeyUp: React.KeyboardEventHandler<HTMLElement>;
}

/**
 * WCAG 2.1.1 keyboard operation for every colour surface.
 *
 * Missing keyboard support on the saturation/hue/alpha controls is an open
 * accessibility bug in more than one popular picker, so this is wired into
 * the shared primitive rather than left to each mode.
 */
export function useAxisKeyboard(options: UseAxisKeyboardOptions): AxisKeyboardProps {
  const latest = React.useRef(options);
  React.useEffect(() => {
    latest.current = options;
  });

  const onKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLElement>): void => {
    const o = latest.current;
    if (o.disabled === true) return;

    const step = o.step ?? 1;
    const large = o.largeStep ?? 10;
    const axis = o.axis ?? 'both';
    const allowX = axis === 'x' || axis === 'both';
    const allowY = axis === 'y' || axis === 'both';
    const amount = event.shiftKey ? large : step;

    let dx = 0;
    let dy = 0;

    switch (event.key) {
      case 'ArrowLeft': if (allowX) dx = -amount; break;
      case 'ArrowRight': if (allowX) dx = amount; break;
      case 'ArrowUp': if (allowY) dy = amount; else if (allowX) dx = amount; break;
      case 'ArrowDown': if (allowY) dy = -amount; else if (allowX) dx = -amount; break;
      case 'PageUp': if (allowY) dy = large; else if (allowX) dx = large; break;
      case 'PageDown': if (allowY) dy = -large; else if (allowX) dx = -large; break;
      case 'Home':
        o.onEdge?.('min', allowX ? 'x' : 'y');
        event.preventDefault();
        return;
      case 'End':
        o.onEdge?.('max', allowX ? 'x' : 'y');
        event.preventDefault();
        return;
      default:
        return;
    }

    if (dx === 0 && dy === 0) return;
    event.preventDefault(); // stop the page scrolling under the picker
    o.onStep({ x: dx, y: dy });
  }, []);

  const onKeyUp = React.useCallback((event: React.KeyboardEvent<HTMLElement>): void => {
    const key = event.key;
    if (
      key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' ||
      key === 'ArrowDown' || key === 'PageUp' || key === 'PageDown' ||
      key === 'Home' || key === 'End'
    ) {
      latest.current.onEnd?.();
    }
  }, []);

  return { onKeyDown, onKeyUp };
}