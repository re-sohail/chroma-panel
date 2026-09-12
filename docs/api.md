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
| `value` | `string` | — |
| `defaultValue` | `string` | `'#ffffff'` |
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
| `palettes` | `ColorPalette[]` | `[]` |
| `pencils` | `string[]` | `[]` |
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

`ColorInput` adds:

| Prop | Type | Default |
| --- | --- | --- |
| `open` | `boolean` | — |
| `defaultOpen` | `boolean` | `false` |
| `onOpenChange` | `(open: boolean) => void` | — |
| `sheetOnMobile` | `boolean` | `true` |
| `name` | `string` | — |
| `aria-label` | `string` | `'Choose a colour'` |

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

`hsva` is the internal value, unrounded. The rest are rounded projections of it.
To keep precision across a round trip, store `hsva`.

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

## Colour maths

```ts
import { parse, toHex, toHexa, hsvaToRgba } from 'chroma-panel/core';

parse('hsl(210 60% 50%)');
toHexa(parse('rgb(255 0 0 / 50%)'));  // '#ff000080'
```

Parses `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`,
`hsla()`, `hwb()`, `transparent`, and any registered colour names. Returns
`null` for anything else — it never throws.
