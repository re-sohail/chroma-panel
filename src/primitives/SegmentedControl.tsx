'use client';

import * as React from 'react';
import { cx } from '../core/context';

export interface SegmentedItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface SegmentedControlProps {
  items: SegmentedItem[];
  value: string;
  onChange: (id: string) => void;
  size?: 'md' | 'sm';
  ariaLabel: string;
  controls?: (id: string) => string;
  segmentId?: (id: string) => string;
  disabled?: boolean;
  className?: string;
  tabClassName?: string;
}

export function SegmentedControl(props: SegmentedControlProps): React.ReactElement {
  const {
    items, value, onChange, size = 'md', ariaLabel,
    controls, segmentId, disabled = false, className, tabClassName,
  } = props;

  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = Math.max(0, items.findIndex((item) => item.id === value));

  const move = (to: number): void => {
    const wrapped = (to + items.length) % items.length;
    const item = items[wrapped];
    if (item === undefined) return;
    onChange(item.id);
    refs.current[wrapped]?.focus();
  };

  return (
    <div
      className={cx('cp-seg', size === 'sm' && 'cp-seg-sm', className)}
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      style={{
        ['--cp-seg-count' as string]: items.length,
        ['--cp-seg-active' as string]: activeIndex,
      } as React.CSSProperties}
    >
      {items.map((item, index) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => { refs.current[index] = el; }}
            type="button"
            role="tab"
            id={segmentId?.(item.id)}
            aria-controls={controls?.(item.id)}
            aria-selected={selected}
            aria-label={item.label}
            title={item.label}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            className={cx('cp-tab', tabClassName)}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') { event.preventDefault(); move(index + 1); }
              else if (event.key === 'ArrowLeft') { event.preventDefault(); move(index - 1); }
              else if (event.key === 'Home') { event.preventDefault(); move(0); }
              else if (event.key === 'End') { event.preventDefault(); move(items.length - 1); }
            }}
          >
            {item.content}
          </button>
        );
      })}
    </div>
  );
}
