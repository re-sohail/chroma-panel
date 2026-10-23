import { registerMode } from './modes/registry';
import { harmonyMode } from './modes/harmony/index';

registerMode(harmonyMode);

export {
  harmonyMode, HarmonyPanel, harmonyColors, type HarmonyPanelProps, type HarmonyRule,
} from './modes/harmony/index';
