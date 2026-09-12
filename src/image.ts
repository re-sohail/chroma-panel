import { registerMode } from './modes/registry';
import { imageMode } from './modes/image/index';

registerMode(imageMode);

export { imageMode, ImagePanel } from './modes/image/index';

export { extractPalette, type ExtractOptions, type ExtractResult } from './image/extract';
export { quantize, type QuantizedSwatch } from './image/mmcq';
