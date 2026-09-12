'use client';

/**
 * `chroma-panel/panel` — the picker shell and primitives, with NO modes
 * registered.
 *
 * This is the entry to use when you want only some of the modes: import this
 * for the components, then import each mode you need to register it. The
 * `chroma-panel` barrel registers all five, so it cannot be shaken down.
 *
 *   import { ChromaPanel } from 'chroma-panel/panel';
 *   import 'chroma-panel/wheel';
 *   import 'chroma-panel/sliders';
 *
 *   <ChromaPanel modes={['wheel', 'sliders']} />
 */
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

export {
  registerMode, getMode, resolveModes, type PickerMode, type ModeId,
} from './modes/registry';

export { createColorStore, type ColorStore } from './core/store';
export { useColorValue, useTransientColor } from './core/useColorStore';
export { usePointerDrag, useAxisKeyboard } from './core/usePointerDrag';
export { setStyleNonce, injectStyles } from './core/styleInjector';
export { usePanel, type ChromaClassNames, type ColorPalette, type PanelOptions } from './core/context';

export * from './core';
