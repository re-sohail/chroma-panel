'use client';

import * as React from 'react';
import { cx } from '../core/context';

export interface SegmentedItem {
  id: string;
  /** Accessible name. Required — icon-only segments have no visible text. */
  label: string;
  /** What is drawn: an icon, or a short string. */
  content: React.ReactNode;
}

export interface SegmentedControlProps {
  items: SegmentedItem[];
  value: string;
  onChange: (id: string) => void;
  /** `md` for the mode switcher, `sm` for the nested colour-model switcher. */
  size?: 'md' | 'sm';
  ariaLabel: string;
  /** Builds the `aria-controls` id for each segment, when it drives a tabpanel. */
  controls?: (id: string) => string;
  /** Builds each segment's own id, so a tabpanel can point back at it. */
  segmentId?: (id: string) => string;
  disabled?: boolean;
  className?: string;
  tabClassName?: string;
}

/**
 * A segmented control with a sliding indicator and no JavaScript measurement.
 *
 * The indicator is a single pseudo-element positioned by two custom
 * properties: `--cp-seg-count` (how many segments) and `--cp-seg-active`
 * (which one). Because the track is `grid-auto-columns: 1fr`, every segment is
 * the same width, so the indicator's width is `100% / count` and its offset is
 * `active * 100%` — pure arithmetic the browser already knows how to do.
 *
 * The alternative — measuring each tab with getBoundingClientRect and a
 * ResizeObserver — is what most implementations do, and it is where their
 * bugs live: stale positions inside scrollable lists, wrong offsets before
 * fonts load, and a resize observer running for the life of the component.
 *
 * Keyboard follows the WAI-ARIA tabs pattern: one tab stop for the whole
 * control, arrows move between segments.
 */
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
