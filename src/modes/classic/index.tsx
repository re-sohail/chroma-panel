'use client';

import * as React from 'react';
import type { Hsva } from '../../color/types';
import { usePanel } from '../../core/context';
import { ChannelSlider } from '../../primitives/ChannelSlider';
import { ColorArea } from '../../primitives/ColorArea';
import { ColorField } from '../../primitives/ColorField';
import { ClassicIcon } from '../../primitives/icons';
import { alphaTrack } from '../gradients';
import type { PickerMode } from '../registry';

export function ClassicPanel(): React.ReactElement {
  const { options } = usePanel();

  return (
    <div className="cp-panel">
      <ColorArea />
      <ChannelSlider
        label="Hue"
        shortLabel="H"
        min={0}
        max={360}
        read={(c: Hsva) => c.h}
        write={(h: number, c: Hsva) => ({ ...c, h })}
        channel="hue"
        formatValue={(v) => `${Math.round(v)} degrees`}
      />
      {options.showAlpha && (
        <ChannelSlider
          label="Opacity"
          shortLabel="A"
          min={0}
          max={100}
          read={(c: Hsva) => c.a * 100}
          write={(v: number, c: Hsva) => ({ ...c, a: v / 100 })}
          gradient={alphaTrack}
          channel="alpha"
          formatValue={(v) => `${Math.round(v)} percent`}
        />
      )}
      <ColorField withAlpha={options.showAlpha} className="cp-field-inline" />
    </div>
  );
}

export const classicMode: PickerMode = {
  id: 'classic',
  label: 'Classic picker',
  tabLabel: 'Classic',
  icon: ClassicIcon,
  Panel: ClassicPanel,
};
