import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import * as React from 'react';
import { ChromaPanel, ColorInput, PENCIL_COLUMNS } from '../src/index';
import { DEFAULT_COLOR, FALLBACK } from '../src/components/ChromaPanel';
import { toHex } from '../src/color/serialize';

async function waitFor<T extends Element>(selector: string, timeout = 3000): Promise<T> {
  const deadline = Date.now() + timeout;
  for (;;) {
    const el = document.querySelector<T>(selector);
    if (el !== null) return el;
    if (Date.now() > deadline) throw new Error(`timed out waiting for "${selector}"`);
    await new Promise((r) => requestAnimationFrame(r));
  }
}

const openMode = async (label: string): Promise<void> => {
  const tab = [...document.querySelectorAll<HTMLElement>('[role="tab"]')]
    .find((t) => t.getAttribute('aria-label') === label);
  tab?.click();
  await new Promise((r) => setTimeout(r, 120));
};

describe('a picker with no props is not half empty', () => {
  it('fills the pencils mode from generated defaults', async () => {
    render(<ChromaPanel />);
    await waitFor('.cp-root');
    await openMode('Pencils');

    const grid = await waitFor<HTMLElement>('.cp-swatch-grid[data-cp-variant="mosaic"]');
    expect(grid.querySelectorAll('.cp-swatch')).toHaveLength(120);
    expect(grid.style.getPropertyValue('--cp-columns')).toBe(String(PENCIL_COLUMNS));
  });

  it('fills the palettes mode from generated defaults', async () => {
    render(<ChromaPanel />);
    await waitFor('.cp-root');
    await openMode('Palettes');

    const swatches = document.querySelectorAll('.cp-swatch-grid .cp-swatch');
    expect(swatches.length).toBeGreaterThan(10);
    expect(document.querySelector('.cp-empty')).toBeNull();
  });

  it('still respects data the consumer passes', async () => {
    render(<ChromaPanel pencils={['#ff0000', '#00ff00']} />);
    await waitFor('.cp-root');
    await openMode('Pencils');
    expect(document.querySelectorAll('.cp-swatch-grid .cp-swatch')).toHaveLength(2);
  });
});

describe('mode options reach their mode', () => {
  it('forwards imageOptions into the image mode', async () => {
    render(<ChromaPanel imageOptions={{ maxColors: 12, size: 64 }} />);
    await waitFor('.cp-root');
    await openMode('Image');
    expect(await waitFor('input[type=file]')).toBeTruthy();
  });

  it('forwards arbitrary modeProps by mode id', async () => {
    render(<ChromaPanel modeProps={{ image: { extractOptions: { maxColors: 4 } } }} />);
    await waitFor('.cp-root');
    await openMode('Image');
    expect(await waitFor('input[type=file]')).toBeTruthy();
  });
});

describe('the colour a picker starts on', () => {
  it('keeps FALLBACK and DEFAULT_COLOR the same colour', () => {
    expect(toHex(FALLBACK)).toBe(DEFAULT_COLOR);
  });

  it('is visible rather than white, with no props at all', async () => {
    render(<ColorInput />);
    const trigger = await waitFor<HTMLElement>('.cp-trigger');
    await new Promise((r) => setTimeout(r, 80));

    const painted = getComputedStyle(trigger).getPropertyValue('--cp-trigger-color').trim();
    expect(painted, 'the trigger is not painted at all').not.toBe('');
    expect(painted).not.toMatch(/255,\s*255,\s*255/);
  });

  it('falls back to the same colour when the value cannot be parsed', async () => {
    render(<ChromaPanel value="definitely-not-a-colour" showTitleBar={false} modes={['sliders']} />);
    await waitFor('.cp-panel-host');
    await new Promise((r) => setTimeout(r, 80));

    const hex = [...document.querySelectorAll<HTMLInputElement>('.cp-input')]
      .map((i) => i.value).find((v) => v.startsWith('#'));
    expect(hex?.slice(0, 7)).toBe(DEFAULT_COLOR);
  });
});
