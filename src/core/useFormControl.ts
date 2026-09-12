'use client';

import * as React from 'react';

/**
 * Native form behaviour for a custom control.
 *
 * A colour picker is a button plus a hidden field, so none of this comes for
 * free the way it does for a real `<input>`. Each piece below exists because
 * the platform does something a React component cannot observe on its own.
 */

/**
 * Write a value the way a user would, so React sees it.
 *
 * React installs a value tracker on inputs and swallows programmatic
 * assignments it believes it already knows about — so `input.value = x`
 * followed by a dispatched event fires nothing. Going through the native
 * prototype setter bypasses the tracker, and the event then propagates to the
 * surrounding form's `onChange`.
 */
export function setNativeValue(input: HTMLInputElement, value: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  );
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Restore the default value when the surrounding form is reset.
 *
 * Resetting fires no `input` or `change` event — the spec says changes made by
 * the reset algorithm "do not count as changes caused by the user" — so the
 * only way to notice is to listen for `reset` itself.
 *
 * The listener goes on the element's FORM OWNER, not `closest('form')`: those
 * differ whenever a control uses the `form="someId"` attribute to associate
 * with a form it is not nested inside.
 */
export function useFormReset(
  ref: React.RefObject<HTMLInputElement | null>,
  onReset: () => void,
): void {
  const latest = React.useRef(onReset);
  React.useEffect(() => {
    latest.current = onReset;
  });

  React.useEffect(() => {
    const form = ref.current?.form;
    if (form === null || form === undefined) return;

    const handle = (event: Event): void => {
      // `reset` is cancelable; a consumer may have called preventDefault().
      if (event.defaultPrevented) return;
      latest.current();
    };

    form.addEventListener('reset', handle);
    return () => form.removeEventListener('reset', handle);
  }, [ref]);
}

/**
 * Track a `<fieldset disabled>` ancestor.
 *
 * The platform disables descendant controls of a disabled fieldset natively,
 * so the button really does stop working — but React state has no idea, and
 * the panel would keep rendering as enabled. There is no event for this, hence
 * the observer.
 */
export function useFieldsetDisabled(
  ref: React.RefObject<HTMLElement | null>,
): boolean {
  const [disabled, setDisabled] = React.useState(false);

  React.useEffect(() => {
    const fieldset = ref.current?.closest('fieldset');
    if (fieldset === null || fieldset === undefined) {
      setDisabled(false);
      return;
    }

    setDisabled(fieldset.disabled);
    const observer = new MutationObserver(() => setDisabled(fieldset.disabled));
    observer.observe(fieldset, { attributes: true, attributeFilter: ['disabled'] });
    return () => observer.disconnect();
  }, [ref]);

  return disabled;
}

export interface ValidationOptions {
  /**
   * `native` blocks submission through constraint validation.
   * `aria` only marks the control invalid for assistive technology, leaving
   * submission to a form library's own resolver.
   */
  behavior: 'native' | 'aria';
  required: boolean;
  isEmpty: boolean;
  /** Focus the visible trigger — never the visually hidden input. */
  focusTrigger: () => void;
}

/**
 * Participate in constraint validation.
 *
 * Requires a real input: `type="hidden"` is barred from constraint validation
 * by the HTML spec, so it can never be `:invalid` and `setCustomValidity()` on
 * it does nothing.
 */
export function useConstraintValidation(
  ref: React.RefObject<HTMLInputElement | null>,
  options: ValidationOptions,
): void {
  const latest = React.useRef(options);
  React.useEffect(() => {
    latest.current = options;
  });

  React.useEffect(() => {
    const input = ref.current;
    if (input === null) return;

    const { behavior, required, isEmpty } = latest.current;
    const message =
      behavior === 'native' && required && isEmpty ? 'Please choose a colour.' : '';
    input.setCustomValidity(message);

    // Firefox shows the `title` as part of its validation tooltip; an empty
    // one suppresses it. https://bugzilla.mozilla.org/show_bug.cgi?id=605277
    if (!input.hasAttribute('title')) input.title = '';
  });

  React.useEffect(() => {
    const input = ref.current;
    if (input === null) return;

    const onInvalid = (event: Event): void => {
      // The browser would otherwise anchor its error bubble to an element
      // nobody can see, so suppress it and move focus somewhere visible.
      event.preventDefault();
      latest.current.focusTrigger();
    };

    input.addEventListener('invalid', onInvalid);
    return () => input.removeEventListener('invalid', onInvalid);
  }, [ref]);
}

/**
 * Visually hidden, but still focusable and still submitted.
 *
 * Deliberately not `display: none`: that removes the control from the
 * accessibility tree and breaks Safari's autofill.
 */
export const visuallyHiddenInput: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
  opacity: 0,
  pointerEvents: 'none',
};
