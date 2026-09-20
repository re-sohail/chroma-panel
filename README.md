[![chroma-panel, a React color picker: a color wheel, a photo with the palette extracted from it, and a 120-color pencil grid](https://raw.githubusercontent.com/re-sohail/chroma-panel/main/assets/hero.png)](https://chroma-panel.jscrate.dev)

[![npm](https://img.shields.io/npm/v/chroma-panel?color=2d7ff9)](https://www.npmjs.com/package/chroma-panel)
<!-- [![install size](https://img.shields.io/npm/unpacked-size/chroma-panel?color=2d7ff9&label=install%20size)](https://www.npmjs.com/package/chroma-panel) -->
[![downloads](https://img.shields.io/npm/dw/chroma-panel?color=2d7ff9)](https://www.npmjs.com/package/chroma-panel)
[![docs](https://img.shields.io/badge/docs-chroma--panel.jscrate.dev-2d7ff9)](https://chroma-panel.jscrate.dev)
[![license](https://img.shields.io/npm/l/chroma-panel?color=2d7ff9)](./LICENSE)

# chroma-panel — React color picker

A React color picker for forms, toolbars, settings, and design tools. Use a small color input or render the full panel with a wheel, RGB and HSL sliders, searchable palettes, image sampling, opacity, and an eyedropper.

Version 1 also includes CSS Color 4 tools, a gradient editor, contrast suggestions, and design-token exports. The package has no runtime dependencies and includes TypeScript types.

**[Documentation and live demo](https://chroma-panel.jscrate.dev)** · [Quick start](https://chroma-panel.jscrate.dev/react/overview/quick-start) · [Comparison](https://chroma-panel.jscrate.dev/react/overview/comparison) · [FAQ](https://chroma-panel.jscrate.dev/react/overview/faq) · [Releases](https://chroma-panel.jscrate.dev/react/overview/releases)

- Five ways to pick a color: a [wheel](https://chroma-panel.jscrate.dev/react/modes/wheel), [RGB, HSL and HSB sliders](https://chroma-panel.jscrate.dev/react/modes/sliders), [palettes](https://chroma-panel.jscrate.dev/react/modes/palettes), a [120-color pencil grid](https://chroma-panel.jscrate.dev/react/modes/pencils), and [sampling from an image](https://chroma-panel.jscrate.dev/react/modes/image)
- Hex, RGB(A), HSL(A), HSB/HSV and opacity controls for exact color values
- An [eyedropper](https://chroma-panel.jscrate.dev/react/utils/use-eyedropper) for grabbing a color from anywhere on screen in supported browsers
- Drops into a [form](https://chroma-panel.jscrate.dev/react/handbook/forms) like an `<input>`, with `name`, `required` and `form.reset()`
- [Accessible](https://chroma-panel.jscrate.dev/react/overview/accessibility): every color channel is a real range input, so keyboards and screen readers work
- No runtime dependencies, TypeScript types included, ESM and CommonJS
- CSS Color 4: OKLCH, OKLab, Lab, LCH and Display P3 parsing, conversion and gamut mapping
- A standalone, keyboard-accessible gradient editor with perceptual interpolation
- Alpha-aware contrast checks, accessible-color suggestions and CSS/SCSS/design-token exports

## Install

```bash
npm install chroma-panel
```

## Usage

```tsx
import { useState } from 'react';
import { ColorInput } from 'chroma-panel';

export function Example() {
  const [color, setColor] = useState('#3366cc');

  return (
    <ColorInput
      value={color}
      onChange={(c) => setColor(c.hex)}
      onChangeComplete={(c) => save(c.hex)}
    />
  );
}
```

No CSS import and no provider. [`ColorInput`](https://chroma-panel.jscrate.dev/react/components/color-input) renders a swatch button that opens the panel in a popover.

`onChange` fires continuously while you drag, `onChangeComplete` once when you let go. [Which to use](https://chroma-panel.jscrate.dev/react/handbook/controlled#onchange-vs-onchangecomplete).

## Inline panel

[`ChromaPanel`](https://chroma-panel.jscrate.dev/react/components/chroma-panel) is the same panel without the popover, for when you want it on the page:

```tsx
import { ChromaPanel } from 'chroma-panel';

<ChromaPanel defaultValue="#3366cc" modes={['wheel']} showTitleBar={false} />
```

## Pick colors from an image

The image mode takes a dropped, pasted or chosen file, shows its dominant colors as swatches, and lets you click an exact pixel through a zoom lens. Palettes can be ordered by population, luminance or hue. The sampler behind it is exported too, for when you want the palette without the panel:

```ts
import { extractPalette } from 'chroma-panel';

const { swatches } = await extractPalette(file, { maxColors: 8 });
// [{ hex: '#3e5f8a', rgb: [62, 95, 138], population: 4213 }, ...]
```

It takes a `File`, a `Blob` or an image URL, validates safe size limits, and reads only a downscaled sampling surface. More in the [image mode docs](https://chroma-panel.jscrate.dev/react/modes/image).

## Import fewer modes

Importing `chroma-panel` registers all five modes. If you only need one or two, import the shell and pass explicit mode objects:

```tsx
import { ChromaPanel } from 'chroma-panel/panel';
import { wheelMode } from 'chroma-panel/modes';

<ChromaPanel modes={[wheelMode]} />
```

The original side-effect import (`import 'chroma-panel/wheel'`) remains supported. Explicit mode objects are easier for bundlers to analyze. Every mode also has its own entry point — see [entry points](https://chroma-panel.jscrate.dev/react/utils/entry-points).

## New in 1.0

The color engine reads OKLCH, OKLab, Lab, LCH, sRGB and Display P3, while preserving the source space and mapping wide-gamut colors perceptually:

```ts
import { parseColor, convertColor, isInGamut, mapToGamut, serializeColor } from 'chroma-panel/color';

const color = parseColor('oklch(72% 0.18 250)')!;
const fallback = isInGamut(color, 'srgb') ? color : mapToGamut(color, 'srgb');
```

`chroma-panel/gradient` adds a keyboard-accessible linear/radial gradient editor with perceptual interpolation. `chroma-panel/export` produces CSS, SCSS, Tailwind and design-token output. Alpha-aware contrast suggestions are available from `chroma-panel/contrast`.

The original change callbacks remain intact. `onValueChange` and `onValueCommit` add metadata that identifies pointer, keyboard, field, swatch, image, eyedropper, recent-color and programmatic changes. See the [v1 API reference](docs/api.md).

## Theming

![The chroma-panel React color picker in light and dark themes: the color wheel on a light page and the RGB sliders on a dark one](https://raw.githubusercontent.com/re-sohail/chroma-panel/main/assets/themes.png)

The panel follows the system color scheme. To change how it looks, override the CSS variables or pass your own class per part:

```tsx
<ColorInput classNames={{ root: 'shadow-2xl', trigger: 'h-8 w-12' }} />
```

Full details in the [theming guide](https://chroma-panel.jscrate.dev/react/handbook/theming). Using Tailwind? See [styling with Tailwind](https://chroma-panel.jscrate.dev/react/handbook/tailwind).

## Size

Measured as the increase in a real Vite production build, gzipped, with React external.

| What you import | Added to your app |
| --- | --- |
| all five modes | 23.1 kB |
| shell plus one mode | 15.0 kB |

`dependencies` is empty. `react` and `react-dom` are peer dependencies, so the copy already in your app is the one that gets used.

## Compatibility

| | |
| --- | --- |
| React | 16.14 and newer, including 19 |
| React DOM | Required. The popover renders through `createPortal` |
| Browsers | Chrome 123, Firefox 120, Safari 17.5 |
| TypeScript | Types included, no `@types` package needed |
| Modules | ESM and CommonJS |
| Server rendering | Safe. Browser-dependent files are marked `'use client'`. [Next.js and SSR](https://chroma-panel.jscrate.dev/react/handbook/server-rendering) |

The browser versions come from `light-dark()`, a CSS function the stylesheet relies on. [What happens on older browsers](https://chroma-panel.jscrate.dev/react/handbook/browser-support).

## Help

- Documentation: [chroma-panel.jscrate.dev](https://chroma-panel.jscrate.dev), including the [FAQ](https://chroma-panel.jscrate.dev/react/overview/faq) and [common mistakes](https://chroma-panel.jscrate.dev/react/handbook/common-mistakes)
- Reference in this repository: [API](docs/api.md) and [guides](docs/guides.md)
- Questions and bug reports: [github.com/re-sohail/chroma-panel/issues](https://github.com/re-sohail/chroma-panel/issues)

## License

MIT © [Sohail Khan](https://me.jscrate.dev)
