/**
 * Optional quantization worker, published as `chroma-panel/image-worker`.
 *
 * Construct it from YOUR application code so your bundler owns the URL:
 *
 *   const worker = new Worker(
 *     new URL('chroma-panel/image-worker', import.meta.url),
 *     { type: 'module' },
 *   );
 *
 * Shipping that expression inside the library instead would make the URL
 * resolve against our dist layout in the consumer's build, which is the
 * documented way to get a 404 in Vite library mode.
 */
import { quantize } from './mmcq';

interface Request {
  id: string;
  data: Uint8ClampedArray;
  maxColors: number;
  alphaThreshold: number;
}

self.addEventListener('message', (event: MessageEvent) => {
  const { id, data, maxColors, alphaThreshold } = event.data as Request;
  try {
    const swatches = quantize(data, maxColors, alphaThreshold);
    (self as unknown as Worker).postMessage({ id, swatches });
  } catch (error) {
    (self as unknown as Worker).postMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
