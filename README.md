# chroma-panel

A colour picker for React with the feel of the macOS colour panel — a wheel, sliders, palettes, image sampling and a pencil grid, in one accessible component with **no runtime dependencies**.

[![npm](https://img.shields.io/npm/v/chroma-panel?color=2d7ff9)](https://www.npmjs.com/package/chroma-panel)
[![bundle size](https://img.shields.io/bundlephobia/minzip/chroma-panel?color=2d7ff9&label=gzipped)](https://bundlephobia.com/package/chroma-panel)
![dependencies](https://img.shields.io/badge/dependencies-0-2d7ff9)
[![licence](https://img.shields.io/npm/l/chroma-panel?color=2d7ff9)](./LICENSE)

![The panel in wheel, sliders and pencils modes](https://raw.githubusercontent.com/re-sohail/chroma-panel/main/assets/hero.png)

```bash
npm install chroma-panel
```

```tsx
import { useState } from 'react';
import { ColorInput } from 'chroma-panel';

export function Example() {
  const [color, setColor] = useState('#3366cc');

  return <ColorInput value={color} onChange={(c) => setColor(c.hex)} />;
}
```

That's the whole setup. There's no CSS file to import and no provider to wrap your app in.

---

## Why you might want it

`<input type="color">` hands off to an operating-system window. On macOS that's Apple's own colour panel, which is why it looks nothing like the rest of your app and why you can't restyle it. To get the same picker on every browser and OS, it has to be built in the page.

Most React pickers that do this share one flaw: they store colour as RGB or hex. In HSV, hue is undefined when saturation is zero and saturation is undefined when brightness is zero — so every trip through RGB destroys it. Drag brightness to zero and back, and the hue you chose comes back as red.

chroma-panel keeps unrounded float HSVA and merges incoming values instead of replacing them, so those components survive. There's a test for each way it used to break.

The second difference is the drag loop. Most pickers call `setState` on every pointer move, which at 120 Hz means 120 renders a second — through your app too, if you lifted the value. This one drives an external store and writes to the DOM directly: **dragging renders React zero times.** That's asserted in a browser test, not just claimed.

## What's in it

- **Five modes** — colour wheel, RGB/HSL/HSB sliders, palettes, image sampling, and a 120-colour pencil grid
- **Zero dependencies**, ESM and CommonJS, typed
- **Keyboard operable throughout** — every axis is a real range input, so arrows, Home/End and screen readers work
- **Light and dark**, themed with CSS custom properties
- **A bottom sheet on phones**, an anchored popover on desktop
- **Server-rendering safe**, with `"use client"` on every client module
- **An eyedropper**, where the browser supports one

## Size

Measured by building a real Vite app with and without it, React external, minified and gzipped:

| What you import | Adds to your bundle |
| --- | --- |
| `chroma-panel/core` — colour maths, no React | **2.2 KB** |
| `chroma-panel/panel` + one mode | **8.5 KB** |
| `chroma-panel` — all five modes | **13.9 KB** |

For comparison, measured the same way: `react-colorful` 4.8 KB for one mode, `@rc-component/color-picker` 6.6 KB for one mode, `@uiw/react-color` 15.7 KB with 20 dependencies.

About 3.5 KB of each figure is the stylesheet, which is inlined so the picker works without a CSS import.

---

## Usage

### A swatch that opens a popover

```tsx
<ColorInput
  value={color}
  onChange={(c) => setColor(c.hex)}        // while dragging
  onChangeComplete={(c) => save(c.hex)}    // once, when it settles
  modes={['wheel', 'sliders', 'palettes', 'image', 'pencils']}
  format="hex"
  showAlpha
  name="brandColor"                        // submits with the surrounding form
/>
```

### An inline panel

```tsx
import { ChromaPanel } from 'chroma-panel';

<ChromaPanel defaultValue="#3366cc" modes={['wheel']} showTitleBar={false} />
```

### Only the modes you need

The main entry registers all five. To ship fewer, import the shell and each mode separately:

```tsx
import { ChromaPanel } from 'chroma-panel/panel';
import 'chroma-panel/wheel';
import 'chroma-panel/sliders';

<ChromaPanel modes={['wheel', 'sliders']} />
```

### Colour maths without React

`chroma-panel/core` is safe in a worker, on a server, or as a standalone colour library.

```ts
import { parse, toHex, toHexa } from 'chroma-panel/core';

parse('hsl(210 60% 50%)');            // → { h: 210, s: 60, v: 80, a: 1 }
toHexa(parse('rgb(255 0 0 / 50%)'));  // → '#ff000080'
```

---

## onChange vs onChangeComplete

`onChange` fires continuously while dragging, batched to one call per animation frame. `onChangeComplete` fires once — on pointer release, key release, or blur.

Use `onChange` for live preview, and `onChangeComplete` for anything expensive: a network request, an undo entry, a database write.

> **If you drive the picker from state**, remember `onChange` fires around 60 times a second. Putting it straight into a `useState` at the root of a large tree will re-render that tree 60 times a second. The picker stays fast; your app might not. Either keep the state local, or update from `onChangeComplete`.

Both receive the same object:

```ts
interface ColorChangeResult {
  hex: string;    // '#3366cc'
  hexa: string;   // '#3366ccff'
  rgb: { r: number; g: number; b: number };
  rgba: { r: number; g: number; b: number; a: number };
  hsl: { h: number; s: number; l: number };
  hsla: { h: number; s: number; l: number; a: number };
  hsva: { h: number; s: number; v: number; a: number };  // unrounded
  css: string;    // serialised per `format`
}
```

`hsva` is the internal value, unrounded. Everything else is a rounded projection of it — so if you need precision across a round trip, store `hsva`.

---

## Props

Both `ColorInput` and `ChromaPanel` take these.

| Prop | Type | Default |
| --- | --- | --- |
| `value` | `string` | — |
| `defaultValue` | `string` | `'#ffffff'` |
| `onChange` | `(c: ColorChangeResult) => void` | — |
| `onChangeComplete` | `(c: ColorChangeResult) => void` | — |
| `modes` | `(ModeId \| PickerMode)[]` | all five |
| `mode` · `defaultMode` · `onModeChange` | — | first mode |
| `format` | `'hex' \| 'hexa' \| 'rgb' \| 'rgba' \| 'hsl' \| 'hsla'` | `'hex'` |
| `showAlpha` | `boolean` | `true` |
| `showEyedropper` | `boolean` | `true` |
| `showRecentColors` · `recentColors` · `onRecentColorsChange` | — | — |
| `palettes` | `ColorPalette[]` | `[]` |
| `pencils` | `string[]` | `[]` |
| `disabled` | `boolean` | `false` |
| `theme` | `'dark' \| 'light'` | follows the system |
| `showTitleBar` · `title` | — | `true` · `'Colours'` |
| `injectStyles` | `boolean` | `true` |
| `className` · `classNames` · `style` | — | — |

`ColorInput` adds `open` / `defaultOpen` / `onOpenChange`, `name` for form submission, and `aria-label`.

Ready-made data for the swatch modes:

```tsx
import { defaultPalettes, defaultPencils } from 'chroma-panel';

<ColorInput palettes={defaultPalettes()} pencils={defaultPencils()} />
```

<details>
<summary><b>Window controls</b> — the three dots do real work</summary>

<br>

| | |
| --- | --- |
| Red | Closes the picker. Fires `onClose`. |
| Yellow | Collapses the panel to its title bar. |
| Green | Widens the panel, and the wheel with it. |

Glyphs appear when the pointer is over the title bar, and when a control takes keyboard focus.

**Closing isn't cancelling.** The colour is kept, and reopening returns the same colour *and* the same mode you were last on.

On an inline panel there's nothing to close, so the red control is shown dimmed rather than removed. Supply `onClose` and it becomes live:

```tsx
<ChromaPanel onClose={() => setVisible(false)} defaultCollapsed={false} defaultSize="default" />
```

| Prop | Type | Default |
| --- | --- | --- |
| `onClose` | `() => void` | — |
| `collapsed` · `defaultCollapsed` · `onCollapsedChange` | `boolean` | `false` |
| `size` · `defaultSize` · `onSizeChange` | `'default' \| 'expanded'` | `'default'` |

Collapsing hides the body with CSS rather than unmounting it, so nothing you set is lost and expanding is instant.

</details>

<details>
<summary><b>Image sampling</b> — pull a palette out of a photo</summary>

<br>

```tsx
import { extractPalette } from 'chroma-panel';

const { swatches } = await extractPalette(file, { maxColors: 8 });
// [{ hex: '#3e5f8a', rgb: [62, 95, 138], population: 4213 }, ...]
```

The image is downscaled inside the decoder, so a 4000×3000 photo is never fully materialised, then quantized with modified median cut. Averages come from the true channel values rather than 5-bit bin centres — so a flat region of `#ff0000` extracts as `#ff0000`, not `#fc0404` as most implementations give you.

At the default sample size the quantizer takes a few milliseconds, so it runs on the main thread. If you raise `size` substantially, move it to a worker — constructed in **your** source, so your bundler resolves the URL:

```ts
const worker = new Worker(new URL('chroma-panel/image-worker', import.meta.url), { type: 'module' });
await extractPalette(file, { size: 400, worker });
```

</details>

<details>
<summary><b>Named colours</b> — opt in to the CSS colour names</summary>

<br>

The 148 CSS names are about 1 KB, and a bundler can't prove an unused table is unused if the parser references it. So they're opt-in:

```ts
import { registerNamedColors } from 'chroma-panel';
import { namedColors } from 'chroma-panel/named-colors';

registerNamedColors(namedColors);   // now parse('rebeccapurple') works
```

</details>

---

## Theming

![The same panel in light and dark](https://raw.githubusercontent.com/re-sohail/chroma-panel/main/assets/themes.png)

The panel follows the system colour scheme. Everything is themed through CSS custom properties:

```css
.cp-root {
  --cp-surface: #ffffff;
  --cp-text: #1c1c1e;
  --cp-accent: #2d7ff9;
  --cp-focus: #2d7ff9;
  --cp-radius-lg: 16px;
  --cp-width: 320px;
}
```

Or pass your own classes per slot, which is the neatest route if you use Tailwind:

```tsx
<ColorInput classNames={{ root: 'shadow-2xl ring-1 ring-white/10', trigger: 'h-8 w-12' }} />
```

Slots: `root`, `titlebar`, `toolbar`, `tab`, `panel`, `footer`, `swatch`, `slider`, `thumb`, `field`, `trigger`, `popover`.

<details>
<summary><b>One thing to know about the cascade</b></summary>

<br>

The stylesheet is wrapped in `@layer chroma-panel`, so **your** CSS always wins. That includes CSS you didn't mean to apply to us — an unlayered element rule anywhere in your app beats every rule in this package, however specific ours is:

```css
/* This restyles the picker's swatches and tabs too. */
button { border-radius: 7px; }
```

That's cascade layers working as designed, not a bug. If the picker's geometry looks wrong, look for an unlayered element selector first. Scope your rule, or put your own resets in a layer:

```css
@layer reset, chroma-panel, utilities;
```

If you'd rather import the stylesheet yourself — for a strict `style-src` policy, or to extract critical CSS:

```tsx
import 'chroma-panel/styles.css';

<ColorInput injectStyles={false} />
```

Injection is keyed on `getRootNode()`, so the picker also works inside a shadow root or an iframe, and mounting many panels produces exactly one `<style>` element.

</details>

---

## On a phone

Below 640px the popover becomes a bottom sheet — full width, rounded top, grab handle, capped at 88% of the small viewport height, with a scrim and scroll locked behind it. Controls keep their compact size on a mouse and grow to a 44px hit area on a touch screen.

Pass `sheetOnMobile={false}` to keep an anchored popover at every size.

One page-level line a library can't add for you:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

Without `viewport-fit=cover`, `env(safe-area-inset-bottom)` resolves to `0` and the sheet won't clear the home indicator on a notched iPhone. The CSS degrades gracefully either way.

## Accessibility

Every colour axis is a real `<input type="range">`, visually hidden — so keyboard handling, `aria-valuenow` and screen-reader support come from the platform rather than an approximation of it. The wheel and the 2D area expose two slider values sharing one visual thumb.

- Arrows step, Shift+arrow and Page Up/Down step by ten, Home and End jump to the extremes
- The mode switcher is a real tablist with a roving tab stop
- Values are announced as text — "Hue 210 degrees", not a bare number
- The popover traps focus, closes on Escape, and returns focus to the trigger
- Swatches are buttons with accessible names
- `prefers-reduced-motion` and forced-colours mode are both handled

```ts
import { readableTextColor, contrastRatio } from 'chroma-panel';

readableTextColor('#001f3f');       // → '#ffffff'
contrastRatio('#fff', '#001f3f');   // WCAG 2.1, the number audits check
```

`readableTextColor` decides with APCA rather than the usual luminance shortcut, which picks black over mid-blues where white actually reads better.

## Compatibility

- **React** 16.8, 17, 18 and 19
- **Bundlers** Vite, webpack 5, Rspack, Parcel, Rollup
- **Frameworks** Next.js (Pages and App Router), Remix, React Router 7, Astro
- **Server rendering** works with no DOM present
- **Output** ESM and CommonJS, ES2020, types for both — validated by `publint` and `are-the-types-wrong` on every build

Exports are deliberately flat: there is no `<ChromaPanel.Swatch>`. Static properties on a component don't survive the React Server Components boundary, which breaks dot-notation APIs in the Next.js App Router.

## Licence

MIT © [Sohail Khan](https://resohail.me)
