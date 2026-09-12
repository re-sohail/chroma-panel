import type { Hsva } from './types';
import { toHexa } from './serialize';

/**
 * The rule that fixes the defect class shared by every popular React colour
 * picker.
 *
 * In HSV, two components are "powerless" at the poles:
 *   - hue is undefined when s === 0 (grey) or v === 0 (black)
 *   - saturation is undefined when v === 0
 *
 * A value arriving from outside (a controlled `value` prop, a typed hex, the
 * eyedropper) has been through RGB, so those components came back as 0 — not
 * because the user chose 0, but because RGB cannot represent them. Replacing
 * state wholesale therefore destroys the user's hue every time brightness
 * touches zero, which is why dragging value to 0 and back turns your colour
 * red in so many libraries.
 *
 * Merging instead of replacing keeps the powerless components alive.
 */
export function ingest(next: Hsva, prev: Hsva): Hsva {
  return {
    h: next.s > 0 && next.v > 0 ? next.h : prev.h,
    s: next.v > 0 ? next.s : prev.s,
    v: next.v,
    a: next.a,
  };
}

/**
 * Do two colours *render* identically?
 *
 * Controlled-value sync must be gated on this, NOT on HSVA equality. A parent
 * that echoes `onChange` back into `value` sends back a colour that renders
 * the same but has lost its powerless components; comparing HSVA would treat
 * that as a change and stomp the sticky hue on every frame.
 */
export function sameRendered(a: Hsva, b: Hsva): boolean {
  return toHexa(a) === toHexa(b);
}

/** Structural equality, for change detection inside the store. */
export function sameHsva(a: Hsva, b: Hsva): boolean {
  return a.h === b.h && a.s === b.s && a.v === b.v && a.a === b.a;
}
