import { registerMode } from './modes/registry';
import { pencilsMode } from './modes/pencils/index';

registerMode(pencilsMode);

export { pencilsMode, PencilsPanel } from './modes/pencils/index';
