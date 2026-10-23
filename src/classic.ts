import { registerMode } from './modes/registry';
import { classicMode } from './modes/classic/index';

registerMode(classicMode);

export { classicMode, ClassicPanel } from './modes/classic/index';
