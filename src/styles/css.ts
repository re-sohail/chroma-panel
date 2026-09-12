/**
 * The panel's stylesheet, as a string.
 *
 * Single source of truth: this is both what `injectStyles` puts in a <style>
 * tag and what the build writes to `dist/style.css`, so the two cannot drift.
 * The build also strips these comments before inlining, so they cost nothing
 * at runtime.
 *
 * IMPORTANT, two things that will bite:
 *
 * 1. scripts/emit-css.mjs finds this by matching the exact declaration
 *    "export const css: string =" followed by a template literal. Change that
 *    shape and the build silently emits an empty stylesheet.
 * 2. This is a template literal, so a backtick anywhere below — including
 *    inside a CSS comment — terminates the string and breaks the build. Use
 *    double quotes when quoting a property or value in a comment.
 *
 * Four rules govern everything below:
 *
 * 1. Everything sits inside `@layer chroma-panel`. Unlayered CSS beats ALL
 *    layered CSS regardless of specificity, so an unlayered sheet would
 *    override a consumer's own utility classes.
 * 2. Single-class specificity, stable `cp-` prefix, never hashed, no bare
 *    element selectors, no !important. Class names are public API: add, never
 *    rename or remove.
 * 3. Every colour and dimension is a `--cp-*` custom property.
 * 4. Elevation in dark mode is a LIGHTER SURFACE plus a hairline ring plus a
 *    deep, soft, near-black shadow — never a stronger drop shadow. Shadows
 *    barely register on dark grounds, which is why every dark floating shadow
 *    here begins with a `0 0 0 1px` ring.
 */
export const css: string = `
@layer chroma-panel {
  /* Tokens are declared on the wrappers as well as the panel.
     .cp-sheet-root and .cp-popover are ANCESTORS of .cp-root, so a token
     declared only on .cp-root is invisible to them — which silently resolves
     "background: var(--cp-surface)" to nothing and leaves the sheet
     transparent. */
  .cp-root,
  .cp-sheet-root,
  .cp-popover {
    /* Tells the browser to render native scrollbars, carets and form controls
       inside the panel in the matching scheme. Without it a dark panel gets
       light scrollbars. */
    color-scheme: light dark;

    /* ---- surfaces -------------------------------------------------------
       A small, deliberate ladder rather than ad-hoc colours. The dark steps
       are close together on purpose: 1 -> 3 spans about 17 RGB points in
       systems that do this well, and larger jumps read as a mistake. */
    --cp-surface: light-dark(#ffffff, #191919);
    --cp-surface-raised: light-dark(#f4f4f6, #222222);
    --cp-surface-sunken: light-dark(#eaeaee, #111111);
    --cp-surface-overlay: light-dark(#ffffff, #222222);

    /* ---- borders ---- */
    --cp-border: light-dark(#d6d6da, #3a3a3a);
    --cp-border-subtle: light-dark(rgb(0 0 0 / 9%), rgb(255 255 255 / 10%));

    /* ---- text ---- */
    --cp-text: light-dark(#1c1c1e, #ededed);
    --cp-text-muted: light-dark(#6b6b70, #a0a0a6);

    /* ---- accents ---- */
    --cp-accent: light-dark(#2d7ff9, #4d94ff);
    --cp-focus: light-dark(#2d7ff9, #5b9cff);

    /* ---- geometry -------------------------------------------------------
       Radii follow the concentric rule: an element inset by P inside a
       container with radius R gets radius R - P, so the curves stay parallel.
       Apple publishes this rule rather than a table of numbers; the numbers
       below are ours. */
    --cp-radius-lg: 16px;
    --cp-radius: 10px;
    --cp-radius-sm: 7px;
    --cp-seg-pad: 3px;

    --cp-thumb-size: 18px;
    --cp-track-height: 12px;
    --cp-control-height: 30px;
    --cp-input-height: 28px;
    --cp-gap: 12px;
    --cp-pad: 14px;
    --cp-width: 320px;
    --cp-disc-size: 196px;

    /* Set once per frame on colour change; CSS propagates from here. */
    --cp-h: 0;
    --cp-s: 0%;
    --cp-v: 0%;
    --cp-a: 1;
    --cp-hue-color: hsl(var(--cp-h) 100% 50%);

    /* One gradient instead of four stacked ones, and lower contrast than the
       usual mid-grey checker so it sits behind a colour rather than fighting
       it. */
    --cp-checker-size: 12px;
    --cp-checker: repeating-conic-gradient(
      light-dark(#00000014, #ffffff14) 0% 25%, transparent 0% 50%);

    /* Elevation. Light mode gets a real shadow; dark mode gets a ring plus a
       deep soft shadow, because a drop shadow alone is invisible on dark. */
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
    /* Never wider than its container, never wider than the design width. A
       fixed width is what makes a panel overflow a narrow phone. */
    width: min(100%, var(--cp-width));
    padding: var(--cp-pad);
    display: flex;
    flex-direction: column;
    gap: var(--cp-gap);
    background: var(--cp-surface);
    color: var(--cp-text);
    border-radius: var(--cp-radius-lg);
    box-shadow: 0 0 0 1px var(--cp-border-subtle);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    /* 13px is a real UI body size; the previous 12 forced every label smaller
       still and made the panel read as a dense dashboard. */
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

  /* ---------------------------------------------------------------- *
   * Title bar — decorative only
   * ---------------------------------------------------------------- */

  .cp-titlebar { display: flex; align-items: center; gap: 8px; min-height: 13px; }
  .cp-lights { display: flex; gap: 6px; }
  /* Ornamental. A close button that does not close is worse than no button,
     so these carry no handlers and are hidden from assistive technology. */
  .cp-light { width: 11px; height: 11px; border-radius: 50%; }
  .cp-light[data-cp-light="close"] { background: #ff5f57; }
  .cp-light[data-cp-light="min"] { background: #febc2e; }
  .cp-light[data-cp-light="max"] { background: #28c840; }
  .cp-title {
    flex: 1; text-align: center; font-size: 12px; font-weight: 600;
    color: var(--cp-text-muted);
  }

  /* ---------------------------------------------------------------- *
   * Segmented control
   *
   * The sliding pill is one pseudo-element positioned from two custom
   * properties. Because the track is grid-auto-columns: 1fr, every segment is
   * the same width, so the pill's width is 100%/count and its offset is
   * active*100% — no measurement, no ResizeObserver, nothing to go stale.
   * ---------------------------------------------------------------- */

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
    /* Concentric: the track radius minus the padding. */
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
  .cp-seg-sm .cp-tab { height: 24px; font-size: 11px; letter-spacing: 0.02em; }
  .cp-tab svg { width: 17px; height: 17px; display: block; }

  .cp-panel { display: flex; flex-direction: column; gap: var(--cp-gap); }

  /* ---------------------------------------------------------------- *
   * Colour disc
   * ---------------------------------------------------------------- */

  .cp-disc-wrap { display: flex; justify-content: center; padding: 2px 0; }
  .cp-disc {
    position: relative;
    width: min(100%, var(--cp-disc-size));
    aspect-ratio: 1;
    border-radius: 50%; cursor: crosshair; outline: none;
    /* Not an approximation of HSV — exactly HSV. White at the centre fading
       out gives radial distance === saturation; the conic ramp gives angle
       === hue. */
    background:
      radial-gradient(circle closest-side, #fff, rgb(255 255 255 / 0)),
      conic-gradient(
        #f00 0%, #ff0 16.6667%, #0f0 33.3333%, #0ff 50%,
        #00f 66.6667%, #f0f 83.3333%, #f00 100%
      );
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 14%);
  }
  /* "in hsl longer hue" travels the full 360 degrees interpolating hue
     linearly, which IS the HSV definition — two stops, zero rounding error.
     The 1/6 stops above remain the fallback. Never rewrite these as oklch():
     CSS Color 4 keeps legacy notations in sRGB but flips modern ones to
     Oklab, which would silently distort the wheel. */
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

  /* ---------------------------------------------------------------- *
   * 2D saturation/value area
   * ---------------------------------------------------------------- */

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

  /* ---------------------------------------------------------------- *
   * Thumb
   *
   * Percentages of the containing block. CSS "translate" percentages resolve
   * against the element's own size, so they cannot express "half way across
   * the disc"; left/top can, and only this one small absolutely-positioned
   * element is affected.
   * ---------------------------------------------------------------- */

  .cp-thumb {
    position: absolute;
    left: var(--cp-thumb-x, 50%);
    top: var(--cp-thumb-y, 50%);
    width: var(--cp-thumb-size); height: var(--cp-thumb-size);
    margin: calc(var(--cp-thumb-size) / -2) 0 0 calc(var(--cp-thumb-size) / -2);
    border-radius: 50%;
    background: transparent;
    /* Two rings and a shadow rather than one flat white border: the inner
       dark hairline keeps the thumb visible on pale colours, the white ring
       keeps it visible on dark ones. */
    box-shadow:
      inset 0 0 0 2px #fff,
      inset 0 0 0 3px rgb(0 0 0 / 16%),
      0 1px 3px rgb(0 0 0 / 30%),
      0 0 0 1px rgb(0 0 0 / 12%);
    pointer-events: none;
  }

  /* ---------------------------------------------------------------- *
   * Sliders
   * ---------------------------------------------------------------- */

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

  /* ---------------------------------------------------------------- *
   * Alpha checkerboard, declared once for every surface showing transparency
   * ---------------------------------------------------------------- */

  .cp-swatch,
  .cp-preview,
  .cp-trigger,
  .cp-slider[data-cp-channel="alpha"] {
    background-image: var(--cp-checker);
    background-size: var(--cp-checker-size) var(--cp-checker-size);
  }

  /* ---------------------------------------------------------------- *
   * Fields
   * ---------------------------------------------------------------- */

  .cp-fields { display: flex; gap: 8px; align-items: flex-end; }
  .cp-field { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
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

  /* ---------------------------------------------------------------- *
   * Swatches
   * ---------------------------------------------------------------- */

  .cp-swatch {
    position: relative; width: 100%; aspect-ratio: 1; padding: 0;
    /* Not inline-block (the <button> default): an inline-block sits on the
       text baseline and leaves descender space beneath it, which shows up as
       phantom row gaps in a grid that is supposed to be gapless. */
    display: block;
    border: 0; border-radius: var(--cp-radius-sm);
    cursor: pointer; background-color: transparent;
    /* An outline rather than a border: it does not participate in layout, it
       shares the element's radius, and unlike box-shadow it survives forced
       colours. */
    outline: 1px solid light-dark(rgb(0 0 0 / 14%), rgb(255 255 255 / 16%));
    outline-offset: -1px;
  }
  .cp-swatch::after {
    content: ""; position: absolute; inset: 0; border-radius: inherit;
    background: var(--cp-swatch-color, transparent);
    /* The second, opposite-polarity ring. One ring always fails on half the
       spectrum — a dark hairline vanishes on dark fills, a light one vanishes
       on pale fills — so every swatch carries both. */
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
  .cp-swatch-grid > li { display: block; min-width: 0; }
  /* Past ~1000 entries this gives virtualization's effect as one property. It
     belongs on the items, never the container — the grid needs its full
     layout to position them. */
  .cp-swatch-grid[data-cp-large="true"] > li {
    content-visibility: auto;
    contain-intrinsic-size: auto 28px;
  }

  /* ---- mosaic ---------------------------------------------------------
     Gapless tiles under a single radius, as the iOS colour grid is drawn.
     It reads as discrete tiles because the colour steps are coarse, not
     because of chrome — adding gaps and borders here would make it worse,
     not better. The frame's padding exists so the selection ring, which
     straddles the cell edge, is not clipped on the outermost cells. */
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
  /* Straddles the cell boundary — half the ring inside, half spilling onto
     the neighbours — so the selection lifts out of a gapless mosaic. Drawn in
     the surface colour, which contrasts with every fill by construction. */
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

  /* Fades the last few pixels instead of slicing a row in half. */
  .cp-scroll {
    max-height: 216px; overflow-y: auto; overscroll-behavior: contain;
    -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 16px), transparent);
    mask-image: linear-gradient(to bottom, #000 calc(100% - 16px), transparent);
  }

  /* ---------------------------------------------------------------- *
   * Footer
   * ---------------------------------------------------------------- */

  .cp-footer {
    display: flex; align-items: center; gap: 10px;
    padding-top: var(--cp-gap);
    border-top: 1px solid var(--cp-border-subtle);
  }
  .cp-footer-spacer { flex: 1; }
  .cp-preview {
    position: relative; width: 30px; height: 30px; flex: none;
    border-radius: 50%;
    outline: 1px solid var(--cp-border-subtle); outline-offset: -1px;
  }
  .cp-preview::after {
    content: ""; position: absolute; inset: 0; border-radius: inherit;
    background: var(--cp-preview-color, transparent);
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 12%);
  }
  .cp-recents {
    display: flex; gap: 6px; flex: 1; min-width: 0;
    margin: 0; padding: 0; list-style: none; overflow: hidden;
  }
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

  /* ---------------------------------------------------------------- *
   * Trigger, popover, sheet
   * ---------------------------------------------------------------- */

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
  .cp-popover .cp-root { box-shadow: var(--cp-elevation); }

  .cp-sheet-root {
    position: fixed; inset: 0; z-index: 2147483000;
    display: flex; flex-direction: column; justify-content: flex-end;
  }
  .cp-scrim { position: absolute; inset: 0; background: rgb(0 0 0 / 45%); }
  .cp-sheet {
    position: relative; width: 100%;
    /* svh, not vh or dvh. vh equals the LARGE viewport, so content hides
       under an expanded mobile URL bar; dvh resizes live while scrolling,
       which janks. svh is the safe one. */
    max-height: 88svh;
    display: flex; flex-direction: column;
    overflow-y: auto; overscroll-behavior: contain;
    background: var(--cp-surface);
    border-radius: var(--cp-radius-lg) var(--cp-radius-lg) 0 0;
    box-shadow: 0 -8px 32px rgb(0 0 0 / 35%);
    /* env() resolves to 0 unless the PAGE sets viewport-fit=cover, which a
       library cannot do; max() degrades cleanly either way. */
    padding-bottom: max(8px, env(safe-area-inset-bottom));
  }
  .cp-grabber {
    width: 36px; height: 5px; flex: none; margin: 8px auto 0;
    border-radius: 3px; background: var(--cp-border);
  }
  /* Inside a sheet the panel IS the surface: it must not draw its own
     rounded, shadowed card inside another one. */
  .cp-sheet .cp-root {
    width: 100%; max-width: none;
    border-radius: 0; box-shadow: none; background: transparent;
  }
  /* Desktop window chrome on a phone sheet reads as a mistake; the grabber is
     the sheet's own affordance. */
  .cp-sheet .cp-lights { display: none; }
  .cp-sheet .cp-titlebar { justify-content: center; }

  .cp-visually-hidden {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%);
    white-space: nowrap; border: 0;
  }

  .cp-empty {
    color: var(--cp-text-muted); padding: 20px 0; text-align: center; font-size: 12px;
  }
}

/* Scroll lock, outside the layer so a consumer's own body rules cannot
   accidentally outrank it. Uses :has() rather than a JS lock, which would
   mean mutating the consumer's body styles. */
body:has(.cp-sheet-root[data-cp-open="true"]) { overflow: hidden; }

@layer chroma-panel {
  /* ---------------------------------------------------------------- *
   * Touch
   *
   * The visual size stays compact on a mouse — it is above the 24px WCAG AA
   * minimum and matches a desktop control. On a touch screen the HIT AREA
   * grows to 44px without changing what is drawn, so the desktop layout is
   * not inflated to serve the phone.
   * ---------------------------------------------------------------- */

  @media (pointer: coarse) {
    .cp-root { --cp-control-height: 34px; --cp-input-height: 34px; --cp-thumb-size: 22px; }
    .cp-tab::after,
    .cp-icon-button::after,
    .cp-trigger::before {
      content: ""; position: absolute;
      top: 50%; left: 50%; translate: -50% -50%;
      width: max(100%, 44px); height: max(100%, 44px);
    }
    .cp-icon-button, .cp-trigger { position: relative; }
    .cp-recents .cp-swatch { width: 28px; height: 28px; }
  }

  /* ---------------------------------------------------------------- *
   * Narrow viewports
   * ---------------------------------------------------------------- */

  @media (max-width: 640px) {
    .cp-root {
      --cp-width: 100%;
      --cp-disc-size: 240px;
      --cp-pad: 16px;
    }
    .cp-scroll { max-height: none; }
  }

  /* ---------------------------------------------------------------- *
   * Forced colours
   *
   * box-shadow is forced to "none" in this mode, so a grid relying on inset
   * rings collapses into one undifferentiated block. A colour picker is the
   * canonical case where colour IS the content, which is what
   * forced-color-adjust: none is for.
   * ---------------------------------------------------------------- */

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

/** Identifies the injected <style> element and dedupes across instances. */
export const STYLE_ID: string = 'v2';
