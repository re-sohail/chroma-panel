'use client';

import * as React from 'react';
import { normalizeHue } from '../../color/convert';
import { toHex, toRgbaString } from '../../color/serialize';
import type { Hsva } from '../../color/types';
import { usePanel } from '../../core/context';
import { useColorValue } from '../../core/useColorStore';
import { useScrollFade } from '../../core/useScrollFade';
import { useStyleChunk } from '../../core/useStyleChunk';
import { ChannelSlider } from '../../primitives/ChannelSlider';
import { ColorDisc } from '../../primitives/ColorDisc';
import { HarmonyIcon } from '../../primitives/icons';
import { SegmentedControl } from '../../primitives/SegmentedControl';
import { cardCss, harmonyCss } from '../../styles/css';
import { brightnessTrack } from '../gradients';
import { inkFor } from '../ink';
import type { PickerMode } from '../registry';

export type HarmonyRule = 'complementary' | 'analogous' | 'triadic' | 'split' | 'tetradic';

const RULES: { id: HarmonyRule; label: string; short: string; offsets: number[] }[] = [
  { id: 'complementary', label: 'Complementary', short: 'Complementary', offsets: [0, 180] },
  { id: 'analogous', label: 'Analogous', short: 'Analogous', offsets: [-30, 0, 30] },
  { id: 'triadic', label: 'Triadic', short: 'Triadic', offsets: [0, 120, 240] },
  { id: 'split', label: 'Split complementary', short: 'Split', offsets: [0, 150, 210] },
  { id: 'tetradic', label: 'Tetradic', short: 'Tetradic', offsets: [0, 90, 180, 270] },
];

const RULE_ITEMS = RULES.map((r) => ({ id: r.id, label: r.label, content: r.short }));

export function harmonyColors(color: Hsva, rule: HarmonyRule): { offset: number; color: Hsva }[] {
  const offsets = (RULES.find((r) => r.id === rule) ?? RULES[0]!).offsets;
  return offsets.map((offset) => ({ offset, color: { ...color, h: normalizeHue(color.h + offset) } }));
}

export interface HarmonyPanelProps {
  defaultRule?: HarmonyRule;
}

export function HarmonyPanel(props: HarmonyPanelProps): React.ReactElement {
  const { store, options, disabled } = usePanel();
  const [rule, setRule] = React.useState<HarmonyRule>(props.defaultRule ?? 'complementary');
  const color = useColorValue(store);
  const pillsRef = React.useRef<HTMLDivElement>(null);
  useScrollFade(pillsRef, rule, 'x');

  React.useEffect(() => {
    const row = pillsRef.current;
    const chip = row?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (row === null || row === undefined || chip === null || chip === undefined) return;
    row.scrollLeft = chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2;
  }, [rule]);

  const panelRef = React.useRef<HTMLDivElement>(null);
  useStyleChunk(harmonyCss, 'harmony', panelRef, options.injectStyles !== false);
  useStyleChunk(cardCss, 'card', panelRef, options.injectStyles !== false);

  const partners = harmonyColors(color, rule);
  const ruleLabel = RULES.find((r) => r.id === rule)?.label ?? rule;

  return (
    <div ref={panelRef} className="cp-panel cp-harmony">
      <ColorDisc>
        {partners.filter((p) => p.offset !== 0).map((p) => {
          const radians = (p.color.h * Math.PI) / 180;
          return (
            <span
              key={p.offset}
              className="cp-harmony-dot"
              aria-hidden="true"
              style={{
                left: `${50 + Math.sin(radians) * (p.color.s / 2)}%`,
                top: `${50 - Math.cos(radians) * (p.color.s / 2)}%`,
                ['--cp-swatch-color' as string]: toRgbaString({ ...p.color, a: 1 }),
              } as React.CSSProperties}
            />
          );
        })}
      </ColorDisc>

      <ChannelSlider
        label="Brightness"
        shortLabel="B"
        min={0}
        max={100}
        read={(c: Hsva) => c.v}
        write={(v: number, c: Hsva) => ({ ...c, v })}
        gradient={brightnessTrack}
        channel="brightness"
        formatValue={(v) => `${Math.round(v)} percent`}
      />

      <div ref={pillsRef} className="cp-pills">
        <SegmentedControl
          items={RULE_ITEMS}
          value={rule}
          onChange={(id) => setRule(id as HarmonyRule)}
          ariaLabel="Harmony rule"
          disabled={disabled}
        />
      </div>

      <ul className="cp-harmony-swatches" aria-label={`${ruleLabel} colors`}>
        {partners.map((p) => {
          const hex = toHex(p.color);
          return (
            <li key={p.offset}>
              <button
                type="button"
                className="cp-swatch"
                style={{ ['--cp-swatch-color' as string]: toRgbaString(p.color) } as React.CSSProperties}
                aria-label={p.offset === 0 ? `Current color ${hex}` : hex}
                aria-pressed={p.offset === 0}
                disabled={disabled}
                onClick={() => {
                  store.ingest(p.color, 'swatch');
                  store.commit('swatch');
                }}
              >
                <span
                  className="cp-card-name"
                  style={{ ['--cp-card-ink' as string]: inkFor(p.color) } as React.CSSProperties}
                  aria-hidden="true"
                >
                  <span className="cp-card-hex">{hex.slice(1).toUpperCase()}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export const harmonyMode: PickerMode = {
  id: 'harmony',
  label: 'Color harmony',
  tabLabel: 'Harmony',
  icon: HarmonyIcon,
  Panel: HarmonyPanel as React.ComponentType,
};
