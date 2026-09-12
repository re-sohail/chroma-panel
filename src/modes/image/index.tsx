'use client';

import * as React from 'react';
import { usePanel } from '../../core/context';
import { extractPalette, type ExtractOptions } from '../../image/extract';
import type { QuantizedSwatch } from '../../image/mmcq';
import { ImageIcon } from '../../primitives/icons';
import { SwatchGrid } from '../../primitives/SwatchGrid';
import type { PickerMode } from '../registry';

type Status = 'idle' | 'working' | 'ready' | 'error';

export interface ImagePanelProps {
  /** Forwarded to extractPalette — e.g. `{ worker }` or `{ maxColors: 12 }`. */
  extractOptions?: ExtractOptions;
}

export function ImagePanel(props: ImagePanelProps): React.ReactElement {
  const { extractOptions } = props;
  const { idPrefix, disabled } = usePanel();
  const inputId = `${idPrefix}-image-file`;

  const [status, setStatus] = React.useState<Status>('idle');
  const [message, setMessage] = React.useState('');
  const [swatches, setSwatches] = React.useState<QuantizedSwatch[]>([]);
  const [preview, setPreview] = React.useState<string | null>(null);

  // One controller per run, so picking a second image cancels the first.
  const controller = React.useRef<AbortController | null>(null);
  const previewUrl = React.useRef<string | null>(null);

  const releasePreview = React.useCallback((): void => {
    if (previewUrl.current !== null) {
      URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
    }
  }, []);

  React.useEffect(() => {
    return () => {
      controller.current?.abort();
      releasePreview();
    };
  }, [releasePreview]);

  const run = React.useCallback(
    async (file: File): Promise<void> => {
      controller.current?.abort();
      const next = new AbortController();
      controller.current = next;

      releasePreview();
      const url = URL.createObjectURL(file);
      previewUrl.current = url;
      setPreview(url);

      setStatus('working');
      setMessage('');
      try {
        const result = await extractPalette(file, { maxColors: 10, ...extractOptions, signal: next.signal });
        if (next.signal.aborted) return;
        setSwatches(result.swatches);
        setStatus(result.swatches.length > 0 ? 'ready' : 'error');
        if (result.swatches.length === 0) setMessage('No opaque pixels found in that image.');
      } catch (error) {
        if (next.signal.aborted) return;
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Could not read that image.');
      }
    },
    [extractOptions, releasePreview],
  );

  const onFiles = (files: FileList | null): void => {
    const file = files?.[0];
    if (file !== undefined) void run(file);
  };

  return (
    <div className="cp-panel">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFiles(e.dataTransfer.files);
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <label className="cp-field-label" htmlFor={inputId}>Image</label>
        <input
          id={inputId}
          className="cp-input"
          type="file"
          accept="image/*"
          disabled={disabled}
          onChange={(e) => onFiles(e.currentTarget.files)}
          style={{ height: 'auto', padding: 5 }}
        />
      </div>

      {preview !== null && (
        <img
          src={preview}
          alt=""
          style={{
            width: '100%', height: 90, objectFit: 'cover',
            borderRadius: 8, display: 'block',
          }}
        />
      )}

      {/* Announced politely so a screen-reader user learns the result. */}
      <div role="status" aria-live="polite" className="cp-visually-hidden">
        {status === 'working' ? 'Extracting colours' : ''}
        {status === 'ready' ? `${swatches.length} colours extracted` : ''}
        {status === 'error' ? message : ''}
      </div>

      {status === 'working' && <p className="cp-empty">Extracting colours…</p>}
      {status === 'error' && <p className="cp-empty">{message}</p>}
      {status === 'idle' && <p className="cp-empty">Choose or drop an image to pull its colours.</p>}

      {status === 'ready' && (
        <SwatchGrid
          swatches={swatches.map((s) => ({ color: s.hex, name: s.hex }))}
          label="Extracted colours"
          columns={5}
        />
      )}
    </div>
  );
}

export const imageMode: PickerMode = {
  id: 'image',
  label: 'Image',
  icon: ImageIcon,
  Panel: ImagePanel,
};
