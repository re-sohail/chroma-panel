'use client';

import * as React from 'react';
import { parse } from '../color/parse';
import { toFormat, toRgbaString } from '../color/serialize';
import type { Hsva } from '../color/types';
import { cx, useStableId } from '../core/context';
import { createColorStore } from '../core/store';
import {
  setNativeValue, useConstraintValidation, useFieldsetDisabled, useFormReset,
  visuallyHiddenInput,
} from '../core/useFormControl';
import { useTransientColor } from '../core/useColorStore';
import { ChromaPanel, type ChromaPanelProps } from './ChromaPanel';
import { Popover } from './Popover';

export interface ColorInputProps extends ChromaPanelProps {
  /** Controlled open state. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  /** Submits the current colour with a form, like a native input would. */
  name?: string;
  /** Associates with a form by id, for a control rendered outside it. */
  form?: string;
  /** Blocks submission while no colour has been chosen. */
  required?: boolean;
  /**
   * Value is submitted but cannot be changed. Unlike `disabled`, a read-only
   * control stays focusable and still submits — that is the spec distinction.
   */
  readOnly?: boolean;
  autoComplete?: string;
  /**
   * `native` blocks submission via constraint validation. `aria` only marks
   * the field invalid for assistive technology, which is what form libraries
   * such as react-hook-form generally want.
   */
  validationBehavior?: 'native' | 'aria';
  id?: string;
  /** Accessible name for the trigger. Default "Choose a colour". */
  'aria-label'?: string;
  triggerClassName?: string;
}

/**
 * A colour swatch that opens the panel in a popover.
 *
 * This is the drop-in replacement for `<input type="color">`: the native
 * control hands off to an OS window (Apple's NSColorPanel on macOS) that a
 * web page cannot style or even see, so the same picker cannot be delivered
 * across browsers any other way.
 */
export function ColorInput(props: ColorInputProps): React.ReactElement {
  const {
    open, defaultOpen = false, onOpenChange,
    name, form, required = false, readOnly = false, autoComplete,
    validationBehavior = 'native',
    id, 'aria-label': ariaLabel = 'Choose a colour', triggerClassName,
    disabled: disabledProp = false, className, classNames = {}, format = 'hex',
    value, defaultValue = '#ffffff', store: externalStore,
    // Pulled out of panelProps so this component can own the active mode.
    mode, defaultMode, onModeChange,
    ...panelProps
  } = props;

  const triggerId = useStableId('cp-trigger-');
  const hiddenRef = React.useRef<HTMLInputElement>(null);

  // A <fieldset disabled> ancestor disables descendants natively, but React
  // cannot see that, so the panel would still render as enabled.
  const fieldsetDisabled = useFieldsetDisabled(hiddenRef);
  const disabled = disabledProp || fieldsetDisabled;
  const [trigger, setTrigger] = React.useState<HTMLButtonElement | null>(null);
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isOpen = open ?? internalOpen;

  const setOpen = React.useCallback(
    (next: boolean): void => {
      if (open === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [open, onOpenChange],
  );

  // One store shared between the trigger swatch, the hidden form input and
  // the panel, so the trigger tracks a drag without re-rendering.
  const ownStore = React.useMemo(
    () => {
      const seed = value ?? defaultValue;
      const parsed = typeof seed === 'string' ? parse(seed) : seed;
      return createColorStore(parsed ?? { h: 0, s: 0, v: 100, a: 1 });
    },
    // Seeded once; `value` changes are handled by ChromaPanel's sync effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const store = externalStore ?? ownStore;

  /**
   * The active mode lives here, not in ChromaPanel.
   *
   * The popover unmounts its children on close, so a mode held inside the
   * panel is discarded every time it shuts — close on Sliders, reopen on the
   * colour wheel. This component stays mounted, so holding it here is what
   * makes the picker reopen where you left it.
   *
   * No new public API: `mode` / `defaultMode` / `onModeChange` already exist
   * on ChromaPanelProps, and a consumer passing their own still wins.
   */
  const [internalMode, setInternalMode] = React.useState<string | undefined>(defaultMode);
  const activeMode = mode ?? internalMode;

  const handleModeChange = React.useCallback(
    (next: string): void => {
      if (mode === undefined) setInternalMode(next);
      onModeChange?.(next);
    },
    [mode, onModeChange],
  );

  /**
   * Closing from a control inside the panel.
   *
   * Deliberately separate from the Popover's own dismissal: a click somewhere
   * else on the page should NOT pull focus back to the trigger, but pressing
   * an explicit close control should — the user acted on the picker, so focus
   * belongs on the thing that opened it.
   */
  const closeFromPanel = React.useCallback((): void => {
    setOpen(false);
    trigger?.focus({ preventScroll: true });
  }, [setOpen, trigger]);

  const formatRef = React.useRef(format);
  React.useEffect(() => {
    formatRef.current = format;
  });

  useTransientColor(store, (c: Hsva) => {
    trigger?.style.setProperty('--cp-trigger-color', toRgbaString(c));
    const hidden = hiddenRef.current;
    // Through the native setter, so React's value tracker does not swallow it
    // and the surrounding form's onChange actually fires.
    if (hidden !== null) setNativeValue(hidden, toFormat(c, formatRef.current));
  });

  useFormReset(hiddenRef, () => {
    const parsed = typeof defaultValue === 'string' ? parse(defaultValue) : defaultValue;
    if (parsed !== null && parsed !== undefined) store.ingest(parsed);
  });

  useConstraintValidation(hiddenRef, {
    behavior: validationBehavior,
    required,
    isEmpty: false, // A colour picker always holds a colour.
    focusTrigger: () => trigger?.focus(),
  });

  const seed = store.get();

  return (
    <>
      <button
        ref={setTrigger}
        type="button"
        id={id ?? triggerId}
        className={cx('cp-trigger', classNames.trigger, triggerClassName, className)}
        style={{ ['--cp-trigger-color' as string]: toRgbaString(seed) } as React.CSSProperties}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-readonly={readOnly || undefined}
        disabled={disabled}
        onClick={() => { if (!readOnly) setOpen(!isOpen); }}
      />

      {/* A visually hidden REAL input, not type="hidden".
          The spec bars `readonly` and `required` on hidden inputs and excludes
          them from constraint validation entirely, so they can support none of
          the behaviour below. Clipped rather than display:none, which would
          remove it from the accessibility tree and break Safari autofill. */}
      {name !== undefined && (
        <input
          ref={hiddenRef}
          type="text"
          name={name}
          form={form}
          defaultValue={toFormat(seed, format)}
          // A disabled control is skipped when the form data set is built,
          // which is what stops it submitting. A read-only one still submits.
          disabled={disabled}
          required={required}
          readOnly={readOnly}
          autoComplete={autoComplete}
          tabIndex={-1}
          aria-hidden="true"
          style={visuallyHiddenInput}
          onChange={() => {}}
        />
      )}

      <Popover
        anchor={trigger}
        open={isOpen}
        onClose={() => setOpen(false)}
        className={classNames.popover}
      >
        {/* Sits between the sheet and the panel, so it has to pass the sheet's
            height constraint through rather than absorb it. Without the class
            it defaulted to min-height: auto and refused to shrink, and at
            320x568 the footer was pushed 10px into the sheet's clipped
            region — reachable by nothing. */}
        <div className="cp-dialog" role="dialog" aria-label={ariaLabel} aria-modal="false">
          <ChromaPanel
            {...panelProps}
            store={store}
            value={value}
            defaultValue={defaultValue}
            format={format}
            disabled={disabled || readOnly}
            classNames={classNames}
            mode={activeMode}
            onModeChange={handleModeChange}
            // Closing keeps the colour: the store lives in this component and
            // outlives the popover, so nothing is reverted or discarded.
            onClose={closeFromPanel}
          />
        </div>
      </Popover>
    </>
  );
}
