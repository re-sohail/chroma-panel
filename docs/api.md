# API

[← back to the README](../README.md) · The same reference, with live demos, is on the [docs site](https://chroma-panel.jscrate.dev/react/components/chroma-panel).

## Components

```tsx
import { ColorInput, ChromaPanel } from 'chroma-panel';
```

`ColorInput` is a swatch button that opens the panel in a popover. Reach for it when the picker should sit inline in a form or toolbar.

`ChromaPanel` is the panel by itself, always visible. Reach for it when you are placing the picker in a sidebar, a modal you control, or a page of your own.

Every prop below works on both. `ColorInput` adds a few of its own further down.

## Props

### The color

| Prop | Type | Default | When you'd use it |
| --- | --- | --- | --- |
| `value` | `string \| Hsva` | — | You keep the color in your own state |
| `defaultValue` | `string \| Hsva` | `'#3366cc'` | You want the panel to keep it |
| `onChange` | `(c: ColorChangeResult) => void` | — | Live preview while dragging |
| `onChangeComplete` | `(c: ColorChangeResult) => void` | — | Saving, undo entries, network calls |
| `format` | `'hex' \| 'hexa' \| 'rgb' \| 'rgba' \| 'hsl' \| 'hsla'` | `'hex'` | You need a particular string format |

Pass `value` and you must handle `onChange`, or the panel will not move. Pass `defaultValue` instead and it manages itself.

`format` changes two things: the `css` string inside `ColorChangeResult`, and the value `ColorInput` submits with a form. Every other field on the result is always present, so you can read `hex` and `rgba` whatever you set here.

### Which modes appear

| Prop | Type | Default | When you'd use it |
| --- | --- | --- | --- |
| `modes` | `(ModeId \| PickerMode)[]` | all five | Show fewer tabs, or change their order |
| `mode` | `string` | — | You control which tab is open |
| `defaultMode` | `string` | first mode | Open on a tab other than the first |
| `onModeChange` | `(id: string) => void` | — | Remember the tab a user last used |
| `palettes` | `ColorPalette[]` | built-in set | Show your brand colors instead |
| `pencils` | `string[]` | built-in 120-color grid | Replace the pencil grid |
| `modeProps` | `Record<string, Record<string, unknown>>` | — | Pass props into one mode's panel |
| `imageOptions` | `ExtractOptions` | — | Tune image sampling |

Mode ids are `'wheel'`, `'sliders'`, `'palettes'`, `'image'` and `'pencils'`. The order you list them is the order of the tabs.

`modeProps` is keyed by mode id, and each entry is spread onto that mode's panel component. It exists so a custom mode can take props without the panel needing to know about it:

```tsx
<ChromaPanel modeProps={{ brand: { team: 'design' } }} />
```

`imageOptions` is shorthand for the image mode specifically. These two are the same:

```tsx
<ChromaPanel imageOptions={{ maxColors: 12 }} />
<ChromaPanel modeProps={{ image: { extractOptions: { maxColors: 12 } } }} />
```

### What the panel shows

| Prop | Type | Default | When you'd use it |
| --- | --- | --- | --- |
| `showAlpha` | `boolean` | `true` | Turn off when opacity is not allowed |
| `showEyedropper` | `boolean` | `true` | Turn off to hide it even where supported |
| `showCopyButton` | `boolean` | `true` | Show a button that copies the current output format |
| `showRecentColors` | `boolean` | `true` | Turn off in a one-shot picker |
| `showTitleBar` | `boolean` | `true` | Turn off for an inline panel with no chrome |
| `title` | `string` | `'Colors'` | Rename the title bar |
| `theme` | `'dark' \| 'light'` | system | Force one theme instead of following the OS |
| `disabled` | `boolean` | `false` | Read-only screens, or while a form is saving |

Turning `showAlpha` off hides the alpha slider, but does not change the stored value. If the color already had alpha it keeps it.

The eyedropper only renders where the browser has the `EyeDropper` API. `showEyedropper={false}` hides it everywhere; leaving it `true` shows it where it works.

### Recent colors

| Prop | Type | Default | When you'd use it |
| --- | --- | --- | --- |
| `recentColors` | `string[]` | uncontrolled | Store recents yourself, e.g. in localStorage |
| `defaultRecentColors` | `string[]` | `[]` | Seed the list, then let the panel manage it |
| `onRecentColorsChange` | `(colors: string[]) => void` | — | Watch the list, controlled or not |

The panel tracks recent colors on its own, so most people need none of these. Pass `recentColors` only if the list has to survive a reload or be shared between pickers.

### Window controls

The title bar carries three macOS-style controls. These props drive them.

| Prop | Type | Default | When you'd use it |
| --- | --- | --- | --- |
| `onClose` | `() => void` | — | Make the red control live on an inline panel |
| `collapsed` | `boolean` | `false` | You control the collapsed state |
| `defaultCollapsed` | `boolean` | `false` | Start collapsed |
| `onCollapsedChange` | `(collapsed: boolean) => void` | — | Persist whether it was collapsed |
| `size` | `'default' \| 'expanded'` | `'default'` | You control the size |
| `defaultSize` | `'default' \| 'expanded'` | `'default'` | Start expanded |
| `onSizeChange` | `(size) => void` | — | Persist the size |

Collapsing hides the body and leaves the title bar. Nothing is unmounted, so state survives.

Expanded widens the panel from 320px to 420px and the wheel from 196px to 260px. Useful on a large screen or when the panel is the main thing on the page.

`ColorInput` closes its own popover, so `onClose` is only needed for an inline `ChromaPanel`.

### Styling

| Prop | Type | Default | When you'd use it |
| --- | --- | --- | --- |
| `className` | `string` | — | One class on the root |
| `classNames` | `Partial<Record<Slot, string>>` | — | A class on individual parts |
| `style` | `CSSProperties` | — | Inline styles, including CSS variables |
| `injectStyles` | `boolean` | `true` | Load the CSS yourself instead |

Slots for `classNames`: `root`, `titlebar`, `toolbar`, `tab`, `panel`, `footer`, `swatch`, `slider`, `thumb`, `field`, `trigger`, `popover`.

`injectStyles={false}` stops the panel adding a `<style>` tag, for a strict `style-src` policy or critical-CSS extraction. Import `chroma-panel/styles.css` yourself when you use it. It does not make your bundle smaller — the CSS is imported by the module either way.

## ColorInput only

| Prop | Type | Default | When you'd use it |
| --- | --- | --- | --- |
| `open` | `boolean` | — | You control when the popover is open |
| `defaultOpen` | `boolean` | `false` | Open on mount |
| `onOpenChange` | `(open: boolean) => void` | — | React to opening and closing |
| `sheetOnMobile` | `boolean` | `true` | Keep the popover on small screens |
| `aria-label` | `string` | `'Choose a color'` | Name the trigger for screen readers |

Below 640px the popover becomes a bottom sheet, which is easier to reach with a thumb. Set `sheetOnMobile={false}` if your layout needs an anchored popover at every width.

### In a form

| Prop | Type | Default | When you'd use it |
| --- | --- | --- | --- |
| `name` | `string` | — | Submit the color with the form |
| `form` | `string` | — | Attach to a form it is not nested inside |
| `required` | `boolean` | `false` | Block submission until a color is chosen |
| `readOnly` | `boolean` | `false` | Show a value that cannot be edited but still submits |
| `autoComplete` | `string` | — | Pass through to the underlying input |
| `validationBehavior` | `'native' \| 'aria'` | `'native'` | Choose who reports validation errors |

Give it a `name` and it submits like any other input, in whatever `format` you set.

`validationBehavior` matters when a form library is involved. `'native'` lets the browser show its own message and block submission. Switch to `'aria'` when something like react-hook-form owns validation, so the two do not fight over it.

It behaves like a native input in the ways that usually catch people out:

- Disabled inputs do not submit. Read-only ones do.
- The `form` attribute and `<fieldset disabled>` both work.
- `form.reset()` restores `defaultValue`.

## onChange vs onChangeComplete

Use `onChange` to show the color. Use `onChangeComplete` to record it.

`onChange` fires while you drag, batched to once per animation frame — roughly 60 times a second. `onChangeComplete` fires once, when a gesture ends: pointer release, key release, or blur.

```tsx
<ColorInput
  onChange={(c) => setPreview(c.hex)}     // cheap, local
  onChangeComplete={(c) => saveToApi(c.hex)}  // once
/>
```

The mistake to avoid is putting `onChange` into state at the top of a large tree. That re-renders everything 60 times a second while the user drags. Keep the state local to the preview, or only update from `onChangeComplete`.

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

## Hex, RGB, HSL and HSV color engine

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

## React color picker hooks

```ts
import { useColorValue, useTransientColor, usePanel } from 'chroma-panel';
```

Most people need only the first two. The rest exist for building a custom mode.

| Hook | Signature | When you'd use it |
| --- | --- | --- |
| `useColorValue` | `(store) => Hsva` | You want the color as ordinary state and a re-render is fine |
| `useTransientColor` | `(store, effect) => void` | You are updating the DOM every frame and cannot afford a re-render |
| `usePanel` | `() => PanelContextValue` | Inside a custom mode, to reach the store, ids and options |
| `usePointerDrag` | `(options) => PointerDragProps` | Building a drag surface of your own |
| `useAxisKeyboard` | `(options) => AxisKeyboardProps` | Adding arrow, Page and Home/End keys to one axis |
| `useEyedropper` | `() => { supported, pick }` | Putting an eyedropper button in your own UI |

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
| `maxFileSize` | `number` | `20971520` | Maximum source size in bytes (20 MB) |
| `maxSourcePixels` | `number` | `40000000` | Maximum decoded dimensions (40 megapixels) |
| `worker` | `Worker \| (() => Worker)` | — | Run the quantizer off the main thread |
| `signal` | `AbortSignal` | — | Cancel a run |

A swatch is `{ hex: string; rgb: [number, number, number]; population: number }`.
`sampled` is how many pixels were counted.

The image mode also lets pointer users click an exact pixel and keyboard users press
Enter or Space to select the center pixel. Uploaded files are validated before palette
processing, and only the bounded sampling surface is read into JavaScript.

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

These are the parts the built-in modes are made of. They read the color through
`usePanel()`, so they only work inside a `ChromaPanel`.

Use them when you are writing a custom mode and want the panel's own controls rather
than your own. For a picker that lives outside the panel, use `createColorStore` and
the hooks above instead.

| Component | What it is |
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
