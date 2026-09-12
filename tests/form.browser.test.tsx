import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import * as React from 'react';
import { ColorInput } from '../src/index';

async function waitFor<T extends Element>(selector: string, timeout = 3000): Promise<T> {
  const deadline = Date.now() + timeout;
  for (;;) {
    const el = document.querySelector<T>(selector);
    if (el !== null) return el;
    if (Date.now() > deadline) throw new Error(`timed out waiting for "${selector}"`);
    await new Promise((r) => requestAnimationFrame(r));
  }
}

/**
 * Type into a React-controlled input the way a user would.
 *
 * Assigning `.value` directly does not work: React installs a value tracker
 * on the element and swallows the change, so no handler fires. Going through
 * the native prototype setter is what a real keystroke effectively does.
 */
function type(input: HTMLInputElement, value: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value',
  );
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** What a real submit would send. */
const submitted = (form: HTMLFormElement): Record<string, string> =>
  Object.fromEntries(new FormData(form) as unknown as Iterable<[string, string]>);

describe('native form semantics', () => {
  it('submits the colour under its name', async () => {
    render(
      <form data-testid="f">
        <ColorInput defaultValue="#3366cc" name="brand" />
      </form>,
    );
    await waitFor('.cp-trigger');
    const form = document.querySelector<HTMLFormElement>('form')!;
    expect(submitted(form)).toEqual({ brand: '#3366cc' });
  });

  it('does NOT submit when disabled', async () => {
    // The spec's form-data-set algorithm skips disabled controls. This was the
    // bug: the old hidden input was never disabled, so it submitted anyway.
    render(
      <form>
        <ColorInput defaultValue="#3366cc" name="brand" disabled />
      </form>,
    );
    await waitFor('.cp-trigger');
    const form = document.querySelector<HTMLFormElement>('form')!;
    expect(submitted(form)).toEqual({});
    expect(document.querySelector<HTMLInputElement>('input[name=brand]')!.disabled).toBe(true);
  });

  it('DOES submit when readOnly, and stays focusable', async () => {
    // readonly is not disabled: the value still submits and the control is
    // still reachable. That distinction is the whole point of readonly.
    render(
      <form>
        <ColorInput defaultValue="#3366cc" name="brand" readOnly />
      </form>,
    );
    const trigger = await waitFor<HTMLButtonElement>('.cp-trigger');
    const form = document.querySelector<HTMLFormElement>('form')!;

    expect(submitted(form)).toEqual({ brand: '#3366cc' });
    expect(trigger.disabled).toBe(false);
    expect(trigger.getAttribute('aria-readonly')).toBe('true');

    // ...but it must not open.
    trigger.click();
    await new Promise((r) => setTimeout(r, 60));
    expect(document.querySelector('.cp-popover')).toBeNull();
  });

  it('is disabled by a disabled fieldset ancestor', async () => {
    // The platform disables descendants natively; React cannot see it without
    // observing the attribute.
    render(
      <form>
        <fieldset disabled>
          <ColorInput defaultValue="#3366cc" name="brand" />
        </fieldset>
      </form>,
    );
    await waitFor('.cp-trigger');
    await new Promise((r) => setTimeout(r, 80));
    const form = document.querySelector<HTMLFormElement>('form')!;
    expect(submitted(form)).toEqual({});
  });

  it('restores the default colour when the form is reset', async () => {
    // Reset fires no input/change event, so this only works by listening for
    // `reset` on the form owner.
    render(
      <form>
        <ColorInput defaultValue="#3366cc" name="brand" modes={['sliders']} />
      </form>,
    );
    const trigger = await waitFor<HTMLButtonElement>('.cp-trigger');
    const form = document.querySelector<HTMLFormElement>('form')!;

    trigger.click();
    const hex = await waitFor<HTMLInputElement>('.cp-popover input[type=text]');
    hex.focus();
    type(hex, '#12ab56');
    await new Promise((r) => setTimeout(r, 80));
    expect(submitted(form).brand?.toLowerCase()).toContain('12ab56');

    form.reset();
    await new Promise((r) => setTimeout(r, 120));
    expect(submitted(form)).toEqual({ brand: '#3366cc' });
  });

  it('associates with a form by id from outside it', async () => {
    render(
      <div>
        <form id="outer" />
        <ColorInput defaultValue="#3366cc" name="brand" form="outer" />
      </div>,
    );
    await waitFor('.cp-trigger');
    const form = document.querySelector<HTMLFormElement>('#outer')!;
    expect(submitted(form)).toEqual({ brand: '#3366cc' });
  });

  it('notifies the surrounding form when the colour changes', async () => {
    // React installs a value tracker that swallows programmatic assignment,
    // so the value has to be written through the native prototype setter.
    const onChange = vi.fn();
    render(
      <form onChange={onChange}>
        <ColorInput defaultValue="#3366cc" name="brand" modes={['sliders']} />
      </form>,
    );
    const trigger = await waitFor<HTMLButtonElement>('.cp-trigger');
    trigger.click();
    const hex = await waitFor<HTMLInputElement>('.cp-popover input[type=text]');
    hex.focus();
    type(hex, '#12ab56');
    await new Promise((r) => setTimeout(r, 80));
    expect(onChange).toHaveBeenCalled();
  });

  it('uses a real input, not type=hidden', async () => {
    // type=hidden is barred from constraint validation and cannot take
    // readonly or required, so it could never support the behaviour above.
    render(<ColorInput defaultValue="#3366cc" name="brand" />);
    const input = await waitFor<HTMLInputElement>('input[name=brand]');
    expect(input.type).not.toBe('hidden');
    expect(getComputedStyle(input).display).not.toBe('none');  // Safari autofill
  });
});
