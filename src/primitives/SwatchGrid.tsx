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
  ink?: string;
}

export type SwatchVariant = 'mosaic' | 'spaced' | 'cards';

export interface SwatchGridProps {
  swatches: SwatchEntry[];
  columns?: number;
  variant?: SwatchVariant;
  round?: boolean;
  label: string;
  className?: string;
}

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
    store.ingest(parsed, 'swatch');
    store.commit('swatch');
  };

  const grid = (
    <ul
      ref={gridRef}
      className={cx('cp-swatch-grid', variant !== 'mosaic' && className)}
      style={{ ['--cp-columns' as string]: columns } as React.CSSProperties}
      data-cp-variant={variant}
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
              style={{
                ['--cp-swatch-color' as string]: swatch.color,
                ['--cp-card-ink' as string]: swatch.ink,
              } as React.CSSProperties}
              data-cp-color={match}
              aria-label={swatch.name ?? swatch.color}
              aria-pressed={false}
              disabled={disabled}
            >
              {variant === 'cards' && (
                <span className="cp-card-name" aria-hidden="true">
                  {swatch.name !== undefined && <span className="cp-card-title">{swatch.name}</span>}
                  <span className="cp-card-hex">{match.replace('#', '').toUpperCase()}</span>
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );

  if (variant === 'mosaic') {
    return <div className={cx('cp-mosaic', className)}>{grid}</div>;
  }

  return grid;
}
