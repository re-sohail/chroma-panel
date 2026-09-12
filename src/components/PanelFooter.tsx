'use client';

import * as React from 'react';
import { parse } from '../color/parse';
import { toHex } from '../color/serialize';
import { cx, usePanel } from '../core/context';
import { EyedropperIcon } from '../primitives/icons';
import { useEyedropper } from '../primitives/useEyedropper';

/**
 * Current colour, eyedropper and recently used swatches.
 *
 * The preview itself is painted from a CSS custom property set by the panel,
 * so it tracks a drag without this component rendering.
 */
export function PanelFooter(): React.ReactElement {
  const { store, classNames, options, disabled } = usePanel();
  const { supported, pick } = useEyedropper();

  const handlePick = async (): Promise<void> => {
    const hex = await pick();
    if (hex === null) return;
    const parsed = parse(hex);
    if (parsed === null) return;
    store.ingest(parsed);
    store.commit();
  };

  return (
    <div className={cx('cp-footer', classNames.footer)}>
      <div className="cp-preview" aria-hidden="true" />

      {options.showRecentColors && (
        <ul className="cp-recents" aria-label="Recent colours">
          {options.recentColors.slice(0, 8).map((color, index) => (
            <li key={`${color}-${index}`}>
              <button
                type="button"
                className={cx('cp-swatch', 'cp-swatch-round', classNames.swatch)}
                style={{ ['--cp-swatch-color' as string]: color } as React.CSSProperties}
                aria-label={`Recent colour ${color}`}
                disabled={disabled}
                onClick={() => {
                  const parsed = parse(color);
                  if (parsed === null) return;
                  store.ingest(parsed);
                  store.commit();
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Chromium-only API: the button is absent rather than dead elsewhere. */}
      {options.showEyedropper && supported && (
        <button
          type="button"
          className="cp-icon-button"
          aria-label="Pick a colour from the screen"
          title="Pick a colour from the screen"
          disabled={disabled}
          onClick={() => { void handlePick(); }}
        >
          <EyedropperIcon />
        </button>
      )}
    </div>
  );
}

/** Prepend `hex` to `list`, de-duplicated, capped at `limit`. */
export function pushRecent(list: string[], hex: string, limit: number = 8): string[] {
  const key = hex.toLowerCase();
  const next = [hex, ...list.filter((c) => {
    const parsed = parse(c);
    return parsed === null ? c.toLowerCase() !== key : toHex(parsed).toLowerCase() !== key;
  })];
  return next.slice(0, limit);
}
