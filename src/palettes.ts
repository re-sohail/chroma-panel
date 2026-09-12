/**
 * `chroma-panel/palettes` — the palettes mode on its own.
 *
 * Importing this module registers the mode, so it can then be named by id in
 * the `modes` prop. Import only the modes you use to keep the rest out of
 * your bundle, or import `chroma-panel` for all five.
 */
import { registerMode } from './modes/registry';
import { palettesMode } from './modes/palettes/index';

registerMode(palettesMode);

export { palettesMode, PalettesPanel } from './modes/palettes/index';
