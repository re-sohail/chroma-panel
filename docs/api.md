# API

[← back to the README](https://github.com/re-sohail/chroma-panel#readme)

## Two components

```tsx
import { ColorInput, ChromaPanel } from 'chroma-panel';
```

`ColorInput` is a swatch button that opens the panel in a popover.
`ChromaPanel` is the panel on its own, for inline use.

Both take every prop in the next section. `ColorInput` takes a few more.

## Props

### The color

| Prop | Type | Default |
| --- | --- | --- |
| `value` | `string \| Hsva` | — |
| `defaultValue` | `string \| Hsva` | `'#3366cc'` |
| `onChange` | `(c: ColorChangeResult) => void` | — |
| `onChangeComplete` | `(c: ColorChangeResult) => void` | — |
| `format` | `'hex' \| 'hexa' \| 'rgb' \| 'rgba' \| 'hsl' \| 'hsla'` | `'hex'` |

Pass `value` to control the color yourself. Pass `defaultValue` to let the
panel own it.

`format` sets two things: the `css` string in the result, and the value
`ColorInput` submits with a form. The other fields are always there.

### Modes

| Prop | Type | Default |
| --- | --- | --- |
| `modes` | `(ModeId \| PickerMode)[]` | all five |
| `mode` | `string` | — |
| `defaultMode` | `string` | first mode |
| `onModeChange` | `(id: string) => void` | — |
| `palettes` | `ColorPalette[]` | built-in set |
| `pencils` | `string[]` | built-in 120-color grid |
| `modeProps` | `Record<string, Record<string, unknown>>` | — |
| `imageOptions` | `ExtractOptions` | — |

Mode ids are `'wheel'`, `'sliders'`, `'palettes'`, `'image'` and `'pencils'`.

### What is shown

| Prop | Type | Default |
| --- | --- | --- |
| `showAlpha` | `boolean` | `true` |
| `showEyedropper` | `boolean` | `true` |
| `showRecentColors` | `boolean` | `true` |
| `showTitleBar` | `boolean` | `true` |
| `title` | `string` | `'Colours'` |
| `theme` | `'dark' \| 'light'` | system |
| `disabled` | `boolean` | `false` |

### Recent colors

| Prop | Type | Default |
| --- | --- | --- |
| `recentColors` | `string[]` | uncontrolled |
| `defaultRecentColors` | `string[]` | `[]` |
| `onRecentColorsChange` | `(colors: string[]) => void` | — |

The panel tracks recent colors on its own. Pass `recentColors` only if you
want to store them yourself.

### Window controls

| Prop | Type | Default |
| --- | --- | --- |
| `onClose` | `() => void` | — |
| `collapsed` | `boolean` | `false` |
| `defaultCollapsed` | `boolean` | `false` |
| `onCollapsedChange` | `(collapsed: boolean) => void` | — |
| `size` | `'default' \| 'expanded'` | `'default'` |
| `defaultSize` | `'default' \| 'expanded'` | `'default'` |
| `onSizeChange` | `(size) => void` | — |

### Styling

| Prop | Type | Default |
| --- | --- | --- |
| `className` | `string` | — |
| `classNames` | `Partial<Record<Slot, string>>` | — |
| `style` | `CSSProperties` | — |
| `injectStyles` | `boolean` | `true` |

Slots: `root`, `titlebar`, `toolbar`, `tab`, `panel`, `footer`, `swatch`,
`slider`, `thumb`, `field`, `trigger`, `popover`.

## ColorInput only

| Prop | Type | Default |
| --- | --- | --- |
| `open` | `boolean` | — |
| `defaultOpen` | `boolean` | `false` |
| `onOpenChange` | `(open: boolean) => void` | — |
| `sheetOnMobile` | `boolean` | `true` |
| `aria-label` | `string` | `'Choose a colour'` |

### In a form

| Prop | Type | Default |
| --- | --- | --- |
| `name` | `string` | — |
| `form` | `string` | — |
| `required` | `boolean` | `false` |
| `readOnly` | `boolean` | `false` |
| `autoComplete` | `string` | — |
| `validationBehavior` | `'native' \| 'aria'` | `'native'` |

It behaves like a native input:

- Disabled inputs do not submit. Read-only ones do.
- The `form` attribute and `<fieldset disabled>` both work.
- `form.reset()` restores `defaultValue`.

## onChange vs onChangeComplete

`onChange` fires while you drag, once per animation frame. That is about 60
times a second.

`onChangeComplete` fires once: on pointer release, key release, or blur.

Use `onChange` for live preview. Use `onChangeComplete` for a network request,
an undo entry, or a database write.

Putting `onChange` straight into state at the top of a large tree will re-render
that tree 60 times a second. Keep the state local, or update from
`onChangeComplete`.

## Types

```ts
import type {
  ColorChangeResult, ColorFormat, Hsva, Hsla, Hsl, Rgba, Rgb, Hwba, Hwb,
} from 'chroma-panel';
```

| Type | Shape |
| --- | --- |
| `Hsva` | `{ h: number; s: number; v: number; a: number }` — hue 0–360, the rest 0–100, alpha 0–1 |
| `Hsla` / `Hsl` | `{ h, s, l, a? }` |
| `Rgba` / `Rgb` | `{ r, g, b, a? }` — channels 0–255 |
| `Hwba` / `Hwb` | `{ h, w, b, a? }` |
| `ColorFormat` | `'hex' \| 'hexa' \| 'rgb' \| 'rgba' \| 'hsl' \| 'hsla'` |

`Hsva` is the value the panel works in. Everything else is a conversion of it.

### ColorChangeResult

```ts
interface ColorChangeResult {
  hex: string;    // '#3366cc'
  hexa: string;   // '#3366ccff'
  rgb: { r: number; g: number; b: number };
  rgba: { r: number; g: number; b: number; a: number };
  hsl: { h: number; s: number; l: number };
  hsla: { h: number; s: number; l: number; a: number };
  hsva: { h: number; s: number; v: number; a: number };
  css: string;    // written in your `format`
}
```

`hsva` is the real value. The rest are rounded versions of it.

To keep full precision across a round trip, store `hsva` and pass it back. `value`
accepts the object as well as a string.

## Color engine

Available from the main entry and from `chroma-panel/core`, which pulls in no React
and touches no DOM.

```ts
import { parse, toHex, hsvaToRgba } from 'chroma-panel/core';
```

### Parsing

| Function | Signature |
| --- | --- |
| `parse` | `(input: string) => Hsva \| null` |
| `isValidColor` | `(input: string) => boolean` |
| `registerNamedColors` | `(table: Record<string, string>) => void` |
| `clearNamedColors` | `() => void` |

`parse` reads `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`,
`hsla()`, `hwb()`, `transparent`, and any names you register. It returns `null` for
anything else and never throws.

```ts
parse('hsl(210 60% 50%)');   // { h: 210, s: 75, v: 80, a: 1 }
parse('not a color');        // null
isValidColor('#abc');        // true
```

### Serializing

Each takes an `Hsva` and returns a string.

| Function | Example output |
| --- | --- |
| `toHex` | `'#3366cc'` |
| `toHexa` | `'#3366ccff'` |
| `toRgbString` | `'rgb(51, 102, 204)'` |
| `toRgbaString` | `'rgba(51, 102, 204, 1)'` |
| `toHslString` | `'hsl(220, 60%, 50%)'` |
| `toHslaString` | `'hsla(220, 60%, 50%, 1)'` |

Two take a format as well:

```ts
toFormat(hsva, 'rgba');   // string, in the format you name
toResult(hsva, 'hex');    // the full ColorChangeResult
```

`toResult` is what the panel passes to `onChange`. Use it if you build your own UI on
the store.

### Converting

| Function | From → to |
| --- | --- |
| `rgbaToHsva` | `Rgba → Hsva` |
| `hsvaToRgba` / `hsvaToRgb` | `Hsva → Rgba` / `Rgb` |
| `hslaToHsva` | `Hsla → Hsva` |
| `hsvaToHsla` / `hsvaToHsl` | `Hsva → Hsla` / `Hsl` |
| `hwbaToHsva` | `Hwba → Hsva` |
| `hsvaToHwba` | `Hsva → Hwba` |
| `roundRgba` | `Rgba → Rgba`, channels rounded to integers |

Two small numeric helpers come with them:

```ts
clamp(value, min, max);   // number
normalizeHue(370);        // 10
```

### Keeping hue and saturation

In HSV, hue means nothing when saturation is `0`, and saturation means nothing when
value is `0`. Pure black is `h: 0, s: 0, v: 0` no matter which hue you arrived from.
A picker that stores RGB therefore loses your hue when you drag brightness to zero.

`ingest` merges a new color into the old one and keeps the parts that would otherwise
be lost:

```ts
ingest(next, prev);       // Hsva
sameRendered(a, b);       // do they serialize to the same string?
sameHsva(a, b);           // are all four channels equal?
```

Use `sameRendered` to skip work when a change would not be visible. Use `ingest` when
you feed an outside value back in, so a round trip through hex does not flatten the
hue.

## The color store

```ts
import { createColorStore } from 'chroma-panel/core';

const store = createColorStore({ h: 220, s: 75, v: 80, a: 1 });
```

| Method | Does |
| --- | --- |
| `get()` | Current `Hsva` |
| `set(next)` | Replace the color |
| `patch(partial)` | Change some channels |
| `ingest(next)` | Merge, keeping hue and saturation (see above) |
| `commit()` | Mark the end of a gesture |
| `subscribe(fn)` | Every change. Returns an unsubscribe function |
| `subscribeCommit(fn)` | Only on commit |
| `getSnapshot()` / `getServerSnapshot()` | For `useSyncExternalStore` |

`subscribe` fires on every frame of a drag. `subscribeCommit` fires once when the
gesture ends. That split is what `onChange` and `onChangeComplete` are built on.

Pass a store to `ColorInput` or `ChromaPanel` with the `store` prop to drive several
components from one value.

## Hooks

```ts
import { useColorValue, useTransientColor, usePanel } from 'chroma-panel';
```

| Hook | Signature | Use it for |
| --- | --- | --- |
| `useColorValue` | `(store) => Hsva` | Re-render on every change. Simple, not cheap |
| `useTransientColor` | `(store, effect) => void` | Run an effect per change with **no** re-render |
| `usePanel` | `() => PanelContextValue` | Inside a custom mode: reach the store, ids and options |
| `usePointerDrag` | `(options) => PointerDragProps` | Pointer capture and drag maths for a custom surface |
| `useAxisKeyboard` | `(options) => AxisKeyboardProps` | Arrow, Page and Home/End handling for one axis |
| `useEyedropper` | `() => { supported, pick }` | The browser eyedropper, where it exists |

`useTransientColor` is how the panel stays smooth. It writes to the DOM directly
instead of setting state:

```tsx
useTransientColor(store, (c) => {
  el.current.style.background = toHex(c);
});
```

`useEyedropper` returns `supported: false` where the browser has no `EyeDropper` API.
Check it before you render a button.

## Modes

A mode is data. Registering one makes it available by id.

```ts
import { registerMode, getMode, resolveModes } from 'chroma-panel';

interface PickerMode {
  id: string;
  label: string;               // the tab's accessible name
  icon: React.ComponentType;
  Panel: React.ComponentType;
}
```

| Function | Signature |
| --- | --- |
| `registerMode` | `(mode: PickerMode) => void` |
| `getMode` | `(id: string) => PickerMode \| undefined` |
| `resolveModes` | `(requested: (string \| PickerMode)[]) => PickerMode[]` |

The five built-in modes are exported as objects and as components, so you can compose
them yourself:

| Mode object | Panel component | Entry point |
| --- | --- | --- |
| `wheelMode` | `WheelPanel` | `chroma-panel/wheel` |
| `slidersMode` | `SlidersPanel` | `chroma-panel/sliders` |
| `palettesMode` | `PalettesPanel` | `chroma-panel/palettes` |
| `imageMode` | `ImagePanel` | `chroma-panel/image` |
| `pencilsMode` | `PencilsPanel` | `chroma-panel/pencils` |

Importing a mode entry point registers it. Importing from `chroma-panel` registers
all five.

### Built-in swatch data

```ts
import { defaultPalettes, defaultPencils, PENCIL_COLUMNS } from 'chroma-panel';

defaultPalettes();   // ColorPalette[] — named groups
defaultPencils();    // string[] — 120 hex colors
PENCIL_COLUMNS;      // 12
```

Both are generated on call, not stored as tables. `ColorPalette` is
`{ name: string; swatches: { color: string; name?: string }[] }`.

## Image sampling

```ts
import { extractPalette } from 'chroma-panel';

const { swatches, sampled } = await extractPalette(file, { maxColors: 8 });
```

```ts
extractPalette(
  source: Blob | File | string,
  options?: ExtractOptions,
): Promise<{ swatches: QuantizedSwatch[]; sampled: number }>
```

| Option | Type | Default | Means |
| --- | --- | --- | --- |
| `maxColors` | `number` | `8` | How many swatches to return |
| `size` | `number` | `100` | Longest edge, in pixels, after downscaling |
| `alphaThreshold` | `number` | `128` | Pixels below this alpha are ignored |
| `worker` | `Worker \| (() => Worker)` | — | Run the quantizer off the main thread |
| `signal` | `AbortSignal` | — | Cancel a run |

A swatch is `{ hex: string; rgb: [number, number, number]; population: number }`.
`sampled` is how many pixels were counted.

`quantize` is the algorithm on its own, for pixel data you already have:

```ts
quantize(data: Uint8ClampedArray, maxColors: number, alphaThreshold?: number)
```

## Contrast

```ts
import {
  contrastRatio, meetsContrast, meetsNonTextContrast, contrastReport,
  apcaContrast, relativeLuminance, readableTextColor,
} from 'chroma-panel';
```

Every function takes `string | Hsva`.

| Function | Returns |
| --- | --- |
| `contrastRatio(a, b)` | WCAG 2.1 ratio, unrounded |
| `meetsContrast(a, b, { level, size? })` | `boolean` |
| `meetsNonTextContrast(a, b)` | `boolean` — SC 1.4.11, a flat 3:1 |
| `contrastReport(a, b)` | Every outcome at once |
| `apcaContrast(text, bg)` | APCA Lc value |
| `relativeLuminance(color)` | `0`–`1` |
| `readableTextColor(bg, options?)` | `'#000000'` or `'#ffffff'` |

```ts
contrastRatio('#767676', '#fff');                    // 4.54
meetsContrast('#767676', '#fff', { level: 'AA' });   // true
meetsContrast('#767676', '#fff', { level: 'AAA' });  // false
readableTextColor('#001f3f');                        // '#ffffff'
```

You must pass `level`, because a ratio on its own is not a verdict. 5:1 passes AA at
any size, passes AAA for large text, and fails AAA for normal text. `size` defaults to
`'normal'`, the stricter threshold.

`readableTextColor` uses APCA rather than plain luminance. It picks white over
mid-blues, where the older method picks black.

`wcagLevel()` is deprecated. It returned `"AA Large"`, which is not a real WCAG level,
and it could not know the text size.

## Styling functions

```ts
import { injectStyles, setStyleNonce } from 'chroma-panel';
```

`injectStyles(css, id, node?)` adds the stylesheet once per root. The panel calls it
for you unless you pass `injectStyles={false}`.

`setStyleNonce(nonce)` sets a CSP nonce on the injected `<style>`. Call it once,
before the first panel renders. It takes a string or a function returning one.

## Building your own UI

These are the parts the built-in modes are made of. They read the color from
`usePanel()`, so they only work inside a `ChromaPanel`.

| Component | Is |
| --- | --- |
| `ColorDisc` | The hue and saturation wheel |
| `ColorArea` | A 2D saturation and value square |
| `ChannelSlider` | One labelled channel track |
| `ColorField` | A text field that parses what you type |
| `NumberField` | A numeric channel field |
| `Swatch` / `SwatchGrid` | One color / a grid of them |
| `SegmentedControl` | The tab control the toolbar uses |
| `ModeToolbar` | The mode switcher |
| `PanelFooter` | Preview, recent colors and the eyedropper |
| `Popover` | The positioned popover, also used on its own |
| `Icon` | The built-in icon set |

`pushRecent(list, color, limit?)` adds a color to a recent list, de-duplicated and
capped. The panel uses it internally and it is exported so your own controls can
match.

## Entry points

| Import | Contains |
| --- | --- |
| `chroma-panel` | Everything, all five modes registered |
| `chroma-panel/panel` | The shell and primitives, no modes |
| `chroma-panel/core` | Color engine and store. No React, no DOM |
| `chroma-panel/wheel` | The wheel mode, registered on import |
| `chroma-panel/sliders` | The sliders mode |
| `chroma-panel/palettes` | The palettes mode |
| `chroma-panel/image` | The image mode |
| `chroma-panel/pencils` | The pencils mode |
| `chroma-panel/contrast` | APCA and WCAG contrast |
| `chroma-panel/named-colors` | The 148 CSS color names |
| `chroma-panel/image-worker` | The quantizer, to build a `Worker` from |
| `chroma-panel/styles.css` | The stylesheet, if you turn off injection |

Every entry point ships ESM and CommonJS, with TypeScript types.
