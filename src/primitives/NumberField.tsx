'use client';

import * as React from 'react';
import { clamp } from '../color/convert';
import type { Hsva } from '../color/types';
import { cx, usePanel, useStableId } from '../core/context';
import { useTransientColor } from '../core/useColorStore';

export interface NumberFieldProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  read: (color: Hsva) => number;
  write: (value: number, current: Hsva) => Hsva;
  className?: string;
}

/** A numeric channel entry box. Uncontrolled for the same reasons as ColorField. */
export function NumberField(props: NumberFieldProps): React.ReactElement {
  const { label, min, max, step, read, write, className } = props;
  const { store, disabled, classNames } = usePanel();
  const id = useStableId('cp-num-');

  const inputRef = React.useRef<HTMLInputElement>(null);
  const focused = React.useRef(false);
  const fns = React.useRef({ read, write });
  React.useEffect(() => {
    fns.current = { read, write };
  });

  useTransientColor(store, (c: Hsva) => {
    if (focused.current) return;
    const el = inputRef.current;
    if (el !== null) el.value = String(Math.round(fns.current.read(c)));
  });

  return (
    <div className={cx('cp-field', classNames.field, className)}>
      <label className="cp-field-label" htmlFor={id}>{label}</label>
      <input
        ref={inputRef}
        id={id}
        className="cp-input"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step ?? 1}
        defaultValue={Math.round(read(store.get()))}
        disabled={disabled}
        onFocus={() => { focused.current = true; }}
        onChange={(e) => {
          const raw = e.currentTarget.valueAsNumber;
          if (Number.isNaN(raw)) return; // mid-edit empty box: leave it alone
          store.set(fns.current.write(clamp(raw, min, max), store.get()));
        }}
        onBlur={(e) => {
          focused.current = false;
          e.currentTarget.value = String(Math.round(fns.current.read(store.get())));
          store.commit();
        }}
      />
    </div>
  );
}
