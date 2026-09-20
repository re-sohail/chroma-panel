'use client';

import * as React from 'react';
import type { Hsva } from '../color/types';
import { cx, usePanel } from '../core/context';
import { useTransientColor } from '../core/useColorStore';
import { usePointerDrag } from '../core/usePointerDrag';
import { AxisInput } from './AxisInput';

export interface ColorAreaProps {
  height?: number;
  className?: string;
}

export function ColorArea(props: ColorAreaProps): React.ReactElement {
  const { height = 150, className } = props;
  const { store, disabled, classNames } = usePanel();

  const areaRef = React.useRef<HTMLDivElement>(null);
  const satRef = React.useRef<HTMLInputElement>(null);
  const valRef = React.useRef<HTMLInputElement>(null);

  useTransientColor(store, (c: Hsva) => {
    const el = areaRef.current;
    if (el === null) return;
    el.style.setProperty('--cp-thumb-x', `${c.s}%`);
    el.style.setProperty('--cp-thumb-y', `${100 - c.v}%`);

    const sat = satRef.current;
    if (sat !== null) {
      sat.value = String(Math.round(c.s));
      sat.setAttribute('aria-valuetext', `Saturation ${Math.round(c.s)} percent`);
    }
    const val = valRef.current;
    if (val !== null) {
      val.value = String(Math.round(c.v));
      val.setAttribute('aria-valuetext', `Brightness ${Math.round(c.v)} percent`);
    }
  });

  const drag = usePointerDrag({
    disabled,
    onMove: ({ x, y }) => store.patch({ s: x * 100, v: (1 - y) * 100 }, 'pointer'),
    onEnd: () => store.commit('pointer'),
  });

  const initial = store.get();

  return (
    <div
      ref={areaRef}
      className={cx('cp-area', className)}
      style={{ ...drag.style, height }}
      onPointerDown={drag.onPointerDown}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onLostPointerCapture={drag.onLostPointerCapture}
      role="group"
      aria-label="Saturation and brightness"
      aria-disabled={disabled || undefined}
    >
      <AxisInput
        ref={satRef}
        label="Saturation"
        min={0}
        max={100}
        defaultValue={Math.round(initial.s)}
        disabled={disabled}
        onInput={(s) => store.patch({ s }, 'keyboard')}
        onCommit={() => store.commit('keyboard')}
      />
      <AxisInput
        ref={valRef}
        label="Brightness"
        min={0}
        max={100}
        defaultValue={Math.round(initial.v)}
        disabled={disabled}
        onInput={(v) => store.patch({ v }, 'keyboard')}
        onCommit={() => store.commit('keyboard')}
      />
      <div className={cx('cp-thumb', classNames.thumb)} aria-hidden="true" />
    </div>
  );
}
