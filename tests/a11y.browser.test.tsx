import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import * as React from 'react';
import { ChromaPanel, ColorInput, defaultPalettes, defaultPencils } from '../src/index';
import type { ColorChangeResult } from '../src/color/types';

async function waitFor<T extends Element>(selector: string, timeout = 2000): Promise<T> {
  const deadline = Date.now() + timeout;
  for (;;) {
    const el = document.querySelector<T>(selector);
    if (el !== null) return el;
    if (Date.now() > deadline) throw new Error(`timed out waiting for "${selector}"`);
    await new Promise((r) => requestAnimationFrame(r));
  }
}

async function waitForAll<T extends Element>(selector: string, count: number, timeout = 2000): Promise<T[]> {
  const deadline = Date.now() + timeout;
  for (;;) {
    const els = Array.from(document.querySelectorAll<T>(selector));
    if (els.length >= count) return els;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${count}x "${selector}"`);
    await new Promise((r) => requestAnimationFrame(r));
  }
}

describe('keyboard operation', () => {
  it('exposes every color axis as a real, labelled slider', async () => {
    render(<ChromaPanel defaultValue="#3366cc" modes={['wheel']} showTitleBar={false} />);
    await expect.element(page.getByRole('slider', { name: 'Hue' })).toBeInTheDocument();
    await expect.element(page.getByRole('slider', { name: 'Saturation' })).toBeInTheDocument();
    await expect.element(page.getByRole('slider', { name: 'Brightness' })).toBeInTheDocument();
    await expect.element(page.getByRole('slider', { name: 'Opacity' })).toBeInTheDocument();
  });

  it('moves the color with arrow keys', async () => {
    const onChange = vi.fn();
    render(
      <ChromaPanel defaultValue="#3366cc" modes={['wheel']} showTitleBar={false} onChange={onChange} />,
    );

    const hue = await waitFor<HTMLInputElement>('input[aria-label="Hue"]');
    const before = Number(hue.value);
    hue.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');

    expect(Number(hue.value)).toBeGreaterThan(before);
    expect(onChange).toHaveBeenCalled();
  });

  it('jumps to the extremes with Home and End', async () => {
    render(<ChromaPanel defaultValue="#3366cc" modes={['wheel']} showTitleBar={false} />);
    const sat = await waitFor<HTMLInputElement>('input[aria-label="Saturation"]');

    sat.focus();
    await userEvent.keyboard('{Home}');
    expect(Number(sat.value)).toBe(0);
    await userEvent.keyboard('{End}');
    expect(Number(sat.value)).toBe(100);
  });

  it('announces a human-readable value, not just a number', async () => {
    render(<ChromaPanel defaultValue="#3366cc" modes={['wheel']} showTitleBar={false} />);
    const hue = await waitFor<HTMLInputElement>('input[aria-label="Hue"]');
    hue.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(hue.getAttribute('aria-valuetext')).toMatch(/Hue \d+ degrees/);
  });

  it('drives the mode toolbar as a tablist with a roving tab stop', async () => {
    render(
      <ChromaPanel
        defaultValue="#3366cc"
        modes={['wheel', 'sliders', 'palettes']}
        palettes={defaultPalettes()}
        showTitleBar={false}
      />,
    );

    const tabs = await waitForAll<HTMLElement>('[role="tablist"][aria-label="Picker mode"] [role="tab"]', 3);
    expect(tabs).toHaveLength(3);
    expect(tabs.filter((t) => t.tabIndex === 0)).toHaveLength(1);

    tabs[0]!.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(tabs[1]!.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tabs[1]);
  });
});

describe('labelling', () => {
  it('gives every form control an accessible name', async () => {
    render(
      <ChromaPanel
        defaultValue="#3366cc"
        modes={['sliders']}
        showTitleBar={false}
      />,
    );
    await expect.element(page.getByRole('slider', { name: /red/i })).toBeInTheDocument();

    const controls = Array.from(
      document.querySelectorAll<HTMLElement>('input, button, select, textarea'),
    );
    expect(controls.length).toBeGreaterThan(5);

    for (const el of controls) {
      const labelled =
        el.getAttribute('aria-label') ??
        (el.id !== '' ? document.querySelector(`label[for="${el.id}"]`)?.textContent : null) ??
        el.textContent?.trim();
      expect(labelled, `${el.tagName}.${el.className} has no accessible name`).toBeTruthy();
    }
  });

  it('exposes the window dots as real, labelled buttons', async () => {
    render(<ChromaPanel defaultValue="#3366cc" modes={['wheel']} />);
    const lights = await waitFor<HTMLElement>('.cp-lights');

    expect(lights.getAttribute('aria-hidden')).toBeNull();
    const buttons = Array.from(lights.querySelectorAll('button'));
    expect(buttons).toHaveLength(3);
    for (const b of buttons) {
      expect(b.getAttribute('aria-label')).toBeTruthy();
    }
  });
});

describe('regressions from other pickers', () => {
  it('keeps hue when brightness is dragged to zero and back (uiw #98, #136)', async () => {
    const onChange = vi.fn();
    render(
      <ChromaPanel defaultValue="#3366cc" modes={['sliders']} showTitleBar={false} onChange={onChange} />,
    );
    await expect.element(page.getByRole('slider', { name: /red/i })).toBeInTheDocument();

    const hsb = (await waitForAll<HTMLElement>('[role="tab"]', 3))
      .find((t) => t.textContent === 'HSB');
    hsb?.click();
    await new Promise((r) => setTimeout(r, 30));

    const brightness = await waitFor<HTMLInputElement>('input[aria-label="Brightness"]');
    const hue = await waitFor<HTMLInputElement>('input[aria-label="Hue"]');
    const originalHue = hue.value;

    brightness.focus();
    await userEvent.keyboard('{Home}'); // to black
    expect(Number(brightness.value)).toBe(0);
    await userEvent.keyboard('{End}');  // back up

    expect(hue.value).toBe(originalHue);
  });

  it('does not stomp the color when a parent echoes onChange into value', async () => {
    function Echoing(): React.ReactElement {
      const [color, setColor] = React.useState('#3366cc');
      return (
        <ChromaPanel
          value={color}
          modes={['sliders']}
          showTitleBar={false}
          onChange={(c: ColorChangeResult) => setColor(c.hex)}
        />
      );
    }

    render(<Echoing />);
    await expect.element(page.getByRole('slider', { name: /red/i })).toBeInTheDocument();

    const green = await waitFor<HTMLInputElement>('input[aria-label="Green"]');
    green.focus();
    for (let i = 0; i < 5; i++) await userEvent.keyboard('{ArrowRight}');
    await new Promise((r) => setTimeout(r, 40));

    expect(Number(green.value)).toBeGreaterThan(102);
  });

  it('leaves the page globals untouched (react-colorful #179)', async () => {
    const before = new Set(Object.keys(window));
    render(<ChromaPanel defaultValue="#3366cc" />);
    await expect.element(page.getByRole('group', { name: /color wheel/i })).toBeInTheDocument();
    const added = Object.keys(window).filter((k) => !before.has(k));
    expect(added).toEqual([]);
  });

  it('injects exactly one stylesheet no matter how many panels mount', async () => {
    render(
      <div>
        <ChromaPanel defaultValue="#ff0000" modes={['wheel']} />
        <ChromaPanel defaultValue="#00ff00" modes={['wheel']} />
        <ChromaPanel defaultValue="#0000ff" modes={['wheel']} />
      </div>,
    );
    await expect.element(page.getByRole('slider', { name: 'Hue' }).first()).toBeInTheDocument();
    expect(document.querySelectorAll('style[data-chroma-panel]')).toHaveLength(1);
  });
});

describe('the popover', () => {
  it('opens, traps focus, and closes on Escape returning focus to the trigger', async () => {
    render(<ColorInput defaultValue="#3366cc" modes={['wheel']} />);

    const trigger = await waitFor<HTMLButtonElement>('.cp-trigger');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    trigger.click();
    await expect.element(page.getByRole('dialog')).toBeInTheDocument();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('.cp-popover')?.contains(document.activeElement)).toBe(true);

    await userEvent.keyboard('{Escape}');
    await new Promise((r) => setTimeout(r, 30));
    expect(document.querySelector('.cp-popover')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});

describe('swatch grids', () => {
  it('renders pencils as real buttons with accessible names', async () => {
    render(
      <ChromaPanel defaultValue="#3366cc" modes={['pencils']} pencils={defaultPencils()} showTitleBar={false} />,
    );
    await expect.element(page.getByRole('button').first()).toBeInTheDocument();

    const swatches = document.querySelectorAll('.cp-swatch-grid button');
    expect(swatches.length).toBeGreaterThan(50);
    for (const el of Array.from(swatches).slice(0, 5)) {
      expect(el.getAttribute('aria-label')).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('selects a color on click and marks it pressed', async () => {
    const onChangeComplete = vi.fn();
    render(
      <ChromaPanel
        defaultValue="#000000" modes={['pencils']} pencils={['#ff0000', '#00ff00', '#0000ff']}
        showTitleBar={false} onChangeComplete={onChangeComplete}
      />,
    );
    await expect.element(page.getByRole('button', { name: '#00ff00' })).toBeInTheDocument();

    const target = await waitFor<HTMLElement>('[data-cp-color="#00ff00"]');
    target.click();
    await new Promise((r) => setTimeout(r, 30));

    expect(onChangeComplete).toHaveBeenCalledTimes(1);
    expect(target.getAttribute('aria-pressed')).toBe('true');
  });
});
