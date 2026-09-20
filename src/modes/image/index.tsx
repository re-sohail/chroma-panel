'use client';

import * as React from 'react';
import { parse } from '../../color/parse';
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

interface ImagePoint {
  x: number;
  y: number;
  left: number;
  top: number;
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
  const [point, setPoint] = React.useState<ImagePoint | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);

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
    setPoint(null);
    if (inputRef.current !== null) inputRef.current.value = '';
  };

  const locate = (image: HTMLImageElement, clientX: number, clientY: number): ImagePoint | null => {
    const rect = image.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0 || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      return null;
    }

    const scale = Math.min(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const left = rect.left + (rect.width - width) / 2;
    const top = rect.top + (rect.height - height) / 2;
    if (clientX < left || clientX > left + width ||
        clientY < top || clientY > top + height) return null;

    return {
      x: Math.min(1, Math.max(0, (clientX - left) / width)),
      y: Math.min(1, Math.max(0, (clientY - top) / height)),
      left: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      top: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    };
  };

  const selectPixel = (next: ImagePoint): void => {
    const image = imageRef.current;
    if (image === null || image.naturalWidth <= 0 || image.naturalHeight <= 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (context === null) return;
    const sx = Math.min(image.naturalWidth - 1, Math.floor(next.x * image.naturalWidth));
    const sy = Math.min(image.naturalHeight - 1, Math.floor(next.y * image.naturalHeight));
    context.drawImage(image, sx, sy, 1, 1, 0, 0, 1, 1);
    const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(0, 0, 1, 1).data;
    if (a === 0) {
      setMessage('That pixel is transparent. Choose another point.');
      return;
    }
    const parsed = parse(`rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 1000) / 1000})`);
    if (parsed === null) return;
    store.ingest(parsed);
    store.commit();
    setMessage('Color selected from image.');
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
          <img
            ref={imageRef}
            src={preview}
            alt="Uploaded image. Move over it and click to select a color."
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label="Pick a color from the uploaded image"
            onPointerMove={(event) => setPoint(locate(event.currentTarget, event.clientX, event.clientY))}
            onPointerLeave={() => setPoint(null)}
            onClick={(event) => {
              if (disabled) return;
              const next = locate(event.currentTarget, event.clientX, event.clientY);
              if (next !== null) selectPixel(next);
            }}
            onKeyDown={(event) => {
              if (disabled || (event.key !== 'Enter' && event.key !== ' ')) return;
              event.preventDefault();
              selectPixel(point ?? { x: 0.5, y: 0.5, left: 0.5, top: 0.5 });
            }}
          />
          {point !== null && (
            <span
              className="cp-image-loupe"
              aria-hidden="true"
              style={{
                left: `${point.left * 100}%`,
                top: `${point.top * 100}%`,
                backgroundImage: `url("${preview}")`,
                backgroundPosition: `${point.x * 100}% ${point.y * 100}%`,
              }}
            />
          )}
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

      {/* Stays mounted so its value can be reset and Safari autofill keeps
          working. The drop zone's <label> names it; once the preview replaces
          that label it needs a name of its own, and it leaves the tab order
          because nothing on screen would show that it had focus. */}
      <input
        ref={inputRef}
        id={inputId}
        className="cp-visually-hidden"
        type="file"
        accept="image/*"
        disabled={disabled}
        aria-label={preview === null ? undefined : 'Choose a different image'}
        tabIndex={preview === null ? undefined : -1}
        onChange={(e) => onFiles(e.currentTarget.files)}
      />

      {preview !== null && status === 'error' && <p className="cp-empty">{message}</p>}
      {preview !== null && status !== 'error' && (
        <p className="cp-image-hint">Click the image to pick an exact color.</p>
      )}

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
