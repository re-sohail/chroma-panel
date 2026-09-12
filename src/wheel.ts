import { registerMode } from './modes/registry';
import { wheelMode } from './modes/wheel/index';

registerMode(wheelMode);

export { wheelMode, WheelPanel } from './modes/wheel/index';
