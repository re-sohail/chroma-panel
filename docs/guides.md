# Guides

[← back to the README](../README.md) · These guides, with live demos, are on the [docs site](https://chroma-panel.jscrate.dev/react/handbook/theming).

## Theming

Set CSS variables on `.cp-root` to change how the panel looks:

```css
.cp-root {
  --cp-accent: #e5484d;
  --cp-radius-lg: 4px;
  --cp-width: 280px;
}
```

Anything you do not set keeps its default. The panel follows the system color scheme
unless you pass `theme`.

Here is the full set, with the defaults:

```css
.cp-root {
  --cp-surface: #ffffff;
  --cp-surface-raised: #f4f4f6;
  --cp-border: #d6d6da;
  --cp-text: #1c1c1e;
  --cp-text-muted: #6b6b70;
  --cp-accent: #2d7ff9;
  --cp-focus: #2d7ff9;
  --cp-radius-lg: 16px;
  --cp-radius: 10px;
  --cp-width: 320px;
  --cp-disc-size: 196px;
  --cp-panel-h: 344px;
  --cp-control-height: 32px;
}
```

Two are worth knowing about before you change them.

`--cp-control-height` sizes the tab bar, the text inputs, the eyedropper and the
footer swatch together, so one value scales every control at once.

`--cp-panel-h` is the height set aside for the mode content. It is the same in every
mode, which is what stops the panel resizing when you switch tabs. Content taller than
it scrolls. Set it to `auto` if you would rather each mode sized itself, and accept
that the panel will jump.

### With Tailwind

Pass your classes per slot instead of writing CSS:

```tsx
<ColorInput
  classNames={{
    root: 'shadow-2xl ring-1 ring-white/10',
    trigger: 'h-8 w-12 rounded-lg',
  }}
/>
```

### If the panel looks wrong

The stylesheet lives in `@layer chroma-panel`, so your CSS always wins. That
also means CSS you did not aim at the picker wins. Any unlayered element rule
in your app beats every rule here, however specific:

```css
/* This restyles the picker's swatches and tabs too. */
button { border-radius: 7px; }
```

If the geometry looks off, look for a rule like that first. Scope it, or put
your resets in a layer:

```css
@layer reset, chroma-panel, utilities;
```

### Loading the CSS yourself

For a strict `style-src` policy, or to extract critical CSS:

```tsx
import 'chroma-panel/styles.css';

<ColorInput injectStyles={false} />
```

Injection is keyed on `getRootNode()`. The picker works inside a shadow root or
an iframe, and many panels still produce one `<style>` element.

## Window controls

| | |
| --- | --- |
| Red | Closes the picker. Fires `onClose`. |
| Yellow | Collapses the panel to its title bar. |
| Green | Widens the panel, and the wheel with it. |

The glyphs appear on hover and on keyboard focus.

Closing keeps the color. Reopen and you get the same color and the same mode.

Collapsing hides the body with CSS instead of unmounting it, so nothing is lost.

An inline panel has nothing to close, so the red control is dimmed. Pass
`onClose` to make it live.

## Image sampling

```tsx
import { extractPalette } from 'chroma-panel';

const { swatches } = await extractPalette(file, { maxColors: 8 });
// [{ hex: '#3e5f8a', rgb: [62, 95, 138], population: 4213 }, ...]
```

Large images are downscaled before they are read, so a 4000x3000 photo never
loads in full.

A loaded image stays put when you close and reopen the picker. It is released
when you replace it, remove it, or leave the page.

Sampling takes a few milliseconds, so it runs on the main thread. If you raise
`size` a lot, move it to a worker. Build the URL in your own source so your
bundler resolves it:

```ts
const url = new URL('chroma-panel/image-worker', import.meta.url);
const worker = new Worker(url, { type: 'module' });

await extractPalette(file, { size: 400, worker });
```

## Named colors

The 148 CSS color names cost about 1.3 kB gzipped, so they are opt-in:

```ts
import { registerNamedColors } from 'chroma-panel';
import { namedColors } from 'chroma-panel/named-colors';

registerNamedColors(namedColors);
```

Now `parse('rebeccapurple')` works.

## On a phone

Phones are handled for you, but there is one line to add to your page.

Below 640px the popover becomes a bottom sheet: full width, rounded top, grab handle,
and a scrim with the page locked behind it. Controls stay compact for a mouse and grow
to a 44px hit area for touch. Pass `sheetOnMobile={false}` if you want an anchored
popover at every width instead.

The line a library cannot add for you:

```html
<meta name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover">
```

Without `viewport-fit=cover` the sheet will not clear the home indicator on a
notched iPhone. Everything still works, it just sits a little low.

## Browser support

The stylesheet uses `light-dark()`, so the panel needs a browser from 2024:

| | Minimum |
| --- | --- |
| Chrome / Edge | 123 |
| Firefox | 120 |
| Safari | 17.5 |

Below those the CSS does not apply and the panel renders unstyled. It also uses
`:has()`, `@layer`, `color-mix()` and `svh`, all of which landed earlier than
`light-dark()`, so that one sets the floor.

Two features depend on APIs that are not everywhere:

**The eyedropper** uses the browser's `EyeDropper` API, which today means Chromium.
`showEyedropper` defaults to `true`, but the button only renders where the API exists,
so nothing breaks elsewhere. If you build your own, check `useEyedropper().supported`
first.

**Image sampling** needs `createImageBitmap` and `OffscreenCanvas`. Both are in every
browser that clears the table above.

## Server rendering

Import it and use it. Next.js App Router, Remix and other SSR setups need no special
handling.

Every file that needs the browser carries `'use client'`, so you can import from a
server component without marking your own file. The first render emits the color as
CSS custom properties, so there is no flash before hydration.

Nothing is read from `window` at module scope. `injectStyles` is a no-op when
`document` is undefined.

## Controlled or uncontrolled

Uncontrolled is the default. Pass `defaultValue` and let the panel keep the value:

```tsx
<ColorInput defaultValue="#3366cc" onChangeComplete={(c) => save(c.hex)} />
```

Controlled means you own it. Pass `value` and update it yourself:

```tsx
const [color, setColor] = useState('#3366cc');

<ColorInput value={color} onChange={(c) => setColor(c.hex)} />
```

Pass `value` and you must handle `onChange`, or the panel will not move.

`mode`, `open`, `collapsed`, `size` and `recentColors` all work the same way: pass the
prop to control it, leave it out to let the panel manage it.

## Common mistakes

**Putting `onChange` into global state.** It fires about 60 times a second while you
drag. Keep that state local, or save from `onChangeComplete` instead —
[why](api.md#onchange-vs-onchangecomplete).

**Expecting `injectStyles={false}` to shrink your bundle.** It only stops the panel
writing a `<style>` tag. The CSS is imported by the module either way, so your build
is the same size. Use it for CSP or critical CSS.

**An unlayered `button` rule in your own CSS.** It will restyle the panel's swatches
and tabs. This is the most common cause of a panel that looks almost right — see
[If the panel looks wrong](#if-the-panel-looks-wrong).

**Expecting the eyedropper everywhere.** It renders only where the browser has the
`EyeDropper` API. If you need one in every browser, build your own UI and check
`useEyedropper().supported` first.

**Reading `hex` when you need precision.** `hex` is rounded to 8 bits per channel.
Store `hsva` and pass it back to `value` if a color has to survive a round trip
unchanged.

## Accessibility

The picker is keyboard and screen-reader operable out of the box. You do not need to
add anything.

Every color axis is a real `<input type="range">`, hidden visually, so keyboard
handling and screen-reader support come from the browser rather than a reimplementation
of it.

- Arrows step. Shift+arrow and Page Up/Down step by ten. Home and End jump.
- The mode switcher is a tablist with a roving tab stop.
- Values are announced as text: "Hue 210 degrees", not a bare number.
- The popover traps focus, closes on Escape, and returns focus to the trigger.
- Swatches are buttons with accessible names.
- `prefers-reduced-motion` and forced-colors mode are both handled.

Two helpers for your own UI:

```ts
import { readableTextColor, contrastRatio } from 'chroma-panel';

readableTextColor('#001f3f');       // '#ffffff'
contrastRatio('#fff', '#001f3f');   // WCAG 2.1 ratio
```

`readableTextColor` uses APCA rather than plain luminance. It picks white over
mid-blues, where the older method wrongly picks black.

## Custom modes

A mode is plain data, so adding one changes no existing file:

```tsx
import { registerMode, ChromaPanel } from 'chroma-panel';

registerMode({
  id: 'brand',
  label: 'Brand colors',
  icon: BrandIcon,
  Panel: BrandPanel,   // reads the color with usePanel()
});

<ChromaPanel modes={['wheel', 'brand']} />
```
