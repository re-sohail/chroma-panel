'use client';

import * as React from 'react';
import { usePanel } from '../../core/context';
import { defaultPalettes } from '../../data/defaults';
import { PalettesIcon } from '../../primitives/icons';
import { SwatchGrid, type SwatchEntry } from '../../primitives/SwatchGrid';
import type { PickerMode } from '../registry';

function normalise(colors: (string | { color: string; name?: string })[]): SwatchEntry[] {
  return colors.map((entry) =>
    typeof entry === 'string' ? { color: entry } : { color: entry.color, name: entry.name },
  );
}

export function PalettesPanel(): React.ReactElement {
  const { options, idPrefix } = usePanel();
  const [query, setQuery] = React.useState('');
  const searchId = `${idPrefix}-palette-search`;

  const groups = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (options.palettes ?? defaultPalettes())
      .map((palette) => ({
        name: palette.name,
        swatches: normalise(palette.colors).filter(
          (s) =>
            needle === '' ||
            s.color.toLowerCase().includes(needle) ||
            (s.name ?? '').toLowerCase().includes(needle),
        ),
      }))
      .filter((group) => group.swatches.length > 0);
  }, [options.palettes, query]);

  return (
    <div className="cp-panel">
      <div className="cp-field">
        <label className="cp-field-label" htmlFor={searchId}>Search</label>
        <input
          id={searchId}
          className="cp-input"
          type="search"
          placeholder="Name or hex"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />
      </div>

      <div className="cp-scroll">
        {groups.length === 0 ? (
          <p className="cp-empty">No colours match &ldquo;{query}&rdquo;.</p>
        ) : (
          groups.map((group) => (
            <section key={group.name} className="cp-group">
              <h3 className="cp-group-title">{group.name}</h3>
              <SwatchGrid
                swatches={group.swatches}
                label={group.name}
                columns={6}
                variant="spaced"
              />
            </section>
          ))
        )}
      </div>
    </div>
  );
}

export const palettesMode: PickerMode = {
  id: 'palettes',
  label: 'Palettes',
  icon: PalettesIcon,
  Panel: PalettesPanel,
};
