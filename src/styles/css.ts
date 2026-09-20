export const css: string = `
@layer chroma-panel {
  .cp-root,
  .cp-sheet-root,
  .cp-popover {
    color-scheme: light dark;

    --cp-surface: light-dark(#ffffff, #191919);
    --cp-surface-raised: light-dark(#f4f4f6, #222222);
    --cp-surface-sunken: light-dark(#eaeaee, #111111);
    --cp-surface-overlay: light-dark(#ffffff, #222222);

    --cp-border: light-dark(#d6d6da, #3a3a3a);
    --cp-border-subtle: light-dark(rgb(0 0 0 / 9%), rgb(255 255 255 / 10%));

    --cp-text: light-dark(#1c1c1e, #ededed);
    --cp-text-muted: light-dark(#6b6b70, #a0a0a6);

    --cp-accent: light-dark(#2d7ff9, #4d94ff);
    --cp-focus: light-dark(#2d7ff9, #5b9cff);

    --cp-radius-lg: 16px;
    --cp-radius: 10px;
    --cp-radius-sm: 7px;
    --cp-seg-pad: 3px;

    --cp-ring-bleed: 4px;
    --cp-thumb-size: 18px;
    --cp-track-height: 12px;
    --cp-control-height: 32px;
    --cp-input-height: calc(var(--cp-control-height) + 2 * var(--cp-seg-pad));
    --cp-gap: 12px;
    --cp-pad: 14px;
    --cp-width: 320px;
    --cp-disc-size: 196px;

    --cp-panel-h: 344px;

    --cp-h: 0;
    --cp-s: 0%;
    --cp-v: 0%;
    --cp-a: 1;
    --cp-hue-color: hsl(var(--cp-h) 100% 50%);

    --cp-checker-size: 12px;
    --cp-checker: repeating-conic-gradient(
      light-dark(#00000014, #ffffff14) 0% 25%, transparent 0% 50%);

    --cp-elevation: light-dark(
      0 0 0 1px rgb(0 0 0 / 6%),
      0 0 0 1px #3a3a3a
    ), light-dark(
      0 10px 30px -6px rgb(0 0 0 / 18%),
      0 10px 24px -6px rgb(0 0 0 / 60%)
    ), light-dark(
      0 2px 6px -2px rgb(0 0 0 / 10%),
      0 24px 48px -12px rgb(0 0 0 / 70%)
    );
  }

  .cp-root {
    box-sizing: border-box;
    width: var(--cp-width);
    max-width: 100%;
    padding: var(--cp-pad);
    display: flex;
    flex-direction: column;
    gap: var(--cp-gap);
    background: var(--cp-surface);
    color: var(--cp-text);
    border-radius: var(--cp-radius-lg);
    box-shadow: 0 0 0 1px var(--cp-border-subtle);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    font-size: 13px;
    line-height: 1.45;
    -webkit-font-smoothing: antialiased;
  }

  .cp-root[data-cp-theme="light"],
  .cp-sheet-root:has(.cp-root[data-cp-theme="light"]) { color-scheme: light; }
  .cp-root[data-cp-theme="dark"],
  .cp-sheet-root:has(.cp-root[data-cp-theme="dark"]) { color-scheme: dark; }

  .cp-root *,
  .cp-root *::before,
  .cp-root *::after { box-sizing: border-box; }

  .cp-root[data-cp-disabled="true"] { opacity: 0.5; pointer-events: none; }

  .cp-titlebar {
    display: flex; align-items: center; gap: 8px; min-height: 13px;
    --cp-light-size: 14px;
    --cp-light-gap: 10px;
  }

  .cp-lights {
    display: flex;
    gap: var(--cp-light-gap);
  }
  .cp-light {
    position: relative;
    display: inline-flex; align-items: center; justify-content: center;
    width: var(--cp-light-size); height: var(--cp-light-size);
    padding: 0; border: 0; border-radius: 50%;
    appearance: none; -webkit-appearance: none;
    cursor: pointer;
    color: rgb(0 0 0 / 62%);
  }
  .cp-light[data-cp-light="close"] { background: #ff5f57; }
  .cp-light[data-cp-light="min"] { background: #febc2e; }
  .cp-light[data-cp-light="max"] { background: #28c840; }
  .cp-light[disabled] { opacity: 0.42; cursor: default; }
  .cp-light:focus-visible { outline: 2px solid var(--cp-focus); outline-offset: 2px; }

  .cp-light-glyph {
    width: 8px; height: 8px; display: block;
    opacity: 0;
    transition: opacity 100ms ease;
  }
  .cp-titlebar:hover .cp-light:not([disabled]) .cp-light-glyph,
  .cp-light:focus-visible .cp-light-glyph { opacity: 1; }

  .cp-titlebar-spacer {
    flex: none;
    width: calc(3 * var(--cp-light-size) + 2 * var(--cp-light-gap));
  }
  .cp-title {
    flex: 1; text-align: center; font-size: 12px; font-weight: 600;
    color: var(--cp-text-muted);
  }

  .cp-body {
    display: flex; flex-direction: column; gap: var(--cp-gap); min-width: 0;
    flex: 1 1 auto; min-height: 0;
  }
  .cp-root[data-cp-collapsed="true"] .cp-body { display: none; }

  .cp-root[data-cp-size="expanded"] {
    --cp-width: 420px;
    --cp-disc-size: 260px;
    --cp-panel-h: 372px;
  }

  .cp-seg {
    position: relative;
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    isolation: isolate;
    padding: var(--cp-seg-pad);
    border-radius: var(--cp-radius);
    background: var(--cp-surface-sunken);
    box-shadow: inset 0 0 0 1px var(--cp-border-subtle);
  }

  .cp-seg::before {
    content: "";
    position: absolute;
    z-index: -1;
    top: var(--cp-seg-pad);
    bottom: var(--cp-seg-pad);
    left: var(--cp-seg-pad);
    width: calc((100% - 2 * var(--cp-seg-pad)) / var(--cp-seg-count, 1));
    translate: calc(var(--cp-seg-active, 0) * 100%) 0;
    border-radius: calc(var(--cp-radius) - var(--cp-seg-pad));
    background: var(--cp-surface-overlay);
    box-shadow: 0 1px 2px rgb(0 0 0 / 12%), 0 0 0 1px var(--cp-border-subtle);
    transition: translate 180ms cubic-bezier(0.445, 0.05, 0.55, 0.95);
  }

  .cp-seg-sm {
    --cp-radius: var(--cp-radius-sm);
    --cp-seg-pad: 2px;
  }

  .cp-tab {
    position: relative;
    display: inline-flex; align-items: center; justify-content: center;
    height: var(--cp-control-height);
    padding: 0 6px; border: 0; border-radius: calc(var(--cp-radius) - var(--cp-seg-pad));
    background: transparent; color: var(--cp-text-muted);
    cursor: pointer; font: inherit; font-size: 12px; font-weight: 500;
    transition: color 120ms ease;
  }
  .cp-tab:hover { color: var(--cp-text); }
  .cp-tab[aria-selected="true"] { color: var(--cp-text); }
  .cp-tab:focus-visible { outline: 2px solid var(--cp-focus); outline-offset: -2px; }
  .cp-tab[disabled] { cursor: default; }
  .cp-seg-sm .cp-tab {
    height: calc(var(--cp-control-height) - 8px);
    font-size: 11px; letter-spacing: 0.02em;
  }
  .cp-tab svg { width: 17px; height: 17px; display: block; }

  .cp-panel-host {
    display: flex; flex-direction: column;
    flex: 1 1 var(--cp-panel-h);
    min-height: 0;
    overflow-y: auto; overscroll-behavior: contain;

    --cp-bleed: calc(var(--cp-thumb-size) / 2 + 2px);
    padding-inline: var(--cp-bleed);
    margin-inline: calc(var(--cp-bleed) * -1);

    scrollbar-gutter: stable;
    scrollbar-width: thin;
    scrollbar-color: var(--cp-border) transparent;
  }

  .cp-panel-host[data-cp-fade] {
    --cp-fade-t: 0px;
    --cp-fade-b: 0px;
    mask-image: linear-gradient(to bottom,
      transparent 0, #000 var(--cp-fade-t),
      #000 calc(100% - var(--cp-fade-b)), transparent 100%);
  }
  .cp-panel-host[data-cp-fade="start"],
  .cp-panel-host[data-cp-fade="both"] { --cp-fade-t: 18px; }
  .cp-panel-host[data-cp-fade="end"],
  .cp-panel-host[data-cp-fade="both"] { --cp-fade-b: 18px; }
  .cp-panel-host::-webkit-scrollbar { width: 8px; }
  .cp-panel-host::-webkit-scrollbar-track { background: transparent; }
  .cp-panel-host::-webkit-scrollbar-thumb {
    background: var(--cp-border); border-radius: 4px;
    border: 2px solid transparent; background-clip: content-box;
  }
  .cp-root[data-cp-modes="1"] .cp-panel-host { flex-basis: auto; }

  .cp-panel {
    display: flex; flex-direction: column; gap: var(--cp-gap);
    flex: 1 1 auto; min-height: 0;
  }

  .cp-disc-wrap { display: flex; justify-content: center; padding: 2px 0; }
  .cp-disc {
    position: relative;
    width: min(100%, var(--cp-disc-size));
    aspect-ratio: 1;
    border-radius: 50%; cursor: crosshair; outline: none;
    background:
      radial-gradient(circle closest-side, #fff, rgb(255 255 255 / 0)),
      conic-gradient(
        #f00 0%, #ff0 16.6667%, #0f0 33.3333%, #0ff 50%,
        #00f 66.6667%, #f0f 83.3333%, #f00 100%
      );
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 14%);
  }
  @supports (background: conic-gradient(in hsl longer hue, red, red)) {
    .cp-disc {
      background:
        radial-gradient(circle closest-side, #fff, rgb(255 255 255 / 0)),
        conic-gradient(in hsl longer hue, red, red);
    }
  }
  .cp-disc::after {
    content: ""; position: absolute; inset: 0; border-radius: 50%;
    background: #000; opacity: calc(1 - var(--cp-v) / 100%); pointer-events: none;
  }
  .cp-disc:has(:focus-visible) { outline: 2px solid var(--cp-focus); outline-offset: 3px; }

  .cp-area {
    position: relative; width: 100%; height: 150px;
    border-radius: var(--cp-radius); cursor: crosshair; outline: none;
    background-color: var(--cp-hue-color);
    background-image:
      linear-gradient(to top, #000, rgb(0 0 0 / 0)),
      linear-gradient(to right, #fff, rgb(255 255 255 / 0));
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 14%);
  }
  .cp-area:has(:focus-visible) { outline: 2px solid var(--cp-focus); outline-offset: 3px; }

  .cp-thumb {
    position: absolute;
    left: var(--cp-thumb-x, 50%);
    top: var(--cp-thumb-y, 50%);
    width: var(--cp-thumb-size); height: var(--cp-thumb-size);
    margin: calc(var(--cp-thumb-size) / -2) 0 0 calc(var(--cp-thumb-size) / -2);
    border-radius: 50%;
    background: transparent;
    box-shadow:
      inset 0 0 0 2px #fff,
      inset 0 0 0 3px rgb(0 0 0 / 16%),
      0 1px 3px rgb(0 0 0 / 30%),
      0 0 0 1px rgb(0 0 0 / 12%);
    pointer-events: none;
  }

  .cp-slider-row { display: flex; align-items: center; gap: 10px; }
  .cp-slider-label {
    width: 14px; flex: none; text-align: center;
    color: var(--cp-text-muted); font-size: 11px; font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  .cp-slider {
    position: relative; flex: 1; height: var(--cp-track-height);
    border-radius: calc(var(--cp-track-height) / 2);
    cursor: pointer; outline: none;
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 12%);
  }
  .cp-slider:has(:focus-visible) { outline: 2px solid var(--cp-focus); outline-offset: 3px; }
  .cp-slider-fill { position: absolute; inset: 0; border-radius: inherit; pointer-events: none; }
  .cp-slider[data-cp-channel="hue"] .cp-slider-fill {
    background: linear-gradient(to right,
      #f00 0%, #ff0 16.6667%, #0f0 33.3333%, #0ff 50%,
      #00f 66.6667%, #f0f 83.3333%, #f00 100%);
  }
  @supports (background: linear-gradient(in hsl longer hue, red, red)) {
    .cp-slider[data-cp-channel="hue"] .cp-slider-fill {
      background: linear-gradient(in hsl longer hue to right, red, red);
    }
  }
  .cp-slider .cp-thumb { top: 50%; }

  .cp-swatch,
  .cp-preview,
  .cp-trigger,
  .cp-slider[data-cp-channel="alpha"] {
    background-image: var(--cp-checker);
    background-size: var(--cp-checker-size) var(--cp-checker-size);
  }

  .cp-fields { display: flex; gap: 8px; align-items: flex-end; }
  .cp-field { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
  /* .cp-field normally shares a row with sibling fields. Palette search is a
     direct child of a vertical panel, so it must not consume the panel's spare
     height and push a short result list to the bottom. */
  .cp-palette-search { flex: none; }
  .cp-field-label {
    color: var(--cp-text-muted); font-size: 11px; font-weight: 500;
  }
  .cp-input {
    width: 100%; min-width: 0; height: var(--cp-input-height); padding: 0 8px;
    background: var(--cp-surface-sunken); color: var(--cp-text);
    border: 1px solid var(--cp-border-subtle); border-radius: var(--cp-radius-sm);
    font: inherit; font-size: 12px; font-variant-numeric: tabular-nums;
  }
  .cp-input:focus-visible {
    outline: 2px solid var(--cp-focus); outline-offset: -1px; border-color: transparent;
  }
  .cp-input[aria-invalid="true"] { border-color: #e5484d; }
  .cp-input::-webkit-outer-spin-button,
  .cp-input::-webkit-inner-spin-button { appearance: none; margin: 0; }
  .cp-input[type="number"] { appearance: textfield; -moz-appearance: textfield; }
  .cp-input[type="file"] { height: auto; padding: 6px 8px; font-size: 11px; }

  .cp-swatch {
    position: relative; width: 100%; aspect-ratio: 1; padding: 0;
    display: block;
    border: 0; border-radius: var(--cp-radius-sm);
    cursor: pointer; background-color: transparent;
    outline: 1px solid light-dark(rgb(0 0 0 / 14%), rgb(255 255 255 / 16%));
    outline-offset: -1px;
  }
  .cp-swatch::after {
    content: ""; position: absolute; inset: 0; border-radius: inherit;
    background: var(--cp-swatch-color, transparent);
    box-shadow: inset 0 0 0 1px light-dark(rgb(255 255 255 / 22%), rgb(0 0 0 / 22%));
  }
  .cp-swatch:focus-visible { outline: 2px solid var(--cp-focus); outline-offset: 2px; }
  .cp-swatch[aria-pressed="true"] {
    outline: 2px solid var(--cp-accent);
    outline-offset: 2px;
  }
  .cp-swatch-round, .cp-swatch-round::after { border-radius: 50%; }

  .cp-swatch-grid {
    display: grid;
    grid-template-columns: repeat(var(--cp-columns, 10), minmax(0, 1fr));
    gap: 8px; margin: 0; padding: 0; list-style: none;
  }
  .cp-swatch-grid:not([data-cp-variant="mosaic"]) { padding-block: var(--cp-ring-bleed); }
  .cp-swatch-grid > li { display: block; min-width: 0; }
  .cp-swatch-grid[data-cp-large="true"] > li {
    content-visibility: auto;
    contain-intrinsic-size: auto 28px;
  }

  .cp-mosaic {
    padding: 2px;
    border-radius: var(--cp-radius);
    background: var(--cp-surface-sunken);
    box-shadow: inset 0 0 0 1px var(--cp-border-subtle);
  }
  .cp-swatch-grid[data-cp-variant="mosaic"] { gap: 0; }
  .cp-swatch-grid[data-cp-variant="mosaic"] .cp-swatch {
    border-radius: 0; outline: none; background-image: none;
  }
  .cp-swatch-grid[data-cp-variant="mosaic"] .cp-swatch::after { box-shadow: none; }
  .cp-swatch-grid[data-cp-variant="mosaic"] .cp-swatch:focus-visible {
    outline: 2px solid var(--cp-focus); outline-offset: -2px; z-index: 2;
  }
  .cp-swatch-grid[data-cp-variant="mosaic"] .cp-swatch[aria-pressed="true"] {
    outline: 3px solid var(--cp-surface);
    outline-offset: -1.5px;
    z-index: 1;
  }

  .cp-group { margin: 0 0 12px; }
  .cp-group:last-child { margin-bottom: 0; }
  .cp-group-title {
    margin: 0 0 7px; font-size: 11px; font-weight: 600; color: var(--cp-text-muted);
  }

  .cp-scroll { min-height: 0; }

  .cp-footer {
    display: flex; align-items: center; gap: 10px;
    padding-top: var(--cp-gap);
    border-top: 1px solid var(--cp-border-subtle);
  }
  .cp-footer-spacer { flex: 1; }
  .cp-preview {
    position: relative;
    width: var(--cp-control-height); height: var(--cp-control-height);
    flex: none;
    border-radius: 50%;
    outline: 1px solid var(--cp-border-subtle); outline-offset: -1px;
  }
  .cp-preview::after {
    content: ""; position: absolute; inset: 0; border-radius: inherit;
    background: var(--cp-preview-color, transparent);
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 12%);
  }
  .cp-current-color {
    max-width: 76px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    color: var(--cp-text-muted); font: 500 10px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .cp-recents {
    display: flex; gap: 6px; flex: 1; min-width: 0;
    margin: 0; padding: 0; list-style: none;
    overflow-x: auto; overflow-y: hidden;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
  }
  .cp-recents::-webkit-scrollbar { display: none; }
  .cp-recents[data-cp-fade] {
    --cp-fade-s: 0px;
    --cp-fade-e: 0px;
    mask-image: linear-gradient(to right,
      transparent 0, #000 var(--cp-fade-s),
      #000 calc(100% - var(--cp-fade-e)), transparent 100%);
  }
  .cp-recents[data-cp-fade="start"],
  .cp-recents[data-cp-fade="both"] { --cp-fade-s: 14px; }
  .cp-recents[data-cp-fade="end"],
  .cp-recents[data-cp-fade="both"] { --cp-fade-e: 14px; }
  .cp-recents > li { flex: none; }
  .cp-recents .cp-swatch { width: 22px; height: 22px; }

  .cp-icon-button {
    display: inline-flex; align-items: center; justify-content: center;
    width: var(--cp-control-height); height: var(--cp-control-height);
    flex: none; padding: 0;
    background: var(--cp-surface-raised); color: var(--cp-text);
    border: 1px solid var(--cp-border-subtle); border-radius: var(--cp-radius-sm);
    cursor: pointer;
    transition: background-color 120ms ease;
  }
  .cp-icon-button:hover { background: var(--cp-border-subtle); }
  .cp-icon-button:focus-visible { outline: 2px solid var(--cp-focus); outline-offset: 1px; }
  .cp-icon-button svg { width: 16px; height: 16px; display: block; }
  .cp-icon-button[disabled] { opacity: 0.4; cursor: default; }
  .cp-icon-button[data-cp-copy-status="copied"] {
    color: light-dark(#177245, #72d5a3);
    border-color: currentColor;
  }

  .cp-trigger {
    position: relative; width: 36px; height: 26px; padding: 0;
    border: 0; border-radius: var(--cp-radius-sm); cursor: pointer;
    background-color: transparent;
    outline: 1px solid light-dark(rgb(0 0 0 / 18%), rgb(255 255 255 / 20%));
    outline-offset: -1px;
  }
  .cp-trigger::after {
    content: ""; position: absolute; inset: 0; border-radius: inherit;
    background: var(--cp-trigger-color, transparent);
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 12%);
  }
  .cp-trigger:focus-visible { outline: 2px solid var(--cp-focus); outline-offset: 2px; }
  .cp-trigger[disabled] { opacity: 0.5; cursor: default; }

  .cp-popover {
    position: absolute; z-index: 2147483000; margin: 0; padding: 0; border: 0;
  }
  .cp-popover .cp-root {
    box-shadow: var(--cp-elevation);
    max-height: var(--cp-available-h, none);
  }

  .cp-sheet-root {
    position: fixed; inset: 0; z-index: 2147483000;
    display: flex; flex-direction: column; justify-content: flex-end;
  }
  .cp-scrim { position: absolute; inset: 0; background: rgb(0 0 0 / 45%); }
  .cp-sheet {
    position: relative; width: 100%;
    max-height: 88svh;
    display: flex; flex-direction: column;
    overflow: hidden;
    background: var(--cp-surface);
    border-radius: var(--cp-radius-lg) var(--cp-radius-lg) 0 0;
    box-shadow: 0 -8px 32px rgb(0 0 0 / 35%);
    padding-bottom: max(8px, env(safe-area-inset-bottom));
  }
  .cp-grabber {
    width: 36px; height: 5px; flex: none; margin: 8px auto 0;
    padding: 0; border: 0; border-radius: 3px;
    appearance: none; -webkit-appearance: none;
    background: var(--cp-border);
    cursor: pointer;
  }
  .cp-grabber:focus-visible { outline: 2px solid var(--cp-focus); outline-offset: 4px; }
  .cp-grabber::after {
    content: ""; position: absolute; left: 50%; translate: -50% 0;
    margin-top: -14px; width: 88px; height: 32px;
  }
  .cp-sheet { position: relative; }
  .cp-dialog { display: flex; flex-direction: column; min-height: 0; min-width: 0; }
  .cp-sheet > *, .cp-sheet .cp-dialog { min-height: 0; }
  .cp-sheet > .cp-dialog { flex: 1 1 auto; }

  .cp-sheet .cp-root {
    width: 100%; max-width: none;
    border-radius: 0; box-shadow: none; background: transparent;
    flex: 1 1 auto; min-height: 0;
  }
  .cp-sheet .cp-lights { display: none; }
  .cp-sheet .cp-titlebar { justify-content: center; }

  .cp-visually-hidden {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%);
    white-space: nowrap; border: 0;
  }

  .cp-empty {
    margin: 0;
    color: var(--cp-text-muted); padding: 20px 12px; text-align: center; font-size: 12px;
    flex: 1 1 auto; min-height: 0;
    display: flex; align-items: center; justify-content: center;
  }

  .cp-dropzone {
    flex: 1 1 auto; min-height: 92px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 8px;
    padding: 16px; text-align: center; cursor: pointer;
    color: var(--cp-text-muted); font-size: 12px; line-height: 1.4;
    border: 1px dashed var(--cp-border);
    border-radius: var(--cp-radius);
    background: transparent;
    transition: border-color 120ms ease, background-color 120ms ease;
  }
  .cp-dropzone svg { width: 26px; height: 26px; opacity: 0.65; }
  .cp-dropzone-title { color: var(--cp-text); font-weight: 550; font-size: 12px; }
  .cp-dropzone-hint { font-size: 11px; opacity: 0.8; }

  .cp-dropzone:hover { border-color: var(--cp-text-muted); color: var(--cp-text); }
  .cp-dropzone:has(:focus-visible) {
    outline: 2px solid var(--cp-focus); outline-offset: 2px;
  }
  .cp-dropzone[data-cp-dragging="true"] {
    border-color: var(--cp-accent); border-style: solid;
    background: color-mix(in srgb, var(--cp-accent) 10%, transparent);
    color: var(--cp-text);
  }
  .cp-root[data-cp-disabled="true"] .cp-dropzone { cursor: default; }

  .cp-image-preview {
    position: relative;
    flex: 1 1 auto; min-height: 72px;
    display: flex;
    border-radius: var(--cp-radius);
    overflow: hidden;
    background: var(--cp-surface-sunken);
    box-shadow: inset 0 0 0 1px var(--cp-border-subtle);
  }
  .cp-image-preview img {
    width: 100%; height: auto; max-height: 100%; margin: auto; display: block;
    object-fit: contain; cursor: crosshair;
  }
  .cp-image-preview img:focus-visible { outline: 2px solid var(--cp-focus); outline-offset: -3px; }
  .cp-image-loupe {
    position: absolute; z-index: 2; pointer-events: none;
    width: 42px; height: 42px; translate: -50% -50%;
    border: 2px solid #fff; border-radius: 50%;
    background-repeat: no-repeat; background-size: 400% 400%;
    box-shadow: 0 1px 5px rgb(0 0 0 / 55%), inset 0 0 0 1px rgb(0 0 0 / 35%);
  }
  .cp-image-loupe::after {
    content: ""; position: absolute; inset: 50% auto auto 50%;
    width: 4px; height: 4px; translate: -50% -50%;
    border: 1px solid #fff; box-shadow: 0 0 0 1px #000;
  }
  .cp-image-hint {
    margin: -3px 0 0; color: var(--cp-text-muted); font-size: 10px; text-align: center;
  }
  .cp-image-remove {
    position: absolute; top: 6px; right: 6px;
    width: 24px; height: 24px; padding: 0;
    display: inline-flex; align-items: center; justify-content: center;
    border: 0; border-radius: 50%;
    appearance: none; -webkit-appearance: none;
    cursor: pointer;
    background: rgb(0 0 0 / 62%);
    color: #fff;
  }
  .cp-image-remove:hover { background: rgb(0 0 0 / 78%); }
  .cp-image-remove:focus-visible { outline: 2px solid var(--cp-focus); outline-offset: 2px; }
  .cp-image-remove svg { width: 13px; height: 13px; display: block; }
}

body:has(.cp-sheet-root[data-cp-open="true"]) { overflow: hidden; }

@layer chroma-panel {

  @media (pointer: coarse) {
    .cp-root {
      --cp-control-height: 36px; --cp-thumb-size: 22px;
      --cp-panel-h: 350px;
    }
    .cp-tab::after,
    .cp-icon-button::after,
    .cp-trigger::before {
      content: ""; position: absolute;
      top: 50%; left: 50%; translate: -50% -50%;
      width: max(100%, 44px); height: max(100%, 44px);
    }
    .cp-icon-button, .cp-trigger { position: relative; }
    .cp-recents .cp-swatch { width: 28px; height: 28px; }
    .cp-titlebar { --cp-light-size: 20px; --cp-light-gap: 10px; }
    .cp-light-glyph { width: 11px; height: 11px; }
  }

  @media (max-width: 640px) {
    .cp-root {
      --cp-width: 100%;
      --cp-disc-size: 240px;
      --cp-pad: 16px;
    }
  }

  @media (forced-colors: active) {
    .cp-swatch, .cp-preview, .cp-trigger, .cp-disc, .cp-area, .cp-slider-fill {
      forced-color-adjust: none;
    }
    .cp-swatch { border: 1px solid CanvasText; }
    .cp-swatch[aria-pressed="true"] { outline: 3px solid Highlight; outline-offset: 1px; }
    .cp-seg::before { border: 1px solid CanvasText; }
    .cp-tab[aria-selected="true"] { border: 1px solid Highlight; }
    .cp-root { border: 1px solid CanvasText; }
  }

  @media (prefers-reduced-motion: reduce) {
    .cp-root *, .cp-root *::before, .cp-root *::after,
    .cp-seg::before {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
    }
  }
}
`;

export const STYLE_ID: string = 'v2';
