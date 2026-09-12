/**
 * `chroma-panel/image-worker` — the quantization worker entry.
 *
 * Construct it from your own source so your bundler resolves the URL:
 *
 *   const worker = new Worker(
 *     new URL('chroma-panel/image-worker', import.meta.url),
 *     { type: 'module' },
 *   );
 */
import './image/worker';
