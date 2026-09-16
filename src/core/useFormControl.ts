'use client';

import * as React from 'react';

export function setNativeValue(input: HTMLInputElement, value: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  );
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

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
      if (event.defaultPrevented) return;
      latest.current();
    };

    form.addEventListener('reset', handle);
    return () => form.removeEventListener('reset', handle);
  }, [ref]);
}

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
  behavior: 'native' | 'aria';
  required: boolean;
  isEmpty: boolean;
  focusTrigger: () => void;
}

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
      behavior === 'native' && required && isEmpty ? 'Please choose a color.' : '';
    input.setCustomValidity(message);

    if (!input.hasAttribute('title')) input.title = '';
  });

  React.useEffect(() => {
    const input = ref.current;
    if (input === null) return;

    const onInvalid = (event: Event): void => {
      event.preventDefault();
      latest.current.focusTrigger();
    };

    input.addEventListener('invalid', onInvalid);
    return () => input.removeEventListener('invalid', onInvalid);
  }, [ref]);
}

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
