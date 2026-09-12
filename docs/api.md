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
  css: string;    // written in your `format`
}
```

`hsva` is the real value. The rest are rounded versions of it.

To keep full precision across a round trip, store `hsva` and pass it back.
`value` accepts the object as well as a string.

## Entry points

| Import | Contains |
| --- | --- |
| `chroma-panel` | Everything, all five modes |
| `chroma-panel/panel` | The shell and primitives, no modes |
| `chroma-panel/core` | Color maths. No React, no DOM |
| `chroma-panel/wheel` etc. | One mode each |
| `chroma-panel/contrast` | APCA and WCAG contrast |
| `chroma-panel/named-colors` | The 148 CSS color names |
| `chroma-panel/styles.css` | The stylesheet, if you turn off injection |

## Contrast

```ts
import {
  contrastRatio, meetsContrast, meetsNonTextContrast, contrastReport,
} from 'chroma-panel';

contrastRatio('#767676', '#fff');                    // 4.54
meetsContrast('#767676', '#fff', { level: 'AA' });   // true
meetsContrast('#767676', '#fff', { level: 'AAA' });  // false
meetsNonTextContrast('#949494', '#fff');             // SC 1.4.11, 3:1
contrastReport('#5b5b5b', '#fff');                   // every outcome at once
```

You must pass the level, because a ratio on its own is not a verdict. 5:1 passes
AA at any size, passes AAA for large text, and fails AAA for normal text.

`size` defaults to `'normal'`, which is the stricter threshold.

`wcagLevel()` is deprecated. It returned `"AA Large"`, which is not a real WCAG
level, and it could not know the text size.

## Color maths

```ts
import { parse, toHex, toHexa, hsvaToRgba } from 'chroma-panel/core';

parse('hsl(210 60% 50%)');
toHexa(parse('rgb(255 0 0 / 50%)'));  // '#ff000080'
```

`parse` reads `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`,
`hsl()`, `hsla()`, `hwb()`, `transparent`, and any names you register.

It returns `null` for anything else. It never throws.
