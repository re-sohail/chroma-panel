/**
 * `chroma-panel/image-worker` — the quantization worker.
 *
 * Construct it from YOUR application code, so your bundler owns the URL:
 *
 *   const worker = new Worker(
 *     new URL('chroma-panel/image-worker', import.meta.url),
 *     { type: 'module' },
 *   );
 *
 * Shipping that expression inside the library instead would make the URL
 * resolve against our dist layout in the consumer's build, which is the
 * documented way to get a 404 in Vite library mode.
 *
 * ---
 *
 * The message handler lives HERE rather than in a module this file imports,
 * and that is load-bearing. This file was previously one line:
 *
 *     import './image/worker';
 *
 * ...which built to a ZERO BYTE artifact. Two causes compounded:
 *
 * 1. `sideEffects` in package.json is an array, which declares that only the
 *    listed globs have side effects. The imported module was therefore
 *    resolved as side-effect-free, and since it exported nothing, nothing
 *    anchored it — so it was dropped and never emitted at all.
 * 2. Under `unbundle: true`, a bare side-effect-only import across module
 *    boundaries is fragile regardless of the above.
 *
 * Importing `quantize` as a VALUE fixes both: the dependency is now anchored
 * by a real export read rather than by a side effect the bundler is entitled
 * to assume away. Do not refactor this back into a bare import.
 *
 * Neither `publint` nor `are-the-types-wrong` can catch a hollow artifact —
 * they check packaging shape, not content — so `tests/dist-artifacts.test.ts`
 * guards it instead.
 */
import { quantize, type QuantizedSwatch } from './image/mmcq';

interface QuantizeRequest {
  id: string;
  data: Uint8ClampedArray;
  maxColors: number;
  alphaThreshold: number;
}

interface QuantizeResponse {
  id: string;
  swatches?: QuantizedSwatch[];
  error?: string;
}

const post = (message: QuantizeResponse): void => {
  (self as unknown as Worker).postMessage(message);
};

self.addEventListener('message', (event: MessageEvent) => {
  const request = event.data as QuantizeRequest | null;
  if (request === null || typeof request !== 'object') return;

  const { id, data, maxColors, alphaThreshold } = request;

  try {
    post({ id, swatches: quantize(data, maxColors, alphaThreshold) });
  } catch (error) {
    post({ id, error: error instanceof Error ? error.message : String(error) });
  }
});
