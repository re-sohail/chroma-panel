![chroma-panel, a React color picker](https://raw.githubusercontent.com/re-sohail/chroma-panel/main/assets/hero.png)![npm](https://img.shields.io/npm/v/chroma-panel?color=2d7ff9)![gzipped](https://img.shields.io/bundlephobia/minzip/chroma-panel?color=2d7ff9&label=gzipped)![downloads](https://img.shields.io/npm/dw/chroma-panel?color=2d7ff9)![licence](https://img.shields.io/npm/l/chroma-panel?color=2d7ff9)\# chroma-panel

chroma-panel is a React color picker with the look and feel of the macOS color panel.

- Five modes: wheel, sliders, palettes, image, and a 120-color pencil grid
- No dependencies. Types included. ESM and CommonJS
- React does not re-render while you drag, so it stays smooth
- React 16.14 and newer. Works with SSR. Full keyboard support

[**API**](https://github.com/re-sohail/chroma-panel/blob/main/docs/api.md) · [**Guides**](https://github.com/re-sohail/chroma-panel/blob/main/docs/guides.md)

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

![The chroma-panel color picker in light and dark themes](https://raw.githubusercontent.com/re-sohail/chroma-panel/main/assets/themes.png)The panel follows the system color scheme. Override the CSS variables, or pass your own class per slot:

```tsx
<ColorInput classNames={{ root: 'shadow-2xl', trigger: 'h-8 w-12' }} />
```

See the [Guides](https://github.com/re-sohail/chroma-panel/blob/main/docs/guides.md) for theming, image sampling, mobile and accessibility.

## Your hue survives

Most React color pickers store the color as RGB or hex. That throws information away.

Drag brightness down to black, then back up. In those pickers the hue returns as red. Here it comes back as the hue you picked.

chroma-panel keeps the full HSVA value and never rounds it on the way through.

## Size

Measured as the increase in a real Vite production build, gzipped, with React external.

| Title | added to your app |
| --- | --- |
| all five modes | 22.2 kB |
| shell plus one mode | 14.1 kB |

No runtime dependencies either way.

## Licence

MIT © [Sohail Khan](https://resohail.me)