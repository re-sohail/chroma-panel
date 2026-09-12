'use client';

import * as React from 'react';
import { parse } from '../color/parse';
import { toHex, toHexa } from '../color/serialize';
import type { Hsva } from '../color/types';
import { cx, usePanel, useStableId } from '../core/context';
import { useTransientColor } from '../core/useColorStore';

export interface ColorFieldProps {
  label?: string;
  /** Include the alpha byte in the displayed value. */
  withAlpha?: boolean;
  className?: string;
}

/**
 * Free-text colour entry.
 *
 * The input is uncontrolled and updated imperatively, for two reasons:
 * a React-controlled value would re-render this field on every frame of a
 * drag, and it would also fight the typist — rewriting "#ff" to "#ffffff"
 * mid-keystroke, which is a perennial complaint about colour inputs. While
 * the field has focus the live colour does not touch it at all.
 */
export function ColorField(props: ColorFieldProps): React.ReactElement {
  const { label = 'Hex', withAlpha = false, className } = props;
  const { store, disabled, classNames } = usePanel();
  const id = useStableId('cp-hex-');

  const inputRef = React.useRef<HTMLInputElement>(null);
  const focused = React.useRef(false);
  const format = React.useRef(withAlpha);
  React.useEffect(() => {
    format.current = withAlpha;
  });

  const render = (c: Hsva): string => (format.current ? toHexa(c) : toHex(c));

  useTransientColor(store, (c: Hsva) => {
    if (focused.current) return; // never overwrite what is being typed
    const el = inputRef.current;
    if (el !== null) {
      el.value = render(c);
      el.setAttribute('aria-invalid', 'false');
    }
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const parsed = parse(event.currentTarget.value);
    event.currentTarget.setAttribute('aria-invalid', parsed === null ? 'true' : 'false');
    if (parsed !== null) store.ingest(parsed);
  };

  return (
    <div className={cx('cp-field', classNames.field, className)}>
      <label className="cp-field-label" htmlFor={id}>{label}</label>
      <input
        ref={inputRef}
        id={id}
        className="cp-input"
        type="text"
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        defaultValue={render(store.get())}
        disabled={disabled}
        onFocus={() => { focused.current = true; }}
        onChange={handleChange}
        onBlur={(e) => {
          focused.current = false;
          // Snap an unparseable draft back to the real colour on exit.
          e.currentTarget.value = render(store.get());
          e.currentTarget.setAttribute('aria-invalid', 'false');
          store.commit();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
      />
    </div>
  );
}
