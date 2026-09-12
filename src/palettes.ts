import { registerMode } from './modes/registry';
import { palettesMode } from './modes/palettes/index';

registerMode(palettesMode);

export { palettesMode, PalettesPanel } from './modes/palettes/index';
