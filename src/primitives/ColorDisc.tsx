'use client';

import * as React from 'react';
import { normalizeHue } from '../color/convert';
import type { Hsva } from '../color/types';
import { cx, usePanel } from '../core/context';
import { useTransientColor } from '../core/useColorStore';
import { usePointerDrag } from '../core/usePointerDrag';
import { AxisInput } from './AxisInput';

export interface ColorDiscProps {
  size?: number;
  className?: string;
}

export function ColorDisc(props: ColorDiscProps): React.ReactElement {
  const { size = 200, className } = props;
  const { store, disabled, classNames } = usePanel();

  const discRef = React.useRef<HTMLDivElement>(null);
  const hueRef = React.useRef<HTMLInputElement>(null);
  const satRef = React.useRef<HTMLInputElement>(null);

  useTransientColor(store, (c: Hsva) => {
    const el = discRef.current;
    if (el === null) return;

    const radians = (normalizeHue(c.h) * Math.PI) / 180;
    const radiusPct = c.s / 2; 
    el.style.setProperty('--cp-thumb-x', `${50 + Math.sin(radians) * radiusPct}%`);
    el.style.setProperty('--cp-thumb-y', `${50 - Math.cos(radians) * radiusPct}%`);

    const hue = hueRef.current;
    if (hue !== null) {
      hue.value = String(Math.round(normalizeHue(c.h)));
      hue.setAttribute('aria-valuetext', `Hue ${Math.round(normalizeHue(c.h))} degrees`);
    }
    const sat = satRef.current;
    if (sat !== null) {
      sat.value = String(Math.round(c.s));
      sat.setAttribute('aria-valuetext', `Saturation ${Math.round(c.s)} percent`);
    }
  });

  const drag = usePointerDrag({
    disabled,
    onMove: ({ x, y }) => {
      const dx = x - 0.5;
      const dy = y - 0.5;
      const distance = Math.min(Math.hypot(dx, dy), 0.5);

      const patch: Partial<Hsva> = { s: (distance / 0.5) * 100 };
      if (distance > 1e-6) {
        patch.h = normalizeHue((Math.atan2(dx, -dy) * 180) / Math.PI);
      }
      store.patch(patch);
    },
    onEnd: () => store.commit(),
  });

  const initial = store.get();

  return (
    <div className="cp-disc-wrap">
      <div
        ref={discRef}
        className={cx('cp-disc', classNames.panel, className)}
        style={{ ...drag.style, width: size }}
        onPointerDown={drag.onPointerDown}
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
        onLostPointerCapture={drag.onLostPointerCapture}
        role="group"
        aria-label="Colour wheel"
        aria-disabled={disabled || undefined}
      >
        <AxisInput
          ref={hueRef}
          label="Hue"
          min={0}
          max={360}
          defaultValue={Math.round(normalizeHue(initial.h))}
          disabled={disabled}
          onInput={(h) => store.patch({ h })}
          onCommit={() => store.commit()}
        />
        <AxisInput
          ref={satRef}
          label="Saturation"
          min={0}
          max={100}
          defaultValue={Math.round(initial.s)}
          disabled={disabled}
          onInput={(s) => store.patch({ s })}
          onCommit={() => store.commit()}
        />
        <div className={cx('cp-thumb', classNames.thumb)} aria-hidden="true" />
      </div>
    </div>
  );
}
