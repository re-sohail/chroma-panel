'use client';

import * as React from 'react';
import { usePanel } from '../../core/context';
import { extractPalette, type ExtractOptions } from '../../image/extract';
import type { QuantizedSwatch } from '../../image/mmcq';
import { Icon, ImageIcon } from '../../primitives/icons';
import { SwatchGrid } from '../../primitives/SwatchGrid';
import type { PickerMode } from '../registry';

type Status = 'idle' | 'working' | 'ready' | 'error';

interface Kept {
  status: Status;
  message: string;
  swatches: QuantizedSwatch[];
  preview: string | null;
}

const kept = new WeakMap<object, Kept>();
const EMPTY: Kept = { status: 'idle', message: '', swatches: [], preview: null };

export interface ImagePanelProps {
  extractOptions?: ExtractOptions;
}

export function ImagePanel(props: ImagePanelProps): React.ReactElement {
  const { extractOptions } = props;
  const { idPrefix, disabled } = usePanel();
  const inputId = `${idPrefix}-image-file`;

  const { store } = usePanel();
  const restored = kept.get(store) ?? EMPTY;

  const [status, setStatus] = React.useState<Status>(restored.status);
  const [message, setMessage] = React.useState(restored.message);
  const [swatches, setSwatches] = React.useState<QuantizedSwatch[]>(restored.swatches);
  const [preview, setPreview] = React.useState<string | null>(restored.preview);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (preview === null && status === 'idle') kept.delete(store);
    else kept.set(store, { status, message, swatches, preview });
  }, [store, status, message, swatches, preview]);

  const controller = React.useRef<AbortController | null>(null);
  const previewUrl = React.useRef<string | null>(restored.preview);

  const releasePreview = React.useCallback((): void => {
    if (previewUrl.current !== null) {
      URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
    }
  }, []);

  React.useEffect(() => {
    return () => {
      controller.current?.abort();
    };
  }, []);

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

  const clear = (): void => {
    controller.current?.abort();
    releasePreview();
    setPreview(null);
    setSwatches([]);
    setMessage('');
    setStatus('idle');
    if (inputRef.current !== null) inputRef.current.value = '';
  };

  const dragDepth = React.useRef(0);
  const [dragging, setDragging] = React.useState(false);
  const endDrag = (): void => {
    dragDepth.current = 0;
    setDragging(false);
  };

  return (
    <div
      className="cp-panel"
      onDragEnter={(e) => {
        e.preventDefault();
        if (disabled) return;
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) endDrag();
      }}
      onDrop={(e) => {
        e.preventDefault();
        endDrag();
        if (!disabled) onFiles(e.dataTransfer.files);
      }}
    >
      <div role="status" aria-live="polite" className="cp-visually-hidden">
        {status === 'working' ? 'Extracting colors' : ''}
        {status === 'ready' ? `${swatches.length} colors extracted` : ''}
        {status === 'error' ? message : ''}
      </div>

      {preview === null ? (
        <label
          className="cp-dropzone"
          htmlFor={inputId}
          data-cp-dragging={dragging ? 'true' : undefined}
        >
          <Icon name="image" />
          <span className="cp-dropzone-title">
            {status === 'working' ? 'Reading image…' : 'Drop an image here'}
          </span>
          <span className="cp-dropzone-hint">
            {status === 'error' ? message : 'or click to choose a file'}
          </span>
        </label>
      ) : (
        <div className="cp-image-preview">
          <img src={preview} alt="" />
          <button
            type="button"
            className="cp-image-remove"
            aria-label="Remove image"
            title="Remove image"
            disabled={disabled}
            onClick={clear}
          >
            <Icon name="x" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        id={inputId}
        className="cp-visually-hidden"
        type="file"
        accept="image/*"
        disabled={disabled}
        onChange={(e) => onFiles(e.currentTarget.files)}
      />

      {preview !== null && status === 'error' && <p className="cp-empty">{message}</p>}

      {status === 'ready' && (
        <SwatchGrid
          swatches={swatches.map((s) => ({ color: s.hex, name: s.hex }))}
          label="Extracted colors"
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
