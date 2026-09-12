'use client';

import * as React from 'react';
import { cx, usePanel } from '../core/context';
import type { PickerMode } from '../modes/registry';
import { SegmentedControl, type SegmentedItem } from '../primitives/SegmentedControl';

export interface ModeToolbarProps {
  modes: PickerMode[];
  activeId: string;
  onSelect: (id: string) => void;
}

/** The mode switcher. */
export function ModeToolbar(props: ModeToolbarProps): React.ReactElement {
  const { modes, activeId, onSelect } = props;
  const { classNames, idPrefix, disabled } = usePanel();

  const items = React.useMemo<SegmentedItem[]>(
    () =>
      modes.map((mode) => {
        const Icon = mode.icon;
        return { id: mode.id, label: mode.label, content: <Icon /> };
      }),
    [modes],
  );

  return (
    <SegmentedControl
      items={items}
      value={activeId}
      onChange={onSelect}
      ariaLabel="Picker mode"
      disabled={disabled}
      segmentId={(id) => `${idPrefix}-tab-${id}`}
      controls={(id) => `${idPrefix}-panel-${id}`}
      // `cp-toolbar` is retained alongside `cp-seg`: the prefixed class names
      // are documented as a stable override hook, so dropping one is a
      // breaking change for anyone already styling it.
      className={cx('cp-toolbar', classNames.toolbar)}
      tabClassName={cx(classNames.tab)}
    />
  );
}
