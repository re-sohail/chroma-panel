'use client';

/**
 * chroma-panel — a macOS-inspired React colour picker.
 *
 * This entry registers all five modes. For a smaller bundle, import
 * `chroma-panel/core` plus only the modes you need.
 *
 * Note the deliberately flat export surface: no compound components
 * (`<ChromaPanel.Swatch>`). Static properties assigned to a component do not
 * survive React Server Components' client boundary, which breaks the
 * dot-notation form in Next.js App Router.
 */
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

/* ---- components ---- */
export { ColorInput, type ColorInputProps } from './components/ColorInput';
export { ChromaPanel, type ChromaPanelProps } from './components/ChromaPanel';
export { Popover, type PopoverProps } from './components/Popover';
export { ModeToolbar, type ModeToolbarProps } from './components/ModeToolbar';
export { PanelFooter, pushRecent } from './components/PanelFooter';

/* ---- primitives, for building your own layout ---- */
export { ColorArea, type ColorAreaProps } from './primitives/ColorArea';
export { ColorDisc, type ColorDiscProps } from './primitives/ColorDisc';
export { ChannelSlider, type ChannelSliderProps } from './primitives/ChannelSlider';
export { ColorField, type ColorFieldProps } from './primitives/ColorField';
export { NumberField, type NumberFieldProps } from './primitives/NumberField';
export { Swatch, type SwatchProps } from './primitives/Swatch';
export { SwatchGrid, type SwatchGridProps, type SwatchEntry } from './primitives/SwatchGrid';
export { useEyedropper, type Eyedropper } from './primitives/useEyedropper';

/* ---- modes ---- */
export { wheelMode, WheelPanel } from './modes/wheel/index';
export { slidersMode, SlidersPanel } from './modes/sliders/index';
export { palettesMode, PalettesPanel } from './modes/palettes/index';
export { imageMode, ImagePanel } from './modes/image/index';
export { pencilsMode, PencilsPanel } from './modes/pencils/index';
export {
  registerMode, getMode, resolveModes, type PickerMode, type ModeId,
} from './modes/registry';

/* ---- image extraction ---- */
export { extractPalette, type ExtractOptions, type ExtractResult } from './image/extract';
export { quantize, type QuantizedSwatch } from './image/mmcq';

/* ---- data ---- */
export { defaultPalettes, defaultPencils } from './data/defaults';

/* ---- hooks, store and styling ---- */
export { createColorStore, type ColorStore } from './core/store';
export { useColorValue, useTransientColor } from './core/useColorStore';
export { usePointerDrag, useAxisKeyboard } from './core/usePointerDrag';
export { setStyleNonce, injectStyles } from './core/styleInjector';
export { usePanel, type ChromaClassNames, type ColorPalette, type PanelOptions } from './core/context';

/* ---- contrast helpers ---- */
/* Also available from `chroma-panel/contrast` for consumers who want only the
   maths without any React. */
export {
  relativeLuminance, contrastRatio, wcagLevel, apcaContrast, readableTextColor,
  type WcagLevel,
} from './a11y/contrast';

/* ---- colour engine ---- */
export * from './core';
