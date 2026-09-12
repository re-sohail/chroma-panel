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

export interface SwatchGridProps {
  swatches: SwatchEntry[];
  columns?: number;
  round?: boolean;
  label: string;
  className?: string;
}

/**
 * A grid of selectable colours.
 *
 * Two deliberate scaling choices:
 *
 * - One delegated click handler on the grid, not one per swatch. 500 swatches
 *   would otherwise mean 500 closures allocated on every render.
 * - Selection is applied imperatively to the one element that changed, so
 *   moving the colour never re-renders the grid. Re-rendering all 500 on each
 *   selection change is what makes large palettes feel slow elsewhere.
 *
 * Past ~1000 entries `content-visibility: auto` on the items gives the effect
 * of virtualization without the keyboard and find-in-page cost of it.
 */
export function SwatchGrid(props: SwatchGridProps): React.ReactElement {
  const { swatches, columns = 10, round = false, label, className } = props;
  const { store, disabled, classNames } = usePanel();

  const gridRef = React.useRef<HTMLUListElement>(null);
  const selected = React.useRef<Element | null>(null);

  useTransientColor(store, (c: Hsva) => {
    const grid = gridRef.current;
    if (grid === null) return;

    const hex = toHex(c);
    // One indexed lookup per colour change, not a scan of every swatch.
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

  return (
    <ul
      ref={gridRef}
      className={cx('cp-swatch-grid', className)}
      style={{ ['--cp-columns' as string]: columns } as React.CSSProperties}
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
}
