![chroma-panel, a React color picker](https://raw.githubusercontent.com/re-sohail/chroma-panel/main/assets/hero.png)

[![npm](https://img.shields.io/npm/v/chroma-panel?color=2d7ff9)](https://www.npmjs.com/package/chroma-panel)
[![gzipped](https://img.shields.io/bundlephobia/minzip/chroma-panel?color=2d7ff9&label=gzipped)](https://bundlephobia.com/package/chroma-panel)
[![downloads](https://img.shields.io/npm/dw/chroma-panel?color=2d7ff9)](https://www.npmjs.com/package/chroma-panel)
[![licence](https://img.shields.io/npm/l/chroma-panel?color=2d7ff9)](./LICENSE)

# chroma-panel

A React color picker with the look and feel of the macOS color panel.

- Five ways to pick: wheel, sliders, palettes, a 120-color pencil grid, and sampling from an image
- An eyedropper for grabbing a color from anywhere on screen, where the browser supports it
- Drops into a form like an `<input>`, with `name`, `required` and `form.reset()`
- No runtime dependencies, TypeScript types included, ESM and CommonJS

**[API reference](docs/api.md)** · **[Guide](docs/guides.md)**

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

No CSS import and no provider. `ColorInput` renders a swatch button that opens the panel in a popover.

`onChange` fires continuously while you drag, `onChangeComplete` once when you let go. [Which to use](docs/api.md#onchange-vs-onchangecomplete).

## Inline panel

`ChromaPanel` is the same panel without the popover, for when you want it on the page:

```tsx
import { ChromaPanel } from 'chroma-panel';

<ChromaPanel defaultValue="#3366cc" modes={['wheel']} showTitleBar={false} />
```

## Smaller bundle

Importing `chroma-panel` registers all five modes. If you only need one or two, import the shell and add them yourself:

```tsx
import { ChromaPanel } from 'chroma-panel/panel';
import 'chroma-panel/wheel';

<ChromaPanel modes={['wheel']} />
```

That is 14.1 kB instead of 22.2 kB. Every mode has its own entry point — see [entry points](docs/api.md#entry-points).

## Theming

![The chroma-panel color picker in light and dark themes](https://raw.githubusercontent.com/re-sohail/chroma-panel/main/assets/themes.png)

The panel follows the system color scheme. To change how it looks, override the CSS variables or pass your own class per part:

```tsx
<ColorInput classNames={{ root: 'shadow-2xl', trigger: 'h-8 w-12' }} />
```

Full details in the [theming guide](docs/guides.md#theming).

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
| Server rendering | Safe. Browser-dependent files are marked `'use client'` |

The browser versions come from `light-dark()`, a CSS function the stylesheet relies on. [What happens on older browsers](docs/guides.md#browser-support).

## Help

Questions and bug reports: [github.com/re-sohail/chroma-panel/issues](https://github.com/re-sohail/chroma-panel/issues)

## Licence

MIT © [Sohail Khan](https://resohail.me)
