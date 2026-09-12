/**
 * `chroma-panel/image` — the image mode on its own.
 *
 * Importing this module registers the mode, so it can then be named by id in
 * the `modes` prop. Import only the modes you use to keep the rest out of
 * your bundle, or import `chroma-panel` for all five.
 */
import { registerMode } from './modes/registry';
import { imageMode } from './modes/image/index';

registerMode(imageMode);

export { imageMode, ImagePanel } from './modes/image/index';

export { extractPalette, type ExtractOptions, type ExtractResult } from './image/extract';
export { quantize, type QuantizedSwatch } from './image/mmcq';
