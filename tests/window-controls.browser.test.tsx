import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import * as React from 'react';
import { ChromaPanel, ColorInput } from '../src/index';

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

async function gone(selector: string, timeout = 3000): Promise<void> {
  const deadline = Date.now() + timeout;
  while (document.querySelector(selector) !== null) {
    if (Date.now() > deadline) throw new Error(`"${selector}" never went away`);
    await new Promise((r) => requestAnimationFrame(r));
  }
}

const light = (which: 'close' | 'min' | 'max'): HTMLButtonElement =>
  document.querySelector<HTMLButtonElement>(`.cp-light[data-cp-light="${which}"]`)!;

const committedColour = (): { trigger: string; form: string | undefined } => ({
  trigger: getComputedStyle(document.querySelector('.cp-trigger')!)
    .getPropertyValue('--cp-trigger-color').trim(),
  form: document.querySelector<HTMLInputElement>('input[name=c]')?.value,
});

afterEach(async () => {
  await page.viewport(DESKTOP.width, DESKTOP.height);
});

describe('closing never loses the colour', () => {
  it('keeps the colour when closed with the red control', async () => {
    render(<ColorInput defaultValue="#3366cc" name="c" modes={['sliders']} />);
    const trigger = await waitFor<HTMLButtonElement>('.cp-trigger');
    trigger.click();
    await waitFor('.cp-popover');

    const hex = await waitFor<HTMLInputElement>('.cp-popover input[type=text]');
    hex.focus();
    await userEvent.fill(hex, '#12ab56');
    await userEvent.keyboard('{Enter}');
    await new Promise((r) => setTimeout(r, 60));
    const before = committedColour();

    light('close').click();
    await gone('.cp-popover');

    expect(committedColour()).toEqual(before);
    expect(committedColour().form).toBe('#12ab56');
  });

  it('returns focus to the trigger after closing', async () => {
    render(<ColorInput defaultValue="#3366cc" name="c" modes={['wheel']} />);
    const trigger = await waitFor<HTMLButtonElement>('.cp-trigger');
    trigger.click();
    await waitFor('.cp-popover');

    light('close').click();
    await gone('.cp-popover');
    await new Promise((r) => setTimeout(r, 60));
    expect(document.activeElement).toBe(trigger);
  });

  it('reopens with the same colour AND the same mode', async () => {
    render(<ColorInput defaultValue="#3366cc" name="c" modes={['wheel', 'sliders', 'palettes']} />);
    const trigger = await waitFor<HTMLButtonElement>('.cp-trigger');
    trigger.click();
    await waitFor('.cp-popover');

    const tabs = Array.from(document.querySelectorAll<HTMLElement>('.cp-popover [role="tab"]'));
    tabs[1]!.click();
    await new Promise((r) => setTimeout(r, 60));

    const hex = await waitFor<HTMLInputElement>('.cp-popover input[type=text]');
    hex.focus();
    await userEvent.fill(hex, '#12ab56');
    await userEvent.keyboard('{Enter}');
    await new Promise((r) => setTimeout(r, 60));

    light('close').click();
    await gone('.cp-popover');

    trigger.click();
    await waitFor('.cp-popover');
    await new Promise((r) => setTimeout(r, 80));

    const reopenedHex = document.querySelector<HTMLInputElement>('.cp-popover input[type=text]')!;
    expect(reopenedHex.value.toLowerCase()).toContain('12ab56');

    const selected = document.querySelector('.cp-popover [role="tab"][aria-selected="true"]');
    expect(selected?.getAttribute('aria-label')).toBe('Sliders');
  });

  it('keeps a hex typed but never blurred', async () => {
    render(<ColorInput defaultValue="#3366cc" name="c" modes={['sliders']} />);
    const trigger = await waitFor<HTMLButtonElement>('.cp-trigger');
    trigger.click();
    await waitFor('.cp-popover');

    const hex = await waitFor<HTMLInputElement>('.cp-popover input[type=text]');
    hex.focus();
    await userEvent.fill(hex, '#0a0b0c');
    await new Promise((r) => setTimeout(r, 60));

    light('close').click();
    await gone('.cp-popover');
    expect(committedColour().form).toBe('#0a0b0c');
  });
});

describe('collapse', () => {
  it('hides the body, keeps the colour, and restores everything', async () => {
    render(<ChromaPanel defaultValue="#3366cc" modes={['wheel']} />);
    const body = await waitFor<HTMLElement>('.cp-body');
    const hexBefore = (await waitFor<HTMLInputElement>('input[type=text]')).value;

    expect(getComputedStyle(body).display).not.toBe('none');
    light('min').click();
    await new Promise((r) => setTimeout(r, 60));

    expect(getComputedStyle(body).display).toBe('none');
    expect(document.querySelector('.cp-body')).toBe(body);
    expect(light('min').getAttribute('aria-expanded')).toBe('false');

    light('min').click();
    await new Promise((r) => setTimeout(r, 60));
    expect(getComputedStyle(body).display).not.toBe('none');
    expect(light('min').getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector<HTMLInputElement>('input[type=text]')!.value).toBe(hexBefore);
  });

  it('points aria-controls at the body it collapses', async () => {
    render(<ChromaPanel defaultValue="#3366cc" modes={['wheel']} />);
    const body = await waitFor<HTMLElement>('.cp-body');
    expect(light('min').getAttribute('aria-controls')).toBe(body.id);
    expect(body.id).toBeTruthy();
  });
});

describe('zoom', () => {
  it('widens the panel without disturbing the colour', async () => {
    render(<ChromaPanel defaultValue="#3366cc" modes={['wheel']} />);
    const root = await waitFor<HTMLElement>('.cp-root');
    const hexBefore = (await waitFor<HTMLInputElement>('input[type=text]')).value;
    const widthBefore = root.getBoundingClientRect().width;

    expect(light('max').getAttribute('aria-pressed')).toBe('false');
    light('max').click();
    await new Promise((r) => setTimeout(r, 80));

    expect(root.getBoundingClientRect().width).toBeGreaterThan(widthBefore);
    expect(light('max').getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector<HTMLInputElement>('input[type=text]')!.value).toBe(hexBefore);

    light('max').click();
    await new Promise((r) => setTimeout(r, 80));
    expect(root.getBoundingClientRect().width).toBeCloseTo(widthBefore, 0);
  });
});

describe('availability and keyboard', () => {
  it('disables close when there is nothing to close, rather than removing it', async () => {
    render(<ChromaPanel defaultValue="#3366cc" modes={['wheel']} />);
    await waitFor('.cp-lights');

    expect(document.querySelectorAll('.cp-lights button')).toHaveLength(3);
    expect(light('close').disabled).toBe(true);
    expect(light('min').disabled).toBe(false);
    expect(light('max').disabled).toBe(false);
  });

  it('enables close once the panel is in something that can close', async () => {
    render(<ColorInput defaultValue="#3366cc" name="c" modes={['wheel']} />);
    const trigger = await waitFor<HTMLButtonElement>('.cp-trigger');
    trigger.click();
    await waitFor('.cp-popover');
    expect(light('close').disabled).toBe(false);
  });

  it('operates all three controls from the keyboard', async () => {
    const onClose = vi.fn();
    render(<ChromaPanel defaultValue="#3366cc" modes={['wheel']} onClose={onClose} />);
    await waitFor('.cp-lights');

    light('min').focus();
    await userEvent.keyboard('{Enter}');
    await new Promise((r) => setTimeout(r, 60));
    expect(light('min').getAttribute('aria-expanded')).toBe('false');

    light('max').focus();
    await userEvent.keyboard('{Enter}');
    await new Promise((r) => setTimeout(r, 60));
    expect(light('max').getAttribute('aria-pressed')).toBe('true');

    light('close').focus();
    await userEvent.keyboard('{Enter}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('the sheet', () => {
  it('gives the grab handle an accessible name so it is not gesture-only', async () => {
    await page.viewport(390, 844);
    render(<ColorInput defaultValue="#3366cc" name="c" modes={['wheel']} />);
    const trigger = await waitFor<HTMLButtonElement>('.cp-trigger');
    trigger.click();

    const grabber = await waitFor<HTMLButtonElement>('.cp-grabber');
    expect(grabber.tagName).toBe('BUTTON');
    expect(grabber.getAttribute('aria-label')).toBe('Close');

    grabber.click();
    await gone('.cp-sheet');
    expect(committedColour().form).toBe('#3366cc');
  });
});

describe('target size', () => {
  it('spaces the window controls far enough apart to satisfy the spacing exception', async () => {
    render(<ChromaPanel defaultValue="#3366cc" modes={['wheel']} />);
    await waitFor('.cp-lights');

    const centres = Array.from(document.querySelectorAll<HTMLElement>('.cp-lights button'))
      .map((b) => {
        const r = b.getBoundingClientRect();
        return r.left + r.width / 2;
      })
      .sort((a, b) => a - b);

    expect(centres).toHaveLength(3);
    for (let i = 1; i < centres.length; i++) {
      const pitch = centres[i]! - centres[i - 1]!;
      expect(pitch, `only ${pitch.toFixed(1)}px between control centres`)
        .toBeGreaterThanOrEqual(24);
    }
  });
});
