import * as React from 'react';
import { injectStyles } from './styleInjector';
import { STYLE_ID } from '../styles/css';

// A layout effect, so the rules exist before Popover measures the panel in its
// own layout effect. Children's layout effects run before their parent's.
const useInsertionTime = typeof document === 'undefined' ? React.useEffect : React.useLayoutEffect;

/**
 * Injects one stylesheet chunk the first time a component that needs it mounts.
 * The chunk goes into the same document or shadow root as `ref`, once per root.
 */
export function useStyleChunk(
  css: string,
  name: string,
  ref: React.RefObject<Node | null>,
  enabled: boolean,
): void {
  useInsertionTime(() => {
    if (enabled) injectStyles(css, `${STYLE_ID}-${name}`, ref.current);
  }, [css, name, enabled]);
}
