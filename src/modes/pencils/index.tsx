'use client';

import * as React from 'react';
import { usePanel } from '../../core/context';
import { PENCIL_COLUMNS, defaultPencils } from '../../data/defaults';
import { PencilsIcon } from '../../primitives/icons';
import { SwatchGrid } from '../../primitives/SwatchGrid';
import type { PickerMode } from '../registry';

export function PencilsPanel(): React.ReactElement {
  const { options } = usePanel();
  // Same reasoning as the palettes mode: the fallback lives with the mode
  // that needs it, not in the shared shell.
  const swatches = React.useMemo(
    () => (options.pencils ?? defaultPencils()).map((color) => ({ color })),
    [options.pencils],
  );

  if (swatches.length === 0) {
    return <p className="cp-empty">No pencils configured.</p>;
  }

  return (
    <div className="cp-panel">
      {/* Gapless mosaic, as the iOS grid is drawn. The column count must match
          the generated data or the hue ramp wraps mid-row and neighbouring
          cells end up nearly identical. */}
      <SwatchGrid
        swatches={swatches}
        label="Pencils"
        columns={PENCIL_COLUMNS}
        variant="mosaic"
      />
    </div>
  );
}

export const pencilsMode: PickerMode = {
  id: 'pencils',
  label: 'Pencils',
  icon: PencilsIcon,
  Panel: PencilsPanel,
};
