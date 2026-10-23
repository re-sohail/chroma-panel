'use client';

import * as React from 'react';
import { parse } from '../../color/parse';
import { usePanel } from '../../core/context';
import { useStyleChunk } from '../../core/useStyleChunk';
import { defaultPalettes } from '../../data/defaults';
import { PalettesIcon } from '../../primitives/icons';
import { SegmentedControl } from '../../primitives/SegmentedControl';
import { SwatchGrid, type SwatchEntry } from '../../primitives/SwatchGrid';
import { cardCss, paletteCss } from '../../styles/css';
import { inkFor } from '../ink';
import type { PickerMode } from '../registry';

function normalise(colors: (string | { color: string; name?: string })[]): SwatchEntry[] {
  return colors.map((entry) =>
    typeof entry === 'string' ? { color: entry } : { color: entry.color, name: entry.name },
  );
}

const VIEWS = [
  { id: 'compact', label: 'Compact', content: 'Compact' },
  { id: 'cards', label: 'Cards', content: 'Cards' },
];

export function PalettesPanel(): React.ReactElement {
  const { options, idPrefix } = usePanel();
  const [query, setQuery] = React.useState('');
  const [view, setView] = React.useState<'compact' | 'cards'>('compact');
  const panelRef = React.useRef<HTMLDivElement>(null);
  useStyleChunk(paletteCss, 'palette', panelRef, options.injectStyles !== false);
  useStyleChunk(cardCss, 'card', panelRef, options.injectStyles !== false);
  const searchId = `${idPrefix}-palette-search`;

  const groups = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (options.palettes ?? defaultPalettes())
      .map((palette) => ({
        name: palette.name,
        swatches: normalise(palette.colors)
          .filter(
            (s) =>
              needle === '' ||
              s.color.toLowerCase().includes(needle) ||
              (s.name ?? '').toLowerCase().includes(needle),
          )
          .map((s) => {
            if (view !== 'cards') return s;
            const parsed = parse(s.color);
            return { ...s, ink: parsed === null ? undefined : inkFor(parsed) };
          }),
      }))
      .filter((group) => group.swatches.length > 0);
  }, [options.palettes, query, view]);

  return (
    <div ref={panelRef} className="cp-panel">
      <SegmentedControl
        size="sm"
        ariaLabel="Palette view"
        items={VIEWS}
        value={view}
        onChange={(id) => setView(id as 'compact' | 'cards')}
      />
      <div className="cp-field cp-palette-search">
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
          <p className="cp-empty">No colors match &ldquo;{query}&rdquo;.</p>
        ) : (
          groups.map((group) => (
            <section key={group.name} className="cp-group">
              <h3 className="cp-group-title">{group.name}</h3>
              <SwatchGrid
                swatches={group.swatches}
                label={group.name}
                columns={6}
                variant={view === 'cards' ? 'cards' : 'spaced'}
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
