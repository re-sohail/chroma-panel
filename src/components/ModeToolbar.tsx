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
      className={cx('cp-toolbar', classNames.toolbar)}
      tabClassName={cx(classNames.tab)}
    />
  );
}
