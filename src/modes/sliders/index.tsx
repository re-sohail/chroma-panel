'use client';

import * as React from 'react';
import { hsvaToRgba, rgbaToHsva } from '../../color/convert';
import { ingest } from '../../color/sticky';
import type { Hsva } from '../../color/types';
import { usePanel } from '../../core/context';
import { useStyleChunk } from '../../core/useStyleChunk';
import { ChannelSlider } from '../../primitives/ChannelSlider';
import { ColorField } from '../../primitives/ColorField';
import { SlidersIcon } from '../../primitives/icons';
import {
  alphaTrack, blueTrack, brightnessTrack, greenTrack, redTrack, saturationTrack,
} from '../gradients';
import { valuesCss } from '../../styles/css';
import type { PickerMode } from '../registry';

function writeRgb(key: 'r' | 'g' | 'b') {
  return (value: number, current: Hsva): Hsva => {
    const rgba = hsvaToRgba(current);
    return ingest(rgbaToHsva({ ...rgba, [key]: value }), current);
  };
}

function readRgb(key: 'r' | 'g' | 'b') {
  return (c: Hsva): number => Math.round(hsvaToRgba(c)[key]);
}

export function SlidersPanel(): React.ReactElement {
  const { options } = usePanel();
  const panelRef = React.useRef<HTMLDivElement>(null);
  useStyleChunk(valuesCss, 'values', panelRef, options.injectStyles !== false);

  return (
    <div ref={panelRef} className="cp-panel cp-values">
      <ChannelSlider label="Hue" shortLabel="H" min={0} max={360} showValue unit="°"
        read={(c) => Math.round(c.h)} write={(h, c) => ({ ...c, h })}
        channel="hue" formatValue={(v) => `${Math.round(v)} degrees`} />
      <ChannelSlider label="Saturation" shortLabel="S" min={0} max={100} showValue unit="%"
        read={(c) => Math.round(c.s)} write={(s, c) => ({ ...c, s })}
        gradient={saturationTrack} channel="saturation" />
      <ChannelSlider label="Brightness" shortLabel="B" min={0} max={100} showValue unit="%"
        read={(c) => Math.round(c.v)} write={(v, c) => ({ ...c, v })}
        gradient={brightnessTrack} channel="brightness" />
      <ChannelSlider label="Red" shortLabel="R" min={0} max={255} showValue
        read={readRgb('r')} write={writeRgb('r')} gradient={redTrack} channel="red" />
      <ChannelSlider label="Green" shortLabel="G" min={0} max={255} showValue
        read={readRgb('g')} write={writeRgb('g')} gradient={greenTrack} channel="green" />
      <ChannelSlider label="Blue" shortLabel="B" min={0} max={255} showValue
        read={readRgb('b')} write={writeRgb('b')} gradient={blueTrack} channel="blue" />
      {options.showAlpha && (
        <ChannelSlider label="Opacity" shortLabel="A" min={0} max={100} showValue unit="%"
          read={(c) => Math.round(c.a * 100)} write={(v, c) => ({ ...c, a: v / 100 })}
          gradient={alphaTrack} channel="alpha" formatValue={(v) => `${Math.round(v)} percent`} />
      )}
      <ColorField label="Hexadecimal" withAlpha={options.showAlpha} className="cp-field-inline" />
    </div>
  );
}

export const slidersMode: PickerMode = {
  id: 'sliders',
  label: 'Channel values',
  tabLabel: 'Value',
  icon: SlidersIcon,
  Panel: SlidersPanel,
};
