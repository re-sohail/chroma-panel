'use client';

import * as React from 'react';
import { usePanel } from '../../core/context';
import { extractPalette, type ExtractOptions } from '../../image/extract';
import type { QuantizedSwatch } from '../../image/mmcq';
import { Icon, ImageIcon } from '../../primitives/icons';
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
  const inputRef = React.useRef<HTMLInputElement>(null);

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

  const clear = (): void => {
    controller.current?.abort();
    releasePreview();
    setPreview(null);
    setSwatches([]);
    setMessage('');
    setStatus('idle');
    // The input keeps the old filename otherwise, so re-picking the SAME file
    // fires no change event and nothing happens.
    if (inputRef.current !== null) inputRef.current.value = '';
  };

  // A counter, not a boolean: dragleave fires every time the pointer crosses
  // onto a child element, so a boolean flickers the highlight off mid-drag.
  const dragDepth = React.useRef(0);
  const [dragging, setDragging] = React.useState(false);
  const endDrag = (): void => {
    dragDepth.current = 0;
    setDragging(false);
  };

  return (
    // Drop is bound to the panel, not just the drop zone, so dragging a
    // replacement over the preview works too.
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
      {/* Announced politely so a screen-reader user learns the result. */}
      <div role="status" aria-live="polite" className="cp-visually-hidden">
        {status === 'working' ? 'Extracting colours' : ''}
        {status === 'ready' ? `${swatches.length} colours extracted` : ''}
        {status === 'error' ? message : ''}
      </div>

      {preview === null ? (
        // The label IS the control: clicking or pressing it activates the
        // hidden input, with no click handler of our own to keep in sync.
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
