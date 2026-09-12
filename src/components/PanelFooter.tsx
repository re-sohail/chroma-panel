'use client';

import * as React from 'react';
import { parse } from '../color/parse';
import { toHex } from '../color/serialize';
import { cx, usePanel } from '../core/context';
import { EyedropperIcon } from '../primitives/icons';
import { useEyedropper } from '../primitives/useEyedropper';

/**
 * Current colour, recently used swatches, and the eyedropper.
 *
 * The preview is painted from a CSS custom property written by the panel, so
 * it tracks a drag without this component rendering.
 */
export function PanelFooter(): React.ReactElement | null {
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

  // The preview beside this row already shows the current colour, so repeating
  // it as the newest "recent" drew the same colour twice, side by side, after
  // every single pick — which reads as a duplicate, not as history.
  //
  // subscribeCommit, NOT subscribe: commits fire on pointerup rather than once
  // per frame, and this component already re-renders on commit because
  // recentColors changes. So the filter costs zero extra renders and the
  // zero-render drag guarantee is untouched.
  const [current, setCurrent] = React.useState<string | null>(null);
  React.useEffect(
    () => store.subscribeCommit((c) => setCurrent(toHex(c).toLowerCase())),
    [store],
  );

  // Only the rendered list is filtered. options.recentColors is the consumer's
  // own state and stays exactly as they gave it, so the colour reappears in the
  // row the moment the selection moves on.
  const recents = options.showRecentColors
    ? options.recentColors
        .filter((color) => {
          if (current === null) return true;
          const parsed = parse(color);
          const hex = parsed === null ? color : toHex(parsed);
          return hex.toLowerCase() !== current;
        })
        .slice(0, 10)
    : [];
  const showEyedropper = options.showEyedropper && supported;

  return (
    <div className={cx('cp-footer', classNames.footer)}>
      <div className="cp-preview" aria-hidden="true" />

      {recents.length > 0 ? (
        <ul className="cp-recents" aria-label="Recent colours">
          {recents.map((color, index) => (
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
      ) : (
        // Keeps the eyedropper pinned right without an empty list taking up
        // the space and reading as a gap in the layout.
        <div className="cp-footer-spacer" />
      )}

      {/* Chromium-only API: the control is absent, not dead, elsewhere. */}
      {showEyedropper && (
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
export function pushRecent(list: string[], hex: string, limit: number = 10): string[] {
  const key = hex.toLowerCase();
  const next = [hex, ...list.filter((c) => {
    const parsed = parse(c);
    return parsed === null ? c.toLowerCase() !== key : toHex(parsed).toLowerCase() !== key;
  })];
  return next.slice(0, limit);
}
