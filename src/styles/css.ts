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

    /* The panel is the SAME height in every mode.
       Each mode is content-sized, and left to themselves they range from 147px
       (image) to 325px (wheel). Letting that through resizes the popover on
       every tab switch, and — because a bottom sheet is anchored to the bottom
       edge — moves the sheet TOP edge by the same amount, which is what makes
       it feel broken on a phone.
       Sized to clear the tallest mode with headroom. A test asserts every mode
       still fits, so adding a row fails CI rather than silently reintroducing
       a scrollbar. Set to "auto" to opt out. */
    --cp-panel-h: 332px;

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
    /* Take the design width, but never overflow the container.
       NOT min(100%, var(--cp-width)): inside a shrink-to-fit parent — which
       is exactly what an absolutely positioned popover is — the percentage
       resolves against a container whose own width depends on its contents,
       and the panel collapses to well under its design width.
       width + max-width has no such circularity. */
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

  .cp-titlebar {
    display: flex; align-items: center; gap: 8px; min-height: 13px;
    /* Declared here, not on .cp-lights: the spacer that balances them is a
       SIBLING of .cp-lights, and a custom property declared on an element is
       invisible to its siblings. Getting this wrong silently falls back and
       knocks the title off centre. */
    --cp-light-size: 14px;
    --cp-light-gap: 10px;
  }

  /* The dots are slightly larger and further apart than the window chrome
     they imitate, deliberately.
     WCAG 2.5.8 (AA) wants a 24px target; these are smaller, so they rely on
     the spacing exception, which requires a 24px circle centred on each
     target not to reach another target. That makes the PITCH the number that
     matters: size + gap must be at least 24px. At authentic 12px/6px the
     pitch is 18px and three interactive dots fail — they only passed while
     two of them were decorative, and therefore not targets at all. */
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
    /* The glyph, not the dot. Dark enough to read on all three fills. */
    color: rgb(0 0 0 / 62%);
  }
  .cp-light[data-cp-light="close"] { background: #ff5f57; }
  .cp-light[data-cp-light="min"] { background: #febc2e; }
  .cp-light[data-cp-light="max"] { background: #28c840; }
  /* Shown dimmed rather than removed when unavailable, so the row keeps its
     shape and position. */
  .cp-light[disabled] { opacity: 0.42; cursor: default; }
  .cp-light:focus-visible { outline: 2px solid var(--cp-focus); outline-offset: 2px; }

  .cp-light-glyph {
    width: 8px; height: 8px; display: block;
    opacity: 0;
    transition: opacity 100ms ease;
  }
  /* Revealed by hovering the title bar, not the individual dot — which is how
     the window controls this borrows from behave. Focus reveals them too, so
     keyboard users are not left guessing. */
  .cp-titlebar:hover .cp-light:not([disabled]) .cp-light-glyph,
  .cp-light:focus-visible .cp-light-glyph { opacity: 1; }

  /* Balances the lights so the title stays optically centred. */
  .cp-titlebar-spacer {
    flex: none;
    width: calc(3 * var(--cp-light-size) + 2 * var(--cp-light-gap));
  }
  .cp-title {
    flex: 1; text-align: center; font-size: 12px; font-weight: 600;
    color: var(--cp-text-muted);
  }

  /* Everything below the title bar. Kept mounted when collapsed so no state
     is discarded. */
  .cp-body {
    display: flex; flex-direction: column; gap: var(--cp-gap); min-width: 0;
    /* min-height: 0 is load-bearing, here and on every element between the
       root and .cp-panel-host. A flex item defaults to min-height: auto, which
       refuses to shrink below its content — so a clamped root would overflow
       instead of letting the panel scroll. This is the usual reason a nested
       scroller silently does nothing. */
    flex: 1 1 auto; min-height: 0;
  }
  .cp-root[data-cp-collapsed="true"] .cp-body { display: none; }

  /* Zoom. No layout code and no measurement — two tokens change. */
  .cp-root[data-cp-size="expanded"] {
    --cp-width: 420px;
    --cp-disc-size: 260px;
    --cp-panel-h: 372px;
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

  /* The tab panel host — the ONLY scroll container inside the panel.
     There used to be a second one nested inside it (.cp-scroll). Two nested
     scroll ports is what broke scrolling outright on phones: the inner one was
     given "max-height: none" below 640px, which left it a scroll container
     that could not scroll, permanently sitting at its own boundary, where
     overscroll-behavior: contain blocks chaining. It swallowed every gesture
     over it rather than passing it up. One port cannot get into that state. */
  .cp-panel-host {
    display: flex; flex-direction: column;
    /* Does both jobs in one declaration: with room to spare the host is
       exactly --cp-panel-h, and when the root is clamped to the viewport it
       shrinks and scrolls instead of overflowing. */
    flex: 1 1 var(--cp-panel-h);
    min-height: 0;
    overflow-y: auto; overscroll-behavior: contain;

    /* A real scrollbar, not the fade mask this replaced.
       The mask had to sit on the scroll PORT to stay at the visual bottom
       edge, which meant it dimmed whatever happened to be there — including
       the image drop zone's border — in the four modes that do not scroll.
       A scrollbar appears only when there is genuinely more to see, which is
       the conditional behaviour the mask was imitating, for free.
       scrollbar-gutter: stable reserves the track in every mode, so the
       content width does not shift by the scrollbar's width when you switch
       to the one mode that scrolls. */
    scrollbar-gutter: stable;
    scrollbar-width: thin;
    scrollbar-color: var(--cp-border) transparent;
  }
  .cp-panel-host::-webkit-scrollbar { width: 8px; }
  .cp-panel-host::-webkit-scrollbar-track { background: transparent; }
  .cp-panel-host::-webkit-scrollbar-thumb {
    background: var(--cp-border); border-radius: 4px;
    border: 2px solid transparent; background-clip: content-box;
  }
  /* Nothing can jump when there is nothing to switch to, so a single-mode
     panel is content-sized and wastes no space. */
  .cp-root[data-cp-modes="1"] .cp-panel-host { flex-basis: auto; }

  .cp-panel {
    display: flex; flex-direction: column; gap: var(--cp-gap);
    flex: 1 1 auto; min-height: 0;
  }

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

  /* Retained as a public class and a layout wrapper, but NOT a scroll port
     any more — .cp-panel-host above is. The max-height, overflow, overscroll
     and the bottom fade mask all moved out with it; the mask in particular is
     meaningless on something that no longer scrolls, and dimmed the last 16px
     of content that was already fully visible.
     Anyone styling .cp-scroll keeps matching it; only the scrolling moved up
     one level. */
  .cp-scroll { min-height: 0; }

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
  /* Scrolls sideways rather than clipping. At 320px only seven of the ten
     stored swatches fit, and "overflow: hidden" made the other three
     unreachable with nothing to suggest they existed.
     Horizontal, so it cannot fight the vertical panel host; wrapping instead
     would make the footer height depend on the swatch count, which is the
     height swing this pass exists to remove. */
  .cp-recents {
    display: flex; gap: 6px; flex: 1; min-width: 0;
    margin: 0; padding: 0; list-style: none;
    overflow-x: auto; overflow-y: hidden;
    /* Also stops the gesture turning into an iOS back-swipe. */
    overscroll-behavior-x: contain;
    scrollbar-width: none;
  }
  .cp-recents::-webkit-scrollbar { display: none; }
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
  .cp-popover .cp-root {
    box-shadow: var(--cp-elevation);
    /* Written by Popover.place() from the room left on the chosen side.
       Without it a 479px panel opened 254px down a 420px viewport simply ran
       off the bottom with overflow: visible — the footer and its OK button
       were unreachable, in every mode. The fallback keeps this inert if the
       property is ever missing. */
    max-height: var(--cp-available-h, none);
  }

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
    /* The sheet itself no longer scrolls; .cp-panel-host does. That keeps the
       title bar and the footer pinned while the content moves under them,
       instead of scrolling the OK button off the screen. */
    overflow: hidden;
    background: var(--cp-surface);
    border-radius: var(--cp-radius-lg) var(--cp-radius-lg) 0 0;
    box-shadow: 0 -8px 32px rgb(0 0 0 / 35%);
    /* env() resolves to 0 unless the PAGE sets viewport-fit=cover, which a
       library cannot do; max() degrades cleanly either way. */
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
  /* The handle is only 5px tall; the hit area is not. */
  .cp-grabber::after {
    content: ""; position: absolute; left: 50%; translate: -50% 0;
    margin-top: -14px; width: 88px; height: 32px;
  }
  .cp-sheet { position: relative; }
  /* Inside a sheet the panel IS the surface: it must not draw its own
     rounded, shadowed card inside another one. */
  /* Any wrapper between the sheet and the panel has to pass the height
     constraint down instead of absorbing it. A flex item defaults to
     min-height: auto, so one unstyled div in the middle is enough to break the
     whole chain and push the footer into the clipped region. The universal
     rule is deliberate belt-and-braces: it keeps a future wrapper from
     reintroducing the same bug silently. */
  .cp-dialog { display: flex; flex-direction: column; min-height: 0; min-width: 0; }
  .cp-sheet > *, .cp-sheet .cp-dialog { min-height: 0; }
  .cp-sheet > .cp-dialog { flex: 1 1 auto; }

  .cp-sheet .cp-root {
    width: 100%; max-width: none;
    border-radius: 0; box-shadow: none; background: transparent;
    /* Fill the sheet so the panel host, not the sheet, owns the overflow. */
    flex: 1 1 auto; min-height: 0;
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

  /* Grows into whatever the fixed panel height leaves over. Image is the
     shortest mode by a long way, so pinning it to the top would leave an
     obvious void; filling the space makes it a large drop target instead, and
     the constant height reads as deliberate rather than as dead space. */
  .cp-empty {
    margin: 0;
    color: var(--cp-text-muted); padding: 20px 12px; text-align: center; font-size: 12px;
    flex: 1 1 auto; min-height: 0;
    display: flex; align-items: center; justify-content: center;
    border: 1px dashed var(--cp-border);
    border-radius: var(--cp-radius);
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
    /* The taller inputs below are the entire reason the wheel measures 6px
       more here than on a mouse, so the panel height moves with them. */
    .cp-root {
      --cp-control-height: 34px; --cp-input-height: 34px; --cp-thumb-size: 22px;
      --cp-panel-h: 340px;
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
    /* Overlapping hit areas are worse than small ones, so the dots and the
       gap both grow. At a 30px pitch the 24px target circles no longer
       intersect, which is what WCAG's spacing exception asks for. */
    .cp-titlebar { --cp-light-size: 20px; --cp-light-gap: 10px; }
    .cp-light-glyph { width: 11px; height: 11px; }
    /* 20 + 10 = 30px pitch, comfortably clear of the 24px requirement. */
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
    /* ".cp-scroll { max-height: none }" used to live here. It turned the
       inner wrapper into a scroll container that could not scroll, which — via
       overscroll-behavior: contain — swallowed every touch and wheel gesture
       over it instead of chaining to the sheet. Palettes was then genuinely
       unscrollable on a phone. The wrapper is not a scroll port any more, so
       there is nothing left to override. */
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
