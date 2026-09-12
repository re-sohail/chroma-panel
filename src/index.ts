'use client';

import { registerMode } from './modes/registry';
import { wheelMode } from './modes/wheel/index';
import { slidersMode } from './modes/sliders/index';
import { palettesMode } from './modes/palettes/index';
import { imageMode } from './modes/image/index';
import { pencilsMode } from './modes/pencils/index';

registerMode(wheelMode);
registerMode(slidersMode);
registerMode(palettesMode);
registerMode(imageMode);
registerMode(pencilsMode);

export { ColorInput, type ColorInputProps } from './components/ColorInput';
export { ChromaPanel, type ChromaPanelProps } from './components/ChromaPanel';
export { Popover, type PopoverProps } from './components/Popover';
export { ModeToolbar, type ModeToolbarProps } from './components/ModeToolbar';
export { PanelFooter, pushRecent } from './components/PanelFooter';

export { ColorArea, type ColorAreaProps } from './primitives/ColorArea';
export { ColorDisc, type ColorDiscProps } from './primitives/ColorDisc';
export { ChannelSlider, type ChannelSliderProps } from './primitives/ChannelSlider';
export { ColorField, type ColorFieldProps } from './primitives/ColorField';
export { NumberField, type NumberFieldProps } from './primitives/NumberField';
export { Swatch, type SwatchProps } from './primitives/Swatch';
export { SwatchGrid, type SwatchGridProps, type SwatchEntry, type SwatchVariant } from './primitives/SwatchGrid';
export { SegmentedControl, type SegmentedControlProps, type SegmentedItem } from './primitives/SegmentedControl';
export { Icon, type IconProps, type IconName } from './primitives/icons';
export { useEyedropper, type Eyedropper } from './primitives/useEyedropper';

export { wheelMode, WheelPanel } from './modes/wheel/index';
export { slidersMode, SlidersPanel } from './modes/sliders/index';
export { palettesMode, PalettesPanel } from './modes/palettes/index';
export { imageMode, ImagePanel } from './modes/image/index';
export { pencilsMode, PencilsPanel } from './modes/pencils/index';
export {
  registerMode, getMode, resolveModes, type PickerMode, type ModeId,
} from './modes/registry';

export { extractPalette, type ExtractOptions, type ExtractResult } from './image/extract';
export { quantize, type QuantizedSwatch } from './image/mmcq';

export { defaultPalettes, defaultPencils, PENCIL_COLUMNS } from './data/defaults';

export { createColorStore, type ColorStore } from './core/store';
export { useColorValue, useTransientColor } from './core/useColorStore';
export { usePointerDrag, useAxisKeyboard } from './core/usePointerDrag';
export { setStyleNonce, injectStyles } from './core/styleInjector';
export { usePanel, type ChromaClassNames, type ColorPalette, type PanelOptions } from './core/context';

export {
  relativeLuminance, contrastRatio, apcaContrast, readableTextColor,
  meetsContrast, meetsNonTextContrast, contrastReport, wcagLevel,
  type ContrastOptions, type ContrastReport, type TextSize, type WcagLevel,
} from './a11y/contrast';

export * from './core';
