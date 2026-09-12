import { quantize, type QuantizedSwatch } from './mmcq';

export type { QuantizedSwatch };

export interface ExtractOptions {
  /** Number of swatches to return. Default 8. */
  maxColors?: number;
  /**
   * Longest edge to downscale to before sampling. Default 100.
   *
   * 100x100 is 10,000 pixels, which is ample for 8-16 dominant colours;
   * above ~128 the palette stops improving and only the latency grows.
   */
  size?: number;
  /** Pixels below this alpha are ignored. Default 128. */
  alphaThreshold?: number;
  /**
   * Run quantization in a worker you supply.
   *
   * Not the default, because at the default size the quantizer costs only a
   * few milliseconds -- less than one frame -- while the expensive part
   * (image decoding) is already off-thread inside createImageBitmap. A worker
   * only pays for itself at much larger `size` values.
   *
   * Construct it in YOUR source, so your bundler resolves the URL:
   *
   *   const worker = new Worker(
   *     new URL('chroma-panel/image-worker', import.meta.url),
   *     { type: 'module' },
   *   );
   *
   * That is deliberately not done inside this package: a `new URL(...,
   * import.meta.url)` shipped inside library code resolves against the
   * consumer's chunk layout and commonly 404s -- it is a known failure mode
   * of Vite library mode in particular.
   */
  worker?: Worker | (() => Worker);
  signal?: AbortSignal;
}

export interface ExtractResult {
  swatches: QuantizedSwatch[];
  /** Pixels actually sampled, after downscale and the alpha filter. */
  sampled: number;
}

function aborted(signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true;
}

async function toBlob(source: Blob | string): Promise<Blob> {
  if (typeof source !== 'string') return source;
  // fetch -> blob -> createImageBitmap avoids canvas tainting entirely, which
  // an <img> with a cross-origin src would hit on getImageData.
  const response = await fetch(source, { mode: 'cors' });
  if (!response.ok) throw new Error(`chroma-panel: could not load image (${response.status}).`);
  return await response.blob();
}

async function decode(blob: Blob, size: number): Promise<ImageBitmap> {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('chroma-panel: this browser cannot decode images off-thread.');
  }
  // resizeWidth/Height downscale inside the decoder, so a 4000x3000 source is
  // never fully materialised in memory.
  return await createImageBitmap(blob, {
    resizeWidth: size,
    resizeHeight: size,
    resizeQuality: 'medium',
    premultiplyAlpha: 'none',
  });
}

function readPixels(bitmap: ImageBitmap): Uint8ClampedArray {
  const { width, height } = bitmap;

  const canvas: OffscreenCanvas | HTMLCanvasElement =
    typeof OffscreenCanvas === 'function'
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement('canvas'), { width, height });

  // willReadFrequently keeps the surface CPU-backed and avoids a GPU readback
  // stall on getImageData.
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

    // Transfer the buffer rather than copying it.
    const copy = new Uint8ClampedArray(data);
    worker.postMessage({ id, data: copy, maxColors, alphaThreshold }, [copy.buffer]);
  });
}

/**
 * Extract the dominant colours of an image.
 *
 * Pipeline: fetch -> createImageBitmap (decoder-side downscale, off-thread)
 * -> OffscreenCanvas -> getImageData -> alpha filter -> modified median cut.
 * The decode dominates the latency; the quantizer is a few milliseconds.
 */
export async function extractPalette(
  source: Blob | File | string,
  options: ExtractOptions = {},
): Promise<ExtractResult> {
  const {
    maxColors = 8,
    size = 100,
    alphaThreshold = 128,
    worker,
    signal,
  } = options;

  if (aborted(signal)) throw new DOMException('Aborted', 'AbortError');

  const blob = await toBlob(source);
  if (aborted(signal)) throw new DOMException('Aborted', 'AbortError');

  const bitmap = await decode(blob, Math.max(8, Math.round(size)));
  let data: Uint8ClampedArray;
  try {
    if (aborted(signal)) throw new DOMException('Aborted', 'AbortError');
    data = readPixels(bitmap);
  } finally {
    // Not closing an ImageBitmap leaks GPU memory.
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
