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

const closeButton = (): HTMLButtonElement =>
  document.querySelector<HTMLButtonElement>('.cp-titlebar button[aria-label="Close"]')!;

const committedColor = (): { trigger: string; form: string | undefined } => ({
  trigger: getComputedStyle(document.querySelector('.cp-trigger')!)
    .getPropertyValue('--cp-trigger-color').trim(),
  form: document.querySelector<HTMLInputElement>('input[name=c]')?.value,
});

afterEach(async () => {
  await page.viewport(DESKTOP.width, DESKTOP.height);
});

describe('closing never loses the color', () => {
  it('keeps the color when closed with the close button', async () => {
    render(<ColorInput defaultValue="#3366cc" name="c" modes={['sliders']} />);
    const trigger = await waitFor<HTMLButtonElement>('.cp-trigger');
    trigger.click();
    await waitFor('.cp-popover');

    const hex = await waitFor<HTMLInputElement>('.cp-popover input[type=text]');
    hex.focus();
    await userEvent.fill(hex, '#12ab56');
    await userEvent.keyboard('{Enter}');
    await new Promise((r) => setTimeout(r, 60));
    const before = committedColor();

    closeButton().click();
    await gone('.cp-popover');

    expect(committedColor()).toEqual(before);
    expect(committedColor().form).toBe('#12ab56');
  });

  it('returns focus to the trigger after closing', async () => {
    render(<ColorInput defaultValue="#3366cc" name="c" modes={['wheel']} />);
    const trigger = await waitFor<HTMLButtonElement>('.cp-trigger');
    trigger.click();
    await waitFor('.cp-popover');

    closeButton().click();
    await gone('.cp-popover');
    await new Promise((r) => setTimeout(r, 60));
    expect(document.activeElement).toBe(trigger);
  });

  it('reopens with the same color AND the same mode', async () => {
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

    closeButton().click();
    await gone('.cp-popover');

    trigger.click();
    await waitFor('.cp-popover');
    await new Promise((r) => setTimeout(r, 80));

    const reopenedHex = document.querySelector<HTMLInputElement>('.cp-popover input[type=text]')!;
    expect(reopenedHex.value.toLowerCase()).toContain('12ab56');

    const selected = document.querySelector('.cp-popover [role="tab"][aria-selected="true"]');
    expect(selected?.getAttribute('aria-label')).toBe('Channel values');
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

    closeButton().click();
    await gone('.cp-popover');
    expect(committedColor().form).toBe('#0a0b0c');
  });
});

describe('collapse', () => {
  it('hides the body, keeps the header and the color, and restores everything', async () => {
    const { rerender } = await render(<ChromaPanel defaultValue="#3366cc" modes={['wheel']} />);
    const body = await waitFor<HTMLElement>('.cp-body');
    const hexBefore = (await waitFor<HTMLInputElement>('input[type=text]')).value;

    await rerender(<ChromaPanel defaultValue="#3366cc" modes={['wheel']} collapsed />);
    await new Promise((r) => setTimeout(r, 60));
    expect(getComputedStyle(body).display).toBe('none');
    expect(document.querySelector('.cp-titlebar')).not.toBeNull();

    await rerender(<ChromaPanel defaultValue="#3366cc" modes={['wheel']} collapsed={false} />);
    await new Promise((r) => setTimeout(r, 60));
    expect(getComputedStyle(body).display).not.toBe('none');
    expect(document.querySelector<HTMLInputElement>('input[type=text]')!.value).toBe(hexBefore);
  });
});

describe('size', () => {
  it('widens the panel without disturbing the color', async () => {
    const { rerender } = await render(<ChromaPanel defaultValue="#3366cc" modes={['wheel']} />);
    const root = await waitFor<HTMLElement>('.cp-root');
    const hexBefore = (await waitFor<HTMLInputElement>('input[type=text]')).value;
    const widthBefore = root.getBoundingClientRect().width;

    await rerender(<ChromaPanel defaultValue="#3366cc" modes={['wheel']} size="expanded" />);
    await new Promise((r) => setTimeout(r, 80));
    expect(root.getBoundingClientRect().width).toBeGreaterThan(widthBefore);
    expect(document.querySelector<HTMLInputElement>('input[type=text]')!.value).toBe(hexBefore);
  });
});

describe('availability and keyboard', () => {
  it('shows a close button only when there is something to close', async () => {
    render(<ChromaPanel defaultValue="#3366cc" modes={['wheel']} />);
    await waitFor('.cp-titlebar');
    expect(closeButton()).toBeNull();
  });

  it('drops the whole header when nothing in it is turned on', async () => {
    render(<ChromaPanel defaultValue="#3366cc" modes={['wheel']} showTitleBar={false}
      showCopyButton={false} showEyedropper={false} />);
    await waitFor('.cp-panel-host');
    expect(document.querySelector('.cp-titlebar')).toBeNull();
    expect(document.querySelector('.cp-toolbar'), 'one mode needs no tab bar').toBeNull();
  });

  it('offers close once the panel is in something that can close', async () => {
    render(<ColorInput defaultValue="#3366cc" name="c" modes={['wheel']} />);
    const trigger = await waitFor<HTMLButtonElement>('.cp-trigger');
    trigger.click();
    await waitFor('.cp-popover');
    expect(closeButton().disabled).toBe(false);
  });

  it('closes from the keyboard', async () => {
    const onClose = vi.fn();
    render(<ChromaPanel defaultValue="#3366cc" modes={['wheel']} onClose={onClose} />);
    await waitFor('.cp-titlebar');

    closeButton().focus();
    await userEvent.keyboard('{Enter}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('reverts to the original color from the header chip', async () => {
    const onChange = vi.fn();
    render(<ChromaPanel defaultValue="#3366cc" modes={['wheel']} onChange={onChange} />);
    const hex = await waitFor<HTMLInputElement>('input[type=text]');
    hex.focus();
    await userEvent.fill(hex, '#12ab56');
    await userEvent.keyboard('{Enter}');
    await new Promise((r) => setTimeout(r, 60));

    document.querySelector<HTMLButtonElement>('.cp-chip[aria-label^="Revert"]')!.click();
    await new Promise((r) => setTimeout(r, 60));
    expect(hex.value.toLowerCase()).toContain('3366cc');
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
    expect(committedColor().form).toBe('#3366cc');
  });
});

describe('target size', () => {
  it('gives every header button at least a 24px target', async () => {
    render(<ChromaPanel defaultValue="#3366cc" modes={['wheel']} onClose={() => {}} />);
    await waitFor('.cp-titlebar');

    const buttons = Array.from(document.querySelectorAll<HTMLElement>('.cp-titlebar button'));
    expect(buttons.length).toBeGreaterThanOrEqual(3);
    for (const b of buttons) {
      const r = b.getBoundingClientRect();
      expect(Math.min(r.width, r.height), `${b.getAttribute('aria-label')} is too small`)
        .toBeGreaterThanOrEqual(24);
    }
  });
});
