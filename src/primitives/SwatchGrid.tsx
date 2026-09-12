'use client';

import * as React from 'react';
import { toHex } from '../color/serialize';
import { parse } from '../color/parse';
import type { Hsva } from '../color/types';
import { cx, usePanel } from '../core/context';
import { useTransientColor } from '../core/useColorStore';

export interface SwatchEntry {
  color: string;
  name?: string;
}

/**
 * How the grid is drawn.
 *
 * - `mosaic`  — gapless, borderless tiles under one corner radius, as the iOS
 *   colour grid does it. Correct for a dense generated ramp.
 * - `spaced`  — separated swatches with their own outline. Correct for
 *   discrete, nameable colours.
 */
export type SwatchVariant = 'mosaic' | 'spaced';

export interface SwatchGridProps {
  swatches: SwatchEntry[];
  columns?: number;
  variant?: SwatchVariant;
  round?: boolean;
  label: string;
  className?: string;
}

/**
 * A grid of selectable colours.
 *
 * On separation: the instinct when adjacent colours blur together is to add
 * borders and widen the gap. Apple's grid has neither — it is a gapless
 * mosaic, and it reads as distinct tiles because the colour steps are coarse
 * enough to clear the just-noticeable difference. Separation is bought with
 * step size; chrome only helps once the steps are already far enough apart.
 * Hence two variants rather than one compromise.
 *
 * Scaling choices that are not obvious:
 * - One delegated click handler on the grid, not one closure per swatch.
 * - Selection is applied imperatively to the single element that changed, so
 *   moving the colour never re-renders the grid.
 */
export function SwatchGrid(props: SwatchGridProps): React.ReactElement {
  const {
    swatches, columns = 10, variant = 'spaced', round = false, label, className,
  } = props;
  const { store, disabled, classNames } = usePanel();

  const gridRef = React.useRef<HTMLUListElement>(null);
  const selected = React.useRef<Element | null>(null);

  useTransientColor(store, (c: Hsva) => {
    const grid = gridRef.current;
    if (grid === null) return;

    const hex = toHex(c);
    // One indexed lookup per change, not a scan of every swatch.
    const next = grid.querySelector(`[data-cp-color="${hex}"]`);
    if (next === selected.current) return;

    selected.current?.setAttribute('aria-pressed', 'false');
    next?.setAttribute('aria-pressed', 'true');
    selected.current = next;
  });

  const handleClick = (event: React.MouseEvent<HTMLUListElement>): void => {
    const target = (event.target as HTMLElement).closest('[data-cp-color]');
    if (target === null) return;
    const parsed = parse(target.getAttribute('data-cp-color') ?? '');
    if (parsed === null) return;
    store.ingest(parsed);
    store.commit();
  };

  const grid = (
    <ul
      ref={gridRef}
      className={cx('cp-swatch-grid', variant === 'spaced' && className)}
      style={{ ['--cp-columns' as string]: columns } as React.CSSProperties}
      data-cp-variant={variant}
      // Past ~1000 entries content-visibility gives virtualization's effect
      // without losing keyboard order or find-in-page.
      data-cp-large={swatches.length > 1000 ? 'true' : undefined}
      aria-label={label}
      onClick={handleClick}
    >
      {swatches.map((swatch, index) => {
        const key = parse(swatch.color);
        const match = key === null ? swatch.color : toHex(key);
        return (
          <li key={`${swatch.color}-${index}`}>
            <button
              type="button"
              className={cx('cp-swatch', round && 'cp-swatch-round', classNames.swatch)}
              style={{ ['--cp-swatch-color' as string]: swatch.color } as React.CSSProperties}
              data-cp-color={match}
              aria-label={swatch.name ?? swatch.color}
              aria-pressed={false}
              disabled={disabled}
            />
          </li>
        );
      })}
    </ul>
  );

  // The mosaic needs a padded, clipped frame: its selection ring straddles the
  // cell edge, so without the inset the ring would be cut off on the outermost
  // cells. Apple insets its grid for the same reason.
  if (variant === 'mosaic') {
    return <div className={cx('cp-mosaic', className)}>{grid}</div>;
  }

  return grid;
}
