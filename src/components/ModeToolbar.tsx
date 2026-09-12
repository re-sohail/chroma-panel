'use client';

import * as React from 'react';
import { cx, usePanel } from '../core/context';
import type { PickerMode } from '../modes/registry';

export interface ModeToolbarProps {
  modes: PickerMode[];
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * The mode switcher, as a real WAI-ARIA tablist.
 *
 * Roving tabindex: one Tab stop for the whole toolbar, arrows move between
 * tabs. That is the pattern screen-reader and keyboard users expect from a
 * tablist, and it keeps the panel's Tab order short.
 */
export function ModeToolbar(props: ModeToolbarProps): React.ReactElement {
  const { modes, activeId, onSelect } = props;
  const { classNames, idPrefix, disabled } = usePanel();
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const move = (from: number, delta: number): void => {
    const next = (from + delta + modes.length) % modes.length;
    const mode = modes[next];
    if (mode === undefined) return;
    onSelect(mode.id);
    refs.current[next]?.focus();
  };

  return (
    <div
      className={cx('cp-toolbar', classNames.toolbar)}
      role="tablist"
      aria-label="Picker mode"
      aria-orientation="horizontal"
    >
      {modes.map((mode, index) => {
        const selected = mode.id === activeId;
        const Icon = mode.icon;
        return (
          <button
            key={mode.id}
            ref={(el) => { refs.current[index] = el; }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${mode.id}`}
            aria-controls={`${idPrefix}-panel-${mode.id}`}
            aria-selected={selected}
            aria-label={mode.label}
            title={mode.label}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            className={cx('cp-tab', classNames.tab)}
            onClick={() => onSelect(mode.id)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') { event.preventDefault(); move(index, 1); }
              else if (event.key === 'ArrowLeft') { event.preventDefault(); move(index, -1); }
              else if (event.key === 'Home') { event.preventDefault(); move(0, 0); }
              else if (event.key === 'End') { event.preventDefault(); move(modes.length - 1, 0); }
            }}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}
