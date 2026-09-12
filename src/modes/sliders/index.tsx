'use client';

import * as React from 'react';
import { hslaToHsva, hsvaToHsla, hsvaToRgba, rgbaToHsva } from '../../color/convert';
import { ingest } from '../../color/sticky';
import type { Hsva } from '../../color/types';
import { usePanel } from '../../core/context';
import { ChannelSlider } from '../../primitives/ChannelSlider';
import { ColorField } from '../../primitives/ColorField';
import { NumberField } from '../../primitives/NumberField';
import { SlidersIcon } from '../../primitives/icons';
import { SegmentedControl } from '../../primitives/SegmentedControl';
import {
  alphaTrack, blueTrack, brightnessTrack, greenTrack,
  lightnessTrack, redTrack, saturationTrack,
} from '../gradients';
import type { PickerMode } from '../registry';

type Model = 'rgb' | 'hsl' | 'hsb';

const MODELS = [
  { id: 'rgb', label: 'RGB', content: 'RGB' },
  { id: 'hsl', label: 'HSL', content: 'HSL' },
  { id: 'hsb', label: 'HSB', content: 'HSB' },
];

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
  const [model, setModel] = React.useState<Model>('rgb');

  const alpha = options.showAlpha ? (
    <ChannelSlider
      label="Opacity" shortLabel="A" min={0} max={100}
      read={(c) => c.a * 100}
      write={(v, c) => ({ ...c, a: v / 100 })}
      gradient={alphaTrack} channel="alpha"
      formatValue={(v) => `${Math.round(v)} percent`}
    />
  ) : null;

  return (
    <div className="cp-panel">
      <SegmentedControl
        size="sm"
        ariaLabel="Colour model"
        items={MODELS}
        value={model}
        onChange={(id) => setModel(id as Model)}
      />

      {model === 'rgb' && (
        <>
          <ChannelSlider label="Red" shortLabel="R" min={0} max={255}
            read={readRgb('r')} write={writeRgb('r')} gradient={redTrack} channel="red" />
          <ChannelSlider label="Green" shortLabel="G" min={0} max={255}
            read={readRgb('g')} write={writeRgb('g')} gradient={greenTrack} channel="green" />
          <ChannelSlider label="Blue" shortLabel="B" min={0} max={255}
            read={readRgb('b')} write={writeRgb('b')} gradient={blueTrack} channel="blue" />
          {alpha}
          <div className="cp-fields">
            <NumberField label="R" min={0} max={255} read={readRgb('r')} write={writeRgb('r')} />
            <NumberField label="G" min={0} max={255} read={readRgb('g')} write={writeRgb('g')} />
            <NumberField label="B" min={0} max={255} read={readRgb('b')} write={writeRgb('b')} />
          </div>
        </>
      )}

      {model === 'hsl' && (
        <>
          <ChannelSlider label="Hue" shortLabel="H" min={0} max={360}
            read={(c) => Math.round(c.h)} write={(h, c) => ({ ...c, h })}
            channel="hue" formatValue={(v) => `${Math.round(v)} degrees`} />
          <ChannelSlider label="Saturation" shortLabel="S" min={0} max={100}
            read={(c) => Math.round(hsvaToHsla(c).s)}
            write={(s, c) => ingest(hslaToHsva({ ...hsvaToHsla(c), s }), c)}
            gradient={saturationTrack} channel="saturation" />
          <ChannelSlider label="Lightness" shortLabel="L" min={0} max={100}
            read={(c) => Math.round(hsvaToHsla(c).l)}
            write={(l, c) => ingest(hslaToHsva({ ...hsvaToHsla(c), l }), c)}
            gradient={lightnessTrack} channel="lightness" />
          {alpha}
          <div className="cp-fields">
            <NumberField label="H" min={0} max={360}
              read={(c) => Math.round(c.h)} write={(h, c) => ({ ...c, h })} />
            <NumberField label="S" min={0} max={100}
              read={(c) => Math.round(hsvaToHsla(c).s)}
              write={(s, c) => ingest(hslaToHsva({ ...hsvaToHsla(c), s }), c)} />
            <NumberField label="L" min={0} max={100}
              read={(c) => Math.round(hsvaToHsla(c).l)}
              write={(l, c) => ingest(hslaToHsva({ ...hsvaToHsla(c), l }), c)} />
          </div>
        </>
      )}

      {model === 'hsb' && (
        <>
          <ChannelSlider label="Hue" shortLabel="H" min={0} max={360}
            read={(c) => Math.round(c.h)} write={(h, c) => ({ ...c, h })}
            channel="hue" formatValue={(v) => `${Math.round(v)} degrees`} />
          <ChannelSlider label="Saturation" shortLabel="S" min={0} max={100}
            read={(c) => Math.round(c.s)} write={(s, c) => ({ ...c, s })}
            gradient={saturationTrack} channel="saturation" />
          <ChannelSlider label="Brightness" shortLabel="B" min={0} max={100}
            read={(c) => Math.round(c.v)} write={(v, c) => ({ ...c, v })}
            gradient={brightnessTrack} channel="brightness" />
          {alpha}
          <div className="cp-fields">
            <NumberField label="H" min={0} max={360}
              read={(c) => Math.round(c.h)} write={(h, c) => ({ ...c, h })} />
            <NumberField label="S" min={0} max={100}
              read={(c) => Math.round(c.s)} write={(s, c) => ({ ...c, s })} />
            <NumberField label="B" min={0} max={100}
              read={(c) => Math.round(c.v)} write={(v, c) => ({ ...c, v })} />
          </div>
        </>
      )}

      <div className="cp-fields">
        <ColorField withAlpha={options.showAlpha} />
      </div>
    </div>
  );
}

export const slidersMode: PickerMode = {
  id: 'sliders',
  label: 'Sliders',
  icon: SlidersIcon,
  Panel: SlidersPanel,
};
