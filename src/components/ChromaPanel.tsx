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
import { useScrollFade } from '../core/useScrollFade';
import { injectStyles } from '../core/styleInjector';
import { css, STYLE_ID } from '../styles/css';
import { resolveModes, type ModeId, type PickerMode } from '../modes/registry';
import type { ExtractOptions } from '../image/extract';
import { WindowGlyph } from '../primitives/icons';
import { ModeToolbar } from './ModeToolbar';
import { PanelFooter, pushRecent } from './PanelFooter';

export const DEFAULT_COLOR = '#3366cc';
export const FALLBACK: Hsva = { h: 220, s: 75, v: 80, a: 1 };

export type PanelSize = 'default' | 'expanded';

export interface ChromaPanelProps {
  value?: string | Hsva;
  defaultValue?: string | Hsva;
  onChange?: (color: ColorChangeResult) => void;
  onChangeComplete?: (color: ColorChangeResult) => void;

  modes?: (ModeId | string | PickerMode)[];
  mode?: string;
  defaultMode?: string;
  onModeChange?: (mode: string) => void;

  format?: ColorFormat;
  showAlpha?: boolean;
  showEyedropper?: boolean;
  showRecentColors?: boolean;
  recentColors?: string[];
  defaultRecentColors?: string[];
  onRecentColorsChange?: (colors: string[]) => void;
  palettes?: ColorPalette[];
  pencils?: string[];

  modeProps?: Record<string, Record<string, unknown>>;
  imageOptions?: ExtractOptions;

  disabled?: boolean;
  theme?: 'dark' | 'light';
  showTitleBar?: boolean;
  title?: string;

  onClose?: () => void;

  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;

  size?: PanelSize;
  defaultSize?: PanelSize;
  onSizeChange?: (size: PanelSize) => void;

  injectStyles?: boolean;

  className?: string;
  classNames?: ChromaClassNames;
  style?: React.CSSProperties;
  store?: ColorStore;
}

export function ChromaPanel(props: ChromaPanelProps): React.ReactElement {
  const {
    value, defaultValue = DEFAULT_COLOR, onChange, onChangeComplete,
    modes = ['wheel', 'sliders', 'palettes', 'image', 'pencils'],
    mode, defaultMode, onModeChange,
    format = 'hex',
    showAlpha = true, showEyedropper = true, showRecentColors = true,
    recentColors, defaultRecentColors, onRecentColorsChange,
    palettes, pencils, modeProps, imageOptions,
    disabled = false, theme, showTitleBar = true, title = 'Colors',
    onClose,
    collapsed, defaultCollapsed = false, onCollapsedChange,
    size, defaultSize = 'default', onSizeChange,
    injectStyles: shouldInject = true,
    className, classNames = {}, style, store: externalStore,
  } = props;

  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelHostRef = React.useRef<HTMLDivElement>(null);
  const idPrefix = useStableId('cp');

  const initial = React.useMemo<Hsva>(() => {
    const seed = value ?? defaultValue;
    const parsed = typeof seed === 'string' ? parse(seed) : seed;
    if (parsed === null) warnOnce(`could not parse "${seed}"; falling back to ${DEFAULT_COLOR}.`);
    return parsed ?? FALLBACK;
  }, []);

  const ownStore = React.useMemo(() => createColorStore(initial), [initial]);
  const store = externalStore ?? ownStore;

  React.useEffect(() => {
    if (shouldInject) injectStyles(css, STYLE_ID, rootRef.current);
  }, [shouldInject]);

  useTransientColor(store, (c: Hsva) => {
    const el = rootRef.current;
    if (el === null) return;
    el.style.setProperty('--cp-h', String(c.h));
    el.style.setProperty('--cp-s', `${c.s}%`);
    el.style.setProperty('--cp-v', `${c.v}%`);
    el.style.setProperty('--cp-a', String(c.a));
    el.style.setProperty('--cp-preview-color', toRgbaString(c));
  });

  React.useEffect(() => {
    if (value === undefined) return;
    const parsed = typeof value === 'string' ? parse(value) : value;
    if (parsed === null || parsed === undefined) {
      warnOnce(`could not parse value "${value}".`);
      return;
    }
    if (sameRendered(parsed, store.get())) return;
    store.ingest(parsed);
  }, [value, store]);

  const [internalRecents, setInternalRecents] = React.useState<string[]>(
    () => defaultRecentColors ?? [],
  );
  const activeRecents = recentColors ?? internalRecents;

  const callbacks = React.useRef({
    onChange, onChangeComplete, format, activeRecents, onRecentColorsChange,
    controlled: recentColors !== undefined,
  });
  React.useEffect(() => {
    callbacks.current = {
      onChange, onChangeComplete, format, activeRecents, onRecentColorsChange,
      controlled: recentColors !== undefined,
    };
  });

  React.useEffect(
    () => store.subscribe((c) => callbacks.current.onChange?.(toResult(c, callbacks.current.format))),
    [store],
  );

  React.useEffect(
    () =>
      store.subscribeCommit((c) => {
        const { onChangeComplete: done, format: fmt, activeRecents: recents,
          onRecentColorsChange: notify, controlled } = callbacks.current;
        done?.(toResult(c, fmt));

        const next = pushRecent(recents, toHex(c));
        if (!controlled) setInternalRecents(next);
        notify?.(next);
      }),
    [store],
  );

  const resolved = React.useMemo(() => resolveModes(modes), [modes]);
  const first = resolved[0];
  const [internalMode, setInternalMode] = React.useState(() => defaultMode ?? first?.id ?? 'wheel');
  const activeId = mode ?? internalMode;
  const active = resolved.find((m) => m.id === activeId) ?? first;

  useScrollFade(panelHostRef, activeId);

  const selectMode = (id: string): void => {
    if (mode === undefined) setInternalMode(id);
    onModeChange?.(id);
  };

  const [internalCollapsed, setInternalCollapsed] = React.useState(defaultCollapsed);
  const isCollapsed = collapsed ?? internalCollapsed;
  const toggleCollapsed = (): void => {
    const next = !isCollapsed;
    if (collapsed === undefined) setInternalCollapsed(next);
    onCollapsedChange?.(next);
  };

  const [internalSize, setInternalSize] = React.useState<PanelSize>(defaultSize);
  const activeSize = size ?? internalSize;
  const toggleSize = (): void => {
    const next: PanelSize = activeSize === 'expanded' ? 'default' : 'expanded';
    if (size === undefined) setInternalSize(next);
    onSizeChange?.(next);
  };

  const bodyId = `${idPrefix}-body`;

  const options = React.useMemo<PanelOptions>(
    () => ({
      modeProps: {
        ...modeProps,
        ...(imageOptions !== undefined
          ? { image: { extractOptions: imageOptions, ...modeProps?.image } }
          : {}),
      },
      palettes,
      pencils,
      showAlpha, showEyedropper, showRecentColors,
      recentColors: activeRecents,
      onRecentColorsChange,
    }),
    [palettes, pencils, modeProps, imageOptions, showAlpha, showEyedropper,
     showRecentColors, activeRecents, onRecentColorsChange],
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
        data-cp-collapsed={isCollapsed ? 'true' : undefined}
        data-cp-size={activeSize === 'expanded' ? 'expanded' : undefined}
        data-cp-modes={resolved.length}
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
            <div className="cp-lights">
              <button
                type="button"
                className="cp-light"
                data-cp-light="close"
                aria-label="Close"
                disabled={disabled || onClose === undefined}
                onClick={() => onClose?.()}
              >
                <WindowGlyph name="close" />
              </button>
              <button
                type="button"
                className="cp-light"
                data-cp-light="min"
                aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
                aria-expanded={!isCollapsed}
                aria-controls={bodyId}
                disabled={disabled}
                onClick={toggleCollapsed}
              >
                <WindowGlyph name="collapse" />
              </button>
              <button
                type="button"
                className="cp-light"
                data-cp-light="max"
                aria-label={activeSize === 'expanded' ? 'Restore panel width' : 'Widen panel'}
                aria-pressed={activeSize === 'expanded'}
                disabled={disabled}
                onClick={toggleSize}
              >
                <WindowGlyph name="expand" />
              </button>
            </div>
            <span className="cp-title">{title}</span>
            <div className="cp-titlebar-spacer" aria-hidden="true" />
          </div>
        )}

        <div className="cp-body" id={bodyId}>
          {resolved.length > 1 && (
            <ModeToolbar modes={resolved} activeId={activeId} onSelect={selectMode} />
          )}

          {active !== undefined && (
            <div
              role="tabpanel"
              id={`${idPrefix}-panel-${active.id}`}
              aria-labelledby={`${idPrefix}-tab-${active.id}`}
              ref={panelHostRef}
              tabIndex={-1}
              className={cx('cp-panel-host', classNames.panel)}
            >
              <active.Panel {...(options.modeProps[active.id] ?? {})} />
            </div>
          )}

          <PanelFooter />
        </div>
      </div>
    </PanelProvider>
  );
}
