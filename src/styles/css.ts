/**
 * The panel's stylesheet, as a string.
 *
 * Single source of truth: this is both what `injectStyles` puts in a <style>
 * tag and what the build writes to `dist/style.css`, so the two can never
 * drift apart.
 *
 * Three rules govern everything below:
 *
 * 1. Everything sits inside `@layer chroma-panel`. Unlayered CSS beats ALL
 *    layered CSS regardless of specificity, so an unlayered sheet would
 *    override a Tailwind v4 consumer's own utility classes — a bug report
 *    waiting to happen. Layered, they can reorder us with one @layer rule.
 * 2. Single-class specificity, stable `cp-` prefix, never hashed, no bare
 *    element selectors, no !important. Consumers must be able to override.
 * 3. Every colour and dimension is a `--cp-*` custom property, so the panel
 *    can be themed without a build step.
 */
export const css: string = `
@layer chroma-panel {
  .cp-root {
    /* Palette — dark by default, matching the macOS panel. */
    --cp-surface: #232323;
    --cp-surface-raised: #2c2c2c;
    --cp-surface-sunken: #1b1b1b;
    --cp-border: #55585b;
    --cp-border-subtle: #3a3d40;
    --cp-text: #ededed;
    --cp-text-muted: #a7a7a7;
    --cp-accent: #3b82f6;
    --cp-focus: #5b9cff;

    /* Geometry */
    --cp-radius: 14px;
    --cp-radius-lg: 20px;
    --cp-radius-sm: 8px;
    --cp-thumb-size: 16px;
    --cp-track-height: 12px;
    --cp-gap: 12px;
    --cp-pad: 16px;
    --cp-width: 320px;

    /* Set on every colour change — one write per frame drives the whole UI. */
    --cp-h: 0;
    --cp-s: 0%;
    --cp-v: 0%;
    --cp-a: 1;
    --cp-hue-color: hsl(var(--cp-h) 100% 50%);

    --cp-checker:
      linear-gradient(45deg, #808080 25%, transparent 25%),
      linear-gradient(-45deg, #808080 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #808080 75%),
      linear-gradient(-45deg, transparent 75%, #808080 75%);
    --cp-checker-size: 8px;

    box-sizing: border-box;
    width: var(--cp-width);
    max-width: 100%;
    padding: var(--cp-pad);
    display: flex;
    flex-direction: column;
    gap: var(--cp-gap);
    background: var(--cp-surface);
    color: var(--cp-text);
    border: 1px solid var(--cp-border-subtle);
    border-radius: var(--cp-radius-lg);
    box-shadow: 0 24px 60px rgb(0 0 0 / 35%);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    font-size: 12px;
    line-height: 1.4;
  }

  .cp-root[data-cp-theme="light"] {
    --cp-surface: #ececec;
    --cp-surface-raised: #f7f7f7;
    --cp-surface-sunken: #e0e0e0;
    --cp-border: #b8b8b8;
    --cp-border-subtle: #cfcfcf;
    --cp-text: #1c1c1c;
    --cp-text-muted: #6a6a6a;
  }

  .cp-root *,
  .cp-root *::before,
  .cp-root *::after { box-sizing: border-box; }

  .cp-root[data-cp-disabled="true"] { opacity: 0.55; pointer-events: none; }

  /* The alpha checkerboard, declared once for every surface that shows
     transparency rather than repeated per component. */
  .cp-swatch,
  .cp-preview,
  .cp-trigger,
  .cp-slider[data-cp-channel="alpha"] {
    background: var(--cp-checker);
    background-size: var(--cp-checker-size) var(--cp-checker-size);
    background-position: 0 0, 0 calc(var(--cp-checker-size) / 2),
      calc(var(--cp-checker-size) / 2) calc(var(--cp-checker-size) / -2),
      calc(var(--cp-checker-size) / -2) 0;
  }

  /* ---------------------------------------------------------------- *
   * Title bar — decorative only
   * ---------------------------------------------------------------- */

  .cp-titlebar { display: flex; align-items: center; gap: 8px; height: 14px; }
  .cp-lights { display: flex; gap: 6px; }
  /* Purely ornamental: a close button that does not close would be a bug,
     so these are aria-hidden and have no handlers. */
  .cp-light { width: 11px; height: 11px; border-radius: 50%; }
  .cp-light[data-cp-light="close"] { background: #ff5f57; }
  .cp-light[data-cp-light="min"] { background: #febc2e; }
  .cp-light[data-cp-light="max"] { background: #28c840; }
  .cp-title {
    flex: 1; text-align: center; font-weight: 600;
    color: var(--cp-text-muted); letter-spacing: 0.02em;
  }

  /* ---------------------------------------------------------------- *
   * Mode toolbar (tablist)
   * ---------------------------------------------------------------- */

  .cp-toolbar {
    display: flex; gap: 2px; padding: 3px;
    background: var(--cp-surface-sunken);
    border-radius: var(--cp-radius-sm);
  }
  .cp-tab {
    flex: 1; display: inline-flex; align-items: center; justify-content: center;
    height: 28px; padding: 0 6px; border: 0; border-radius: 6px;
    background: transparent; color: var(--cp-text-muted);
    cursor: pointer; font: inherit;
    transition: background-color 120ms ease, color 120ms ease;
  }
  .cp-tab:hover { color: var(--cp-text); background: rgb(255 255 255 / 6%); }
  .cp-tab[aria-selected="true"] {
    background: var(--cp-surface-raised); color: var(--cp-text);
    box-shadow: 0 1px 2px rgb(0 0 0 / 25%);
  }
  .cp-tab:focus-visible { outline: 2px solid var(--cp-focus); outline-offset: 1px; }
  .cp-tab svg { width: 16px; height: 16px; display: block; }

  .cp-panel { display: flex; flex-direction: column; gap: var(--cp-gap); }

  /* ---------------------------------------------------------------- *
   * Colour disc (hue + saturation)
   * ---------------------------------------------------------------- */

  .cp-disc-wrap { display: flex; justify-content: center; padding: 4px 0; }
  .cp-disc {
    position: relative; width: 200px; max-width: 100%; aspect-ratio: 1;
    border-radius: 50%; cursor: crosshair; outline: none;
    /* Saturation: white at the centre fading out. Hue: the conic ramp.
       This composite is not an approximation of HSV — it is exactly HSV.
       See the proof in the ColorDisc source. */
    background:
      radial-gradient(circle closest-side, #fff, rgb(255 255 255 / 0)),
      conic-gradient(
        #f00 0%, #ff0 16.6667%, #0f0 33.3333%, #0ff 50%,
        #00f 66.6667%, #f0f 83.3333%, #f00 100%
      );
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 20%);
  }
  /* "in hsl longer hue" interpolates hue linearly over the full 360deg, which
     IS the HSV definition — two stops, zero rounding error. The 1/6 stops
     above stay as the fallback. Never rewrite these as oklch(): CSS Color 4
     keeps legacy notations in sRGB but flips modern ones to Oklab, which
     would silently distort the wheel. */
  @supports (background: conic-gradient(in hsl longer hue, red, red)) {
    .cp-disc {
      background:
        radial-gradient(circle closest-side, #fff, rgb(255 255 255 / 0)),
        conic-gradient(in hsl longer hue, red, red);
    }
  }
  /* Brightness is a black veil over the disc. */
  .cp-disc::after {
    content: ""; position: absolute; inset: 0; border-radius: 50%;
    background: #000; opacity: calc(1 - var(--cp-v) / 100%); pointer-events: none;
  }
  .cp-disc:has(:focus-visible) { outline: 2px solid var(--cp-focus); outline-offset: 3px; }

  /* ---------------------------------------------------------------- *
   * 2D saturation/value area
   * ---------------------------------------------------------------- */

  .cp-area {
    position: relative; width: 100%; height: 150px;
    border-radius: var(--cp-radius-sm); cursor: crosshair; outline: none;
    background-color: var(--cp-hue-color);
    background-image:
      linear-gradient(to top, #000, rgb(0 0 0 / 0)),
      linear-gradient(to right, #fff, rgb(255 255 255 / 0));
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 20%);
  }
  .cp-area:has(:focus-visible) { outline: 2px solid var(--cp-focus); outline-offset: 3px; }

  /* ---------------------------------------------------------------- *
   * Thumb
   * ---------------------------------------------------------------- */

  .cp-thumb {
    position: absolute; top: 0; left: 0;
    width: var(--cp-thumb-size); height: var(--cp-thumb-size);
    margin: calc(var(--cp-thumb-size) / -2) 0 0 calc(var(--cp-thumb-size) / -2);
    border-radius: 50%; border: 2px solid #fff;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 35%), 0 1px 3px rgb(0 0 0 / 30%);
    pointer-events: none;
    /* Percentages of the containing block. CSS "translate" percentages
       resolve against the element's own size, so they cannot express
       "half way across the disc"; left/top can. Only this one small
       absolutely-positioned element is affected, so the layout cost is
       negligible. */
    left: var(--cp-thumb-x, 50%);
    top: var(--cp-thumb-y, 50%);
  }

  /* ---------------------------------------------------------------- *
   * Sliders
   * ---------------------------------------------------------------- */

  .cp-slider-row { display: flex; align-items: center; gap: 10px; }
  .cp-slider-label {
    width: 22px; flex: none; color: var(--cp-text-muted);
    font-variant-numeric: tabular-nums;
  }
  .cp-slider {
    position: relative; flex: 1; height: var(--cp-track-height);
    border-radius: calc(var(--cp-track-height) / 2);
    cursor: pointer; outline: none;
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 20%);
  }
  .cp-slider:has(:focus-visible) { outline: 2px solid var(--cp-focus); outline-offset: 3px; }
  .cp-slider-fill {
    position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  }
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

  /* ---------------------------------------------------------------- *
   * Numeric and text fields
   * ---------------------------------------------------------------- */

  .cp-fields { display: flex; gap: 8px; align-items: flex-end; }
  .cp-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
  .cp-field-label {
    color: var(--cp-text-muted); font-size: 10px;
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .cp-input {
    width: 100%; min-width: 0; height: 26px; padding: 0 7px;
    background: var(--cp-surface-sunken); color: var(--cp-text);
    border: 1px solid var(--cp-border-subtle); border-radius: 6px;
    font: inherit; font-variant-numeric: tabular-nums;
  }
  .cp-input:focus-visible {
    outline: 2px solid var(--cp-focus); outline-offset: -1px; border-color: transparent;
  }
  .cp-input[aria-invalid="true"] { border-color: #e5484d; }
  .cp-input::-webkit-outer-spin-button,
  .cp-input::-webkit-inner-spin-button { appearance: none; margin: 0; }
  .cp-input[type="number"] { appearance: textfield; -moz-appearance: textfield; }

  /* ---------------------------------------------------------------- *
   * Swatches
   * ---------------------------------------------------------------- */

  .cp-swatch {
    position: relative; width: 100%; aspect-ratio: 1; padding: 0;
    border: 1px solid rgb(0 0 0 / 25%); border-radius: var(--cp-radius-sm);
    cursor: pointer; overflow: hidden;
  }
  .cp-swatch::after {
    content: ""; position: absolute; inset: 0;
    background: var(--cp-swatch-color, transparent);
  }
  .cp-swatch:focus-visible { outline: 2px solid var(--cp-focus); outline-offset: 2px; }
  .cp-swatch[aria-pressed="true"], .cp-swatch[aria-selected="true"] {
    box-shadow: 0 0 0 2px var(--cp-surface), 0 0 0 4px var(--cp-focus);
  }
  .cp-swatch-round { border-radius: 50%; }

  .cp-swatch-grid {
    display: grid;
    grid-template-columns: repeat(var(--cp-columns, 10), minmax(0, 1fr));
    gap: 6px; margin: 0; padding: 0; list-style: none;
  }
  .cp-swatch-grid > li { display: block; min-width: 0; }
  /* Past ~1000 swatches this gives virtualization's effect as one property.
     It belongs on the items, never the grid container — the container needs
     its full layout to position them. */
  .cp-swatch-grid[data-cp-large="true"] > li {
    content-visibility: auto;
    contain-intrinsic-size: auto 24px;
  }

  .cp-scroll { max-height: 180px; overflow-y: auto; overscroll-behavior: contain; }

  /* ---------------------------------------------------------------- *
   * Footer
   * ---------------------------------------------------------------- */

  .cp-footer { display: flex; align-items: center; gap: 10px; }
  .cp-preview {
    position: relative; width: 34px; height: 34px; flex: none;
    border-radius: 50%; border: 1px solid var(--cp-border);
    overflow: hidden;
  }
  .cp-preview::after {
    content: ""; position: absolute; inset: 0;
    background: var(--cp-preview-color, transparent);
  }
  .cp-recents { display: flex; gap: 5px; flex: 1; min-width: 0; flex-wrap: nowrap; overflow: hidden; }
  .cp-recents .cp-swatch { width: 20px; height: 20px; flex: none; }

  .cp-icon-button {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; flex: none; padding: 0;
    background: var(--cp-surface-raised); color: var(--cp-text);
    border: 1px solid var(--cp-border-subtle); border-radius: 6px; cursor: pointer;
  }
  .cp-icon-button:hover { background: var(--cp-border-subtle); }
  .cp-icon-button:focus-visible { outline: 2px solid var(--cp-focus); outline-offset: 1px; }
  .cp-icon-button svg { width: 15px; height: 15px; display: block; }
  .cp-icon-button[disabled] { opacity: 0.4; cursor: default; }

  /* ---------------------------------------------------------------- *
   * Trigger + popover
   * ---------------------------------------------------------------- */

  .cp-trigger {
    position: relative; width: 34px; height: 24px; padding: 0;
    border: 1px solid var(--cp-border); border-radius: 6px;
    cursor: pointer; overflow: hidden;
  }
  .cp-trigger::after {
    content: ""; position: absolute; inset: 0;
    background: var(--cp-trigger-color, transparent);
  }
  .cp-trigger:focus-visible { outline: 2px solid var(--cp-focus); outline-offset: 2px; }
  .cp-trigger[disabled] { opacity: 0.5; cursor: default; }

  .cp-popover { position: absolute; z-index: 2147483000; margin: 0; padding: 0; border: 0; }

  .cp-visually-hidden {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap;
    border: 0;
  }

  .cp-empty { color: var(--cp-text-muted); padding: 18px 0; text-align: center; }

  @media (prefers-reduced-motion: reduce) {
    .cp-root *, .cp-root *::before, .cp-root *::after {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
    }
  }
}
`;

/** Identifies the injected <style> element and dedupes across instances. */
export const STYLE_ID: string = 'v1';
