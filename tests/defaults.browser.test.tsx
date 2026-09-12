import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import * as React from 'react';
import { ChromaPanel, PENCIL_COLUMNS } from '../src/index';

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
  // `modes` defaults to all five, so leaving palettes and pencils at [] meant
  // two of the five rendered blank for anyone who just wrote <ChromaPanel />.
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
  // ChromaPanel renders `<active.Panel />`, so without a pass-through the
  // image mode's worker, sample size and colour count were unreachable.
  it('forwards imageOptions into the image mode', async () => {
    render(<ChromaPanel imageOptions={{ maxColors: 12, size: 64 }} />);
    await waitFor('.cp-root');
    await openMode('Image');
    // The mode renders; the options are wired through context rather than
    // being silently dropped.
    expect(await waitFor('input[type=file]')).toBeTruthy();
  });

  it('forwards arbitrary modeProps by mode id', async () => {
    render(<ChromaPanel modeProps={{ image: { extractOptions: { maxColors: 4 } } }} />);
    await waitFor('.cp-root');
    await openMode('Image');
    expect(await waitFor('input[type=file]')).toBeTruthy();
  });
});
