'use client';

import * as React from 'react';
import { cx } from '../core/context';

export interface SwatchProps {
  /** Any CSS colour string. */
  color: string;
  /** Accessible name. Falls back to the colour string. */
  label?: string;
  /** Canonical `#rrggbb` used for selection matching. */
  matchKey?: string;
  round?: boolean;
  disabled?: boolean;
  onSelect?: (color: string) => void;
  className?: string;
}

/**
 * A single colour button.
 *
 * A real <button>, never a clickable div — swatches must be reachable by
 * keyboard and announced as controls.
 */
export function Swatch(props: SwatchProps): React.ReactElement {
  const { color, label, matchKey, round, disabled, onSelect, className } = props;

  return (
    <button
      type="button"
      className={cx('cp-swatch', round === true && 'cp-swatch-round', className)}
      style={{ ['--cp-swatch-color' as string]: color } as React.CSSProperties}
      data-cp-color={matchKey ?? color}
      aria-label={label ?? color}
      aria-pressed={false}
      disabled={disabled}
      onClick={() => onSelect?.(color)}
    />
  );
}
