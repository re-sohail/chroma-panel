[![chroma-panel, a React color picker: a color wheel, a photo with the palette extracted from it, and a 120-color pencil grid](https://raw.githubusercontent.com/re-sohail/chroma-panel/main/assets/hero.png)](https://chroma-panel.jscrate.dev)

[![npm](https://img.shields.io/npm/v/chroma-panel?color=2d7ff9)](https://www.npmjs.com/package/chroma-panel)
[![install size](https://img.shields.io/npm/unpacked-size/chroma-panel?color=2d7ff9&label=install%20size)](https://www.npmjs.com/package/chroma-panel)
[![downloads](https://img.shields.io/npm/dw/chroma-panel?color=2d7ff9)](https://www.npmjs.com/package/chroma-panel)
[![docs](https://img.shields.io/badge/docs-chroma--panel.jscrate.dev-2d7ff9)](https://chroma-panel.jscrate.dev)
[![license](https://img.shields.io/npm/l/chroma-panel?color=2d7ff9)](./LICENSE)

# chroma-panel

A React color picker component with the look and feel of the macOS color panel: a color wheel, sliders, palettes, color sampling from an image, and an eyedropper.

**[Documentation and live demo](https://chroma-panel.jscrate.dev)** · [Quick start](https://chroma-panel.jscrate.dev/react/overview/quick-start) · [Comparison](https://chroma-panel.jscrate.dev/react/overview/comparison) · [FAQ](https://chroma-panel.jscrate.dev/react/overview/faq) · [Releases](https://chroma-panel.jscrate.dev/react/overview/releases)

- Five ways to pick a color: a [wheel](https://chroma-panel.jscrate.dev/react/modes/wheel), [RGB, HSL and HSB sliders](https://chroma-panel.jscrate.dev/react/modes/sliders), [palettes](https://chroma-panel.jscrate.dev/react/modes/palettes), a [120-color pencil grid](https://chroma-panel.jscrate.dev/react/modes/pencils), and [sampling from an image](https://chroma-panel.jscrate.dev/react/modes/image)
- An [eyedropper](https://chroma-panel.jscrate.dev/react/utils/use-eyedropper) for grabbing a color from anywhere on screen, where the browser supports it
- Drops into a [form](https://chroma-panel.jscrate.dev/react/handbook/forms) like an `<input>`, with `name`, `required` and `form.reset()`
- [Accessible](https://chroma-panel.jscrate.dev/react/overview/accessibility): every color channel is a real range input, so keyboards and screen readers work
- No runtime dependencies, TypeScript types included, ESM and CommonJS

## Install

```bash
npm install chroma-panel
```

## Use it

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

The image mode takes a dropped or chosen file and shows its dominant colors as swatches. The sampler behind it is exported too, for when you want the palette without the panel:

```ts
import { extractPalette } from 'chroma-panel';

const { swatches } = await extractPalette(file, { maxColors: 8 });
// [{ hex: '#3e5f8a', rgb: [62, 95, 138], population: 4213 }, ...]
```

It takes a `File`, a `Blob` or an image URL, and downscales large images before reading them. More in the [image mode docs](https://chroma-panel.jscrate.dev/react/modes/image).

## Smaller bundle

Importing `chroma-panel` registers all five modes. If you only need one or two, import the shell and add them yourself:

```tsx
import { ChromaPanel } from 'chroma-panel/panel';
import 'chroma-panel/wheel';

<ChromaPanel modes={['wheel']} />
```

That is 14.1 kB instead of 22.2 kB. Every mode has its own entry point — see [entry points](https://chroma-panel.jscrate.dev/react/utils/entry-points).

## Theming

![The chroma-panel React color picker in light and dark themes: the color wheel on a light page and the RGB sliders on a dark one](https://raw.githubusercontent.com/re-sohail/chroma-panel/main/assets/themes.png)

The panel follows the system color scheme. To change how it looks, override the CSS variables or pass your own class per part:

```tsx
<ColorInput classNames={{ root: 'shadow-2xl', trigger: 'h-8 w-12' }} />
```

Full details in the [theming guide](https://chroma-panel.jscrate.dev/react/handbook/theming). Using Tailwind? See [styling with Tailwind](https://chroma-panel.jscrate.dev/react/handbook/tailwind).

## Why the color survives a round trip

HSV has two places where information disappears. At zero saturation there is no hue to speak of, and at zero brightness there is neither. Pickers that keep their state as RGB or hex hit this constantly: drag brightness to black and back up, and the hue you picked comes back as red.

This one keeps the full HSVA value and merges changes into it instead of replacing it, so dragging to an extreme and back returns the color you started with.

## Size

Measured as the increase in a real Vite production build, gzipped, with React external.

| What you import | Added to your app |
| --- | --- |
| all five modes | 22.2 kB |
| shell plus one mode | 14.1 kB |

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
