import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import * as React from 'react';
import { ChromaPanel, ColorInput, defaultPalettes, defaultPencils } from '../src/index';

/**
 * Layout stability.
 *
 * Every assertion here corresponds to a defect found in a real browser before
 * the first publish, and the suite had no layout coverage at all at the time —
 * which is how a 352px height swing and an unscrollable sheet both shipped
 * past 150 green tests.
 *
 * These must run in browser mode. jsdom returns zeros from
 * getBoundingClientRect() and applies no stylesheet, so every one of them
 * would pass vacuously there.
 */

const DESKTOP = { width: 1280, height: 900 };
const ALL_MODES = ['wheel', 'sliders', 'palettes', 'image', 'pencils'] as const;

async function waitFor<T extends Element>(selector: string, timeout = 3000): Promise<T> {
  const deadline = Date.now() + timeout;
  for (;;) {
    const el = document.querySelector<T>(selector);
    if (el !== null) return el;
    if (Date.now() > deadline) throw new Error(`timed out waiting for "${selector}"`);
    await new Promise((r) => requestAnimationFrame(r));
  }
}

const settle = (): Promise<void> => new Promise((r) => setTimeout(r, 60));

function panel(extra: Record<string, unknown> = {}): React.ReactElement {
  return (
    <ChromaPanel
      defaultValue="#3366cc"
      modes={[...ALL_MODES]}
      palettes={defaultPalettes()}
      pencils={defaultPencils()}
      {...extra}
    />
  );
}

/** Clicks each mode tab in turn and reports what `measure` returns each time. */
async function acrossModes<T>(
  scope: string,
  measure: () => T,
): Promise<Array<{ mode: string; value: T }>> {
  const out: Array<{ mode: string; value: T }> = [];
  for (const mode of ALL_MODES) {
    const tab = document.querySelector<HTMLElement>(`${scope} [role="tab"][data-cp-mode="${mode}"]`)
      ?? Array.from(document.querySelectorAll<HTMLElement>(`${scope} [role="tab"]`))
        .find((t) => t.getAttribute('aria-controls')?.endsWith(`-panel-${mode}`) === true);
    if (tab === undefined || tab === null) throw new Error(`no tab for mode "${mode}"`);
    tab.click();
    await settle();
    out.push({ mode, value: measure() });
  }
  return out;
}

afterEach(async () => {
  await page.viewport(DESKTOP.width, DESKTOP.height);
});

describe('the panel is the same size in every mode', () => {
  // Left to themselves the modes range from 147px (image) to 325px (wheel).
  for (const [w, h] of [[1280, 900], [390, 844], [360, 640]] as const) {
    it(`holds one panel height across all five modes at ${w}x${h}`, async () => {
      await page.viewport(w, h);
      render(panel({ showTitleBar: false }));
      await waitFor('.cp-panel-host');

      const heights = await acrossModes('.cp-root', () =>
        Math.round(document.querySelector('.cp-panel-host')!.getBoundingClientRect().height));

      const unique = new Set(heights.map((r) => r.value));
      expect(
        unique.size,
        `panel height varies by mode: ${heights.map((r) => `${r.mode}=${r.value}`).join(' ')}`,
      ).toBe(1);
    });
  }

  it('keeps the whole panel one size, not just the tab panel', async () => {
    render(panel());
    await waitFor('.cp-root');

    const boxes = await acrossModes('.cp-root', () => {
      const r = document.querySelector('.cp-root')!.getBoundingClientRect();
      return `${Math.round(r.width)}x${Math.round(r.height)}`;
    });

    expect(new Set(boxes.map((b) => b.value)).size,
      `panel box varies: ${boxes.map((b) => `${b.mode}=${b.value}`).join(' ')}`).toBe(1);
  });

  it('every mode fits the reserved height without a scrollbar', async () => {
    // The exception is palettes, which is a deliberately long list and is
    // meant to scroll. Everything else overflowing means --cp-panel-h has
    // fallen behind the content, which is a regression, not a design choice.
    render(panel());
    const host = await waitFor<HTMLElement>('.cp-panel-host');

    const overflow = await acrossModes('.cp-root', () => host.scrollHeight - host.clientHeight);

    for (const { mode, value } of overflow) {
      if (mode === 'palettes') continue;
      expect(value, `"${mode}" overflows --cp-panel-h by ${value}px`).toBeLessThanOrEqual(1);
    }
  });

  it('does not reserve a fixed height when there is only one mode', async () => {
    // Nothing can jump with nothing to switch to, so the space would be wasted.
    render(<ChromaPanel defaultValue="#3366cc" modes={['sliders']} showTitleBar={false} />);
    const host = await waitFor<HTMLElement>('.cp-panel-host');
    await settle();

    expect(document.querySelector('.cp-root')!.getAttribute('data-cp-modes')).toBe('1');
    expect(host.getBoundingClientRect().height).toBeLessThan(332);
  });
});

describe('the bottom sheet stays put', () => {
  it('does not move its top edge when the mode changes', async () => {
    // A sheet is anchored to the bottom edge, so any height change moves the
    // TOP edge under the user's finger — the most disorienting form this bug
    // took, at 352px per tab switch.
    await page.viewport(390, 844);
    render(<ColorInput defaultValue="#3366cc" modes={[...ALL_MODES]}
      palettes={defaultPalettes()} pencils={defaultPencils()} />);
    (await waitFor<HTMLButtonElement>('.cp-trigger')).click();
    await waitFor('.cp-sheet');
    await settle();

    const tops = await acrossModes('.cp-sheet', () =>
      Math.round(document.querySelector('.cp-sheet')!.getBoundingClientRect().top));

    expect(new Set(tops.map((t) => t.value)).size,
      `sheet top edge moves: ${tops.map((t) => `${t.mode}=${t.value}`).join(' ')}`).toBe(1);
  });
});

describe('scrolling', () => {
  it('scrolls the palette list on a phone', async () => {
    // Regression: below 640px the inner wrapper was given "max-height: none",
    // which left it an overflow:auto element that could not scroll. Sitting
    // permanently at its own scroll boundary, its overscroll-behavior:contain
    // swallowed every gesture instead of chaining to the sheet, so the list
    // was simply immovable.
    await page.viewport(360, 640);
    render(<ColorInput defaultValue="#3366cc" modes={[...ALL_MODES]}
      palettes={defaultPalettes()} pencils={defaultPencils()} />);
    (await waitFor<HTMLButtonElement>('.cp-trigger')).click();
    const sheet = await waitFor<HTMLElement>('.cp-sheet');
    await settle();

    await acrossModes('.cp-sheet', () => null);   // ends on pencils
    const palettesTab = Array.from(sheet.querySelectorAll<HTMLElement>('[role="tab"]'))
      .find((t) => t.getAttribute('aria-controls')?.endsWith('-panel-palettes') === true)!;
    palettesTab.click();
    await settle();

    const host = sheet.querySelector<HTMLElement>('.cp-panel-host')!;
    expect(host.scrollHeight, 'nothing to scroll — test is not exercising the bug')
      .toBeGreaterThan(host.clientHeight + 1);

    host.scrollTop = 120;
    await settle();
    expect(host.scrollTop, 'the panel refused to scroll').toBeGreaterThan(0);
  });

  it('has exactly one scroll container inside the panel', async () => {
    // Two nested scroll ports is what made the bug above possible at all.
    await page.viewport(360, 640);
    render(panel());
    await waitFor('.cp-panel-host');
    await settle();

    const ports = await acrossModes('.cp-root', () =>
      Array.from(document.querySelectorAll<HTMLElement>('.cp-root *'))
        .filter((el) => {
          const overflow = getComputedStyle(el).overflowY;
          return overflow === 'auto' || overflow === 'scroll';
        })
        .map((el) => el.className));

    for (const { mode, value } of ports) {
      expect(value, `"${mode}" has ${value.length} vertical scroll ports`).toHaveLength(1);
      expect(value[0]).toContain('cp-panel-host');
    }
  });
});

describe('the sheet passes its height constraint all the way down', () => {
  // Regression: ColorInput wraps the panel in a role="dialog" div. Unstyled,
  // it was a flex item with the default min-height: auto, so it refused to
  // shrink and the panel overflowed the sheet — which clips. At 320x568 the
  // footer ended up 10px inside the clipped region, reachable by nothing.
  // One unstyled element in the middle is enough to break the whole chain.
  for (const [w, h] of [[320, 568], [320, 480], [360, 640]] as const) {
    it(`keeps the footer inside the sheet at ${w}x${h}`, async () => {
      await page.viewport(w, h);
      render(<ColorInput defaultValue="#3366cc" modes={[...ALL_MODES]}
        palettes={defaultPalettes()} pencils={defaultPencils()} />);
      (await waitFor<HTMLButtonElement>('.cp-trigger')).click();
      const sheet = await waitFor<HTMLElement>('.cp-sheet');
      await settle();

      const seen = await acrossModes('.cp-sheet', () => {
        const footer = sheet.querySelector('.cp-footer')!.getBoundingClientRect();
        return Math.round(footer.bottom);
      });

      const sheetBottom = Math.round(sheet.getBoundingClientRect().bottom);
      for (const { mode, value } of seen) {
        expect(value, `"${mode}" pushes the footer past the sheet edge`)
          .toBeLessThanOrEqual(sheetBottom + 1);
        expect(value, `"${mode}" pushes the footer off screen`)
          .toBeLessThanOrEqual(window.innerHeight + 1);
      }
    });
  }
});

describe('the popover never exceeds the viewport', () => {
  it('stays on screen and keeps the footer reachable in a short viewport', async () => {
    // Regression: place() flipped above only when there was room above, and
    // never clamped. At 900x420 the panel ran 313px past the bottom edge with
    // overflow:visible, putting the footer and its OK button out of reach.
    await page.viewport(900, 420);
    render(<ColorInput defaultValue="#3366cc" modes={[...ALL_MODES]}
      palettes={defaultPalettes()} pencils={defaultPencils()} />);
    (await waitFor<HTMLButtonElement>('.cp-trigger')).click();
    await waitFor('.cp-popover');
    await settle();

    const seen = await acrossModes('.cp-popover', () => {
      const box = document.querySelector('.cp-popover')!.getBoundingClientRect();
      const footer = document.querySelector('.cp-popover .cp-footer')!.getBoundingClientRect();
      return {
        top: Math.round(box.top),
        bottom: Math.round(box.bottom),
        footerBottom: Math.round(footer.bottom),
      };
    });

    for (const { mode, value } of seen) {
      expect(value.top, `"${mode}" starts above the viewport`).toBeGreaterThanOrEqual(0);
      expect(value.bottom, `"${mode}" runs past the bottom edge`).toBeLessThanOrEqual(420);
      expect(value.footerBottom, `"${mode}" hides its footer`).toBeLessThanOrEqual(420);
    }
  });
});

describe('the footer', () => {
  it('shows the current colour once, not twice', async () => {
    // The preview already IS the current colour, so repeating it as the newest
    // recent drew the same circle twice after every pick.
    render(panel());
    await waitFor('.cp-panel-host');

    const tab = Array.from(document.querySelectorAll<HTMLElement>('.cp-root [role="tab"]'))
      .find((t) => t.getAttribute('aria-controls')?.endsWith('-panel-pencils') === true)!;
    tab.click();
    await settle();

    const swatches = document.querySelectorAll<HTMLElement>('.cp-panel-host button');
    swatches[25]!.click();
    await settle();

    const preview = getComputedStyle(document.querySelector('.cp-preview')!)
      .getPropertyValue('--cp-preview-color').trim();
    const rendered = Array.from(document.querySelectorAll<HTMLElement>('.cp-recents .cp-swatch'))
      .map((el) => el.style.getPropertyValue('--cp-swatch-color').trim().toLowerCase());

    expect(preview, 'the preview is not painted').not.toBe('');
    expect(rendered, 'the current colour is repeated in the history')
      .not.toContain('#002875');

    // Picking a second colour must bring the first one back into the history —
    // it is filtered from the view, never dropped from the data.
    swatches[40]!.click();
    await settle();
    const after = Array.from(document.querySelectorAll<HTMLElement>('.cp-recents .cp-swatch'))
      .map((el) => el.style.getPropertyValue('--cp-swatch-color').trim().toLowerCase());
    expect(after).toContain('#002875');
  });

  it('lets every recent colour be reached rather than clipping them', async () => {
    // Ten were stored and "overflow: hidden" cut the row off at seven, leaving
    // three unreachable with nothing to suggest they existed.
    const recents = [
      '#111111', '#222222', '#333333', '#444444', '#555555',
      '#666666', '#777777', '#888888', '#999999', '#aaaaaa',
    ];
    render(panel({ recentColors: recents, onRecentColorsChange: () => {} }));
    await waitFor('.cp-recents');
    await settle();

    const row = document.querySelector<HTMLElement>('.cp-recents')!;
    expect(row.querySelectorAll('li')).toHaveLength(recents.length);
    expect(getComputedStyle(row).overflowX).toBe('auto');
    expect(row.scrollWidth, 'nothing to scroll — test is not exercising the bug')
      .toBeGreaterThan(row.clientWidth);

    row.scrollLeft = row.scrollWidth;
    await settle();
    expect(row.scrollLeft, 'the row clips instead of scrolling').toBeGreaterThan(0);
  });
});
