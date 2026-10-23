'use client';

import * as React from 'react';
import { parse } from '../color/parse';
import { toHex, toHexa } from '../color/serialize';
import type { Hsva } from '../color/types';
import { cx, usePanel, useStableId } from '../core/context';
import { useTransientColor } from '../core/useColorStore';
import { useStyleChunk } from '../core/useStyleChunk';
import { fieldCss } from '../styles/css';

export interface ColorFieldProps {
  label?: string;
  withAlpha?: boolean;
  className?: string;
}

export function ColorField(props: ColorFieldProps): React.ReactElement {
  const { label = 'Hex', withAlpha = false, className } = props;
  const { store, disabled, classNames, options } = usePanel();
  const id = useStableId('cp-hex-');

  const inputRef = React.useRef<HTMLInputElement>(null);
  useStyleChunk(fieldCss, 'field', inputRef, options.injectStyles !== false);
  const focused = React.useRef(false);
  const format = React.useRef(withAlpha);
  React.useEffect(() => {
    format.current = withAlpha;
  });

  const render = (c: Hsva): string =>
    (format.current && c.a < 1 ? toHexa(c) : toHex(c)).slice(1).toUpperCase();

  useTransientColor(store, (c: Hsva) => {
    if (focused.current) return; 
    const el = inputRef.current;
    if (el !== null) {
      el.value = render(c);
      el.setAttribute('aria-invalid', 'false');
    }
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const parsed = parse(event.currentTarget.value);
    event.currentTarget.setAttribute('aria-invalid', parsed === null ? 'true' : 'false');
    if (parsed !== null) store.ingest(parsed, 'field');
  };

  return (
    <div className={cx('cp-field', classNames.field, className)}>
      <label className="cp-field-label" htmlFor={id}>{label}</label>
      <span className="cp-hex">
        <span className="cp-hex-dot" aria-hidden="true" />
        <span className="cp-hex-hash" aria-hidden="true">#</span>
        <input
          ref={inputRef}
          id={id}
          className="cp-input"
          type="text"
          maxLength={64}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          defaultValue={render(store.get())}
          disabled={disabled}
          onFocus={() => { focused.current = true; }}
          onChange={handleChange}
          onBlur={(e) => {
            focused.current = false;
            e.currentTarget.value = render(store.get());
            e.currentTarget.setAttribute('aria-invalid', 'false');
            store.commit('field');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
        />
      </span>
    </div>
  );
}
