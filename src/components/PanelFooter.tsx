'use client';

import * as React from 'react';
import { parse } from '../color/parse';
import { toHex } from '../color/serialize';
import { cx, usePanel } from '../core/context';
import { EyedropperIcon } from '../primitives/icons';
import { useEyedropper } from '../primitives/useEyedropper';
import { useScrollFade } from '../core/useScrollFade';

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

  const recentsRef = React.useRef<HTMLUListElement>(null);
  const [current, setCurrent] = React.useState<string | null>(null);
  React.useEffect(
    () => store.subscribeCommit((c) => setCurrent(toHex(c).toLowerCase())),
    [store],
  );

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

  useScrollFade(recentsRef, recents.length, 'x');


  return (
    <div className={cx('cp-footer', classNames.footer)}>
      <div className="cp-preview" aria-hidden="true" />

      {recents.length > 0 ? (
        <ul ref={recentsRef} className="cp-recents" aria-label="Recent colors">
          {recents.map((color, index) => (
            <li key={`${color}-${index}`}>
              <button
                type="button"
                className={cx('cp-swatch', 'cp-swatch-round', classNames.swatch)}
                style={{ ['--cp-swatch-color' as string]: color } as React.CSSProperties}
                aria-label={`Recent color ${color}`}
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
        <div className="cp-footer-spacer" />
      )}

      {showEyedropper && (
        <button
          type="button"
          className="cp-icon-button"
          aria-label="Pick a color from the screen"
          title="Pick a color from the screen"
          disabled={disabled}
          onClick={() => { void handlePick(); }}
        >
          <EyedropperIcon />
        </button>
      )}
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
