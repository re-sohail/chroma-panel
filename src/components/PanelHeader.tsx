'use client';

import * as React from 'react';
import { parse } from '../color/parse';
import { toOutputFormat, toRgbaString } from '../color/serialize';
import type { Hsva } from '../color/types';
import { cx, usePanel } from '../core/context';
import { useColorValue } from '../core/useColorStore';
import { EyedropperIcon, Icon } from '../primitives/icons';
import { useEyedropper } from '../primitives/useEyedropper';

export interface PanelHeaderProps {
  title?: string;
  onClose?: () => void;
  className?: string;
}

export function PanelHeader(props: PanelHeaderProps): React.ReactElement | null {
  const { title, onClose, className } = props;
  const { store, options, disabled } = usePanel();
  const { supported, pick } = useEyedropper();
  const [copyStatus, setCopyStatus] = React.useState<'idle' | 'copied' | 'error'>('idle');
  const color = useColorValue(store);
  const colorLabel = toOutputFormat(color, options.format, options.showAlpha);
  const copyTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [original] = React.useState<Hsva>(() => store.get());

  React.useEffect(() => () => {
    if (copyTimer.current !== null) clearTimeout(copyTimer.current);
  }, []);

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(toOutputFormat(store.get(), options.format, options.showAlpha));
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    }
    if (copyTimer.current !== null) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyStatus('idle'), 1600);
  };

  const handlePick = async (): Promise<void> => {
    const hex = await pick();
    if (hex === null) return;
    const parsed = parse(hex);
    if (parsed === null) return;
    store.ingest(parsed, 'eyedropper');
    store.commit('eyedropper');
  };

  const showEyedropper = options.showEyedropper && supported;
  if (title === undefined && !showEyedropper && !options.showCopyButton && onClose === undefined) {
    return null;
  }

  const originalLabel = toOutputFormat(original, options.format, options.showAlpha);

  return (
    <div className={cx('cp-titlebar', className)}>
      {title !== undefined ? <span className="cp-title">{title}</span> : <span className="cp-titlebar-spacer" />}

      <output className="cp-current-color" aria-label="Current color">{colorLabel}</output>

      <div className="cp-chips">
        <button
          type="button"
          className="cp-chip"
          style={{ ['--cp-chip-color' as string]: toRgbaString(original) } as React.CSSProperties}
          aria-label={`Revert to original color ${originalLabel}`}
          title={`Original: ${originalLabel}`}
          disabled={disabled}
          onClick={() => {
            store.ingest(original, 'swatch');
            store.commit('swatch');
          }}
        />
        <span className="cp-chip cp-chip-current" aria-hidden="true" />
      </div>

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

      {options.showCopyButton && (
        <button
          type="button"
          className="cp-icon-button"
          aria-label={copyStatus === 'copied' ? 'Color copied' : 'Copy color'}
          title={copyStatus === 'copied' ? 'Copied' : copyStatus === 'error' ? 'Could not copy' : 'Copy color'}
          disabled={disabled}
          data-cp-copy-status={copyStatus}
          onClick={() => { void handleCopy(); }}
        >
          <Icon name={copyStatus === 'copied' ? 'check' : 'copy'} />
        </button>
      )}

      {onClose !== undefined && (
        <button
          type="button"
          className="cp-icon-button"
          aria-label="Close"
          title="Close"
          disabled={disabled}
          onClick={onClose}
        >
          <Icon name="x" />
        </button>
      )}

      <span className="cp-visually-hidden" role="status" aria-live="polite">
        {copyStatus === 'copied' ? 'Color copied to clipboard' : ''}
        {copyStatus === 'error' ? 'Could not copy color' : ''}
      </span>
    </div>
  );
}
