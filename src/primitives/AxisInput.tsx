'use client';

import * as React from 'react';

export interface AxisInputProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  defaultValue: number;
  disabled?: boolean;
  valueText?: string;
  onInput: (value: number) => void;
  onCommit?: () => void;
}

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
