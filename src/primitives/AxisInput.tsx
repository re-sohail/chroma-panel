'use client';

import * as React from 'react';

export interface AxisInputProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  defaultValue: number;
  disabled?: boolean;
  /** Human-readable announcement, e.g. "Hue 210 degrees". */
  valueText?: string;
  onInput: (value: number) => void;
  onCommit?: () => void;
}

/**
 * One accessible axis, as a visually-hidden native range input.
 *
 * Using a real <input type="range"> rather than a div with role="slider"
 * buys correct keyboard handling, aria-valuenow/min/max, and screen-reader
 * support from the platform instead of from our own approximation of it —
 * and missing keyboard support on exactly these controls is an open bug in
 * more than one popular picker.
 *
 * The input is uncontrolled: its value is written imperatively during a drag
 * so that pointer movement never triggers a React render.
 */
export const AxisInput: React.ForwardRefExoticComponent<
  AxisInputProps & React.RefAttributes<HTMLInputElement>
> = React.forwardRef<HTMLInputElement, AxisInputProps>(
  function AxisInput(props, ref): React.ReactElement {
    const { label, min, max, step, defaultValue, disabled, valueText, onInput, onCommit } = props;

    return (
      <input
        ref={ref}
        type="range"
        className="cp-visually-hidden"
        aria-label={label}
        aria-valuetext={valueText}
        min={min}
        max={max}
        step={step ?? 1}
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={(e) => onInput(e.currentTarget.valueAsNumber)}
        onKeyUp={onCommit}
        onBlur={onCommit}
      />
    );
  },
);
