import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import * as React from 'react';
import {
  ChromaPanel, ColorInput, defaultPalettes, defaultPencils, PENCIL_COLUMNS,
} from '../src/index';

const DESKTOP = { width: 1280, height: 900 };

async function waitFor<T extends Element>(selector: string, timeout = 3000): Promise<T> {
  const deadline = Date.now() + timeout;
  for (;;) {
    const el = document.querySelector<T>(selector);
    if (el !== null) return el;
    if (Date.now() > deadline) throw new Error(`timed out waiting for "${selector}"`);
    await new Promise((r) => requestAnimationFrame(r));
  }
}

afterEach(async () => {
  await page.viewport(DESKTOP.width, DESKTOP.height);
});

describe('segmented control', () => {
  it('positions the sliding indicator from the active index, with no measurement', async () => {
    render(
      <ChromaPanel
        defaultValue="#3366cc"
        modes={['wheel', 'sliders', 'palettes']}
        palettes={defaultPalettes()}
        showTitleBar={false}
      />,
    );
    const seg = await waitFor<HTMLElement>('.cp-seg');

    expect(seg.style.getPropertyValue('--cp-seg-count')).toBe('3');
    expect(seg.style.getPropertyValue('--cp-seg-active')).toBe('0');

    const tabs = Array.from(seg.querySelectorAll<HTMLElement>('[role="tab"]'));
    tabs[2]!.click();
    await new Promise((r) => setTimeout(r, 40));
    expect(seg.style.getPropertyValue('--cp-seg-active')).toBe('2');
  });

  it('keeps one tab stop and moves with arrows', async () => {
    render(
      <ChromaPanel defaultValue="#3366cc" modes={['wheel', 'sliders', 'palettes']}
        palettes={defaultPalettes()} showTitleBar={false} />,
    );
    const seg = await waitFor<HTMLElement>('.cp-seg');
    const tabs = Array.from(seg.querySelectorAll<HTMLElement>('[role="tab"]'));

    expect(tabs.filter((t) => t.tabIndex === 0)).toHaveLength(1);
    tabs[0]!.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(tabs[1]!.getAttribute('aria-selected')).toBe('true');
    expect(seg.style.getPropertyValue('--cp-seg-active')).toBe('1');
  });

  it('gives the nested colour-model switcher a different weight from the mode switcher', async () => {
    render(<ChromaPanel defaultValue="#3366cc" modes={['sliders']} showTitleBar={false} />);
    await waitFor('.cp-seg-sm');

    const nested = document.querySelector<HTMLElement>('.cp-seg-sm')!;
    const nestedTab = nested.querySelector<HTMLElement>('.cp-tab')!;
    expect(nestedTab.getBoundingClientRect().height).toBeLessThan(30);
  });
});

describe('swatch grids', () => {
  it('renders pencils as a gapless mosaic with the generated column count', async () => {
    render(
      <ChromaPanel defaultValue="#3366cc" modes={['pencils']}
        pencils={defaultPencils()} showTitleBar={false} />,
    );
    const grid = await waitFor<HTMLElement>('.cp-swatch-grid[data-cp-variant="mosaic"]');

    expect(getComputedStyle(grid).gap).toBe('0px');
    expect(grid.style.getPropertyValue('--cp-columns')).toBe(String(PENCIL_COLUMNS));
    expect(grid.querySelectorAll('.cp-swatch')).toHaveLength(120);
  });

  it('does not overflow its container at any supported width', async () => {
    render(
      <ChromaPanel defaultValue="#3366cc" modes={['pencils']}
        pencils={defaultPencils()} showTitleBar={false} />,
    );
    await waitFor('.cp-mosaic');

    for (const width of [320, 375, 414, 768, 1280]) {
      await page.viewport(width, 900);
      await new Promise((r) => setTimeout(r, 60));

      const frame = document.querySelector('.cp-mosaic')!.getBoundingClientRect();
      const grid = document.querySelector('.cp-swatch-grid')!.getBoundingClientRect();
      expect(Math.round(grid.right), `overflow at ${width}px`)
        .toBeLessThanOrEqual(Math.round(frame.right));
      expect(grid.width, `zero width at ${width}px`).toBeGreaterThan(0);
    }
  });

  it('marks the selected mosaic cell so it lifts out of the gapless grid', async () => {
    render(
      <ChromaPanel defaultValue="#000000" modes={['pencils']}
        pencils={['#ff0000', '#00ff00', '#0000ff']} showTitleBar={false} />,
    );
    const target = await waitFor<HTMLElement>('[data-cp-color="#00ff00"]');
    target.click();
    await new Promise((r) => setTimeout(r, 40));

    expect(target.getAttribute('aria-pressed')).toBe('true');
    const style = getComputedStyle(target);
    expect(style.outlineStyle).toBe('solid');
    expect(parseFloat(style.outlineWidth)).toBeGreaterThan(0);
    expect(parseFloat(style.outlineOffset)).toBeLessThan(0);
  });

  it('gives every spaced swatch a visible outline', async () => {
    render(
      <ChromaPanel defaultValue="#3366cc" modes={['palettes']}
        palettes={defaultPalettes()} showTitleBar={false} />,
    );
    await waitFor('.cp-swatch-grid[data-cp-variant="spaced"]');

    const swatches = Array.from(document.querySelectorAll<HTMLElement>(
      '.cp-swatch-grid[data-cp-variant="spaced"] .cp-swatch',
    ));
    expect(swatches.length).toBeGreaterThan(10);

    for (const el of swatches.slice(0, 6)) {
      const s = getComputedStyle(el);
      expect(s.outlineStyle).toBe('solid');
      expect(parseFloat(s.outlineWidth)).toBeGreaterThan(0);
    }
  });
});

describe('responsive presentation', () => {
  it('is an anchored popover on a wide viewport', async () => {
    render(<ColorInput defaultValue="#3366cc" modes={['wheel']} />);
    const trigger = await waitFor<HTMLButtonElement>('.cp-trigger');
    trigger.click();

    await waitFor('.cp-popover');
    expect(document.querySelector('.cp-sheet')).toBeNull();
  });

  it('becomes a bottom sheet on a narrow viewport, pinned to the bottom edge', async () => {
    await page.viewport(390, 844);
    render(<ColorInput defaultValue="#3366cc" modes={['wheel']} />);
    const trigger = await waitFor<HTMLButtonElement>('.cp-trigger');
    trigger.click();

    const sheet = await waitFor<HTMLElement>('.cp-sheet');
    expect(document.querySelector('.cp-popover')).toBeNull();

    const box = sheet.getBoundingClientRect();
    expect(Math.round(box.width)).toBe(390);
    expect(Math.round(box.bottom)).toBe(844);
    expect(box.height).toBeLessThanOrEqual(844 * 0.88 + 1);
    expect(document.querySelector('.cp-scrim')).not.toBeNull();
    expect(document.querySelector('.cp-grabber')).not.toBeNull();
  });

  it('traps focus in the sheet and restores it on Escape', async () => {
    await page.viewport(390, 844);
    render(<ColorInput defaultValue="#3366cc" modes={['wheel']} />);
    const trigger = await waitFor<HTMLButtonElement>('.cp-trigger');
    trigger.click();

    const sheet = await waitFor<HTMLElement>('.cp-sheet');
    await new Promise((r) => setTimeout(r, 60));
    expect(sheet.contains(document.activeElement)).toBe(true);

    await userEvent.keyboard('{Escape}');
    await new Promise((r) => setTimeout(r, 60));
    expect(document.querySelector('.cp-sheet')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('never overflows the viewport horizontally at phone widths', async () => {
    render(
      <ChromaPanel defaultValue="#3366cc" palettes={defaultPalettes()}
        pencils={defaultPencils()} />,
    );
    await waitFor('.cp-root');

    for (const width of [320, 360, 390]) {
      await page.viewport(width, 844);
      await new Promise((r) => setTimeout(r, 60));
      const root = document.querySelector('.cp-root')!.getBoundingClientRect();
      expect(Math.round(root.width), `panel wider than ${width}px viewport`)
        .toBeLessThanOrEqual(width);
      expect(document.documentElement.scrollWidth,
        `horizontal page scroll at ${width}px`)
        .toBeLessThanOrEqual(document.documentElement.clientWidth);
    }
  });
});

describe('target sizes', () => {
  it('keeps every control at or above the 24px WCAG AA minimum', async () => {
    render(
      <ChromaPanel defaultValue="#3366cc" palettes={defaultPalettes()} showTitleBar={false} />,
    );
    await waitFor('.cp-seg');

    const controls = Array.from(document.querySelectorAll<HTMLElement>(
      '.cp-tab, .cp-icon-button, .cp-input',
    ));
    expect(controls.length).toBeGreaterThan(3);

    for (const el of controls) {
      const r = el.getBoundingClientRect();
      expect(Math.round(r.height), `${el.className} is ${r.height}px tall`)
        .toBeGreaterThanOrEqual(24);
    }
  });
});
