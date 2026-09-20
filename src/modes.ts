export { wheelMode, WheelPanel } from './modes/wheel/index';
export { slidersMode, SlidersPanel } from './modes/sliders/index';
export { palettesMode, PalettesPanel } from './modes/palettes/index';
export { imageMode, ImagePanel, type ImagePanelProps } from './modes/image/index';
export { pencilsMode, PencilsPanel } from './modes/pencils/index';
export {
  getMode, registerMode, resolveModes, type ModeId, type PickerMode,
} from './modes/registry';

import { imageMode } from './modes/image/index';
import { palettesMode } from './modes/palettes/index';
import { pencilsMode } from './modes/pencils/index';
import { slidersMode } from './modes/sliders/index';
import { wheelMode } from './modes/wheel/index';
import type { PickerMode } from './modes/registry';

export const builtInModes: readonly PickerMode[] = Object.freeze([
  wheelMode, slidersMode, palettesMode, imageMode, pencilsMode,
]);
