'use client';

import * as React from 'react';
import { parse } from '../color/parse';
import { toHex } from '../color/serialize';
import { cx, usePanel } from '../core/context';

const SLOTS = 8;

export function PanelFooter(): React.ReactElement | null {
  const { store, classNames, options, disabled, idPrefix } = usePanel();

  const [current, setCurrent] = React.useState<string | null>(null);
  const [active, setActive] = React.useState(0);
  const listRef = React.useRef<HTMLUListElement>(null);
  React.useEffect(
    () => store.subscribeCommit((c) => setCurrent(toHex(c).toLowerCase())),
    [store],
  );

  if (!options.showRecentColors) return null;

  const recents = options.recentColors
    .filter((color) => {
      if (current === null) return true;
      const parsed = parse(color);
      const hex = parsed === null ? color : toHex(parsed);
      return hex.toLowerCase() !== current;
    })
    .slice(0, SLOTS);
  if (recents.length === 0) return null;
  const titleId = `${idPrefix}-history`;

  return (
    <div className={cx('cp-footer', classNames.footer)}>
      <div className="cp-footer-head">
        <h3 className="cp-footer-title" id={titleId}>History</h3>
        <button
          type="button"
          className="cp-text-button"
          disabled={disabled}
          onClick={(e) => {
            const host = e.currentTarget.closest('.cp-root')?.querySelector<HTMLElement>('[role="tabpanel"]');
            options.setRecentColors?.([]);
            host?.focus({ preventScroll: true });
          }}
        >
          Clear
        </button>
      </div>

      <ul
        ref={listRef}
        className="cp-recents"
        aria-labelledby={titleId}
        onKeyDown={(e) => {
          const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
            : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
          const to = e.key === 'Home' ? 0 : e.key === 'End' ? recents.length - 1
            : step === 0 ? -1 : (Math.min(active, recents.length - 1) + step + recents.length) % recents.length;
          if (to < 0) return;
          e.preventDefault();
          setActive(to);
          listRef.current?.querySelectorAll<HTMLButtonElement>('button')[to]?.focus();
        }}
      >
        {recents.map((color, index) => (
          <li key={`${color}-${index}`}>
            <button
              type="button"
              className={cx('cp-swatch', classNames.swatch)}
              style={{ ['--cp-swatch-color' as string]: color } as React.CSSProperties}
              aria-label={`Recent color ${color}`}
              tabIndex={index === Math.min(active, recents.length - 1) ? 0 : -1}
              disabled={disabled}
              onClick={() => {
                setActive(index);
                const parsed = parse(color);
                if (parsed === null) return;
                store.ingest(parsed, 'recent');
                store.commit('recent');
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function pushRecent(list: string[], hex: string, limit: number = 10): string[] {
  const key = hex.toLowerCase();
  const next = [hex, ...list.filter((c) => {
    const parsed = parse(c);
    return parsed === null ? c.toLowerCase() !== key : toHex(parsed).toLowerCase() !== key;
  })];
  return next.slice(0, limit);
}
