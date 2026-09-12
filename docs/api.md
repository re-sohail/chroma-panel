# API

[← back to the README](https://github.com/re-sohail/chroma-panel#readme)

## Components

`ColorInput` is a swatch that opens the panel in a popover. `ChromaPanel` is the
panel on its own, for inline use. Both take the props below.

```tsx
import { ColorInput, ChromaPanel } from 'chroma-panel';
```

## Props

| Prop | Type | Default |
| --- | --- | --- |
| `value` | `string \| Hsva` | — |
| `defaultValue` | `string \| Hsva` | `'#ffffff'` |
| `onChange` | `(c: ColorChangeResult) => void` | — |
| `onChangeComplete` | `(c: ColorChangeResult) => void` | — |
| `modes` | `(ModeId \| PickerMode)[]` | all five |
| `mode` | `string` | — |
| `defaultMode` | `string` | first mode |
| `onModeChange` | `(id: string) => void` | — |
| `format` | `'hex' \| 'hexa' \| 'rgb' \| 'rgba' \| 'hsl' \| 'hsla'` | `'hex'` |
| `showAlpha` | `boolean` | `true` |
| `showEyedropper` | `boolean` | `true` |
| `showRecentColors` | `boolean` | `true` |
| `recentColors` | `string[]` | `[]` |
| `onRecentColorsChange` | `(colors: string[]) => void` | — |
| `palettes` | `ColorPalette[]` | built-in set |
| `pencils` | `string[]` | built-in 120-colour grid |
| `disabled` | `boolean` | `false` |
| `theme` | `'dark' \| 'light'` | system |
| `showTitleBar` | `boolean` | `true` |
| `title` | `string` | `'Colours'` |
| `injectStyles` | `boolean` | `true` |
| `className` | `string` | — |
| `classNames` | `Partial<Record<Slot, string>>` | — |
| `style` | `CSSProperties` | — |
| `onClose` | `() => void` | — |
| `collapsed` | `boolean` | `false` |
| `defaultCollapsed` | `boolean` | `false` |
| `onCollapsedChange` | `(collapsed: boolean) => void` | — |
| `size` | `'default' \| 'expanded'` | `'default'` |
| `defaultSize` | `'default' \| 'expanded'` | `'default'` |
| `onSizeChange` | `(size) => void` | — |
| `modeProps` | `Record<string, Record<string, unknown>>` | — |
| `imageOptions` | `ExtractOptions` | — |

`ColorInput` adds:

| Prop | Type | Default |
| --- | --- | --- |
| `open` | `boolean` | — |
| `defaultOpen` | `boolean` | `false` |
| `onOpenChange` | `(open: boolean) => void` | — |
| `sheetOnMobile` | `boolean` | `true` |
| `name` | `string` | — |
| `form` | `string` | — |
| `required` | `boolean` | `false` |
| `readOnly` | `boolean` | `false` |
| `autoComplete` | `string` | — |
| `validationBehavior` | `'native' \| 'aria'` | `'native'` |
| `aria-label` | `string` | `'Choose a colour'` |

`ColorInput` behaves like a native form control: a disabled one does not
submit, a read-only one does, both `form` association and `<fieldset disabled>`
are honoured, and `form.reset()` restores `defaultValue`.

Slots for `classNames`: `root`, `titlebar`, `toolbar`, `tab`, `panel`, `footer`,
`swatch`, `slider`, `thumb`, `field`, `trigger`, `popover`.

## onChange vs onChangeComplete

`onChange` fires while dragging, batched to one call per animation frame.
`onChangeComplete` fires once, on pointer release, key release, or blur.

Use `onChange` for live preview. Use `onChangeComplete` for a network request,
an undo entry, or a database write.

`onChange` fires around 60 times a second. Putting it straight into a `useState`
at the root of a large tree re-renders that tree 60 times a second. Keep the
state local, or update from `onChangeComplete`.

## ColorChangeResult

```ts
interface ColorChangeResult {
  hex: string;    // '#3366cc'
  hexa: string;   // '#3366ccff'
  rgb: { r: number; g: number; b: number };
  rgba: { r: number; g: number; b: number; a: number };
  hsl: { h: number; s: number; l: number };
  hsla: { h: number; s: number; l: number; a: number };
  hsva: { h: number; s: number; v: number; a: number };
  css: string;    // serialised per `format`
}
```

`hsva` is the internal value, unrounded. The rest are rounded projections of
it. To keep precision across a round trip, store `hsva` and pass it straight
back — `value` accepts the object as well as a string.

## Entry points

| Import | Contains |
| --- | --- |
| `chroma-panel` | Everything, all five modes registered |
| `chroma-panel/panel` | The shell and primitives, no modes |
| `chroma-panel/core` | Colour maths, no React, no DOM |
| `chroma-panel/wheel` etc. | One mode each |
| `chroma-panel/contrast` | APCA and WCAG contrast |
| `chroma-panel/named-colors` | The 148 CSS colour names |
| `chroma-panel/styles.css` | The stylesheet, if you turn off injection |

## Contrast

```ts
import { contrastRatio, meetsContrast, contrastReport } from 'chroma-panel';

contrastRatio('#767676', '#fff');                          // 4.54
meetsContrast('#767676', '#fff', { level: 'AA' });          // true
meetsContrast('#767676', '#fff', { level: 'AAA' });         // false
meetsNonTextContrast('#949494', '#fff');                    // SC 1.4.11, 3:1
contrastReport('#5b5b5b', '#fff');                          // every outcome
```

Both the level and the text size are required, because a ratio alone does not
decide a verdict: 5:1 passes AA for any text, passes AAA for large text and
fails AAA for normal text, all at once. `size` defaults to `'normal'`, the
stricter threshold.

`wcagLevel()` is deprecated. It returned `"AA Large"`, which is not a WCAG
conformance level, and could not know the text size that would decide between
thresholds.

## Colour maths

```ts
import { parse, toHex, toHexa, hsvaToRgba } from 'chroma-panel/core';

parse('hsl(210 60% 50%)');
toHexa(parse('rgb(255 0 0 / 50%)'));  // '#ff000080'
```

Parses `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`,
`hsla()`, `hwb()`, `transparent`, and any registered colour names. Returns
`null` for anything else — it never throws.
