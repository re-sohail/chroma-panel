# chroma-panel

A macOS-inspired colour picker for React. Five modes — wheel, sliders, palettes, image extraction and pencils — in one accessible panel, with **zero runtime dependencies**.

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

No CSS import required — the stylesheet is injected on first mount. See [Styling](#styling) if you would rather import it yourself.

---

## Why this exists

`<input type="color">` hands off to an operating-system window. On macOS that is Apple's `NSColorPanel`, which is why the picker looks so different from the rest of your app and why you cannot restyle it. A web page has no access to that window at all.

So if you want the same picker on every browser and OS, it has to be built in the page. That is what this is.

## Why another one

Every popular React colour picker shares one defect, and it comes from storing colour as RGB or hex instead of HSV.

In HSV, two components are **powerless** at the extremes: hue is undefined when saturation is 0 (grey) or brightness is 0 (black), and saturation is undefined when brightness is 0. RGB cannot represent "black, but remember it was blue" — so every time the colour passes through RGB, that information is destroyed. Drag brightness to zero and back, and your carefully chosen hue comes back as red.

That single root cause explains a long list of open issues elsewhere: hue resetting at extreme saturation, wheels getting stuck at V=0, sliders going dead on greyscale, RGB channels drifting when only alpha changes.

`chroma-panel` keeps **unrounded float HSVA** as its canonical state and merges incoming colours rather than replacing them, so the powerless components survive. There is a test for each of those failure modes.

The second difference is the drag loop. Most pickers call `setState` on every `pointermove`, which at 120 Hz means 120 reconciliations per second across the panel — and across your app too, if you lifted the value. This one drives an external store and mutates the DOM directly: **a drag renders React zero times**. That is asserted in a browser test, not just claimed.

## Size

Measured by building a real Vite app with and without the package, React external, minified and gzipped:

| What you import | Added to your bundle |
| --- | --- |
| `chroma-panel/core` — colour maths only, no React | **2.2 KB** |
| `chroma-panel/panel` + one mode | **8.5 KB** |
| `chroma-panel` — all five modes | **13.9 KB** |

For comparison, measured the same way: `react-colorful` 4.8 KB (one mode, 0 deps), `@rc-component/color-picker` 6.6 KB (one mode, 3 deps), `@uiw/react-color` 15.7 KB (20 deps), `react-color` 37.5 KB (7 deps, unmaintained since 2020).

About 3.5 KB of every figure above is the stylesheet, which is inlined so the picker works with no CSS import, and which carries the full design system, the responsive rules and the mobile sheet.

---

## Usage

### A swatch that opens a popover

```tsx
import { ColorInput } from 'chroma-panel';

<ColorInput
  value={color}
  onChange={(c) => setColor(c.hex)}       // fires while dragging
  onChangeComplete={(c) => save(c.hex)}   // fires once, when the drag ends
  modes={['wheel', 'sliders', 'palettes', 'image', 'pencils']}
  format="hex"
  showAlpha
  name="brandColor"                       // submits with the surrounding form
/>
```

### An inline panel, no popover

```tsx
import { ChromaPanel } from 'chroma-panel';

<ChromaPanel defaultValue="#3366cc" modes={['wheel']} showTitleBar={false} />
```

### Only the modes you need

The `chroma-panel` entry registers all five modes. To ship fewer, import the shell and each mode separately:

```tsx
import { ChromaPanel } from 'chroma-panel/panel';
import 'chroma-panel/wheel';
import 'chroma-panel/sliders';

<ChromaPanel modes={['wheel', 'sliders']} />
```

### Colour maths with no React at all

`chroma-panel/core` is safe in a worker, on a server, or as a standalone colour library.

```ts
import { parse, toHex, toHexa, hsvaToRgba, ingest } from 'chroma-panel/core';

parse('hsl(210 60% 50%)');        // -> { h: 210, s: 60, v: 80, a: 1 }
toHexa(parse('rgb(255 0 0 / 50%)')); // -> '#ff000080'
```

### Named colours

The 148 CSS colour names are ~1 KB and opt-in, because a bundler cannot prove an unused table is unused if the parser references it:

```ts
import { registerNamedColors } from 'chroma-panel';
import { namedColors } from 'chroma-panel/named-colors';

registerNamedColors(namedColors);   // now parse('rebeccapurple') works
```

---

## `onChange` vs `onChangeComplete`

`onChange` fires continuously while dragging, coalesced to at most one call per animation frame. `onChangeComplete` fires once, when the pointer is released, a key is released, or a field is blurred.

Use `onChange` for live preview. Use `onChangeComplete` for anything expensive — a network request, an undo entry, a database write.

Both receive the same object:

```ts
interface ColorChangeResult {
  hex: string;    // '#3366cc'
  hexa: string;   // '#3366ccff'
  rgb: { r: number; g: number; b: number };
  rgba: { r: number; g: number; b: number; a: number };
  hsl: { h: number; s: number; l: number };
  hsla: { h: number; s: number; l: number; a: number };
  hsva: { h: number; s: number; v: number; a: number };  // canonical, unrounded
  css: string;    // serialised per the `format` prop
}
```

`hsva` is the unrounded internal value; every other field is a rounded projection of it. If you need precision across a round trip, store `hsva`.

> **One caveat if you drive the picker from state.** `onChange` fires roughly 60 times a second. Putting it straight into a `useState` at the root of a large tree will re-render that tree 60 times a second — the picker stays fast, your app may not. Either keep the state local, or update from `onChangeComplete` and let the picker manage itself in between.

---

## Props

Both `ColorInput` and `ChromaPanel` take these:

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `value` | `string` | — | Controlled colour, any CSS colour string |
| `defaultValue` | `string` | `'#ffffff'` | Initial colour when uncontrolled |
| `onChange` | `(c: ColorChangeResult) => void` | — | Fires while dragging |
| `onChangeComplete` | `(c: ColorChangeResult) => void` | — | Fires when the interaction settles |
| `modes` | `(ModeId \| PickerMode)[]` | all five | Which modes to show, in order |
| `mode` / `defaultMode` | `string` | first mode | Active mode, controlled or not |
| `onModeChange` | `(id: string) => void` | — | |
| `format` | `'hex' \| 'hexa' \| 'rgb' \| 'rgba' \| 'hsl' \| 'hsla'` | `'hex'` | Drives `result.css` and the form value |
| `showAlpha` | `boolean` | `true` | |
| `showEyedropper` | `boolean` | `true` | Hidden where unsupported |
| `showRecentColors` | `boolean` | `true` | |
| `recentColors` | `string[]` | `[]` | |
| `onRecentColorsChange` | `(colors: string[]) => void` | — | Called on each commit |
| `palettes` | `ColorPalette[]` | `[]` | For the palettes mode |
| `pencils` | `string[]` | `[]` | For the pencils mode |
| `disabled` | `boolean` | `false` | |
| `theme` | `'dark' \| 'light'` | dark | |
| `showTitleBar` | `boolean` | `true` | The decorative macOS title bar |
| `title` | `string` | `'Colours'` | |
| `injectStyles` | `boolean` | `true` | See [Styling](#styling) |
| `className` | `string` | — | |
| `classNames` | `Partial<Record<Slot, string>>` | — | Per-slot classes; see [Styling](#styling) |
| `store` | `ColorStore` | — | Advanced: share one store between panels |

`ColorInput` adds:

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `open` / `defaultOpen` | `boolean` | `false` | Popover state |
| `onOpenChange` | `(open: boolean) => void` | — | |
| `name` | `string` | — | Renders a hidden input so the colour submits with a form |
| `aria-label` | `string` | `'Choose a colour'` | Names the trigger |

Ready-made data for the swatch modes:

```tsx
import { defaultPalettes, defaultPencils } from 'chroma-panel';

<ColorInput palettes={defaultPalettes()} pencils={defaultPencils()} />
```

---

## Styling

Everything is themed through CSS custom properties on `.cp-root`:

```css
.cp-root {
  --cp-surface: #232323;
  --cp-surface-raised: #2c2c2c;
  --cp-border: #55585b;
  --cp-text: #ededed;
  --cp-accent: #3b82f6;
  --cp-focus: #5b9cff;
  --cp-radius: 14px;
  --cp-width: 320px;
}
```

The stylesheet is wrapped in `@layer chroma-panel`. That is deliberate: unlayered CSS beats *all* layered CSS regardless of specificity, so an unlayered stylesheet would override your own utility classes. Being in a layer means you can put us wherever you want in the cascade:

```css
@layer reset, chroma-panel, utilities;
```

### Tailwind

Pass your own classes per slot. They win, because your utilities are in a later layer:

```tsx
<ColorInput
  classNames={{
    root: 'shadow-2xl ring-1 ring-white/10',
    trigger: 'h-8 w-12 rounded-lg',
    footer: 'pt-2',
  }}
/>
```

Slots: `root`, `titlebar`, `toolbar`, `tab`, `panel`, `footer`, `swatch`, `slider`, `thumb`, `field`, `trigger`, `popover`.

Or map your design tokens onto ours, with no build integration at all:

```css
@import "tailwindcss";

:root {
  --cp-radius: var(--radius-lg);
  --cp-focus: var(--color-blue-500);
}
```

### One thing to know about `@layer`

Being in a layer means **your** CSS wins — including CSS you did not mean to
apply to us. A bare element rule anywhere in your app, unlayered, beats every
rule in this package no matter how specific ours is:

```css
/* This restyles the picker's swatches, tabs and eyedropper too. */
button { border-radius: 7px; }
```

That is cascade layers working as designed, not a bug. If you see the picker's
geometry looking wrong, look for an unlayered element selector first. The fix
is to scope your rule, or to put your own resets in a layer:

```css
@layer reset, chroma-panel, utilities;
@layer reset { button { border-radius: 7px; } }
```

### Importing the stylesheet yourself

If you use a strict `style-src` Content Security Policy, or you extract critical CSS:

```tsx
import 'chroma-panel/styles.css';

<ColorInput injectStyles={false} />
```

Or keep injection and supply a nonce:

```ts
import { setStyleNonce } from 'chroma-panel';
setStyleNonce(() => window.__CSP_NONCE__);
```

Injection is keyed on `getRootNode()`, so the picker also works inside a shadow root or an iframe, and mounting many panels still produces exactly one `<style>` element.

---

## On a phone

Below 640px the popover becomes a bottom sheet — full width, rounded top,
grab handle, capped at 88% of the small viewport height, with a scrim and
scroll locked behind it. Controls keep their compact desktop size on a mouse
and grow to a 44px hit area on a touch screen, so the desktop layout is not
inflated to serve the phone.

Pass `sheetOnMobile={false}` to `Popover` if you want an anchored popover at
every size.

Two page-level things a library cannot set for you, both one line:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

Without `viewport-fit=cover`, `env(safe-area-inset-bottom)` resolves to `0`
and the sheet will not clear the home indicator on a notched iPhone. The CSS
degrades gracefully either way. Adding `interactive-widget=resizes-content`
also makes the layout shrink when the on-screen keyboard opens, rather than
the sheet sliding under it.

---

## Image palettes

```tsx
import { extractPalette } from 'chroma-panel';

const { swatches } = await extractPalette(file, { maxColors: 8 });
// swatches: [{ hex: '#3e5f8a', rgb: [62, 95, 138], population: 4213 }, ...]
```

The image is downscaled inside the decoder (`createImageBitmap` with `resizeWidth`), so a 4000×3000 photo is never fully materialised, then quantized with modified median cut. Unlike the usual implementations, averages are computed from the true channel values rather than 5-bit bin centres — so a flat region of `#ff0000` extracts as `#ff0000`, not `#fc0404`.

At the default 100×100 sample the quantizer takes a few milliseconds, less than one frame, so it runs on the main thread. If you raise `size` substantially, move it to a worker — constructed in **your** source so your bundler resolves the URL:

```ts
const worker = new Worker(new URL('chroma-panel/image-worker', import.meta.url), { type: 'module' });

await extractPalette(file, { size: 400, worker });
```

---

## Accessibility

- Every colour axis is a real `<input type="range">`, visually hidden — so keyboard handling, `aria-valuenow` and screen-reader support come from the platform rather than from an approximation of it. The two-dimensional disc and area expose **two** slider values sharing one visual thumb.
- Arrow keys step, Shift+arrow and Page Up/Down step by ten, Home and End jump to the extremes.
- The mode switcher is a real tablist with a roving tab stop; arrows move between tabs.
- Values are announced as text (`"Hue 210 degrees"`), not bare numbers.
- The popover traps focus, closes on Escape, and returns focus to the trigger.
- Swatches are `<button>` elements with accessible names.
- `prefers-reduced-motion` is respected.
- The macOS traffic-light dots are decorative, `aria-hidden`, and carry no handlers — a close button that does not close would be worse than no button.

For choosing a readable label over a swatch:

```ts
import { readableTextColor, contrastRatio, apcaContrast } from 'chroma-panel';

readableTextColor('#001f3f');  // -> '#ffffff'
contrastRatio('#fff', '#001f3f');  // WCAG 2.1, the number audits check
```

`readableTextColor` decides with APCA rather than the common `luminance > 0.179` shortcut, which picks black over mid-blues where white actually reads better.

---

## Compatibility

- **React** 16.8, 17, 18 and 19 — `useSyncExternalStore` is used where available, with a subscribe-and-render fallback on older versions.
- **Bundlers** Vite 3+, webpack 5, Rspack, Parcel 2, Rollup.
- **Frameworks** Next.js (Pages and App Router), Remix / React Router 7, Astro, CRA.
- **Server rendering** works with no DOM present. Every client component carries `"use client"`, verified in CI for both the ESM and CJS output.
- **Output** ESM and CommonJS, ES2020, with types for both. Validated by `publint` and `are-the-types-wrong` on every build.

The exports are deliberately flat — there is no `<ChromaPanel.Swatch>`. Static properties assigned to a component do not survive the React Server Components boundary, which breaks dot-notation APIs in Next.js App Router.

---

## Custom modes

A mode is plain data, so adding one touches no existing file:

```tsx
import { registerMode, ChromaPanel } from 'chroma-panel';

registerMode({
  id: 'brand',
  label: 'Brand colours',
  icon: BrandIcon,
  Panel: BrandPanel,   // reads the store via usePanel()
});

<ChromaPanel modes={['wheel', 'brand']} />
```

---

## Licence

MIT.

Icon path data is from [Lucide](https://lucide.dev), used under the ISC
licence — see `LICENSE-THIRD-PARTY` in the published package.
