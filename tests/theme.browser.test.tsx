import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import * as React from 'react';
import { ChromaPanel } from '../src/index';

async function rootBg(): Promise<string> {
  for (let i = 0; i < 60; i++) {
    const root = document.querySelector('.cp-root');
    if (root !== null && document.querySelector('style[data-chroma-panel]') !== null) {
      await new Promise((r) => requestAnimationFrame(r));
      return getComputedStyle(root).backgroundColor;
    }
    await new Promise((r) => requestAnimationFrame(r));
  }
  throw new Error('panel never rendered');
}

const DARK = 'rgb(22, 22, 29)';
const LIGHT = 'rgb(255, 255, 255)';

afterEach(() => {
  document.documentElement.className = '';
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.colorScheme = '';
});

describe('auto theme follows the page before the OS', () => {
  it('goes dark under a Tailwind-style .dark class', async () => {
    document.documentElement.classList.add('dark');
    render(<ChromaPanel modes={['wheel']} />);
    expect(await rootBg()).toBe(DARK);
  });

  it('goes dark under next-themes data-theme and inline color-scheme', async () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.colorScheme = 'dark';
    render(<ChromaPanel modes={['wheel']} theme="auto" />);
    expect(await rootBg()).toBe(DARK);
  });

  it('lets an explicit theme prop win over the page', async () => {
    document.documentElement.classList.add('dark');
    render(<ChromaPanel modes={['wheel']} theme="light" />);
    expect(await rootBg()).toBe(LIGHT);
  });
});
