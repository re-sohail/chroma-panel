// The stylesheet is split so a bundle carries only the rules for what it
// renders. `css` is the panel shell every picker needs; each other chunk is
// injected by the component that uses it. scripts/emit-css.mjs joins every
// chunk, in this order, into dist/style.css.

/** Panel shell, header, tabs, fields, swatches and history. Injected by ChromaPanel and ColorInput. */
export const css: string = `
@layer chroma-panel {
  .cp-root,
  .cp-sheet-root,
  .cp-popover {
    color-scheme: light dark;

    --cp-surface: light-dark(#ffffff, #16161d);
    --cp-surface-raised: light-dark(#f4f4f7, #1f1f28);
    --cp-surface-sunken: light-dark(#ebebf0, #0e0e13);
    --cp-surface-overlay: light-dark(#ffffff, #2c2c38);
    --cp-field: light-dark(#ffffff, #1f1f28);
    --cp-field-border: light-dark(rgb(0 0 0 / 11%), rgb(255 255 255 / 9%));
    --cp-border: light-dark(#d4d4dc, #34343f);
    --cp-border-subtle: light-dark(rgb(0 0 0 / 8%), rgb(255 255 255 / 8%));
    --cp-text: light-dark(#16161d, #f2f2f5);
    --cp-text-muted: light-dark(#62626d, #9a9aa6);
    --cp-accent: light-dark(#1f6fef, #3d8bff);
    --cp-focus: light-dark(#1f6fef, #5b9cff);
    --cp-success: light-dark(#177245, #72d5a3);
    --cp-swatch-ring: light-dark(rgb(0 0 0 / 12%), rgb(255 255 255 / 14%));
    --cp-checker-ink: light-dark(rgb(0 0 0 / 8%), rgb(255 255 255 / 8%));
    --cp-shadow: light-dark(rgb(16 16 30 / 16%), rgb(0 0 0 / 55%));

    --cp-radius-lg: 20px;
    --cp-radius: 10px;
    --cp-radius-sm: 6px;
    --cp-seg-pad: 3px;

    --cp-ring-bleed: 4px;
    --cp-thumb-size: 18px;
    --cp-track-height: 10px;
    --cp-control-height: 32px;
    --cp-input-height: var(--cp-control-height);
    --cp-gap: 12px;
    --cp-pad: 14px;
    --cp-width: 320px;
    --cp-disc-size: 232px;

    --cp-panel-h: 384px;

    --cp-h: 0;
    --cp-s: 0%;
    --cp-v: 0%;
    --cp-a: 1;
    --cp-hue-color: hsl(var(--cp-h) 100% 50%);

    --cp-checker-size: 10px;
    --cp-checker: repeating-conic-gradient(var(--cp-checker-ink) 0% 25%, transparent 0% 50%);

    --cp-elevation:
      0 0 0 1px var(--cp-border-subtle),
      0 18px 40px -12px var(--cp-shadow),
      0 4px 12px -4px var(--cp-shadow);
  }

  :where(.dark, [data-theme="dark"], [style*="color-scheme: dark"], [style*="color-scheme:dark"])
    :is(.cp-root, .cp-sheet-root, .cp-popover) { color-scheme: dark; }
  :where(.light, [data-theme="light"], [style*="color-scheme: light"], [style*="color-scheme:light"])
    :is(.cp-root, .cp-sheet-root, .cp-popover) { color-scheme: light; }

  .cp-root[data-cp-theme="light"],
  .cp-sheet-root:has(.cp-root[data-cp-theme="light"]) { color-scheme: light; }
  .cp-root[data-cp-theme="dark"],
  .cp-sheet-root:has(.cp-root[data-cp-theme="dark"]) { color-scheme: dark; }

  @supports not (color: light-dark(#000, #fff)) {
    .cp-root, .cp-sheet-root, .cp-popover {
      --cp-surface: #ffffff; --cp-surface-raised: #f4f4f7; --cp-surface-sunken: #ebebf0;
      --cp-surface-overlay: #ffffff; --cp-field: #ffffff; --cp-field-border: rgb(0 0 0 / 11%); --cp-border: #d4d4dc; --cp-border-subtle: rgb(0 0 0 / 8%);
      --cp-text: #16161d; --cp-text-muted: #62626d; --cp-accent: #1f6fef; --cp-focus: #1f6fef;
      --cp-success: #177245; --cp-swatch-ring: rgb(0 0 0 / 12%);
      --cp-checker-ink: rgb(0 0 0 / 8%); --cp-shadow: rgb(16 16 30 / 16%);
    }
    @media (prefers-color-scheme: dark) {
      .cp-root, .cp-sheet-root, .cp-popover {
        --cp-surface: #16161d; --cp-surface-raised: #1f1f28; --cp-surface-sunken: #0e0e13;
        --cp-surface-overlay: #2c2c38; --cp-field: #1f1f28; --cp-field-border: rgb(255 255 255 / 9%); --cp-border: #34343f; --cp-border-subtle: rgb(255 255 255 / 8%);
        --cp-text: #f2f2f5; --cp-text-muted: #9a9aa6; --cp-accent: #3d8bff; --cp-focus: #5b9cff;
        --cp-success: #72d5a3; --cp-swatch-ring: rgb(255 255 255 / 14%);
        --cp-checker-ink: rgb(255 255 255 / 8%); --cp-shadow: rgb(0 0 0 / 55%);
      }
    }
    :where(.dark, [data-theme="dark"], [style*="color-scheme: dark"], [style*="color-scheme:dark"])
      :is(.cp-root, .cp-sheet-root, .cp-popover),
    .cp-root[data-cp-theme="dark"],
    .cp-sheet-root:has(.cp-root[data-cp-theme="dark"]) {
      --cp-surface: #16161d; --cp-surface-raised: #1f1f28; --cp-surface-sunken: #0e0e13;
      --cp-surface-overlay: #2c2c38; --cp-field: #1f1f28; --cp-field-border: rgb(255 255 255 / 9%); --cp-border: #34343f; --cp-border-subtle: rgb(255 255 255 / 8%);
      --cp-text: #f2f2f5; --cp-text-muted: #9a9aa6; --cp-accent: #3d8bff; --cp-focus: #5b9cff;
      --cp-success: #72d5a3; --cp-swatch-ring: rgb(255 255 255 / 14%);
      --cp-checker-ink: rgb(255 255 255 / 8%); --cp-shadow: rgb(0 0 0 / 55%);
    }
    :where(.light, [data-theme="light"], [style*="color-scheme: light"], [style*="color-scheme:light"])
      :is(.cp-root, .cp-sheet-root, .cp-popover),
    .cp-root[data-cp-theme="light"],
    .cp-sheet-root:has(.cp-root[data-cp-theme="light"]) {
      --cp-surface: #ffffff; --cp-surface-raised: #f4f4f7; --cp-surface-sunken: #ebebf0;
      --cp-surface-overlay: #ffffff; --cp-field: #ffffff; --cp-field-border: rgb(0 0 0 / 11%); --cp-border: #d4d4dc; --cp-border-subtle: rgb(0 0 0 / 8%);
      --cp-text: #16161d; --cp-text-muted: #62626d; --cp-accent: #1f6fef; --cp-focus: #1f6fef;
      --cp-success: #177245; --cp-swatch-ring: rgb(0 0 0 / 12%);
      --cp-checker-ink: rgb(0 0 0 / 8%); --cp-shadow: rgb(16 16 30 / 16%);
    }
  }

  .cp-root {
    box-sizing: border-box;
    width: var(--cp-width);
    max-width: 100%;
    padding: var(--cp-pad);
    display: flex;
    flex-direction: column;
    gap: var(--cp-gap);
    container: cp / inline-size;
    background: var(--cp-surface);
    color: var(--cp-text);
    border-radius: var(--cp-radius-lg);
    box-shadow: 0 0 0 1px var(--cp-border-subtle);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    font-size: 13px;
    line-height: 1.45;
    -webkit-font-smoothing: antialiased;
    -webkit-tap-highlight-color: transparent;
    accent-color: var(--cp-accent);
  }

  .cp-root *,
  .cp-root *::before,
  .cp-root *::after { box-sizing: border-box; }
  .cp-root ::selection { background: color-mix(in srgb, var(--cp-accent) 30%, transparent); }

  .cp-root[data-cp-disabled="true"] { opacity: 0.5; pointer-events: none; }

  .cp-titlebar {
    display: flex; align-items: center; gap: 6px;
    min-height: var(--cp-control-height);
  }
  .cp-title {
    flex: 1; min-width: 0;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    font-size: 17px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.2;
    color: var(--cp-text);
  }
  .cp-titlebar-spacer { flex: 1; }
  .cp-current-color {
    flex: none; max-width: 92px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    color: var(--cp-text-muted);
    font: 500 11px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
    font-variant-numeric: tabular-nums;
  }

  .cp-chips {
    display: flex; flex: none;
    width: 54px; height: 24px; margin-inline: 2px 4px; gap: 2px;
  }
  .cp-chip {
    position: relative; flex: 1; min-width: 0; overflow: hidden;
    border-radius: var(--cp-radius-sm) 3px 3px var(--cp-radius-sm);
    box-shadow: inset 0 0 0 1px var(--cp-swatch-ring);
    padding: 0; border: 0; appearance: none; -webkit-appearance: none;
    background-color: transparent;
    background-image: var(--cp-checker);
    background-size: var(--cp-checker-size) var(--cp-checker-size);
  }
  .cp-chip::after {
    content: ""; position: absolute; inset: 0; border-radius: inherit;
    background: var(--cp-chip-color, transparent);
    box-shadow: inset 0 0 0 1px var(--cp-swatch-ring);
  }
  .cp-chip-current { border-radius: 3px var(--cp-radius-sm) var(--cp-radius-sm) 3px; }
  .cp-chip-current::after { background: var(--cp-preview-color, transparent); }
  button.cp-chip { cursor: pointer; }
  button.cp-chip:focus-visible { outline: 2px solid var(--cp-focus); outline-offset: -2px; z-index: 1; }

  .cp-body {
    display: flex; flex-direction: column; gap: var(--cp-gap); min-width: 0;
    flex: 1 1 auto; min-height: 0;
  }
  .cp-root[data-cp-collapsed="true"] .cp-body { display: none; }

  .cp-root[data-cp-size="expanded"] {
    --cp-width: 420px;
    --cp-disc-size: 300px;
    --cp-panel-h: 400px;
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
    box-shadow: 0 1px 2px rgb(0 0 0 / 14%), 0 0 0 1px var(--cp-border-subtle);
    transition: translate 220ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .cp-seg-sm {
    --cp-radius: 9px;
    --cp-seg-pad: 2px;
  }

  .cp-tab {
    position: relative;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    min-width: 0;
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
    height: calc(var(--cp-control-height) - 4px);
    font-size: 12px;
  }
  .cp-tab svg { width: 17px; height: 17px; display: block; flex: none; }
  .cp-tab-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .cp-toolbar.cp-seg {
    margin: 0 calc(var(--cp-pad) * -1) calc(var(--cp-pad) * -1);
    padding: 4px calc(var(--cp-pad) - 8px) 6px;
    border-radius: 0 0 var(--cp-radius-lg) var(--cp-radius-lg);
    background: transparent;
    box-shadow: inset 0 1px 0 var(--cp-border-subtle);
  }
  .cp-toolbar.cp-seg::before { content: none; }
  .cp-toolbar .cp-tab {
    flex-direction: column; gap: 3px;
    height: auto; min-height: 46px; padding: 5px 2px 4px;
    border-radius: var(--cp-radius);
    font-size: 10px; font-weight: 500; letter-spacing: 0.01em; line-height: 1.1;
  }
  .cp-toolbar .cp-tab svg { width: 20px; height: 20px; transition: color 120ms ease; }
  .cp-toolbar .cp-tab[aria-selected="true"] svg { color: var(--cp-accent); }
  .cp-toolbar .cp-tab:hover { background: var(--cp-border-subtle); }

  .cp-panel-host {
    display: flex; flex-direction: column;
    flex: 0 1 auto;
    min-height: 0; max-height: var(--cp-panel-h);
    overflow-y: auto; overscroll-behavior: contain;

    --cp-bleed: calc(var(--cp-thumb-size) / 2 + 4px);
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
  .cp-panel-host[data-cp-fade="both"] { --cp-fade-t: 28px; }
  .cp-panel-host[data-cp-fade="end"],
  .cp-panel-host[data-cp-fade="both"] { --cp-fade-b: 28px; }
  .cp-panel-host::-webkit-scrollbar { width: 8px; }
  .cp-panel-host::-webkit-scrollbar-track { background: transparent; }
  .cp-panel-host::-webkit-scrollbar-thumb {
    background: var(--cp-border); border-radius: 4px;
    border: 2px solid transparent; background-clip: content-box;
  }

  .cp-panel {
    display: flex; flex-direction: column; gap: var(--cp-gap);
    flex: 1 1 auto; min-height: 0;
  }

  .cp-thumb {
    position: absolute;
    left: var(--cp-thumb-x, 50%);
    top: var(--cp-thumb-y, 50%);
    width: var(--cp-thumb-size); height: var(--cp-thumb-size);
    margin: calc(var(--cp-thumb-size) / -2) 0 0 calc(var(--cp-thumb-size) / -2);
    border: 3px solid #fff;
    border-radius: 50%;
    background: var(--cp-preview-color, transparent);
    box-shadow: 0 1px 4px rgb(0 0 0 / 35%), 0 0 0 1px rgb(0 0 0 / 12%);
    pointer-events: none;
  }

  .cp-swatch,
  .cp-chip {
    background-image: var(--cp-checker);
    background-size: var(--cp-checker-size) var(--cp-checker-size);
  }

  .cp-fields { display: flex; gap: 8px; align-items: flex-end; }
  .cp-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
  /* .cp-field normally shares a row with sibling fields. Palette search is a
     direct child of a vertical panel, so it must not consume the panel's spare
     height and push a short result list to the bottom. */
  .cp-palette-search { flex: none; }
  .cp-field-label {
    color: var(--cp-text-muted); font-size: 12px; font-weight: 500;
  }
  .cp-field-inline {
    flex: none;
    flex-direction: row; align-items: center; justify-content: space-between; gap: 12px;
  }
  .cp-input {
    width: 100%; min-width: 0; height: var(--cp-input-height); padding: 0 10px;
    background: var(--cp-field); color: var(--cp-text);
    border: 1px solid var(--cp-field-border); border-radius: var(--cp-radius);
    font: inherit; font-size: 13px; font-variant-numeric: tabular-nums;
    caret-color: var(--cp-accent);
    transition: border-color 120ms ease, background-color 120ms ease;
  }
  .cp-input::placeholder { color: var(--cp-text-muted); opacity: 1; }
  .cp-input:hover { border-color: var(--cp-border); }

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
    outline: 1px solid var(--cp-swatch-ring);
    outline-offset: -1px;
    transition: transform 120ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .cp-swatch::after {
    content: ""; position: absolute; inset: 0; border-radius: inherit;
    background: var(--cp-swatch-color, transparent);
    box-shadow: inset 0 0 0 1px var(--cp-swatch-ring);
  }
  @media (hover: hover) {
    .cp-swatch:not([disabled]):hover { transform: scale(1.06); }
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
    border-radius: 0; outline: none; background-image: none; transform: none;
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

  .cp-group { margin: 0 0 14px; }
  .cp-group:last-child { margin-bottom: 0; }
  .cp-group-title {
    margin: 0 0 6px; font-size: 12px; font-weight: 600; color: var(--cp-text-muted);
  }

  .cp-scroll { min-height: 0; }

  .cp-footer { display: flex; flex-direction: column; gap: 8px; }
  .cp-footer-head {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    min-height: 20px;
  }
  .cp-footer-title { margin: 0; font-size: 12px; font-weight: 600; color: var(--cp-text); }
  .cp-text-button {
    position: relative;
    min-height: 24px; padding: 3px 8px; margin-right: -8px; border: 0; border-radius: var(--cp-radius-sm);
    appearance: none; -webkit-appearance: none;
    background: transparent; color: var(--cp-text-muted);
    font: inherit; font-size: 12px; font-weight: 500; cursor: pointer;
    transition: color 120ms ease;
  }
  .cp-text-button:hover { color: var(--cp-text); }
  .cp-text-button:focus-visible { outline: 2px solid var(--cp-focus); outline-offset: 0; }
  .cp-text-button[disabled] { opacity: 0.4; cursor: default; color: var(--cp-text-muted); }

  .cp-recents {
    display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 5px;
    margin: 0; padding: 0; list-style: none;
  }
  .cp-recents > li { display: block; min-width: 0; }
  .cp-recents .cp-swatch { aspect-ratio: auto; height: 28px; }

  .cp-icon-button {
    position: relative;
    display: inline-flex; align-items: center; justify-content: center;
    width: var(--cp-control-height); height: var(--cp-control-height);
    flex: none; padding: 0;
    background: transparent; color: var(--cp-text-muted);
    border: 0; border-radius: var(--cp-radius);
    cursor: pointer;
    transition: background-color 120ms ease, color 120ms ease;
  }
  .cp-icon-button:hover { background: var(--cp-border-subtle); color: var(--cp-text); }
  .cp-icon-button:focus-visible { outline: 2px solid var(--cp-focus); outline-offset: 0; }
  .cp-icon-button svg { width: 18px; height: 18px; display: block; }
  .cp-icon-button[disabled] { opacity: 0.4; cursor: default; }
  .cp-icon-button[data-cp-copy-status="copied"] { color: var(--cp-success); }
  .cp-icon-button[data-cp-copy-status="error"] { color: #e5484d; }

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


}

@layer chroma-panel {

  @media (pointer: coarse) {
    .cp-root {
      --cp-control-height: 40px; --cp-thumb-size: 24px;
      --cp-panel-h: 372px;
    }
    .cp-tab::after,
    .cp-icon-button::after,
    .cp-text-button::after {
      content: ""; position: absolute;
      top: 50%; left: 50%; translate: -50% -50%;
      width: max(100%, 44px); height: max(100%, 44px);
    }
    .cp-recents .cp-swatch { height: 34px; }
    .cp-toolbar .cp-tab { min-height: 52px; }
  }

  @media (max-width: 640px) {
    .cp-root { --cp-pad: 16px; }
  }

  @container cp (max-width: 340px) {
    .cp-current-color {
      position: absolute; width: 1px; height: 1px; margin: -1px;
      overflow: hidden; clip-path: inset(50%);
    }
  }
  @container cp (max-width: 256px) {
    .cp-tab-label { display: none; }
    .cp-toolbar .cp-tab { min-height: 40px; }
    .cp-recents { grid-template-columns: repeat(6, minmax(0, 1fr)); }
    .cp-recents > li:nth-child(n + 7) { display: none; }
  }

  @media (forced-colors: active) {
    .cp-swatch, .cp-chip { forced-color-adjust: none; }
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

/** ColorDisc, the wheel. */
export const discCss: string = `
@layer chroma-panel {
  .cp-disc-wrap { display: flex; justify-content: center; padding: 4px 0; }
  .cp-disc {
    position: relative;
    width: min(100%, var(--cp-disc-size));
    aspect-ratio: 1;
    border-radius: 50%; cursor: crosshair; outline: none;
    touch-action: none;
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
  .cp-disc > .cp-thumb {
    --cp-thumb-size: 28px; z-index: 2;
    border-width: 3px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 40%), 0 0 0 1px rgb(0 0 0 / 14%);
  }
  .cp-disc:has(:focus-visible) { outline: 2px solid var(--cp-focus); outline-offset: 3px; }

  @container cp (min-width: 380px) {
    .cp-disc { --cp-disc-size: 288px; }
  }

  @media (forced-colors: active) {
    .cp-disc { forced-color-adjust: none; }
  }
}
`;

/** ColorArea, the saturation and brightness square. */
export const areaCss: string = `
@layer chroma-panel {
  .cp-area {
    position: relative; width: 100%; height: clamp(170px, 64cqi, 260px);
    flex: none;
    border-radius: var(--cp-radius); cursor: crosshair; outline: none;
    touch-action: none;
    background-color: var(--cp-hue-color);
    background-image:
      linear-gradient(to top, #000, rgb(0 0 0 / 0)),
      linear-gradient(to right, #fff, rgb(255 255 255 / 0));
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 14%);
  }
  .cp-area > .cp-thumb { --cp-thumb-size: 24px; }
  .cp-area:has(:focus-visible) { outline: 2px solid var(--cp-focus); outline-offset: 3px; }

  @media (forced-colors: active) {
    .cp-area { forced-color-adjust: none; }
  }
}
`;

/** ChannelSlider. */
export const sliderCss: string = `
@layer chroma-panel {
  .cp-slider-row { display: flex; align-items: center; gap: 10px; }
  .cp-slider-label {
    width: 14px; flex: none; text-align: center;
    color: var(--cp-text-muted); font-size: 12px; font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .cp-slider {
    position: relative; flex: 1; height: var(--cp-track-height);
    border-radius: calc(var(--cp-track-height) / 2);
    cursor: pointer; outline: none;
    touch-action: none;
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 12%);
  }
  .cp-slider:has(:focus-visible) { outline: 2px solid var(--cp-focus); outline-offset: 4px; }
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
  .cp-slider[data-cp-channel="hue"] .cp-thumb { background: var(--cp-hue-color); }

  .cp-slider[data-cp-channel="alpha"] {
    background-image: var(--cp-checker);
    background-size: var(--cp-checker-size) var(--cp-checker-size);
  }

  @media (forced-colors: active) {
    .cp-slider-fill { forced-color-adjust: none; }
  }
}
`;

/** Harmony mode: rule picker, partner markers on the disc and result swatches. */
export const harmonyCss: string = `
@layer chroma-panel {
  .cp-harmony-dot {
    position: absolute; z-index: 1;
    width: 16px; height: 16px; margin: -8px 0 0 -8px;
    border: 2px solid #fff; border-radius: 50%;
    background: var(--cp-swatch-color);
    box-shadow: 0 1px 3px rgb(0 0 0 / 40%);
    pointer-events: none;
  }
  .cp-harmony .cp-disc { --cp-disc-size: 196px; }
  .cp-pills {
    position: relative; flex: none;
    overflow-x: auto; overflow-y: hidden; overscroll-behavior-x: contain;
    margin-inline: -4px; padding: 3px 4px;
    scrollbar-width: none;
  }
  .cp-pills::-webkit-scrollbar { display: none; }
  .cp-pills[data-cp-fade] {
    --cp-fade-s: 0px; --cp-fade-e: 0px;
    mask-image: linear-gradient(to right,
      transparent 0, #000 var(--cp-fade-s), #000 calc(100% - var(--cp-fade-e)), transparent 100%);
  }
  .cp-pills[data-cp-fade="start"], .cp-pills[data-cp-fade="both"] { --cp-fade-s: 24px; }
  .cp-pills[data-cp-fade="end"], .cp-pills[data-cp-fade="both"] { --cp-fade-e: 24px; }
  .cp-pills .cp-seg {
    display: flex; width: max-content; gap: 6px;
    padding: 0; border-radius: 0; background: none; box-shadow: none;
  }
  .cp-pills .cp-seg::before { content: none; }
  .cp-pills .cp-tab {
    flex: none; height: 30px; padding: 0 13px;
    border-radius: 999px; white-space: nowrap;
    box-shadow: inset 0 0 0 1px var(--cp-border);
    font-size: 12px; font-weight: 500;
    transition: color 120ms ease, background-color 120ms ease, box-shadow 120ms ease;
  }
  .cp-pills .cp-tab:hover { box-shadow: inset 0 0 0 1px var(--cp-text-muted); }
  .cp-pills .cp-tab[aria-selected="true"] {
    background: var(--cp-text); color: var(--cp-surface); box-shadow: none;
  }
  .cp-pills .cp-tab:focus-visible { outline-offset: 2px; }
  .cp-harmony-swatches {
    display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 6px;
    margin: 0; padding: var(--cp-ring-bleed) 0; list-style: none;
  }
  .cp-harmony-swatches .cp-swatch {
    aspect-ratio: auto; height: 52px;
    display: flex; align-items: flex-end; padding: 7px 8px;
    border-radius: var(--cp-radius);
  }
  .cp-harmony-swatches .cp-swatch:hover { transform: none; }
}
`;

/** Value mode: the editable number after each slider. */
export const valuesCss: string = `
@layer chroma-panel {
  .cp-panel.cp-values { gap: 8px; }
  .cp-values .cp-field-inline { margin-top: 4px; }
  .cp-slider-row .cp-slider-value { position: relative; flex: none; width: 54px; }
  .cp-slider-row .cp-slider-value .cp-input {
    height: 28px; padding: 0 15px 0 4px; text-align: right;
    background: transparent; border-color: transparent;
    font-weight: 500;
  }
  .cp-slider-row .cp-slider-value .cp-input:hover { background: var(--cp-field); border-color: var(--cp-field-border); }
  .cp-slider-value[data-cp-unit]::after {
    content: attr(data-cp-unit);
    position: absolute; left: calc(100% - 14px); top: 50%; translate: 0 -50%;
    color: var(--cp-text-muted); font-size: 12px; pointer-events: none;
  }
  .cp-slider-value .cp-field-label {
    position: absolute; width: 1px; height: 1px; margin: -1px;
    overflow: hidden; clip-path: inset(50%); white-space: nowrap;
  }
}
`;

/** Palettes mode: the Cards view. */
export const paletteCss: string = `
@layer chroma-panel {
  .cp-swatch-grid[data-cp-variant="cards"] {
    grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px;
  }
  .cp-swatch-grid[data-cp-variant="cards"] .cp-swatch {
    aspect-ratio: auto; height: 64px;
    display: flex; align-items: flex-end;
    padding: 7px 8px; border-radius: var(--cp-radius);
    text-align: left;
  }
  .cp-swatch-grid[data-cp-variant="cards"] .cp-swatch:hover { transform: none; }

  @container cp (max-width: 256px) {
    .cp-swatch-grid[data-cp-variant="cards"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
}
`;

/** ColorField: the hex input with its color dot. */
export const fieldCss: string = `
@layer chroma-panel {
  .cp-hex { position: relative; display: flex; align-items: center; flex: 1; min-width: 0; }
  .cp-field-inline .cp-hex { flex: none; width: 136px; }
  .cp-hex-dot {
    position: absolute; left: 10px; width: 14px; height: 14px; border-radius: 50%;
    background-image: linear-gradient(var(--cp-preview-color), var(--cp-preview-color)), var(--cp-checker);
    background-size: 100% 100%, 6px 6px;
    box-shadow: inset 0 0 0 1px var(--cp-swatch-ring);
    pointer-events: none;
  }
  .cp-hex-hash {
    position: absolute; left: 31px;
    color: var(--cp-text-muted); font-size: 13px; font-weight: 500;
    pointer-events: none;
  }
  .cp-hex .cp-input {
    padding-left: 42px;
    font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase;
  }
}
`;

/** Labeled color tiles: palette Cards and harmony swatches. */
export const cardCss: string = `
@layer chroma-panel {
  .cp-card-name {
    position: relative; z-index: 1; min-width: 0;
    display: flex; flex-direction: column; gap: 1px;
    color: var(--cp-card-ink, #fff); line-height: 1.2; text-align: left;
  }
  .cp-card-title {
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    font-size: 11px; font-weight: 600;
  }
  .cp-card-hex {
    font-size: 10px; font-weight: 500; letter-spacing: 0.04em;
    font-variant-numeric: tabular-nums; opacity: 0.72;
  }
}
`;

/** Image mode: drop zone, preview and loupe. */
export const imageCss: string = `
@layer chroma-panel {
  .cp-dropzone {
    flex: 1 1 auto; min-height: 168px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 8px;
    padding: 16px; text-align: center; cursor: pointer;
    color: var(--cp-text-muted); font-size: 12px; line-height: 1.4;
    border: 1px dashed var(--cp-border);
    border-radius: var(--cp-radius);
    background: var(--cp-surface-raised);
    transition: border-color 120ms ease, background-color 120ms ease;
  }
  .cp-dropzone svg { width: 26px; height: 26px; opacity: 0.7; }
  .cp-dropzone-title { color: var(--cp-text); font-weight: 600; font-size: 13px; }
  .cp-dropzone-hint { font-size: 11px; }

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
    flex: 1 1 auto; min-height: 120px;
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
    margin: -3px 0 0; color: var(--cp-text-muted); font-size: 11px; text-align: center;
  }
  .cp-image-remove {
    position: absolute; top: 6px; right: 6px;
    width: 26px; height: 26px; padding: 0;
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
  .cp-panel .cp-button {
    flex: none; height: var(--cp-control-height); padding: 0 12px;
    border: 1px solid var(--cp-border-subtle); border-radius: var(--cp-radius);
    appearance: none; -webkit-appearance: none;
    background: var(--cp-surface-raised); color: var(--cp-text);
    font: inherit; font-size: 12px; font-weight: 500; cursor: pointer;
    transition: background-color 120ms ease;
  }
  .cp-panel .cp-button:hover { background: var(--cp-border-subtle); }
  .cp-panel .cp-button:focus-visible { outline: 2px solid var(--cp-focus); outline-offset: 1px; }
  .cp-panel .cp-button[disabled] { opacity: 0.4; cursor: default; }
}
`;

/** The ColorInput swatch button. */
export const triggerCss: string = `
@layer chroma-panel {
  .cp-trigger {
    position: relative; width: 36px; height: 26px; padding: 0;
    border: 0; border-radius: var(--cp-radius-sm); cursor: pointer;
    background-color: transparent;
    outline: 1px solid var(--cp-swatch-ring);
    outline-offset: -1px;
  }
  .cp-trigger::after {
    content: ""; position: absolute; inset: 0; border-radius: inherit;
    background: var(--cp-trigger-color, transparent);
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 12%);
  }
  .cp-trigger:focus-visible { outline: 2px solid var(--cp-focus); outline-offset: 2px; }
  .cp-trigger[disabled] { opacity: 0.5; cursor: default; }

  .cp-trigger {
    background-image: var(--cp-checker);
    background-size: var(--cp-checker-size) var(--cp-checker-size);
  }

  @media (pointer: coarse) {
    .cp-trigger::before {
      content: ""; position: absolute;
      top: 50%; left: 50%; translate: -50% -50%;
      width: max(100%, 44px); height: max(100%, 44px);
    }
  }

  @media (forced-colors: active) {
    .cp-trigger { forced-color-adjust: none; }
  }
}
`;

/** Popover and the mobile bottom sheet. */
export const popoverCss: string = `
@layer chroma-panel {
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
  .cp-dialog { display: flex; flex-direction: column; min-height: 0; min-width: 0; }
  .cp-sheet > *, .cp-sheet .cp-dialog { min-height: 0; }
  .cp-sheet > .cp-dialog { flex: 1 1 auto; }

  .cp-sheet .cp-root {
    width: 100%; max-width: none;
    border-radius: 0; box-shadow: none; background: transparent;
    flex: 1 1 auto; min-height: 0;
  }
  .cp-sheet .cp-toolbar.cp-seg { border-radius: 0; }
}

body:has(.cp-sheet-root[data-cp-open="true"]) { overflow: hidden; }
`;

export const STYLE_ID: string = 'v4';
