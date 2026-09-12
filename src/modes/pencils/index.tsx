'use client';

import * as React from 'react';
import { usePanel } from '../../core/context';
import { PencilsIcon } from '../../primitives/icons';
import { SwatchGrid } from '../../primitives/SwatchGrid';
import type { PickerMode } from '../registry';

export function PencilsPanel(): React.ReactElement {
  const { options } = usePanel();
  const swatches = React.useMemo(
    () => options.pencils.map((color) => ({ color })),
    [options.pencils],
  );

  return (
    <div className="cp-panel">
      <div className="cp-scroll">
        <SwatchGrid swatches={swatches} label="Pencils" columns={12} round />
      </div>
    </div>
  );
}

export const pencilsMode: PickerMode = {
  id: 'pencils',
  label: 'Pencils',
  icon: PencilsIcon,
  Panel: PencilsPanel,
};
