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
import { injectStyles } from '../core/styleInjector';
import { css, STYLE_ID } from '../styles/css';
import { ChromaPanel, DEFAULT_COLOR, FALLBACK, type ChromaPanelProps } from './ChromaPanel';
import { Popover } from './Popover';

export interface ColorInputProps extends ChromaPanelProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  name?: string;
  form?: string;
  required?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  validationBehavior?: 'native' | 'aria';
  id?: string;
  'aria-label'?: string;
  triggerClassName?: string;
}

export function ColorInput(props: ColorInputProps): React.ReactElement {
  const {
    open, defaultOpen = false, onOpenChange,
    name, form, required = false, readOnly = false, autoComplete,
    validationBehavior = 'native',
    id, 'aria-label': ariaLabel = 'Choose a color', triggerClassName,
    disabled: disabledProp = false, className, classNames = {}, format = 'hex',
    value, defaultValue = DEFAULT_COLOR, store: externalStore,
    mode, defaultMode, onModeChange,
    ...panelProps
  } = props;

  const triggerId = useStableId('cp-trigger-');
  const hiddenRef = React.useRef<HTMLInputElement>(null);

  const fieldsetDisabled = useFieldsetDisabled(hiddenRef);
  const disabled = disabledProp || fieldsetDisabled;
  const [trigger, setTrigger] = React.useState<HTMLButtonElement | null>(null);

  const shouldInject = panelProps.injectStyles ?? true;
  React.useEffect(() => {
    if (shouldInject) injectStyles(css, STYLE_ID, trigger);
  }, [shouldInject, trigger]);
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isOpen = open ?? internalOpen;

  const setOpen = React.useCallback(
    (next: boolean): void => {
      if (open === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [open, onOpenChange],
  );

  const ownStore = React.useMemo(
    () => {
      const seed = value ?? defaultValue;
      const parsed = typeof seed === 'string' ? parse(seed) : seed;
      return createColorStore(parsed ?? FALLBACK);
    },
    [],
  );
  const store = externalStore ?? ownStore;

  const [internalMode, setInternalMode] = React.useState<string | undefined>(defaultMode);
  const activeMode = mode ?? internalMode;

  const handleModeChange = React.useCallback(
    (next: string): void => {
      if (mode === undefined) setInternalMode(next);
      onModeChange?.(next);
    },
    [mode, onModeChange],
  );

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
    if (hidden !== null) setNativeValue(hidden, toFormat(c, formatRef.current));
  });

  useFormReset(hiddenRef, () => {
    const parsed = typeof defaultValue === 'string' ? parse(defaultValue) : defaultValue;
    if (parsed !== null && parsed !== undefined) store.ingest(parsed, 'programmatic');
  });

  useConstraintValidation(hiddenRef, {
    behavior: validationBehavior,
    required,
    isEmpty: false, // A color picker always holds a color.
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

      {name !== undefined && (
        <input
          ref={hiddenRef}
          type="text"
          name={name}
          form={form}
          defaultValue={toFormat(seed, format)}
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
            onClose={closeFromPanel}
          />
        </div>
      </Popover>
    </>
  );
}
