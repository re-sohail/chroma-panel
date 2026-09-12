'use client';

import * as React from 'react';
import { clamp } from '../color/convert';

export interface DragPosition {
  x: number;
  y: number;
}

export interface UsePointerDragOptions {
  onMove: (position: DragPosition) => void;
  onStart?: (position: DragPosition) => void;
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
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      const element = event.currentTarget;

      try {
        element.setPointerCapture(event.pointerId);
        captured.current = true;
      } catch {
        captured.current = false;
      }

      event.preventDefault(); 

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
      if (activePointer.current !== event.pointerId) return;
      schedule(positionIn(event.currentTarget, event.clientX, event.clientY));
    },
    [schedule],
  );

  const endDrag = React.useCallback((): void => {
    if (!dragging.current) return;
    dragging.current = false;
    activePointer.current = null;
    captured.current = false;
    flush();
    latest.current.onEnd?.();
  }, [flush]);

  const onLostPointerCapture = React.useCallback((): void => endDrag(), [endDrag]);

  const onPointerUp = React.useCallback(
    (event: React.PointerEvent<HTMLElement>): void => {
      if (captured.current) return; 
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
      WebkitTouchCallout: 'none',
    } as React.CSSProperties,
  };
}

export interface UseAxisKeyboardOptions {
  onStep: (delta: DragPosition) => void;
  onEdge?: (edge: 'min' | 'max', axis: 'x' | 'y') => void;
  onEnd?: () => void;
  step?: number;
  largeStep?: number;
  axis?: 'x' | 'y' | 'both';
  disabled?: boolean;
}

export interface AxisKeyboardProps {
  onKeyDown: React.KeyboardEventHandler<HTMLElement>;
  onKeyUp: React.KeyboardEventHandler<HTMLElement>;
}

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
    event.preventDefault(); 
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
