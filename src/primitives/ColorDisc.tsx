'use client';

import * as React from 'react';
import { normalizeHue } from '../color/convert';
import type { Hsva } from '../color/types';
import { cx, usePanel } from '../core/context';
import { useTransientColor } from '../core/useColorStore';
import { usePointerDrag } from '../core/usePointerDrag';
import { AxisInput } from './AxisInput';

export interface ColorDiscProps {
  /** Diameter in px. Default 200. */
  size?: number;
  className?: string;
}

/**
 * The circular hue/saturation disc.
 *
 * Rendering is pure CSS — a conic hue ramp with a white radial gradient over
 * it, plus a black veil for brightness. That composite is not an
 * approximation of HSV, it is exactly HSV:
 *
 *   white over hue at opacity (1 - s):  c1 = Hc*s + (1 - s)
 *   HSV at v=1 is                       rgb = (1 - s) + s*Hc
 *   ...so radial distance IS saturation, exactly.
 *
 * which is why no canvas is needed and the disc costs zero JavaScript per
 * frame: only a CSS custom property changes.
 */
export function ColorDisc(props: ColorDiscProps): React.ReactElement {
  const { size = 200, className } = props;
  const { store, disabled, classNames } = usePanel();

  const discRef = React.useRef<HTMLDivElement>(null);
  const hueRef = React.useRef<HTMLInputElement>(null);
  const satRef = React.useRef<HTMLInputElement>(null);

  useTransientColor(store, (c: Hsva) => {
    const el = discRef.current;
    if (el === null) return;

    // Hue 0 sits at 12 o'clock and increases clockwise, matching the
    // conic-gradient's own origin and direction.
    const radians = (normalizeHue(c.h) * Math.PI) / 180;
    const radiusPct = c.s / 2; // saturation 0-100 -> 0-50% of the diameter
    el.style.setProperty('--cp-thumb-x', `${50 + Math.sin(radians) * radiusPct}%`);
    el.style.setProperty('--cp-thumb-y', `${50 - Math.cos(radians) * radiusPct}%`);

    // Keep the accessible values current without rendering.
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
      // At the exact centre the angle is meaningless — atan2(0,0) is 0, which
      // would silently snap the hue to red. Leave hue alone instead; this is
      // the same powerless-component rule the store applies on ingest.
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
