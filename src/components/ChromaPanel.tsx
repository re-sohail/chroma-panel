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
import type { ExtractOptions } from '../image/extract';
import { WindowGlyph } from '../primitives/icons';
import { ModeToolbar } from './ModeToolbar';
import { PanelFooter, pushRecent } from './PanelFooter';

const FALLBACK: Hsva = { h: 0, s: 0, v: 100, a: 1 };

export type PanelSize = 'default' | 'expanded';

export interface ChromaPanelProps {
  /**
   * Controlled colour. A CSS colour string, or the unrounded `hsva` object
   * from a change result — the object form round-trips without the precision
   * loss of serialising through hex.
   */
  value?: string | Hsva;
  /** Initial colour when uncontrolled. Default `#ffffff`. */
  defaultValue?: string | Hsva;
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
  /**
   * Recently committed colours, newest first.
   *
   * Optional: leave it out and the panel keeps the list itself, like `mode`
   * and `collapsed`. Pass it to take control — then `onRecentColorsChange` is
   * how you hear about changes, and the panel renders only what you pass back.
   */
  recentColors?: string[];
  /** Initial recents when `recentColors` is not supplied. */
  defaultRecentColors?: string[];
  onRecentColorsChange?: (colors: string[]) => void;
  /**
   * Colour groups for the palettes mode.
   * Defaults to `defaultPalettes()` so the mode is never empty out of the box.
   */
  palettes?: ColorPalette[];
  /**
   * Swatches for the pencils mode.
   * Defaults to `defaultPencils()` so the mode is never empty out of the box.
   */
  pencils?: string[];

  /** Props forwarded to each mode's Panel, keyed by mode id. */
  modeProps?: Record<string, Record<string, unknown>>;
  /** Typed shortcut for `modeProps.image` — worker, sample size, colour count. */
  imageOptions?: ExtractOptions;

  disabled?: boolean;
  theme?: 'dark' | 'light';
  /** Show the macOS-style title bar and its window controls. Default true. */
  showTitleBar?: boolean;
  title?: string;

  /**
   * Called when the close (red) control is used.
   *
   * Without it there is nothing for close to do — an inline panel is not in
   * anything — so the control renders disabled rather than disappearing,
   * keeping the row's geometry stable.
   *
   * Closing never reverts the colour. There is no cancel semantic here.
   */
  onClose?: () => void;

  /** Collapsed to just the title bar. The body stays mounted. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;

  /** `expanded` widens the panel and the colour disc. */
  size?: PanelSize;
  defaultSize?: PanelSize;
  onSizeChange?: (size: PanelSize) => void;

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
    recentColors, defaultRecentColors, onRecentColorsChange,
    palettes, pencils, modeProps, imageOptions,
    disabled = false, theme, showTitleBar = true, title = 'Colours',
    onClose,
    collapsed, defaultCollapsed = false, onCollapsedChange,
    size, defaultSize = 'default', onSizeChange,
    injectStyles: shouldInject = true,
    className, classNames = {}, style, store: externalStore,
  } = props;

  const rootRef = React.useRef<HTMLDivElement>(null);
  const idPrefix = useStableId('cp');

  // ---- store -------------------------------------------------------------
  const initial = React.useMemo<Hsva>(() => {
    const seed = value ?? defaultValue;
    const parsed = typeof seed === 'string' ? parse(seed) : seed;
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
    const parsed = typeof value === 'string' ? parse(value) : value;
    if (parsed === null || parsed === undefined) {
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
  // Recents follow the same controlled-or-uncontrolled shape as mode,
  // collapsed and size. They used to be controlled-ONLY, which meant
  // showRecentColors defaulted to true while the row stayed permanently empty
  // unless the consumer wired up two props — the row simply never worked out
  // of the box.
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
        // Commits fire on pointerup, not per frame, so this does not touch the
        // zero-render drag path.
        if (!controlled) setInternalRecents(next);
        notify?.(next);
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

  // ---- window controls -----------------------------------------------
  // Same controlled/uncontrolled shape as `mode` and `open`.
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

  // ---- context -----------------------------------------------------------
  const options = React.useMemo<PanelOptions>(
    () => ({
      // `palettes` and `pencils` stay undefined here rather than defaulting.
      // Each mode falls back to its own generated data instead, so the shell
      // and the other three modes never carry palette or pencil bytes.
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
        // Lets CSS drop the fixed panel height when there is only one mode:
        // nothing can jump when there is nothing to switch to, and reserving
        // room for the tallest mode would just waste space.
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
              {/* Close is disabled rather than removed when there is nothing
                  to close, so the row keeps its shape. */}
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
            {/* Balances the lights so the title stays optically centred. */}
            <div className="cp-titlebar-spacer" aria-hidden="true" />
          </div>
        )}

        {/* Kept mounted and hidden with CSS when collapsed. Unmounting would
            discard the very state collapsing is meant to preserve, and the
            transient store subscriptions keep every thumb in position so
            expanding is instant and correct. */}
        <div className="cp-body" id={bodyId}>
          {resolved.length > 1 && (
            <ModeToolbar modes={resolved} activeId={activeId} onSelect={selectMode} />
          )}

          {active !== undefined && (
            <div
              role="tabpanel"
              id={`${idPrefix}-panel-${active.id}`}
              aria-labelledby={`${idPrefix}-tab-${active.id}`}
              tabIndex={-1}
              // cp-panel-host is the element that carries the fixed height and
              // owns the scrolling, so it needs a class of its own. It is
              // ADDITIVE: the mode's inner .cp-panel and the consumer's
              // classNames.panel are both public API and are untouched.
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
