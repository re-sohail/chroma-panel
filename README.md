![chroma-panel](https://raw.githubusercontent.com/re-sohail/chroma-panel/main/assets/hero.png)

[![npm](https://img.shields.io/npm/v/chroma-panel?color=2d7ff9)](https://www.npmjs.com/package/chroma-panel)
[![gzipped](https://img.shields.io/bundlephobia/minzip/chroma-panel?color=2d7ff9&label=gzipped)](https://bundlephobia.com/package/chroma-panel)
[![downloads](https://img.shields.io/npm/dw/chroma-panel?color=2d7ff9)](https://www.npmjs.com/package/chroma-panel)
[![licence](https://img.shields.io/npm/l/chroma-panel?color=2d7ff9)](./LICENSE)

# chroma-panel

chroma-panel is a colour picker for React with the feel of the macOS colour panel.

- Five modes: wheel, sliders, palettes, image sampling, and a 120-colour pencil grid
- Zero runtime dependencies, types included, ESM and CommonJS
- Dragging renders React zero times
- React 16.14 to 19, server-rendering safe, keyboard operable throughout

**[API](https://github.com/re-sohail/chroma-panel/blob/main/docs/api.md)** ·
**[Guides](https://github.com/re-sohail/chroma-panel/blob/main/docs/guides.md)**

```bash
npm install chroma-panel
```

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

## Inline, without the popover

```tsx
import { ChromaPanel } from 'chroma-panel';

<ChromaPanel defaultValue="#3366cc" modes={['wheel']} showTitleBar={false} />
```

## Ship fewer modes

The main entry registers all five. Import the shell and only the modes you use:

```tsx
import { ChromaPanel } from 'chroma-panel/panel';
import 'chroma-panel/wheel';

<ChromaPanel modes={['wheel']} />
```

That is 13.9 kB instead of 21.9. Each extra mode you import adds its own weight
and nothing else.

## Theming

![Light and dark](https://raw.githubusercontent.com/re-sohail/chroma-panel/main/assets/themes.png)

The panel follows the system colour scheme. Override any of the CSS custom
properties, or pass your own classes per slot:

```tsx
<ColorInput classNames={{ root: 'shadow-2xl', trigger: 'h-8 w-12' }} />
```

See **[Guides](https://github.com/re-sohail/chroma-panel/blob/main/docs/guides.md)**
for theming, window controls, image sampling, mobile and accessibility.

## Why not one of the others?

Most React pickers store colour as RGB or hex. In HSV, hue is undefined when
saturation is zero and saturation is undefined when brightness is zero, so a
trip through RGB destroys them. Drag brightness to zero and back, and the hue
you chose comes back as red. chroma-panel keeps unrounded float HSVA and merges
incoming values rather than replacing them.

## What it costs

Measured as the delta a real Vite production build gains by adding each one,
React external and gzipped, all five built the same way on the same day:

| | added to your app | deps | modes |
| --- | --- | --- | --- |
| [react-colorful](https://www.npmjs.com/package/react-colorful) | 3.7 kB | 0 | one |
| [@uiw/react-color](https://www.npmjs.com/package/@uiw/react-color) (`Sketch`) | 7.5 kB | 20 | several |
| [@rc-component/color-picker](https://www.npmjs.com/package/@rc-component/color-picker) | 8.7 kB | 3 | one |
| chroma-panel, shell + one mode | 13.9 kB | 0 | one |
| **chroma-panel, everything** | **21.9 kB** | **0** | **five** |

**chroma-panel is the largest here.** Five modes, a bottom sheet, an image
quantiser and the stylesheet all cost something, and the table is the honest
version of that. If you want one picker and every kilobyte counts, use
react-colorful — it is excellent, and it is a fifth of the size.

Reach for this one when you want several modes in one panel, no dependencies,
or the colour to survive the extremes. And if you only need one or two modes,
[ship only those](https://github.com/re-sohail/chroma-panel/blob/main/docs/guides.md)
and pay 13.9 kB instead of 21.9.

## Licence

MIT © [Sohail Khan](https://resohail.me)
