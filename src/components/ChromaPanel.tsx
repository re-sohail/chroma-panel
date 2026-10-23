'use client';

import * as React from 'react';
import { parse } from '../color/parse';
import { toHex, toRgbaString, toResult } from '../color/serialize';
import { sameRendered } from '../color/sticky';
import type { ColorChangeMeta, ColorChangeResult, ColorFormat, Hsva } from '../color/types';
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
import { ModeToolbar } from './ModeToolbar';
import { PanelFooter, pushRecent } from './PanelFooter';
import { PanelHeader } from './PanelHeader';

export const DEFAULT_COLOR = '#3366cc';
export const FALLBACK: Hsva = { h: 220, s: 75, v: 80, a: 1 };

export type PanelSize = 'default' | 'expanded';

const DEFAULT_MODES: readonly ModeId[] = ['wheel', 'classic', 'harmony', 'sliders', 'palettes', 'image'];

export interface ChromaPanelProps {
  value?: string | Hsva;
  defaultValue?: string | Hsva;
  onChange?: (color: ColorChangeResult) => void;
  onChangeComplete?: (color: ColorChangeResult) => void;
  onValueChange?: (color: ColorChangeResult, meta: ColorChangeMeta) => void;
  onValueCommit?: (color: ColorChangeResult, meta: ColorChangeMeta) => void;

  modes?: readonly (ModeId | string | PickerMode)[];
  mode?: string;
  defaultMode?: string;
  onModeChange?: (mode: string) => void;

  format?: ColorFormat;
  showAlpha?: boolean;
  showEyedropper?: boolean;
  showCopyButton?: boolean;
  showRecentColors?: boolean;
  recentColors?: string[];
  defaultRecentColors?: string[];
  onRecentColorsChange?: (colors: string[]) => void;
  palettes?: ColorPalette[];
  pencils?: string[];

  modeProps?: Record<string, Record<string, unknown>>;
  imageOptions?: ExtractOptions;

  disabled?: boolean;
  theme?: 'dark' | 'light' | 'auto';
  showTitleBar?: boolean;
  title?: string;

  onClose?: () => void;

  collapsed?: boolean;
  defaultCollapsed?: boolean;
  /** @deprecated 2.0 removed the collapse button, so nothing calls this. Control `collapsed` instead. */
  onCollapsedChange?: (collapsed: boolean) => void;

  size?: PanelSize;
  defaultSize?: PanelSize;
  /** @deprecated 2.0 removed the widen button, so nothing calls this. Control `size` instead. */
  onSizeChange?: (size: PanelSize) => void;

  injectStyles?: boolean;

  className?: string;
  classNames?: ChromaClassNames;
  style?: React.CSSProperties;
  store?: ColorStore;
}

export function ChromaPanel(props: ChromaPanelProps): React.ReactElement {
  const {
    value, defaultValue = DEFAULT_COLOR, onChange, onChangeComplete, onValueChange, onValueCommit,
    modes = DEFAULT_MODES,
    mode, defaultMode, onModeChange,
    format = 'hex',
    showAlpha = true, showEyedropper = true, showCopyButton = true, showRecentColors = true,
    recentColors, defaultRecentColors, onRecentColorsChange,
    palettes, pencils, modeProps, imageOptions,
    disabled = false, theme, showTitleBar = true, title = 'Colors',
    onClose,
    collapsed, defaultCollapsed = false,
    size, defaultSize = 'default',
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
    store.ingest(parsed, 'programmatic');
  }, [value, store]);

  const [internalRecents, setInternalRecents] = React.useState<string[]>(
    () => defaultRecentColors ?? [],
  );
  const activeRecents = recentColors ?? internalRecents;

  const callbacks = React.useRef({
    onChange, onChangeComplete, onValueChange, onValueCommit, format, showAlpha, activeRecents, onRecentColorsChange,
    controlled: recentColors !== undefined,
  });
  React.useEffect(() => {
    callbacks.current = {
      onChange, onChangeComplete, onValueChange, onValueCommit, format, showAlpha, activeRecents, onRecentColorsChange,
      controlled: recentColors !== undefined,
    };
  });

  React.useEffect(
    () => store.subscribe((c, meta) => {
      const result = toResult(c, callbacks.current.format, callbacks.current.showAlpha);
      callbacks.current.onChange?.(result);
      callbacks.current.onValueChange?.(result, meta);
    }),
    [store],
  );

  React.useEffect(
    () =>
      store.subscribeCommit((c, meta) => {
        const { onChangeComplete: done, format: fmt, showAlpha: alpha, activeRecents: recents,
          onValueCommit: commit, onRecentColorsChange: notify, controlled } = callbacks.current;
        const result = toResult(c, fmt, alpha);
        done?.(result);
        commit?.(result, meta);

        const next = pushRecent(recents, toHex(c));
        if (!controlled) setInternalRecents(next);
        notify?.(next);
      }),
    [store],
  );

  const setRecentColors = React.useCallback((next: string[]): void => {
    if (!callbacks.current.controlled) setInternalRecents(next);
    callbacks.current.onRecentColorsChange?.(next);
  }, []);

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

  const isCollapsed = collapsed ?? defaultCollapsed;
  const activeSize = size ?? defaultSize;

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
      showAlpha, showEyedropper, showCopyButton, showRecentColors, format,
      injectStyles: shouldInject,
      recentColors: activeRecents,
      onRecentColorsChange,
      setRecentColors,
    }),
    [palettes, pencils, modeProps, imageOptions, showAlpha, showEyedropper, showCopyButton, format,
     shouldInject, showRecentColors, activeRecents, onRecentColorsChange, setRecentColors],
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
        data-cp-theme={theme === 'auto' ? undefined : theme}
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
        <PanelHeader
          title={showTitleBar ? title : undefined}
          onClose={onClose}
          className={classNames.titlebar}
        />

        <div className="cp-body" id={bodyId}>
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

          {resolved.length > 1 && (
            <ModeToolbar modes={resolved} activeId={activeId} onSelect={selectMode} />
          )}
        </div>
      </div>
    </PanelProvider>
  );
}
