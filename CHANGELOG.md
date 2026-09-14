# chroma-panel

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
