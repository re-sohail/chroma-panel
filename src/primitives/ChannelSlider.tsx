'use client';

import * as React from 'react';
import { clamp } from '../color/convert';
import type { Hsva } from '../color/types';
import { cx, usePanel } from '../core/context';
import { useTransientColor } from '../core/useColorStore';
import { usePointerDrag } from '../core/usePointerDrag';
import { AxisInput } from './AxisInput';

export interface ChannelSliderProps {
  label: string;
  shortLabel?: string;
  min: number;
  max: number;
  step?: number;
  read: (color: Hsva) => number;
  write: (value: number, current: Hsva) => Hsva;
  gradient?: (color: Hsva) => string;
  channel?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

export function ChannelSlider(props: ChannelSliderProps): React.ReactElement {
  const {
    label, shortLabel, min, max, step, read, write, gradient,
    channel, formatValue, className,
  } = props;
  const { store, disabled, classNames } = usePanel();

  const trackRef = React.useRef<HTMLDivElement>(null);
  const fillRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const fns = React.useRef({ read, gradient, formatValue });
  React.useEffect(() => {
    fns.current = { read, gradient, formatValue };
  });

  useTransientColor(store, (c: Hsva) => {
    const value = fns.current.read(c);
    const ratio = max === min ? 0 : clamp((value - min) / (max - min), 0, 1);

    const track = trackRef.current;
    if (track !== null) track.style.setProperty('--cp-thumb-x', `${ratio * 100}%`);

    const fill = fillRef.current;
    const g = fns.current.gradient;
    if (fill !== null && g !== undefined) fill.style.background = g(c);

    const input = inputRef.current;
    if (input !== null) {
      input.value = String(value);
      const text = fns.current.formatValue?.(value) ?? String(Math.round(value));
      input.setAttribute('aria-valuetext', `${label} ${text}`);
    }
  });

  const drag = usePointerDrag({
    disabled,
    onMove: ({ x }) => store.set(write(min + x * (max - min), store.get())),
    onEnd: () => store.commit(),
  });

  const initial = read(store.get());

  const track = (
    <div
      ref={trackRef}
      className={cx('cp-slider', classNames.slider, className)}
      data-cp-channel={channel}
      style={drag.style}
      onPointerDown={drag.onPointerDown}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onLostPointerCapture={drag.onLostPointerCapture}
    >
      <div ref={fillRef} className="cp-slider-fill" aria-hidden="true" />
      <AxisInput
        ref={inputRef}
        label={label}
        min={min}
        max={max}
        step={step ?? 1}
        defaultValue={initial}
        disabled={disabled}
        onInput={(v) => store.set(write(v, store.get()))}
        onCommit={() => store.commit()}
      />
      <div className={cx('cp-thumb', classNames.thumb)} aria-hidden="true" />
    </div>
  );

  if (shortLabel === undefined) return track;

  return (
    <div className="cp-slider-row">
      <span className="cp-slider-label" aria-hidden="true">{shortLabel}</span>
      {track}
    </div>
  );
}
