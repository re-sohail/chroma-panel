import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import * as React from 'react';
import { ChromaPanel } from '../src/index';

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
const recents = ['#111111', '#222222', '#333333', '#444444'];

describe('things a real user runs into', () => {
  it('keeps keyboard focus inside the panel after Clear', async () => {
    render(<ChromaPanel modes={['wheel', 'sliders']} defaultRecentColors={recents} />);
    const clear = await waitFor<HTMLButtonElement>('.cp-footer .cp-text-button');
    clear.focus();
    await userEvent.keyboard('{Enter}');
    await settle();
    expect(document.querySelector('.cp-footer')).toBeNull();
    expect(document.activeElement?.closest('.cp-root'), 'focus fell back to the page').not.toBeNull();
  });

  it('makes History one tab stop that arrow keys move through', async () => {
    render(<ChromaPanel modes={['wheel']} defaultRecentColors={recents} />);
    await waitFor('.cp-recents');
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.cp-recents button'));
    expect(buttons.filter((b) => b.tabIndex === 0)).toHaveLength(1);

    buttons[0]!.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(buttons[1]);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
  });

  it('gives Clear a target of at least 24px', async () => {
    render(<ChromaPanel modes={['wheel']} defaultRecentColors={recents} />);
    const clear = await waitFor<HTMLButtonElement>('.cp-footer .cp-text-button');
    expect(clear.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
  });

  it('shows six hex digits for an opaque color and eight once it is translucent', async () => {
    render(<ChromaPanel modes={['classic']} defaultValue="#3366cc" />);
    const hex = await waitFor<HTMLInputElement>('.cp-hex .cp-input');
    expect(hex.value).toBe('3366CC');

    const opacity = await waitFor<HTMLInputElement>('input[aria-label="Opacity"]');
    opacity.focus();
    await userEvent.keyboard('{Home}');
    await settle();
    expect(hex.value).toBe('3366CC00');
  });

  it('never clips the harmony selection ring', async () => {
    render(<ChromaPanel modes={['harmony']} defaultValue="#3366cc" />);
    const host = await waitFor<HTMLElement>('.cp-panel-host');
    await settle();
    const selected = document.querySelector<HTMLElement>('.cp-harmony-swatches [aria-pressed="true"]')!;
    const style = getComputedStyle(selected);
    const reach = parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth);
    host.scrollTop = host.scrollHeight;
    await settle();
    expect(selected.getBoundingClientRect().bottom + reach).toBeLessThanOrEqual(host.getBoundingClientRect().bottom + 0.5);
  });

  it('switches harmony rules from the keyboard', async () => {
    render(<ChromaPanel modes={['harmony']} defaultValue="#3366cc" />);
    const first = await waitFor<HTMLElement>('[aria-label="Harmony rule"] [role="tab"][aria-selected="true"]');
    first.focus();
    await userEvent.keyboard('{End}');
    await settle();
    expect(document.querySelectorAll('.cp-harmony-swatches .cp-swatch')).toHaveLength(4);
  });
});
