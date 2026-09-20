import { quantize, type QuantizedSwatch } from './mmcq';

export type { QuantizedSwatch };

export interface ExtractOptions {
  maxColors?: number;
  size?: number;
  alphaThreshold?: number;
  maxFileSize?: number;
  maxSourcePixels?: number;
  worker?: Worker | (() => Worker);
  signal?: AbortSignal;
}

export interface ExtractResult {
  swatches: QuantizedSwatch[];
  sampled: number;
}

function aborted(signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true;
}

async function toBlob(source: Blob | string): Promise<Blob> {
  if (typeof source !== 'string') return source;
  const response = await fetch(source, { mode: 'cors' });
  if (!response.ok) throw new Error(`chroma-panel: could not load image (${response.status}).`);
  return await response.blob();
}

const DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024;
const DEFAULT_MAX_SOURCE_PIXELS = 40_000_000;

function validateBlob(blob: Blob, maxFileSize: number): void {
  if (blob.size > maxFileSize) {
    const limit = Math.round(maxFileSize / (1024 * 1024));
    throw new RangeError(`chroma-panel: image must be ${limit} MB or smaller.`);
  }
  if (blob.type !== '' && !blob.type.toLowerCase().startsWith('image/')) {
    throw new TypeError('chroma-panel: the selected file is not an image.');
  }
}

async function decode(blob: Blob, size: number, maxSourcePixels: number): Promise<ImageBitmap> {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('chroma-panel: this browser cannot decode images off-thread.');
  }

  const longest = Math.max(8, Math.round(size));

  const probe = await createImageBitmap(blob);
  const pixels = probe.width * probe.height;
  if (pixels > maxSourcePixels) {
    probe.close();
    const megapixels = Math.round(maxSourcePixels / 1_000_000);
    throw new RangeError(`chroma-panel: image dimensions must not exceed ${megapixels} megapixels.`);
  }
  const wide = probe.width >= probe.height;
  probe.close();

  try {
    return await createImageBitmap(blob, {
      ...(wide ? { resizeWidth: longest } : { resizeHeight: longest }),
      resizeQuality: 'medium',
      premultiplyAlpha: 'none',
    });
  } catch {
    return await createImageBitmap(blob);
  }
}

function readPixels(bitmap: ImageBitmap): Uint8ClampedArray {
  const { width, height } = bitmap;

  const canvas: OffscreenCanvas | HTMLCanvasElement =
    typeof OffscreenCanvas === 'function'
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement('canvas'), { width, height });

  const ctx = (canvas as HTMLCanvasElement).getContext('2d', {
    willReadFrequently: true,
  }) as CanvasRenderingContext2D | null;

  if (ctx === null) throw new Error('chroma-panel: could not get a 2D canvas context.');

  ctx.drawImage(bitmap as unknown as CanvasImageSource, 0, 0);
  return ctx.getImageData(0, 0, width, height).data;
}

function runInWorker(
  worker: Worker,
  data: Uint8ClampedArray,
  maxColors: number,
  alphaThreshold: number,
  signal: AbortSignal | undefined,
): Promise<QuantizedSwatch[]> {
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).slice(2);

    const cleanup = (): void => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      signal?.removeEventListener('abort', onAbort);
    };
    const onMessage = (event: MessageEvent): void => {
      const payload = event.data as { id?: string; swatches?: QuantizedSwatch[]; error?: string };
      if (payload.id !== id) return;
      cleanup();
      if (payload.error !== undefined) reject(new Error(payload.error));
      else resolve(payload.swatches ?? []);
    };
    const onError = (event: ErrorEvent): void => {
      cleanup();
      reject(new Error(event.message));
    };
    const onAbort = (): void => {
      cleanup();
      reject(new DOMException('Aborted', 'AbortError'));
    };

    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    signal?.addEventListener('abort', onAbort);

    const copy = new Uint8ClampedArray(data);
    worker.postMessage({ id, data: copy, maxColors, alphaThreshold }, [copy.buffer]);
  });
}

export async function extractPalette(
  source: Blob | File | string,
  options: ExtractOptions = {},
): Promise<ExtractResult> {
  const {
    maxColors = 8,
    size = 100,
    alphaThreshold = 128,
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    maxSourcePixels = DEFAULT_MAX_SOURCE_PIXELS,
    worker,
    signal,
  } = options;

  if (!Number.isFinite(maxColors) || maxColors < 2) {
    throw new RangeError('chroma-panel: maxColors must be a number of at least 2.');
  }
  if (!Number.isFinite(size) || size < 8) {
    throw new RangeError('chroma-panel: size must be a number of at least 8.');
  }
  if (!Number.isFinite(alphaThreshold) || alphaThreshold < 0 || alphaThreshold > 255) {
    throw new RangeError('chroma-panel: alphaThreshold must be between 0 and 255.');
  }
  if (!Number.isFinite(maxFileSize) || maxFileSize <= 0) {
    throw new RangeError('chroma-panel: maxFileSize must be greater than 0.');
  }
  if (!Number.isFinite(maxSourcePixels) || maxSourcePixels < 64) {
    throw new RangeError('chroma-panel: maxSourcePixels must be at least 64.');
  }

  if (aborted(signal)) throw new DOMException('Aborted', 'AbortError');

  const blob = await toBlob(source);
  validateBlob(blob, maxFileSize);
  if (aborted(signal)) throw new DOMException('Aborted', 'AbortError');

  const bitmap = await decode(blob, size, maxSourcePixels);
  let data: Uint8ClampedArray;
  try {
    if (aborted(signal)) throw new DOMException('Aborted', 'AbortError');
    data = readPixels(bitmap);
  } finally {
    bitmap.close();
  }

  let sampled = 0;
  for (let i = 3; i < data.length; i += 4) {
    if ((data[i] as number) >= alphaThreshold) sampled++;
  }

  const instance = typeof worker === 'function' ? worker() : worker;
  const swatches =
    instance !== undefined
      ? await runInWorker(instance, data, maxColors, alphaThreshold, signal)
      : quantize(data, maxColors, alphaThreshold);

  return { swatches, sampled };
}
