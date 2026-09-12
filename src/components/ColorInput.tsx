'use client';

import * as React from 'react';
import { parse } from '../color/parse';
import { toFormat, toRgbaString } from '../color/serialize';
import type { Hsva } from '../color/types';
import { cx, useStableId } from '../core/context';
import { createColorStore } from '../core/store';
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
    name, id, 'aria-label': ariaLabel = 'Choose a colour', triggerClassName,
    disabled = false, className, classNames = {}, format = 'hex',
    value, defaultValue = '#ffffff', store: externalStore,
    ...panelProps
  } = props;

  const triggerId = useStableId('cp-trigger-');
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
    () => createColorStore(parse(value ?? defaultValue) ?? { h: 0, s: 0, v: 100, a: 1 }),
    // Seeded once; `value` changes are handled by ChromaPanel's sync effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const store = externalStore ?? ownStore;

  const hiddenRef = React.useRef<HTMLInputElement>(null);
  const formatRef = React.useRef(format);
  React.useEffect(() => {
    formatRef.current = format;
  });

  useTransientColor(store, (c: Hsva) => {
    trigger?.style.setProperty('--cp-trigger-color', toRgbaString(c));
    const hidden = hiddenRef.current;
    if (hidden !== null) hidden.value = toFormat(c, formatRef.current);
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
        disabled={disabled}
        onClick={() => setOpen(!isOpen)}
      />

      {name !== undefined && (
        <input ref={hiddenRef} type="hidden" name={name} defaultValue={toFormat(seed, format)} />
      )}

      <Popover
        anchor={trigger}
        open={isOpen}
        onClose={() => setOpen(false)}
        className={classNames.popover}
      >
        <div role="dialog" aria-label={ariaLabel} aria-modal="false">
          <ChromaPanel
            {...panelProps}
            store={store}
            value={value}
            defaultValue={defaultValue}
            format={format}
            disabled={disabled}
            classNames={classNames}
          />
        </div>
      </Popover>
    </>
  );
}
