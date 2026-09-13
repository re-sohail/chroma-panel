![chroma-panel, a React color picker](https://raw.githubusercontent.com/re-sohail/chroma-panel/main/assets/hero.png)

[![npm](https://img.shields.io/npm/v/chroma-panel?color=2d7ff9)](https://www.npmjs.com/package/chroma-panel)
[![gzipped](https://img.shields.io/bundlephobia/minzip/chroma-panel?color=2d7ff9&label=gzipped)](https://bundlephobia.com/package/chroma-panel)
[![downloads](https://img.shields.io/npm/dw/chroma-panel?color=2d7ff9)](https://www.npmjs.com/package/chroma-panel)
[![licence](https://img.shields.io/npm/l/chroma-panel?color=2d7ff9)](./LICENSE)

# chroma-panel

chroma-panel is a React color picker with the look and feel of the macOS color panel.

Pick a color from a wheel, from sliders, from a palette, or straight out of an image. It keeps the exact color you chose instead of rounding it away, and it does not re-render React while you drag.

- Five modes: wheel, sliders, palettes, image, and a 120-color pencil grid
- Pull a palette out of any image, or sample the screen with the eyedropper
- No runtime dependencies. TypeScript types included. ESM and CommonJS
- Works as a form input, server-renders safely, keyboard operable throughout

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

That is the whole setup. No CSS import, no provider.

`onChange` fires while you drag. `onChangeComplete` fires once, when you let go. Use the first for live preview, the second for anything you save.

## Inline panel

Skip the popover and render the panel on the page:

```tsx
import { ChromaPanel } from 'chroma-panel';

<ChromaPanel defaultValue="#3366cc" modes={['wheel']} showTitleBar={false} />
```

## Smaller bundle

The main entry loads all five modes. Import the shell and pick your own instead:

```tsx
import { ChromaPanel } from 'chroma-panel/panel';
import 'chroma-panel/wheel';

<ChromaPanel modes={['wheel']} />
```

That is 14.1 kB instead of 22.2 kB. Each mode you add costs only itself.

## Theming

![The chroma-panel color picker in light and dark themes](https://raw.githubusercontent.com/re-sohail/chroma-panel/main/assets/themes.png)

The panel follows the system color scheme. Override the CSS variables, or pass your own class per slot:

```tsx
<ColorInput classNames={{ root: 'shadow-2xl', trigger: 'h-8 w-12' }} />
```

Styles are injected for you. To load the CSS yourself, import `chroma-panel/styles.css` and pass `injectStyles={false}`.

See the [guide](docs/guides.md) for theming, image sampling, mobile and accessibility, and the [API reference](docs/api.md) for every export.

## Your hue survives

Most React color pickers store the color as RGB or hex. That throws information away.

Drag brightness down to black, then back up. In those pickers the hue returns as red. Here it comes back as the hue you picked.

chroma-panel keeps the full HSVA value and never rounds it on the way through.

## Size

Measured as the increase in a real Vite production build, gzipped, with React external.

| What you import | Added to your app |
| --- | --- |
| all five modes | 22.2 kB |
| shell plus one mode | 14.1 kB |

`dependencies` is empty. `react` and `react-dom` are peer dependencies, so you use the copy already in your app.

## Compatibility

| | |
| --- | --- |
| React | 16.14 and newer, including 19 |
| React DOM | Required. The popover uses `createPortal` |
| Browsers | Chrome 123, Firefox 120, Safari 17.5 |
| TypeScript | Types included, no `@types` package needed |
| Modules | ESM and CommonJS |
| Server rendering | Safe. Browser-dependent files are marked `'use client'` |

The browser floor comes from the `light-dark()` CSS function the stylesheet uses. The eyedropper needs the browser's `EyeDropper` API, which today means Chromium, so that one button is hidden where it is unavailable. Details in the [guide](docs/guides.md#browser-support).

## Help

Found a bug, or something unclear? [Open an issue](https://github.com/re-sohail/chroma-panel/issues).

## Licence

MIT © [Sohail Khan](https://resohail.me)
