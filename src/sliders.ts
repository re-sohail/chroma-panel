import { registerMode } from './modes/registry';
import { slidersMode } from './modes/sliders/index';

registerMode(slidersMode);

export { slidersMode, SlidersPanel } from './modes/sliders/index';
