# chroma-panel

## 1.0.0

### Major Changes

- Add a dependency-free CSS Color 4 engine for OKLCH, OKLab, Lab, LCH, sRGB and
  Display P3, including conversion, serialization, gamut detection and perceptual
  gamut mapping.
- Add an accessible standalone gradient editor and gradient model utilities with
  linear/radial gradients, editable stops and perceptual interpolation.
- Add source-aware `onValueChange` and `onValueCommit` events while preserving the
  existing `onChange` and `onChangeComplete` callbacks.
- Add alpha-aware contrast measurement, accessible-color suggestions and exports
  for CSS variables, SCSS variables, Tailwind colors and design tokens.
- Add pasted-image input and population, luminance or hue sorting to image mode.
- Add explicit built-in mode objects through `chroma-panel/modes`, plus focused
  `color`, `gradient` and `export` entry points for smaller application bundles.

## 0.2.0

### Minor Changes

- Add exact image pixel picking with an accessible zoom preview, safer configurable
  image limits, and an optional copy-color footer control. Expand bundle checks with
  Brotli reporting and budgets for every public feature entry point.

## 0.1.4

### Patch Changes

- Keep filtered palette results directly below the search field in tall inline
  panels. The search field no longer grows into the panel's unused vertical space.
  
  Refresh the package description, discovery keywords and documented bundle sizes.

## 0.1.3

### Patch Changes

- 422ac8c: The npm page's Homepage link now opens the documentation site,
  [chroma-panel.jscrate.dev](https://chroma-panel.jscrate.dev).

  - The README links each mode, guide and FAQ to its page on the docs site
  - New README screenshots show the "Colors" title and the image mode with a
    palette extracted from a photo
  - The package description matches the docs site, and the author link is now
    https://me.jscrate.dev
- 88ed032: The image mode's file input keeps an accessible name after an image is loaded.
  The drop zone's label names it until then; once the preview replaces the drop
  zone, the input is named "Choose a different image" and leaves the tab order,
  since nothing on screen would show it had focus. Accessibility checkers no
  longer report "Form elements must have labels" for a loaded image.

## 0.1.2

### Patch Changes

- Use the American spelling "color" throughout. The default `title` is now
  `'Colors'`, the default `ColorInput` `aria-label` is `'Choose a color'`, and the
  accessible names (Color wheel, Color model, Recent colors, Pick a color from the
  screen, Extracted colors) and the native validation message follow suit. If your
  tests query these by accessible name, update them to the new spelling.

## 0.1.1

### Patch Changes

- 0912a45: Replace the package-size badge in the README. The bundlephobia badge shields.io
  serves is rate limited across the whole registry, so it rendered as an error
  rather than a number. It now reports unpacked install size, read straight from
  the npm registry.

## 0.1.0

First release.

A React color picker with the look and feel of the macOS color panel.

### Picking

- Five modes: wheel, sliders, palettes, image sampling, and a 120-color pencil grid
- `ColorInput` opens the panel in a popover; `ChromaPanel` renders it inline
- Recent colors, tracked by the panel or by you
- Eyedropper, where the browser has the `EyeDropper` API

### Color handling

- Full HSVA is kept internally and merged rather than replaced, so dragging a channel
  to an extreme and back returns the color you started with
- `onChange` while dragging, batched to one call per animation frame;
  `onChangeComplete` once per gesture
- Parses hex, `rgb()`, `hsl()`, `hwb()`, `transparent` and optional CSS color names
- Reads and writes hex, hexa, rgb, rgba, hsl and hsla

### Forms

- `ColorInput` submits with `name`, honors `form`, `required`, `readOnly` and
  `<fieldset disabled>`, and restores `defaultValue` on `form.reset()`
- `validationBehavior` chooses between native browser validation and leaving it to
  your form library

### Images

- `extractPalette` pulls a palette from a file, blob or URL
- Large images are downscaled before reading
- Optional worker entry point for larger sample sizes

### Accessibility

- Every color axis is a real `<input type="range">`, so keyboard and screen-reader
  support come from the browser
- Tablist mode switcher with a roving tab stop
- Focus trapped in the popover, Escape closes and returns focus to the trigger
- `prefers-reduced-motion` and forced-colors mode both handled

### Packaging

- No runtime dependencies
- ESM and CommonJS, TypeScript types included
- Per-mode entry points, so importing `chroma-panel/panel` plus one mode ships less
  than the full package
- Server-render safe; browser-dependent files carry `'use client'`
- Styles are injected automatically, or import `chroma-panel/styles.css` and pass
  `injectStyles={false}`
