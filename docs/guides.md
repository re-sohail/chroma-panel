# Guides

[← back to the README](https://github.com/re-sohail/chroma-panel#readme)

## Theming

Everything is themed with CSS custom properties:

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
}
```

`--cp-panel-h` is the height reserved for the mode content. It is the same in
every mode, so the panel does not resize when you switch tabs — and on a phone,
where the sheet is anchored to the bottom edge, its top edge does not jump
either. Anything taller than it scrolls. Set it to `auto` to let each mode size
itself, at the cost of that stability.

The panel follows the system colour scheme unless you pass `theme`.

### With Tailwind

Pass your own classes per slot:

```tsx
<ColorInput
  classNames={{
    root: 'shadow-2xl ring-1 ring-white/10',
    trigger: 'h-8 w-12 rounded-lg',
  }}
/>
```

### One thing to know about the cascade

The stylesheet sits in `@layer chroma-panel`, so your CSS always wins. That
includes CSS you did not mean to apply here — an unlayered element rule
anywhere in your app beats every rule in this package, however specific:

```css
/* This restyles the picker's swatches and tabs too. */
button { border-radius: 7px; }
```

That is cascade layers working as designed. If the picker's geometry looks
wrong, look for an unlayered element selector first. Scope the rule, or put
your own resets in a layer:

```css
@layer reset, chroma-panel, utilities;
```

### Importing the stylesheet yourself

For a strict `style-src` policy, or to extract critical CSS:

```tsx
import 'chroma-panel/styles.css';

<ColorInput injectStyles={false} />
```

Injection is keyed on `getRootNode()`, so the picker works inside a shadow root
or an iframe, and many panels produce exactly one `<style>` element.

## Window controls

| | |
| --- | --- |
| Red | Closes the picker. Fires `onClose`. |
| Yellow | Collapses the panel to its title bar. |
| Green | Widens the panel, and the wheel with it. |

Glyphs appear when the pointer is over the title bar, and on keyboard focus.

Closing is not cancelling. The colour is kept, and reopening returns the same
colour and the same mode you were last on.

An inline panel has nothing to close, so the red control is shown dimmed rather
than removed. Supply `onClose` and it becomes live.

Collapsing hides the body with CSS rather than unmounting it, so nothing is
lost and expanding is instant.

## Image sampling

```tsx
import { extractPalette } from 'chroma-panel';

const { swatches } = await extractPalette(file, { maxColors: 8 });
// [{ hex: '#3e5f8a', rgb: [62, 95, 138], population: 4213 }, ...]
```

The image is downscaled inside the decoder, so a 4000x3000 photo is never fully
materialised, then quantized with modified median cut. Averages come from the
true channel values rather than 5-bit bin centres, so a flat region of
`#ff0000` extracts as `#ff0000` and not `#fc0404`.

At the default sample size the quantizer takes a few milliseconds, so it runs
on the main thread. To raise `size` substantially, move it to a worker —
constructed in your source, so your bundler resolves the URL:

```ts
const url = new URL('chroma-panel/image-worker', import.meta.url);
const worker = new Worker(url, { type: 'module' });

await extractPalette(file, { size: 400, worker });
```

## Named colours

The 148 CSS colour names are about 1 KB, and a bundler cannot prove an unused
table is unused if the parser references it. So they are opt-in:

```ts
import { registerNamedColors } from 'chroma-panel';
import { namedColors } from 'chroma-panel/named-colors';

registerNamedColors(namedColors);
```

## On a phone

Below 640px the popover becomes a bottom sheet: full width, rounded top, grab
handle, capped at 88% of the small viewport height, with a scrim and scroll
locked behind it. Controls keep their compact size on a mouse and grow to a
44px hit area on a touch screen.

Pass `sheetOnMobile={false}` to keep an anchored popover at every size.

One page-level line a library cannot add for you:

```html
<meta name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover">
```

Without `viewport-fit=cover`, `env(safe-area-inset-bottom)` resolves to `0` and
the sheet will not clear the home indicator on a notched iPhone. The CSS
degrades gracefully either way.

## Accessibility

Every colour axis is a real `<input type="range">`, visually hidden, so
keyboard handling, `aria-valuenow` and screen-reader support come from the
platform rather than an approximation of it. The wheel and the 2D area expose
two slider values sharing one visual thumb.

- Arrows step; Shift+arrow and Page Up/Down step by ten; Home and End jump
- The mode switcher is a tablist with a roving tab stop
- Values announce as text: "Hue 210 degrees", not a bare number
- The popover traps focus, closes on Escape, returns focus to the trigger
- Swatches are buttons with accessible names
- `prefers-reduced-motion` and forced-colours mode are both handled

```ts
import { readableTextColor, contrastRatio } from 'chroma-panel';

readableTextColor('#001f3f');       // '#ffffff'
contrastRatio('#fff', '#001f3f');   // WCAG 2.1 ratio
```

`readableTextColor` decides with APCA rather than the usual luminance
shortcut, which picks black over mid-blues where white reads better.

## Custom modes

A mode is data, so adding one touches no existing file:

```tsx
import { registerMode, ChromaPanel } from 'chroma-panel';

registerMode({
  id: 'brand',
  label: 'Brand colours',
  icon: BrandIcon,
  Panel: BrandPanel,   // reads the store through usePanel()
});

<ChromaPanel modes={['wheel', 'brand']} />
```
