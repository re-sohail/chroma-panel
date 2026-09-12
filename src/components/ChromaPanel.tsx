'use client';

import * as React from 'react';
import { parse } from '../color/parse';
import { toHex, toRgbaString, toResult } from '../color/serialize';
import { sameRendered } from '../color/sticky';
import type { ColorChangeResult, ColorFormat, Hsva } from '../color/types';
import {
  cx, PanelProvider, useStableId,
  type ChromaClassNames, type ColorPalette, type PanelContextValue, type PanelOptions,
} from '../core/context';
import { warnOnce } from '../core/dev';
import { createColorStore, type ColorStore } from '../core/store';
import { useTransientColor } from '../core/useColorStore';
import { injectStyles } from '../core/styleInjector';
import { css, STYLE_ID } from '../styles/css';
import { resolveModes, type ModeId, type PickerMode } from '../modes/registry';
import { ModeToolbar } from './ModeToolbar';
import { PanelFooter, pushRecent } from './PanelFooter';

const FALLBACK: Hsva = { h: 0, s: 0, v: 100, a: 1 };

export interface ChromaPanelProps {
  /** Controlled colour, as any CSS colour string. */
  value?: string;
  /** Initial colour when uncontrolled. Default `#ffffff`. */
  defaultValue?: string;
  /** Fires continuously while dragging (coalesced to one per frame). */
  onChange?: (color: ColorChangeResult) => void;
  /** Fires once when an interaction settles — use this for saves and undo. */
  onChangeComplete?: (color: ColorChangeResult) => void;

  /** Which modes to show, as ids or custom mode objects. */
  modes?: (ModeId | string | PickerMode)[];
  mode?: string;
  defaultMode?: string;
  onModeChange?: (mode: string) => void;

  /** Syntax used for `ColorChangeResult.css`. Default `hex`. */
  format?: ColorFormat;
  showAlpha?: boolean;
  showEyedropper?: boolean;
  showRecentColors?: boolean;
  recentColors?: string[];
  onRecentColorsChange?: (colors: string[]) => void;
  palettes?: ColorPalette[];
  pencils?: string[];

  disabled?: boolean;
  theme?: 'dark' | 'light';
  /** Show the decorative macOS-style title bar. Default true. */
  showTitleBar?: boolean;
  title?: string;

  /**
   * Inject the stylesheet automatically. Default true.
   * Set false and `import 'chroma-panel/styles.css'` yourself for strict-CSP
   * or critical-CSS setups.
   */
  injectStyles?: boolean;

  className?: string;
  classNames?: ChromaClassNames;
  style?: React.CSSProperties;
  /** Advanced: share one store between several panels. */
  store?: ColorStore;
}

/**
 * The picker panel, without a trigger or popover.
 *
 * Use this when the picker lives inline (a sidebar, a toolbar). Use
 * `ColorInput` for the swatch-plus-popover form.
 */
export function ChromaPanel(props: ChromaPanelProps): React.ReactElement {
  const {
    value, defaultValue = '#ffffff', onChange, onChangeComplete,
    modes = ['wheel', 'sliders', 'palettes', 'image', 'pencils'],
    mode, defaultMode, onModeChange,
    format = 'hex',
    showAlpha = true, showEyedropper = true, showRecentColors = true,
    recentColors, onRecentColorsChange,
    palettes, pencils,
    disabled = false, theme, showTitleBar = true, title = 'Colours',
    injectStyles: shouldInject = true,
    className, classNames = {}, style, store: externalStore,
  } = props;

  const rootRef = React.useRef<HTMLDivElement>(null);
  const idPrefix = useStableId('cp');

  // ---- store -------------------------------------------------------------
  const initial = React.useMemo<Hsva>(() => {
    const seed = value ?? defaultValue;
    const parsed = parse(seed);
    if (parsed === null) warnOnce(`could not parse "${seed}"; falling back to #ffffff.`);
    return parsed ?? FALLBACK;
    // Intentionally seeded once; later `value` changes flow through the sync
    // effect below so that powerless hue/saturation survive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ownStore = React.useMemo(() => createColorStore(initial), [initial]);
  const store = externalStore ?? ownStore;

  // ---- styles ------------------------------------------------------------
  React.useEffect(() => {
    if (shouldInject) injectStyles(css, STYLE_ID, rootRef.current);
  }, [shouldInject]);

  // ---- one write per frame drives every surface --------------------------
  useTransientColor(store, (c: Hsva) => {
    const el = rootRef.current;
    if (el === null) return;
    el.style.setProperty('--cp-h', String(c.h));
    el.style.setProperty('--cp-s', `${c.s}%`);
    el.style.setProperty('--cp-v', `${c.v}%`);
    el.style.setProperty('--cp-a', String(c.a));
    el.style.setProperty('--cp-preview-color', toRgbaString(c));
  });

  // ---- controlled value --------------------------------------------------
  React.useEffect(() => {
    if (value === undefined) return;
    const parsed = parse(value);
    if (parsed === null) {
      warnOnce(`could not parse value "${value}".`);
      return;
    }
    // Compare what the colours RENDER as, not their HSVA. A parent that feeds
    // onChange straight back into `value` returns a colour that looks the same
    // but has lost its powerless hue; treating that as a change would stomp
    // the user's hue on every frame of a drag.
    if (sameRendered(parsed, store.get())) return;
    store.ingest(parsed);
  }, [value, store]);

  // ---- callbacks (subscriptions, so they never cause a render) -----------
  const callbacks = React.useRef({ onChange, onChangeComplete, format, recentColors, onRecentColorsChange });
  React.useEffect(() => {
    callbacks.current = { onChange, onChangeComplete, format, recentColors, onRecentColorsChange };
  });

  React.useEffect(
    () => store.subscribe((c) => callbacks.current.onChange?.(toResult(c, callbacks.current.format))),
    [store],
  );

  React.useEffect(
    () =>
      store.subscribeCommit((c) => {
        const { onChangeComplete: done, format: fmt, recentColors: recents, onRecentColorsChange: setRecents } =
          callbacks.current;
        done?.(toResult(c, fmt));
        if (setRecents !== undefined) setRecents(pushRecent(recents ?? [], toHex(c)));
      }),
    [store],
  );

  // ---- modes -------------------------------------------------------------
  const resolved = React.useMemo(() => resolveModes(modes), [modes]);
  const first = resolved[0];
  const [internalMode, setInternalMode] = React.useState(() => defaultMode ?? first?.id ?? 'wheel');
  const activeId = mode ?? internalMode;
  const active = resolved.find((m) => m.id === activeId) ?? first;

  const selectMode = (id: string): void => {
    if (mode === undefined) setInternalMode(id);
    onModeChange?.(id);
  };

  // ---- context -----------------------------------------------------------
  const options = React.useMemo<PanelOptions>(
    () => ({
      palettes: palettes ?? [],
      pencils: pencils ?? [],
      showAlpha, showEyedropper, showRecentColors,
      recentColors: recentColors ?? [],
      onRecentColorsChange,
    }),
    [palettes, pencils, showAlpha, showEyedropper, showRecentColors, recentColors, onRecentColorsChange],
  );

  const context = React.useMemo<PanelContextValue>(
    () => ({ store, disabled, classNames, options, idPrefix }),
    [store, disabled, classNames, options, idPrefix],
  );

  const seed = store.get();

  return (
    <PanelProvider value={context}>
      <div
        ref={rootRef}
        className={cx('cp-root', classNames.root, className)}
        data-cp-theme={theme}
        data-cp-disabled={disabled ? 'true' : undefined}
        style={{
          ['--cp-h' as string]: String(seed.h),
          ['--cp-s' as string]: `${seed.s}%`,
          ['--cp-v' as string]: `${seed.v}%`,
          ['--cp-a' as string]: String(seed.a),
          ['--cp-preview-color' as string]: toRgbaString(seed),
          ...style,
        } as React.CSSProperties}
      >
        {showTitleBar && (
          <div className={cx('cp-titlebar', classNames.titlebar)}>
            {/* Ornamental only. A close button that does not close would be
                worse than no button, so these carry no handlers and are
                hidden from assistive technology. */}
            <div className="cp-lights" aria-hidden="true">
              <span className="cp-light" data-cp-light="close" />
              <span className="cp-light" data-cp-light="min" />
              <span className="cp-light" data-cp-light="max" />
            </div>
            <span className="cp-title">{title}</span>
            <div style={{ width: 40 }} aria-hidden="true" />
          </div>
        )}

        {resolved.length > 1 && (
          <ModeToolbar modes={resolved} activeId={activeId} onSelect={selectMode} />
        )}

        {active !== undefined && (
          <div
            role="tabpanel"
            id={`${idPrefix}-panel-${active.id}`}
            aria-labelledby={`${idPrefix}-tab-${active.id}`}
            tabIndex={-1}
            className={cx(classNames.panel)}
          >
            <active.Panel />
          </div>
        )}

        <PanelFooter />
      </div>
    </PanelProvider>
  );
}
